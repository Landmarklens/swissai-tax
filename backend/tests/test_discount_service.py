"""
Unit tests for DiscountService
"""
import pytest
from unittest.mock import MagicMock, Mock
from decimal import Decimal
import uuid

from services.discount_service import DiscountService
from models.swisstax.referral_code import ReferralCode
from models.swisstax.user import User
from models.swisstax.account_credit import UserAccountCredit


class TestDiscountService:
    """Test suite for DiscountService"""

    def test_calculate_discount_percentage(self, mock_db_session):
        """Test calculating percentage discount"""
        service = DiscountService(mock_db_session)

        # Create mock referral code
        mock_code = Mock(spec=ReferralCode)
        mock_code.discount_type = 'percentage'
        mock_code.discount_value = Decimal('20.0')
        mock_code.max_discount_amount = None

        # Execute
        result = service.calculate_discount(mock_code, 'pro')

        # Verify - 20% of CHF 99 = CHF 19.80
        assert result['discount_amount_chf'] == 19.80
        assert result['original_price_chf'] == 99.00
        assert result['final_price_chf'] == 79.20
        assert result['discount_type'] == 'percentage'

    def test_calculate_discount_percentage_with_cap(self, mock_db_session):
        """Test percentage discount with maximum cap"""
        service = DiscountService(mock_db_session)

        mock_code = Mock(spec=ReferralCode)
        mock_code.discount_type = 'percentage'
        mock_code.discount_value = Decimal('50.0')  # 50%
        mock_code.max_discount_amount = Decimal('30.0')  # Max CHF 30

        # Execute - 50% of CHF 99 = 49.50, but capped at 30
        result = service.calculate_discount(mock_code, 'pro')

        # Verify
        assert result['discount_amount_chf'] == 30.00
        assert result['final_price_chf'] == 69.00

    def test_calculate_discount_fixed_amount(self, mock_db_session):
        """Test fixed amount discount"""
        service = DiscountService(mock_db_session)

        mock_code = Mock(spec=ReferralCode)
        mock_code.discount_type = 'fixed_amount'
        mock_code.discount_value = Decimal('25.0')

        # Execute
        result = service.calculate_discount(mock_code, 'premium')

        # Verify
        assert result['discount_amount_chf'] == 25.00
        assert result['original_price_chf'] == 149.00
        assert result['final_price_chf'] == 124.00

    def test_calculate_discount_fixed_exceeds_price(self, mock_db_session):
        """Test fixed discount that exceeds price is capped"""
        service = DiscountService(mock_db_session)

        mock_code = Mock(spec=ReferralCode)
        mock_code.discount_type = 'fixed_amount'
        mock_code.discount_value = Decimal('100.0')  # More than basic price

        # Execute
        result = service.calculate_discount(mock_code, 'basic')

        # Verify - discount capped at price
        assert result['discount_amount_chf'] == 49.00
        assert result['final_price_chf'] == 0.00

    def test_calculate_discount_trial_extension(self, mock_db_session):
        """Test trial extension doesn't affect price"""
        service = DiscountService(mock_db_session)

        mock_code = Mock(spec=ReferralCode)
        mock_code.discount_type = 'trial_extension'
        mock_code.discount_value = Decimal('30.0')

        # Execute
        result = service.calculate_discount(mock_code, 'pro')

        # Verify - no discount on price
        assert result['discount_amount_chf'] == 0.00
        assert result['final_price_chf'] == 99.00

    def test_calculate_discount_account_credit(self, mock_db_session):
        """Test account credit doesn't affect subscription price"""
        service = DiscountService(mock_db_session)

        mock_code = Mock(spec=ReferralCode)
        mock_code.discount_type = 'account_credit'
        mock_code.discount_value = Decimal('50.0')

        # Execute
        result = service.calculate_discount(mock_code, 'premium')

        # Verify - no discount on subscription price
        assert result['discount_amount_chf'] == 0.00
        assert result['final_price_chf'] == 149.00

    def test_calculate_discount_invalid_plan(self, mock_db_session):
        """Test error for invalid plan type"""
        service = DiscountService(mock_db_session)

        mock_code = Mock(spec=ReferralCode)
        mock_code.discount_type = 'percentage'
        mock_code.discount_value = Decimal('10.0')

        # Execute and verify exception
        with pytest.raises(ValueError, match="Unknown plan type"):
            service.calculate_discount(mock_code, 'invalid_plan')

    def test_apply_account_credits_full_payment(self, mock_db_session):
        """Test applying credits that cover full amount"""
        service = DiscountService(mock_db_session)
        user_id = uuid.uuid4()
        subscription_id = uuid.uuid4()

        # Mock user with credits
        mock_user = Mock(spec=User)
        mock_user.id = user_id
        mock_user.account_credit_balance_chf = Decimal('100.00')

        mock_query = MagicMock()
        mock_query.filter.return_value.first.return_value = mock_user
        mock_db_session.query.return_value = mock_query

        # Execute - apply to CHF 50 amount
        result = service.apply_account_credits(
            str(user_id),
            Decimal('50.00'),
            str(subscription_id)
        )

        # Verify
        assert result['credits_applied_chf'] == 50.00
        assert result['final_amount_chf'] == 0.00
        assert result['remaining_balance_chf'] == 50.00
        assert mock_user.account_credit_balance_chf == Decimal('50.00')
        mock_db_session.add.assert_called_once()  # Credit transaction added
        mock_db_session.commit.assert_called_once()

    def test_apply_account_credits_partial_payment(self, mock_db_session):
        """Test applying credits that partially cover amount"""
        service = DiscountService(mock_db_session)
        user_id = uuid.uuid4()
        subscription_id = uuid.uuid4()

        # Mock user with limited credits
        mock_user = Mock(spec=User)
        mock_user.id = user_id
        mock_user.account_credit_balance_chf = Decimal('30.00')

        mock_query = MagicMock()
        mock_query.filter.return_value.first.return_value = mock_user
        mock_db_session.query.return_value = mock_query

        # Execute - apply to CHF 99 amount
        result = service.apply_account_credits(
            str(user_id),
            Decimal('99.00'),
            str(subscription_id)
        )

        # Verify
        assert result['credits_applied_chf'] == 30.00
        assert result['final_amount_chf'] == 69.00
        assert result['remaining_balance_chf'] == 0.00
        assert mock_user.account_credit_balance_chf == Decimal('0.00')

    def test_apply_account_credits_no_credits(self, mock_db_session):
        """Test applying credits when user has none"""
        service = DiscountService(mock_db_session)
        user_id = uuid.uuid4()
        subscription_id = uuid.uuid4()

        # Mock user with no credits
        mock_user = Mock(spec=User)
        mock_user.id = user_id
        mock_user.account_credit_balance_chf = Decimal('0.00')

        mock_query = MagicMock()
        mock_query.filter.return_value.first.return_value = mock_user
        mock_db_session.query.return_value = mock_query

        # Execute
        result = service.apply_account_credits(
            str(user_id),
            Decimal('99.00'),
            str(subscription_id)
        )

        # Verify - no changes
        assert result['credits_applied_chf'] == 0.00
        assert result['final_amount_chf'] == 99.00
        assert result['remaining_balance_chf'] == 0.00
        mock_db_session.add.assert_not_called()

    def test_apply_account_credits_user_not_found(self, mock_db_session):
        """Test error when user not found"""
        service = DiscountService(mock_db_session)

        # Mock query to return None
        mock_query = MagicMock()
        mock_query.filter.return_value.first.return_value = None
        mock_db_session.query.return_value = mock_query

        # Execute and verify exception
        with pytest.raises(ValueError, match="User .* not found"):
            service.apply_account_credits(
                str(uuid.uuid4()),
                Decimal('99.00'),
                str(uuid.uuid4())
            )

    def test_plan_prices_defined(self, mock_db_session):
        """Test that all plan prices are correctly defined"""
        service = DiscountService(mock_db_session)

        assert service.PLAN_PRICES['basic'] == Decimal('49.00')
        assert service.PLAN_PRICES['pro'] == Decimal('99.00')
        assert service.PLAN_PRICES['premium'] == Decimal('149.00')
