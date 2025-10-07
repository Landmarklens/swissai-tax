"""
Subscription and Payment models for SwissAI Tax
Maps to swisstax.subscriptions and swisstax.payments tables
"""

from datetime import datetime

from sqlalchemy import (Boolean, Column, DateTime, ForeignKey, Integer,
                        Numeric, String, text)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .base import Base, SwissTaxBase


class Subscription(SwissTaxBase, Base):
    """
    User subscription to SwissAI Tax plans
    Integrates with Stripe for payment processing
    """
    __tablename__ = "subscriptions"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text('gen_random_uuid()')
    )

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey('swisstax.users.id', ondelete='CASCADE'),
        nullable=False,
        index=True
    )

    # Subscription details
    plan_type = Column(String(20), nullable=False)  # basic, standard, premium
    status = Column(String(20), nullable=False, index=True)
    # Statuses: active, canceled, expired, past_due

    # Stripe integration
    stripe_subscription_id = Column(String(255), unique=True)
    stripe_customer_id = Column(String(255))
    stripe_price_id = Column(String(255))

    # Billing period
    current_period_start = Column(DateTime(timezone=True))
    current_period_end = Column(DateTime(timezone=True))
    cancel_at_period_end = Column(Boolean, default=False)
    canceled_at = Column(DateTime(timezone=True))

    # Pricing
    price_chf = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(3), default='CHF')

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    # Note: User doesn't have subscriptions relationship to avoid circular dependencies
    user = relationship("User")

    def __repr__(self):
        return f"<Subscription(id={self.id}, user_id={self.user_id}, plan={self.plan_type}, status={self.status})>"

    @property
    def is_active(self):
        """Check if subscription is currently active"""
        return self.status == 'active'

    @property
    def is_canceled(self):
        """Check if subscription is canceled"""
        return self.status == 'canceled' or self.cancel_at_period_end


class Payment(SwissTaxBase, Base):
    """
    Payment records for subscriptions and one-time purchases
    Tracks Stripe payment intents and transactions
    """
    __tablename__ = "payments"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text('gen_random_uuid()')
    )

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey('swisstax.users.id', ondelete='CASCADE'),
        nullable=False,
        index=True
    )

    filing_id = Column(
        UUID(as_uuid=True),
        ForeignKey('swisstax.filings.id'),
        nullable=True  # Null for subscription payments
    )

    # Payment details
    amount_chf = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(3), default='CHF')
    status = Column(String(20), nullable=False, index=True)
    # Statuses: pending, processing, succeeded, failed, refunded

    # Stripe integration
    stripe_payment_intent_id = Column(String(255), unique=True)
    stripe_charge_id = Column(String(255))
    payment_method = Column(String(50))  # card, twint, bank_transfer

    # Card details (last 4 digits for display)
    card_brand = Column(String(20))  # visa, mastercard, etc.
    card_last4 = Column(String(4))

    # Metadata
    description = Column(String(500))
    failure_message = Column(String(500))

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    paid_at = Column(DateTime(timezone=True))

    # Relationships
    # Note: User doesn't have payments relationship to avoid circular dependencies
    user = relationship("User")
    filing = relationship("Filing", back_populates="payments")

    def __repr__(self):
        return f"<Payment(id={self.id}, user_id={self.user_id}, amount={self.amount_chf}, status={self.status})>"

    @property
    def is_successful(self):
        """Check if payment was successful"""
        return self.status == 'succeeded'

    @property
    def is_pending(self):
        """Check if payment is pending"""
        return self.status in ['pending', 'processing']
