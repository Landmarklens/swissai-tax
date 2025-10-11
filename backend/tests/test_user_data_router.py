"""
Unit tests for User Data Router endpoints (GDPR compliance).

Tests cover account deletion and data export functionality including:
- Request structure validation
- Service integration
- Error handling
- Authentication requirements
"""

import uuid
from datetime import datetime, timedelta
from unittest.mock import MagicMock, Mock, patch

import pytest
from fastapi.testclient import TestClient

from main import app
from models.swisstax.user import User
from core.security import get_current_user
from db.session import get_db


@pytest.fixture
def test_user():
    """Create a mock test user."""
    user = Mock(spec=User)
    user.id = uuid.uuid4()
    user.email = "test@example.com"
    user.first_name = "Test"
    user.last_name = "User"
    user.is_active = True
    return user


@pytest.fixture
def mock_db():
    """Create a mock database session."""
    return MagicMock()


@pytest.fixture
def client(test_user, mock_db):
    """Create a test client with dependency overrides."""
    # Override dependencies
    app.dependency_overrides[get_current_user] = lambda: test_user
    app.dependency_overrides[get_db] = lambda: mock_db

    client = TestClient(app)
    yield client

    # Clean up
    app.dependency_overrides.clear()


# ============================================================================
# ACCOUNT DELETION ENDPOINTS
# ============================================================================

@patch('routers.user_data.UserDeletionService')
def test_request_account_deletion_success(mock_deletion_service_class, client, test_user):
    """Test requesting account deletion successfully."""
    mock_service = Mock()
    mock_deletion_service_class.return_value = mock_service

    mock_deletion_request = Mock()
    mock_deletion_request.id = uuid.uuid4()
    mock_deletion_request.expires_at = datetime.utcnow() + timedelta(minutes=15)
    verification_code = "123456"

    mock_service.request_deletion.return_value = (mock_deletion_request, verification_code)

    response = client.post("/api/user/deletion/request")

    assert response.status_code == 200
    data = response.json()
    assert "request_id" in data
    assert "Verification code sent to" in data["message"]


@patch('routers.user_data.UserDeletionService')
def test_request_account_deletion_pending_exists(mock_deletion_service_class, client):
    """Test requesting deletion when one already exists."""
    mock_service = Mock()
    mock_deletion_service_class.return_value = mock_service
    mock_service.request_deletion.side_effect = ValueError("Already has pending deletion request")

    response = client.post("/api/user/deletion/request")

    assert response.status_code == 400
    assert "Already has pending deletion request" in response.json()["detail"]


@patch('routers.user_data.UserDeletionService')
def test_verify_account_deletion_success(mock_deletion_service_class, client):
    """Test verifying account deletion with correct code."""
    mock_service = Mock()
    mock_deletion_service_class.return_value = mock_service

    mock_deletion_request = Mock()
    mock_deletion_request.id = uuid.uuid4()
    mock_deletion_request.scheduled_deletion_at = datetime.utcnow() + timedelta(days=7)
    mock_service.GRACE_PERIOD_DAYS = 7
    mock_service.verify_and_schedule_deletion.return_value = mock_deletion_request

    response = client.post("/api/user/deletion/verify", json={"code": "123456"})

    assert response.status_code == 200
    data = response.json()
    assert "Account deletion scheduled successfully" in data["message"]


@patch('routers.user_data.UserDeletionService')
def test_get_deletion_status_pending(mock_deletion_service_class, client):
    """Test getting deletion status when pending."""
    mock_service = Mock()
    mock_deletion_service_class.return_value = mock_service

    mock_deletion_request = Mock()
    mock_deletion_request.id = uuid.uuid4()
    mock_deletion_request.status = "scheduled"
    mock_deletion_request.scheduled_deletion_at = datetime.utcnow() + timedelta(days=5)
    mock_deletion_request.days_until_deletion = 5
    mock_deletion_request.can_cancel = True

    mock_service.get_deletion_status.return_value = mock_deletion_request

    response = client.get("/api/user/deletion/status")

    assert response.status_code == 200
    data = response.json()
    assert data["has_pending_deletion"] is True
    assert data["status"] == "scheduled"


