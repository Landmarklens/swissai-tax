"""
Comprehensive unit tests for Interview Service
Tests all major methods, question flow logic, encryption, and edge cases
Target: 90% coverage
"""
import json
import threading
import unittest
from datetime import datetime
from unittest.mock import MagicMock, Mock, patch
from uuid import UUID

from models.question import Question, QuestionLoader, QuestionType


class TestInterviewServiceCreate(unittest.TestCase):
    """Test suite for InterviewService.create_session"""

    @patch('services.interview_service.QuestionLoader')
    @patch('services.interview_service.get_encryption_service')
    @patch('services.interview_service.FilingOrchestrationService')
    def setUp(self, mock_filing_service, mock_encryption, mock_question_loader):
        """Set up test fixtures"""
        from services.interview_service import InterviewService

        # Mock encryption service
        self.mock_encryption = MagicMock()
        mock_encryption.return_value = self.mock_encryption

        # Mock question loader
        self.mock_question_loader = MagicMock(spec=QuestionLoader)
        mock_question_loader.return_value = self.mock_question_loader

        # Mock filing service
        self.mock_filing_service = MagicMock()
        mock_filing_service.return_value = self.mock_filing_service

        # Create service instance
        self.service = InterviewService(db=None)

    def test_create_session_success(self):
        """Test creating a new interview session successfully"""
        # Setup - mock first question (Q00 - user's AHV number)
        first_question = Mock(spec=Question)
        first_question.id = 'Q00'
        first_question.text = {'en': 'What is your AHV number?', 'de': 'Was ist Ihre AHV-Nummer?'}
        first_question.type = QuestionType.AHV_NUMBER
        first_question.required = True
        first_question.options = []
        first_question.validation = {}
        first_question.fields = None

        self.mock_question_loader.get_first_question.return_value = first_question

        # Execute
        result = self.service.create_session(
            user_id='user-123',
            tax_year=2024,
            language='en'
        )

        # Assert
        self.assertIn('session_id', result)
        self.assertIn('current_question', result)
        self.assertIn('progress', result)

        # Verify session was stored
        session_id = result['session_id']
        self.assertIn(session_id, self.service.sessions)

        # Verify session structure
        session = self.service.sessions[session_id]
        self.assertEqual(session['user_id'], 'user-123')
        self.assertEqual(session['tax_year'], 2024)
        self.assertEqual(session['language'], 'en')
        self.assertEqual(session['status'], 'in_progress')
        self.assertEqual(session['current_question_id'], 'Q00')
        self.assertEqual(session['progress'], 0)
        self.assertIsInstance(session['answers'], dict)
        self.assertIsInstance(session['completed_questions'], list)
        self.assertIsInstance(session['pending_questions'], list)

    def test_create_session_different_languages(self):
        """Test creating sessions with different languages"""
        first_question = Mock(spec=Question)
        first_question.id = 'Q00'
        first_question.text = {
            'en': 'What is your AHV number?',
            'de': 'Was ist Ihre AHV-Nummer?',
            'fr': 'Quel est votre numéro AVS?'
        }
        first_question.type = QuestionType.AHV_NUMBER
        first_question.required = True
        first_question.options = []
        first_question.validation = {}
        first_question.fields = None

        self.mock_question_loader.get_first_question.return_value = first_question

        # Test German
        result_de = self.service.create_session('user-1', 2024, 'de')
        self.assertEqual(result_de['current_question']['text'], 'Was ist Ihre AHV-Nummer?')

        # Test French
        result_fr = self.service.create_session('user-2', 2024, 'fr')
        self.assertEqual(result_fr['current_question']['text'], 'Quel est votre numéro AVS?')

        # Test English (default)
        result_en = self.service.create_session('user-3', 2024, 'en')
        self.assertEqual(result_en['current_question']['text'], 'What is your AHV number?')


class TestInterviewServiceGetSession(unittest.TestCase):
    """Test suite for InterviewService.get_session"""

    @patch('services.interview_service.QuestionLoader')
    @patch('services.interview_service.get_encryption_service')
    @patch('services.interview_service.FilingOrchestrationService')
    def setUp(self, mock_filing_service, mock_encryption, mock_question_loader):
        from services.interview_service import InterviewService

        self.mock_encryption = MagicMock()
        mock_encryption.return_value = self.mock_encryption

        self.mock_question_loader = MagicMock()
        mock_question_loader.return_value = self.mock_question_loader

        self.mock_filing_service = MagicMock()
        mock_filing_service.return_value = self.mock_filing_service

        self.service = InterviewService(db=None)

    def test_get_session_exists(self):
        """Test retrieving an existing session"""
        # Setup - manually add session
        session_id = 'test-session-123'
        self.service.sessions[session_id] = {
            'id': session_id,
            'user_id': 'user-456',
            'tax_year': 2024,
            'status': 'in_progress',
            'progress': 50
        }

        # Execute
        result = self.service.get_session(session_id)

        # Assert
        self.assertIsNotNone(result)
        self.assertEqual(result['id'], session_id)
        self.assertEqual(result['user_id'], 'user-456')
        self.assertEqual(result['progress'], 50)

    def test_get_session_not_found(self):
        """Test retrieving a non-existent session"""
        result = self.service.get_session('non-existent-session')
        self.assertIsNone(result)


