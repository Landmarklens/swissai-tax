"""
Interview Session Model - Database-backed interview sessions for multi-instance support
"""

from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from models.swisstax.base import Base


class InterviewSession(Base):
    """
    Stores interview session state for tax filing interviews.

    This replaces the in-memory session storage to support:
    - Multi-instance deployment (horizontal scaling)
    - Session persistence across server restarts
    - Session recovery and audit trails
    """
    __tablename__ = "interview_sessions"
    __table_args__ = {'schema': 'swisstax'}

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text('gen_random_uuid()'))
    user_id = Column(UUID(as_uuid=True), ForeignKey('swisstax.users.id', ondelete='CASCADE'), nullable=False, index=True)
    filing_id = Column(String(36), ForeignKey('swisstax.tax_filing_sessions.id', ondelete='CASCADE'), nullable=True, index=True)
    tax_year = Column(Integer, nullable=False)
    language = Column(String(2), default='en')
    status = Column(String(50), default='in_progress')

    # Interview Progress
    current_question_id = Column(String(50), nullable=True)
    completed_questions = Column(JSONB, default=list)
    pending_questions = Column(JSONB, default=list)
    progress = Column(Integer, default=0)  # 0-100

    # Data Storage
    answers = Column(JSONB, default=dict)
    session_context = Column(JSONB, default=dict)  # Stores dynamic context like child loops, cantons, etc.

    # Timestamps
    started_at = Column(DateTime, default=datetime.utcnow, server_default=text('CURRENT_TIMESTAMP'))
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    submitted_at = Column(DateTime, nullable=True)

    # Legacy fields for backward compatibility
    completion_percentage = Column(Integer, default=0)

    # Relationships
    # Note: Not using back_populates to avoid circular dependency issues
    documents = relationship("Document", foreign_keys="[Document.session_id]")

    def __repr__(self):
        return f"<InterviewSession(id={self.id}, user_id={self.user_id}, tax_year={self.tax_year}, status={self.status})>"

    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': str(self.id),
            'user_id': str(self.user_id),
            'filing_id': self.filing_id,
            'tax_year': self.tax_year,
            'language': self.language,
            'status': self.status,
            'current_question_id': self.current_question_id,
            'completed_questions': self.completed_questions or [],
            'pending_questions': self.pending_questions or [],
            'progress': self.progress,
            'answers': self.answers or {},
            'session_context': self.session_context or {},
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'submitted_at': self.submitted_at.isoformat() if self.submitted_at else None,
        }
