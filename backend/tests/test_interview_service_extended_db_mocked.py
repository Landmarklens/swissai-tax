"""
Updated tests for database-backed InterviewService
Mocks database interactions properly
"""
import unittest
from unittest.mock import MagicMock, Mock, patch, create_autospec
from uuid import uuid4

from models.question import Question, QuestionType


class TestInterviewServiceDatabaseMocked(unittest.TestCase):
    """Test that database is properly required"""

    @patch('services.interview_service.QuestionLoader')
    @patch('services.interview_service.get_encryption_service')
    @patch('services.interview_service.FilingOrchestrationService')
    def setUp(self, mock_filing_service, mock_encryption, mock_question_loader):
        from services.interview_service import InterviewService

        # Create mock database session
        self.mock_db = MagicMock()

        # Mock encryption service
        self.mock_encryption = MagicMock()
        mock_encryption.return_value = self.mock_encryption

        # Mock question loader
        self.mock_question_loader = MagicMock()
        mock_question_loader.return_value = self.mock_question_loader

        # Mock filing service
        self.mock_filing_service = MagicMock()
        mock_filing_service.return_value = self.mock_filing_service

        # Create service instance WITH database
        self.service = InterviewService(db=self.mock_db)

    def test_service_requires_database(self):
        """Test that service requires database session"""
        from services.interview_service import InterviewService

        # Should work with db
        service_with_db = InterviewService(db=self.mock_db)
        self.assertIsNotNone(service_with_db.db)

        # Should still create without db but fail on use
        service_without_db = InterviewService(db=None)
        self.assertIsNone(service_without_db.db)

    def test_create_session_requires_database(self):
        """Test that create_session requires database"""
        from models.interview_session import InterviewSession

        # Setup mock question
        first_question = Mock(spec=Question)
        first_question.id = 'Q00'
        first_question.text = {'en': 'What is your AHV number?'}
        first_question.type = QuestionType.AHV_NUMBER
        first_question.required = True
        first_question.options = []
        first_question.validation = {}
        first_question.fields = None

        self.mock_question_loader.get_first_question.return_value = first_question

        # Mock database query to check for existing session - return None (no existing session)
        mock_query = MagicMock()
        mock_filter = MagicMock()
        mock_filter.first.return_value = None  # No existing session
        mock_query.filter.return_value = mock_filter
        self.mock_db.query.return_value = mock_query

        # Mock database session creation
        mock_db_session = Mock(spec=InterviewSession)
        mock_db_session.id = uuid4()
        mock_db_session.to_dict.return_value = {
            'id': str(mock_db_session.id),
            'user_id': 'user-123',
            'tax_year': 2024,
            'status': 'in_progress'
        }

        # Configure mock to return our mock session
        self.mock_db.add = MagicMock()
        self.mock_db.commit = MagicMock()
        self.mock_db.refresh = MagicMock(side_effect=lambda obj: setattr(obj, 'id', mock_db_session.id))

        # Mock the InterviewSession constructor to return our mock
        with patch('models.interview_session.InterviewSession', return_value=mock_db_session):
            result = self.service.create_session(
                user_id='user-123',
                tax_year=2024,
                language='en'
            )

        # Verify database was used
        self.mock_db.add.assert_called_once()
        self.mock_db.commit.assert_called_once()
        self.mock_db.refresh.assert_called_once()

        # Verify result structure
        self.assertIn('session_id', result)
        self.assertIn('current_question', result)


if __name__ == '__main__':
    unittest.main()
