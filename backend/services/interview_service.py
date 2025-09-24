"""Interview service for managing tax interview sessions"""

import json
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
from uuid import UUID, uuid4

from models.question import QuestionLoader, QuestionType

logger = logging.getLogger(__name__)

class InterviewService:
    """Service for managing interview sessions and state"""

    def __init__(self):
        import threading
        self.question_loader = QuestionLoader()
        # In production, this would use database storage
        # For now, using in-memory storage
        self.sessions = {}
        self._lock = threading.Lock()  # Thread safety for concurrent access

    def create_session(self, user_id: str, tax_year: int, language: str = 'en') -> Dict[str, Any]:
        """Create a new interview session"""
        session_id = str(uuid4())

        # Get first question
        first_question = self.question_loader.get_first_question()

        session = {
            'id': session_id,
            'user_id': user_id,
            'tax_year': tax_year,
            'language': language,
            'status': 'in_progress',
            'current_question_id': first_question.id,
            'answers': {},
            'completed_questions': [],
            'pending_questions': [first_question.id],
            'progress': 0,
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }

        self.sessions[session_id] = session
        logger.info(f"Created interview session {session_id} for user {user_id}")

        return {
            'session_id': session_id,
            'current_question': self._format_question(first_question, language),
            'progress': 0
        }

    def submit_answer(self, session_id: str, question_id: str, answer: Any) -> Dict[str, Any]:
        """Submit an answer and get next question"""
        session = self.sessions.get(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")

        if session['status'] != 'in_progress':
            raise ValueError(f"Session {session_id} is not in progress")

        # Get current question
        question = self.question_loader.get_question(question_id)
        if not question:
            raise ValueError(f"Question {question_id} not found")

        # Validate answer
        is_valid, error_message = question.validate_answer(answer)
        if not is_valid:
            return {
                'error': error_message,
                'valid': False
            }

        # Store answer
        session['answers'][question_id] = answer
        session['completed_questions'].append(question_id)

        # Handle sub-questions for married status (Q01a-d)
        if question_id == 'Q01' and answer == 'married':
            # Add spouse questions to pending
            spouse_questions = ['Q01a', 'Q01b', 'Q01c', 'Q01d']
            session['pending_questions'].extend(spouse_questions)
            next_question_id = 'Q01a'
        # Handle sub-questions for children
        elif question_id == 'Q03' and answer == 'yes':
            session['pending_questions'].append('Q03a')
            next_question_id = 'Q03a'
        elif question_id == 'Q03a':
            # Store number of children and prepare for child details
            try:
                num_children = int(answer)
            except (ValueError, TypeError):
                return {'error': 'Invalid number provided. Please enter a valid number.'}
            session['num_children'] = num_children
            session['child_index'] = 0
            next_question_id = 'Q03b' if num_children > 0 else 'Q04'
        elif question_id == 'Q03b':
            # Handle child loop
            if 'child_index' not in session:
                session['child_index'] = 0

            session['child_index'] += 1

            if session['child_index'] < session.get('num_children', 0):
                # More children to process
                next_question_id = 'Q03b'
            else:
                # Move to next main question
                next_question_id = 'Q04'
        else:
            # Get next question based on answer
            next_questions = self.question_loader.get_next_questions(question_id, answer)
            if next_questions:
                next_question_id = next_questions[0]
                # Add remaining questions to pending if multiple
                if len(next_questions) > 1:
                    session['pending_questions'].extend(next_questions[1:])
            else:
                # Check pending questions
                if session['pending_questions']:
                    next_question_id = session['pending_questions'].pop(0)
                else:
                    next_question_id = None

        # Update session
        session['updated_at'] = datetime.utcnow().isoformat()

        # Check if interview is complete
        if next_question_id == 'complete' or next_question_id is None:
            session['status'] = 'completed'
            session['current_question_id'] = None

            # Generate profile and document requirements
            profile = self._generate_profile(session['answers'])
            document_requirements = self.question_loader.get_document_requirements(session['answers'])

            return {
                'complete': True,
                'profile': profile,
                'document_requirements': document_requirements,
                'progress': 100
            }

        # Get next question
        next_question = self.question_loader.get_question(next_question_id)
        session['current_question_id'] = next_question_id

        # Calculate progress
        total_questions = 14  # Base questions
        if session['answers'].get('Q01') == 'married':
            total_questions += 4  # Add spouse questions
        if session['answers'].get('Q03') == 'yes':
            total_questions += 1  # Add children count question

        completed = len(session['completed_questions'])
        progress = min(int((completed / max(total_questions, 1)) * 100), 99)
        session['progress'] = progress

        return {
            'next_question': self._format_question(next_question, session['language']),
            'progress': progress,
            'complete': False
        }

    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session details"""
        return self.sessions.get(session_id)

    def resume_session(self, session_id: str) -> Dict[str, Any]:
        """Resume an existing session"""
        session = self.sessions.get(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")

        if session['status'] == 'completed':
            return {
                'complete': True,
                'profile': self._generate_profile(session['answers']),
                'document_requirements': self.question_loader.get_document_requirements(session['answers'])
            }

        current_question = self.question_loader.get_question(session['current_question_id'])

        return {
            'session_id': session_id,
            'current_question': self._format_question(current_question, session['language']),
            'answers': session['answers'],
            'progress': session['progress'],
            'complete': False
        }

    def _format_question(self, question, language: str) -> Dict[str, Any]:
        """Format question for API response"""
        formatted = {
            'id': question.id,
            'text': question.text.get(language, question.text.get('en')),
            'type': question.type.value,
            'required': question.required
        }

        # Add options for choice questions
        if question.options:
            formatted['options'] = []
            for opt in question.options:
                formatted['options'].append({
                    'value': opt['value'],
                    'label': opt['label'].get(language, opt['label'].get('en'))
                })

        # Add validation rules
        if question.validation:
            formatted['validation'] = question.validation

        # Add fields for group questions
        if question.fields:
            formatted['fields'] = []
            for field in question.fields:
                formatted['fields'].append({
                    'id': field['id'],
                    'text': field['text'].get(language, field['text'].get('en')),
                    'type': field['type'],
                    'required': field.get('required', True)
                })

        # Add context for loops
        if question.id == 'Q03b':
            session = next((s for s in self.sessions.values()
                          if s.get('current_question_id') == question.id), None)
            if session:
                child_index = session.get('child_index', 0)
                num_children = session.get('num_children', 0)
                formatted['context'] = {
                    'current': child_index + 1,
                    'total': num_children
                }

        return formatted

    def _generate_profile(self, answers: Dict[str, Any]) -> Dict[str, Any]:
        """Generate tax profile from answers"""
        profile = {
            'civil_status': answers.get('Q01'),
            'canton': answers.get('Q02'),
            'municipality': answers.get('Q02a'),
            'has_children': answers.get('Q03') == 'yes',
            'num_children': int(answers.get('Q03a', 0)) if answers.get('Q03') == 'yes' else 0,
            'num_employers': int(answers.get('Q04', 0)),
            'unemployment_benefits': answers.get('Q05') == 'yes',
            'disability_benefits': answers.get('Q06') == 'yes',
            'has_pension_fund': answers.get('Q07') == 'yes',
            'pillar_3a_contribution': answers.get('Q08') == 'yes',
            'owns_property': answers.get('Q09') == 'yes',
            'has_securities': answers.get('Q10') == 'yes',
            'charitable_donations': answers.get('Q11') == 'yes',
            'pays_alimony': answers.get('Q12') == 'yes',
            'medical_expenses': answers.get('Q13') == 'yes',
            'church_tax': answers.get('Q14', 'none')
        }

        # Add spouse info if married
        if answers.get('Q01') == 'married':
            profile['spouse'] = {
                'first_name': answers.get('Q01a'),
                'last_name': answers.get('Q01b'),
                'date_of_birth': answers.get('Q01c'),
                'is_employed': answers.get('Q01d') == 'yes'
            }

        # Add financial details if available
        if answers.get('Q08a'):
            profile['pillar_3a_amount'] = float(answers.get('Q08a'))
        if answers.get('Q11a'):
            profile['donation_amount'] = float(answers.get('Q11a'))
        if answers.get('Q12a'):
            profile['alimony_amount'] = float(answers.get('Q12a'))
        if answers.get('Q13a'):
            profile['medical_expense_amount'] = float(answers.get('Q13a'))

        return profile

# Create singleton instance
interview_service = InterviewService()
