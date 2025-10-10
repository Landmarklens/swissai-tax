"""
User Session Model
Tracks active user sessions for session management and security
"""
from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
from db.base import Base
import uuid


class UserSession(Base):
    """
    User session model for tracking active login sessions.
    Enables users to view and manage their active sessions from different devices.
    """
    __tablename__ = "user_sessions"
    __table_args__ = (
        Index('idx_user_session_user_id', 'user_id'),
        Index('idx_user_session_session_id', 'session_id', unique=True),
        Index('idx_user_session_user_active', 'user_id', 'is_active'),
        Index('idx_user_session_expires', 'expires_at'),
        {'schema': 'swisstax'}
    )

    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Foreign key to user
    user_id = Column(UUID(as_uuid=True), ForeignKey("swisstax.users.id", ondelete="CASCADE"), nullable=False)

    # Session identifier (matches JWT session_id claim)
    session_id = Column(String(255), nullable=False, unique=True, index=True)

    # Device information
    device_name = Column(String(200), nullable=True)  # e.g., "Chrome on MacOS"
    device_type = Column(String(20), nullable=True)   # desktop, mobile, tablet
    browser = Column(String(50), nullable=True)       # Chrome, Safari, Firefox, etc.
    browser_version = Column(String(50), nullable=True)
    os = Column(String(50), nullable=True)            # Windows, MacOS, Linux, iOS, Android
    os_version = Column(String(50), nullable=True)

    # Location information
    ip_address = Column(String(45), nullable=True)    # IPv4 or IPv6
    location = Column(String(200), nullable=True)     # City, Country

    # Additional metadata stored as JSON
    device_metadata = Column(JSONB, nullable=True)    # Additional device info

    # Session status and timestamps
    is_active = Column(Boolean, nullable=False, default=True, index=True)
    is_current = Column(Boolean, nullable=False, default=False)  # Flag for current session
    last_active = Column(DateTime, nullable=False, default=datetime.utcnow)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    revoked_at = Column(DateTime, nullable=True)

    # Relationship to User (can be enabled when User model is updated)
    # user = relationship("User", back_populates="sessions")

    def __init__(self, **kwargs):
        """Initialize session with default expiration if not provided"""
        super().__init__(**kwargs)
        if not self.expires_at:
            # Default: 30 days from creation
            self.expires_at = (self.created_at or datetime.utcnow()) + timedelta(days=30)

    def is_expired(self) -> bool:
        """Check if session has expired"""
        return datetime.utcnow() > self.expires_at

    def is_valid(self) -> bool:
        """Check if session is valid (active and not expired)"""
        return self.is_active and not self.is_expired()

    def revoke(self):
        """Revoke this session"""
        self.is_active = False
        self.revoked_at = datetime.utcnow()

    def touch(self):
        """Update last active timestamp"""
        self.last_active = datetime.utcnow()

    def to_dict(self) -> dict:
        """Convert session to dictionary for API responses"""
        return {
            "id": str(self.id),
            "session_id": self.session_id,
            "device_name": self.device_name,
            "device_type": self.device_type,
            "browser": self.browser,
            "browser_version": self.browser_version,
            "os": self.os,
            "os_version": self.os_version,
            "ip_address": self.ip_address,
            "location": self.location,
            "is_active": self.is_active,
            "is_current": self.is_current,
            "last_active": self.last_active.isoformat() if self.last_active else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
        }

    def __repr__(self):
        return f"<UserSession(id={self.id}, user_id={self.user_id}, device={self.device_name}, active={self.is_active})>"
