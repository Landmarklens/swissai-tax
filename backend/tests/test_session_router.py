"""Unit tests for Session Router endpoints."""

import uuid
from datetime import datetime, timedelta
from unittest.mock import MagicMock, Mock, patch

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from main import app
from models.swisstax.user import User


class TestSessionRouter:
    """Test the session router endpoints."""

    @pytest.fixture
    def client(self):
        """Create a test client."""
        return TestClient(app)

    @pytest.fixture
    def test_user(self):
        """Create a mock test user."""
        user = Mock(spec=User)
        user.id = uuid.uuid4()
        user.email = "test@example.com"
        user.first_name = "Test"
        user.last_name = "User"
        user.is_active = True
        user.two_factor_enabled = False
        return user

    @pytest.fixture
    def mock_session_data(self):
        """Create mock session data."""
        return {
            "id": str(uuid.uuid4()),
            "session_id": str(uuid.uuid4()),
            "device_name": "Chrome on MacOS",
            "device_type": "desktop",
            "browser": "Chrome",
            "browser_version": "91.0",
            "os": "MacOS",
            "os_version": "10.15.7",
            "ip_address": "192.168.1.1",
            "location": None,
            "is_active": True,
            "is_current": True,
            "last_active": datetime.utcnow().isoformat(),
            "created_at": datetime.utcnow().isoformat(),
            "expires_at": (datetime.utcnow() + timedelta(days=30)).isoformat()
        }

    # Test GET /sessions
    @patch('routers.sessions.get_current_user')
    @patch('routers.sessions.session_service')
    @patch('routers.sessions.get_db')
    def test_list_sessions_success(
        self, mock_get_db, mock_session_service, mock_get_current_user, client, test_user, mock_session_data
    ):
        """Test listing sessions successfully."""
        # Setup mocks
        mock_get_current_user.return_value = test_user
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db

        mock_session = Mock()
        mock_session.to_dict.return_value = mock_session_data
        mock_session_service.get_user_sessions.return_value = [mock_session]

        # Make request
        response = client.get("/api/sessions")

        # Verify response
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["sessions"]) == 1
        assert data["count"] == 1

    @patch('routers.sessions.get_current_user')
    @patch('routers.sessions.session_service')
    @patch('routers.sessions.get_db')
    def test_list_sessions_empty(
        self, mock_get_db, mock_session_service, mock_get_current_user, client, test_user
    ):
        """Test listing sessions when user has no sessions."""
        mock_get_current_user.return_value = test_user
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_session_service.get_user_sessions.return_value = []

        response = client.get("/api/sessions")

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["sessions"]) == 0
        assert data["count"] == 0

    @patch('routers.sessions.get_current_user')
    @patch('routers.sessions.session_service')
    @patch('routers.sessions.get_db')
    def test_list_sessions_error(
        self, mock_get_db, mock_session_service, mock_get_current_user, client, test_user
    ):
        """Test listing sessions when service throws error."""
        mock_get_current_user.return_value = test_user
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_session_service.get_user_sessions.side_effect = Exception("Database error")

        response = client.get("/api/sessions")

        assert response.status_code == 500

    # Test DELETE /sessions/{session_uuid}
    @patch('routers.sessions.get_current_user')
    @patch('routers.sessions.session_service')
    @patch('routers.sessions.get_db')
    @patch('routers.sessions.log_session_revoked')
    def test_revoke_session_success(
        self, mock_log, mock_get_db, mock_session_service, mock_get_current_user, client, test_user
    ):
        """Test revoking a session successfully."""
        mock_get_current_user.return_value = test_user
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_session_service.revoke_session.return_value = True

        session_uuid = str(uuid.uuid4())
        response = client.delete(f"/api/sessions/{session_uuid}")

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "revoked successfully" in data["message"]

    @patch('routers.sessions.get_current_user')
    @patch('routers.sessions.session_service')
    @patch('routers.sessions.get_db')
    def test_revoke_session_not_found(
        self, mock_get_db, mock_session_service, mock_get_current_user, client, test_user
    ):
        """Test revoking a non-existent session."""
        mock_get_current_user.return_value = test_user
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_session_service.revoke_session.return_value = False

        session_uuid = str(uuid.uuid4())
        response = client.delete(f"/api/sessions/{session_uuid}")

        assert response.status_code == 404

    # Test POST /sessions/revoke-all
    @patch('routers.sessions.get_current_user')
    @patch('routers.sessions.get_session_id_from_request')
    @patch('routers.sessions.session_service')
    @patch('routers.sessions.get_db')
    @patch('routers.sessions.log_all_sessions_revoked')
    def test_revoke_all_other_sessions_success(
        self, mock_log, mock_get_db, mock_session_service,
        mock_get_session_id, mock_get_current_user, client, test_user
    ):
        """Test revoking all other sessions successfully."""
        mock_get_current_user.return_value = test_user
        mock_get_session_id.return_value = "current-session-id"
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_session_service.revoke_all_other_sessions.return_value = 3

        response = client.post("/api/sessions/revoke-all")

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["count"] == 3

    @patch('routers.sessions.get_current_user')
    @patch('routers.sessions.get_session_id_from_request')
    @patch('routers.sessions.get_db')
    def test_revoke_all_no_session_id(
        self, mock_get_db, mock_get_session_id, mock_get_current_user, client, test_user
    ):
        """Test revoking all when current session_id cannot be determined."""
        mock_get_current_user.return_value = test_user
        mock_get_session_id.return_value = None
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db

        response = client.post("/api/sessions/revoke-all")

        assert response.status_code == 400

    # Test GET /sessions/count
    @patch('routers.sessions.get_current_user')
    @patch('routers.sessions.session_service')
    @patch('routers.sessions.get_db')
    def test_get_session_count(
        self, mock_get_db, mock_session_service, mock_get_current_user, client, test_user
    ):
        """Test getting session count."""
        mock_get_current_user.return_value = test_user
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_session_service.get_active_session_count.return_value = 5

        response = client.get("/api/sessions/count")

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["count"] == 5

    # Test POST /sessions/cleanup-duplicates
    @patch('routers.sessions.get_current_user')
    @patch('routers.sessions.get_db')
    def test_cleanup_duplicate_sessions(
        self, mock_get_db, mock_get_current_user, client, test_user
    ):
        """Test cleaning up duplicate sessions."""
        mock_get_current_user.return_value = test_user
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db

        # Mock sessions with duplicates
        session1 = Mock()
        session1.id = uuid.uuid4()
        session1.device_name = "Chrome on MacOS"
        session1.ip_address = "192.168.1.1"
        session1.created_at = datetime.utcnow()
        session1.revoke = Mock()

        session2 = Mock()
        session2.id = uuid.uuid4()
        session2.device_name = "Chrome on MacOS"
        session2.ip_address = "192.168.1.1"
        session2.created_at = datetime.utcnow() - timedelta(hours=1)
        session2.revoke = Mock()

        mock_query = MagicMock()
        mock_db.query.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.order_by.return_value = mock_query
        mock_query.all.return_value = [session1, session2]

        response = client.post("/api/sessions/cleanup-duplicates")

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["duplicates_removed"] >= 0

    @patch('routers.sessions.get_current_user')
    @patch('routers.sessions.get_db')
    def test_cleanup_duplicate_sessions_error(
        self, mock_get_db, mock_get_current_user, client, test_user
    ):
        """Test error handling during duplicate cleanup."""
        mock_get_current_user.return_value = test_user
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_db.query.side_effect = Exception("Database error")

        response = client.post("/api/sessions/cleanup-duplicates")

        assert response.status_code == 500

    # Test unauthorized access
    @patch('routers.sessions.get_current_user')
    def test_list_sessions_unauthorized(self, mock_get_current_user, client):
        """Test that unauthorized users cannot list sessions."""
        mock_get_current_user.side_effect = HTTPException(status_code=401, detail="Not authenticated")

        response = client.get("/api/sessions")

        assert response.status_code == 401

    @patch('routers.sessions.get_current_user')
    def test_revoke_session_unauthorized(self, mock_get_current_user, client):
        """Test that unauthorized users cannot revoke sessions."""
        mock_get_current_user.side_effect = HTTPException(status_code=401, detail="Not authenticated")

        session_uuid = str(uuid.uuid4())
        response = client.delete(f"/api/sessions/{session_uuid}")

        assert response.status_code == 401
