"""
API Router for Audit Logs
Provides endpoints for retrieving user activity logs
"""
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime
import logging

from db.session import get_db
from core.security import get_current_user
from models.swisstax.user import User
from schemas.audit_log import AuditLogListResponse, AuditLogResponse, EventCategoryResponse
from services.audit_log_service import AuditLogService

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/", response_model=AuditLogListResponse)
async def get_my_audit_logs(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Items per page"),
    event_category: Optional[str] = Query(None, description="Filter by event category"),
    event_type: Optional[str] = Query(None, description="Filter by event type"),
    start_date: Optional[datetime] = Query(None, description="Filter from date"),
    end_date: Optional[datetime] = Query(None, description="Filter to date"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get audit logs for the current authenticated user
    
    Supports filtering by:
    - event_category: authentication, security, data_access, data_modification, account
    - event_type: specific event like login_success, password_changed, etc.
    - start_date/end_date: date range filter
    
    Returns paginated results with total count
    """
    try:
        offset = (page - 1) * page_size

        logs, total = AuditLogService.get_user_logs(
            db,
            current_user.id,
            limit=page_size,
            offset=offset,
            event_category=event_category,
            event_type=event_type,
            start_date=start_date,
            end_date=end_date
        )

        return AuditLogListResponse(
            logs=logs,
            total=total,
            page=page,
            page_size=page_size,
            has_more=total > (page * page_size)
        )
    except Exception as e:
        logger.error(f"Failed to retrieve audit logs for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve audit logs")


@router.get("/categories", response_model=List[EventCategoryResponse])
async def get_event_categories(
    current_user: User = Depends(get_current_user)
):
    """
    Get available event categories for filtering
    """
    return [
        EventCategoryResponse(value="authentication", label="Authentication"),
        EventCategoryResponse(value="security", label="Security"),
        EventCategoryResponse(value="data_access", label="Data Access"),
        EventCategoryResponse(value="data_modification", label="Data Modification"),
        EventCategoryResponse(value="account", label="Account")
    ]


@router.get("/stats")
async def get_audit_log_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get statistics about user's audit logs
    Returns counts by category and recent activity
    """
    try:
        # Get counts by category
        from sqlalchemy import func
        from models.audit_log import AuditLog
        
        category_counts = db.query(
            AuditLog.event_category,
            func.count(AuditLog.id).label('count')
        ).filter(
            AuditLog.user_id == current_user.id
        ).group_by(
            AuditLog.event_category
        ).all()

        # Get total count
        total_logs = db.query(func.count(AuditLog.id)).filter(
            AuditLog.user_id == current_user.id
        ).scalar()

        # Get recent activity (last 30 days)
        from datetime import timedelta
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)

        recent_count = db.query(func.count(AuditLog.id)).filter(
            AuditLog.user_id == current_user.id,
            AuditLog.created_at >= thirty_days_ago
        ).scalar()

        return {
            "total_logs": total_logs or 0,
            "recent_activity_30_days": recent_count or 0,
            "by_category": {cat: count for cat, count in category_counts}
        }
    except Exception as e:
        logger.error(f"Failed to get audit log stats for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve audit log statistics")
