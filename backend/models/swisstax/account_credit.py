"""
User Account Credits Model
"""
from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from .base import Base, SwissTaxBase


class UserAccountCredit(SwissTaxBase, Base):
    """Transaction ledger for user account credits"""
    __tablename__ = "user_account_credits"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())

    user_id = Column(UUID(as_uuid=True), ForeignKey('swisstax.users.id', ondelete='CASCADE'), index=True)

    # Credit Details
    amount_chf = Column(Numeric(10, 2), nullable=False)
    transaction_type = Column(String(20), nullable=False, index=True)  # earned, spent, expired, refunded, adjusted

    # Source
    source_type = Column(String(30))  # referral_reward, promotional, refund, admin_adjustment
    source_id = Column(UUID(as_uuid=True))

    # Balance Tracking
    balance_before = Column(Numeric(10, 2), nullable=False)
    balance_after = Column(Numeric(10, 2), nullable=False)

    # Description
    description = Column(Text)

    # Applied To (when spent)
    applied_to_subscription_id = Column(UUID(as_uuid=True), ForeignKey('swisstax.subscriptions.id'))
    applied_to_payment_id = Column(UUID(as_uuid=True), ForeignKey('swisstax.payments.id'))

    # Expiration
    expires_at = Column(DateTime(timezone=True))

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Relationships
    user = relationship("User", foreign_keys=[user_id])

    def __repr__(self):
        return f"<UserAccountCredit(user={self.user_id}, amount={self.amount_chf}, type={self.transaction_type})>"
