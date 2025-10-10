"""
Referral Service - Core referral business logic (Streamlined Version)
"""
import logging
import secrets
import string
from typing import Optional, Tuple, Dict
from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import func

from models.swisstax.referral_code import ReferralCode
from models.swisstax.referral_usage import ReferralUsage
from models.swisstax.referral_reward import ReferralReward
from models.swisstax.user import User
from models.swisstax.account_credit import UserAccountCredit
from models.swisstax.subscription import Subscription
from services.fraud_detection_service import FraudDetectionService

logger = logging.getLogger(__name__)


class ReferralService:
    """Service for managing referral codes and rewards"""

    def __init__(self, db: Session):
        self.db = db
        self.fraud_service = FraudDetectionService(db)

    def generate_user_referral_code(self, user_id: str) -> ReferralCode:
        """Generate a unique referral code for a user"""
        existing = self.db.query(ReferralCode).filter(
            ReferralCode.owner_user_id == user_id,
            ReferralCode.code_type == 'user_referral'
        ).first()

        if existing:
            return existing

        code = self._generate_unique_code(prefix="REF")

        referral_code = ReferralCode(
            code=code,
            code_type='user_referral',
            owner_user_id=user_id,
            discount_type='percentage',
            discount_value=10.0,
            first_time_only=True,
            max_uses_per_user=1,
            is_active=True
        )

        self.db.add(referral_code)
        self.db.commit()
        self.db.refresh(referral_code)

        user = self.db.query(User).filter(User.id == user_id).first()
        if user:
            user.personal_referral_code = code
            self.db.commit()

        logger.info(f"Created referral code {code} for user {user_id}")
        return referral_code

    def validate_code(
        self,
        code: str,
        user_id: str,
        plan_type: str,
        request_metadata: Dict
    ) -> Tuple[bool, Optional[ReferralCode], Optional[str]]:
        """Validate if a referral/discount code can be used"""
        referral_code = self.db.query(ReferralCode).filter(
            func.upper(ReferralCode.code) == code.upper()
        ).first()

        if not referral_code:
            return False, None, "Invalid code"

        if not referral_code.is_valid:
            return False, referral_code, "This code is not currently valid"

        if referral_code.code_type == 'user_referral' and str(referral_code.owner_user_id) == str(user_id):
            return False, referral_code, "You cannot use your own referral code"

        if referral_code.applicable_plans and plan_type not in referral_code.applicable_plans:
            return False, referral_code, f"This code is not valid for the {plan_type} plan"

        if referral_code.first_time_only:
            existing_subs = self.db.query(Subscription).filter(
                Subscription.user_id == user_id
            ).count()
            if existing_subs > 0:
                return False, referral_code, "This code is only valid for first-time subscribers"

        user_usage_count = self.db.query(ReferralUsage).filter(
            ReferralUsage.referral_code_id == referral_code.id,
            ReferralUsage.referred_user_id == user_id
        ).count()

        if referral_code.max_uses_per_user and user_usage_count >= referral_code.max_uses_per_user:
            return False, referral_code, "You have already used this code"

        fraud_result = self.fraud_service.check_referral_fraud(
            code=code,
            user_id=user_id,
            referral_code=referral_code,
            request_metadata=request_metadata
        )

        if fraud_result['is_suspicious']:
            logger.warning(f"Fraud suspected for code {code} by user {user_id}")
            return False, referral_code, "Unable to validate code. Please contact support."

        return True, referral_code, None

    def record_code_usage(
        self,
        code: str,
        user_id: str,
        subscription_id: str,
        discount_applied: Decimal,
        original_price: Decimal,
        final_price: Decimal,
        request_metadata: Dict,
        stripe_coupon_id: Optional[str] = None
    ) -> ReferralUsage:
        """Record that a referral code was used"""
        referral_code = self.db.query(ReferralCode).filter(
            func.upper(ReferralCode.code) == code.upper()
        ).first()

        if not referral_code:
            raise ValueError(f"Referral code {code} not found")

        usage = ReferralUsage(
            referral_code_id=referral_code.id,
            code_used=code.upper(),
            referred_user_id=user_id,
            subscription_id=subscription_id,
            discount_amount_chf=discount_applied,
            original_price_chf=original_price,
            final_price_chf=final_price,
            discount_type=referral_code.discount_type,
            stripe_coupon_id=stripe_coupon_id,
            ip_address=request_metadata.get('ip_address'),
            user_agent=request_metadata.get('user_agent'),
            fraud_score=request_metadata.get('fraud_score', 0.0),
            status='pending'
        )

        self.db.add(usage)
        referral_code.current_usage_count += 1

        user = self.db.query(User).filter(User.id == user_id).first()
        if user:
            user.referred_by_code = code.upper()

        if referral_code.code_type == 'user_referral' and referral_code.owner_user_id:
            owner = self.db.query(User).filter(User.id == referral_code.owner_user_id).first()
            if owner:
                owner.total_referrals_count += 1

        self.db.commit()
        self.db.refresh(usage)

        logger.info(f"Recorded usage of code {code} by user {user_id}")
        return usage

    def create_reward(self, referral_usage_id: str) -> Optional[ReferralReward]:
        """Create reward for a referral (called after subscription confirmed)"""
        usage = self.db.query(ReferralUsage).filter(
            ReferralUsage.id == referral_usage_id
        ).first()

        if not usage or usage.referral_code.code_type != 'user_referral':
            return None

        referrer_id = usage.referral_code.owner_user_id
        if not referrer_id:
            return None

        reward_amount = min(Decimal('10.00'), Decimal(str(usage.final_price_chf)) * Decimal('0.10'))

        reward = ReferralReward(
            referrer_user_id=referrer_id,
            referral_usage_id=usage.id,
            referred_user_id=usage.referred_user_id,
            reward_type='account_credit',
            reward_amount_chf=reward_amount,
            status='approved',  # Auto-approve
            approval_required=False
        )

        self.db.add(reward)
        usage.status = 'completed'
        usage.completed_at = datetime.now(timezone.utc)

        referrer = self.db.query(User).filter(User.id == referrer_id).first()
        if referrer:
            referrer.successful_referrals_count += 1

            # Credit account immediately
            credit = UserAccountCredit(
                user_id=referrer.id,
                amount_chf=reward_amount,
                transaction_type='earned',
                source_type='referral_reward',
                source_id=reward.id,
                balance_before=referrer.account_credit_balance_chf or 0,
                balance_after=(referrer.account_credit_balance_chf or 0) + reward_amount,
                description=f"Referral reward for code {usage.code_used}"
            )
            self.db.add(credit)
            referrer.account_credit_balance_chf = (referrer.account_credit_balance_chf or 0) + reward_amount
            referrer.total_rewards_earned_chf = (referrer.total_rewards_earned_chf or 0) + reward_amount

        self.db.commit()
        self.db.refresh(reward)

        logger.info(f"Created reward {reward.id} for referrer {referrer_id}")
        return reward

    def get_user_referral_stats(self, user_id: str) -> Dict:
        """Get referral statistics for a user"""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError(f"User {user_id} not found")

        referral_code = self.db.query(ReferralCode).filter(
            ReferralCode.owner_user_id == user_id,
            ReferralCode.code_type == 'user_referral'
        ).first()

        return {
            'referral_code': referral_code.code if referral_code else None,
            'total_referrals': user.total_referrals_count or 0,
            'successful_referrals': user.successful_referrals_count or 0,
            'pending_referrals': (user.total_referrals_count or 0) - (user.successful_referrals_count or 0),
            'total_rewards_earned_chf': float(user.total_rewards_earned_chf or 0),
            'account_credit_balance_chf': float(user.account_credit_balance_chf or 0)
        }

    def _generate_unique_code(self, prefix: str = "REF", length: int = 8) -> str:
        """Generate a unique random code"""
        chars = string.ascii_uppercase + string.digits
        for _ in range(100):
            random_part = ''.join(secrets.choice(chars) for _ in range(length))
            code = f"{prefix}-{random_part}"
            if self._is_code_available(code):
                return code
        raise RuntimeError("Failed to generate unique code")

    def _is_code_available(self, code: str) -> bool:
        """Check if code is available"""
        return self.db.query(ReferralCode).filter(
            func.upper(ReferralCode.code) == code.upper()
        ).first() is None
