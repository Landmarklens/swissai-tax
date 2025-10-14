"""AI Extraction Models for SwissAI Tax"""

from datetime import datetime
from sqlalchemy import (
    Boolean, Column, DateTime, ForeignKey, Integer, String, Text,
    UniqueConstraint, DECIMAL, JSON, CheckConstraint
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .base import Base, SwissTaxBase


class ExtractionSession(SwissTaxBase, Base):
    """Extraction session for AI document processing"""
    __tablename__ = "extraction_sessions"

    id = Column(UUID, primary_key=True, server_default=func.gen_random_uuid())
    user_id = Column(UUID, ForeignKey("users.id", ondelete="CASCADE"))
    status = Column(String(50), server_default='pending')
    confidence_score = Column(DECIMAL(3, 2))
    extracted_data = Column(JSON, server_default='{}')
    conflicts = Column(JSON, server_default='[]')
    ai_model_version = Column(String(100))
    processing_time_ms = Column(Integer)
    created_at = Column(DateTime, server_default=func.current_timestamp())
    updated_at = Column(DateTime, server_default=func.current_timestamp(), onupdate=func.current_timestamp())
    completed_at = Column(DateTime)
    error_message = Column(Text)
    metadata = Column(JSON, server_default='{}')

    # Relationships
    user = relationship("User", back_populates="extraction_sessions")
    document_extractions = relationship("DocumentExtraction", back_populates="extraction_session", cascade="all, delete-orphan")
    conflict_resolutions = relationship("ConflictResolution", back_populates="extraction_session", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint('confidence_score >= 0 AND confidence_score <= 1', name='check_confidence'),
        CheckConstraint("status IN ('pending', 'processing', 'completed', 'failed', 'partial')", name='check_status'),
        {'schema': 'swisstax'}
    )


class DocumentExtraction(SwissTaxBase, Base):
    """Individual document extraction results"""
    __tablename__ = "document_extractions"

    id = Column(UUID, primary_key=True, server_default=func.gen_random_uuid())
    document_id = Column(UUID, ForeignKey("documents.id", ondelete="CASCADE"))
    extraction_session_id = Column(UUID, ForeignKey("extraction_sessions.id", ondelete="CASCADE"))
    document_type = Column(String(100))
    extracted_fields = Column(JSON, server_default='{}')
    confidence_scores = Column(JSON, server_default='{}')
    page_references = Column(JSON, server_default='[]')
    ai_model_version = Column(String(50))
    extraction_method = Column(String(50), server_default='openai')
    processing_time_ms = Column(Integer)
    ocr_text = Column(Text)
    created_at = Column(DateTime, server_default=func.current_timestamp())
    updated_at = Column(DateTime, server_default=func.current_timestamp(), onupdate=func.current_timestamp())

    # Relationships
    document = relationship("Document", back_populates="extractions")
    extraction_session = relationship("ExtractionSession", back_populates="document_extractions")

    __table_args__ = (
        CheckConstraint("extraction_method IN ('openai', 'textract', 'manual', 'hybrid')", name='check_extraction_method'),
        {'schema': 'swisstax'}
    )


class QuestionCondition(SwissTaxBase, Base):
    """Dynamic questionnaire conditions"""
    __tablename__ = "question_conditions"

    id = Column(UUID, primary_key=True, server_default=func.gen_random_uuid())
    question_id = Column(String(10), ForeignKey("questions.id", ondelete="CASCADE"))
    condition_type = Column(String(50), nullable=False)
    condition_expression = Column(Text, nullable=False)
    target_question_id = Column(String(10))
    priority = Column(Integer, server_default='0')
    is_active = Column(Boolean, server_default='true')
    created_at = Column(DateTime, server_default=func.current_timestamp())
    updated_at = Column(DateTime, server_default=func.current_timestamp(), onupdate=func.current_timestamp())

    # Relationships
    question = relationship("Question", foreign_keys=[question_id])
    target_question = relationship("Question", foreign_keys=[target_question_id])

    __table_args__ = (
        CheckConstraint("condition_type IN ('show_if', 'hide_if', 'required_if', 'optional_if', 'calculate')", name='check_condition_type'),
        {'schema': 'swisstax'}
    )


class TaxProfile(SwissTaxBase, Base):
    """User tax profile with extracted and validated data"""
    __tablename__ = "tax_profiles"

    id = Column(UUID, primary_key=True, server_default=func.gen_random_uuid())
    user_id = Column(UUID, ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    profile_type = Column(String(50))
    extracted_data = Column(JSON, server_default='{}')
    validated_data = Column(JSON, server_default='{}')
    profile_flags = Column(JSON, server_default='{}')
    completeness_score = Column(DECIMAL(3, 2))
    last_extraction_id = Column(UUID, ForeignKey("extraction_sessions.id"))
    created_at = Column(DateTime, server_default=func.current_timestamp())
    updated_at = Column(DateTime, server_default=func.current_timestamp(), onupdate=func.current_timestamp())

    # Relationships
    user = relationship("User", back_populates="tax_profile")
    last_extraction = relationship("ExtractionSession")

    __table_args__ = (
        CheckConstraint('completeness_score >= 0 AND completeness_score <= 1', name='check_completeness'),
        CheckConstraint("profile_type IN ('simple_employee', 'self_employed', 'investor', 'property_owner', 'complex', 'expat')", name='check_profile_type'),
        {'schema': 'swisstax'}
    )


class MinimalQuestionnaireResponse(SwissTaxBase, Base):
    """Responses to minimal questionnaire"""
    __tablename__ = "minimal_questionnaire_responses"

    id = Column(UUID, primary_key=True, server_default=func.gen_random_uuid())
    user_id = Column(UUID, ForeignKey("users.id", ondelete="CASCADE"))
    session_id = Column(String(50), ForeignKey("tax_filing_sessions.id", ondelete="CASCADE"))
    question_key = Column(String(100), nullable=False)
    answer_value = Column(Text)
    answer_type = Column(String(50))
    is_ai_suggested = Column(Boolean, server_default='false')
    confidence_score = Column(DECIMAL(3, 2))
    created_at = Column(DateTime, server_default=func.current_timestamp())
    updated_at = Column(DateTime, server_default=func.current_timestamp(), onupdate=func.current_timestamp())

    # Relationships
    user = relationship("User")
    session = relationship("TaxFilingSession", back_populates="minimal_responses")

    __table_args__ = (
        UniqueConstraint('session_id', 'question_key', name='unique_session_question'),
        {'schema': 'swisstax'}
    )


class DocumentRequirement(SwissTaxBase, Base):
    """Document requirements based on user profile"""
    __tablename__ = "document_requirements"

    id = Column(UUID, primary_key=True, server_default=func.gen_random_uuid())
    profile_type = Column(String(50))
    document_type = Column(String(100), nullable=False)
    is_required = Column(Boolean, server_default='false')
    condition_expression = Column(Text)
    priority = Column(Integer, server_default='0')
    help_text_de = Column(Text)
    help_text_fr = Column(Text)
    help_text_it = Column(Text)
    help_text_en = Column(Text)
    created_at = Column(DateTime, server_default=func.current_timestamp())
    updated_at = Column(DateTime, server_default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = ({'schema': 'swisstax'})


class AIExtractionTemplate(SwissTaxBase, Base):
    """Templates for AI document extraction"""
    __tablename__ = "ai_extraction_templates"

    id = Column(UUID, primary_key=True, server_default=func.gen_random_uuid())
    document_type = Column(String(100), nullable=False, unique=True)
    extraction_prompt = Column(Text, nullable=False)
    field_mappings = Column(JSON, server_default='{}')
    validation_rules = Column(JSON, server_default='{}')
    sample_output = Column(JSON)
    version = Column(String(20), server_default='1.0')
    is_active = Column(Boolean, server_default='true')
    created_at = Column(DateTime, server_default=func.current_timestamp())
    updated_at = Column(DateTime, server_default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = ({'schema': 'swisstax'})


class CantonFormMapping(SwissTaxBase, Base):
    """Canton-specific form field mappings"""
    __tablename__ = "canton_form_mappings"

    id = Column(UUID, primary_key=True, server_default=func.gen_random_uuid())
    canton = Column(String(10), nullable=False)
    tax_year = Column(Integer, nullable=False)
    form_type = Column(String(100), nullable=False)
    field_mappings = Column(JSON, server_default='{}')
    form_template_url = Column(Text)
    validation_rules = Column(JSON, server_default='{}')
    is_active = Column(Boolean, server_default='true')
    created_at = Column(DateTime, server_default=func.current_timestamp())
    updated_at = Column(DateTime, server_default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        UniqueConstraint('canton', 'tax_year', 'form_type', name='unique_canton_form'),
        {'schema': 'swisstax'}
    )


class ConflictResolution(SwissTaxBase, Base):
    """Conflict resolution for extracted data"""
    __tablename__ = "conflict_resolutions"

    id = Column(UUID, primary_key=True, server_default=func.gen_random_uuid())
    extraction_session_id = Column(UUID, ForeignKey("extraction_sessions.id", ondelete="CASCADE"))
    field_name = Column(String(200), nullable=False)
    conflicting_values = Column(JSON, server_default='[]')
    resolution_method = Column(String(50))
    resolved_value = Column(Text)
    user_override = Column(Text)
    confidence_score = Column(DECIMAL(3, 2))
    created_at = Column(DateTime, server_default=func.current_timestamp())
    resolved_at = Column(DateTime)
    resolved_by = Column(UUID, ForeignKey("users.id"))

    # Relationships
    extraction_session = relationship("ExtractionSession", back_populates="conflict_resolutions")
    resolver = relationship("User")

    __table_args__ = (
        CheckConstraint("resolution_method IN ('highest_confidence', 'most_recent', 'user_override', 'ai_reconciliation', 'average', 'sum')",
                       name='check_resolution_method'),
        {'schema': 'swisstax'}
    )