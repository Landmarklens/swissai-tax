"""Tax Answer Model - Stores encrypted question responses"""

from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from uuid import uuid4

from db.base import Base
from utils.encrypted_types import EncryptedText


class TaxAnswer(Base):
    """
    Stores individual answers to tax interview questions with encryption

    Sensitive personal and financial data is automatically encrypted at rest.
    """
    __tablename__ = "tax_answers"

    # Core Identification
    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    filing_session_id = Column(String(36), ForeignKey('tax_filing_sessions.id'), nullable=False, index=True)
    question_id = Column(String(50), nullable=False, index=True)

    # Answer Data - ENCRYPTED for sensitive information
    # This field stores the actual answer value encrypted at rest
    answer_value = Column(EncryptedText, nullable=False)

    # Metadata - Non-sensitive
    question_text = Column(Text, nullable=True)  # For reference/audit
    question_type = Column(String(50), nullable=True)  # text, number, boolean, select, etc.
    is_sensitive = Column(Boolean, default=True)  # Flag to track if data is sensitive

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    filing_session = relationship("TaxFilingSession", back_populates="answers")

    def __repr__(self):
        return f"<TaxAnswer(id='{self.id}', question_id='{self.question_id}', session='{self.filing_session_id}')>"

    def to_dict(self, include_sensitive=True):
        """
        Convert model to dictionary

        Args:
            include_sensitive: If False, masks sensitive data
        """
        result = {
            'id': self.id,
            'filing_session_id': self.filing_session_id,
            'question_id': self.question_id,
            'question_text': self.question_text,
            'question_type': self.question_type,
            'is_sensitive': self.is_sensitive,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

        # Handle sensitive data
        if include_sensitive or not self.is_sensitive:
            result['answer_value'] = self.answer_value
        else:
            result['answer_value'] = '***REDACTED***'

        return result

    @staticmethod
    def is_question_sensitive(question_id: str) -> bool:
        """
        Determine if a question contains sensitive information
        Sensitive questions include personal info, financial data, etc.

        Args:
            question_id: The question identifier

        Returns:
            True if question contains sensitive data
        """
        # Define sensitive question patterns
        sensitive_patterns = [
            'Q01a',  # Spouse first name
            'Q01b',  # Spouse last name
            'Q01c',  # Spouse date of birth
            'Q02a',  # Municipality
            'Q03b',  # Child details
            'Q08a',  # Pillar 3a amount
            'Q11a',  # Donation amount
            'Q12a',  # Alimony amount
            'Q13a',  # Medical expense amount
        ]

        # Check if question matches sensitive patterns
        return question_id in sensitive_patterns or any(
            pattern in question_id for pattern in ['amount', 'income', 'name', 'birth', 'address']
        )
