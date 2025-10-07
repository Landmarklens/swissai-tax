"""
Dashboard Router
API endpoints for dashboard data
"""

from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from db.session import get_db
from models.swisstax import User
from schemas.swisstax.dashboard import (ActiveFilingResponse,
                                        DashboardResponse,
                                        DashboardStatsResponse,
                                        PastFilingResponse)
from services.swisstax.dashboard_service import dashboard_service
from utils.auth import get_current_user

router = APIRouter()


@router.get("/", response_model=DashboardResponse)
async def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get complete dashboard data for current user
    Includes active filings, past filings, stats, and reminders
    """
    try:
        data = dashboard_service.get_dashboard_data(str(current_user.id), db)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/active-filings", response_model=List[ActiveFilingResponse])
async def get_active_filings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get active filings for current user"""
    try:
        filings = dashboard_service._get_active_filings(str(current_user.id), db)
        return filings
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/past-filings", response_model=List[PastFilingResponse])
async def get_past_filings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get past/submitted filings for current user"""
    try:
        filings = dashboard_service._get_past_filings(str(current_user.id), db)
        return filings
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats", response_model=DashboardStatsResponse)
async def get_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user statistics"""
    try:
        stats = dashboard_service._calculate_stats(str(current_user.id), db)
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
