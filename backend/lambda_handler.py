"""
SwissTax.ai Lambda Handler
Main entry point for all API requests
"""

import json
import logging
from typing import Dict, Any
import os

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# CORS headers for API responses
CORS_HEADERS = {
    'Access-Control-Allow-Origin': os.environ.get('CORS_ORIGIN', '*'),
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
}

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler for API Gateway requests
    """
    logger.info(f"Received event: {json.dumps(event)}")

    # Get HTTP method and path
    http_method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')

    try:
        # Route to appropriate handler based on path
        if path == '/health':
            response_body = handle_health_check()
        elif path.startswith('/api/interview'):
            response_body = handle_interview(event)
        elif path.startswith('/api/documents'):
            response_body = handle_documents(event)
        elif path.startswith('/api/calculation'):
            response_body = handle_calculation(event)
        else:
            response_body = {
                'message': 'SwissTax.ai API',
                'version': '0.1.0',
                'endpoints': [
                    '/health',
                    '/api/interview',
                    '/api/documents',
                    '/api/calculation'
                ]
            }

        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps(response_body)
        }

    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }

def handle_health_check() -> Dict[str, Any]:
    """Health check endpoint"""
    return {
        'status': 'healthy',
        'service': 'swisstax-api',
        'timestamp': context.aws_request_id if 'context' in globals() else None
    }

def handle_interview(event: Dict[str, Any]) -> Dict[str, Any]:
    """Handle interview-related requests"""
    method = event.get('httpMethod')

    if method == 'POST':
        # Start new interview
        body = json.loads(event.get('body', '{}'))
        return {
            'interviewId': 'interview-123',
            'status': 'started',
            'currentQuestion': 'Q01',
            'message': 'Interview started successfully'
        }
    elif method == 'GET':
        # Get interview status
        return {
            'interviewId': 'interview-123',
            'status': 'in_progress',
            'currentQuestion': 'Q03',
            'progress': 20
        }

    return {'message': 'Interview endpoint'}

def handle_documents(event: Dict[str, Any]) -> Dict[str, Any]:
    """Handle document-related requests"""
    method = event.get('httpMethod')

    if method == 'POST':
        # Upload document
        return {
            'documentId': 'doc-456',
            'status': 'uploaded',
            'message': 'Document uploaded successfully'
        }
    elif method == 'GET':
        # Get document checklist
        return {
            'required': [
                {'type': 'lohnausweis', 'status': 'pending'},
                {'type': '3a_statement', 'status': 'pending'}
            ],
            'uploaded': []
        }

    return {'message': 'Documents endpoint'}

def handle_calculation(event: Dict[str, Any]) -> Dict[str, Any]:
    """Handle tax calculation requests"""
    method = event.get('httpMethod')

    if method == 'POST':
        # Calculate taxes
        body = json.loads(event.get('body', '{}'))
        income = body.get('income', 100000)

        # Simple calculation for demo
        federal_tax = income * 0.05
        cantonal_tax = income * 0.08
        municipal_tax = income * 0.02

        return {
            'calculationId': 'calc-789',
            'income': income,
            'federalTax': federal_tax,
            'cantonalTax': cantonal_tax,
            'municipalTax': municipal_tax,
            'totalTax': federal_tax + cantonal_tax + municipal_tax,
            'effectiveRate': ((federal_tax + cantonal_tax + municipal_tax) / income) * 100
        }

    return {'message': 'Calculation endpoint'}

# For local testing
if __name__ == "__main__":
    test_event = {
        'httpMethod': 'GET',
        'path': '/health'
    }
    result = lambda_handler(test_event, None)
    print(json.dumps(result, indent=2))