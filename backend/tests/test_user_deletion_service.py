"""
Tests for UserDeletionService
"""
import pytest
from datetime import datetime, timedelta
from uuid import uuid4
from unittest.mock import Mock, MagicMock, patch

from models.swisstax import DeletionRequest, User, Filing, Payment
from services.user_deletion_service import UserDeletionService


class TestUserDeletionService:
    """Test suite for UserDeletionService"""

    @pytest.fixture
    def mock_db(self):
        """Create mock database session"""
        db = MagicMock()
        db.add = MagicMock()
        db.commit = MagicMock()
        db.flush = MagicMock()
        db.refresh = MagicMock()
        return db

    @pytest.fixture
    def service(self, mock_db):
        """Create service instance with mocked db"""
        return UserDeletionService(mock_db)

    @pytest.fixture
    def test_user(self):
        """Create test user mock"""
        user = Mock(spec=User)
        user.id = uuid4()
        user.email = "test@example.com"
        user.first_name = "Test"
        user.last_name = "User"
        user.is_active = True
        return user

    @pytest.fixture
    def mock_deletion_request(self):
        """Create mock deletion request"""
        request = Mock(spec=DeletionRequest)
        request.id = uuid4()
        request.user_id = uuid4()
        request.status = 'pending'
        request.verification_code = '123456'
        request.verification_token = 'test-token'
        request.requested_at = datetime.utcnow()
        request.expires_at = datetime.utcnow() + timedelta(minutes=15)
        request.scheduled_deletion_at = datetime.utcnow() + timedelta(days=7)
        request.is_verified = False
        request.is_expired = False
        request.is_ready_for_deletion = False
        request.days_until_deletion = 7
        request.can_cancel = True
        return request

    def test_generate_verification_code(self, service):
        """Test verification code generation"""
        code = service.generate_verification_code()
        assert len(code) == 6
        assert code.isdigit()

    def test_generate_secure_token(self, service):
        """Test secure token generation"""
        token = service.generate_secure_token()
        assert len(token) > 20
        assert isinstance(token, str)

    @patch('services.user_deletion_service.AuditLogService')
    def test_request_deletion_success(self, mock_audit, service, test_user, mock_db):
        """Test successful deletion request"""
        # Mock no existing deletion request
        mock_db.query.return_value.filter.return_value.first.return_value = None

        # Mock no filings or payments (count returns 0)
        mock_db.query.return_value.filter.return_value.count.return_value = 0

        request, code = service.request_deletion(
            user_id=test_user.id,
            ip_address="127.0.0.1",
            user_agent="Test Agent"
        )

        assert request.user_id == test_user.id
        assert request.status == 'pending'
        assert len(code) == 6
        assert request.verification_code == code
        assert request.verification_token is not None

        # Check timestamps
        assert request.expires_at > datetime.utcnow()
        assert request.scheduled_deletion_at > datetime.utcnow()

        # Check grace period
        delta = request.scheduled_deletion_at - request.requested_at
        assert delta.days == service.GRACE_PERIOD_DAYS

        # Verify db operations were called
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()

    @patch('services.user_deletion_service.AuditLogService')
    def test_request_deletion_duplicate(self, mock_audit, service, test_user, mock_db, mock_deletion_request):
        """Test that duplicate deletion requests are rejected"""
        # Mock existing deletion request
        mock_deletion_request.user_id = test_user.id
        mock_db.query.return_value.filter.return_value.first.return_value = mock_deletion_request

        # Second request should fail
        with pytest.raises(ValueError, match="Active deletion request already exists"):
            service.request_deletion(
                user_id=test_user.id,
                ip_address="127.0.0.1",
                user_agent="Test Agent"
            )

    @patch('services.user_deletion_service.AuditLogService')
    def test_request_deletion_with_active_filing(self, mock_audit, service, test_user, mock_db):
        """Test that deletion is blocked with active filing"""
        # Mock no existing deletion request
        mock_db.query.return_value.filter.return_value.first.return_value = None

        # Mock active filing count > 0, and pending payment count = 0
        mock_db.query.return_value.filter.return_value.count.side_effect = [1, 0]  # 1 filing, 0 payments

        # Request should fail
        with pytest.raises(ValueError, match="Cannot delete account"):
            service.request_deletion(
                user_id=test_user.id,
                ip_address="127.0.0.1",
                user_agent="Test Agent"
            )

    @patch('services.user_deletion_service.AuditLogService')
    def test_verify_deletion_success(self, mock_audit, service, test_user, mock_db, mock_deletion_request):
        """Test successful deletion verification"""
        # Setup mock deletion request
        mock_deletion_request.user_id = test_user.id
        mock_deletion_request.status = 'pending'
        mock_deletion_request.verification_code = '123456'
        mock_deletion_request.expires_at = datetime.utcnow() + timedelta(minutes=15)

        # Mock user for email sending
        test_user.preferred_language = 'en'

        # Mock query to return deletion request first, then user
        mock_db.query.return_value.filter.return_value.first.side_effect = [mock_deletion_request, test_user]

        # Verify
        verified_request = service.verify_and_schedule_deletion(
            user_id=test_user.id,
            code='123456',
            ip_address="127.0.0.1",
            user_agent="Test Agent"
        )

        assert verified_request.status == 'verified'
        assert mock_db.commit.called

    @patch('services.user_deletion_service.AuditLogService')
    def test_verify_deletion_invalid_code(self, mock_audit, service, test_user, mock_db, mock_deletion_request):
        """Test verification with invalid code"""
        # Setup mock deletion request
        mock_deletion_request.user_id = test_user.id
        mock_deletion_request.status = 'pending'
        mock_deletion_request.verification_code = '123456'
        mock_deletion_request.expires_at = datetime.utcnow() + timedelta(minutes=15)

        mock_db.query.return_value.filter.return_value.first.return_value = mock_deletion_request

        # Try to verify with wrong code
        with pytest.raises(ValueError, match="Invalid verification code"):
            service.verify_and_schedule_deletion(
                user_id=test_user.id,
                code="000000",
                ip_address="127.0.0.1",
                user_agent="Test Agent"
            )

    @patch('services.user_deletion_service.AuditLogService')
    def test_verify_deletion_no_request(self, mock_audit, service, test_user, mock_db):
        """Test verification with no pending request"""
        # Mock no deletion request found
        mock_db.query.return_value.filter.return_value.first.return_value = None

        with pytest.raises(ValueError, match="No pending deletion request found"):
            service.verify_and_schedule_deletion(
                user_id=test_user.id,
                code="123456",
                ip_address="127.0.0.1",
                user_agent="Test Agent"
            )

    @patch('services.user_deletion_service.AuditLogService')
    def test_cancel_deletion_success(self, mock_audit, service, test_user, mock_db, mock_deletion_request):
        """Test successful deletion cancellation"""
        # Setup mock deletion request
        mock_deletion_request.user_id = test_user.id
        mock_deletion_request.status = 'pending'
        mock_deletion_request.verification_token = 'test-token'
        mock_deletion_request.scheduled_deletion_at = datetime.utcnow() + timedelta(days=7)

        # Mock user for email sending
        test_user.preferred_language = 'en'

        # Mock query to return deletion request first, then user
        mock_db.query.return_value.filter.return_value.first.side_effect = [mock_deletion_request, test_user]

        # Cancel
        result = service.cancel_deletion(
            user_id=test_user.id,
            token='test-token',
            ip_address="127.0.0.1",
            user_agent="Test Agent"
        )

        assert result is True
        assert mock_deletion_request.status == 'cancelled'
        assert mock_db.commit.called

    @patch('services.user_deletion_service.AuditLogService')
    def test_cancel_deletion_invalid_token(self, mock_audit, service, test_user, mock_db):
        """Test cancellation with invalid token"""
        # Mock no deletion request found
        mock_db.query.return_value.filter.return_value.first.return_value = None

        # Try to cancel with wrong token
        with pytest.raises(ValueError, match="Deletion request not found"):
            service.cancel_deletion(
                user_id=test_user.id,
                token="invalid-token",
                ip_address="127.0.0.1",
                user_agent="Test Agent"
            )

    def test_check_deletion_blockers_none(self, service, test_user, mock_db):
        """Test blocker check with no blockers"""
        # Mock no filings or payments (count returns 0)
        mock_db.query.return_value.filter.return_value.count.return_value = 0

        blockers = service.check_deletion_blockers(test_user.id)
        assert blockers == []

    def test_check_deletion_blockers_active_filing(self, service, test_user, mock_db):
        """Test blocker check with active filing"""
        # Mock 1 filing, 0 payments
        mock_db.query.return_value.filter.return_value.count.side_effect = [1, 0]

        blockers = service.check_deletion_blockers(test_user.id)
        assert len(blockers) > 0
        assert "active tax filing" in blockers[0].lower()

    def test_check_deletion_blockers_pending_payment(self, service, test_user, mock_db):
        """Test blocker check with pending payment"""
        # Mock 0 filings, 1 payment
        mock_db.query.return_value.filter.return_value.count.side_effect = [0, 1]

        blockers = service.check_deletion_blockers(test_user.id)
        assert len(blockers) > 0
        assert "pending payment" in blockers[0].lower()

    def test_get_deletion_status_none(self, service, test_user, mock_db):
        """Test getting status when no request exists"""
        # Mock no deletion request
        mock_db.query.return_value.filter.return_value.first.return_value = None

        status = service.get_deletion_status(test_user.id)
        assert status is None

    def test_get_deletion_status_pending(self, service, test_user, mock_db, mock_deletion_request):
        """Test getting status for pending request"""
        # Setup mock deletion request
        mock_deletion_request.user_id = test_user.id
        mock_deletion_request.status = 'pending'

        mock_db.query.return_value.filter.return_value.first.return_value = mock_deletion_request

        status = service.get_deletion_status(test_user.id)
        assert status is not None
        assert status.id == mock_deletion_request.id
        assert status.status == 'pending'

    def test_deletion_request_properties(self, mock_deletion_request):
        """Test DeletionRequest model properties"""
        # Test properties on mock object
        assert mock_deletion_request.days_until_deletion == 7
        assert mock_deletion_request.can_cancel is True
        assert not mock_deletion_request.is_verified
        assert not mock_deletion_request.is_expired
        assert not mock_deletion_request.is_ready_for_deletion
