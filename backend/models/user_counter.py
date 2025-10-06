"""
User Counter Model

This model tracks the number of tax returns filed today.
It resets daily at midnight and increments throughout the day.
"""
from sqlalchemy import Column, Integer, DateTime, CheckConstraint
from sqlalchemy.sql import func
from db.base import Base


class UserCounter(Base):
    """
    User counter model for tracking daily tax return filings.

    This table is designed to have only one row (enforced by check constraint).
    The counter resets daily at midnight to a random starting value,
    and increments throughout the day to reach a random target.
    """
    __tablename__ = "user_counter"

    id = Column(Integer, primary_key=True, default=1)
    user_count = Column(Integer, nullable=False, default=15)  # Starting count (daily users)
    target_count = Column(Integer, nullable=False)  # Random daily target
    last_reset = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    last_updated = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    # Ensure only one row exists
    __table_args__ = (
        CheckConstraint('id = 1', name='single_row_check'),
    )

    def __repr__(self):
        return f"<UserCounter(count={self.user_count}, target={self.target_count})>"
