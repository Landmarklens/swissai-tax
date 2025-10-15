"""
Unit tests for Interview Router
Tests API endpoints for interview management
"""
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, Mock, patch

import pytest
from fastapi.testclient import TestClient

from main import app
from models.tax_filing_session import FilingStatus, TaxFilingSession


@pytest.fixture
def mock_user():
    """Mock user for authentication"""
    user = MagicMock()
    user.id = 'user-123'
    user.email = 'test@example.com'
    return user


@pytest.fixture
def mock_db_session():
    """Mock database session"""
    return MagicMock()


@pytest.fixture
def client(mock_user, mock_db_session):
    """Create test client with mocked dependencies"""
    from core.security import get_current_user
    from db.session import get_db

    def override_get_current_user():
        return mock_user

    def override_get_db():
        yield mock_db_session

    app.dependency_overrides[get_current_user] = override_get_current_user
    app.dependency_overrides[get_db] = override_get_db

    test_client = TestClient(app)
    yield test_client

    # Clean up overrides
    app.dependency_overrides.clear()


@pytest.fixture
def mock_filing_session():
    """Mock filing session"""
    filing_session = MagicMock(spec=TaxFilingSession)
    filing_session.id = 'filing-session-123'
    filing_session.user_id = 'user-123'
    filing_session.tax_year = 2024
    filing_session.canton = 'ZH'
    filing_session.status = FilingStatus.IN_PROGRESS
    filing_session.current_question_id = None
    filing_session.completion_percentage = 0
    return filing_session


@pytest.fixture
def mock_interview_service():
    """Mock interview service"""
    # Patch the InterviewService class where it's used in the router
    with patch('routers.interview.InterviewService') as MockInterviewService:
        mock_instance = MagicMock()
        MockInterviewService.return_value = mock_instance
        yield mock_instance


