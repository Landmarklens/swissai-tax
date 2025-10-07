"""Tax Filing Session Model - Represents a single tax filing attempt"""

from sqlalchemy import Column, String, Integer, JSON, Boolean, DateTime, Enum as SQLEnum, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
from uuid import uuid4
import enum

from models.swisstax.base import Base
from utils.encrypted_types import EncryptedJSON


class FilingStatus(str, enum.Enum):
    """Tax filing session status"""
    DRAFT = "draft"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    SUBMITTED = "submitted"
    ARCHIVED = "archived"


class TaxFilingSession(Base):
    """
    Represents a single tax filing session/attempt for a user.

    Similar to HomeAI's ConversationProfile, this stores all data related
    to one tax filing, including answers, insights, and calculations.

    A user can have multiple tax filing sessions (e.g., for different years,
    corrections, or different tax scenarios).
    """
    __tablename__ = "tax_filing_sessions"

    # Core Identification
    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id = Column(UUID(as_uuid=True), ForeignKey('swisstax.users.id'), nullable=False, index=True)

    # Naming & Year
    name = Column(String(255), nullable=True)  # e.g., "2024 Tax Return - Main"
    tax_year = Column(Integer, nullable=False)

    # Profile & State - Complete tax profile data stored as ENCRYPTED JSON
    # Contains sensitive financial data (income, deductions, personal info)
    profile = Column(EncryptedJSON, default=dict)
    summarized_description = Column(Text, nullable=True)  # AI-generated summary (non-sensitive)

    # Status & Progress
    status = Column(
        SQLEnum(FilingStatus),
        default=FilingStatus.DRAFT,
        nullable=False,
        index=True
    )
    completion_percentage = Column(Integer, default=0)  # 0-100
    current_question_id = Column(String(50), nullable=True)
    completed_questions = Column(JSON, default=list)  # List of completed question IDs

    # UI Enhancement Fields
    is_pinned = Column(Boolean, default=False, index=True)
    is_archived = Column(Boolean, default=False, index=True)
    last_activity = Column(DateTime, default=datetime.utcnow, index=True)
    question_count = Column(Integer, default=0)  # Number of questions answered

    # Localization & Context
    language = Column(String(2), default='en')  # en, de, fr, it
    canton = Column(String(2), nullable=True)  # ZH, BE, GE, etc.

    # Multi-Filing Support (added 2025-10-06)
    is_primary = Column(Boolean, default=True, nullable=False)  # TRUE for main filing, FALSE for additional cantons
    parent_filing_id = Column(String(36), ForeignKey('tax_filing_sessions.id'), nullable=True)  # Links to main filing
    source_filing_id = Column(String(36), ForeignKey('tax_filing_sessions.id'), nullable=True)  # Copied from this filing

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = Column(DateTime, nullable=True)  # Soft delete

    # Relationships
    user = relationship("User", back_populates="tax_filing_sessions")
    insights = relationship(
        "TaxInsight",
        back_populates="filing_session",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    answers = relationship(
        "TaxAnswer",
        back_populates="filing_session",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    calculations = relationship(
        "TaxCalculation",
        back_populates="filing_session",
        cascade="all, delete-orphan",
        lazy="selectin"
    )

    def __repr__(self):
        return f"<TaxFilingSession(id='{self.id}', user_id='{self.user_id}', tax_year={self.tax_year}, status='{self.status}')>"

    def to_dict(self, include_relationships=False):
        """Convert model to dictionary"""
        result = {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'tax_year': self.tax_year,
            'profile': self.profile,
            'summarized_description': self.summarized_description,
            'status': self.status.value if isinstance(self.status, FilingStatus) else self.status,
            'completion_percentage': self.completion_percentage,
            'current_question_id': self.current_question_id,
            'completed_questions': self.completed_questions or [],
            'is_pinned': self.is_pinned,
            'is_archived': self.is_archived,
            'last_activity': self.last_activity.isoformat() if self.last_activity else None,
            'question_count': self.question_count,
            'language': self.language,
            'canton': self.canton,
            'is_primary': self.is_primary,
            'parent_filing_id': self.parent_filing_id,
            'source_filing_id': self.source_filing_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'deleted_at': self.deleted_at.isoformat() if self.deleted_at else None
        }

        if include_relationships:
            result['insights'] = [insight.to_dict() for insight in (self.insights or [])]
            result['answers'] = [answer.to_dict() for answer in (self.answers or [])]
            result['calculations'] = [calc.to_dict() for calc in (self.calculations or [])]

        return result

    @classmethod
    def generate_default_name(cls, tax_year: int, language: str = 'en') -> str:
        """Generate a default name for the filing session"""
        names = {
            'en': f"{tax_year} Tax Return",
            'de': f"Steuererklärung {tax_year}",
            'fr': f"Déclaration fiscale {tax_year}",
            'it': f"Dichiarazione fiscale {tax_year}"
        }
        return names.get(language, names['en'])
