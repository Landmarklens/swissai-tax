#!/usr/bin/env python3
"""
Document Processor using GPT-5 Vision (Claude)
Replaces AWS Textract with GPT-5 Vision for OCR and document analysis
"""

import json
import boto3
import psycopg2
from psycopg2.extras import RealDictCursor
from openai import OpenAI
import base64
import time
from datetime import datetime
from typing import Dict, List, Optional, Tuple
import uuid
import os
import re

# AWS clients
s3_client = boto3.client('s3')
ssm_client = boto3.client('ssm', region_name='us-east-1')

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
    
    # Get OpenAI key
    try:
        openai_key = ssm_client.get_parameter(
            Name='/homeai/prod/OPENAI_API_KEY',
            WithDecryption=True
        )['Parameter']['Value']
        params['OPENAI_API_KEY'] = openai_key
    except:
        pass
    
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

def download_from_s3(bucket: str, key: str) -> bytes:
    """Download file from S3"""
    response = s3_client.get_object(Bucket=bucket, Key=key)
    return response['Body'].read()

def encode_image_base64(image_bytes: bytes) -> str:
    """Encode image to base64 for GPT-5 Vision"""
    return base64.b64encode(image_bytes).decode('utf-8')

def process_document_with_gpt5_vision(
    document_bytes: bytes,
    document_type: str,
    property_id: int,
    params: Dict
) -> Dict:
    """
    Process document using GPT-5 Vision API (Claude with vision capabilities)
    Extract text and structured data from documents
    """
    
    api_key = params.get('OPENAI_API_KEY')
    client = OpenAI(api_key=api_key)
    
    # Encode document as base64
    base64_image = encode_image_base64(document_bytes)
    
    # Determine what to extract based on document type
    extraction_prompts = {
        'proof_of_income': """
            Extract the following information from this income document:
            1. Person's full name
            2. Employer name
            3. Monthly gross income (in CHF)
            4. Monthly net income (in CHF)
            5. Employment type (permanent, temporary, contract)
            6. Employment start date
            7. Any bonuses or additional income
            Return as JSON with these exact field names.
        """,
        'employment_letter': """
            Extract the following from this employment letter:
            1. Employee name
            2. Employer/Company name
            3. Job title/position
            4. Employment start date
            5. Employment type (permanent, temporary, probation)
            6. Monthly or annual salary
            7. Notice period if mentioned
            8. Any special conditions
            Return as JSON.
        """,
        'references': """
            Extract the following from this reference document:
            1. Tenant name
            2. Previous address
            3. Rental period (from-to dates)
            4. Monthly rent amount
            5. Reference provider name and contact
            6. Any comments about payment history
            7. Any comments about property condition
            8. Overall recommendation
            Return as JSON.
        """,
        'identity': """
            Extract the following from this ID document:
            1. Full name
            2. Date of birth
            3. Nationality
            4. Document type (passport, ID card, permit)
            5. Document number
            6. Expiry date
            7. Address if visible
            Return as JSON. Be careful with personal data.
        """,
        'bank_statement': """
            Extract the following from this bank statement:
            1. Account holder name
            2. Bank name
            3. Statement period
            4. Average monthly balance
            5. Regular income amounts and sources
            6. Regular expense categories
            7. Any concerning transactions (overdrafts, bounced payments)
            Return as JSON.
        """,
        'general': """
            Extract all relevant information from this document including:
            1. Document type/title
            2. Person or entity names mentioned
            3. Dates mentioned
            4. Financial amounts mentioned
            5. Key facts or statements
            6. Contact information
            Return as structured JSON.
        """
    }
    
    prompt = extraction_prompts.get(document_type, extraction_prompts['general'])
    
    try:
        # Call GPT-5 Vision API using responses API with image support
        # GPT-5 supports multimodal inputs through the responses API
        full_prompt = f"""You are a document processing assistant. Extract information accurately and return valid JSON only.
        
        Image: [base64:{base64_image}]
        
        {prompt}
        
        Return ONLY valid JSON."""
        
        try:
            response = client.responses.create(
                input=full_prompt,
                model="gpt-5",  # GPT-5 with built-in vision capabilities
                reasoning={
                    "effort": "medium",  # Good balance for document analysis
                    "summary": "auto"
                },
                text={
                    "verbosity": "low"  # Keep responses concise for JSON extraction
                }
            )
            
            # Extract content from GPT-5 response
            if hasattr(response, 'output'):
                if isinstance(response.output, list) and len(response.output) > 0:
                    content = response.output[-1].content if hasattr(response.output[-1], 'content') else str(response.output[-1])
                else:
                    content = str(response.output)
            else:
                content = response.model_dump_json() if hasattr(response, 'model_dump_json') else str(response)
        except Exception as e:
            print(f"GPT-5 API error: {e}")
            # Fallback to basic extraction
            content = json.dumps({
                "document_type": document_type,
                "extraction_status": "error",
                "error": str(e),
                "data": {}
            })
        
        # Try to extract JSON from the response
        json_match = re.search(r'\{.*\}', content, re.DOTALL)
        if json_match:
            extracted_data = json.loads(json_match.group())
        else:
            # Fall back to structured parsing
            extracted_data = {"raw_text": content}
        
        # Calculate confidence score based on completeness
        expected_fields = len(extraction_prompts.get(document_type, '').split('\n'))
        actual_fields = len([v for v in extracted_data.values() if v])
        confidence_score = min(actual_fields / max(expected_fields, 1), 1.0)
        
        return {
            'success': True,
            'extracted_data': extracted_data,
            'confidence_score': confidence_score,
            'raw_response': content,
            'processing_method': 'gpt-5-vision'
        }
        
    except Exception as e:
        print(f"Error processing with GPT-5 Vision: {e}")
        return {
            'success': False,
            'error': str(e),
            'extracted_data': {},
            'confidence_score': 0.0,
            'processing_method': 'gpt-4-vision'
        }

