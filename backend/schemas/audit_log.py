"""
Pydantic schemas for Audit Logs API
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Dict, Any, List


class AuditLogBase(BaseModel):
    """Base schema for audit log"""
    event_type: str
    event_category: str
    description: str
    status: str = "success"


class AuditLogResponse(AuditLogBase):
    """Schema for audit log response"""
    id: int
    user_id: int
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    device_info: Optional[Dict[str, Any]] = None
    event_metadata: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AuditLogListResponse(BaseModel):
    """Schema for paginated audit logs list"""
    logs: List[AuditLogResponse]
    total: int
    page: int
    page_size: int
    has_more: bool


class EventCategoryResponse(BaseModel):
    """Schema for event category"""
    value: str
    label: str
