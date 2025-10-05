"""
User Settings model for SwissAI Tax
Maps to swisstax.user_settings table
"""

from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Boolean, ForeignKey, JSON, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .base import Base


class UserSettings(Base):
    """
    User preferences and application settings
    One-to-one relationship with User
    """
    __tablename__ = "user_settings"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text('gen_random_uuid()')
    )

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey('swisstax.users.id', ondelete='CASCADE'),
        nullable=False,
        unique=True,  # One settings record per user
        index=True
    )

    # Language & Region Preferences
    language = Column(String(2), server_default='de')  # de, fr, it, en
    date_format = Column(String(20), server_default='DD.MM.YYYY')
    currency = Column(String(3), server_default='CHF')
    default_canton = Column(String(2))  # User's default canton

    # Appearance
    theme = Column(String(10), server_default='auto')  # light, dark, auto

    # Filing Preferences
    auto_save_enabled = Column(Boolean, server_default='true')
    auto_save_interval = Column(Integer, server_default='30')  # seconds
    show_tax_tips = Column(Boolean, server_default='true')
    enable_ocr = Column(Boolean, server_default='true')

    # Email Notifications
    email_deadline_reminders = Column(Boolean, server_default='true')
    email_document_processing = Column(Boolean, server_default='true')
    email_tax_calculation = Column(Boolean, server_default='true')
    email_marketing = Column(Boolean, server_default='false')

    # SMS Notifications
    sms_account_updates = Column(Boolean, server_default='true')
    sms_filing_reminders = Column(Boolean, server_default='false')

    # Document Management
    ocr_enabled = Column(Boolean, server_default='true')
    compress_documents = Column(Boolean, server_default='true')
    retention_years = Column(Integer, server_default='7')  # How long to keep documents

    # Additional preferences stored as JSON for flexibility
    additional_preferences = Column(JSON)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="settings")

    def __repr__(self):
        return f"<UserSettings(user_id={self.user_id}, language={self.language})>"

    @property
    def email_notifications(self):
        """Get all email notification settings as dict"""
        return {
            'deadline_reminders': self.email_deadline_reminders,
            'document_processing': self.email_document_processing,
            'tax_calculation': self.email_tax_calculation,
            'marketing': self.email_marketing
        }

    @property
    def sms_notifications(self):
        """Get all SMS notification settings as dict"""
        return {
            'account_updates': self.sms_account_updates,
            'filing_reminders': self.sms_filing_reminders
        }

    @property
    def preferences(self):
        """Get all user preferences as dict"""
        return {
            'language': self.language,
            'theme': self.theme,
            'auto_save_enabled': self.auto_save_enabled,
            'auto_save_interval': self.auto_save_interval,
            'show_tax_tips': self.show_tax_tips
        }
