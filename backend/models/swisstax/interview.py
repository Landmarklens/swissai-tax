"""
Interview models for SwissAI Tax
Maps to swisstax.interview_sessions, interview_answers, and questions tables
"""

from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Boolean, ForeignKey, Text, JSON, text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .base import Base


class Question(Base):
    """
    Tax interview questions
    Multi-language support for DE, FR, IT, EN
    """
    __tablename__ = "questions"

    id = Column(String(10), primary_key=True)  # Q01, Q02, etc.
    category = Column(String(50))  # personal_info, income, deductions, etc.

    # Multi-language question text
    question_text_de = Column(Text, nullable=False)
    question_text_fr = Column(Text)
    question_text_en = Column(Text)
    question_text_it = Column(Text)

    # Multi-language help text
    help_text_de = Column(Text)
    help_text_fr = Column(Text)
    help_text_en = Column(Text)
    help_text_it = Column(Text)

    # Question configuration
    question_type = Column(String(20), nullable=False)  # single_choice, multiple_choice, text, number
    options = Column(JSON)  # For choice questions
    validation_rules = Column(JSON)  # Min, max, required, etc.

    # Conditional logic
    depends_on = Column(String(10))  # Question ID this depends on
    depends_on_value = Column(JSON)  # Value(s) that trigger this question

    # Ordering
    sort_order = Column(Integer)
    is_active = Column(Boolean, server_default='true')

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    answers = relationship("InterviewAnswer", back_populates="question")

    def __repr__(self):
        return f"<Question(id={self.id}, category={self.category})>"


class InterviewSession(Base):
    """
    User's tax filing interview session
    Tracks progress through the interview questions
    """
    __tablename__ = "interview_sessions"

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

    tax_year = Column(Integer, nullable=False)
    status = Column(String(20), server_default='in_progress')  # in_progress, completed, submitted
    current_question = Column(String(10))  # Current question ID
    completion_percentage = Column(Integer, server_default='0')

    # Timestamps
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True))
    submitted_at = Column(DateTime(timezone=True))

    # Ensure one active session per user per tax year
    __table_args__ = (
        UniqueConstraint('user_id', 'tax_year', name='uq_user_tax_year'),
        {'schema': 'swisstax'}
    )

    # Relationships
    user = relationship("User", back_populates="sessions")
    answers = relationship(
        "InterviewAnswer",
        back_populates="session",
        cascade="all, delete-orphan"
    )
    documents = relationship(
        "Document",
        back_populates="session",
        cascade="all, delete-orphan"
    )
    required_documents = relationship(
        "RequiredDocument",
        back_populates="session",
        cascade="all, delete-orphan"
    )
    tax_calculations = relationship(
        "TaxCalculation",
        back_populates="session",
        cascade="all, delete-orphan"
    )
    filings = relationship(
        "Filing",
        back_populates="session"
    )

    def __repr__(self):
        return f"<InterviewSession(id={self.id}, user_id={self.user_id}, year={self.tax_year})>"


class InterviewAnswer(Base):
    """
    User's answers to interview questions
    Stores the answer value in JSON format for flexibility
    """
    __tablename__ = "interview_answers"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text('gen_random_uuid()')
    )

    session_id = Column(
        UUID(as_uuid=True),
        ForeignKey('swisstax.interview_sessions.id', ondelete='CASCADE'),
        nullable=False,
        index=True
    )

    question_id = Column(
        String(10),
        ForeignKey('swisstax.questions.id'),
        nullable=False
    )

    answer_value = Column(JSON)  # Flexible storage for any answer type
    answered_at = Column(DateTime(timezone=True), server_default=func.now())

    # Ensure one answer per question per session
    __table_args__ = (
        UniqueConstraint('session_id', 'question_id', name='uq_session_question'),
        {'schema': 'swisstax'}
    )

    # Relationships
    session = relationship("InterviewSession", back_populates="answers")
    question = relationship("Question", back_populates="answers")

    def __repr__(self):
        return f"<InterviewAnswer(session_id={self.session_id}, question_id={self.question_id})>"