class TestInterviewServiceSubmitAnswer(unittest.TestCase):
    """Test suite for InterviewService.submit_answer - core logic"""

    @patch('services.interview_service.QuestionLoader')
    @patch('services.interview_service.get_encryption_service')
    @patch('services.interview_service.FilingOrchestrationService')
    def setUp(self, mock_filing_service, mock_encryption, mock_question_loader):
        from services.interview_service import InterviewService

        self.mock_encryption = MagicMock()
        self.mock_encryption.encrypt.return_value = 'encrypted_data'
        self.mock_encryption.decrypt.return_value = 'decrypted_data'
        mock_encryption.return_value = self.mock_encryption

        self.mock_question_loader = MagicMock()
        mock_question_loader.return_value = self.mock_question_loader

        self.mock_filing_service = MagicMock()
        mock_filing_service.return_value = self.mock_filing_service

        self.service = InterviewService(db=None)

    def test_submit_answer_session_not_found(self):
        """Test submitting answer to non-existent session"""
        with self.assertRaises(ValueError) as context:
            self.service.submit_answer('non-existent', 'Q01', 'single')

        self.assertIn('Session', str(context.exception))
        self.assertIn('not found', str(context.exception))

    def test_submit_answer_session_not_in_progress(self):
        """Test submitting answer to completed session"""
        # Setup - completed session
        session_id = 'completed-session'
        self.service.sessions[session_id] = {
            'status': 'completed',
            'user_id': 'user-1',
            'current_question_id': None
        }

        # Execute & Assert
        with self.assertRaises(ValueError) as context:
            self.service.submit_answer(session_id, 'Q01', 'single')

        self.assertIn('not in progress', str(context.exception))

    def test_submit_answer_question_not_found(self):
        """Test submitting answer to non-existent question"""
        # Setup
        session_id = 'test-session'
        self.service.sessions[session_id] = {
            'status': 'in_progress',
            'user_id': 'user-1',
            'current_question_id': 'Q99',
            'answers': {},
            'completed_questions': []
        }

        self.mock_question_loader.get_question.return_value = None

        # Execute & Assert
        with self.assertRaises(ValueError) as context:
            self.service.submit_answer(session_id, 'Q99', 'answer')

        self.assertIn('Question', str(context.exception))
        self.assertIn('not found', str(context.exception))

    def test_submit_answer_invalid_answer(self):
        """Test submitting invalid answer"""
        # Setup session
        session_id = 'test-session'
        self.service.sessions[session_id] = {
            'status': 'in_progress',
            'user_id': 'user-1',
            'current_question_id': 'Q01',
            'answers': {},
            'completed_questions': [],
            'pending_questions': [],
            'language': 'en'
        }

        # Setup question with validation
        question = Mock(spec=Question)
        question.id = 'Q01'
        question.type = QuestionType.SINGLE_CHOICE
        question.validate_answer.return_value = (False, 'Invalid value')

        self.mock_question_loader.get_question.return_value = question

        # Execute
        result = self.service.submit_answer(session_id, 'Q01', 'invalid')

        # Assert
        self.assertFalse(result.get('valid'))
        self.assertIn('error', result)
        self.assertEqual(result['error'], 'Invalid value')

    def test_submit_answer_simple_flow(self):
        """Test simple answer submission and progression"""
        # Setup session
        session_id = 'test-session'
        self.service.sessions[session_id] = {
            'status': 'in_progress',
            'user_id': 'user-1',
            'tax_year': 2024,
            'current_question_id': 'Q01',
            'answers': {},
            'completed_questions': [],
            'pending_questions': [],
            'language': 'en',
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }

        # Setup current question (Q01 - single answer)
        current_question = Mock(spec=Question)
        current_question.id = 'Q01'
        current_question.type = QuestionType.SINGLE_CHOICE
        current_question.validate_answer.return_value = (True, '')
        current_question.auto_lookup = False

        # Setup next question (Q02)
        next_question = Mock(spec=Question)
        next_question.id = 'Q02'
        next_question.text = {'en': 'What is your postal code?'}
        next_question.type = QuestionType.TEXT
        next_question.required = True
        next_question.options = []
        next_question.validation = {}
        next_question.fields = None

        self.mock_question_loader.get_question.side_effect = [
            current_question,  # First call for current question
            next_question      # Second call for next question
        ]
        self.mock_question_loader.get_next_questions.return_value = ['Q02']

        # Execute
        result = self.service.submit_answer(session_id, 'Q01', 'single')

        # Assert
        self.assertFalse(result.get('error'))
        self.assertIn('current_question', result)
        self.assertEqual(result['current_question']['id'], 'Q02')
        self.assertFalse(result['complete'])

        # Verify session state
        session = self.service.sessions[session_id]
        self.assertEqual(session['answers']['Q01'], 'single')
        self.assertIn('Q01', session['completed_questions'])
        self.assertEqual(session['current_question_id'], 'Q02')


