"""Unit tests for Audit Log Router."""

from datetime import datetime, timedelta
from unittest.mock import MagicMock, Mock, patch
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from main import app
from models.audit_log import AuditLog
from models.swisstax.user import User


class TestAuditLogRouter:
    """Test the Audit Log API endpoints."""

    @pytest.fixture
    def client(self):
        """Create a test client."""
        return TestClient(app)

    @pytest.fixture
    def mock_user(self):
        """Create a mock authenticated user."""
        user = Mock(spec=User)
        user.id = uuid4()
        user.email = "test@example.com"
        user.first_name = "Test"
        user.last_name = "User"
        user.two_factor_enabled = False
        return user

    @pytest.fixture
    def mock_audit_logs(self, mock_user):
        """Create mock audit log entries."""
        logs = []
        for i in range(5):
            log = Mock(spec=AuditLog)
            log.id = i + 1
            log.user_id = mock_user.id
            log.event_type = "login_success"
            log.event_category = "authentication"
            log.description = "User logged in successfully"
            log.ip_address = f"192.168.1.{i}"
            log.user_agent = "Mozilla/5.0"
            log.device_info = {
                "browser": "Chrome",
                "os": "Windows",
                "device": "Desktop",
                "is_mobile": False,
            }
            log.event_metadata = None
            log.status = "success"
            log.created_at = datetime.utcnow() - timedelta(hours=i)
            logs.append(log)
        return logs

    # Test GET /api/audit-logs/
    @patch("routers.audit_logs.AuditLogService.get_user_logs")
    @patch("routers.audit_logs.get_db")
    def test_get_my_audit_logs_success(
        self, mock_get_db, mock_get_logs, client, mock_user, mock_audit_logs
    ):
        """Test retrieving audit logs successfully."""
        from core.security import get_current_user

        # Override the dependency
        app.dependency_overrides[get_current_user] = lambda: mock_user
        mock_get_db.return_value = MagicMock()
        mock_get_logs.return_value = (mock_audit_logs, 5)

        try:
            response = client.get("/api/audit-logs/?page=1&page_size=50")

            assert response.status_code == 200
            data = response.json()
            assert data["total"] == 5
            assert data["page"] == 1
            assert data["page_size"] == 50
            assert len(data["logs"]) == 5
            assert data["has_more"] is False
        finally:
            app.dependency_overrides = {}

    @patch("routers.audit_logs.get_current_user")
    @patch("routers.audit_logs.AuditLogService.get_user_logs")
    def test_get_my_audit_logs_with_pagination(
        self, mock_get_logs, mock_get_user, client, mock_user, mock_audit_logs
    ):
        """Test audit logs with pagination."""
        mock_get_user.return_value = mock_user
        # Simulate page 2 of 3
        mock_get_logs.return_value = (mock_audit_logs[:2], 150)

        response = client.get("/api/audit-logs/?page=2&page_size=50")

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 150
        assert data["page"] == 2
        assert data["page_size"] == 50
        assert data["has_more"] is True  # 150 total > (2 * 50)

    @patch("routers.audit_logs.get_current_user")
    @patch("routers.audit_logs.AuditLogService.get_user_logs")
    def test_get_my_audit_logs_with_category_filter(
        self, mock_get_logs, mock_get_user, client, mock_user, mock_audit_logs
    ):
        """Test filtering logs by event category."""
        mock_get_user.return_value = mock_user
        mock_get_logs.return_value = (mock_audit_logs[:2], 2)

        response = client.get(
            "/api/audit-logs/?page=1&page_size=50&event_category=authentication"
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2

        # Verify the service was called with the filter
        mock_get_logs.assert_called_once()
        call_kwargs = mock_get_logs.call_args[1]
        assert call_kwargs["event_category"] == "authentication"

    @patch("routers.audit_logs.get_current_user")
    @patch("routers.audit_logs.AuditLogService.get_user_logs")
    def test_get_my_audit_logs_with_event_type_filter(
        self, mock_get_logs, mock_get_user, client, mock_user, mock_audit_logs
    ):
        """Test filtering logs by event type."""
        mock_get_user.return_value = mock_user
        mock_get_logs.return_value = (mock_audit_logs[:1], 1)

        response = client.get(
            "/api/audit-logs/?page=1&page_size=50&event_type=login_success"
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1

        # Verify the service was called with the filter
        call_kwargs = mock_get_logs.call_args[1]
        assert call_kwargs["event_type"] == "login_success"

    @patch("routers.audit_logs.get_current_user")
    @patch("routers.audit_logs.AuditLogService.get_user_logs")
    def test_get_my_audit_logs_with_date_range(
        self, mock_get_logs, mock_get_user, client, mock_user, mock_audit_logs
    ):
        """Test filtering logs by date range."""
        mock_get_user.return_value = mock_user
        mock_get_logs.return_value = (mock_audit_logs[:3], 3)

        start_date = (datetime.utcnow() - timedelta(days=7)).isoformat()
        end_date = datetime.utcnow().isoformat()

        response = client.get(
            f"/api/audit-logs/?page=1&page_size=50&start_date={start_date}&end_date={end_date}"
        )

        assert response.status_code == 200

    @patch("routers.audit_logs.get_current_user")
    @patch("routers.audit_logs.AuditLogService.get_user_logs")
    def test_get_my_audit_logs_empty(
        self, mock_get_logs, mock_get_user, client, mock_user
    ):
        """Test retrieving logs when none exist."""
        mock_get_user.return_value = mock_user
        mock_get_logs.return_value = ([], 0)

        response = client.get("/api/audit-logs/?page=1&page_size=50")

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 0
        assert len(data["logs"]) == 0
        assert data["has_more"] is False

    @patch("routers.audit_logs.get_current_user")
    @patch("routers.audit_logs.AuditLogService.get_user_logs")
    def test_get_my_audit_logs_service_error(
        self, mock_get_logs, mock_get_user, client, mock_user
    ):
        """Test handling of service errors."""
        mock_get_user.return_value = mock_user
        mock_get_logs.side_effect = Exception("Database error")

        response = client.get("/api/audit-logs/?page=1&page_size=50")

        assert response.status_code == 500
        assert "Failed to retrieve audit logs" in response.json()["detail"]

    def test_get_my_audit_logs_unauthenticated(self, client):
        """Test that unauthenticated requests are rejected."""
        response = client.get("/api/audit-logs/?page=1&page_size=50")

        assert response.status_code == 401

    @patch("routers.audit_logs.get_current_user")
    @patch("routers.audit_logs.AuditLogService.get_user_logs")
    def test_get_my_audit_logs_page_validation(
        self, mock_get_logs, mock_get_user, client, mock_user
    ):
        """Test page parameter validation."""
        mock_get_user.return_value = mock_user

        # Test page < 1
        response = client.get("/api/audit-logs/?page=0&page_size=50")
        assert response.status_code == 422

        # Test negative page
        response = client.get("/api/audit-logs/?page=-1&page_size=50")
        assert response.status_code == 422

    @patch("routers.audit_logs.get_current_user")
    @patch("routers.audit_logs.AuditLogService.get_user_logs")
    def test_get_my_audit_logs_page_size_validation(
        self, mock_get_logs, mock_get_user, client, mock_user
    ):
        """Test page_size parameter validation."""
        mock_get_user.return_value = mock_user

        # Test page_size > 100
        response = client.get("/api/audit-logs/?page=1&page_size=101")
        assert response.status_code == 422

        # Test page_size < 1
        response = client.get("/api/audit-logs/?page=1&page_size=0")
        assert response.status_code == 422

    # Test GET /api/audit-logs/categories
    @patch("routers.audit_logs.get_current_user")
    def test_get_event_categories(self, mock_get_user, client, mock_user):
        """Test retrieving event categories."""
        mock_get_user.return_value = mock_user

        response = client.get("/api/audit-logs/categories")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 5

        # Check expected categories
        categories = {cat["value"] for cat in data}
        assert "authentication" in categories
        assert "security" in categories
        assert "data_access" in categories
        assert "data_modification" in categories
        assert "account" in categories

        # Check structure
        for category in data:
            assert "value" in category
            assert "label" in category

    def test_get_event_categories_unauthenticated(self, client):
        """Test that unauthenticated requests are rejected."""
        response = client.get("/api/audit-logs/categories")

        assert response.status_code == 401

    # Test GET /api/audit-logs/stats
    @patch("routers.audit_logs.get_current_user")
    @patch("routers.audit_logs.db.query")
    def test_get_audit_log_stats(self, mock_query, mock_get_user, client, mock_user):
        """Test retrieving audit log statistics."""
        mock_get_user.return_value = mock_user

        # Mock category counts
        mock_category_query = MagicMock()
        mock_category_query.group_by.return_value.all.return_value = [
            ("authentication", 10),
            ("security", 5),
            ("data_access", 3),
        ]

        # Mock total count
        mock_total_query = MagicMock()
        mock_total_query.scalar.return_value = 18

        # Mock recent count
        mock_recent_query = MagicMock()
        mock_recent_query.scalar.return_value = 12

        # Setup query to return different mocks for each call
        mock_query.side_effect = [
            mock_category_query,
            mock_total_query,
            mock_recent_query,
        ]

        response = client.get("/api/audit-logs/stats")

        assert response.status_code == 200
        data = response.json()
        assert "total_logs" in data
        assert "recent_activity_30_days" in data
        assert "by_category" in data
        assert isinstance(data["by_category"], dict)

    @patch("routers.audit_logs.get_current_user")
    @patch("routers.audit_logs.db.query")
    def test_get_audit_log_stats_no_logs(
        self, mock_query, mock_get_user, client, mock_user
    ):
        """Test stats when user has no logs."""
        mock_get_user.return_value = mock_user

        # Mock empty results
        mock_category_query = MagicMock()
        mock_category_query.group_by.return_value.all.return_value = []

        mock_total_query = MagicMock()
        mock_total_query.scalar.return_value = None

        mock_recent_query = MagicMock()
        mock_recent_query.scalar.return_value = None

        mock_query.side_effect = [
            mock_category_query,
            mock_total_query,
            mock_recent_query,
        ]

        response = client.get("/api/audit-logs/stats")

        assert response.status_code == 200
        data = response.json()
        assert data["total_logs"] == 0
        assert data["recent_activity_30_days"] == 0

    @patch("routers.audit_logs.get_current_user")
    @patch("routers.audit_logs.db.query")
    def test_get_audit_log_stats_error(
        self, mock_query, mock_get_user, client, mock_user
    ):
        """Test handling of errors in stats endpoint."""
        mock_get_user.return_value = mock_user
        mock_query.side_effect = Exception("Database error")

        response = client.get("/api/audit-logs/stats")

        assert response.status_code == 500
        assert "Failed to retrieve audit log statistics" in response.json()["detail"]

    def test_get_audit_log_stats_unauthenticated(self, client):
        """Test that unauthenticated requests are rejected."""
        response = client.get("/api/audit-logs/stats")

        assert response.status_code == 401

    # Integration-like tests
    @patch("routers.audit_logs.get_current_user")
    @patch("routers.audit_logs.AuditLogService.get_user_logs")
    def test_pagination_has_more_calculation(
        self, mock_get_logs, mock_get_user, client, mock_user, mock_audit_logs
    ):
        """Test correct calculation of has_more pagination flag."""
        mock_get_user.return_value = mock_user

        # Test case 1: More pages available
        mock_get_logs.return_value = (mock_audit_logs[:20], 100)
        response = client.get("/api/audit-logs/?page=1&page_size=20")
        assert response.json()["has_more"] is True

        # Test case 2: Last page
        mock_get_logs.return_value = (mock_audit_logs[:20], 40)
        response = client.get("/api/audit-logs/?page=2&page_size=20")
        assert response.json()["has_more"] is False

        # Test case 3: Exactly one page
        mock_get_logs.return_value = (mock_audit_logs[:20], 20)
        response = client.get("/api/audit-logs/?page=1&page_size=20")
        assert response.json()["has_more"] is False

    @patch("routers.audit_logs.get_current_user")
    @patch("routers.audit_logs.AuditLogService.get_user_logs")
    def test_multiple_filters_combined(
        self, mock_get_logs, mock_get_user, client, mock_user, mock_audit_logs
    ):
        """Test using multiple filters together."""
        mock_get_user.return_value = mock_user
        mock_get_logs.return_value = (mock_audit_logs[:1], 1)

        start_date = (datetime.utcnow() - timedelta(days=7)).isoformat()
        end_date = datetime.utcnow().isoformat()

        response = client.get(
            f"/api/audit-logs/?page=1&page_size=50&event_category=authentication&event_type=login_success&start_date={start_date}&end_date={end_date}"
        )

        assert response.status_code == 200

        # Verify all filters were passed to the service
        call_kwargs = mock_get_logs.call_args[1]
        assert call_kwargs["event_category"] == "authentication"
        assert call_kwargs["event_type"] == "login_success"
        assert call_kwargs["start_date"] is not None
        assert call_kwargs["end_date"] is not None
