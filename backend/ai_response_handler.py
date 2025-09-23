#!/usr/bin/env python3
"""
AI Response Handler for Tenant Selection System
Handles sending AI-generated responses to tenant inquiries
"""

import json
import boto3
import psycopg2
from psycopg2.extras import RealDictCursor
from openai import OpenAI
import time
import random
import logging
from datetime import datetime, timedelta
from typing import Dict, Optional, List

# Set up logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)
import uuid
import os

# AWS clients
ses_client = boto3.client('ses', region_name='us-east-1')
ssm_client = boto3.client('ssm', region_name='us-east-1')
s3_client = boto3.client('s3')

def get_db_params():
    """Get database parameters from SSM"""
    params = {}
    response = ssm_client.get_parameters_by_path(
        Path='/homeai/db/',
        Recursive=True,
        WithDecryption=True
    )
    
    for param in response['Parameters']:
        key = param['Name'].split('/')[-1]
        params[key] = param['Value']
    
    return params

def get_db_connection(params):
    """Create database connection"""
    return psycopg2.connect(
        host=params['host'],
        database=params.get('name', 'homeai_db'),
        user=params['user'],
        password=params['password'],
        port=params.get('port', 5432)
    )

def get_landlord_instructions(property_id: int, params: Dict) -> Dict:
    """Fetch landlord AI instructions and knowledge base"""
    conn = get_db_connection(params)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Get AI instructions and settings
        cur.execute("""
            SELECT 
                ai_instructions,
                ai_knowledge_base,
                response_templates,
                ai_response_settings
            FROM tenant_selection_configs
            WHERE property_id = %s
        """, (property_id,))
        
        config = cur.fetchone()
        
        # Get knowledge documents
        cur.execute("""
            SELECT 
                document_name,
                document_type,
                content,
                metadata
            FROM property_knowledge_documents
            WHERE property_id = %s AND is_active = true
        """, (property_id,))
        
        documents = cur.fetchall()
        
        return {
            'instructions': config.get('ai_instructions') if config else None,
            'knowledge_base': config.get('ai_knowledge_base', {}) if config else {},
            'templates': config.get('response_templates', {}) if config else {},
            'settings': config.get('ai_response_settings', {}) if config else {},
            'documents': documents or []
        }
        
    finally:
        cur.close()
        conn.close()

def generate_ai_response(
    inquiry_type: str,
    inquiry_content: str,
    applicant_data: Dict,
    property_id: int,
    landlord_config: Dict,
    params: Dict
) -> str:
    """Generate AI response using OpenAI GPT-5 with landlord instructions"""
    
    # Get OpenAI API key for GPT-5
    api_key = params.get('OPENAI_API_KEY')
    if not api_key:
        api_key = ssm_client.get_parameter(
            Name='/homeai/prod/OPENAI_API_KEY',
            WithDecryption=True
        )['Parameter']['Value']
    
    client = OpenAI(api_key=api_key)
    
    # Build context from landlord config
    context_parts = []
    
    # Add custom instructions
    if landlord_config['instructions']:
        context_parts.append(f"LANDLORD INSTRUCTIONS:\n{landlord_config['instructions']}")
    
    # Add knowledge base
    if landlord_config['knowledge_base']:
        context_parts.append(f"PROPERTY INFORMATION:\n{json.dumps(landlord_config['knowledge_base'], indent=2)}")
    
    # Add relevant documents
    for doc in landlord_config['documents']:
        if doc['document_type'] in ['faq', 'rules', 'amenities']:
            context_parts.append(f"\n{doc['document_name'].upper()}:\n{doc['content']}")
    
    # Check for template
    template = landlord_config['templates'].get(inquiry_type)
    
    # Build prompt
    system_prompt = f"""You are an AI assistant helping a landlord respond to tenant inquiries for property {property_id}.
    
{chr(10).join(context_parts)}

RESPONSE GUIDELINES:
- Be professional, helpful, and accurate
- Use the provided information to answer questions
- Don't make up information not provided
- Maintain privacy of other applicants
- Follow the landlord's specific instructions
- If asked about viewing slots, check the availability mentioned
- For document requests, list the required documents from the configuration

{f"Use this template as a base: {template}" if template else ""}
"""

    user_prompt = f"""
Inquiry Type: {inquiry_type}
Applicant Name: {applicant_data.get('name', 'Applicant')}
Inquiry: {inquiry_content}

Please draft an appropriate response email.
"""

    # Use GPT-5 responses API with proper error handling
    try:
        response = client.responses.create(
            input=f"{system_prompt}\n\n{user_prompt}\n\nReturn a professional email response.",
            model="gpt-5",
            reasoning={
                "effort": "minimal",  # minimal for faster responses
                "summary": "auto"
            },
            text={
                "verbosity": "medium"  # medium for balanced responses
            }
        )
        
        # Extract content from GPT-5 response
        if hasattr(response, 'output'):
            if isinstance(response.output, list) and len(response.output) > 0:
                # Handle list of outputs
                content = response.output[-1].content if hasattr(response.output[-1], 'content') else str(response.output[-1])
            else:
                content = str(response.output)
        else:
            content = response.model_dump_json() if hasattr(response, 'model_dump_json') else str(response)
            
    except Exception as e:
        logger.error(f"GPT-5 API error: {e}")
        # Fallback response
        content = f"""Thank you for your inquiry about property {property_id}.
        
We have received your message and will respond within 24 hours.
        
Best regards,
Property Management Team
        
Reference: {property_id}-{datetime.now().strftime('%Y%m%d%H%M%S')}"""
    
    return content