class TestInterviewServiceConditionalFlow(unittest.TestCase):
    """Test suite for conditional question flows (married, children, property)"""

    @patch('services.interview_service.QuestionLoader')
    @patch('services.interview_service.get_encryption_service')
    @patch('services.interview_service.FilingOrchestrationService')
    def setUp(self, mock_filing_service, mock_encryption, mock_question_loader):
        from services.interview_service import InterviewService

        self.mock_encryption = MagicMock()
        self.mock_encryption.encrypt.return_value = 'encrypted_data'
        mock_encryption.return_value = self.mock_encryption

        self.mock_question_loader = MagicMock()
        mock_question_loader.return_value = self.mock_question_loader

        self.mock_filing_service = MagicMock()
        mock_filing_service.return_value = self.mock_filing_service

        self.service = InterviewService(db=None)

    def test_married_flow_adds_spouse_questions(self):
        """Test Q01 = 'married' adds spouse questions Q01a, Q01c, Q01d (Q01b removed)"""
        # Setup session
        session_id = 'test-session'
        self.service.sessions[session_id] = {
            'status': 'in_progress',
            'user_id': 'user-1',
            'tax_year': 2024,
            'current_question_id': 'Q01',
            'answers': {},
            'completed_questions': [],
            'pending_questions': [],
            'language': 'en'
        }

        # Setup question
        question = Mock(spec=Question)
        question.id = 'Q01'
        question.type = QuestionType.SINGLE_CHOICE
        question.validate_answer.return_value = (True, '')
        question.auto_lookup = False

        # Setup next question (Q01a - spouse AHV number)
        next_question = Mock(spec=Question)
        next_question.id = 'Q01a'
        next_question.text = {'en': "Spouse's AHV number"}
        next_question.type = QuestionType.AHV_NUMBER
        next_question.required = True
        next_question.options = []
        next_question.validation = {}
        next_question.fields = None

        self.mock_question_loader.get_question.side_effect = [question, next_question]

        # Execute
        result = self.service.submit_answer(session_id, 'Q01', 'married')

        # Assert
        session = self.service.sessions[session_id]
        self.assertEqual(session['answers']['Q01'], 'married')
        self.assertIn('Q01', session['completed_questions'])

        # Verify spouse questions were added to pending (Q01b removed in new design)
        self.assertIn('Q01a', session['pending_questions'])  # AHV number
        self.assertIn('Q01c', session['pending_questions'])  # DOB
        self.assertIn('Q01d', session['pending_questions'])  # Employed
        # Q01b (spouse last name) no longer exists

        # Verify next question is Q01a
        self.assertEqual(result['current_question']['id'], 'Q01a')

    def test_children_yes_flow(self):
        """Test Q03 = 'yes' adds child count question"""
        # Setup session
        session_id = 'test-session'
        self.service.sessions[session_id] = {
            'status': 'in_progress',
            'user_id': 'user-1',
            'tax_year': 2024,
            'current_question_id': 'Q03',
            'answers': {},
            'completed_questions': [],
            'pending_questions': [],
            'language': 'en'
        }

        question = Mock(spec=Question)
        question.id = 'Q03'
        question.type = QuestionType.YES_NO
        question.validate_answer.return_value = (True, '')
        question.auto_lookup = False

        next_question = Mock(spec=Question)
        next_question.id = 'Q03a'
        next_question.text = {'en': 'How many children?'}
        next_question.type = QuestionType.DROPDOWN
        next_question.required = True
        next_question.options = []
        next_question.validation = {}
        next_question.fields = None

        self.mock_question_loader.get_question.side_effect = [question, next_question]

        # Execute
        result = self.service.submit_answer(session_id, 'Q03', 'yes')

        # Assert
        session = self.service.sessions[session_id]
        self.assertIn('Q03a', session['pending_questions'])
        self.assertEqual(result['current_question']['id'], 'Q03a')

    def test_children_count_and_loop(self):
        """Test Q03a sets up child details loop"""
        # Setup session
        session_id = 'test-session'
        self.service.sessions[session_id] = {
            'status': 'in_progress',
            'user_id': 'user-1',
            'tax_year': 2024,
            'current_question_id': 'Q03a',
            'answers': {'Q03': 'yes'},
            'completed_questions': ['Q03'],
            'pending_questions': [],
            'language': 'en'
        }

        question = Mock(spec=Question)
        question.id = 'Q03a'
        question.type = QuestionType.DROPDOWN
        question.validate_answer.return_value = (True, '')
        question.auto_lookup = False

        next_question = Mock(spec=Question)
        next_question.id = 'Q03b'
        next_question.text = {'en': 'Child details'}
        next_question.type = QuestionType.GROUP
        next_question.required = True
        next_question.options = []
        next_question.validation = {}
        next_question.fields = [
            {'id': 'name', 'text': {'en': 'Name'}, 'type': 'text'},
            {'id': 'dob', 'text': {'en': 'Date of birth'}, 'type': 'date'}
        ]

        self.mock_question_loader.get_question.side_effect = [question, next_question]

        # Execute - user has 2 children
        result = self.service.submit_answer(session_id, 'Q03a', 2)

        # Assert
        session = self.service.sessions[session_id]
        self.assertEqual(session['num_children'], 2)
        self.assertEqual(session['child_index'], 0)
        self.assertEqual(result['current_question']['id'], 'Q03b')

    def test_children_loop_progression(self):
        """Test child details loop through multiple children"""
        # Setup session - already on first child
        session_id = 'test-session'
        self.service.sessions[session_id] = {
            'status': 'in_progress',
            'user_id': 'user-1',
            'tax_year': 2024,
            'current_question_id': 'Q03b',
            'answers': {'Q03': 'yes', 'Q03a': 3},
            'completed_questions': ['Q03', 'Q03a'],
            'pending_questions': [],
            'num_children': 3,
            'child_index': 0,
            'language': 'en'
        }

        question = Mock(spec=Question)
        question.id = 'Q03b'
        question.type = QuestionType.GROUP
        question.validate_answer.return_value = (True, '')
        question.auto_lookup = False

        # Same question for loop
        next_question = Mock(spec=Question)
        next_question.id = 'Q03b'
        next_question.text = {'en': 'Child details'}
        next_question.type = QuestionType.GROUP
        next_question.required = True
        next_question.options = []
        next_question.validation = {}
        next_question.fields = []

        self.mock_question_loader.get_question.side_effect = [question, next_question]

        # Execute - submit first child details
        result = self.service.submit_answer(session_id, 'Q03b', {'name': 'Alice', 'dob': '2015-05-10'})

        # Assert - should loop back to Q03b for second child
        session = self.service.sessions[session_id]
        self.assertEqual(session['child_index'], 1)  # Incremented
        self.assertEqual(result['current_question']['id'], 'Q03b')

    def test_children_loop_completion(self):
        """Test child loop exits after last child"""
        # Setup session - on last child
        session_id = 'test-session'
        self.service.sessions[session_id] = {
            'status': 'in_progress',
            'user_id': 'user-1',
            'tax_year': 2024,
            'current_question_id': 'Q03b',
            'answers': {'Q03': 'yes', 'Q03a': 2},
            'completed_questions': ['Q03', 'Q03a'],
            'pending_questions': [],
            'num_children': 2,
            'child_index': 1,  # On second child (0-indexed)
            'language': 'en'
        }

        question = Mock(spec=Question)
        question.id = 'Q03b'
        question.type = QuestionType.GROUP
        question.validate_answer.return_value = (True, '')
        question.auto_lookup = False

        # Next question after children loop
        next_question = Mock(spec=Question)
        next_question.id = 'Q04'
        next_question.text = {'en': 'Number of employers'}
        next_question.type = QuestionType.NUMBER
        next_question.required = True
        next_question.options = []
        next_question.validation = {}
        next_question.fields = None

        self.mock_question_loader.get_question.side_effect = [question, next_question]

        # Execute - submit last child details
        result = self.service.submit_answer(session_id, 'Q03b', {'name': 'Bob', 'dob': '2018-03-15'})

        # Assert - should move to Q04
        session = self.service.sessions[session_id]
        self.assertEqual(session['child_index'], 2)  # Incremented past limit
        self.assertEqual(result['current_question']['id'], 'Q04')

    def test_property_ownership_flow(self):
        """Test Q06 = True adds property canton question"""
        # Setup session
        session_id = 'test-session'
        self.service.sessions[session_id] = {
            'status': 'in_progress',
            'user_id': 'user-1',
            'tax_year': 2024,
            'current_question_id': 'Q06',
            'answers': {},
            'completed_questions': [],
            'pending_questions': [],
            'language': 'en'
        }

        question = Mock(spec=Question)
        question.id = 'Q06'
        question.type = QuestionType.YES_NO
        question.validate_answer.return_value = (True, '')
        question.auto_lookup = False

        next_question = Mock(spec=Question)
        next_question.id = 'Q06a'
        next_question.text = {'en': 'Which cantons?'}
        next_question.type = QuestionType.SINGLE_CHOICE
        next_question.required = True
        next_question.options = []
        next_question.validation = {}
        next_question.fields = None

        self.mock_question_loader.get_question.side_effect = [question, next_question]

        # Execute
        result = self.service.submit_answer(session_id, 'Q06', True)

        # Assert
        session = self.service.sessions[session_id]
        self.assertIn('Q06a', session['pending_questions'])
        self.assertEqual(result['current_question']['id'], 'Q06a')

    def test_multi_canton_filing_creation(self):
        """Test Q06a creates secondary filings for property cantons"""
        # Setup session with filing_id
        session_id = 'test-session'
        self.service.sessions[session_id] = {
            'status': 'in_progress',
            'user_id': 'user-1',
            'tax_year': 2024,
            'current_question_id': 'Q06a',
            'answers': {'Q06': True},
            'completed_questions': ['Q06'],
            'pending_questions': [],
            'filing_id': 'primary-filing-123',
            'language': 'en'
        }

        question = Mock(spec=Question)
        question.id = 'Q06a'
        question.type = QuestionType.TEXT
        question.validate_answer.return_value = (True, '')
        question.auto_lookup = False

        next_question = Mock(spec=Question)
        next_question.id = 'Q06b'
        next_question.text = {'en': 'Property details'}
        next_question.type = QuestionType.TEXT
        next_question.required = True
        next_question.options = []
        next_question.validation = {}
        next_question.fields = None

        # Mock secondary filings
        mock_secondary_filing_1 = Mock()
        mock_secondary_filing_1.id = 'secondary-filing-ge'
        mock_secondary_filing_1.canton = 'GE'

        mock_secondary_filing_2 = Mock()
        mock_secondary_filing_2.id = 'secondary-filing-vs'
        mock_secondary_filing_2.canton = 'VS'

        self.mock_filing_service.auto_create_secondary_filings.return_value = [
            mock_secondary_filing_1,
            mock_secondary_filing_2
        ]

        self.mock_question_loader.get_question.side_effect = [question, next_question]

        # Execute - answer with multiple cantons
        result = self.service.submit_answer(session_id, 'Q06a', ['GE', 'VS'])

        # Assert
        session = self.service.sessions[session_id]
        self.assertEqual(session['property_cantons'], ['GE', 'VS'])
        self.assertIn('secondary_filing_ids', session)
        self.assertEqual(len(session['secondary_filing_ids']), 2)

        # Verify filing service was called
        self.mock_filing_service.auto_create_secondary_filings.assert_called_once_with(
            primary_filing_id='primary-filing-123',
            property_cantons=['GE', 'VS']
        )

        # Verify multi-canton info in response
        self.assertIn('multi_canton_filings', result)
        self.assertEqual(result['multi_canton_filings']['count'], 2)


