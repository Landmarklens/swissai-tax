"""
Health Check Schemas
"""
from pydantic import BaseModel, Field
from typing import Dict, Literal
from datetime import datetime


class ServiceHealth(BaseModel):
    """Health status for a single service"""
    status: Literal["healthy", "degraded", "down"]
    response_time_ms: int
    details: str


class HealthCheckResponse(BaseModel):
    """Overall health check response"""
    status: Literal["healthy", "degraded", "down"]
    timestamp: datetime
    response_time_ms: int = Field(description="Total response time in milliseconds")
    services: Dict[str, ServiceHealth]
    version: str = Field(default="1.0.0")


class SimpleHealthResponse(BaseModel):
    """Simple health check for load balancer"""
    status: Literal["healthy", "degraded", "down"]
    timestamp: datetime
    version: str = Field(default="1.0.0")
