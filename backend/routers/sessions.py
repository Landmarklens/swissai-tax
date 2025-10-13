"""
Session Management API Router
Endpoints for managing user sessions
"""
from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List
import logging

from core.security import get_current_user
from db.session import get_db
from models.swisstax import User
from services.session_service import session_service
from utils.router import Router
from utils.fastapi_rate_limiter import rate_limit

router = Router()
logger = logging.getLogger(__name__)


@router.get("/sessions")
@rate_limit("100/minute")
async def list_sessions(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all active sessions for the current user

    Returns:
        List of session objects with device and location info
    """
    try:
        # Update current session's last_active timestamp
        from core.security import get_session_id_from_request
        session_id = get_session_id_from_request(request)
        if session_id:
            try:
                session_service.update_last_active(db, session_id)
                logger.debug(f"Updated last_active for session {session_id}")
            except Exception as e:
                logger.warning(f"Failed to update last_active for session {session_id}: {e}")

        sessions = session_service.get_user_sessions(
            db=db,
            user_id=str(current_user.id),
            active_only=True,
            include_expired=False
        )

        # Convert to dict for JSON response
        session_list = [session.to_dict() for session in sessions]

        # DEBUG: Log session data being returned
        for s in session_list:
            logger.info(f"[DEBUG] Returning session {s['session_id']}: is_current={s['is_current']}, is_active={s['is_active']}, last_active={s['last_active']}")

        return {
            "success": True,
            "sessions": session_list,
            "count": len(session_list)
        }

    except Exception as e:
        logger.error(f"Failed to list sessions for user {current_user.id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve sessions")


@router.delete("/sessions/{session_uuid}")
@rate_limit("20/minute")
async def revoke_session(
    session_uuid: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Revoke a specific session

    Args:
        session_uuid: UUID of the session to revoke

    Returns:
        Success message
    """
    try:
        # Attempt to revoke the session
        success = session_service.revoke_session(
            db=db,
            session_uuid=session_uuid,
            user_id=str(current_user.id)
        )

        if not success:
            raise HTTPException(
                status_code=404,
                detail="Session not found or you don't have permission to revoke it"
            )

        # Log the action for audit
        from services.audit_log_service import log_session_revoked
        try:
            log_session_revoked(
                db,
                current_user.id,
                request.client.host if request.client else "unknown",
                request.headers.get("user-agent", ""),
                session_uuid
            )
        except Exception as audit_error:
            logger.warning(f"Failed to log session revocation: {audit_error}")

        return {
            "success": True,
            "message": "Session revoked successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to revoke session {session_uuid}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to revoke session")


@router.post("/sessions/revoke-all")
@rate_limit("10/minute")
async def revoke_all_other_sessions(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Revoke all sessions except the current one

    Returns:
        Number of sessions revoked
    """
    try:
        # Get current session_id from JWT
        # This should be available in the JWT payload
        from core.security import get_session_id_from_request
        current_session_id = get_session_id_from_request(request)

        if not current_session_id:
            raise HTTPException(
                status_code=400,
                detail="Could not determine current session"
            )

        # Revoke all other sessions
        count = session_service.revoke_all_other_sessions(
            db=db,
            current_session_id=current_session_id,
            user_id=str(current_user.id)
        )

        # Log the action for audit
        from services.audit_log_service import log_all_sessions_revoked
        try:
            log_all_sessions_revoked(
                db,
                current_user.id,
                request.client.host if request.client else "unknown",
                request.headers.get("user-agent", ""),
                count
            )
        except Exception as audit_error:
            logger.warning(f"Failed to log bulk session revocation: {audit_error}")

        return {
            "success": True,
            "message": f"Revoked {count} session(s)",
            "count": count
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to revoke all sessions for user {current_user.id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to revoke sessions")


@router.post("/sessions/heartbeat")
@rate_limit("100/minute")
async def session_heartbeat(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update the current session's last_active timestamp (heartbeat/keepalive)

    Returns:
        Success status
    """
    try:
        from core.security import get_session_id_from_request
        session_id = get_session_id_from_request(request)

        if not session_id:
            raise HTTPException(
                status_code=400,
                detail="Could not determine current session"
            )

        # Update last_active timestamp
        session_service.update_last_active(db, session_id)

        return {
            "success": True,
            "message": "Session updated",
            "timestamp": session_service.get_session_by_id(db, session_id).last_active.isoformat() if session_service.get_session_by_id(db, session_id) else None
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update session heartbeat for user {current_user.id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to update session")


@router.get("/sessions/count")
@rate_limit("100/minute")
async def get_session_count(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get count of active sessions for the current user

    Returns:
        Number of active sessions
    """
    try:
        count = session_service.get_active_session_count(
            db=db,
            user_id=str(current_user.id)
        )

        return {
            "success": True,
            "count": count
        }

    except Exception as e:
        logger.error(f"Failed to get session count for user {current_user.id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get session count")


@router.post("/sessions/cleanup-duplicates")
@rate_limit("5/hour")
async def cleanup_duplicate_sessions(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Cleanup duplicate sessions for the current user.
    Keeps only the most recent session per device/IP combination.

    Returns:
        Number of duplicate sessions removed
    """
    try:
        from models.user_session import UserSession
        from sqlalchemy import and_

        # Get all active sessions for this user
        sessions = db.query(UserSession).filter(
            and_(
                UserSession.user_id == current_user.id,
                UserSession.is_active == True
            )
        ).order_by(UserSession.created_at.desc()).all()

        # Group sessions by device_name and ip_address
        session_groups = {}
        for session in sessions:
            key = (session.device_name, session.ip_address)
            if key not in session_groups:
                session_groups[key] = []
            session_groups[key].append(session)

        # Find and remove duplicates
        duplicates_removed = 0
        for key, group in session_groups.items():
            if len(group) > 1:
                # Keep the most recent session (first in list, already sorted desc)
                keep_session = group[0]

                # Revoke all older duplicate sessions
                for duplicate in group[1:]:
                    duplicate.revoke()
                    duplicates_removed += 1
                    logger.info(f"Removed duplicate session {duplicate.id} for user {current_user.id}")

        db.commit()

        logger.info(f"Cleaned up {duplicates_removed} duplicate sessions for user {current_user.id}")

        return {
            "success": True,
            "message": f"Removed {duplicates_removed} duplicate session(s)",
            "duplicates_removed": duplicates_removed,
            "remaining_sessions": len(session_groups)
        }

    except Exception as e:
        db.rollback()
        logger.error(f"Failed to cleanup duplicate sessions for user {current_user.id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to cleanup duplicate sessions")