class TestInterviewServiceEncryption(unittest.TestCase):
    """Test suite for encryption of sensitive questions"""

    @patch('services.interview_service.QuestionLoader')
    @patch('services.interview_service.get_encryption_service')
    @patch('services.interview_service.FilingOrchestrationService')
    def setUp(self, mock_filing_service, mock_encryption, mock_question_loader):
        from services.interview_service import InterviewService

        self.mock_encryption = MagicMock()
        self.mock_encryption.encrypt.return_value = 'encrypted_value_xyz'
        self.mock_encryption.decrypt.return_value = 'decrypted_value_abc'
        mock_encryption.return_value = self.mock_encryption

        self.mock_question_loader = MagicMock()
        mock_question_loader.return_value = self.mock_question_loader

        self.mock_filing_service = MagicMock()
        mock_filing_service.return_value = self.mock_filing_service

        self.service = InterviewService(db=None)

    def test_is_question_sensitive(self):
        """Test _is_question_sensitive identifies sensitive questions"""
        # Sensitive questions (NEW: 5 questions are sensitive)
        self.assertTrue(self.service._is_question_sensitive('Q00'))   # User's own AHV number
        self.assertTrue(self.service._is_question_sensitive('Q01a'))  # Spouse AHV number
        self.assertTrue(self.service._is_question_sensitive('Q01c'))  # Spouse DOB
        self.assertTrue(self.service._is_question_sensitive('Q02a'))  # Municipality
        self.assertTrue(self.service._is_question_sensitive('Q03b'))  # Child details

        # No longer sensitive (document uploads now, not manual entry)
        self.assertFalse(self.service._is_question_sensitive('Q01b'))  # Removed
        self.assertFalse(self.service._is_question_sensitive('Q08a'))  # Document upload
        self.assertFalse(self.service._is_question_sensitive('Q11a'))  # Document upload
        self.assertFalse(self.service._is_question_sensitive('Q12a'))  # Document upload
        self.assertFalse(self.service._is_question_sensitive('Q13a'))  # Document upload

        # Non-sensitive questions
        self.assertFalse(self.service._is_question_sensitive('Q01'))   # Civil status
        self.assertFalse(self.service._is_question_sensitive('Q02'))   # Postal code
        self.assertFalse(self.service._is_question_sensitive('Q03'))   # Has children
        self.assertFalse(self.service._is_question_sensitive('Q04'))   # Number of employers

    def test_encrypt_sensitive_answer(self):
        """Test that sensitive answers are encrypted"""
        # Setup session
        session_id = 'test-session'
        self.service.sessions[session_id] = {
            'status': 'in_progress',
            'user_id': 'user-1',
            'tax_year': 2024,
            'current_question_id': 'Q01a',
            'answers': {},
            'completed_questions': [],
            'pending_questions': ['Q01c', 'Q01d'],  # Changed: removed Q01b
            'language': 'en'
        }

        # Setup sensitive question (spouse AHV number - changed from first name)
        question = Mock(spec=Question)
        question.id = 'Q01a'
        question.type = QuestionType.AHV_NUMBER
        question.validate_answer.return_value = (True, '')
        question.auto_lookup = False

        next_question = Mock(spec=Question)
        next_question.id = 'Q01c'  # Changed: Q01b no longer exists, go to Q01c
        next_question.text = {'en': "Spouse's date of birth"}
        next_question.type = QuestionType.DATE
        next_question.required = True
        next_question.options = []
        next_question.validation = {}
        next_question.fields = None

        self.mock_question_loader.get_question.side_effect = [question, next_question]

        # Execute - submit valid AHV number
        ahv_number = '756.1234.5678.97'
        result = self.service.submit_answer(session_id, 'Q01a', ahv_number)

        # Assert
        session = self.service.sessions[session_id]

        # Verify encryption was called with AHV number
        self.mock_encryption.encrypt.assert_called_with(ahv_number)

        # Verify encrypted value was stored (not plain text)
        self.assertEqual(session['answers']['Q01a'], 'encrypted_value_xyz')
        self.assertNotEqual(session['answers']['Q01a'], ahv_number)

    def test_no_encryption_for_non_sensitive(self):
        """Test that non-sensitive answers are not encrypted"""
        # Setup session
        session_id = 'test-session'
        self.service.sessions[session_id] = {
            'status': 'in_progress',
            'user_id': 'user-1',
            'tax_year': 2024,
            'current_question_id': 'Q01',
            'answers': {},
            'completed_questions': [],
            'pending_questions': [],
            'language': 'en'
        }

        question = Mock(spec=Question)
        question.id = 'Q01'
        question.type = QuestionType.SINGLE_CHOICE
        question.validate_answer.return_value = (True, '')
        question.auto_lookup = False

        next_question = Mock(spec=Question)
        next_question.id = 'Q02'
        next_question.text = {'en': 'Postal code'}
        next_question.type = QuestionType.TEXT
        next_question.required = True
        next_question.options = []
        next_question.validation = {}
        next_question.fields = None

        self.mock_question_loader.get_question.side_effect = [question, next_question]
        self.mock_question_loader.get_next_questions.return_value = ['Q02']

        # Execute
        result = self.service.submit_answer(session_id, 'Q01', 'single')

        # Assert
        session = self.service.sessions[session_id]

        # Verify encryption was NOT called
        self.mock_encryption.encrypt.assert_not_called()

        # Verify plain value was stored
        self.assertEqual(session['answers']['Q01'], 'single')

    def test_decrypt_answers_for_profile(self):
        """Test _decrypt_answers_for_profile decrypts sensitive answers"""
        # Setup answers with mix of encrypted and plain
        answers = {
            'Q01': 'married',  # Non-sensitive (plain)
            'Q01a': 'encrypted_ahv',  # Sensitive (encrypted) - Changed: now AHV number
            'Q01c': 'encrypted_dob',  # Sensitive (encrypted) - Spouse DOB
            'Q02': '8000',  # Non-sensitive (plain)
            'Q02a': 'encrypted_municipality'  # Sensitive (encrypted)
        }

        self.mock_encryption.decrypt.side_effect = [
            '756.1234.5678.97',  # Decrypted Q01a (AHV)
            '1980-05-15',        # Decrypted Q01c (DOB)
            'Zurich'             # Decrypted Q02a (municipality)
        ]

        # Execute
        decrypted = self.service._decrypt_answers_for_profile(answers)

        # Assert
        self.assertEqual(decrypted['Q01'], 'married')  # Plain stays plain
        self.assertEqual(decrypted['Q01a'], '756.1234.5678.97')  # AHV decrypted
        self.assertEqual(decrypted['Q01c'], '1980-05-15')  # DOB decrypted
        self.assertEqual(decrypted['Q02'], '8000')     # Plain stays plain
        self.assertEqual(decrypted['Q02a'], 'Zurich')  # Municipality decrypted


