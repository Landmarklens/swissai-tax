"""
Integration tests for Tax Filing Router
Tests API endpoints for filing management

NOTE: These tests require database access and are marked as integration tests.
They are skipped by default. To run them, use:
    pytest -m integration
or set environment variable:
    RUN_INTEGRATION_TESTS=1 pytest
"""
import os
from datetime import datetime
from unittest.mock import MagicMock, Mock, patch
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from main import app
from models.tax_filing_session import FilingStatus, TaxFilingSession
from models.swisstax import User

# Mark all tests in this module as integration tests
pytestmark = pytest.mark.integration


def mock_user():
    """Create a mock user object with valid UUID"""
    user = User(
        id=str(uuid4()),  # Use valid UUID
        email='test@example.com',
        is_active=True
    )
    return user


@pytest.fixture
def client():
    """Create test client with mocked authentication"""
    # Override the dependency - tax_filing router uses core.security.get_current_user
    from core.security import get_current_user

    app.dependency_overrides[get_current_user] = lambda: mock_user()

    client = TestClient(app)
    yield client

    # Clean up
    app.dependency_overrides.clear()


@pytest.fixture
def mock_db():
    """Mock database session"""
    with patch('routers.swisstax.filing.get_db') as mock:
        db = MagicMock()
        mock.return_value = db
        yield db


