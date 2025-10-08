"""
Pydantic schemas for Audit Logs API
"""
from pydantic import BaseModel, Field, field_serializer
from datetime import datetime
from typing import Optional, Dict, Any, List, Union
from uuid import UUID


class AuditLogBase(BaseModel):
    """Base schema for audit log"""
    event_type: str
    event_category: str
    description: str
    status: str = "success"


class AuditLogResponse(AuditLogBase):
    """Schema for audit log response"""
    id: int
    user_id: Union[UUID, str]  # Accept UUID from DB, serialize to string
    session_id: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    device_info: Optional[Dict[str, Any]] = None
    event_metadata: Optional[Dict[str, Any]] = None
    created_at: datetime

    @field_serializer('user_id')
    def serialize_user_id(self, user_id: Union[UUID, str]) -> str:
        """Convert UUID to string for JSON serialization"""
        return str(user_id)

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
