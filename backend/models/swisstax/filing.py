"""
Filing model for SwissAI Tax
Maps to swisstax.filings table
"""

from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Numeric, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .base import Base, SwissTaxBase


class Filing(SwissTaxBase, Base):
    """
    Tax filing submission record
    Tracks submitted tax returns and their status
    """
    __tablename__ = "filings"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text('gen_random_uuid()')
    )

    # Foreign keys
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey('swisstax.users.id', ondelete='CASCADE'),
        nullable=False,
        index=True
    )

    session_id = Column(
        UUID(as_uuid=True),
        ForeignKey('swisstax.interview_sessions.id'),
        nullable=False
    )

    # Filing information
    tax_year = Column(Integer, nullable=False)
    status = Column(String(20), nullable=False, index=True)
    # Statuses: draft, completed, submitted, confirmed, rejected

    # Submission details
    submission_method = Column(String(20))  # efile, manual
    submitted_at = Column(DateTime(timezone=True))
    confirmation_number = Column(String(100), unique=True)

    # Document storage
    pdf_url = Column(String(500))  # S3 URL for generated tax form PDF
    confirmation_pdf_url = Column(String(500))  # S3 URL for confirmation document

    # Financial summary
    refund_amount = Column(Numeric(12, 2))  # Positive if refund expected
    payment_amount = Column(Numeric(12, 2))  # Positive if payment due

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", foreign_keys="[Filing.user_id]", overlaps="filings")
    # Note: InterviewSession doesn't have filings relationship to avoid circular dependencies
    session = relationship("InterviewSession", foreign_keys="[Filing.session_id]")
    payments = relationship("Payment", back_populates="filing")

    def __repr__(self):
        return f"<Filing(id={self.id}, year={self.tax_year}, status={self.status})>"

    @property
    def is_submitted(self):
        """Check if filing has been submitted"""
        return self.status in ['submitted', 'confirmed']

    @property
    def requires_payment(self):
        """Check if filing requires payment"""
        return self.payment_amount and self.payment_amount > 0

    @property
    def has_refund(self):
        """Check if filing has a refund"""
        return self.refund_amount and self.refund_amount > 0
