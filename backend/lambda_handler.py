"""
SwissTax.ai Lambda Handler
Main entry point for all API requests
"""

import json
import logging
from typing import Dict, Any
import os
import sys
from uuid import uuid4

# Add the current directory to Python path for module imports
sys.path.append(os.path.dirname(__file__))

from services.interview_service import InterviewService
from database.connection import check_db_health

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize services
interview_service = InterviewService()

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
    db_healthy = check_db_health()
    return {
        'status': 'healthy' if db_healthy else 'degraded',
        'service': 'swissai-tax-api',
        'database': 'connected' if db_healthy else 'disconnected',
        'timestamp': context.aws_request_id if 'context' in globals() else None
    }

def handle_interview(event: Dict[str, Any]) -> Dict[str, Any]:
    """Handle interview-related requests"""
    method = event.get('httpMethod')
    path = event.get('path', '')
    path_parts = path.split('/')

    # Extract path parameters
    if len(path_parts) > 3:
        action = path_parts[3]  # /api/interview/{action}
    else:
        action = None

    if method == 'POST':
        body = json.loads(event.get('body', '{}'))

        if action == 'start':
            # Start new interview session
            user_id = body.get('userId', str(uuid4()))  # Generate if not provided
            tax_year = body.get('taxYear', 2024)
            session = interview_service.create_session(user_id, tax_year)
            first_question = interview_service.get_question('Q01', body.get('language', 'en'))

            return {
                'sessionId': str(session['id']),
                'status': session['status'],
                'currentQuestion': first_question,
                'progress': session['completion_percentage']
            }

        elif action == 'answer':
            # Save answer and get next question
            session_id = body.get('sessionId')
            question_id = body.get('questionId')
            answer = body.get('answer')

            if not all([session_id, question_id, answer is not None]):
                return {'error': 'Missing required parameters'}

            # Save answer
            interview_service.save_answer(session_id, question_id, answer)

            # Get next question
            next_q_id = interview_service.get_next_question(session_id, question_id)
            if next_q_id:
                next_question = interview_service.get_question(next_q_id, body.get('language', 'en'))
                status = 'in_progress'
            else:
                next_question = None
                status = 'completed'
                # Calculate required documents
                required_docs = interview_service.calculate_required_documents(session_id)

            # Get updated session
            session = interview_service.get_session(session_id)

            return {
                'sessionId': session_id,
                'status': status,
                'nextQuestion': next_question,
                'progress': session['completion_percentage'],
                'requiredDocuments': required_docs if status == 'completed' else None
            }

    elif method == 'GET':
        if action == 'session':
            # Get session status
            session_id = event.get('queryStringParameters', {}).get('sessionId')
            if not session_id:
                return {'error': 'Session ID required'}

            session = interview_service.get_session(session_id)
            answers = interview_service.get_session_answers(session_id)

            return {
                'sessionId': str(session['id']),
                'status': session['status'],
                'currentQuestion': session['current_question'],
                'progress': session['completion_percentage'],
                'answers': answers
            }

        elif action == 'questions':
            # Get all questions
            language = event.get('queryStringParameters', {}).get('language', 'en')
            questions = interview_service.get_all_questions(language)
            return {'questions': questions}

    return {'message': 'Interview endpoint', 'method': method, 'action': action}

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