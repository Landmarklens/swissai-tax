"""
Referral Reward Model
"""
from sqlalchemy import Column, String, Boolean, Numeric, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from .base import Base, SwissTaxBase


class ReferralReward(SwissTaxBase, Base):
    """Rewards earned by referrers"""
    __tablename__ = "referral_rewards"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())

    # Referrer
    referrer_user_id = Column(UUID(as_uuid=True), ForeignKey('swisstax.users.id', ondelete='CASCADE'), index=True)

    # Source
    referral_usage_id = Column(UUID(as_uuid=True), ForeignKey('swisstax.referral_usages.id', ondelete='CASCADE'))
    referred_user_id = Column(UUID(as_uuid=True), ForeignKey('swisstax.users.id', ondelete='SET NULL'))

    # Reward Details
    reward_type = Column(String(20), nullable=False)
    reward_amount_chf = Column(Numeric(10, 2), nullable=False)

    # Status
    status = Column(String(20), default='pending', index=True)
    approval_required = Column(Boolean, default=True)
    approved_by_admin_id = Column(UUID(as_uuid=True))
    approved_at = Column(DateTime(timezone=True))
    rejection_reason = Column(Text)

    # Payout
    payout_method = Column(String(50))
    payout_reference = Column(String(255))
    paid_at = Column(DateTime(timezone=True))

    # Expiration
    expires_at = Column(DateTime(timezone=True))

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    referrer = relationship("User", foreign_keys=[referrer_user_id])
    referral_usage = relationship("ReferralUsage", back_populates="rewards")

    def __repr__(self):
        return f"<ReferralReward(referrer={self.referrer_user_id}, amount={self.reward_amount_chf})>"
