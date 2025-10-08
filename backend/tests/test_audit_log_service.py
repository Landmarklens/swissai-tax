"""Unit tests for Audit Log Service."""

import json
from datetime import datetime, timedelta
from unittest.mock import MagicMock, Mock, patch
from uuid import uuid4

import pytest

from models.audit_log import AuditLog
from models.swisstax.user import User
from services.audit_log_service import (
    AuditLogService,
    log_login_success,
    log_logout,
    log_password_changed,
    log_2fa_enabled,
    log_2fa_disabled,
    log_tax_filing_submitted,
    log_document_uploaded,
    log_document_downloaded,
    log_data_exported,
    log_profile_updated,
)


class TestAuditLogService:
    """Test the AuditLogService class."""

    @pytest.fixture
    def mock_db(self):
        """Create a mock database session."""
        db = MagicMock()
        return db

    @pytest.fixture
    def test_user_id(self):
        """Create a test user UUID."""
        return uuid4()

    @pytest.fixture
    def mock_audit_log(self, test_user_id):
        """Create a mock audit log."""
        log = Mock(spec=AuditLog)
        log.id = 1
        log.user_id = test_user_id
        log.event_type = "login_success"
        log.event_category = "authentication"
        log.description = "User logged in successfully"
        log.ip_address = "127.0.0.1"
        log.user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0"
        log.device_info = {
            "browser": "Chrome",
            "os": "Windows",
            "device": "Desktop",
            "is_mobile": False,
        }
        log.event_metadata = None
        log.status = "success"
        log.created_at = datetime.utcnow()
        return log

    # Test log_event method
    def test_log_event_success(self, mock_db, test_user_id):
        """Test creating an audit log entry."""
        # Call the service
        result = AuditLogService.log_event(
            db=mock_db,
            user_id=test_user_id,
            event_type="login_success",
            event_category="authentication",
            description="User logged in successfully",
            ip_address="127.0.0.1",
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0",
        )

        # Verify database operations
        assert mock_db.add.called
        assert mock_db.commit.called
        assert mock_db.refresh.called

    def test_log_event_with_string_uuid(self, mock_db):
        """Test creating audit log with string UUID."""
        user_id_str = str(uuid4())

        result = AuditLogService.log_event(
            db=mock_db,
            user_id=user_id_str,
            event_type="login_success",
            event_category="authentication",
            description="User logged in successfully",
        )

        assert mock_db.add.called
        assert mock_db.commit.called

    def test_log_event_with_metadata(self, mock_db, test_user_id):
        """Test creating audit log with metadata."""
        metadata = {"filing_id": 123, "tax_year": 2024}

        result = AuditLogService.log_event(
            db=mock_db,
            user_id=test_user_id,
            event_type="tax_filing_submitted",
            event_category="data_modification",
            description="Tax filing submitted",
            metadata=metadata,
        )

        assert mock_db.add.called
        assert mock_db.commit.called

    def test_log_event_failure_handling(self, mock_db, test_user_id):
        """Test that audit log failures don't crash the application."""
        # Simulate database error
        mock_db.commit.side_effect = Exception("Database error")

        result = AuditLogService.log_event(
            db=mock_db,
            user_id=test_user_id,
            event_type="login_success",
            event_category="authentication",
            description="User logged in successfully",
        )

        # Should return None and rollback
        assert result is None
        assert mock_db.rollback.called

    # Test _parse_user_agent method
    def test_parse_user_agent_chrome_windows(self):
        """Test parsing Chrome on Windows user agent."""
        user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"

        result = AuditLogService._parse_user_agent(user_agent)

        assert result["browser"] == "Chrome"
        assert result["os"] == "Windows"
        assert result["device"] == "Desktop"
        assert result["is_mobile"] is False
        assert result["is_pc"] is True

    def test_parse_user_agent_firefox_linux(self):
        """Test parsing Firefox on Linux user agent."""
        user_agent = "Mozilla/5.0 (X11; Linux x86_64; rv:89.0) Gecko/20100101 Firefox/89.0"

        result = AuditLogService._parse_user_agent(user_agent)

        assert result["browser"] == "Firefox"
        assert result["os"] == "Linux"
        assert result["is_pc"] is True

    def test_parse_user_agent_safari_macos(self):
        """Test parsing Safari on macOS user agent."""
        user_agent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15"

        result = AuditLogService._parse_user_agent(user_agent)

        assert result["browser"] == "Safari"
        assert result["os"] == "macOS"

    def test_parse_user_agent_mobile_chrome_android(self):
        """Test parsing Chrome on Android mobile."""
        user_agent = "Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36"

        result = AuditLogService._parse_user_agent(user_agent)

        assert result["browser"] == "Chrome"
        assert result["os"] == "Android"
        assert result["device"] == "Mobile"
        assert result["is_mobile"] is True
        assert result["is_pc"] is False

    def test_parse_user_agent_iphone(self):
        """Test parsing Safari on iPhone."""
        user_agent = "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1"

        result = AuditLogService._parse_user_agent(user_agent)

        assert result["os"] == "iOS"
        assert result["device"] == "Mobile"
        assert result["is_mobile"] is True

    def test_parse_user_agent_ipad(self):
        """Test parsing Safari on iPad."""
        user_agent = "Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"

        result = AuditLogService._parse_user_agent(user_agent)

        assert result["os"] == "iOS"
        assert result["device"] == "Tablet"
        assert result["is_tablet"] is True
        assert result["is_mobile"] is False

    def test_parse_user_agent_edge(self):
        """Test parsing Edge browser."""
        user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59"

        result = AuditLogService._parse_user_agent(user_agent)

        assert result["browser"] == "Edge"

    # Test get_user_logs method
    def test_get_user_logs_basic(self, mock_db, test_user_id, mock_audit_log):
        """Test retrieving user logs."""
        # Setup mock query
        mock_query = MagicMock()
        mock_db.query.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.count.return_value = 1
        mock_query.order_by.return_value = mock_query
        mock_query.limit.return_value = mock_query
        mock_query.offset.return_value = mock_query
        mock_query.all.return_value = [mock_audit_log]

        logs, total = AuditLogService.get_user_logs(
            db=mock_db, user_id=test_user_id, limit=50, offset=0
        )

        assert len(logs) == 1
        assert total == 1
        assert logs[0] == mock_audit_log

    def test_get_user_logs_with_category_filter(self, mock_db, test_user_id):
        """Test retrieving logs filtered by category."""
        mock_query = MagicMock()
        mock_db.query.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.count.return_value = 0
        mock_query.order_by.return_value = mock_query
        mock_query.limit.return_value = mock_query
        mock_query.offset.return_value = mock_query
        mock_query.all.return_value = []

        logs, total = AuditLogService.get_user_logs(
            db=mock_db,
            user_id=test_user_id,
            event_category="authentication",
            limit=50,
            offset=0,
        )

        # Verify filter was called with category
        assert mock_query.filter.called

    def test_get_user_logs_with_date_range(self, mock_db, test_user_id):
        """Test retrieving logs with date range filter."""
        mock_query = MagicMock()
        mock_db.query.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.count.return_value = 0
        mock_query.order_by.return_value = mock_query
        mock_query.limit.return_value = mock_query
        mock_query.offset.return_value = mock_query
        mock_query.all.return_value = []

        start_date = datetime.utcnow() - timedelta(days=30)
        end_date = datetime.utcnow()

        logs, total = AuditLogService.get_user_logs(
            db=mock_db,
            user_id=test_user_id,
            start_date=start_date,
            end_date=end_date,
            limit=50,
            offset=0,
        )

        assert mock_query.filter.called

    def test_get_user_logs_pagination(self, mock_db, test_user_id):
        """Test pagination of user logs."""
        mock_query = MagicMock()
        mock_db.query.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.count.return_value = 100
        mock_query.order_by.return_value = mock_query
        mock_query.limit.return_value = mock_query
        mock_query.offset.return_value = mock_query
        mock_query.all.return_value = []

        logs, total = AuditLogService.get_user_logs(
            db=mock_db, user_id=test_user_id, limit=20, offset=40
        )

        assert total == 100
        # Verify pagination was applied
        mock_query.limit.assert_called_with(20)
        mock_query.offset.assert_called_with(40)

    # Test cleanup_old_logs method
    def test_cleanup_old_logs(self, mock_db):
        """Test cleaning up old audit logs."""
        mock_query = MagicMock()
        mock_db.query.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.delete.return_value = 15

        deleted = AuditLogService.cleanup_old_logs(db=mock_db, days=90)

        assert deleted == 15
        assert mock_db.commit.called

    # Test convenience functions
    def test_log_login_success(self, mock_db, test_user_id):
        """Test login success logging."""
        result = log_login_success(
            db=mock_db,
            user_id=test_user_id,
            ip="192.168.1.1",
            user_agent="Mozilla/5.0",
        )

        assert mock_db.add.called
        assert mock_db.commit.called

    def test_log_logout(self, mock_db, test_user_id):
        """Test logout logging."""
        result = log_logout(
            db=mock_db,
            user_id=test_user_id,
            ip="192.168.1.1",
            user_agent="Mozilla/5.0",
        )

        assert mock_db.add.called

    def test_log_password_changed(self, mock_db, test_user_id):
        """Test password change logging."""
        result = log_password_changed(
            db=mock_db,
            user_id=test_user_id,
            ip="192.168.1.1",
            user_agent="Mozilla/5.0",
        )

        assert mock_db.add.called

    def test_log_2fa_enabled(self, mock_db, test_user_id):
        """Test 2FA enabled logging."""
        result = log_2fa_enabled(
            db=mock_db,
            user_id=test_user_id,
            ip="192.168.1.1",
            user_agent="Mozilla/5.0",
        )

        assert mock_db.add.called

    def test_log_2fa_disabled(self, mock_db, test_user_id):
        """Test 2FA disabled logging."""
        result = log_2fa_disabled(
            db=mock_db,
            user_id=test_user_id,
            ip="192.168.1.1",
            user_agent="Mozilla/5.0",
        )

        assert mock_db.add.called

    def test_log_tax_filing_submitted(self, mock_db, test_user_id):
        """Test tax filing submission logging."""
        result = log_tax_filing_submitted(
            db=mock_db,
            user_id=test_user_id,
            filing_id=123,
            tax_year=2024,
            canton="ZH",
            ip="192.168.1.1",
            user_agent="Mozilla/5.0",
        )

        assert mock_db.add.called

    def test_log_document_uploaded(self, mock_db, test_user_id):
        """Test document upload logging."""
        result = log_document_uploaded(
            db=mock_db,
            user_id=test_user_id,
            document_name="tax_form_2024.pdf",
            ip="192.168.1.1",
            user_agent="Mozilla/5.0",
        )

        assert mock_db.add.called

    def test_log_document_downloaded(self, mock_db, test_user_id):
        """Test document download logging."""
        result = log_document_downloaded(
            db=mock_db,
            user_id=test_user_id,
            document_name="tax_form_2024.pdf",
            ip="192.168.1.1",
            user_agent="Mozilla/5.0",
        )

        assert mock_db.add.called

    def test_log_data_exported(self, mock_db, test_user_id):
        """Test data export logging."""
        result = log_data_exported(
            db=mock_db,
            user_id=test_user_id,
            export_type="json",
            ip="192.168.1.1",
            user_agent="Mozilla/5.0",
        )

        assert mock_db.add.called

    def test_log_profile_updated(self, mock_db, test_user_id):
        """Test profile update logging."""
        result = log_profile_updated(
            db=mock_db,
            user_id=test_user_id,
            ip="192.168.1.1",
            user_agent="Mozilla/5.0",
        )

        assert mock_db.add.called