class TestTaxFilingRouter:
    """Test suite for tax filing router endpoints"""

    def test_list_filings_success(self, client, mock_db):
        """Test GET /api/tax-filing/filings"""
        # Setup
        with patch('routers.swisstax.filing.list_user_filings') as mock_list:
            with patch('routers.swisstax.filing.get_filing_statistics') as mock_stats:
                mock_list.return_value = {
                    2024: [{'id': 'f1', 'name': '2024 Tax Return'}]
                }
                mock_stats.return_value = {'total_filings': 1}

                # Execute
                response = client.get('/api/tax-filing/filings')

                # Assert
                assert response.status_code == 200
                data = response.json()
                assert 'filings' in data
                assert 'statistics' in data
                assert data['total_filings'] == 1

    def test_list_filings_with_filters(self, client, mock_db):
        """Test GET /api/tax-filing/filings with filters"""
        # Setup
        with patch('routers.swisstax.filing.list_user_filings') as mock_list:
            with patch('routers.swisstax.filing.get_filing_statistics') as mock_stats:
                mock_list.return_value = {2024: []}
                mock_stats.return_value = {}

                # Execute
                response = client.get('/api/tax-filing/filings?year=2024&canton=ZH')

                # Assert
                assert response.status_code == 200
                mock_list.assert_called_once()
                call_kwargs = mock_list.call_args.kwargs
                assert call_kwargs['year'] == 2024
                assert call_kwargs['canton'] == 'ZH'

    def test_create_filing_success(self, client, mock_db):
        """Test POST /api/tax-filing/filings"""
        # Setup
        mock_filing = TaxFilingSession(
            id='new-filing',
            user_id=str(uuid4()),
            tax_year=2024,
            canton='ZH',
            status=FilingStatus.DRAFT
        )

        with patch('routers.swisstax.filing.create_filing') as mock_create:
            with patch('routers.swisstax.filing.AuditLogService.log_tax_filing_created', create=True) as mock_audit:
                mock_create.return_value = mock_filing

                # Execute
                response = client.post(
                    '/api/tax-filing/filings',
                    json={
                        'tax_year': 2024,
                        'canton': 'ZH',
                        'language': 'en',
                        'is_primary': True
                    }
                )

                # Assert
                assert response.status_code == 201
                data = response.json()
                assert data['id'] == 'new-filing'

    def test_create_filing_validation_error(self, client, mock_db):
        """Test POST /api/tax-filing/filings with invalid data"""
        # Execute - invalid year
        response = client.post(
            '/api/tax-filing/filings',
            json={
                'tax_year': 2050,  # Too far in future
                'canton': 'ZH'
            }
        )

        # Assert
        assert response.status_code == 422  # Validation error

    def test_create_filing_duplicate_error(self, client, mock_db):
        """Test POST /api/tax-filing/filings with duplicate"""
        # Setup
        with patch('routers.swisstax.filing.create_filing') as mock_create:
            mock_create.side_effect = ValueError("Filing already exists")

            # Execute
            response = client.post(
                '/api/tax-filing/filings',
                json={
                    'tax_year': 2024,
                    'canton': 'ZH',
                    'language': 'en'
                }
            )

            # Assert
            assert response.status_code == 400
            assert 'already exists' in response.json()['detail']

    def test_copy_filing_success(self, client, mock_db):
        """Test POST /api/tax-filing/filings/copy"""
        # Setup
        mock_filing = TaxFilingSession(
            id='copied-filing',
            user_id=str(uuid4()),
            tax_year=2025,
            canton='ZH',
            source_filing_id='source-filing'
        )

        # Mock the get_filing call that happens before copying
        source_filing = TaxFilingSession(
            id='source-filing',
            user_id=str(uuid4()),
            tax_year=2024,
            canton='ZH'
        )

        with patch('routers.swisstax.filing.get_filing') as mock_get:
            with patch('routers.swisstax.filing.copy_from_previous_year') as mock_copy:
                with patch('routers.swisstax.filing.AuditLogService.log_tax_filing_copied', create=True) as mock_audit:
                    mock_get.return_value = source_filing
                    mock_copy.return_value = mock_filing

                    # Execute
                    response = client.post(
                        '/api/tax-filing/filings/copy',
                        json={
                            'source_filing_id': 'source-filing',
                            'new_year': 2025
                        }
                    )

                    # Assert
                    assert response.status_code == 201
                    data = response.json()
                    assert data['id'] == 'copied-filing'
                    assert data['source_filing_id'] == 'source-filing'

    def test_get_filing_success(self, client, mock_db):
        """Test GET /api/tax-filing/filings/{filing_id}"""
        # Setup
        mock_filing = TaxFilingSession(
            id='filing-123',
            user_id=str(uuid4()),
            tax_year=2024,
            canton='ZH'
        )
        # Add relationship attributes to avoid AttributeError
        mock_filing.insights = []
        mock_filing.answers = []
        mock_filing.calculations = []

        with patch('routers.swisstax.filing.get_filing') as mock_get:
            mock_get.return_value = mock_filing

            # Execute
            response = client.get('/api/tax-filing/filings/filing-123')

            # Assert
            assert response.status_code == 200
            data = response.json()
            assert data['id'] == 'filing-123'

    def test_get_filing_not_found(self, client, mock_db):
        """Test GET /api/tax-filing/filings/{filing_id} not found"""
        # Setup
        with patch('routers.swisstax.filing.get_filing') as mock_get:
            mock_get.side_effect = ValueError("Filing not found")

            # Execute
            response = client.get('/api/tax-filing/filings/nonexistent')

            # Assert
            assert response.status_code == 404

    def test_update_filing_success(self, client, mock_db):
        """Test PATCH /api/tax-filing/filings/{filing_id}"""
        # Setup
        user_id = str(uuid4())
        old_filing = TaxFilingSession(
            id='filing-123',
            user_id=user_id,
            tax_year=2024,
            canton='ZH',
            status='draft'
        )

        updated_filing = TaxFilingSession(
            id='filing-123',
            user_id=user_id,
            tax_year=2024,
            canton='ZH',
            name='Updated Name',
            completion_percentage=50,
            status='draft'
        )

        with patch('routers.swisstax.filing.get_filing') as mock_get:
            with patch('routers.swisstax.filing.update_filing') as mock_update:
                with patch('routers.swisstax.filing.AuditLogService.log_tax_filing_updated', create=True) as mock_audit:
                    mock_get.return_value = old_filing
                    mock_update.return_value = updated_filing

                    # Execute
                    response = client.patch(
                        '/api/tax-filing/filings/filing-123',
                        json={
                            'name': 'Updated Name',
                            'completion_percentage': 50
                        }
                    )

                    # Assert
                    assert response.status_code == 200
                    data = response.json()
                    assert data['name'] == 'Updated Name'
                    assert data['completion_percentage'] == 50

    def test_update_filing_no_fields(self, client, mock_db):
        """Test PATCH with no fields to update"""
        # Execute
        with patch('routers.swisstax.filing.get_filing') as mock_get:
            response = client.patch(
                '/api/tax-filing/filings/filing-123',
                json={}
            )

            # Assert
            assert response.status_code == 400
            assert 'No fields to update' in response.json()['detail']

    def test_delete_filing_soft_delete(self, client, mock_db):
        """Test DELETE /api/tax-filing/filings/{filing_id} soft delete"""
        # Setup
        filing = TaxFilingSession(
            id='filing-123',
            user_id=str(uuid4()),
            tax_year=2024,
            canton='ZH'
        )

        with patch('routers.swisstax.filing.get_filing') as mock_get:
            with patch('routers.swisstax.filing.delete_filing') as mock_delete:
                with patch('routers.swisstax.filing.AuditLogService.log_tax_filing_deleted', create=True) as mock_audit:
                    mock_get.return_value = filing
                    mock_delete.return_value = True

                    # Execute
                    response = client.delete('/api/tax-filing/filings/filing-123')

                    # Assert
                    assert response.status_code == 204
                    mock_delete.assert_called_once()
                    call_kwargs = mock_delete.call_args.kwargs
                    assert call_kwargs['hard_delete'] is False

    def test_delete_filing_hard_delete(self, client, mock_db):
        """Test DELETE with hard_delete=true"""
        # Setup
        filing = TaxFilingSession(
            id='filing-123',
            user_id=str(uuid4()),
            tax_year=2024,
            canton='ZH'
        )

        with patch('routers.swisstax.filing.get_filing') as mock_get:
            with patch('routers.swisstax.filing.delete_filing') as mock_delete:
                with patch('routers.swisstax.filing.AuditLogService.log_tax_filing_deleted', create=True) as mock_audit:
                    mock_get.return_value = filing
                    mock_delete.return_value = True

                    # Execute
                    response = client.delete('/api/tax-filing/filings/filing-123?hard_delete=true')

                    # Assert
                    assert response.status_code == 204
                    call_kwargs = mock_delete.call_args.kwargs
                    assert call_kwargs['hard_delete'] is True

    def test_restore_filing_success(self, client, mock_db):
        """Test POST /api/tax-filing/filings/{filing_id}/restore"""
        # Setup
        mock_filing = TaxFilingSession(
            id='filing-123',
            user_id=str(uuid4()),
            tax_year=2024,
            canton='ZH',
            deleted_at=None
        )

        with patch('routers.swisstax.filing.restore_filing') as mock_restore:
            with patch('routers.swisstax.filing.AuditLogService.log_tax_filing_restored', create=True) as mock_audit:
                mock_restore.return_value = mock_filing

                # Execute
                response = client.post('/api/tax-filing/filings/filing-123/restore')

                # Assert
                assert response.status_code == 200
                data = response.json()
                assert data['id'] == 'filing-123'
                assert data['deleted_at'] is None

    def test_get_statistics(self, client, mock_db):
        """Test GET /api/tax-filing/statistics"""
        # Setup
        with patch('routers.swisstax.filing.get_filing_statistics') as mock_stats:
            mock_stats.return_value = {
                'total_filings': 5,
                'by_year': {2024: 2, 2023: 3},
                'completed_filings': 3,
                'in_progress_filings': 2
            }

            # Execute
            response = client.get('/api/tax-filing/statistics')

            # Assert
            assert response.status_code == 200
            data = response.json()
            assert data['total_filings'] == 5
            assert data['completed_filings'] == 3

    def test_unauthorized_access(self, mock_db):
        """Test endpoints without authentication"""
        # Create client without auth override
        test_client = TestClient(app)

        # Execute - no auth override
        response = test_client.get('/api/tax-filing/filings')

        # Assert
        assert response.status_code in [401, 403]


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
