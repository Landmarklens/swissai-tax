"""
Document Model - Tax document uploads with AI processing
"""

from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime

from db.base import Base


class Document(Base):
    """
    Tax documents uploaded by users for AI processing
    Stores file metadata, S3 location, and OCR results
    """
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text('gen_random_uuid()'))
    session_id = Column(UUID(as_uuid=True), ForeignKey('interview_sessions.id'), nullable=True, index=True)
    user_id = Column(String(255), ForeignKey('users.id'), nullable=False, index=True)

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

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="documents")
    session = relationship("InterviewSession", back_populates="documents")

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
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
