"""
Document Model - Tax document uploads with AI processing
"""

from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from models.swisstax.base import Base


class Document(Base):
    """
    Tax documents uploaded by users for AI processing
    Stores file metadata, S3 location, and OCR results
    """
    __tablename__ = "documents"
    __table_args__ = {'schema': 'swisstax'}

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text('gen_random_uuid()'))
    session_id = Column(UUID(as_uuid=True), ForeignKey('swisstax.interview_sessions.id'), nullable=True, index=True)
    user_id = Column(String(255), ForeignKey('swisstax.users.id'), nullable=False, index=True)

    # Document metadata
    document_type = Column(String(100), nullable=False)  # lohnausweis, pillar_3a, etc.
    file_name = Column(String(255), nullable=False)
    s3_key = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=True)
    mime_type = Column(String(100), nullable=True)

    # OCR/AI processing
    ocr_status = Column(String(50), default='pending')  # pending, processing, completed, failed
    ocr_result = Column(JSONB, nullable=True)  # Extracted data from AI/OCR
    doc_metadata = Column('metadata', JSONB, default=dict)  # Additional metadata (mapped to 'metadata' column)

    # Structured imports (eCH-0196, Swissdec ELM)
    is_structured_import = Column(Boolean, default=False)  # True if eCH-0196 or Swissdec
    import_format = Column(String(100), nullable=True)  # e.g., "eCH-0196-2.2", "Swissdec-ELM-5.0"
    structured_data = Column(JSONB, nullable=True)  # Parsed structured data from barcode/XML

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    # Note: Not using back_populates to avoid circular dependency issues
    user = relationship("User", foreign_keys=[user_id], overlaps="documents")
    session = relationship("InterviewSession", foreign_keys=[session_id], overlaps="documents")

    def __repr__(self):
        return f"<Document(id={self.id}, file_name={self.file_name}, type={self.document_type})>"

    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': str(self.id),
            'session_id': str(self.session_id) if self.session_id else None,
            'user_id': self.user_id,
            'document_type': self.document_type,
            'file_name': self.file_name,
            's3_key': self.s3_key,
            'file_size': self.file_size,
            'mime_type': self.mime_type,
            'ocr_status': self.ocr_status,
            'ocr_result': self.ocr_result,
            'metadata': self.doc_metadata,
            'is_structured_import': self.is_structured_import,
            'import_format': self.import_format,
            'structured_data': self.structured_data,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
