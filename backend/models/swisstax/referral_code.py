"""
Referral Code Model
"""
from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import Column, String, Boolean, Integer, Numeric, DateTime, ForeignKey, CheckConstraint, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from .base import Base, SwissTaxBase


class ReferralCode(SwissTaxBase, Base):
    """Referral and promotional discount codes"""
    __tablename__ = "referral_codes"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())

    # Code Details
    code = Column(String(50), unique=True, nullable=False, index=True)
    code_type = Column(String(20), nullable=False)  # user_referral, promotional, partner

    # Ownership
    owner_user_id = Column(UUID(as_uuid=True), ForeignKey('swisstax.users.id', ondelete='SET NULL'), index=True)

    # Discount Configuration
    discount_type = Column(String(20), nullable=False)  # percentage, fixed_amount, trial_extension, account_credit
    discount_value = Column(Numeric(10, 2), nullable=False)
    max_discount_amount = Column(Numeric(10, 2))

    # Applicability
    applicable_plans = Column(JSONB)  # ['basic', 'pro'] or null for all
    first_time_only = Column(Boolean, default=True)
    minimum_subscription_months = Column(Integer, default=1)

    # Usage Limits
    max_total_uses = Column(Integer)  # null = unlimited
    max_uses_per_user = Column(Integer, default=1)
    current_usage_count = Column(Integer, default=0)

    # Validity
    valid_from = Column(DateTime(timezone=True), server_default=func.now())
    valid_until = Column(DateTime(timezone=True))

    # Status
    is_active = Column(Boolean, default=True, index=True)
    is_stackable = Column(Boolean, default=False)

    # Metadata
    campaign_name = Column(String(255))
    description = Column(Text)
    internal_notes = Column(Text)
    created_by_admin_id = Column(UUID(as_uuid=True))

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    owner = relationship("User", foreign_keys=[owner_user_id])
    usages = relationship("ReferralUsage", back_populates="referral_code", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint('discount_value > 0', name='valid_discount_value'),
        CheckConstraint("code_type IN ('user_referral', 'promotional', 'partner')", name='valid_code_type'),
        CheckConstraint("discount_type IN ('percentage', 'fixed_amount', 'trial_extension', 'account_credit')", name='valid_discount_type'),
        {'schema': 'swisstax'}
    )

    def __repr__(self):
        return f"<ReferralCode(code={self.code}, type={self.code_type})>"

    @property
    def is_valid(self) -> bool:
        """Check if code is currently valid"""
        now = datetime.now(timezone.utc)

        # Check active status
        if not self.is_active:
            return False

        # Check date validity
        if self.valid_from and now < self.valid_from.replace(tzinfo=timezone.utc):
            return False
        if self.valid_until and now > self.valid_until.replace(tzinfo=timezone.utc):
            return False

        # Check usage limits
        if self.max_total_uses and self.current_usage_count >= self.max_total_uses:
            return False

        return True

    @property
    def uses_remaining(self) -> Optional[int]:
        """Calculate remaining uses"""
        if self.max_total_uses is None:
            return None
        return max(0, self.max_total_uses - self.current_usage_count)
