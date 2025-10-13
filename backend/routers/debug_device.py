"""
Debug endpoints for testing device detection and session tracking
These can be removed in production
"""
from fastapi import Depends, Request
from sqlalchemy.orm import Session
from utils.router import Router
from utils.device_parser import DeviceParser
from core.security import get_current_user, get_session_id_from_request
from db.session import get_db
from models.swisstax import User

router = Router()


@router.get("/debug/device-info")
async def get_device_info(request: Request):
    """
    Debug endpoint to see what device information is being detected
    from your current request.

    Use this to verify that device detection is working correctly.
    """
    user_agent = request.headers.get("user-agent", "")
    device_info = DeviceParser.parse_user_agent(user_agent)

    # Get IP address
    forwarded_for = request.headers.get("x-forwarded-for")
    real_ip = request.headers.get("x-real-ip")
    client_ip = request.client.host if request.client else None

    return {
        "raw_user_agent": user_agent,
        "parsed_device_info": device_info,
        "ip_info": {
            "x_forwarded_for": forwarded_for,
            "x_real_ip": real_ip,
            "client_host": client_ip
        }
    }


@router.get("/debug/session-status")
async def get_session_status(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Debug endpoint to check if your current session is being tracked
    and if last_active is being updated correctly.
    """
    from services.session_service import session_service
    from datetime import datetime

    # Get session_id from JWT
    session_id = get_session_id_from_request(request)

    if not session_id:
        return {
            "error": "No session_id found in JWT token",
            "recommendation": "You may be using a legacy token. Please log out and log back in."
        }

    # Find the session in database
    db_session = session_service.get_session_by_id(db, session_id)

    if not db_session:
        return {
            "error": "Session not found in database",
            "session_id": session_id,
            "recommendation": "Please log out and log back in to create a new tracked session."
        }

    # Calculate time since last_active
    now = datetime.utcnow()
    time_since_last_active = now - db_session.last_active
    seconds_ago = int(time_since_last_active.total_seconds())

    # Try to update last_active now
    try:
        session_service.update_last_active(db, session_id)
        db.refresh(db_session)
        update_success = True
        new_last_active = db_session.last_active
    except Exception as e:
        update_success = False
        new_last_active = None
        update_error = str(e)

    result = {
        "session_found": True,
        "session_id": session_id,
        "user_id": str(current_user.id),
        "device_name": db_session.device_name,
        "last_active_before_update": db_session.last_active.isoformat(),
        "seconds_since_last_active": seconds_ago,
        "is_active": db_session.is_active,
        "is_current": db_session.is_current,
        "update_attempted": True,
        "update_success": update_success
    }

    if update_success:
        result["last_active_after_update"] = new_last_active.isoformat()
        result["recommendation"] = "Session update is working! If you still see stale timestamps in the UI, it might be a frontend caching issue."
    else:
        result["update_error"] = update_error
        result["recommendation"] = "Session update failed. Check database permissions or session validation logic."

    return result