class TestInterviewServiceProfileGeneration(unittest.TestCase):
    """Test suite for _generate_profile"""

    @patch('services.interview_service.QuestionLoader')
    @patch('services.interview_service.get_encryption_service')
    @patch('services.interview_service.FilingOrchestrationService')
    def setUp(self, mock_filing_service, mock_encryption, mock_question_loader):
        from services.interview_service import InterviewService

        self.mock_encryption = MagicMock()
        self.mock_encryption.decrypt.side_effect = lambda x: f'decrypted_{x}'
        mock_encryption.return_value = self.mock_encryption

        self.mock_question_loader = MagicMock()
        mock_question_loader.return_value = self.mock_question_loader

        self.mock_filing_service = MagicMock()
        mock_filing_service.return_value = self.mock_filing_service

        self.service = InterviewService(db=None)

    def test_generate_profile_single_person(self):
        """Test profile generation for single person"""
        answers = {
            'Q01': 'single',
            'Q02': 'ZH',
            'Q02a': 'Zurich',
            'Q03': 'no',
            'Q04': 1,
            'Q05': 'no',
            'Q06': 'no',
            'Q07': 'yes',
            'Q08': 'no',
            'Q09': 'no',
            'Q10': 'no',
            'Q11': 'no',
            'Q12': 'no',
            'Q13': 'no',
            'Q14': 'none'
        }

        # Execute
        profile = self.service._generate_profile(answers)

        # Assert
        self.assertEqual(profile['civil_status'], 'single')
        self.assertEqual(profile['canton'], 'ZH')
        self.assertFalse(profile['has_children'])
        self.assertEqual(profile['num_children'], 0)
        self.assertEqual(profile['num_employers'], 1)
        self.assertFalse(profile['unemployment_benefits'])
        self.assertFalse(profile['owns_property'])
        self.assertFalse(profile['charitable_donations'])

    def test_generate_profile_married_with_spouse(self):
        """Test profile generation for married person with spouse details"""
        answers = {
            'Q01': 'married',
            'Q01a': 'encrypted_ahv',  # Changed: AHV number instead of first name
            'Q01c': 'encrypted_1980-05-15',
            'Q01d': 'yes',
            'Q02': 'GE',
            'Q02a': 'encrypted_Geneva',  # This is also sensitive
            'Q03': 'no'
        }

        # Mock decryption - called in dict iteration order: Q01a, Q01c, Q02a
        self.mock_encryption.decrypt.side_effect = [
            '756.1234.5678.97',  # Q01a AHV
            '1980-05-15',        # Q01c DOB
            'Geneva',            # Q02a municipality
        ]

        # Execute
        profile = self.service._generate_profile(answers)

        # Assert
        self.assertEqual(profile['civil_status'], 'married')
        self.assertEqual(profile['municipality'], 'Geneva')
        self.assertIn('spouse', profile)
        self.assertEqual(profile['spouse']['ahv_number'], '756.1234.5678.97')  # NEW
        self.assertEqual(profile['spouse']['date_of_birth'], '1980-05-15')
        self.assertTrue(profile['spouse']['is_employed'])
        # REMOVED: first_name, last_name no longer exist

    def test_generate_profile_with_children(self):
        """Test profile generation with children"""
        answers = {
            'Q01': 'single',
            'Q02': 'ZH',
            'Q03': 'yes',
            'Q03a': '2'
        }

        # Execute
        profile = self.service._generate_profile(answers)

        # Assert
        self.assertTrue(profile['has_children'])
        self.assertEqual(profile['num_children'], 2)

    def test_generate_profile_with_document_flags(self):
        """Test profile generation with document upload flags (amounts come from documents)"""
        answers = {
            'Q01': 'single',
            'Q08': 'yes',  # Has pillar 3a - document will be uploaded
            'Q11': 'yes',  # Has donations - document will be uploaded
            'Q12': 'yes',  # Pays alimony - document will be uploaded
            'Q13': 'yes'   # Has medical expenses - document will be uploaded
        }

        # Execute
        profile = self.service._generate_profile(answers)

        # Assert - flags are set but no amounts (amounts come from AI-extracted documents)
        self.assertTrue(profile['pillar_3a_contribution'])
        self.assertTrue(profile['charitable_donations'])
        self.assertTrue(profile['pays_alimony'])
        self.assertTrue(profile['medical_expenses'])
        # No longer in profile: pillar_3a_amount, donation_amount, alimony_amount, medical_expense_amount