# ============================================================================
# DATA EXPORT ENDPOINTS
# ============================================================================

@patch('routers.user_data.DataExportService')
def test_request_data_export_json(mock_export_service_class, client):
    """Test requesting JSON data export."""
    mock_service = Mock()
    mock_export_service_class.return_value = mock_service

    mock_export = Mock()
    mock_export.id = uuid.uuid4()
    mock_export.status = "pending"
    mock_service.request_export.return_value = mock_export

    response = client.post("/api/user/export/request", json={"format": "json"})

    assert response.status_code == 200
    data = response.json()
    assert "export_id" in data
    assert data["status"] == "pending"


@patch('routers.user_data.DataExportService')
def test_list_data_exports_success(mock_export_service_class, client, test_user):
    """Test listing data exports with proper property casting."""
    mock_service = Mock()
    mock_export_service_class.return_value = mock_service

    # Mock export with @property methods
    mock_export = Mock()
    mock_export.id = uuid.uuid4()
    mock_export.status = "completed"
    mock_export.format = "json"
    mock_export.file_url = "https://s3.example.com/export.json"
    mock_export.file_size_mb = 2.5
    mock_export.created_at = datetime.utcnow()
    mock_export.completed_at = datetime.utcnow()
    mock_export.expires_at = datetime.utcnow() + timedelta(hours=24)
    mock_export.error_message = None

    # Properties that need explicit casting (this was the bug we fixed)
    mock_export.is_available = True
    mock_export.is_expired = False
    mock_export.hours_until_expiry = 24.0

    mock_service.get_user_exports.return_value = [mock_export]

    response = client.get("/api/user/export/list")

    assert response.status_code == 200
    data = response.json()
    assert data["total_count"] == 1
    assert len(data["exports"]) == 1

    export_data = data["exports"][0]
    assert export_data["status"] == "completed"
    # Verify the bug fix - properties are correctly cast
    assert export_data["is_available"] is True
    assert export_data["is_expired"] is False


def test_get_data_export_invalid_uuid(client):
    """Test getting export with invalid UUID."""
    response = client.get("/api/user/export/invalid-uuid")

    assert response.status_code == 400
    assert "Invalid export ID" in response.json()["detail"]


def test_download_export_not_ready(client, test_user, mock_db):
    """Test downloading export that's not ready."""
    export_id = uuid.uuid4()
    mock_export = Mock()
    mock_export.id = export_id
    mock_export.user_id = test_user.id
    mock_export.status = "pending"  # Not completed

    mock_query = MagicMock()
    mock_query.filter.return_value.first.return_value = mock_export
    mock_db.query.return_value = mock_query

    response = client.get(f"/api/user/export/{export_id}/download")

    assert response.status_code == 400
    assert "not ready for download" in response.json()["detail"]


def test_download_export_expired(client, test_user, mock_db):
    """Test downloading expired export."""
    export_id = uuid.uuid4()
    mock_export = Mock()
    mock_export.id = export_id
    mock_export.user_id = test_user.id
    mock_export.status = "completed"
    mock_export.file_url = "https://s3.example.com/export.json"
    mock_export.is_expired = True  # Expired

    mock_query = MagicMock()
    mock_query.filter.return_value.first.return_value = mock_export
    mock_db.query.return_value = mock_query

    response = client.get(f"/api/user/export/{export_id}/download")

    assert response.status_code == 410
    assert "expired" in response.json()["detail"]


# ============================================================================
# AUTHORIZATION TESTS
# ============================================================================

def test_endpoints_require_authentication():
    """Test that all endpoints require authentication."""
    # Create client without dependency overrides (no authentication)
    client = TestClient(app)

    endpoints = [
        ("/api/user/deletion/request", "POST"),
        ("/api/user/deletion/status", "GET"),
        ("/api/user/export/request", "POST"),
        ("/api/user/export/list", "GET"),
    ]

    for endpoint, method in endpoints:
        if method == "GET":
            response = client.get(endpoint)
        else:
            response = client.post(endpoint, json={})

        assert response.status_code == 401, f"Endpoint {endpoint} should require auth"
