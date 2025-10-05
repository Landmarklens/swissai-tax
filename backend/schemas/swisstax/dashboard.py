"""
Dashboard Pydantic schemas
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class ActiveFilingResponse(BaseModel):
    """Active filing with progress"""
    id: str
    tax_year: int
    status: str
    progress: int = Field(..., ge=0, le=100)
    last_saved: datetime
    estimated_refund: Optional[float] = None

    class Config:
        from_attributes = True


class PastFilingResponse(BaseModel):
    """Completed filing record"""
    id: str
    tax_year: int
    status: str
    submitted_at: Optional[datetime] = None
    confirmation_number: Optional[str] = None
    refund_amount: Optional[float] = None
    payment_amount: Optional[float] = None
    pdf_url: Optional[str] = None

    class Config:
        from_attributes = True


class DashboardStatsResponse(BaseModel):
    """Dashboard statistics"""
    total_filings: int = 0
    total_refunds: float = 0.0
    average_refund: float = 0.0
    days_until_deadline: int = 0


class ReminderResponse(BaseModel):
    """User reminder/notification"""
    type: str  # deadline, tip, warning
    message: str
    priority: str  # high, medium, low
    date: Optional[datetime] = None


class DashboardResponse(BaseModel):
    """Complete dashboard data"""
    active_filings: List[ActiveFilingResponse] = []
    past_filings: List[PastFilingResponse] = []
    stats: DashboardStatsResponse
    reminders: List[ReminderResponse] = []
