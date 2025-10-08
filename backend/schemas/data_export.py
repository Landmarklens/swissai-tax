"""
Pydantic schemas for data export endpoints
"""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, UUID4
from enum import Enum


class ExportFormat(str, Enum):
    """Supported export formats"""
    JSON = "json"
    CSV = "csv"


# Request schemas
class DataExportRequest(BaseModel):
    """Request to create data export"""
    format: ExportFormat = Field(..., description="Export format (json or csv)")


# Response schemas
class DataExportResponse(BaseModel):
    """Single data export details"""
    id: UUID4
    status: str
    format: str
    file_url: Optional[str] = None
    file_size_mb: Optional[float] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    expires_at: datetime
    hours_until_expiry: Optional[float] = None
    is_available: bool
    is_expired: bool
    error_message: Optional[str] = None

    class Config:
        from_attributes = True


class DataExportListResponse(BaseModel):
    """List of user's data exports"""
    exports: List[DataExportResponse]
    total_count: int


class DataExportCreatedResponse(BaseModel):
    """Response after creating export request"""
    export_id: UUID4
    message: str
    estimated_completion_minutes: int
    status: str

    class Config:
        from_attributes = True
