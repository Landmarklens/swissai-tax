"""Interview service for managing tax interview sessions"""

import json
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4

from models.question import QuestionLoader, QuestionType
from models.pending_document import PendingDocument, DocumentStatus, get_document_label
from services.filing_orchestration_service import FilingOrchestrationService
from services.postal_code_service import get_postal_code_service
from utils.encryption import get_encryption_service
from utils.ahv_validator import validate_ahv_number

logger = logging.getLogger(__name__)

class InterviewService:
    """Service for managing interview sessions and state"""

    def __init__(self, db=None):
        self.question_loader = QuestionLoader()
        self.encryption_service = get_encryption_service()
        # Multi-canton filing support
        self.filing_service = FilingOrchestrationService(db=db)
        # Database session - REQUIRED for database-backed sessions
        self.db = db

    def create_session(self, user_id: str, tax_year: int, language: str = 'en', filing_id: str = None) -> Dict[str, Any]:
        """Create a new interview session or return existing one"""
        if not self.db:
            raise RuntimeError("Database session is required for InterviewService")

        from models.interview_session import InterviewSession
        from models.tax_filing_session import TaxFilingSession

        # Check if session already exists for this user + year + filing
        # NOTE: Each filing should have its own interview session
        if filing_id:
            existing_session = self.db.query(InterviewSession).filter(
                InterviewSession.user_id == user_id,
                InterviewSession.tax_year == tax_year,
                InterviewSession.filing_id == filing_id
            ).first()
        else:
            # No filing_id provided - check for any session for this user + year
            existing_session = self.db.query(InterviewSession).filter(
                InterviewSession.user_id == user_id,
                InterviewSession.tax_year == tax_year
            ).first()

        if existing_session:
            # If session is completed, reset it to allow restarting the interview
            if existing_session.status == 'completed':
                logger.info(f"Resetting completed session {existing_session.id} for user {user_id}, year {tax_year}")

                # Reset session to initial state
                first_question = self.question_loader.get_first_question()
                existing_session.status = 'in_progress'
                existing_session.current_question_id = first_question.id
                existing_session.answers = {}
                existing_session.completed_questions = []
                existing_session.pending_questions = [first_question.id]
                existing_session.progress = 0
                existing_session.session_context = {}
                existing_session.completed_at = None
                existing_session.submitted_at = None
                existing_session.updated_at = datetime.utcnow()

                # Update filing_id if a new one was provided
                if filing_id:
                    existing_session.filing_id = filing_id

                self.db.commit()
                self.db.refresh(existing_session)

                session_id = str(existing_session.id)
                logger.info(f"Reset completed. Returning session {session_id} with first question")

                # Calculate total questions for reset session
                session_dict = existing_session.to_dict()
                total_questions = self._calculate_total_questions(session_dict)

                return {
                    'session_id': session_id,
                    'current_question': self._format_question(first_question, language),
                    'progress': 0,
                    'total_questions': total_questions,
                    'completed_questions': 0
                }

            # Validate that the filing_id referenced by this session still exists
            if existing_session.filing_id:
                filing_exists = self.db.query(TaxFilingSession).filter(
                    TaxFilingSession.id == existing_session.filing_id
                ).first()

                if not filing_exists:
                    # Zombie session detected - filing was deleted
                    logger.warning(
                        f"Interview session {existing_session.id} references deleted filing {existing_session.filing_id}. "
                        f"Deleting zombie session and creating new one."
                    )
                    self.db.delete(existing_session)
                    self.db.commit()
                    # Continue to create new session below
                else:
                    # Valid existing session - return it
                    session_id = str(existing_session.id)
                    logger.info(f"Returning existing interview session {session_id} for user {user_id}, year {tax_year}")

                    # Get current question or first question if not set
                    if existing_session.current_question_id:
                        current_question = self.question_loader.get_question(existing_session.current_question_id)
                    else:
                        current_question = self.question_loader.get_first_question()

                    # Calculate total questions for existing session
                    session_dict = existing_session.to_dict()
                    total_questions = self._calculate_total_questions(session_dict)
                    completed = len(session_dict.get('completed_questions', []))

                    return {
                        'session_id': session_id,
                        'current_question': self._format_question(current_question, language),
                        'progress': existing_session.progress or 0,
                        'total_questions': total_questions,
                        'completed_questions': completed
                    }
            else:
                # Session has no filing_id (shouldn't happen, but handle gracefully)
                logger.warning(
                    f"Interview session {existing_session.id} has no filing_id. "
                    f"Deleting invalid session and creating new one."
                )
                self.db.delete(existing_session)
                self.db.commit()
                # Continue to create new session below

        # Get first question
        first_question = self.question_loader.get_first_question()

        # Create database record
        db_session = InterviewSession(
            user_id=user_id,
            filing_id=filing_id,
            tax_year=tax_year,
            language=language,
            status='in_progress',
            current_question_id=first_question.id,
            answers={},
            completed_questions=[],
            pending_questions=[first_question.id],
            progress=0,
            session_context={}
        )

        self.db.add(db_session)
        self.db.commit()
        self.db.refresh(db_session)

        session_id = str(db_session.id)
        logger.info(f"Created interview session {session_id} for user {user_id}")

        # Calculate total questions for new session
        session_dict = db_session.to_dict()
        total_questions = self._calculate_total_questions(session_dict)

        return {
            'session_id': session_id,
            'current_question': self._format_question(first_question, language),
            'progress': 0,
            'total_questions': total_questions,
            'completed_questions': 0
        }

    def submit_answer(self, session_id: str, question_id: str, answer: Any) -> Dict[str, Any]:
        """Submit an answer and get next question"""
        if not self.db:
            raise RuntimeError("Database session is required for InterviewService")

        from models.interview_session import InterviewSession
        from uuid import UUID as PyUUID

        # Validate UUID format
        try:
            session_uuid = PyUUID(session_id)
        except (ValueError, AttributeError):
            raise ValueError(f"Session {session_id} not found")

        # Load session from database
        db_session = self.db.query(InterviewSession).filter(InterviewSession.id == session_uuid).first()
        if not db_session:
            raise ValueError(f"Session {session_id} not found")

        if db_session.status != 'in_progress':
            raise ValueError(f"Session {session_id} is not in progress")

        # Convert to dict for easier manipulation (will save back to DB at end)
        session = db_session.to_dict()
        session_context = session.get('session_context', {})

        # Get current question
        question = self.question_loader.get_question(question_id)
        if not question:
            raise ValueError(f"Question {question_id} not found")

        # Special handling for AHV number validation
        if question.type == QuestionType.AHV_NUMBER:
            is_valid, result = validate_ahv_number(answer, strict=False)
            if not is_valid:
                return {
                    'error': result,  # result contains error message
                    'valid': False
                }
            # Store the formatted AHV number
            answer = result  # result contains formatted AHV number

            # Special case: Q00 is the user's own AHV number - save to User table
            if question_id == 'Q00' and self.db:
                self._save_user_ahv_number(session['user_id'], answer)

        # Special handling for document upload questions
        elif question.type == QuestionType.DOCUMENT_UPLOAD:
            # Document upload questions don't require an answer value at submission
            # User can choose to upload now, bring later, or skip (if not required)
            bring_later = answer.get('bring_later', False) if isinstance(answer, dict) else False

            if bring_later:
                # Create pending document record
                self._create_pending_document(session_id, question_id, question)
                answer = 'bring_later'
            elif isinstance(answer, dict) and answer.get('skip', False):
                answer = 'skipped'
            else:
                # Document was uploaded - answer should be document_id
                answer = answer if isinstance(answer, str) else answer.get('document_id', 'uploaded')

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

        # Handle postal code auto-lookup
        if hasattr(question, 'auto_lookup') and question.auto_lookup:
            postal_code_service = get_postal_code_service()
            location_data = postal_code_service.lookup_postal_code(str(answer))

            if location_data:
                # Store location data in session
                location_key = f"{question_id}_location"
                session_context[location_key] = location_data

                # For secondary location (Q02b), store as secondary location
                if question_id == 'Q02b':
                    session_context['secondary_canton'] = location_data['canton']
                    session_context['secondary_municipality'] = location_data['municipality']
                    session_context['secondary_postal_code'] = location_data['postal_code']
                    logger.info(f"Auto-detected secondary location: {location_data['canton']}, {location_data['municipality']}")
            else:
                logger.warning(f"Could not auto-lookup location for postal code: {answer}")

        session['completed_questions'].append(question_id)

        # Handle sub-questions for married status (Q01a_name, Q01a, Q01d)
        if question_id == 'Q01' and answer == 'married':
            # Add spouse questions to pending - matches questions.yaml branching
            spouse_questions = ['Q01a_name', 'Q01a', 'Q01d']
            session['pending_questions'].extend(spouse_questions)
            next_question_id = 'Q01a_name'
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
            session_context['num_children'] = num_children
            session_context['child_index'] = 0
            next_question_id = 'Q03b' if num_children > 0 else 'Q04'
        elif question_id == 'Q03b':
            # Handle child loop
            if 'child_index' not in session:
                session_context['child_index'] = 0

            session_context['child_index'] += 1

            if session_context['child_index'] < session_context.get('num_children', 0):
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
            session_context['property_cantons'] = property_cantons

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
                    session_context['secondary_filing_ids'] = [f.id for f in secondary_filings]

                    logger.info(
                        f"Auto-created {len(secondary_filings)} secondary filings "
                        f"for cantons: {[f.canton for f in secondary_filings]}"
                    )

                    # Store info for response message
                    session_context['multi_canton_created'] = {
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

        # NEW: Handle multi-select questions (e.g., Q_complexity_screen)
        elif question.type == QuestionType.MULTI_SELECT:
            # Answer is a list of selected values
            # Handle special case: "none_of_above" goes straight to complete
            if 'none_of_above' in answer:
                next_question_id = 'complete'
            else:
                # Get branching targets for all selected options
                branching_targets = []
                for selected_value in answer:
                    if selected_value in question.branching:
                        target = question.branching[selected_value]
                        if target and target not in branching_targets:
                            branching_targets.append(target)

                # Route to first target, add rest to pending
                if branching_targets:
                    next_question_id = branching_targets[0]
                    if len(branching_targets) > 1:
                        session['pending_questions'].extend(branching_targets[1:])
                else:
                    # No valid branching targets, use default or fallback to complete
                    next_question_id = question.branching.get('default', 'complete')

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

        # Update session context back into session dict
        session['session_context'] = session_context

        # Save changes to database
        db_session.status = session['status']
        db_session.current_question_id = session['current_question_id']
        db_session.answers = session['answers']
        db_session.completed_questions = session['completed_questions']
        db_session.pending_questions = session['pending_questions']
        db_session.progress = session['progress']
        db_session.session_context = session['session_context']
        db_session.updated_at = datetime.utcnow()

        # Check if interview is complete
        if next_question_id == 'complete' or next_question_id is None:
            session['status'] = 'completed'
            session['current_question_id'] = None
            db_session.status = 'completed'
            db_session.current_question_id = None
            db_session.completed_at = datetime.utcnow()

            # Commit changes to database
            self.db.commit()

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

        # Check if question exists
        if next_question is None:
            logger.error(f"Question {next_question_id} not found in configuration. "
                        f"Session: {session_id}, Last completed: {question_id}")
            # Mark interview as complete to prevent further errors
            session['status'] = 'completed'
            session['current_question_id'] = None
            db_session.status = 'completed'
            db_session.current_question_id = None
            db_session.completed_at = datetime.utcnow()

            # Commit changes to database
            self.db.commit()

            # Generate profile and document requirements with existing answers
            profile = self._generate_profile(session['answers'])
            document_requirements = self.question_loader.get_document_requirements(session['answers'])

            return {
                'complete': True,
                'profile': profile,
                'document_requirements': document_requirements,
                'progress': 100,
                'warning': f'Interview completed early due to missing question: {next_question_id}'
            }

        session['current_question_id'] = next_question_id

        # Calculate progress using dynamic total questions
        total_questions = self._calculate_total_questions(session)
        completed = len(session['completed_questions'])
        progress = min(int((completed / max(total_questions, 1)) * 100), 99)
        session['progress'] = progress

        # Update database session with final values
        db_session.current_question_id = session['current_question_id']
        db_session.progress = progress
        db_session.session_context = session_context

        # Commit changes to database
        self.db.commit()

        response = {
            'current_question': self._format_question(next_question, session['language']),
            'progress': progress,
            'total_questions': total_questions,
            'completed_questions': completed,
            'complete': False
        }

        # Add multi-canton filing info if secondary filings were created
        if 'multi_canton_created' in session_context:
            response['multi_canton_filings'] = session_context['multi_canton_created']
            # Clear the flag so it's only sent once
            del session_context['multi_canton_created']
            # Update DB with cleared flag
            db_session.session_context = session_context
            self.db.commit()

        return response

    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session details"""
        if not self.db:
            raise RuntimeError("Database session is required for InterviewService")

        from models.interview_session import InterviewSession
        from uuid import UUID as PyUUID

        # Validate UUID format
        try:
            session_uuid = PyUUID(session_id)
        except (ValueError, AttributeError):
            logger.warning(f"Invalid session ID format: {session_id}")
            return None

        db_session = self.db.query(InterviewSession).filter(InterviewSession.id == session_uuid).first()
        if not db_session:
            return None

        return db_session.to_dict()

    def resume_session(self, session_id: str) -> Dict[str, Any]:
        """Resume an existing session"""
        if not self.db:
            raise RuntimeError("Database session is required for InterviewService")

        from models.interview_session import InterviewSession
        from uuid import UUID as PyUUID

        # Validate UUID format
        try:
            session_uuid = PyUUID(session_id)
        except (ValueError, AttributeError):
            raise ValueError(f"Session {session_id} not found")

        db_session = self.db.query(InterviewSession).filter(InterviewSession.id == session_uuid).first()
        if not db_session:
            raise ValueError(f"Session {session_id} not found")

        session = db_session.to_dict()

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
            'question_text': question.text.get(language, question.text.get('en')),
            'type': question.type.value,
            'required': question.required,
            'category': question.category
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

        # Add help text if available
        if hasattr(question, 'help_text') and question.help_text:
            formatted['help_text'] = question.help_text.get(language, question.help_text.get('en'))

        # Add explanation if available
        if hasattr(question, 'explanation') and question.explanation:
            formatted['explanation'] = question.explanation.get(language, question.explanation.get('en'))

        # Add placeholder if available
        if hasattr(question, 'placeholder') and question.placeholder:
            formatted['placeholder'] = question.placeholder

        # Add widget if available (e.g., calendar for dates)
        if hasattr(question, 'widget') and question.widget:
            formatted['widget'] = question.widget

        # Add document upload specific attributes
        if question.type == QuestionType.DOCUMENT_UPLOAD:
            if hasattr(question, 'document_type') and question.document_type:
                formatted['document_type'] = question.document_type
                formatted['document_label'] = get_document_label(question.document_type)
            if hasattr(question, 'accepted_formats') and question.accepted_formats:
                formatted['accepted_formats'] = question.accepted_formats
            if hasattr(question, 'max_size_mb') and question.max_size_mb:
                formatted['max_size_mb'] = question.max_size_mb
            if hasattr(question, 'bring_later') and question.bring_later:
                formatted['bring_later'] = question.bring_later
            if hasattr(question, 'allow_multiple') and question.allow_multiple:
                formatted['allow_multiple'] = question.allow_multiple

        # Add auto_lookup flag for postal codes
        if hasattr(question, 'auto_lookup') and question.auto_lookup:
            formatted['auto_lookup'] = question.auto_lookup

        # Add allow_multiple flag
        if hasattr(question, 'allow_multiple') and question.allow_multiple:
            formatted['allow_multiple'] = question.allow_multiple

        # Add inline document upload configuration for yes/no questions
        if hasattr(question, 'inline_document_upload') and question.inline_document_upload:
            upload_config = question.inline_document_upload
            formatted['inline_document_upload'] = {
                'document_type': upload_config.get('document_type'),
                'accepted_formats': upload_config.get('accepted_formats', ['pdf', 'jpg', 'jpeg', 'png']),
                'max_size_mb': upload_config.get('max_size_mb', 10),
                'bring_later': upload_config.get('bring_later', True),
                'upload_text': upload_config.get('upload_text', {}).get(language, upload_config.get('upload_text', {}).get('en')),
                'help_text': upload_config.get('help_text', {}).get(language, upload_config.get('help_text', {}).get('en'))
            }

        # Add fields for group questions
        if question.fields:
            formatted['fields'] = []
            for field in question.fields:
                field_data = {
                    'id': field['id'],
                    'text': field['text'].get(language, field['text'].get('en')),
                    'type': field['type'],
                    'required': field.get('required', True)
                }
                # Add widget for date fields in groups
                if field.get('widget'):
                    field_data['widget'] = field['widget']
                formatted['fields'].append(field_data)

        # Note: Context for loops (like Q03b) is now passed separately when needed
        # since we don't have access to session state in this method anymore

        return formatted

    def _is_question_sensitive(self, question_id: str) -> bool:
        """
        Determine if a question contains sensitive information requiring encryption

        Sensitive questions include:
        - Personal identifying information (AHV numbers, names, dates of birth)
        - Financial amounts (income, deductions, donations)
        - Location data (municipality, address)

        Args:
            question_id: The question identifier

        Returns:
            True if question contains sensitive data
        """
        # Define sensitive question IDs
        sensitive_questions = {
            'Q00',   # User's own AHV number
            'Q01a',  # Spouse AHV number
            'Q02a',  # Municipality (location)
            'Q03b',  # Child details (name, DOB)
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
            'ahv_number': decrypted_answers.get('Q00'),  # User's own AHV number
            'civil_status': decrypted_answers.get('Q01'),
            # NOTE: canton, municipality, and postal_code come from filing.profile, not interview answers
            # They are set when the filing is created
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
                'ahv_number': decrypted_answers.get('Q01a'),
                'is_employed': decrypted_answers.get('Q01d') == 'yes'
            }

        return profile

    def _calculate_total_questions(self, session: Dict[str, Any]) -> int:
        """
        Dynamically calculate total number of questions based on answers and pending questions

        This accounts for:
        - Conditional questions (married → spouse questions)
        - Looping questions (children, employers, properties)
        - Branching questions (yes/no that trigger additional questions)

        Args:
            session: Session dictionary containing answers and pending questions

        Returns:
            Estimated total number of questions for this interview
        """
        answers = session.get('answers', {})
        completed_questions = session.get('completed_questions', [])
        pending_questions = session.get('pending_questions', [])
        session_context = session.get('session_context', {})

        # Start with base questions count (questions that everyone gets)
        # Q00_name, Q00, Q01, Q02a, Q03, Q04, Q05, Q06, Q07, Q08, Q09, Q10, Q11, Q12, Q13, Q14, Q_complexity_screen
        total = 17

        logger.info(f"[_calculate_total_questions] Starting calculation. Base total: {total}")
        logger.info(f"[_calculate_total_questions] Current answers: {list(answers.keys())}")
        logger.info(f"[_calculate_total_questions] Completed questions: {len(completed_questions)}")

        # Add spouse questions if married
        if answers.get('Q01') == 'married':
            total += 3  # Q01a_name, Q01a, Q01d
            logger.info(f"[_calculate_total_questions] Q01=married: Added 3 spouse questions, new total: {total}")

        # Add children questions if has children
        if answers.get('Q03') == 'yes' or answers.get('Q03') == True:
            total += 1  # Q03a (how many children)
            num_children = session_context.get('num_children', 0)
            if num_children > 0:
                total += num_children  # Q03b loops for each child

        # Add secondary location question if has income/assets in other canton
        if answers.get('Q02a') == 'yes' or answers.get('Q02a') == True:
            total += 1  # Q02b

        # Add employer questions based on number of employers
        num_employers = int(answers.get('Q04', 0))
        if num_employers > 0:
            # Q04a (employer details) loops for each employer
            # For each employer: Q04a, Q04a_type, Q04a_self_upload (or Q04a_employer)
            total += num_employers * 2  # Simplified: ~2 questions per employer

        # Add unemployment benefit details if yes
        if answers.get('Q05') == 'yes' or answers.get('Q05') == True:
            total += 1  # Unemployment benefit details

        # Add property questions if owns property
        if answers.get('Q09') == 'yes' or answers.get('Q09') == True:
            total += 2  # Q09a, Q09b (property details)
            # If rental property, add rental income questions
            if answers.get('Q09a') in ['rental', 'mixed']:
                total += 2  # Q09c, Q09c_amount

        # Add securities/capital income questions
        if answers.get('Q10') == 'yes' or answers.get('Q10') == True:
            total += 1  # Q10a (amount)

        # Add pillar 3a questions if yes
        if answers.get('Q12') == 'yes' or answers.get('Q12') == True:
            total += 1  # Pillar 3a details

        # Add medical expenses questions if yes
        if answers.get('Q13') == 'yes' or answers.get('Q13') == True:
            total += 2  # Q13b (basic insurance), Q13b_supplementary

        # Add complexity screen questions if they haven't completed yet
        if 'Q_complexity_screen' not in completed_questions:
            total += 1  # Q_complexity_screen

            # Add estimated questions based on typical selections
            # (Capital gains, energy renovation, pension buyback, etc.)
            # Add conservative estimate of 3-5 extra questions
            total += 3

        # Add any pending questions not yet accounted for
        unique_pending = set(pending_questions) - set(completed_questions)
        if len(unique_pending) > 0:
            logger.info(f"[_calculate_total_questions] Adding {len(unique_pending)} unique pending questions: {list(unique_pending)}")
        total += len(unique_pending)

        logger.info(f"[_calculate_total_questions] FINAL total: {total}, completed: {len(completed_questions)}")

        # Ensure minimum progress (avoid division by zero)
        return max(total, 1)

    def _create_pending_document(self, session_id: str, question_id: str, question) -> None:
        """
        Create a pending document record when user chooses "bring later"

        Args:
            session_id: Interview session ID
            question_id: Question ID for the document upload
            question: Question object with document metadata
        """
        if not self.db:
            logger.warning(f"Cannot create pending document: database session not available")
            return

        # Get filing session ID from database
        from models.interview_session import InterviewSession
        from uuid import UUID as PyUUID

        # Validate UUID format
        try:
            session_uuid = PyUUID(session_id)
        except (ValueError, AttributeError):
            logger.error(f"Invalid session ID format: {session_id}")
            return

        db_session = self.db.query(InterviewSession).filter(InterviewSession.id == session_uuid).first()
        if not db_session:
            logger.error(f"Session {session_id} not found")
            return

        filing_session_id = db_session.filing_id
        if not filing_session_id:
            logger.warning(f"No filing_id in session {session_id}, cannot create pending document")
            return

        try:
            # Create pending document record
            pending_doc = PendingDocument(
                filing_session_id=filing_session_id,
                question_id=question_id,
                document_type=getattr(question, 'document_type', 'unknown'),
                status=DocumentStatus.PENDING,
                document_label=get_document_label(getattr(question, 'document_type', 'unknown')),
                help_text=question.help_text.get('en') if hasattr(question, 'help_text') and question.help_text else None
            )

            self.db.add(pending_doc)
            self.db.commit()

            logger.info(f"Created pending document for question {question_id} in filing {filing_session_id}")

        except Exception as e:
            logger.error(f"Failed to create pending document: {e}")
            self.db.rollback()

    def _save_user_ahv_number(self, user_id: str, ahv_number: str) -> None:
        """
        Save user's AHV number to the User table

        Args:
            user_id: User UUID
            ahv_number: Formatted AHV number (756.XXXX.XXXX.XX)
        """
        if not self.db:
            logger.warning(f"Cannot save AHV number: database session not available")
            return

        try:
            from models.swisstax.user import User
            from uuid import UUID as PyUUID

            # Convert string UUID to UUID object
            try:
                user_uuid = PyUUID(user_id)
            except:
                # If conversion fails, use string directly
                user_uuid = user_id

            # Get user and update AHV number
            user = self.db.query(User).filter(User.id == user_uuid).first()
            if user:
                user.ahv_number = ahv_number
                self.db.commit()
                logger.info(f"Saved AHV number for user {user_id}")
            else:
                logger.warning(f"User {user_id} not found, cannot save AHV number")

        except Exception as e:
            logger.error(f"Failed to save AHV number for user {user_id}: {e}")
            self.db.rollback()

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
        if not self.db:
            raise RuntimeError("Database session is required for InterviewService")

        from models.interview_session import InterviewSession
        from uuid import UUID as PyUUID

        # Validate UUID format
        try:
            session_uuid = PyUUID(session_id)
        except (ValueError, AttributeError):
            logger.warning(f"Invalid session ID format: {session_id}")
            return None

        db_session = self.db.query(InterviewSession).filter(InterviewSession.id == session_uuid).first()
        if not db_session:
            return None

        # Update session with provided data
        if answers:
            if db_session.answers is None:
                db_session.answers = {}
            db_session.answers.update(answers)

        if progress is not None:
            db_session.progress = progress

        # Update timestamp
        saved_at = datetime.utcnow()
        db_session.updated_at = saved_at

        self.db.commit()

        logger.info(f"Saved session {session_id} with {len(answers) if answers else 0} answers and {progress}% progress")

        return {
            'session_id': session_id,
            'saved_at': saved_at.isoformat(),
            'answers_count': len(db_session.answers or {}),
            'progress': db_session.progress
        }

# NOTE: Do not create a singleton instance without a database session
# Each router will create its own instance with proper database injection
# interview_service = InterviewService()
