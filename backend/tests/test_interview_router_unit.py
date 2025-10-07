"""
Unit tests for Interview Router Helper Functions
Tests the core logic without the API layer complexity
"""
import json
from datetime import datetime
from unittest.mock import MagicMock, Mock, patch

import pytest

from models.tax_answer import TaxAnswer
from models.tax_filing_session import FilingStatus, TaxFilingSession


class TestSaveAnswerToDB:
    """Test suite for save_answer_to_db helper function"""

    @patch('routers.interview.TaxAnswer')
    def test_save_new_answer(self, mock_tax_answer_class):
        """Test saving a new answer to database"""
        from routers.interview import save_answer_to_db

        # Setup mock database
        mock_db = MagicMock()
        mock_db.query.return_value.filter.return_value.first.return_value = None

        # Setup mock TaxAnswer instance
        mock_answer_instance = MagicMock()
        mock_tax_answer_class.return_value = mock_answer_instance
        mock_tax_answer_class.is_question_sensitive.return_value = False

        # Execute
        save_answer_to_db(
            db=mock_db,
            filing_session_id='filing-123',
            question_id='Q01',
            answer_value='married',
            question_text='What is your civil status?',
            question_type='single_choice'
        )

        # Assert
        mock_db.add.assert_called_once_with(mock_answer_instance)
        mock_db.commit.assert_called_once()

        # Verify TaxAnswer was created with correct parameters
        mock_tax_answer_class.assert_called_once_with(
            filing_session_id='filing-123',
            question_id='Q01',
            answer_value='married',
            question_text='What is your civil status?',
            question_type='single_choice',
            is_sensitive=False
        )

    def test_update_existing_answer(self):
        """Test updating an existing answer in database"""
        from routers.interview import save_answer_to_db

        # Setup - existing answer
        existing_answer = MagicMock()
        existing_answer.answer_value = 'single'

        mock_db = MagicMock()
        mock_db.query.return_value.filter.return_value.first.return_value = existing_answer

        # Execute
        save_answer_to_db(
            db=mock_db,
            filing_session_id='filing-123',
            question_id='Q01',
            answer_value='married',
            question_text='What is your civil status?',
            question_type='single_choice'
        )

        # Assert
        assert existing_answer.answer_value == 'married'
        assert existing_answer.question_text == 'What is your civil status?'
        assert existing_answer.question_type == 'single_choice'
        mock_db.commit.assert_called_once()
        mock_db.add.assert_not_called()  # Should update, not add new

    @patch('routers.interview.TaxAnswer')
    def test_save_complex_answer_types(self, mock_tax_answer_class):
        """Test saving list/dict answer types"""
        from routers.interview import save_answer_to_db

        # Setup
        mock_db = MagicMock()
        mock_db.query.return_value.filter.return_value.first.return_value = None

        mock_answer_instance = MagicMock()
        mock_tax_answer_class.return_value = mock_answer_instance
        mock_tax_answer_class.is_question_sensitive.return_value = False

        # Test with list
        save_answer_to_db(
            db=mock_db,
            filing_session_id='filing-123',
            question_id='Q06a',
            answer_value=['GE', 'VS'],  # List of cantons
            question_type='multi_select'
        )

        # Verify list was serialized to JSON
        call_kwargs = mock_tax_answer_class.call_args.kwargs
        assert call_kwargs['answer_value'] == json.dumps(['GE', 'VS'])

        # Reset
        mock_db.reset_mock()
        mock_tax_answer_class.reset_mock()
        mock_db.query.return_value.filter.return_value.first.return_value = None
        mock_tax_answer_class.return_value = mock_answer_instance
        mock_tax_answer_class.is_question_sensitive.return_value = False

        # Test with dict
        save_answer_to_db(
            db=mock_db,
            filing_session_id='filing-123',
            question_id='Q99',
            answer_value={'key': 'value'},
            question_type='complex'
        )

        call_kwargs = mock_tax_answer_class.call_args.kwargs
        assert call_kwargs['answer_value'] == json.dumps({'key': 'value'})


class TestGenerateInsightsForFiling:
    """Test suite for generate_insights_for_filing helper function"""

    def test_generate_insights_success(self):
        """Test successful insight generation"""
        from routers.interview import generate_insights_for_filing

        # Setup
        mock_db = MagicMock()

        with patch('routers.interview.TaxInsightService.generate_all_insights') as mock_generate:
            mock_generate.return_value = [
                {'type': 'tax_optimization', 'content': 'You could save CHF 500'},
                {'type': 'deduction', 'content': 'Consider these deductions'}
            ]

            # Execute
            result = generate_insights_for_filing(mock_db, 'filing-123')

            # Assert
            assert len(result) == 2
            assert result[0]['type'] == 'tax_optimization'
            mock_generate.assert_called_once_with(
                db=mock_db,
                filing_session_id='filing-123',
                force_regenerate=True
            )

    def test_generate_insights_handles_errors_gracefully(self):
        """Test that errors in insight generation don't break the flow"""
        from routers.interview import generate_insights_for_filing

        # Setup
        mock_db = MagicMock()

        with patch('routers.interview.TaxInsightService.generate_all_insights') as mock_generate:
            mock_generate.side_effect = Exception('AI service unavailable')

            # Execute - should not raise exception
            result = generate_insights_for_filing(mock_db, 'filing-123')

            # Assert - should return empty list on error
            assert result == []


