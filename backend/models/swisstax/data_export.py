"""
Data Export model for SwissAI Tax
Maps to swisstax.data_exports table
Handles GDPR-compliant data portability
"""

from datetime import datetime, timedelta, timezone

from sqlalchemy import BigInteger, Column, DateTime, ForeignKey, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .base import Base, SwissTaxBase


class DataExport(SwissTaxBase, Base):
    """
    User data export request
    Implements GDPR Article 20 (Right to Data Portability)
    """
    __tablename__ = "data_exports"

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

    # Status: pending, processing, completed, failed
    status = Column(String(20), nullable=False, server_default='pending', index=True)

    # Format: json, csv
    format = Column(String(10), nullable=False)

    # Export file details
    file_url = Column(String(2000))  # Presigned S3 URL (can be very long with query params)
    s3_key = Column(String(500))  # S3 object key for cleanup
    file_size_bytes = Column(BigInteger())

    # Expiration (48 hours after generation)
    expires_at = Column(DateTime(timezone=True), nullable=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True))

    # Error handling
    error_message = Column(Text())

    # Relationships
    user = relationship("User", foreign_keys=[user_id])

    def __repr__(self):
        return f"<DataExport(id={self.id}, user_id={self.user_id}, status={self.status}, format={self.format})>"

    @property
    def is_completed(self):
        """Check if export has completed successfully"""
        return self.status == 'completed'

    @property
    def is_failed(self):
        """Check if export failed"""
        return self.status == 'failed'

    @property
    def is_processing(self):
        """Check if export is currently being generated"""
        return self.status in ['pending', 'processing']

    @property
    def is_expired(self):
        """Check if download link has expired"""
        try:
            if not self.expires_at:
                return True
            # Ensure both datetimes are timezone-aware for comparison
            now = datetime.now(timezone.utc)
            expires = self.expires_at
            # If expires_at is naive, assume UTC
            if expires.tzinfo is None:
                expires = expires.replace(tzinfo=timezone.utc)
            return now > expires
        except Exception:
            # If comparison fails, consider expired for safety
            return True

    @property
    def is_available(self):
        """Check if export is ready to download"""
        try:
            return self.is_completed and not self.is_expired and self.file_url
        except Exception:
            return False

    @property
    def hours_until_expiry(self):
        """Calculate hours remaining until expiration"""
        try:
            if not self.expires_at:
                return 0
            # Ensure both datetimes are timezone-aware
            now = datetime.now(timezone.utc)
            expires = self.expires_at
            # If expires_at is naive, assume UTC
            if expires.tzinfo is None:
                expires = expires.replace(tzinfo=timezone.utc)
            if now >= expires:
                return 0
            delta = expires - now
            return max(0, delta.total_seconds() / 3600)
        except Exception:
            return 0

    @property
    def file_size_mb(self):
        """Get file size in MB"""
        if not self.file_size_bytes:
            return 0
        return round(self.file_size_bytes / (1024 * 1024), 2)
