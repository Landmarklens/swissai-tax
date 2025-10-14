"""
Pending Document Model

Tracks documents that users have marked as "I'll bring this later" during the interview process.
"""

import enum
from datetime import datetime
from uuid import uuid4

from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID

from models.swisstax.base import Base


class DocumentStatus(str, enum.Enum):
    """Document upload status"""
    PENDING = "pending"  # User marked "bring later"
    UPLOADED = "uploaded"  # Document uploaded, pending AI extraction
    VERIFIED = "verified"  # Document processed and data verified
    FAILED = "failed"  # Upload or processing failed


class PendingDocument(Base):
    """
    Tracks documents that users need to upload for their tax filing.

    When a user chooses "I'll bring this later" during the interview,
    a pending document record is created. This allows tracking which
    documents are still needed before tax calculation can proceed.
    """
    __tablename__ = "pending_documents"
    __table_args__ = {'schema': 'swisstax'}

    # Core Identification
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    filing_session_id = Column(
        String(36),
        ForeignKey('swisstax.tax_filing_sessions.id'),
        nullable=False,
        index=True
    )

    # Document Details
    question_id = Column(String(50), nullable=False)  # e.g., "Q03c_upload", "Q08_upload"
    document_type = Column(String(100), nullable=False)  # e.g., "childcare_costs", "pillar_3a_certificate"

    # Status Tracking
    status = Column(
        SQLEnum(DocumentStatus, name='document_status_enum', schema='swisstax', create_constraint=True, native_enum=True, values_callable=lambda obj: [e.value for e in obj]),
        default=DocumentStatus.PENDING,
        nullable=False,
        index=True
    )

    # Optional metadata
    document_label = Column(String(255), nullable=True)  # Human-readable label
    help_text = Column(String(500), nullable=True)  # Help text for the user

    # Actual document reference (once uploaded)
    document_id = Column(String(36), nullable=True)  # References documents.id when uploaded

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)  # When marked as "bring later"
    uploaded_at = Column(DateTime, nullable=True)  # When document was uploaded
    verified_at = Column(DateTime, nullable=True)  # When data was extracted and verified
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<PendingDocument(id='{self.id}', filing_session='{self.filing_session_id}', type='{self.document_type}', status='{self.status}')>"

    def to_dict(self):
        """Convert model to dictionary"""
        return {
            'id': str(self.id),
            'filing_session_id': self.filing_session_id,
            'question_id': self.question_id,
            'document_type': self.document_type,
            'document_label': self.document_label,
            'help_text': self.help_text,
            'status': self.status.value if isinstance(self.status, DocumentStatus) else self.status,
            'document_id': self.document_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'uploaded_at': self.uploaded_at.isoformat() if self.uploaded_at else None,
            'verified_at': self.verified_at.isoformat() if self.verified_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

    def mark_uploaded(self, document_id: str):
        """Mark document as uploaded"""
        self.status = DocumentStatus.UPLOADED
        self.document_id = document_id
        self.uploaded_at = datetime.utcnow()

    def mark_verified(self):
        """Mark document as verified (data extracted successfully)"""
        self.status = DocumentStatus.VERIFIED
        self.verified_at = datetime.utcnow()

    def mark_failed(self):
        """Mark document processing as failed"""
        self.status = DocumentStatus.FAILED


# Document type mappings
DOCUMENT_TYPE_LABELS = {
    # Employment
    "lohnausweis": "Wage Statement (Lohnausweis)",
    "commuting_costs": "Commuting Expense Documents",
    "professional_expenses": "Professional Expense Documents",

    # Benefits
    "unemployment_statement": "Unemployment Benefits Statement",
    "insurance_benefits": "Disability/Accident Insurance Benefits",

    # Retirement
    "pension_certificate": "Pension Fund Certificate (2nd Pillar)",
    "pillar_3a_certificate": "Pillar 3a Contribution Certificate",

    # Family
    "childcare_costs": "Childcare Cost Documents",

    # Assets
    "property_documents": "Property Documents (Tax/Mortgage Statements)",
    "securities_statement": "Securities/Investment Account Statement",

    # Deductions
    "donation_receipts": "Charitable Donation Receipts",
    "alimony_documents": "Alimony Payment Documents",
    "medical_receipts": "Medical Expense Receipts",
    "health_insurance_premiums": "Health Insurance Premium Statement",
    "church_tax_documents": "Church Tax Documents",
}


def get_document_label(document_type: str) -> str:
    """Get human-readable label for document type"""
    return DOCUMENT_TYPE_LABELS.get(document_type, document_type.replace("_", " ").title())
