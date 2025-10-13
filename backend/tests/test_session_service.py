"""Unit tests for Session Service."""

import uuid
from datetime import datetime, timedelta
from unittest.mock import MagicMock, Mock, patch

import pytest

from models.user_session import UserSession
from services.session_service import SessionService


class TestSessionService:
    """Test the SessionService class."""

    @pytest.fixture
    def mock_db(self):
        """Create a mock database session."""
        db = MagicMock()
        return db

    @pytest.fixture
    def test_user_id(self):
        """Create a test user UUID."""
        return uuid.uuid4()

    @pytest.fixture
    def test_session_id(self):
        """Create a test session ID."""
        return str(uuid.uuid4())

    @pytest.fixture
    def mock_request(self):
        """Create a mock FastAPI request."""
        request = Mock()
        request.headers = {
            "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/91.0"
        }
        request.client = Mock()
        request.client.host = "192.168.1.1"
        return request

    @pytest.fixture
    def mock_session(self, test_user_id, test_session_id):
        """Create a mock session."""
        session = Mock(spec=UserSession)
        session.id = uuid.uuid4()
        session.user_id = test_user_id
        session.session_id = test_session_id
        session.device_name = "Chrome on MacOS"
        session.device_type = "desktop"
        session.browser = "Chrome"
        session.browser_version = "91.0"
        session.os = "MacOS"
        session.os_version = "10.15.7"
        session.ip_address = "192.168.1.1"
        session.location = None
        session.is_active = True
        session.is_current = True
        session.last_active = datetime.utcnow()
        session.created_at = datetime.utcnow()
        session.expires_at = datetime.utcnow() + timedelta(days=30)
        session.revoked_at = None
        session.is_valid = Mock(return_value=True)
        session.revoke = Mock()
        session.touch = Mock()
        return session

    # Test create_session
    def test_create_session_success(self, mock_db, test_user_id, test_session_id, mock_request):
        """Test creating a new session successfully."""
        # Create separate mock queries for multiple query calls
        mock_query_existing = MagicMock()
        mock_query_existing.filter.return_value = mock_query_existing
        mock_query_existing.first.return_value = None  # No existing session

        mock_query_update = MagicMock()
        mock_query_update.filter.return_value = mock_query_update
        mock_query_update.update.return_value = 0

        mock_query_duplicates = MagicMock()
        mock_query_duplicates.filter.return_value = mock_query_duplicates
        mock_query_duplicates.all.return_value = []  # No duplicates

        mock_query_stale = MagicMock()
        mock_query_stale.filter.return_value = mock_query_stale
        mock_query_stale.all.return_value = []  # No stale sessions

        # Mock db.query() to return different mock queries for each call
        mock_db.query.side_effect = [
            mock_query_existing,  # Check existing session
            mock_query_update,     # Update is_current
            mock_query_duplicates, # Query exact duplicates
            mock_query_stale       # Query stale sessions
        ]

        with patch('services.session_service.DeviceParser') as mock_parser:
            mock_parser.parse_user_agent.return_value = {
                "device_name": "Chrome on MacOS",
                "device_type": "desktop",
                "browser": "Chrome",
                "browser_version": "91.0",
                "os": "MacOS",
                "os_version": "10.15.7"
            }

            result = SessionService.create_session(
                db=mock_db,
                user_id=str(test_user_id),
                session_id=test_session_id,
                request=mock_request,
                is_current=True
            )

            # Verify database operations
            assert mock_db.add.called
            assert mock_db.commit.called
            assert mock_db.refresh.called

    def test_create_session_duplicate(self, mock_db, test_user_id, test_session_id, mock_request, mock_session):
        """Test creating a session that already exists (should update existing)."""
        # Mock query to return existing session
        mock_query = MagicMock()
        mock_db.query.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.first.return_value = mock_session

        result = SessionService.create_session(
            db=mock_db,
            user_id=str(test_user_id),
            session_id=test_session_id,
            request=mock_request,
            is_current=True
        )

        # Should update last_active instead of creating new
        assert mock_db.commit.called
        assert mock_db.refresh.called
        assert not mock_db.add.called  # Should not add a new session

    def test_create_session_with_x_forwarded_for(self, mock_db, test_user_id, test_session_id):
        """Test creating session with X-Forwarded-For header."""
        request = Mock()
        request.headers = {
            "user-agent": "Mozilla/5.0",
            "x-forwarded-for": "203.0.113.1, 70.41.3.18, 150.172.238.178"
        }
        request.client = Mock()
        request.client.host = "192.168.1.1"

        # Create separate mock queries for multiple query calls
        mock_query_existing = MagicMock()
        mock_query_existing.filter.return_value = mock_query_existing
        mock_query_existing.first.return_value = None

        mock_query_update = MagicMock()
        mock_query_update.filter.return_value = mock_query_update
        mock_query_update.update.return_value = 0

        mock_query_duplicates = MagicMock()
        mock_query_duplicates.filter.return_value = mock_query_duplicates
        mock_query_duplicates.all.return_value = []

        mock_query_stale = MagicMock()
        mock_query_stale.filter.return_value = mock_query_stale
        mock_query_stale.all.return_value = []

        mock_db.query.side_effect = [
            mock_query_existing,
            mock_query_update,
            mock_query_duplicates,
            mock_query_stale
        ]

        with patch('services.session_service.DeviceParser') as mock_parser:
            mock_parser.parse_user_agent.return_value = {
                "device_name": "Chrome on MacOS",
                "device_type": "desktop",
                "browser": "Chrome",
                "browser_version": "91.0",
                "os": "MacOS",
                "os_version": "10.15.7"
            }

            result = SessionService.create_session(
                db=mock_db,
                user_id=str(test_user_id),
                session_id=test_session_id,
                request=request,
                is_current=True
            )

            assert mock_db.add.called

    def test_create_session_error_handling(self, mock_db, test_user_id, test_session_id, mock_request):
        """Test that session creation errors are handled properly."""
        # Mock queries properly before error occurs
        mock_query_existing = MagicMock()
        mock_query_existing.filter.return_value = mock_query_existing
        mock_query_existing.first.return_value = None

        mock_query_update = MagicMock()
        mock_query_update.filter.return_value = mock_query_update
        mock_query_update.update.return_value = 0

        mock_query_duplicates = MagicMock()
        mock_query_duplicates.filter.return_value = mock_query_duplicates
        mock_query_duplicates.all.return_value = []

        mock_query_stale = MagicMock()
        mock_query_stale.filter.return_value = mock_query_stale
        mock_query_stale.all.return_value = []

        mock_db.query.side_effect = [
            mock_query_existing,
            mock_query_update,
            mock_query_duplicates,
            mock_query_stale
        ]

        mock_db.commit.side_effect = Exception("Database error")

        with pytest.raises(Exception):
            SessionService.create_session(
                db=mock_db,
                user_id=str(test_user_id),
                session_id=test_session_id,
                request=mock_request,
                is_current=True
            )

        assert mock_db.rollback.called

    # Test get_user_sessions
    def test_get_user_sessions(self, mock_db, test_user_id, mock_session):
        """Test retrieving all sessions for a user."""
        mock_query = MagicMock()
        mock_db.query.return_value = mock_query
        mock_db.expire_all = Mock()
        mock_query.filter.return_value = mock_query
        mock_query.order_by.return_value = mock_query
        mock_query.all.return_value = [mock_session]

        sessions = SessionService.get_user_sessions(
            db=mock_db,
            user_id=str(test_user_id),
            active_only=True,
            include_expired=False
        )

        assert len(sessions) == 1
        assert sessions[0] == mock_session
        assert mock_db.expire_all.called

    def test_get_user_sessions_include_expired(self, mock_db, test_user_id):
        """Test retrieving sessions including expired ones."""
        mock_query = MagicMock()
        mock_db.query.return_value = mock_query
        mock_db.expire_all = Mock()
        mock_query.filter.return_value = mock_query
        mock_query.order_by.return_value = mock_query
        mock_query.all.return_value = []

        sessions = SessionService.get_user_sessions(
            db=mock_db,
            user_id=str(test_user_id),
            active_only=False,
            include_expired=True
        )

        # Verify filter was called appropriately (not filtering by expiration)
        assert mock_query.filter.called
        assert mock_query.order_by.called

    # Test get_session_by_id
    def test_get_session_by_id(self, mock_db, test_session_id, mock_session):
        """Test retrieving a session by session_id."""
        mock_query = MagicMock()
        mock_db.query.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.first.return_value = mock_session

        session = SessionService.get_session_by_id(db=mock_db, session_id=test_session_id)

        assert session == mock_session

    def test_get_session_by_id_not_found(self, mock_db, test_session_id):
        """Test retrieving a non-existent session."""
        mock_query = MagicMock()
        mock_db.query.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.first.return_value = None

        session = SessionService.get_session_by_id(db=mock_db, session_id=test_session_id)

        assert session is None

    # Test update_last_active
    def test_update_last_active_success(self, mock_db, test_session_id):
        """Test updating last_active timestamp."""
        mock_query = MagicMock()
        mock_db.query.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.update.return_value = 1  # 1 row updated

        SessionService.update_last_active(db=mock_db, session_id=test_session_id)

        assert mock_db.commit.called
        assert mock_query.update.called

    def test_update_last_active_error(self, mock_db, test_session_id):
        """Test handling update_last_active errors."""
        mock_db.query.side_effect = Exception("Database error")

        # Should not raise, just log warning
        SessionService.update_last_active(db=mock_db, session_id=test_session_id)

        assert mock_db.rollback.called

    # Test validate_session
    def test_validate_session_valid(self, mock_db, test_session_id, mock_session):
        """Test validating a valid session."""
        mock_query = MagicMock()
        mock_db.query.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.first.return_value = mock_session
        mock_session.is_valid.return_value = True

        # Mock update for last_active
        mock_update_query = MagicMock()
        mock_db.query.side_effect = [mock_query, mock_update_query]
        mock_update_query.filter.return_value = mock_update_query
        mock_update_query.update.return_value = 1

        is_valid = SessionService.validate_session(db=mock_db, session_id=test_session_id)

        assert is_valid is True
        # Should have updated last_active
        assert mock_db.commit.called

    def test_validate_session_invalid(self, mock_db, test_session_id, mock_session):
        """Test validating an invalid/expired session."""
        mock_query = MagicMock()
        mock_db.query.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.first.return_value = mock_session
        mock_session.is_valid.return_value = False

        is_valid = SessionService.validate_session(db=mock_db, session_id=test_session_id)

        assert is_valid is False

    def test_validate_session_not_found(self, mock_db, test_session_id):
        """Test validating a non-existent session."""
        mock_query = MagicMock()
        mock_db.query.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.first.return_value = None

        is_valid = SessionService.validate_session(db=mock_db, session_id=test_session_id)

        assert is_valid is False

    # Test revoke_session
    def test_revoke_session_success(self, mock_db, test_user_id, mock_session):
        """Test revoking a session successfully."""
        mock_query = MagicMock()
        mock_db.query.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.first.return_value = mock_session

        success = SessionService.revoke_session(
            db=mock_db,
            session_uuid=str(mock_session.id),
            user_id=str(test_user_id)
        )

        assert success is True
        assert mock_session.revoke.called
        assert mock_db.commit.called

    def test_revoke_session_not_found(self, mock_db, test_user_id):
        """Test revoking a non-existent session."""
        mock_query = MagicMock()
        mock_db.query.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.first.return_value = None

        success = SessionService.revoke_session(
            db=mock_db,
            session_uuid=str(uuid.uuid4()),
            user_id=str(test_user_id)
        )

        assert success is False

    def test_revoke_session_error_handling(self, mock_db, test_user_id, mock_session):
        """Test error handling when revoking a session."""
        mock_query = MagicMock()
        mock_db.query.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.first.return_value = mock_session
        mock_db.commit.side_effect = Exception("Database error")

        success = SessionService.revoke_session(
            db=mock_db,
            session_uuid=str(mock_session.id),
            user_id=str(test_user_id)
        )

        assert success is False
        assert mock_db.rollback.called

    # Test revoke_all_other_sessions
    def test_revoke_all_other_sessions(self, mock_db, test_user_id, test_session_id):
        """Test revoking all other sessions except current."""
        # Create mock sessions
        session1 = Mock(spec=UserSession)
        session1.revoke = Mock()
        session2 = Mock(spec=UserSession)
        session2.revoke = Mock()

        mock_query = MagicMock()
        mock_db.query.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.all.return_value = [session1, session2]

        count = SessionService.revoke_all_other_sessions(
            db=mock_db,
            current_session_id=test_session_id,
            user_id=str(test_user_id)
        )

        assert count == 2
        assert session1.revoke.called
        assert session2.revoke.called
        assert mock_db.commit.called

    def test_revoke_all_other_sessions_none_to_revoke(self, mock_db, test_user_id, test_session_id):
        """Test revoking when there are no other sessions."""
        mock_query = MagicMock()
        mock_db.query.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.all.return_value = []

        count = SessionService.revoke_all_other_sessions(
            db=mock_db,
            current_session_id=test_session_id,
            user_id=str(test_user_id)
        )

        assert count == 0

    # Test cleanup_expired_sessions
    def test_cleanup_expired_sessions(self, mock_db):
        """Test cleaning up expired sessions."""
        # Create mock expired sessions
        session1 = Mock(spec=UserSession)
        session1.revoke = Mock()
        session2 = Mock(spec=UserSession)
        session2.revoke = Mock()

        mock_query = MagicMock()
        mock_db.query.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.all.return_value = [session1, session2]

        count = SessionService.cleanup_expired_sessions(db=mock_db)

        assert count == 2
        assert session1.revoke.called
        assert session2.revoke.called
        assert mock_db.commit.called

    def test_cleanup_expired_sessions_error(self, mock_db):
        """Test error handling during cleanup."""
        mock_db.query.side_effect = Exception("Database error")

        count = SessionService.cleanup_expired_sessions(db=mock_db)

        assert count == 0
        assert mock_db.rollback.called

    # Test get_active_session_count
    def test_get_active_session_count(self, mock_db, test_user_id):
        """Test getting count of active sessions."""
        mock_query = MagicMock()
        mock_db.query.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.count.return_value = 3

        count = SessionService.get_active_session_count(
            db=mock_db,
            user_id=str(test_user_id)
        )

        assert count == 3

    # Test _get_client_ip
    def test_get_client_ip_x_forwarded_for(self, mock_db, test_user_id, test_session_id):
        """Test extracting IP from X-Forwarded-For header."""
        request = Mock()
        request.headers = {
            "x-forwarded-for": "203.0.113.1, 70.41.3.18",
            "user-agent": "Mozilla/5.0"
        }
        request.client = None

        ip = SessionService._get_client_ip(request)
        assert ip == "203.0.113.1"  # Should take first IP

    def test_get_client_ip_x_real_ip(self, mock_db, test_user_id, test_session_id):
        """Test extracting IP from X-Real-IP header."""
        request = Mock()
        request.headers = {
            "x-real-ip": "203.0.113.1",
            "user-agent": "Mozilla/5.0"
        }
        request.client = None

        ip = SessionService._get_client_ip(request)
        assert ip == "203.0.113.1"

    def test_get_client_ip_direct(self, mock_db, test_user_id, test_session_id):
        """Test extracting IP from direct client connection."""
        request = Mock()
        request.headers = {"user-agent": "Mozilla/5.0"}
        request.client = Mock()
        request.client.host = "192.168.1.1"

        ip = SessionService._get_client_ip(request)
        assert ip == "192.168.1.1"

    def test_get_client_ip_none(self, mock_db, test_user_id, test_session_id):
        """Test when no IP can be determined."""
        request = Mock()
        request.headers = {"user-agent": "Mozilla/5.0"}
        request.client = None

        ip = SessionService._get_client_ip(request)
        assert ip is None
