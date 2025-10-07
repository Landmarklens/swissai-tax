"""
Document models for SwissAI Tax
Maps to swisstax.documents, document_types, and required_documents tables
"""

from datetime import datetime

from sqlalchemy import (JSON, Boolean, Column, DateTime, ForeignKey, Integer,
                        String, Text, UniqueConstraint, text)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .base import Base, SwissTaxBase


class DocumentType(SwissTaxBase, Base):
    """
    Types of tax documents
    Multi-language support for names and descriptions
    """
    __tablename__ = "document_types"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(50), unique=True, nullable=False)  # lohnausweis, pillar_3a, etc.

    # Multi-language names
    name_de = Column(String(255), nullable=False)
    name_fr = Column(String(255))
    name_en = Column(String(255))
    name_it = Column(String(255))

    # Multi-language descriptions
    description_de = Column(Text)
    description_fr = Column(Text)
    description_en = Column(Text)
    description_it = Column(Text)

    # Configuration
    category = Column(String(50))  # income, deductions, assets, etc.
    is_mandatory = Column(Boolean, server_default='false')
    sort_order = Column(Integer)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    # Note: Document.document_type is a string column, not a FK, so no back_populates
    required_for_sessions = relationship("RequiredDocument", back_populates="document_type")

    def __repr__(self):
        return f"<DocumentType(code={self.code})>"


class RequiredDocument(SwissTaxBase, Base):
    """
    Documents required for a specific session based on user's answers
    """
    __tablename__ = "required_documents"

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

    document_type_id = Column(
        Integer,
        ForeignKey('swisstax.document_types.id'),
        nullable=False
    )

    is_required = Column(Boolean, server_default='true')
    reason = Column(String(255))  # Why this document is required

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Ensure one requirement per document type per session
    __table_args__ = (
        UniqueConstraint('session_id', 'document_type_id', name='uq_session_document_type'),
        {'schema': 'swisstax'}
    )

    # Relationships
    # Note: InterviewSession doesn't have required_documents relationship to avoid circular dependencies
    session = relationship("InterviewSession")
    document_type = relationship("DocumentType", back_populates="required_for_sessions")

    def __repr__(self):
        return f"<RequiredDocument(session_id={self.session_id}, type_id={self.document_type_id})>"


