"""
Status Page Schemas
"""
from pydantic import BaseModel, Field
from typing import Dict, List, Literal, Optional
from datetime import datetime
from uuid import UUID


class ServiceStatusResponse(BaseModel):
    """Individual service status"""
    id: str
    name: str
    status: Literal["operational", "degraded", "down"]
    response_time: Optional[int] = None
    url: Optional[str] = None


class CurrentStatusResponse(BaseModel):
    """Current overall status response"""
    overall_status: Literal["operational", "degraded", "down", "maintenance"]
    services: List[ServiceStatusResponse]
    last_updated: datetime


class IncidentResponse(BaseModel):
    """Incident details"""
    id: str
    title: str
    description: str
    status: Literal["investigating", "identified", "monitoring", "resolved"]
    severity: Literal["low", "medium", "high", "critical"]
    created_at: str
    resolved_at: Optional[str] = None
    affected_services: Optional[str] = None

    class Config:
        from_attributes = True


class UptimeDataPoint(BaseModel):
    """Single uptime data point"""
    date: str
    uptime_percentage: float


class UptimeResponse(BaseModel):
    """Uptime statistics for a service"""
    service_id: str
    period: str = Field(description="Time period (e.g., '90 days')")
    percentage: float = Field(description="Uptime percentage")
    data_points: List[UptimeDataPoint] = Field(default_factory=list)


class IncidentCreateRequest(BaseModel):
    """Request to create a new incident (admin only)"""
    title: str = Field(..., max_length=255)
    description: str
    severity: Literal["low", "medium", "high", "critical"]
    affected_services: Optional[str] = None


class IncidentUpdateRequest(BaseModel):
    """Request to update an incident (admin only)"""
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    status: Optional[Literal["investigating", "identified", "monitoring", "resolved"]] = None
    severity: Optional[Literal["low", "medium", "high", "critical"]] = None
    post_mortem_url: Optional[str] = None