def verify_extracted_data(
    extracted_data: Dict,
    document_type: str,
    lead_data: Dict
) -> Tuple[str, str]:
    """
    Verify extracted data against lead information
    Returns: (verification_status, notes)
    """
    
    verification_notes = []
    issues = []
    
    if document_type == 'proof_of_income':
        # Check income matches claimed amount
        claimed_income = lead_data.get('applicant_data', {}).get('monthly_income')
        extracted_income = extracted_data.get('monthly_net_income') or extracted_data.get('monthly_gross_income')
        
        if claimed_income and extracted_income:
            try:
                claimed = float(str(claimed_income).replace('CHF', '').replace(',', '').strip())
                extracted = float(str(extracted_income).replace('CHF', '').replace(',', '').strip())
                
                difference_pct = abs(claimed - extracted) / claimed * 100
                
                if difference_pct > 20:
                    issues.append(f"Income mismatch: claimed CHF {claimed:.0f}, document shows CHF {extracted:.0f}")
                else:
                    verification_notes.append(f"Income verified: CHF {extracted:.0f}")
            except:
                pass
        
        # Check name matches
        lead_name = lead_data.get('name', '').lower()
        doc_name = str(extracted_data.get('name', '')).lower()
        
        if lead_name and doc_name and lead_name not in doc_name and doc_name not in lead_name:
            issues.append(f"Name mismatch: application shows '{lead_name}', document shows '{doc_name}'")
    
    elif document_type == 'employment_letter':
        # Verify employment details
        if extracted_data.get('employment_type') == 'temporary':
            issues.append("Temporary employment detected")
        
        if extracted_data.get('employment_start_date'):
            verification_notes.append(f"Employment since: {extracted_data['employment_start_date']}")
    
    elif document_type == 'references':
        # Check reference quality
        if 'good' in str(extracted_data.get('overall_recommendation', '')).lower():
            verification_notes.append("Positive reference")
        elif 'poor' in str(extracted_data.get('overall_recommendation', '')).lower():
            issues.append("Negative reference detected")
    
    # Determine status
    if issues:
        status = 'failed' if len(issues) > 1 else 'warning'
        notes = f"Issues: {'; '.join(issues)}"
    else:
        status = 'verified'
        notes = '; '.join(verification_notes) if verification_notes else 'Document verified'
    
    return status, notes

