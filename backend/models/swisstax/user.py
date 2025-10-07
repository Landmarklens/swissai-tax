"""
User model for SwissAI Tax
Maps to swisstax.users table
"""

from datetime import datetime
from sqlalchemy import Column, String, DateTime, Boolean, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .base import Base, SwissTaxBase


class User(SwissTaxBase, Base):
    """
    User model for SwissAI Tax application
    Stores user account information and authentication details
    """
    __tablename__ = "users"

    # Primary Key
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text('gen_random_uuid()')
    )

    # Contact Information
    email = Column(String(255), unique=True, nullable=False, index=True)
    phone = Column(String(50))

    # Personal Information
    first_name = Column(String(100))
    last_name = Column(String(100))
    preferred_language = Column(String(2), server_default='DE')  # DE, FR, IT, EN

    # Address Information (for tax purposes)
    canton = Column(String(2))  # ZH, BE, GE, etc.
    municipality = Column(String(100))

    # Authentication Fields
    password = Column(String(255), nullable=True)  # Null for OAuth users
    provider = Column(String(20), server_default='local')  # local, google
    provider_id = Column(String(255))  # Google ID, etc.
    avatar_url = Column(String(255))

    # Timestamps
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )
    last_login = Column(DateTime(timezone=True))

    # Status
    is_active = Column(Boolean, server_default='true', nullable=False)
    is_grandfathered = Column(Boolean, server_default='false', nullable=False)  # Bypass subscription
    is_test_user = Column(Boolean, server_default='false', nullable=False)  # Test account

    # Relationships temporarily disabled to fix SQLAlchemy mapper configuration issues
    # These relationships are not currently used in the application code
    # Database has ON DELETE CASCADE constraints for data integrity
    # TODO: Re-enable when needed or when relationship issues are fully resolved

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email})>"

    @property
    def full_name(self):
        """Return user's full name"""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.email
