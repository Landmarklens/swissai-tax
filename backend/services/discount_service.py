"""
Discount Service - Calculate and apply discounts
"""
import logging
from typing import Dict, Optional
from decimal import Decimal
from sqlalchemy.orm import Session

from models.swisstax.referral_code import ReferralCode
from models.swisstax.user import User
from models.swisstax.account_credit import UserAccountCredit

logger = logging.getLogger(__name__)


class DiscountService:
    """Service for calculating discount amounts"""

    # Base plan prices in CHF
    PLAN_PRICES = {
        'basic': Decimal('49.00'),
        'pro': Decimal('99.00'),
        'premium': Decimal('149.00')
    }

    def __init__(self, db: Session):
        self.db = db

    def calculate_discount(
        self,
        referral_code: ReferralCode,
        plan_type: str,
        original_price: Optional[Decimal] = None
    ) -> Dict:
        """Calculate discount amount for a given code and plan"""
        # Get original price
        if original_price is None:
            original_price = self.PLAN_PRICES.get(plan_type)
            if original_price is None:
                raise ValueError(f"Unknown plan type: {plan_type}")

        discount_amount = Decimal('0.00')
        discount_type = referral_code.discount_type

        if discount_type == 'percentage':
            percentage = Decimal(str(referral_code.discount_value)) / Decimal('100')
            discount_amount = original_price * percentage

            if referral_code.max_discount_amount:
                max_discount = Decimal(str(referral_code.max_discount_amount))
                discount_amount = min(discount_amount, max_discount)

        elif discount_type == 'fixed_amount':
            discount_amount = Decimal(str(referral_code.discount_value))
            discount_amount = min(discount_amount, original_price)

        elif discount_type in ('trial_extension', 'account_credit'):
            discount_amount = Decimal('0.00')

        else:
            raise ValueError(f"Unknown discount type: {discount_type}")

        final_price = max(Decimal('0.00'), original_price - discount_amount)

        return {
            'discount_amount_chf': float(discount_amount),
            'original_price_chf': float(original_price),
            'final_price_chf': float(final_price),
            'discount_type': discount_type,
            'discount_value': float(referral_code.discount_value)
        }

    def apply_account_credits(
        self,
        user_id: str,
        amount_due: Decimal,
        subscription_id: str
    ) -> Dict:
        """Apply user's account credits to a subscription payment"""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError(f"User {user_id} not found")

        available_credits = Decimal(str(user.account_credit_balance_chf or 0))

        if available_credits <= 0:
            return {
                'credits_applied_chf': 0.00,
                'final_amount_chf': float(amount_due),
                'remaining_balance_chf': 0.00
            }

        credits_to_apply = min(available_credits, amount_due)
        final_amount = amount_due - credits_to_apply
        remaining_balance = available_credits - credits_to_apply

        # Create credit transaction
        credit_tx = UserAccountCredit(
            user_id=user_id,
            amount_chf=-credits_to_apply,
            transaction_type='spent',
            source_type='subscription_payment',
            balance_before=available_credits,
            balance_after=remaining_balance,
            applied_to_subscription_id=subscription_id,
            description=f"Applied to subscription {subscription_id}"
        )

        self.db.add(credit_tx)
        user.account_credit_balance_chf = remaining_balance
        self.db.commit()

        logger.info(f"Applied CHF {credits_to_apply} credits for user {user_id}")

        return {
            'credits_applied_chf': float(credits_to_apply),
            'final_amount_chf': float(final_amount),
            'remaining_balance_chf': float(remaining_balance)
        }