class TestInterviewRouter:
    """Test suite for interview router endpoints"""

    def test_start_interview_without_filing_session_id(self, client, mock_db_session, mock_interview_service, mock_filing_session):
        """Test POST /api/interview/start - auto-creates filing session"""
        # Setup
        mock_db_session.query.return_value.filter.return_value.first.return_value = mock_filing_session

        with patch('services.tax_filing_service.TaxFilingService.create_filing') as mock_create:
            mock_create.return_value = mock_filing_session

            mock_interview_service.create_session.return_value = {
                'session_id': 'interview-session-456',
                'current_question': {
                    'id': 'Q01',
                    'text': 'What is your civil status?',
                    'type': 'single_choice',
                    'options': [
                        {'value': 'single', 'label': 'Single'},
                        {'value': 'married', 'label': 'Married'}
                    ]
                },
                'progress': 0
            }

            # Execute
            response = client.post(
                '/api/interview/start',
                json={
                    'tax_year': 2024,
                    'language': 'en',
                    'canton': 'ZH'
                },
                headers={'Authorization': 'Bearer fake-token'}
            )

            # Assert
            assert response.status_code == 201
            data = response.json()
            assert data['session_id'] == 'interview-session-456'
            assert data['filing_session_id'] == 'filing-session-123'
            assert data['current_question']['id'] == 'Q01'
            assert data['progress'] == 0
            assert data['status'] == 'in_progress'

            # Verify filing session was created
            mock_create.assert_called_once()
            call_kwargs = mock_create.call_args.kwargs
            assert call_kwargs['user_id'] == 'user-123'
            assert call_kwargs['tax_year'] == 2024
            assert call_kwargs['canton'] == 'ZH'
            assert call_kwargs['is_primary'] is True

    def test_start_interview_with_existing_filing_session_id(self, client, mock_db_session, mock_interview_service, mock_filing_session):
        """Test POST /api/interview/start - with existing filing session"""
        # Setup
        mock_db_session.query.return_value.filter.return_value.first.return_value = mock_filing_session

        mock_interview_service.create_session.return_value = {
            'session_id': 'interview-session-789',
            'current_question': {
                'id': 'Q01',
                'text': 'What is your civil status?',
                'type': 'single_choice',
                'options': []
            },
            'progress': 0
        }

        # Execute
        response = client.post(
            '/api/interview/start',
            json={
                'filing_session_id': 'filing-session-123',
                'tax_year': 2024,
                'language': 'en',
                'canton': 'ZH'
            },
            headers={'Authorization': 'Bearer fake-token'}
        )

        # Assert
        assert response.status_code == 201
        data = response.json()
        assert data['session_id'] == 'interview-session-789'
        assert data['filing_session_id'] == 'filing-session-123'

        # Verify filing session was NOT created (used existing)
        mock_db_session.query.assert_called()

    def test_start_interview_filing_session_not_found(self, client, mock_db_session, mock_interview_service):
        """Test POST /api/interview/start - filing session not found"""
        # Setup - filing session doesn't exist
        mock_db_session.query.return_value.filter.return_value.first.return_value = None

        # Execute
        response = client.post(
            '/api/interview/start',
            json={
                'filing_session_id': 'non-existent-filing',
                'tax_year': 2024,
                'language': 'en'
            },
            headers={'Authorization': 'Bearer fake-token'}
        )

        # Assert
        assert response.status_code == 404
        assert 'Filing session not found' in response.json()['detail']

    def test_submit_answer_success(self, client, mock_db_session, mock_interview_service, mock_filing_session):
        """Test POST /api/interview/{session_id}/answer - successful submission"""
        # Setup
        mock_db_session.query.return_value.filter.return_value.first.return_value = mock_filing_session

        mock_interview_service.submit_answer.return_value = {
            'valid': True,
            'current_question': {
                'id': 'Q02',
                'text': 'What is your age?',
                'type': 'number'
            },
            'progress': 10,
            'complete': False
        }

        # Execute
        response = client.post(
            '/api/interview/interview-session-123/answer',
            json={
                'filing_session_id': 'filing-session-123',
                'question_id': 'Q01',
                'answer': 'married'
            },
            headers={'Authorization': 'Bearer fake-token'}
        )

        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data['valid'] is True
        assert data['current_question']['id'] == 'Q02'
        assert data['progress'] == 10
        assert data['complete'] is False

        # Verify interview service was called
        mock_interview_service.submit_answer.assert_called_once_with(
            session_id='interview-session-123',
            question_id='Q01',
            answer='married'
        )

    def test_submit_answer_invalid(self, client, mock_db_session, mock_interview_service, mock_filing_session):
        """Test POST /api/interview/{session_id}/answer - invalid answer"""
        # Setup
        mock_db_session.query.return_value.filter.return_value.first.return_value = mock_filing_session

        mock_interview_service.submit_answer.return_value = {
            'valid': False,
            'error': 'Invalid answer format'
        }

        # Execute
        response = client.post(
            '/api/interview/interview-session-123/answer',
            json={
                'filing_session_id': 'filing-session-123',
                'question_id': 'Q05',
                'answer': 'invalid-value'
            },
            headers={'Authorization': 'Bearer fake-token'}
        )

        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data['valid'] is False
        assert data['error'] == 'Invalid answer format'

    def test_submit_answer_complete_interview(self, client, mock_db_session, mock_interview_service, mock_filing_session):
        """Test POST /api/interview/{session_id}/answer - interview completion"""
        # Setup
        mock_db_session.query.return_value.filter.return_value.first.return_value = mock_filing_session

        with patch('routers.interview.generate_insights_for_filing') as mock_insights:
            mock_insights.return_value = []

            mock_interview_service.submit_answer.return_value = {
                'valid': True,
                'complete': True,
                'profile': {'civil_status': 'married', 'canton': 'ZH'},
                'document_requirements': ['passport', 'income_statement'],
                'progress': 100
            }

            # Execute
            response = client.post(
                '/api/interview/interview-session-123/answer',
                json={
                    'filing_session_id': 'filing-session-123',
                    'question_id': 'Q14',
                    'answer': 'yes'
                },
                headers={'Authorization': 'Bearer fake-token'}
            )

            # Assert
            assert response.status_code == 200
            data = response.json()
            assert data['valid'] is True
            assert data['complete'] is True
            assert data['progress'] == 100
            assert 'profile' in data
            assert 'document_requirements' in data

            # Verify filing session status was updated
            assert mock_filing_session.status == FilingStatus.COMPLETED
            assert mock_filing_session.completion_percentage == 100

    def test_submit_answer_filing_session_not_found(self, client, mock_db_session, mock_interview_service):
        """Test POST /api/interview/{session_id}/answer - filing session not found"""
        # Setup
        mock_db_session.query.return_value.filter.return_value.first.return_value = None

        # Execute
        response = client.post(
            '/api/interview/interview-session-123/answer',
            json={
                'filing_session_id': 'non-existent-filing',
                'question_id': 'Q01',
                'answer': 'test'
            },
            headers={'Authorization': 'Bearer fake-token'}
        )

        # Assert
        assert response.status_code == 404
        assert 'Filing session not found' in response.json()['detail']

    def test_get_session_success(self, client, mock_db_session, mock_interview_service):
        """Test GET /api/interview/{session_id}"""
        # Setup
        mock_interview_service.get_session.return_value = {
            'id': 'interview-session-123',
            'status': 'in_progress',
            'current_question_id': 'Q05',
            'progress': 35
        }

        # Execute
        response = client.get(
            '/api/interview/interview-session-123',
            headers={'Authorization': 'Bearer fake-token'}
        )

        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data['id'] == 'interview-session-123'
        assert data['status'] == 'in_progress'
        assert data['progress'] == 35

    def test_get_session_not_found(self, client, mock_db_session, mock_interview_service):
        """Test GET /api/interview/{session_id} - session not found"""
        # Setup
        mock_interview_service.get_session.return_value = None

        # Execute
        response = client.get(
            '/api/interview/non-existent-session',
            headers={'Authorization': 'Bearer fake-token'}
        )

        # Assert
        assert response.status_code == 404
        assert 'Session' in response.json()['detail']
        assert 'not found' in response.json()['detail']

    def test_save_session_success(self, client, mock_db_session, mock_interview_service):
        """Test POST /api/interview/{session_id}/save"""
        # Setup
        mock_interview_service.save_session.return_value = {
            'success': True,
            'saved_at': '2024-10-06T12:00:00Z'
        }

        # Execute
        response = client.post(
            '/api/interview/interview-session-123/save',
            json={
                'answers': {'Q01': 'married', 'Q02': 30},
                'progress': 25
            },
            headers={'Authorization': 'Bearer fake-token'}
        )

        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        assert 'saved_at' in data

    def test_start_interview_invalid_tax_year(self, client, mock_db_session):
        """Test POST /api/interview/start - invalid tax year"""
        # Execute
        response = client.post(
            '/api/interview/start',
            json={
                'tax_year': 2050,  # Invalid future year
                'language': 'en'
            },
            headers={'Authorization': 'Bearer fake-token'}
        )

        # Assert
        assert response.status_code == 422  # Validation error

    def test_start_interview_invalid_language(self, client, mock_db_session):
        """Test POST /api/interview/start - invalid language"""
        # Execute
        response = client.post(
            '/api/interview/start',
            json={
                'tax_year': 2024,
                'language': 'xx'  # Invalid language code
            },
            headers={'Authorization': 'Bearer fake-token'}
        )

        # Assert
        assert response.status_code == 422  # Validation error


