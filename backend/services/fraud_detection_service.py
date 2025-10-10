"""
Fraud Detection Service
Basic fraud checks for referral system
"""
import logging
from typing import Dict
from sqlalchemy.orm import Session
from sqlalchemy import func

from models.swisstax.referral_code import ReferralCode
from models.swisstax.referral_usage import ReferralUsage

logger = logging.getLogger(__name__)


class FraudDetectionService:
    """Service for detecting fraudulent referral usage"""

    def __init__(self, db: Session):
        self.db = db

    def check_referral_fraud(
        self,
        code: str,
        user_id: str,
        referral_code: ReferralCode,
        request_metadata: Dict
    ) -> Dict:
        """
        Check for fraudulent referral usage

        Returns dict with 'is_suspicious', 'fraud_score', 'reason', 'checks'
        """
        fraud_checks = {}
        fraud_score = 0.0
        reasons = []

        # Check 1: Self-referral (owner using their own code)
        if referral_code.owner_user_id and str(referral_code.owner_user_id) == str(user_id):
            fraud_checks['self_referral'] = True
            fraud_score += 1.0
            reasons.append("Self-referral detected")
        else:
            fraud_checks['self_referral'] = False

        # Check 2: Excessive usage from same IP
        ip_address = request_metadata.get('ip_address')
        if ip_address:
            ip_usage_count = self.db.query(ReferralUsage).filter(
                ReferralUsage.ip_address == ip_address,
                ReferralUsage.referral_code_id == referral_code.id
            ).count()

            if ip_usage_count >= 3:
                fraud_checks['ip_abuse'] = True
                fraud_score += 0.5
                reasons.append(f"IP address used {ip_usage_count} times")
            else:
                fraud_checks['ip_abuse'] = False

        # Check 3: User already used this specific code
        existing_usage = self.db.query(ReferralUsage).filter(
            ReferralUsage.referred_user_id == user_id,
            ReferralUsage.referral_code_id == referral_code.id
        ).first()

        if existing_usage:
            fraud_checks['duplicate_usage'] = True
            fraud_score += 0.7
            reasons.append("Code already used by this user")
        else:
            fraud_checks['duplicate_usage'] = False

        # Determine if suspicious
        is_suspicious = fraud_score >= 0.7

        return {
            'is_suspicious': is_suspicious,
            'fraud_score': min(fraud_score, 1.0),
            'reason': '; '.join(reasons) if reasons else None,
            'checks': fraud_checks
        }
