"""
Unit tests for ReferralService
"""
import pytest
from unittest.mock import MagicMock, Mock, patch
from datetime import datetime, timezone, timedelta
from decimal import Decimal
import uuid

from services.referral_service import ReferralService
from models.swisstax.referral_code import ReferralCode
from models.swisstax.referral_usage import ReferralUsage
from models.swisstax.referral_reward import ReferralReward
from models.swisstax.user import User
from models.swisstax.account_credit import UserAccountCredit
from models.swisstax.subscription import Subscription


@pytest.fixture
def mock_referral_code():
    """Create a mock referral code"""
    code = Mock(spec=ReferralCode)
    code.id = uuid.uuid4()
    code.code = "REF-TEST123"
    code.code_type = "user_referral"
    code.owner_user_id = uuid.uuid4()
    code.discount_type = "percentage"
    code.discount_value = Decimal('10.0')
    code.max_discount_amount = None
    code.applicable_plans = None
    code.first_time_only = True
    code.max_uses_per_user = 1
    code.current_usage_count = 0
    code.max_total_uses = None
    code.is_active = True
    code.is_valid = True
    code.valid_from = datetime.now(timezone.utc) - timedelta(days=1)
    code.valid_until = None
    return code


@pytest.fixture
def mock_promotional_code():
    """Create a mock promotional code"""
    code = Mock(spec=ReferralCode)
    code.id = uuid.uuid4()
    code.code = "SPRING2024"
    code.code_type = "promotional"
    code.owner_user_id = None
    code.discount_type = "percentage"
    code.discount_value = Decimal('20.0')
    code.max_discount_amount = Decimal('50.0')
    code.applicable_plans = ["pro", "premium"]
    code.first_time_only = True
    code.max_uses_per_user = 1
    code.current_usage_count = 5
    code.max_total_uses = 100
    code.is_active = True
    code.is_valid = True
    return code


