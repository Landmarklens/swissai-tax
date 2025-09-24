"""Interview service for handling Q01-Q14 questionnaire flow"""

from typing import Dict, List, Optional, Any
from uuid import uuid4
from datetime import datetime
import json
from database.connection import execute_query, execute_one, execute_insert


class InterviewService:
    """Service for managing interview sessions and question flow"""

    def __init__(self):
        self.question_order = [
            'Q01', 'Q02', 'Q02a', 'Q02b', 'Q03', 'Q04', 'Q05', 'Q06', 'Q06a',
            'Q07', 'Q08', 'Q09', 'Q10', 'Q11', 'Q12', 'Q13', 'Q14'
        ]

    def create_session(self, user_id: str, tax_year: int) -> Dict[str, Any]:
        """Create a new interview session for a user"""
        query = """
            INSERT INTO swisstax.interview_sessions (user_id, tax_year, status, current_question)
            VALUES (%s, %s, 'in_progress', 'Q01')
            ON CONFLICT (user_id, tax_year)
            DO UPDATE SET
                status = 'in_progress',
                current_question = 'Q01',
                completion_percentage = 0,
                started_at = CURRENT_TIMESTAMP
            RETURNING id, user_id, tax_year, status, current_question, completion_percentage
        """
        return execute_insert(query, (user_id, tax_year))

    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get interview session by ID"""
        query = """
            SELECT id, user_id, tax_year, status, current_question,
                   completion_percentage, started_at, completed_at
            FROM swisstax.interview_sessions
            WHERE id = %s
        """
        return execute_one(query, (session_id,))

    def get_user_session(self, user_id: str, tax_year: int) -> Optional[Dict[str, Any]]:
        """Get interview session for a user and tax year"""
        query = """
            SELECT id, user_id, tax_year, status, current_question,
                   completion_percentage, started_at, completed_at
            FROM swisstax.interview_sessions
            WHERE user_id = %s AND tax_year = %s
        """
        return execute_one(query, (user_id, tax_year))

    def get_question(self, question_id: str, language: str = 'en') -> Optional[Dict[str, Any]]:
        """Get a specific question with its metadata"""
        # Validate language to prevent SQL injection
        valid_languages = ['en', 'de', 'fr', 'it']
        if language not in valid_languages:
            language = 'en'

        text_field = f"question_text_{language}"
        help_field = f"help_text_{language}"

        query = f"""
            SELECT id, category, {text_field} as question_text,
                   {help_field} as help_text, question_type, options,
                   validation_rules, depends_on, depends_on_value, sort_order
            FROM swisstax.questions
            WHERE id = %s AND is_active = true
        """
        return execute_one(query, (question_id,))

    def get_next_question(self, session_id: str, current_question: str) -> Optional[str]:
        """Determine the next question based on current question and answers"""
        # Get all answers for this session
        answers = self.get_session_answers(session_id)

        # Find current question index
        try:
            current_index = self.question_order.index(current_question)
        except ValueError:
            return None

        # Check each subsequent question for dependencies
        for i in range(current_index + 1, len(self.question_order)):
            next_q = self.question_order[i]

            # Check if this question should be shown based on dependencies
            if self._should_show_question(next_q, answers):
                return next_q

        return None  # No more questions

    def _should_show_question(self, question_id: str, answers: Dict[str, Any]) -> bool:
        """Check if a question should be shown based on dependencies"""
        question = self.get_question(question_id)
        if not question:
            return False

        # If no dependency, always show
        if not question.get('depends_on'):
            return True

        # Check if dependency is satisfied
        depends_on = question['depends_on']
        depends_on_value = question.get('depends_on_value', {})

        if depends_on not in answers:
            return False  # Parent question not answered yet

        parent_answer = answers[depends_on]
        expected_value = depends_on_value.get('answer')

        # Check if parent answer matches expected value
        return parent_answer == expected_value

    def save_answer(self, session_id: str, question_id: str, answer_value: Any) -> Dict[str, Any]:
        """Save an answer and update session progress"""
        # Save the answer
        query = """
            INSERT INTO swisstax.interview_answers (session_id, question_id, answer_value)
            VALUES (%s, %s, %s)
            ON CONFLICT (session_id, question_id)
            DO UPDATE SET
                answer_value = %s,
                answered_at = CURRENT_TIMESTAMP
            RETURNING id, session_id, question_id, answer_value
        """
        answer = execute_insert(query, (session_id, question_id, answer_value, answer_value))

        # Update session progress
        self._update_session_progress(session_id, question_id)

        return answer

    def _update_session_progress(self, session_id: str, current_question: str):
        """Update session progress after answering a question"""
        # Get next question
        next_question = self.get_next_question(session_id, current_question)

        # Calculate completion percentage
        answers = self.get_session_answers(session_id)
        total_questions = len([q for q in self.question_order if self._should_show_question(q, answers)])
        answered_count = len(answers)
        completion = int((answered_count / max(total_questions, 1)) * 100)

        if next_question:
            # Update to next question
            query = """
                UPDATE swisstax.interview_sessions
                SET current_question = %s, completion_percentage = %s
                WHERE id = %s
            """
            execute_query(query, (next_question, completion, session_id), fetch=False)
        else:
            # Mark as completed
            query = """
                UPDATE swisstax.interview_sessions
                SET status = 'completed', completion_percentage = 100,
                    completed_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """
            execute_query(query, (session_id,), fetch=False)

    def get_session_answers(self, session_id: str) -> Dict[str, Any]:
        """Get all answers for a session"""
        query = """
            SELECT question_id, answer_value
            FROM swisstax.interview_answers
            WHERE session_id = %s
            ORDER BY answered_at
        """
        results = execute_query(query, (session_id,))
        return {row['question_id']: row['answer_value'] for row in results}

    def get_all_questions(self, language: str = 'en') -> List[Dict[str, Any]]:
        """Get all active questions in order"""
        # Validate language to prevent SQL injection
        valid_languages = ['en', 'de', 'fr', 'it']
        if language not in valid_languages:
            language = 'en'

        text_field = f"question_text_{language}"
        help_field = f"help_text_{language}"

        query = f"""
            SELECT id, category, {text_field} as question_text,
                   {help_field} as help_text, question_type, options,
                   validation_rules, depends_on, depends_on_value, sort_order
            FROM swisstax.questions
            WHERE is_active = true
            ORDER BY sort_order
        """
        return execute_query(query)

    def calculate_required_documents(self, session_id: str) -> List[Dict[str, Any]]:
        """Calculate required documents based on interview answers"""
        answers = self.get_session_answers(session_id)
        required_docs = []

        # Basic documents always required
        required_docs.append({
            'code': 'PERSONAL_ID',
            'reason': 'Basic identification required'
        })

        # Employment income documents
        if answers.get('Q03') == True:
            required_docs.append({
                'code': 'LOHNAUSWEIS',
                'reason': 'Employment income declared'
            })

        # Self-employment documents
        if answers.get('Q04') == True:
            required_docs.append({
                'code': 'BUSINESS_STATEMENTS',
                'reason': 'Self-employment income declared'
            })

        # Capital income documents
        if answers.get('Q05') == True:
            required_docs.append({
                'code': 'BANK_STATEMENTS',
                'reason': 'Capital income declared'
            })
            required_docs.append({
                'code': 'DIVIDEND_STATEMENTS',
                'reason': 'Capital income declared'
            })

        # Real estate documents
        if answers.get('Q06') == True:
            required_docs.append({
                'code': 'PROPERTY_OWNERSHIP',
                'reason': 'Property ownership declared'
            })
            property_types = answers.get('Q06a', [])
            if 'rental_property' in property_types:
                required_docs.append({
                    'code': 'RENTAL_INCOME',
                    'reason': 'Rental property declared'
                })

        # Pillar 3a documents
        if answers.get('Q07') == True:
            required_docs.append({
                'code': 'PILLAR_3A',
                'reason': 'Pillar 3a contributions declared'
            })

        # Training expenses
        if answers.get('Q08') == True:
            required_docs.append({
                'code': 'TRAINING_RECEIPTS',
                'reason': 'Professional training expenses declared'
            })

        # Medical expenses
        if answers.get('Q09') == True:
            required_docs.append({
                'code': 'MEDICAL_RECEIPTS',
                'reason': 'Medical expenses declared'
            })

        # Alimony documents
        if answers.get('Q10') == True:
            required_docs.append({
                'code': 'ALIMONY_PROOF',
                'reason': 'Alimony payments declared'
            })

        # Foreign income/assets
        if answers.get('Q11') == True or answers.get('Q12') == True:
            required_docs.append({
                'code': 'FOREIGN_TAX_STATEMENTS',
                'reason': 'Foreign income/assets declared'
            })

        # Cryptocurrency
        if answers.get('Q14') == True:
            required_docs.append({
                'code': 'CRYPTO_STATEMENTS',
                'reason': 'Cryptocurrency ownership declared'
            })

        # Save required documents to database
        self._save_required_documents(session_id, required_docs)

        return required_docs

    def _save_required_documents(self, session_id: str, required_docs: List[Dict[str, Any]]):
        """Save required documents to database"""
        # First, get document type IDs
        for doc in required_docs:
            query = """
                INSERT INTO swisstax.document_types (code, name_en, category)
                VALUES (%s, %s, 'required')
                ON CONFLICT (code) DO UPDATE SET code = EXCLUDED.code
                RETURNING id
            """
            doc_type = execute_insert(query, (doc['code'], doc['code'].replace('_', ' ').title()))

            # Save as required document
            query = """
                INSERT INTO swisstax.required_documents (session_id, document_type_id, reason)
                VALUES (%s, %s, %s)
                ON CONFLICT (session_id, document_type_id)
                DO UPDATE SET reason = EXCLUDED.reason
            """
            execute_query(query, (session_id, doc_type['id'], doc['reason']), fetch=False)