class TestInterviewServiceCompletion(unittest.TestCase):
    """Test suite for interview completion flow"""

    @patch('services.interview_service.QuestionLoader')
    @patch('services.interview_service.get_encryption_service')
    @patch('services.interview_service.FilingOrchestrationService')
    def setUp(self, mock_filing_service, mock_encryption, mock_question_loader):
        from services.interview_service import InterviewService

        self.mock_encryption = MagicMock()
        self.mock_encryption.decrypt.side_effect = lambda x: x
        mock_encryption.return_value = self.mock_encryption

        self.mock_question_loader = MagicMock()
        mock_question_loader.return_value = self.mock_question_loader

        self.mock_filing_service = MagicMock()
        mock_filing_service.return_value = self.mock_filing_service

        self.service = InterviewService(db=None)

    def test_interview_completion(self):
        """Test interview marks complete when no next question"""
        # Setup session on last question
        session_id = 'test-session'
        self.service.sessions[session_id] = {
            'status': 'in_progress',
            'user_id': 'user-1',
            'tax_year': 2024,
            'current_question_id': 'Q14',
            'answers': {
                'Q01': 'single',
                'Q02': 'ZH',
                'Q03': 'no'
            },
            'completed_questions': ['Q01', 'Q02', 'Q03'],
            'pending_questions': [],
            'language': 'en'
        }

        question = Mock(spec=Question)
        question.id = 'Q14'
        question.type = QuestionType.SINGLE_CHOICE
        question.validate_answer.return_value = (True, '')
        question.auto_lookup = False

        self.mock_question_loader.get_question.return_value = question
        self.mock_question_loader.get_next_questions.return_value = []
        self.mock_question_loader.get_document_requirements.return_value = [
            {'type': 'passport', 'description': 'Passport copy'}
        ]

        # Execute
        result = self.service.submit_answer(session_id, 'Q14', 'none')

        # Assert
        self.assertTrue(result['complete'])
        self.assertEqual(result['progress'], 100)
        self.assertIn('profile', result)
        self.assertIn('document_requirements', result)

        # Verify session status
        session = self.service.sessions[session_id]
        self.assertEqual(session['status'], 'completed')
        self.assertIsNone(session['current_question_id'])

    def test_resume_completed_session(self):
        """Test resuming a completed session returns profile"""
        # Setup completed session
        session_id = 'completed-session'
        self.service.sessions[session_id] = {
            'status': 'completed',
            'user_id': 'user-1',
            'tax_year': 2024,
            'current_question_id': None,
            'answers': {
                'Q01': 'single',
                'Q02': 'ZH',
                'Q03': 'no'
            },
            'completed_questions': [],
            'language': 'en'
        }

        self.mock_question_loader.get_document_requirements.return_value = []

        # Execute
        result = self.service.resume_session(session_id)

        # Assert
        self.assertTrue(result['complete'])
        self.assertIn('profile', result)
        self.assertIn('document_requirements', result)

    def test_resume_in_progress_session(self):
        """Test resuming an in-progress session returns current question"""
        # Setup in-progress session
        session_id = 'in-progress-session'
        self.service.sessions[session_id] = {
            'status': 'in_progress',
            'user_id': 'user-1',
            'tax_year': 2024,
            'current_question_id': 'Q05',
            'answers': {
                'Q01': 'single',
                'Q02': 'ZH'
            },
            'progress': 25,
            'language': 'en'
        }

        current_question = Mock(spec=Question)
        current_question.id = 'Q05'
        current_question.text = {'en': 'Unemployment benefits?'}
        current_question.type = QuestionType.YES_NO
        current_question.required = True
        current_question.options = []
        current_question.validation = {}
        current_question.fields = None

        self.mock_question_loader.get_question.return_value = current_question

        # Execute
        result = self.service.resume_session(session_id)

        # Assert
        self.assertEqual(result['session_id'], session_id)
        self.assertFalse(result['complete'])
        self.assertEqual(result['current_question']['id'], 'Q05')
        self.assertEqual(result['progress'], 25)
        self.assertIn('answers', result)

    def test_resume_nonexistent_session(self):
        """Test resuming non-existent session raises error"""
        with self.assertRaises(ValueError) as context:
            self.service.resume_session('nonexistent-session')

        self.assertIn('not found', str(context.exception))


class TestInterviewServiceSaveSession(unittest.TestCase):
    """Test suite for save_session"""

    @patch('services.interview_service.QuestionLoader')
    @patch('services.interview_service.get_encryption_service')
    @patch('services.interview_service.FilingOrchestrationService')
    def setUp(self, mock_filing_service, mock_encryption, mock_question_loader):
        from services.interview_service import InterviewService

        self.mock_encryption = MagicMock()
        mock_encryption.return_value = self.mock_encryption

        self.mock_question_loader = MagicMock()
        mock_question_loader.return_value = self.mock_question_loader

        self.mock_filing_service = MagicMock()
        mock_filing_service.return_value = self.mock_filing_service

        self.service = InterviewService(db=None)

    def test_save_session_success(self):
        """Test saving session progress"""
        # Setup existing session
        session_id = 'test-session'
        self.service.sessions[session_id] = {
            'user_id': 'user-1',
            'answers': {'Q01': 'single'},
            'progress': 10,
            'updated_at': '2024-01-01T00:00:00'
        }

        # Execute
        result = self.service.save_session(
            session_id=session_id,
            answers={'Q02': 'ZH', 'Q03': 'no'},
            progress=30
        )

        # Assert
        self.assertIsNotNone(result)
        self.assertEqual(result['session_id'], session_id)
        self.assertIn('saved_at', result)
        self.assertEqual(result['answers_count'], 3)  # Q01 + Q02 + Q03
        self.assertEqual(result['progress'], 30)

        # Verify session was updated
        session = self.service.sessions[session_id]
        self.assertEqual(session['answers']['Q02'], 'ZH')
        self.assertEqual(session['answers']['Q03'], 'no')
        self.assertEqual(session['progress'], 30)

    def test_save_session_not_found(self):
        """Test saving non-existent session returns None"""
        result = self.service.save_session('nonexistent', {'Q01': 'test'}, 10)
        self.assertIsNone(result)

    def test_save_session_thread_safe(self):
        """Test save_session is thread-safe with lock"""
        # Setup session
        session_id = 'test-session'
        self.service.sessions[session_id] = {
            'user_id': 'user-1',
            'answers': {},
            'progress': 0
        }

        # Simulate concurrent saves
        results = []

        def save_data(answer_key, answer_value):
            result = self.service.save_session(
                session_id=session_id,
                answers={answer_key: answer_value},
                progress=10
            )
            results.append(result)

        # Create threads
        threads = [
            threading.Thread(target=save_data, args=('Q01', 'single')),
            threading.Thread(target=save_data, args=('Q02', 'ZH')),
            threading.Thread(target=save_data, args=('Q03', 'no'))
        ]

        # Start all threads
        for t in threads:
            t.start()

        # Wait for completion
        for t in threads:
            t.join()

        # Assert all saves succeeded
        self.assertEqual(len(results), 3)
        for result in results:
            self.assertIsNotNone(result)

        # Verify all answers were saved
        session = self.service.sessions[session_id]
        self.assertEqual(len(session['answers']), 3)