class TestReferralService:
    """Test suite for ReferralService"""

    def test_generate_user_referral_code_new_user(self, mock_db_session):
        """Test generating a referral code for a new user"""
        service = ReferralService(mock_db_session)
        user_id = uuid.uuid4()

        # Mock query to return None (no existing code)
        mock_query = MagicMock()
        mock_query.filter.return_value.first.return_value = None
        mock_db_session.query.return_value = mock_query

        # Mock user query
        mock_user = Mock(spec=User)
        mock_user.id = user_id
        mock_user.personal_referral_code = None
        mock_user_query = MagicMock()
        mock_user_query.filter.return_value.first.return_value = mock_user

        # Setup query to return different results based on model
        def query_side_effect(model):
            if model == User:
                return mock_user_query
            return mock_query

        mock_db_session.query.side_effect = query_side_effect

        # Execute
        result = service.generate_user_referral_code(str(user_id))

        # Verify
        assert result is not None
        assert result.code.startswith("REF-")
        assert result.code_type == "user_referral"
        assert result.discount_type == "percentage"
        assert result.discount_value == 10.0
        mock_db_session.add.assert_called_once()
        assert mock_db_session.commit.call_count == 2  # Once for code, once for user

    def test_generate_user_referral_code_existing_code(self, mock_db_session, mock_referral_code):
        """Test that existing code is returned instead of creating a new one"""
        service = ReferralService(mock_db_session)
        user_id = uuid.uuid4()

        # Mock query to return existing code
        mock_query = MagicMock()
        mock_query.filter.return_value.first.return_value = mock_referral_code
        mock_db_session.query.return_value = mock_query

        # Execute
        result = service.generate_user_referral_code(str(user_id))

        # Verify
        assert result == mock_referral_code
        mock_db_session.add.assert_not_called()

    def test_validate_code_valid(self, mock_db_session, mock_referral_code):
        """Test validating a valid referral code"""
        service = ReferralService(mock_db_session)
        user_id = uuid.uuid4()
        request_metadata = {'ip_address': '127.0.0.1', 'user_agent': 'test'}

        # Mock queries
        mock_code_query = MagicMock()
        mock_code_query.filter.return_value.first.return_value = mock_referral_code

        mock_sub_query = MagicMock()
        mock_sub_query.filter.return_value.count.return_value = 0

        mock_usage_query = MagicMock()
        mock_usage_query.filter.return_value.count.return_value = 0

        def query_side_effect(model):
            if model == ReferralCode:
                return mock_code_query
            elif model == Subscription:
                return mock_sub_query
            elif model == ReferralUsage:
                return mock_usage_query

        mock_db_session.query.side_effect = query_side_effect

        # Mock fraud service
        with patch.object(service.fraud_service, 'check_referral_fraud') as mock_fraud:
            mock_fraud.return_value = {'is_suspicious': False}

            # Execute
            is_valid, code, error = service.validate_code(
                "REF-TEST123",
                str(user_id),
                "pro",
                request_metadata
            )

            # Verify
            assert is_valid is True
            assert code == mock_referral_code
            assert error is None

    def test_validate_code_invalid_code(self, mock_db_session):
        """Test validating an invalid code"""
        service = ReferralService(mock_db_session)
        user_id = uuid.uuid4()

        # Mock query to return None
        mock_query = MagicMock()
        mock_query.filter.return_value.first.return_value = None
        mock_db_session.query.return_value = mock_query

        # Execute
        is_valid, code, error = service.validate_code(
            "INVALID",
            str(user_id),
            "pro",
            {}
        )

        # Verify
        assert is_valid is False
        assert code is None
        assert error == "Invalid code"

    def test_validate_code_self_referral(self, mock_db_session, mock_referral_code):
        """Test that self-referral is rejected"""
        service = ReferralService(mock_db_session)
        user_id = mock_referral_code.owner_user_id  # Same as code owner

        # Mock query
        mock_query = MagicMock()
        mock_query.filter.return_value.first.return_value = mock_referral_code
        mock_db_session.query.return_value = mock_query

        # Execute
        is_valid, code, error = service.validate_code(
            "REF-TEST123",
            str(user_id),
            "pro",
            {}
        )

        # Verify
        assert is_valid is False
        assert error == "You cannot use your own referral code"

    def test_validate_code_wrong_plan(self, mock_db_session, mock_promotional_code):
        """Test that code with plan restrictions rejects wrong plans"""
        service = ReferralService(mock_db_session)
        user_id = uuid.uuid4()

        # Mock query
        mock_query = MagicMock()
        mock_query.filter.return_value.first.return_value = mock_promotional_code
        mock_db_session.query.return_value = mock_query

        # Execute - try to use with 'basic' plan
        is_valid, code, error = service.validate_code(
            "SPRING2024",
            str(user_id),
            "basic",
            {}
        )

        # Verify
        assert is_valid is False
        assert "not valid for the basic plan" in error

    def test_validate_code_not_first_time(self, mock_db_session, mock_referral_code):
        """Test that first-time-only codes reject existing subscribers"""
        service = ReferralService(mock_db_session)
        user_id = uuid.uuid4()

        # Mock code query
        mock_code_query = MagicMock()
        mock_code_query.filter.return_value.first.return_value = mock_referral_code

        # Mock subscription query to return existing subscription
        mock_sub_query = MagicMock()
        mock_sub_query.filter.return_value.count.return_value = 1

        def query_side_effect(model):
            if model == ReferralCode:
                return mock_code_query
            elif model == Subscription:
                return mock_sub_query

        mock_db_session.query.side_effect = query_side_effect

        # Execute
        is_valid, code, error = service.validate_code(
            "REF-TEST123",
            str(user_id),
            "pro",
            {}
        )

        # Verify
        assert is_valid is False
        assert "first-time subscribers" in error

    def test_record_code_usage(self, mock_db_session, mock_referral_code):
        """Test recording code usage"""
        service = ReferralService(mock_db_session)
        user_id = uuid.uuid4()
        subscription_id = uuid.uuid4()

        # Mock referral code query
        mock_code_query = MagicMock()
        mock_code_query.filter.return_value.first.return_value = mock_referral_code

        # Mock user queries
        mock_user = Mock(spec=User)
        mock_user.id = user_id
        mock_user.referred_by_code = None
        mock_user_query = MagicMock()
        mock_user_query.filter.return_value.first.return_value = mock_user

        mock_owner = Mock(spec=User)
        mock_owner.id = mock_referral_code.owner_user_id
        mock_owner.total_referrals_count = 0
        mock_owner_query = MagicMock()
        mock_owner_query.filter.return_value.first.return_value = mock_owner

        # Setup queries
        user_call_count = [0]
        def query_side_effect(model):
            if model == ReferralCode:
                return mock_code_query
            elif model == User:
                user_call_count[0] += 1
                if user_call_count[0] == 1:
                    return mock_user_query
                else:
                    return mock_owner_query

        mock_db_session.query.side_effect = query_side_effect

        # Execute
        result = service.record_code_usage(
            "REF-TEST123",
            str(user_id),
            str(subscription_id),
            Decimal('10.00'),
            Decimal('100.00'),
            Decimal('90.00'),
            {'ip_address': '127.0.0.1'}
        )

        # Verify
        assert result is not None
        mock_db_session.add.assert_called_once()
        mock_db_session.commit.assert_called_once()
        assert mock_referral_code.current_usage_count == 1
        assert mock_owner.total_referrals_count == 1

    def test_create_reward(self, mock_db_session, mock_referral_code):
        """Test creating a reward for a referral"""
        service = ReferralService(mock_db_session)

        # Create mock usage
        mock_usage = Mock(spec=ReferralUsage)
        mock_usage.id = uuid.uuid4()
        mock_usage.referral_code = mock_referral_code
        mock_usage.referred_user_id = uuid.uuid4()
        mock_usage.final_price_chf = Decimal('99.00')
        mock_usage.code_used = "REF-TEST123"
        mock_usage.status = 'pending'

        # Mock referrer
        mock_referrer = Mock(spec=User)
        mock_referrer.id = mock_referral_code.owner_user_id
        mock_referrer.successful_referrals_count = 0
        mock_referrer.account_credit_balance_chf = Decimal('0.00')
        mock_referrer.total_rewards_earned_chf = Decimal('0.00')

        # Mock queries
        mock_usage_query = MagicMock()
        mock_usage_query.filter.return_value.first.return_value = mock_usage

        mock_user_query = MagicMock()
        mock_user_query.filter.return_value.first.return_value = mock_referrer

        def query_side_effect(model):
            if model == ReferralUsage:
                return mock_usage_query
            elif model == User:
                return mock_user_query

        mock_db_session.query.side_effect = query_side_effect

        # Execute
        result = service.create_reward(str(mock_usage.id))

        # Verify
        assert result is not None
        assert mock_db_session.add.call_count == 2  # reward + credit
        assert mock_usage.status == 'completed'
        assert mock_referrer.successful_referrals_count == 1
        # Reward should be min(10, 99*0.10) = 9.90
        assert mock_referrer.account_credit_balance_chf == Decimal('9.90')

    def test_create_reward_promotional_code(self, mock_db_session, mock_promotional_code):
        """Test that promotional codes don't create rewards"""
        service = ReferralService(mock_db_session)

        # Create mock usage with promotional code
        mock_usage = Mock(spec=ReferralUsage)
        mock_usage.id = uuid.uuid4()
        mock_usage.referral_code = mock_promotional_code

        # Mock query
        mock_query = MagicMock()
        mock_query.filter.return_value.first.return_value = mock_usage
        mock_db_session.query.return_value = mock_query

        # Execute
        result = service.create_reward(str(mock_usage.id))

        # Verify - should return None for promotional codes
        assert result is None

    def test_get_user_referral_stats(self, mock_db_session, mock_referral_code):
        """Test getting user referral statistics"""
        service = ReferralService(mock_db_session)
        user_id = uuid.uuid4()

        # Mock user
        mock_user = Mock(spec=User)
        mock_user.id = user_id
        mock_user.total_referrals_count = 5
        mock_user.successful_referrals_count = 3
        mock_user.total_rewards_earned_chf = Decimal('30.00')
        mock_user.account_credit_balance_chf = Decimal('15.00')

        # Mock queries
        mock_user_query = MagicMock()
        mock_user_query.filter.return_value.first.return_value = mock_user

        mock_code_query = MagicMock()
        mock_code_query.filter.return_value.first.return_value = mock_referral_code

        def query_side_effect(model):
            if model == User:
                return mock_user_query
            elif model == ReferralCode:
                return mock_code_query

        mock_db_session.query.side_effect = query_side_effect

        # Execute
        stats = service.get_user_referral_stats(str(user_id))

        # Verify
        assert stats['referral_code'] == "REF-TEST123"
        assert stats['total_referrals'] == 5
        assert stats['successful_referrals'] == 3
        assert stats['pending_referrals'] == 2
        assert stats['total_rewards_earned_chf'] == 30.00
        assert stats['account_credit_balance_chf'] == 15.00

    def test_get_user_referral_stats_user_not_found(self, mock_db_session):
        """Test getting stats for non-existent user raises error"""
        service = ReferralService(mock_db_session)

        # Mock query to return None
        mock_query = MagicMock()
        mock_query.filter.return_value.first.return_value = None
        mock_db_session.query.return_value = mock_query

        # Execute and verify exception
        with pytest.raises(ValueError, match="User .* not found"):
            service.get_user_referral_stats(str(uuid.uuid4()))

    def test_generate_unique_code(self, mock_db_session):
        """Test unique code generation"""
        service = ReferralService(mock_db_session)

        # Mock query to always return None (code is available)
        mock_query = MagicMock()
        mock_query.filter.return_value.first.return_value = None
        mock_db_session.query.return_value = mock_query

        # Execute
        code = service._generate_unique_code("TEST")

        # Verify
        assert code.startswith("TEST-")
        assert len(code) == 13  # TEST- + 8 chars

    def test_is_code_available(self, mock_db_session):
        """Test checking code availability"""
        service = ReferralService(mock_db_session)

        # Mock query to return None (available)
        mock_query = MagicMock()
        mock_query.filter.return_value.first.return_value = None
        mock_db_session.query.return_value = mock_query

        # Execute
        is_available = service._is_code_available("NEWCODE")

        # Verify
        assert is_available is True

        # Test when code exists
        mock_query.filter.return_value.first.return_value = Mock()
        is_available = service._is_code_available("EXISTINGCODE")
        assert is_available is False
