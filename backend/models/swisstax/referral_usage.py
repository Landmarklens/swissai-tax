"""
Referral Usage/History Model
"""
from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB, INET
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from .base import Base, SwissTaxBase


class ReferralUsage(SwissTaxBase, Base):
    """Track when referral codes are used"""
    __tablename__ = "referral_usages"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())

    # Code & User
    referral_code_id = Column(UUID(as_uuid=True), ForeignKey('swisstax.referral_codes.id', ondelete='CASCADE'), index=True)
    code_used = Column(String(50), nullable=False)
    referred_user_id = Column(UUID(as_uuid=True), ForeignKey('swisstax.users.id', ondelete='SET NULL'), index=True)

    # Subscription Created
    subscription_id = Column(UUID(as_uuid=True), ForeignKey('swisstax.subscriptions.id', ondelete='SET NULL'))
    payment_id = Column(UUID(as_uuid=True), ForeignKey('swisstax.payments.id', ondelete='SET NULL'))

    # Discount Applied
    discount_amount_chf = Column(Numeric(10, 2), nullable=False)
    original_price_chf = Column(Numeric(10, 2), nullable=False)
    final_price_chf = Column(Numeric(10, 2), nullable=False)
    discount_type = Column(String(20))

    # Stripe Integration
    stripe_coupon_id = Column(String(255))
    stripe_promotion_code_id = Column(String(255))

    # Status
    status = Column(String(20), default='pending', index=True)

    # Fraud Detection
    ip_address = Column(INET)
    user_agent = Column(Text)
    device_fingerprint = Column(String(255))
    fraud_score = Column(Numeric(3, 2), default=0.0)
    fraud_checks = Column(JSONB)

    # Timestamps
    used_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    completed_at = Column(DateTime(timezone=True))

    # Relationships
    referral_code = relationship("ReferralCode", back_populates="usages")
    referred_user = relationship("User", foreign_keys=[referred_user_id])
    subscription = relationship("Subscription")
    rewards = relationship("ReferralReward", back_populates="referral_usage")

    def __repr__(self):
        return f"<ReferralUsage(code={self.code_used}, user={self.referred_user_id})>"