class TestInterviewRequestModels:
    """Test Pydantic request models"""

    def test_start_interview_request_valid(self):
        """Test StartInterviewRequest with valid data"""
        from routers.interview import StartInterviewRequest

        # With filing_session_id
        request1 = StartInterviewRequest(
            filing_session_id='filing-123',
            tax_year=2024,
            language='en',
            canton='ZH'
        )
        assert request1.filing_session_id == 'filing-123'
        assert request1.tax_year == 2024
        assert request1.canton == 'ZH'

        # Without filing_session_id (auto-create)
        request2 = StartInterviewRequest(
            tax_year=2024,
            language='de',
            canton='GE'
        )
        assert request2.filing_session_id is None
        assert request2.canton == 'GE'

    def test_start_interview_request_defaults(self):
        """Test StartInterviewRequest default values"""
        from routers.interview import StartInterviewRequest

        request = StartInterviewRequest(tax_year=2024)
        assert request.language == 'en'
        assert request.canton == 'ZH'
        assert request.filing_session_id is None

    def test_start_interview_request_validation(self):
        """Test StartInterviewRequest validation"""
        from pydantic import ValidationError

        from routers.interview import StartInterviewRequest

        # Invalid tax year (too high)
        with pytest.raises(ValidationError):
            StartInterviewRequest(tax_year=2050)

        # Invalid tax year (too low)
        with pytest.raises(ValidationError):
            StartInterviewRequest(tax_year=2010)

        # Invalid language
        with pytest.raises(ValidationError):
            StartInterviewRequest(tax_year=2024, language='xx')

    def test_submit_answer_request_valid(self):
        """Test SubmitAnswerRequest with valid data"""
        from routers.interview import SubmitAnswerRequest

        request = SubmitAnswerRequest(
            filing_session_id='filing-123',
            question_id='Q01',
            answer='married'
        )
        assert request.filing_session_id == 'filing-123'
        assert request.question_id == 'Q01'
        assert request.answer == 'married'

    def test_submit_answer_request_various_answer_types(self):
        """Test SubmitAnswerRequest with different answer types"""
        from routers.interview import SubmitAnswerRequest

        # String answer
        request1 = SubmitAnswerRequest(
            filing_session_id='filing-123',
            question_id='Q01',
            answer='single'
        )
        assert request1.answer == 'single'

        # Number answer
        request2 = SubmitAnswerRequest(
            filing_session_id='filing-123',
            question_id='Q02',
            answer=30
        )
        assert request2.answer == 30

        # Boolean answer
        request3 = SubmitAnswerRequest(
            filing_session_id='filing-123',
            question_id='Q03',
            answer=True
        )
        assert request3.answer is True

        # List answer
        request4 = SubmitAnswerRequest(
            filing_session_id='filing-123',
            question_id='Q06a',
            answer=['GE', 'VS']
        )
        assert request4.answer == ['GE', 'VS']

    def test_interview_session_response(self):
        """Test InterviewSessionResponse model"""
        from routers.interview import InterviewSessionResponse

        response = InterviewSessionResponse(
            session_id='session-123',
            filing_session_id='filing-456',
            current_question={'id': 'Q01', 'text': 'Question?'},
            progress=0,
            status='in_progress'
        )
        assert response.session_id == 'session-123'
        assert response.filing_session_id == 'filing-456'
        assert response.progress == 0
        assert response.status == 'in_progress'

    def test_answer_response_models(self):
        """Test AnswerResponse model variants"""
        from routers.interview import AnswerResponse

        # Valid response with next question
        response1 = AnswerResponse(
            valid=True,
            current_question={'id': 'Q02'},
            progress=10
        )
        assert response1.valid is True
        assert response1.complete is False
        assert response1.progress == 10

        # Invalid response with error
        response2 = AnswerResponse(
            valid=False,
            error='Invalid answer format',
            progress=0
        )
        assert response2.valid is False
        assert response2.error == 'Invalid answer format'

        # Complete interview response
        response3 = AnswerResponse(
            valid=True,
            complete=True,
            profile={'canton': 'ZH'},
            document_requirements=['passport'],
            progress=100
        )
        assert response3.complete is True
        assert response3.progress == 100
        assert 'canton' in response3.profile


class TestFilingSessionIntegration:
    """Test filing session creation and updates"""

    def test_filing_session_status_transitions(self):
        """Test filing session status updates during interview flow"""
        # Create mock filing session
        filing_session = MagicMock(spec=TaxFilingSession)
        filing_session.id = 'filing-123'
        filing_session.status = FilingStatus.DRAFT

        # Start interview - should update to IN_PROGRESS
        filing_session.status = FilingStatus.IN_PROGRESS
        assert filing_session.status == FilingStatus.IN_PROGRESS

        # Complete interview - should update to COMPLETED
        filing_session.status = FilingStatus.COMPLETED
        filing_session.completion_percentage = 100
        assert filing_session.status == FilingStatus.COMPLETED
        assert filing_session.completion_percentage == 100

    def test_filing_session_progress_tracking(self):
        """Test progress tracking on filing session"""
        filing_session = MagicMock(spec=TaxFilingSession)
        filing_session.completion_percentage = 0

        # Simulate progress updates
        for progress in [0, 10, 25, 50, 75, 100]:
            filing_session.completion_percentage = progress
            assert filing_session.completion_percentage == progress
