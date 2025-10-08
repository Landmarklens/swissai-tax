"""
Tests for UserDeletionService
"""
import pytest
from datetime import datetime, timedelta
from uuid import uuid4

from sqlalchemy.orm import Session

from models.swisstax import DeletionRequest, User, Filing, Payment
from services.user_deletion_service import UserDeletionService


class TestUserDeletionService:
    """Test suite for UserDeletionService"""

    @pytest.fixture
    def service(self, db_session: Session):
        """Create service instance"""
        return UserDeletionService(db_session)

    @pytest.fixture
    def test_user(self, db_session: Session):
        """Create test user"""
        user = User(
            id=uuid4(),
            email="test@example.com",
            first_name="Test",
            last_name="User",
            is_active=True
        )
        db_session.add(user)
        db_session.commit()
        return user

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

    def test_request_deletion_success(self, service, test_user):
        """Test successful deletion request"""
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

    def test_request_deletion_duplicate(self, service, test_user):
        """Test that duplicate deletion requests are rejected"""
        # First request
        service.request_deletion(
            user_id=test_user.id,
            ip_address="127.0.0.1",
            user_agent="Test Agent"
        )

        # Second request should fail
        with pytest.raises(ValueError, match="Active deletion request already exists"):
            service.request_deletion(
                user_id=test_user.id,
                ip_address="127.0.0.1",
                user_agent="Test Agent"
            )

    def test_request_deletion_with_active_filing(self, service, test_user, db_session):
        """Test that deletion is blocked with active filing"""
        # Create active filing
        filing = Filing(
            id=uuid4(),
            user_id=test_user.id,
            session_id=uuid4(),
            tax_year=2024,
            status='submitted'
        )
        db_session.add(filing)
        db_session.commit()

        # Request should fail
        with pytest.raises(ValueError, match="Cannot delete account"):
            service.request_deletion(
                user_id=test_user.id,
                ip_address="127.0.0.1",
                user_agent="Test Agent"
            )

    def test_verify_deletion_success(self, service, test_user):
        """Test successful deletion verification"""
        # Create request
        request, code = service.request_deletion(
            user_id=test_user.id,
            ip_address="127.0.0.1",
            user_agent="Test Agent"
        )

        # Verify
        verified_request = service.verify_and_schedule_deletion(
            user_id=test_user.id,
            code=code,
            ip_address="127.0.0.1",
            user_agent="Test Agent"
        )

        assert verified_request.status == 'verified'
        assert verified_request.id == request.id

    def test_verify_deletion_invalid_code(self, service, test_user):
        """Test verification with invalid code"""
        # Create request
        service.request_deletion(
            user_id=test_user.id,
            ip_address="127.0.0.1",
            user_agent="Test Agent"
        )

        # Try to verify with wrong code
        with pytest.raises(ValueError, match="Invalid verification code"):
            service.verify_and_schedule_deletion(
                user_id=test_user.id,
                code="000000",
                ip_address="127.0.0.1",
                user_agent="Test Agent"
            )

    def test_verify_deletion_no_request(self, service, test_user):
        """Test verification with no pending request"""
        with pytest.raises(ValueError, match="No pending deletion request found"):
            service.verify_and_schedule_deletion(
                user_id=test_user.id,
                code="123456",
                ip_address="127.0.0.1",
                user_agent="Test Agent"
            )

    def test_cancel_deletion_success(self, service, test_user):
        """Test successful deletion cancellation"""
        # Create and verify request
        request, code = service.request_deletion(
            user_id=test_user.id,
            ip_address="127.0.0.1",
            user_agent="Test Agent"
        )

        # Cancel
        result = service.cancel_deletion(
            user_id=test_user.id,
            token=request.verification_token,
            ip_address="127.0.0.1",
            user_agent="Test Agent"
        )

        assert result is True

        # Check status
        from models.swisstax import DeletionRequest
        updated_request = service.db.query(DeletionRequest).filter(
            DeletionRequest.id == request.id
        ).first()
        assert updated_request.status == 'cancelled'

    def test_cancel_deletion_invalid_token(self, service, test_user):
        """Test cancellation with invalid token"""
        # Create request
        service.request_deletion(
            user_id=test_user.id,
            ip_address="127.0.0.1",
            user_agent="Test Agent"
        )

        # Try to cancel with wrong token
        with pytest.raises(ValueError, match="Deletion request not found"):
            service.cancel_deletion(
                user_id=test_user.id,
                token="invalid-token",
                ip_address="127.0.0.1",
                user_agent="Test Agent"
            )

    def test_check_deletion_blockers_none(self, service, test_user):
        """Test blocker check with no blockers"""
        blockers = service.check_deletion_blockers(test_user.id)
        assert blockers == []

    def test_check_deletion_blockers_active_filing(self, service, test_user, db_session):
        """Test blocker check with active filing"""
        filing = Filing(
            id=uuid4(),
            user_id=test_user.id,
            session_id=uuid4(),
            tax_year=2024,
            status='submitted'
        )
        db_session.add(filing)
        db_session.commit()

        blockers = service.check_deletion_blockers(test_user.id)
        assert len(blockers) > 0
        assert "active tax filing" in blockers[0].lower()

    def test_check_deletion_blockers_pending_payment(self, service, test_user, db_session):
        """Test blocker check with pending payment"""
        payment = Payment(
            id=uuid4(),
            user_id=test_user.id,
            amount_chf=100.00,
            status='pending'
        )
        db_session.add(payment)
        db_session.commit()

        blockers = service.check_deletion_blockers(test_user.id)
        assert len(blockers) > 0
        assert "pending payment" in blockers[0].lower()

    def test_get_deletion_status_none(self, service, test_user):
        """Test getting status when no request exists"""
        status = service.get_deletion_status(test_user.id)
        assert status is None

    def test_get_deletion_status_pending(self, service, test_user):
        """Test getting status for pending request"""
        request, _ = service.request_deletion(
            user_id=test_user.id,
            ip_address="127.0.0.1",
            user_agent="Test Agent"
        )

        status = service.get_deletion_status(test_user.id)
        assert status is not None
        assert status.id == request.id
        assert status.status == 'pending'

    def test_deletion_request_properties(self, service, test_user):
        """Test DeletionRequest model properties"""
        request, code = service.request_deletion(
            user_id=test_user.id,
            ip_address="127.0.0.1",
            user_agent="Test Agent"
        )

        # Test properties
        assert not request.is_verified
        assert not request.is_expired
        assert not request.is_ready_for_deletion
        assert request.days_until_deletion == service.GRACE_PERIOD_DAYS
        assert request.can_cancel

        # Verify and test again
        service.verify_and_schedule_deletion(
            user_id=test_user.id,
            code=code,
            ip_address="127.0.0.1",
            user_agent="Test Agent"
        )

        # Refresh from DB
        from models.swisstax import DeletionRequest
        request = service.db.query(DeletionRequest).filter(
            DeletionRequest.id == request.id
        ).first()

        assert request.is_verified
        assert request.can_cancel


# Pytest fixtures (would normally be in conftest.py)
@pytest.fixture
def db_session():
    """Create test database session"""
    # This would create an in-memory SQLite database for testing
    # For now, this is a placeholder
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from models.swisstax.base import Base

    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    yield session

    session.close()
