"""
User model for SwissAI Tax
Maps to swisstax.users table
"""

from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, Numeric, String, text
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
    ahv_number = Column(String(20), nullable=True, index=True)  # Swiss social security number (AHV/AVS)

    # Address Information (for tax purposes)
    address = Column(String(255))
    postal_code = Column(String(20))
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

    # Stripe Integration
    stripe_customer_id = Column(String(255), unique=True, nullable=True)  # Stripe Customer ID

    # Two-Factor Authentication Fields
    two_factor_enabled = Column(Boolean, server_default='false', nullable=False)
    two_factor_secret = Column(String(255), nullable=True)  # Encrypted TOTP secret
    two_factor_backup_codes = Column(String(1000), nullable=True)  # Encrypted JSON array of backup codes
    two_factor_verified_at = Column(DateTime(timezone=True), nullable=True)  # When 2FA was enabled

    # Referral System Fields
    personal_referral_code = Column(String(50), unique=True, nullable=True)  # User's unique referral code
    total_referrals_count = Column(Integer, server_default='0', nullable=False)  # Total referrals made
    successful_referrals_count = Column(Integer, server_default='0', nullable=False)  # Successful referrals
    total_rewards_earned_chf = Column(Numeric(10, 2), server_default='0.00', nullable=False)  # Total rewards earned
    account_credit_balance_chf = Column(Numeric(10, 2), server_default='0.00', nullable=False)  # Current credit balance
    referred_by_code = Column(String(50), nullable=True)  # Code used when user signed up

    # Relationships temporarily disabled to fix SQLAlchemy mapper configuration issues
    # These relationships are not currently used in the application code
    # Database has ON DELETE CASCADE constraints for data integrity
    # TODO: Re-enable when needed or when relationship issues are fully resolved
    # audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email})>"

    @property
    def full_name(self):
        """Return user's full name"""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.email