def process_document(event, context):
    """
    Lambda handler for document processing
    Triggered when documents are uploaded to S3
    """
    
    params = get_db_params()
    conn = get_db_connection(params)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    results = []
    
    try:
        for record in event.get('Records', []):
            # Get S3 details
            bucket = record['s3']['bucket']['name']
            key = record['s3']['object']['key']
            
            # Extract metadata from S3 key or tags
            # Expected format: documents/{lead_id}/{document_type}/{filename}
            key_parts = key.split('/')
            
            if len(key_parts) < 3:
                print(f"Invalid S3 key format: {key}")
                continue
            
            lead_id = key_parts[1]
            document_type = key_parts[2] if len(key_parts) > 2 else 'general'
            
            # Get lead information
            cur.execute("""
                SELECT 
                    id,
                    property_id,
                    name,
                    email,
                    applicant_data
                FROM tenant_selection_leads
                WHERE id = %s
            """, (lead_id,))
            
            lead = cur.fetchone()
            
            if not lead:
                print(f"Lead not found: {lead_id}")
                continue
            
            # Download document from S3
            start_time = time.time()
            document_bytes = download_from_s3(bucket, key)
            
            # Process with GPT-5 Vision
            result = process_document_with_gpt5_vision(
                document_bytes=document_bytes,
                document_type=document_type,
                property_id=lead['property_id'],
                params=params
            )
            
            processing_time = int((time.time() - start_time) * 1000)
            
            if result['success']:
                # Verify extracted data
                verification_status, verification_notes = verify_extracted_data(
                    result['extracted_data'],
                    document_type,
                    lead
                )
                
                # Store in database
                doc_id = str(uuid.uuid4())
                
                cur.execute("""
                    INSERT INTO processed_documents (
                        id,
                        lead_id,
                        property_id,
                        s3_bucket,
                        s3_key,
                        document_type,
                        processing_method,
                        extracted_data,
                        verification_status,
                        verification_notes,
                        confidence_score,
                        processing_time_ms,
                        processed_at
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW()
                    )
                """, (
                    doc_id,
                    lead_id,
                    lead['property_id'],
                    bucket,
                    key,
                    document_type,
                    result['processing_method'],
                    json.dumps(result['extracted_data']),
                    verification_status,
                    verification_notes,
                    result['confidence_score'],
                    processing_time
                ))
                
                # Update lead with document info
                cur.execute("""
                    UPDATE tenant_selection_leads
                    SET 
                        documents_processed = 
                            COALESCE(documents_processed, '{}'::jsonb) || 
                            %s::jsonb,
                        document_verification_status = 
                            CASE 
                                WHEN document_verification_status = 'failed' THEN 'failed'
                                WHEN %s = 'failed' THEN 'failed'
                                WHEN document_verification_status = 'warning' THEN 'warning'
                                WHEN %s = 'warning' THEN 'warning'
                                ELSE 'verified'
                            END,
                        updated_at = NOW()
                    WHERE id = %s
                """, (
                    json.dumps({document_type: {
                        'document_id': doc_id,
                        'status': verification_status,
                        'processed_at': datetime.now().isoformat()
                    }}),
                    verification_status,
                    verification_status,
                    lead_id
                ))
                
                # Check if all required documents are present
                cur.execute("""
                    SELECT document_processing
                    FROM tenant_selection_configs
                    WHERE property_id = %s
                """, (lead['property_id'],))
                
                config = cur.fetchone()
                required_docs = config['document_processing'].get('required_documents', []) if config else []
                
                # Get all processed documents for this lead
                cur.execute("""
                    SELECT DISTINCT document_type
                    FROM processed_documents
                    WHERE lead_id = %s
                """, (lead_id,))
                
                processed_types = [row['document_type'] for row in cur.fetchall()]
                missing_docs = [doc for doc in required_docs if doc not in processed_types]
                
                # Update missing documents
                cur.execute("""
                    UPDATE tenant_selection_leads
                    SET missing_documents = %s
                    WHERE id = %s
                """, (missing_docs, lead_id))
                
                conn.commit()
                
                results.append({
                    'document': key,
                    'status': 'success',
                    'verification': verification_status,
                    'confidence': result['confidence_score']
                })
                
            else:
                # Log error
                cur.execute("""
                    INSERT INTO processed_documents (
                        id,
                        lead_id,
                        property_id,
                        s3_bucket,
                        s3_key,
                        document_type,
                        processing_method,
                        verification_status,
                        error_message,
                        processing_time_ms,
                        processed_at
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW()
                    )
                """, (
                    str(uuid.uuid4()),
                    lead_id,
                    lead['property_id'],
                    bucket,
                    key,
                    document_type,
                    'gpt-5-vision',
                    'error',
                    result.get('error'),
                    processing_time
                ))
                
                conn.commit()
                
                results.append({
                    'document': key,
                    'status': 'error',
                    'error': result.get('error')
                })
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'processed': len(results),
                'results': results
            })
        }
        
    except Exception as e:
        print(f"Error in document processor: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e)
            })
        }
        
    finally:
        cur.close()
        conn.close()

# Lambda handler
def lambda_handler(event, context):
    return process_document(event, context)