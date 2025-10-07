"""
Interview Session Model - Legacy tax interview sessions
"""

from sqlalchemy import Column, String, Integer, DateTime, text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime

from models.swisstax.base import Base


class InterviewSession(Base):
    """
    Legacy interview session model for the older tax interview flow.

    Note: This is being replaced by TaxFilingSession for the new multi-filing system.
    Kept for backward compatibility with existing data.
    """
    __tablename__ = "interview_sessions"
    __table_args__ = {'schema': 'swisstax'}

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text('gen_random_uuid()'))
    user_id = Column(UUID(as_uuid=True), ForeignKey('swisstax.users.id', ondelete='CASCADE'), nullable=False, index=True)
    tax_year = Column(Integer, nullable=False)
    status = Column(String(50), default='in_progress')
    current_question_id = Column(String(50), nullable=True)
    answers = Column(JSONB, default=dict)
    session_metadata = Column('metadata', JSONB, default=dict)  # Mapped to 'metadata' column
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    # Note: Not using back_populates to avoid circular dependency issues
    documents = relationship("Document", foreign_keys="[Document.session_id]")

    def __repr__(self):
        return f"<InterviewSession(id={self.id}, user_id={self.user_id}, tax_year={self.tax_year})>"

    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': str(self.id),
            'user_id': self.user_id,
            'tax_year': self.tax_year,
            'status': self.status,
            'current_question_id': self.current_question_id,
            'answers': self.answers,
            'metadata': self.session_metadata,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