class TestInterviewServicePostalCodeLookup(unittest.TestCase):
    """Test suite for postal code auto-lookup functionality"""

    @patch('services.interview_service.QuestionLoader')
    @patch('services.interview_service.get_encryption_service')
    @patch('services.interview_service.FilingOrchestrationService')
    @patch('services.interview_service.get_postal_code_service')
    def setUp(self, mock_postal_service, mock_filing_service, mock_encryption, mock_question_loader):
        from services.interview_service import InterviewService

        self.mock_encryption = MagicMock()
        mock_encryption.return_value = self.mock_encryption

        self.mock_question_loader = MagicMock()
        mock_question_loader.return_value = self.mock_question_loader

        self.mock_filing_service = MagicMock()
        mock_filing_service.return_value = self.mock_filing_service

        self.mock_postal_service = MagicMock()
        mock_postal_service.return_value = self.mock_postal_service

        self.service = InterviewService(db=None)

    @patch('services.interview_service.get_postal_code_service')
    def test_postal_code_auto_lookup_q02(self, mock_get_postal_service):
        """Test postal code auto-lookup for primary residence (Q02)"""
        # Setup session
        session_id = 'test-session'
        self.service.sessions[session_id] = {
            'status': 'in_progress',
            'user_id': 'user-1',
            'tax_year': 2024,
            'current_question_id': 'Q02',
            'answers': {},
            'completed_questions': [],
            'pending_questions': [],
            'language': 'en'
        }

        # Setup question with auto_lookup
        question = Mock(spec=Question)
        question.id = 'Q02'
        question.type = QuestionType.POSTAL_CODE
        question.validate_answer.return_value = (True, '')
        question.auto_lookup = True

        next_question = Mock(spec=Question)
        next_question.id = 'Q03'
        next_question.text = {'en': 'Do you have children?'}
        next_question.type = QuestionType.YES_NO
        next_question.required = True
        next_question.options = []
        next_question.validation = {}
        next_question.fields = None

        # Mock postal code service
        mock_postal_service_instance = MagicMock()
        mock_postal_service_instance.lookup_postal_code.return_value = {
            'postal_code': '8000',
            'canton': 'ZH',
            'municipality': 'Zurich'
        }
        mock_get_postal_service.return_value = mock_postal_service_instance

        self.mock_question_loader.get_question.side_effect = [question, next_question]
        self.mock_question_loader.get_next_questions.return_value = ['Q03']

        # Execute
        result = self.service.submit_answer(session_id, 'Q02', '8000')

        # Assert
        session = self.service.sessions[session_id]

        # Verify location data was stored
        self.assertIn('Q02_location', session)
        self.assertEqual(session['Q02_location']['canton'], 'ZH')
        self.assertEqual(session['Q02_location']['municipality'], 'Zurich')

        # Verify primary location was set
        self.assertEqual(session['primary_canton'], 'ZH')
        self.assertEqual(session['primary_municipality'], 'Zurich')
        self.assertEqual(session['primary_postal_code'], '8000')

    @patch('services.interview_service.get_postal_code_service')
    def test_postal_code_auto_lookup_q02b_secondary(self, mock_get_postal_service):
        """Test postal code auto-lookup for secondary residence (Q02b)"""
        # Setup session
        session_id = 'test-session'
        self.service.sessions[session_id] = {
            'status': 'in_progress',
            'user_id': 'user-1',
            'tax_year': 2024,
            'current_question_id': 'Q02b',
            'answers': {'Q02': '8000'},
            'completed_questions': ['Q02'],
            'pending_questions': [],
            'primary_canton': 'ZH',
            'language': 'en'
        }

        question = Mock(spec=Question)
        question.id = 'Q02b'
        question.type = QuestionType.POSTAL_CODE
        question.validate_answer.return_value = (True, '')
        question.auto_lookup = True

        next_question = Mock(spec=Question)
        next_question.id = 'Q03'
        next_question.text = {'en': 'Next question'}
        next_question.type = QuestionType.TEXT
        next_question.required = True
        next_question.options = []
        next_question.validation = {}
        next_question.fields = None

        # Mock postal code service for secondary location
        mock_postal_service_instance = MagicMock()
        mock_postal_service_instance.lookup_postal_code.return_value = {
            'postal_code': '1200',
            'canton': 'GE',
            'municipality': 'Geneva'
        }
        mock_get_postal_service.return_value = mock_postal_service_instance

        self.mock_question_loader.get_question.side_effect = [question, next_question]
        self.mock_question_loader.get_next_questions.return_value = ['Q03']

        # Execute
        result = self.service.submit_answer(session_id, 'Q02b', '1200')

        # Assert
        session = self.service.sessions[session_id]

        # Verify secondary location was set
        self.assertIn('Q02b_location', session)
        self.assertEqual(session['secondary_canton'], 'GE')
        self.assertEqual(session['secondary_municipality'], 'Geneva')
        self.assertEqual(session['secondary_postal_code'], '1200')

        # Verify primary location still exists
        self.assertEqual(session['primary_canton'], 'ZH')