class TestSaveAnswerToDB:
    """Test suite for save_answer_to_db helper function"""

    def test_save_new_answer(self, mock_db_session):
        """Test saving a new answer to database"""
        from models.tax_answer import TaxAnswer
        from routers.interview import save_answer_to_db

        # Setup
        mock_db_session.query.return_value.filter.return_value.first.return_value = None

        # Execute
        save_answer_to_db(
            db=mock_db_session,
            filing_session_id='filing-123',
            question_id='Q01',
            answer_value='married',
            question_text='What is your civil status?',
            question_type='single_choice'
        )

        # Assert
        mock_db_session.add.assert_called_once()
        mock_db_session.commit.assert_called_once()

    def test_update_existing_answer(self, mock_db_session):
        """Test updating an existing answer in database"""
        from routers.interview import save_answer_to_db

        # Setup - existing answer
        existing_answer = MagicMock()
        mock_db_session.query.return_value.filter.return_value.first.return_value = existing_answer

        # Execute
        save_answer_to_db(
            db=mock_db_session,
            filing_session_id='filing-123',
            question_id='Q01',
            answer_value='single',
            question_text='What is your civil status?',
            question_type='single_choice'
        )

        # Assert
        assert existing_answer.answer_value == 'single'
        mock_db_session.commit.assert_called_once()
        mock_db_session.add.assert_not_called()  # Should update, not add new


