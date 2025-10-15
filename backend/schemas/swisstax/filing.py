"""
Filing Pydantic schemas
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class FilingCreateNew(BaseModel):
    """Create a new tax filing with interview session"""
    tax_year: int = Field(..., description="Tax year for the filing")
    canton: str = Field(..., description="Canton code (e.g., ZH, BE)")
    municipality: str = Field(..., description="Municipality name")
    postal_code: str = Field(..., description="Postal code")
    language: str = Field("en", description="Language preference (en, de, fr, it)")
    is_primary: bool = Field(True, description="Whether this is the primary residence filing")


class FilingCreate(BaseModel):
    """Create a new filing"""
    session_id: str = Field(..., description="Interview session ID")
    submission_method: str = Field(..., pattern="^(efile|manual)$")


class FilingCopy(BaseModel):
    """Copy a filing to a new year"""
    source_filing_id: str = Field(..., description="ID of filing to copy from")
    new_year: int = Field(..., description="New tax year for the copy")


class FilingUpdateField(BaseModel):
    """Update a single field in review"""
    field_name: str
    value: Any


class FilingListItem(BaseModel):
    """Filing list item with basic info"""
    id: str
    name: str
    tax_year: int
    canton: Optional[str] = None
    municipality: Optional[str] = None
    status: str
    completion_percentage: int
    is_primary: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FilingsListResponse(BaseModel):
    """List of filings grouped by year"""
    filings: Dict[str, List[FilingListItem]]
    statistics: Dict[str, int]


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


class PostalCodeLookup(BaseModel):
    """Postal code lookup result"""
    postal_code: str
    municipality: str
    canton: str
    canton_name: str