class TestInterviewServiceProgressCalculation(unittest.TestCase):
    """Test suite for progress calculation logic"""

    @patch('services.interview_service.QuestionLoader')
    @patch('services.interview_service.get_encryption_service')
    @patch('services.interview_service.FilingOrchestrationService')
    def setUp(self, mock_filing_service, mock_encryption, mock_question_loader):
        from services.interview_service import InterviewService

        self.mock_encryption = MagicMock()
        mock_encryption.return_value = self.mock_encryption

        self.mock_question_loader = MagicMock()
        mock_question_loader.return_value = self.mock_question_loader

        self.mock_filing_service = MagicMock()
        mock_filing_service.return_value = self.mock_filing_service

        self.service = InterviewService(db=None)

    def test_progress_calculation_single_person(self):
        """Test progress calculation for single person (14 base questions)"""
        # Setup session with some completed questions
        session_id = 'test-session'
        self.service.sessions[session_id] = {
            'status': 'in_progress',
            'user_id': 'user-1',
            'tax_year': 2024,
            'current_question_id': 'Q04',
            'answers': {
                'Q01': 'single',
                'Q02': '8000',
                'Q03': 'no'
            },
            'completed_questions': ['Q01', 'Q02', 'Q03'],
            'pending_questions': [],
            'language': 'en'
        }

        question = Mock(spec=Question)
        question.id = 'Q04'
        question.type = QuestionType.DROPDOWN
        question.validate_answer.return_value = (True, '')
        question.auto_lookup = False

        next_question = Mock(spec=Question)
        next_question.id = 'Q05'
        next_question.text = {'en': 'Next'}
        next_question.type = QuestionType.TEXT
        next_question.required = True
        next_question.options = []
        next_question.validation = {}
        next_question.fields = None

        self.mock_question_loader.get_question.side_effect = [question, next_question]
        self.mock_question_loader.get_next_questions.return_value = ['Q05']

        # Execute
        result = self.service.submit_answer(session_id, 'Q04', '1')

        # Assert - 4 completed out of 14 = ~28%
        self.assertGreater(result['progress'], 20)
        self.assertLess(result['progress'], 35)

    def test_progress_calculation_married_person(self):
        """Test progress calculation for married person (18 questions total)"""
        # Setup session with married status
        session_id = 'test-session'
        self.service.sessions[session_id] = {
            'status': 'in_progress',
            'user_id': 'user-1',
            'tax_year': 2024,
            'current_question_id': 'Q04',
            'answers': {
                'Q01': 'married',  # This adds 4 spouse questions
                'Q02': '8000',
                'Q03': 'no'
            },
            'completed_questions': ['Q01', 'Q02', 'Q03'],
            'pending_questions': [],
            'language': 'en'
        }

        question = Mock(spec=Question)
        question.id = 'Q04'
        question.type = QuestionType.DROPDOWN
        question.validate_answer.return_value = (True, '')
        question.auto_lookup = False

        next_question = Mock(spec=Question)
        next_question.id = 'Q05'
        next_question.text = {'en': 'Next'}
        next_question.type = QuestionType.TEXT
        next_question.required = True
        next_question.options = []
        next_question.validation = {}
        next_question.fields = None

        self.mock_question_loader.get_question.side_effect = [question, next_question]
        self.mock_question_loader.get_next_questions.return_value = ['Q05']

        # Execute
        result = self.service.submit_answer(session_id, 'Q04', '1')

        # Assert - 4 completed out of 18 (14 + 4 spouse) = ~22%
        self.assertGreater(result['progress'], 15)
        self.assertLess(result['progress'], 30)


class TestInterviewServiceEdgeCases(unittest.TestCase):
    """Test suite for edge cases and error handling"""

    @patch('services.interview_service.QuestionLoader')
    @patch('services.interview_service.get_encryption_service')
    @patch('services.interview_service.FilingOrchestrationService')
    def setUp(self, mock_filing_service, mock_encryption, mock_question_loader):
        from services.interview_service import InterviewService

        self.mock_encryption = MagicMock()
        self.mock_encryption.decrypt.side_effect = Exception('Decryption failed')
        mock_encryption.return_value = self.mock_encryption

        self.mock_question_loader = MagicMock()
        mock_question_loader.return_value = self.mock_question_loader

        self.mock_filing_service = MagicMock()
        mock_filing_service.return_value = self.mock_filing_service

        self.service = InterviewService(db=None)

    def test_decryption_failure_graceful_handling(self):
        """Test that decryption failures don't break profile generation"""
        answers = {
            'Q01': 'married',
            'Q01a': 'encrypted_name_that_fails_to_decrypt'
        }

        # Execute - should not raise exception
        profile = self.service._generate_profile(answers)

        # Assert - should still generate profile with encrypted value
        self.assertEqual(profile['civil_status'], 'married')
        # Original encrypted value should be preserved on failure
        self.assertIn('spouse', profile)

    def test_children_count_invalid_number(self):
        """Test invalid number for children count"""
        # Setup session
        session_id = 'test-session'
        self.service.sessions[session_id] = {
            'status': 'in_progress',
            'user_id': 'user-1',
            'tax_year': 2024,
            'current_question_id': 'Q03a',
            'answers': {'Q03': 'yes'},
            'completed_questions': ['Q03'],
            'pending_questions': [],
            'language': 'en'
        }

        question = Mock(spec=Question)
        question.id = 'Q03a'
        question.type = QuestionType.DROPDOWN
        question.validate_answer.return_value = (True, '')  # Passes validation
        question.auto_lookup = False

        self.mock_question_loader.get_question.return_value = question

        # Execute with invalid number
        result = self.service.submit_answer(session_id, 'Q03a', 'not_a_number')

        # Assert - should return error
        self.assertIn('error', result)
        self.assertIn('Invalid number', result['error'])

    def test_multi_canton_filing_creation_failure(self):
        """Test graceful handling when secondary filing creation fails"""
        # Setup session
        session_id = 'test-session'
        self.service.sessions[session_id] = {
            'status': 'in_progress',
            'user_id': 'user-1',
            'tax_year': 2024,
            'current_question_id': 'Q06a',
            'answers': {'Q06': True},
            'completed_questions': ['Q06'],
            'pending_questions': [],
            'filing_id': 'primary-filing-123',
            'language': 'en'
        }

        question = Mock(spec=Question)
        question.id = 'Q06a'
        question.type = QuestionType.TEXT
        question.validate_answer.return_value = (True, '')
        question.auto_lookup = False

        next_question = Mock(spec=Question)
        next_question.id = 'Q06b'
        next_question.text = {'en': 'Property details'}
        next_question.type = QuestionType.TEXT
        next_question.required = True
        next_question.options = []
        next_question.validation = {}
        next_question.fields = None

        # Mock filing service to raise exception
        self.mock_filing_service.auto_create_secondary_filings.side_effect = Exception('Database error')

        self.mock_question_loader.get_question.side_effect = [question, next_question]

        # Execute - should not raise exception
        result = self.service.submit_answer(session_id, 'Q06a', ['GE', 'VS'])

        # Assert - interview should continue despite filing creation failure
        self.assertEqual(result['current_question']['id'], 'Q06b')
        self.assertNotIn('multi_canton_filings', result)  # Should not be included


if __name__ == '__main__':
    unittest.main()