class TestGetFilingAnswers:
    """Test suite for get_filing_answers endpoint"""

    def test_get_filing_answers_success(self, client, mock_db_session, mock_filing_session):
        """Test GET /api/interview/filings/{filing_session_id}/answers - success"""
        from models.tax_answer import TaxAnswer

        # Setup - mock filing session
        mock_db_session.query.return_value.filter.return_value.first.return_value = mock_filing_session

        # Setup - mock answers
        mock_answer1 = MagicMock(spec=TaxAnswer)
        mock_answer1.question_id = 'Q01'
        mock_answer1.answer_value = 'married'

        mock_answer2 = MagicMock(spec=TaxAnswer)
        mock_answer2.question_id = 'Q02'
        mock_answer2.answer_value = '30'

        mock_answer3 = MagicMock(spec=TaxAnswer)
        mock_answer3.question_id = 'Q03'
        mock_answer3.answer_value = '["income_from_employment", "rental_income"]'

        # Mock the query chain for answers
        mock_query = MagicMock()
        mock_query.filter.return_value.all.return_value = [mock_answer1, mock_answer2, mock_answer3]

        # Setup mock_db_session to return filing_session first, then answers
        call_count = [0]

        def query_side_effect(*args):
            call_count[0] += 1
            if call_count[0] == 1:
                # First call: query for TaxFilingSession
                return mock_db_session.query.return_value
            else:
                # Second call: query for TaxAnswer
                return mock_query

        mock_db_session.query.side_effect = query_side_effect

        # Execute
        response = client.get(
            '/api/interview/filings/filing-session-123/answers',
            headers={'Authorization': 'Bearer fake-token'}
        )

        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data['filing_session_id'] == 'filing-session-123'
        assert data['count'] == 3
        assert data['answers']['Q01'] == 'married'
        assert data['answers']['Q02'] == '30'
        assert data['answers']['Q03'] == ["income_from_employment", "rental_income"]

    def test_get_filing_answers_filing_not_found(self, client, mock_db_session):
        """Test GET /api/interview/filings/{filing_session_id}/answers - filing not found"""
        # Setup - filing session doesn't exist
        mock_db_session.query.return_value.filter.return_value.first.return_value = None

        # Execute
        response = client.get(
            '/api/interview/filings/non-existent-filing/answers',
            headers={'Authorization': 'Bearer fake-token'}
        )

        # Assert
        assert response.status_code == 404
        assert 'Filing session not found' in response.json()['detail']

    def test_get_filing_answers_no_answers(self, client, mock_db_session, mock_filing_session):
        """Test GET /api/interview/filings/{filing_session_id}/answers - no answers yet"""
        # Setup - filing session exists but no answers
        mock_db_session.query.return_value.filter.return_value.first.return_value = mock_filing_session

        # Mock the query chain for answers to return empty list
        mock_query = MagicMock()
        mock_query.filter.return_value.all.return_value = []

        # Setup mock_db_session to return filing_session first, then empty answers
        call_count = [0]

        def query_side_effect(*args):
            call_count[0] += 1
            if call_count[0] == 1:
                # First call: query for TaxFilingSession
                return mock_db_session.query.return_value
            else:
                # Second call: query for TaxAnswer
                return mock_query

        mock_db_session.query.side_effect = query_side_effect

        # Execute
        response = client.get(
            '/api/interview/filings/filing-session-123/answers',
            headers={'Authorization': 'Bearer fake-token'}
        )

        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data['filing_session_id'] == 'filing-session-123'
        assert data['count'] == 0
        assert data['answers'] == {}
