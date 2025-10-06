"""Interview service for managing tax interview sessions"""

import json
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
from uuid import UUID, uuid4

from models.question import QuestionLoader, QuestionType
from utils.encryption import get_encryption_service
from services.filing_orchestration_service import FilingOrchestrationService

logger = logging.getLogger(__name__)

class InterviewService:
    """Service for managing interview sessions and state"""

    def __init__(self, db=None):
        import threading
        self.question_loader = QuestionLoader()
        # In production, this would use database storage
        # For now, using in-memory storage
        self.sessions = {}
        self._lock = threading.Lock()  # Thread safety for concurrent access
        self.encryption_service = get_encryption_service()
        # Multi-canton filing support
        self.filing_service = FilingOrchestrationService(db=db)

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

        # Store answer (encrypted if sensitive)
        # Encrypt sensitive answers before storing
        if self._is_question_sensitive(question_id):
            # Encrypt the answer value
            encrypted_answer = self.encryption_service.encrypt(str(answer))
            session['answers'][question_id] = encrypted_answer
            logger.info(f"Stored encrypted answer for sensitive question {question_id}")
        else:
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

        # NEW: Handle property ownership and multi-canton filing
        elif question_id == 'Q06' and answer == True:
            # User owns property - ask which cantons
            session['pending_questions'].append('Q06a')
            next_question_id = 'Q06a'

        elif question_id == 'Q06a':
            # Q06a: Property cantons (multi-select)
            # Answer is list of canton codes, e.g., ['GE', 'VS']
            property_cantons = answer if isinstance(answer, list) else [answer]

            # Store property cantons in session
            session['property_cantons'] = property_cantons

            # Auto-create secondary filings for other cantons
            # Get primary filing ID from session (should be set when creating interview)
            primary_filing_id = session.get('filing_id')

            if primary_filing_id and len(property_cantons) > 0:
                try:
                    # Auto-create secondary filings
                    secondary_filings = self.filing_service.auto_create_secondary_filings(
                        primary_filing_id=primary_filing_id,
                        property_cantons=property_cantons
                    )

                    # Store secondary filing IDs in session
                    session['secondary_filing_ids'] = [f.id for f in secondary_filings]

                    logger.info(
                        f"Auto-created {len(secondary_filings)} secondary filings "
                        f"for cantons: {[f.canton for f in secondary_filings]}"
                    )

                    # Store info for response message
                    session['multi_canton_created'] = {
                        'count': len(secondary_filings),
                        'cantons': [f.canton for f in secondary_filings],
                        'filing_ids': [f.id for f in secondary_filings]
                    }
                except Exception as e:
                    logger.error(f"Failed to create secondary filings: {e}")
                    # Continue with interview even if secondary filing creation fails

            # Ask property details for each canton
            next_question_id = 'Q06b'

        elif question_id == 'Q06b':
            # Property type/details - might loop for each canton
            # For now, move to next question
            next_question_id = 'Q07'

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

        response = {
            'current_question': self._format_question(next_question, session['language']),
            'progress': progress,
            'complete': False
        }

        # Add multi-canton filing info if secondary filings were created
        if 'multi_canton_created' in session:
            response['multi_canton_filings'] = session['multi_canton_created']
            # Clear the flag so it's only sent once
            del session['multi_canton_created']

        return response

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

    def _is_question_sensitive(self, question_id: str) -> bool:
        """
        Determine if a question contains sensitive information requiring encryption

        Sensitive questions include:
        - Personal identifying information (names, dates of birth)
        - Financial amounts (income, deductions, donations)
        - Location data (municipality, address)

        Args:
            question_id: The question identifier

        Returns:
            True if question contains sensitive data
        """
        # Define sensitive question IDs
        sensitive_questions = {
            'Q01a',  # Spouse first name
            'Q01b',  # Spouse last name
            'Q01c',  # Spouse date of birth
            'Q02a',  # Municipality (location)
            'Q03b',  # Child details (name, DOB)
            'Q08a',  # Pillar 3a contribution amount
            'Q11a',  # Charitable donation amount
            'Q12a',  # Alimony payment amount
            'Q13a',  # Medical expense amount
        }

        return question_id in sensitive_questions

    def _decrypt_answers_for_profile(self, answers: Dict[str, Any]) -> Dict[str, Any]:
        """
        Decrypt any encrypted answers for profile generation

        Args:
            answers: Dictionary of answers (may contain encrypted values)

        Returns:
            Dictionary with decrypted values
        """
        decrypted = {}
        for question_id, answer_value in answers.items():
            if self._is_question_sensitive(question_id):
                try:
                    decrypted[question_id] = self.encryption_service.decrypt(answer_value)
                except Exception as e:
                    logger.warning(f"Failed to decrypt answer for {question_id}: {e}")
                    decrypted[question_id] = answer_value
            else:
                decrypted[question_id] = answer_value
        return decrypted

    def _generate_profile(self, answers: Dict[str, Any]) -> Dict[str, Any]:
        """Generate tax profile from answers"""
        # Decrypt sensitive answers before generating profile
        decrypted_answers = self._decrypt_answers_for_profile(answers)

        profile = {
            'civil_status': decrypted_answers.get('Q01'),
            'canton': decrypted_answers.get('Q02'),
            'municipality': decrypted_answers.get('Q02a'),
            'has_children': decrypted_answers.get('Q03') == 'yes',
            'num_children': int(decrypted_answers.get('Q03a', 0)) if decrypted_answers.get('Q03') == 'yes' else 0,
            'num_employers': int(decrypted_answers.get('Q04', 0)),
            'unemployment_benefits': decrypted_answers.get('Q05') == 'yes',
            'disability_benefits': decrypted_answers.get('Q06') == 'yes',
            'has_pension_fund': decrypted_answers.get('Q07') == 'yes',
            'pillar_3a_contribution': decrypted_answers.get('Q08') == 'yes',
            'owns_property': decrypted_answers.get('Q09') == 'yes',
            'has_securities': decrypted_answers.get('Q10') == 'yes',
            'charitable_donations': decrypted_answers.get('Q11') == 'yes',
            'pays_alimony': decrypted_answers.get('Q12') == 'yes',
            'medical_expenses': decrypted_answers.get('Q13') == 'yes',
            'church_tax': decrypted_answers.get('Q14', 'none')
        }

        # Add spouse info if married (decrypted sensitive fields)
        if decrypted_answers.get('Q01') == 'married':
            profile['spouse'] = {
                'first_name': decrypted_answers.get('Q01a'),
                'last_name': decrypted_answers.get('Q01b'),
                'date_of_birth': decrypted_answers.get('Q01c'),
                'is_employed': decrypted_answers.get('Q01d') == 'yes'
            }

        # Add financial details if available (decrypted sensitive amounts)
        if decrypted_answers.get('Q08a'):
            profile['pillar_3a_amount'] = float(decrypted_answers.get('Q08a'))
        if decrypted_answers.get('Q11a'):
            profile['donation_amount'] = float(decrypted_answers.get('Q11a'))
        if decrypted_answers.get('Q12a'):
            profile['alimony_amount'] = float(decrypted_answers.get('Q12a'))
        if decrypted_answers.get('Q13a'):
            profile['medical_expense_amount'] = float(decrypted_answers.get('Q13a'))

        return profile

    def save_session(self, session_id: str, answers: Dict[str, Any], progress: int) -> Optional[Dict[str, Any]]:
        """
        Save the current interview session progress

        Args:
            session_id: The session identifier
            answers: Dictionary of question answers to save
            progress: Current progress percentage

        Returns:
            Dictionary with save confirmation or None if session not found
        """
        with self._lock:
            session = self.sessions.get(session_id)
            if not session:
                return None

            # Update session with provided data
            if answers:
                session['answers'].update(answers)

            if progress is not None:
                session['progress'] = progress

            # Update timestamp
            saved_at = datetime.utcnow().isoformat()
            session['updated_at'] = saved_at

            logger.info(f"Saved session {session_id} with {len(answers)} answers and {progress}% progress")

            return {
                'session_id': session_id,
                'saved_at': saved_at,
                'answers_count': len(session['answers']),
                'progress': session['progress']
            }

# Create singleton instance
interview_service = InterviewService()
