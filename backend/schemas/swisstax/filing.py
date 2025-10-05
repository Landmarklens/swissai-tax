"""
Filing Pydantic schemas
"""

from pydantic import BaseModel, Field
from typing import Optional, Any
from datetime import datetime


class FilingCreate(BaseModel):
    """Create a new filing"""
    session_id: str = Field(..., description="Interview session ID")
    submission_method: str = Field(..., pattern="^(efile|manual)$")


class FilingUpdateField(BaseModel):
    """Update a single field in review"""
    field_name: str
    value: Any


class FilingResponse(BaseModel):
    """Filing details"""
    id: str
    tax_year: int
    status: str
    submission_method: Optional[str] = None
    submitted_at: Optional[datetime] = None
    confirmation_number: Optional[str] = None
    refund_amount: Optional[float] = None
    payment_amount: Optional[float] = None
    pdf_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ReviewDataResponse(BaseModel):
    """Complete review data for a session"""
    session: dict
    answers: dict
    documents: list
    calculation: dict