def send_email_response(
    recipient_email: str,
    subject: str,
    body: str,
    property_id: int,
    response_id: str
) -> bool:
    """Send email response via SES"""
    
    try:
        response = ses_client.send_email(
            Source='noreply@homeai.ch',
            Destination={'ToAddresses': [recipient_email]},
            Message={
                'Subject': {'Data': subject},
                'Body': {
                    'Text': {'Data': body},
                    'Html': {'Data': f"<html><body>{body.replace(chr(10), '<br>')}</body></html>"}
                }
            },
            ReplyToAddresses=[f'listing-{property_id}@listings.homeai.ch'],
            Tags=[
                {'Name': 'property_id', 'Value': str(property_id)},
                {'Name': 'response_id', 'Value': response_id},
                {'Name': 'type', 'Value': 'ai_response'}
            ]
        )
        
        return True
        
    except Exception as e:
        print(f"Error sending email: {e}")
        return False

def process_response_queue(event, context):
    """Lambda handler for processing AI response queue"""
    
    params = get_db_params()
    conn = get_db_connection(params)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    processed = 0
    errors = 0
    
    try:
        # Get pending responses to send
        cur.execute("""
            SELECT 
                r.*,
                l.applicant_data,
                l.property_id
            FROM ai_response_queue r
            JOIN applicant_leads l ON r.lead_id = l.id
            WHERE r.status = 'pending'
            AND (r.scheduled_for IS NULL OR r.scheduled_for <= NOW())
            ORDER BY r.created_at
            LIMIT 10
        """)
        
        responses = cur.fetchall()
        
        for response_item in responses:
            try:
                # Get landlord configuration
                landlord_config = get_landlord_instructions(
                    response_item['property_id'], 
                    params
                )
                
                # Check business hours if configured
                settings = landlord_config['settings']
                if settings.get('business_hours_only'):
                    hour = datetime.now().hour
                    if hour < 9 or hour > 18:
                        # Skip outside business hours
                        continue
                
                # Generate AI response if not already generated
                if not response_item['response_content']:
                    response_content = generate_ai_response(
                        inquiry_type=response_item['response_type'],
                        inquiry_content=response_item.get('metadata', {}).get('inquiry', ''),
                        applicant_data=response_item['applicant_data'],
                        property_id=response_item['property_id'],
                        landlord_config=landlord_config,
                        params=params
                    )
                    
                    # Update with generated content
                    cur.execute("""
                        UPDATE ai_response_queue
                        SET response_content = %s
                        WHERE id = %s
                    """, (response_content, response_item['id']))
                else:
                    response_content = response_item['response_content']
                
                # Determine subject
                subject_map = {
                    'viewing_invite': f"Viewing Invitation - Property {response_item['property_id']}",
                    'answer_question': f"Re: Your Inquiry - Property {response_item['property_id']}",
                    'document_request': f"Document Requirements - Property {response_item['property_id']}",
                    'application_received': f"Application Received - Property {response_item['property_id']}",
                    'follow_up': f"Follow-up - Property {response_item['property_id']}"
                }
                
                subject = subject_map.get(
                    response_item['response_type'],
                    f"Property {response_item['property_id']} - Response"
                )
                
                # Send email
                success = send_email_response(
                    recipient_email=response_item['recipient_email'],
                    subject=subject,
                    body=response_content,
                    property_id=response_item['property_id'],
                    response_id=str(response_item['id'])
                )
                
                if success:
                    # Mark as sent
                    cur.execute("""
                        UPDATE ai_response_queue
                        SET status = 'sent',
                            sent_at = NOW()
                        WHERE id = %s
                    """, (response_item['id'],))
                    
                    # Update conversation
                    cur.execute("""
                        UPDATE email_conversations
                        SET ai_response_sent = true
                        WHERE response_id = %s
                    """, (response_item['id'],))
                    
                    processed += 1
                else:
                    # Mark as failed
                    cur.execute("""
                        UPDATE ai_response_queue
                        SET status = 'failed',
                            retry_count = retry_count + 1,
                            error_message = 'Email send failed'
                        WHERE id = %s
                    """, (response_item['id'],))
                    
                    errors += 1
                
                conn.commit()
                
                # Add delay between emails
                delay = random.uniform(
                    settings.get('response_delay_min', 120),
                    settings.get('response_delay_max', 300)
                )
                time.sleep(min(delay / 60, 5))  # Max 5 seconds in Lambda
                
            except Exception as e:
                print(f"Error processing response {response_item['id']}: {e}")
                
                cur.execute("""
                    UPDATE ai_response_queue
                    SET status = 'failed',
                        retry_count = retry_count + 1,
                        error_message = %s
                    WHERE id = %s
                """, (str(e), response_item['id']))
                
                conn.commit()
                errors += 1
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'processed': processed,
                'errors': errors,
                'total': len(responses)
            })
        }
        
    finally:
        cur.close()
        conn.close()

# Lambda handler
def lambda_handler(event, context):
    return process_response_queue(event, context)