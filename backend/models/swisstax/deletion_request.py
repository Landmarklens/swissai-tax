"""
Deletion Request model for SwissAI Tax
Maps to swisstax.deletion_requests table
Handles GDPR-compliant account deletion requests
"""

from datetime import datetime, timedelta

from sqlalchemy import Column, DateTime, ForeignKey, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .base import Base, SwissTaxBase


class DeletionRequest(SwissTaxBase, Base):
    """
    User account deletion request
    Implements GDPR Article 17 (Right to Erasure)
    """
    __tablename__ = "deletion_requests"

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

    # Verification details
    verification_code = Column(String(6), nullable=False)  # 6-digit code
    verification_token = Column(String(255), nullable=False, unique=True)  # Secure token for email links

    # Timestamps
    requested_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)  # 15 minutes for code
    scheduled_deletion_at = Column(DateTime(timezone=True), nullable=False)  # 7 days grace period

    # Status: pending, verified, cancelled, completed, failed
    status = Column(String(20), nullable=False, server_default='pending', index=True)

    # Audit trail
    ip_address = Column(String(45))  # IPv4 or IPv6
    user_agent = Column(Text())

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", foreign_keys=[user_id])

    def __repr__(self):
        return f"<DeletionRequest(id={self.id}, user_id={self.user_id}, status={self.status})>"

    @property
    def is_verified(self):
        """Check if request has been verified"""
        return self.status == 'verified'

    @property
    def is_expired(self):
        """Check if verification code has expired"""
        return datetime.utcnow() > self.expires_at

    @property
    def is_ready_for_deletion(self):
        """Check if request is ready for execution"""
        return (
            self.status == 'verified' and
            datetime.utcnow() >= self.scheduled_deletion_at
        )

    @property
    def days_until_deletion(self):
        """Calculate days remaining until deletion"""
        if self.status != 'verified':
            return None
        delta = self.scheduled_deletion_at - datetime.utcnow()
        return max(0, delta.days)

    @property
    def can_cancel(self):
        """Check if deletion can still be cancelled"""
        return self.status in ['pending', 'verified'] and not self.is_ready_for_deletion
