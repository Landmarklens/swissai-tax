"""
Unit tests for Interview Router
Tests API endpoints for interview management
"""
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, Mock, patch

import pytest

from models.tax_filing_session import FilingStatus, TaxFilingSession


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
    with patch('routers.interview.interview_service') as mock:
        yield mock


class TestInterviewRouter:
    """Test suite for interview router endpoints"""

    def test_start_interview_without_filing_session_id(self, client, mock_auth, mock_db, mock_interview_service, mock_filing_session):
        """Test POST /api/interview/start - auto-creates filing session"""
        # Setup
        mock_db.query.return_value.filter.return_value.first.return_value = mock_filing_session

        with patch('routers.interview.TaxFilingService.create_filing') as mock_create:
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

    def test_start_interview_with_existing_filing_session_id(self, client, mock_auth, mock_db, mock_interview_service, mock_filing_session):
        """Test POST /api/interview/start - with existing filing session"""
        # Setup
        mock_db.query.return_value.filter.return_value.first.return_value = mock_filing_session

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
        mock_db.query.assert_called()

    def test_start_interview_filing_session_not_found(self, client, mock_auth, mock_db, mock_interview_service):
        """Test POST /api/interview/start - filing session not found"""
        # Setup - filing session doesn't exist
        mock_db.query.return_value.filter.return_value.first.return_value = None

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

    def test_submit_answer_success(self, client, mock_auth, mock_db, mock_interview_service, mock_filing_session):
        """Test POST /api/interview/{session_id}/answer - successful submission"""
        # Setup
        mock_db.query.return_value.filter.return_value.first.return_value = mock_filing_session

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

    def test_submit_answer_invalid(self, client, mock_auth, mock_db, mock_interview_service, mock_filing_session):
        """Test POST /api/interview/{session_id}/answer - invalid answer"""
        # Setup
        mock_db.query.return_value.filter.return_value.first.return_value = mock_filing_session

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

    def test_submit_answer_complete_interview(self, client, mock_auth, mock_db, mock_interview_service, mock_filing_session):
        """Test POST /api/interview/{session_id}/answer - interview completion"""
        # Setup
        mock_db.query.return_value.filter.return_value.first.return_value = mock_filing_session

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

    def test_submit_answer_filing_session_not_found(self, client, mock_auth, mock_db, mock_interview_service):
        """Test POST /api/interview/{session_id}/answer - filing session not found"""
        # Setup
        mock_db.query.return_value.filter.return_value.first.return_value = None

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

    def test_get_session_success(self, client, mock_auth, mock_db, mock_interview_service):
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

    def test_get_session_not_found(self, client, mock_auth, mock_db, mock_interview_service):
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

    def test_save_session_success(self, client, mock_auth, mock_db, mock_interview_service):
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

    def test_start_interview_invalid_tax_year(self, client, mock_auth, mock_db):
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

    def test_start_interview_invalid_language(self, client, mock_auth, mock_db):
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

    def test_save_new_answer(self, mock_db):
        """Test saving a new answer to database"""
        from models.tax_answer import TaxAnswer
        from routers.interview import save_answer_to_db

        # Setup
        mock_db.query.return_value.filter.return_value.first.return_value = None

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
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()

    def test_update_existing_answer(self, mock_db):
        """Test updating an existing answer in database"""
        from routers.interview import save_answer_to_db

        # Setup - existing answer
        existing_answer = MagicMock()
        mock_db.query.return_value.filter.return_value.first.return_value = existing_answer

        # Execute
        save_answer_to_db(
            db=mock_db,
            filing_session_id='filing-123',
            question_id='Q01',
            answer_value='single',
            question_text='What is your civil status?',
            question_type='single_choice'
        )

        # Assert
        assert existing_answer.answer_value == 'single'
        mock_db.commit.assert_called_once()
        mock_db.add.assert_not_called()  # Should update, not add new
