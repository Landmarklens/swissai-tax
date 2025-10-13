"""
Feature Usage models for SwissAI Tax
Maps to swisstax.feature_usage table for tracking usage-based limits
"""

from datetime import datetime

from sqlalchemy import (
    Column, DateTime, ForeignKey, Integer, String, Date, UniqueConstraint, text
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .base import Base, SwissTaxBase


class FeatureUsage(SwissTaxBase, Base):
    """
    Track usage of features with limits (e.g., filings, documents, AI questions).

    Usage periods typically reset monthly or annually depending on subscription.
    """
    __tablename__ = "feature_usage"

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

    feature_name = Column(String(100), nullable=False, index=True)
    usage_count = Column(Integer, nullable=False, default=0, server_default='0')

    # Period tracking
    period_start = Column(Date, nullable=False, index=True)
    period_end = Column(Date, nullable=False, index=True)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Ensure one usage record per user+feature+period
    __table_args__ = (
        UniqueConstraint('user_id', 'feature_name', 'period_start', 'period_end',
                        name='uq_user_feature_period'),
        {'schema': 'swisstax'}
    )

    # Relationships
    user = relationship("User")

    def __repr__(self):
        return (
            f"<FeatureUsage(user_id={self.user_id}, feature={self.feature_name}, "
            f"count={self.usage_count}, period={self.period_start} to {self.period_end})>"
        )

    def is_current_period(self) -> bool:
        """Check if this usage record is for the current period."""
        today = datetime.now().date()
        return self.period_start <= today <= self.period_end

    def increment(self, amount: int = 1) -> int:
        """
        Increment usage count.

        Args:
            amount: Amount to increment by (default: 1)

        Returns:
            New usage count
        """
        self.usage_count += amount
        return self.usage_count

    def reset(self) -> None:
        """Reset usage count to zero."""
        self.usage_count = 0
