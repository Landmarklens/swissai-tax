"""
Status Page Router
Public endpoints for status page
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict

from db.session import get_db
from services.status_service import StatusService
from schemas.status import (
    CurrentStatusResponse,
    IncidentResponse,
    UptimeResponse,
    IncidentCreateRequest,
    IncidentUpdateRequest
)
from core.security import get_current_user  # For admin-only endpoints

router = APIRouter(prefix="/api/status", tags=["status"])


@router.get("/current", response_model=CurrentStatusResponse)
async def get_current_status(db: AsyncSession = Depends(get_db)):
    """
    Get current status of all services
    Public endpoint - no authentication required
    """
    status_service = StatusService(db)
    return await status_service.get_current_status()


@router.get("/incidents", response_model=List[IncidentResponse])
async def get_incidents(
    limit: int = 10,
    db: AsyncSession = Depends(get_db)
):
    """
    Get recent incidents
    Public endpoint - no authentication required
    """
    status_service = StatusService(db)
    incidents = await status_service.get_incidents(limit=limit)
    return incidents


@router.get("/uptime", response_model=Dict[str, UptimeResponse])
async def get_uptime(
    days: int = 90,
    db: AsyncSession = Depends(get_db)
):
    """
    Get uptime statistics for all services
    Public endpoint - no authentication required
    """
    status_service = StatusService(db)
    return await status_service.get_uptime_stats(days=days)


# Admin-only endpoints for incident management
@router.post("/incidents", response_model=IncidentResponse)
async def create_incident(
    incident: IncidentCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Create a new incident (admin only)
    Requires authentication
    """
    # TODO: Add admin role check
    status_service = StatusService(db)
    new_incident = await status_service.create_incident(incident.model_dump())
    return new_incident


@router.patch("/incidents/{incident_id}", response_model=IncidentResponse)
async def update_incident(
    incident_id: str,
    update: IncidentUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Update an existing incident (admin only)
    Requires authentication
    """
    # TODO: Add admin role check
    status_service = StatusService(db)
    try:
        updated_incident = await status_service.update_incident(
            incident_id,
            {k: v for k, v in update.model_dump().items() if v is not None}
        )
        return updated_incident
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
