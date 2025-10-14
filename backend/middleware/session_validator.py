"""Session validation middleware with timeout checking"""

from datetime import datetime, timedelta
from typing import Optional
from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import logging
import json

logger = logging.getLogger(__name__)


class SessionTimeoutValidator:
    """Validates session timeouts and manages session lifecycle"""

    def __init__(
        self,
        idle_timeout_minutes: int = 30,
        absolute_timeout_hours: int = 8,
        warning_minutes: int = 5
    ):
        """
        Initialize session validator

        Args:
            idle_timeout_minutes: Minutes before idle session expires
            absolute_timeout_hours: Hours before session absolutely expires
            warning_minutes: Minutes before timeout to send warning
        """
        self.idle_timeout = timedelta(minutes=idle_timeout_minutes)
        self.absolute_timeout = timedelta(hours=absolute_timeout_hours)
        self.warning_time = timedelta(minutes=warning_minutes)

    async def validate_session(
        self,
        request: Request,
        session_id: Optional[str] = None
    ) -> dict:
        """
        Validate session and check for timeouts

        Args:
            request: FastAPI request object
            session_id: Session ID to validate

        Returns:
            Session info with timeout status
        """
        if not session_id:
            # Try to get session from request
            session_id = request.headers.get('X-Session-Id') or \
                        request.cookies.get('session_id')

        if not session_id:
            return {
                'valid': True,  # No session required
                'session_id': None
            }

        # Get session from database
        from database.database import get_db
        db = next(get_db())

        try:
            from models.swisstax.ai_extraction import TaxFilingSession

            session = db.query(TaxFilingSession).filter(
                TaxFilingSession.id == session_id
            ).first()

            if not session:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Session not found or expired"
                )

            now = datetime.utcnow()

            # Check absolute timeout
            if session.created_at:
                absolute_expiry = session.created_at + self.absolute_timeout
                if now > absolute_expiry:
                    # Mark session as expired
                    session.status = 'expired'
                    session.expired_at = now
                    db.commit()

                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Session expired due to maximum timeout"
                    )

            # Check idle timeout
            last_activity = session.last_activity_at or session.created_at
            if last_activity:
                idle_expiry = last_activity + self.idle_timeout
                if now > idle_expiry:
                    # Mark session as expired
                    session.status = 'expired'
                    session.expired_at = now
                    db.commit()

                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Session expired due to inactivity"
                    )

                # Check if close to timeout
                warning_time = idle_expiry - self.warning_time
                if now > warning_time:
                    minutes_left = int((idle_expiry - now).total_seconds() / 60)
                    return {
                        'valid': True,
                        'session_id': session_id,
                        'warning': True,
                        'minutes_until_timeout': minutes_left,
                        'message': f"Session will expire in {minutes_left} minutes"
                    }

            # Update last activity
            session.last_activity_at = now
            db.commit()

            return {
                'valid': True,
                'session_id': session_id,
                'warning': False
            }

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Session validation error: {e}")
            return {
                'valid': False,
                'error': str(e)
            }
        finally:
            db.close()

    async def extend_session(
        self,
        session_id: str,
        extension_minutes: int = 30
    ) -> dict:
        """
        Extend an active session

        Args:
            session_id: Session to extend
            extension_minutes: Minutes to extend by

        Returns:
            Updated session info
        """
        from database.database import get_db
        db = next(get_db())

        try:
            from models.swisstax.ai_extraction import TaxFilingSession

            session = db.query(TaxFilingSession).filter(
                TaxFilingSession.id == session_id,
                TaxFilingSession.status != 'expired'
            ).first()

            if not session:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Session not found or already expired"
                )

            # Extend session
            now = datetime.utcnow()
            session.last_activity_at = now
            session.extended_at = now
            session.extension_count = (session.extension_count or 0) + 1

            # Store extension in metadata
            metadata = session.metadata or {}
            metadata['extensions'] = metadata.get('extensions', [])
            metadata['extensions'].append({
                'extended_at': now.isoformat(),
                'minutes': extension_minutes
            })
            session.metadata = metadata

            db.commit()

            return {
                'session_id': session_id,
                'extended': True,
                'new_timeout': (now + timedelta(minutes=extension_minutes)).isoformat()
            }

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Session extension error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to extend session"
            )
        finally:
            db.close()

    async def cleanup_expired_sessions(self, older_than_days: int = 7):
        """
        Clean up expired sessions older than specified days

        Args:
            older_than_days: Days after which to delete expired sessions
        """
        from database.database import get_db
        db = next(get_db())

        try:
            from models.swisstax.ai_extraction import TaxFilingSession

            cutoff_date = datetime.utcnow() - timedelta(days=older_than_days)

            # Delete old expired sessions
            deleted = db.query(TaxFilingSession).filter(
                TaxFilingSession.status == 'expired',
                TaxFilingSession.expired_at < cutoff_date
            ).delete()

            db.commit()

            logger.info(f"Cleaned up {deleted} expired sessions")
            return deleted

        except Exception as e:
            logger.error(f"Session cleanup error: {e}")
            db.rollback()
            return 0
        finally:
            db.close()


# Global session validator instance
session_validator = SessionTimeoutValidator()


async def session_timeout_middleware(request: Request, call_next):
    """Middleware to check session timeouts"""

    # Skip for non-API routes
    if not str(request.url.path).startswith('/api/'):
        return await call_next(request)

    # Skip for auth endpoints
    if any(path in str(request.url.path) for path in ['/auth/', '/health', '/status']):
        return await call_next(request)

    # Validate session if present
    session_id = request.headers.get('X-Session-Id') or \
                request.cookies.get('session_id')

    if session_id:
        try:
            result = await session_validator.validate_session(request, session_id)

            # Process request
            response = await call_next(request)

            # Add warning header if session is close to timeout
            if result.get('warning'):
                response.headers['X-Session-Warning'] = result.get('message', '')
                response.headers['X-Session-Timeout-Minutes'] = str(result.get('minutes_until_timeout', 0))

            return response

        except HTTPException as e:
            return JSONResponse(
                status_code=e.status_code,
                content={"detail": e.detail}
            )
    else:
        # No session required, continue
        return await call_next(request)


class SessionActivityTracker:
    """Tracks user activity within sessions for analytics and security"""

    def __init__(self):
        self.activities = {}

    def track_activity(
        self,
        session_id: str,
        activity_type: str,
        details: Optional[dict] = None
    ):
        """
        Track an activity within a session

        Args:
            session_id: Session ID
            activity_type: Type of activity (e.g., 'document_upload', 'form_submit')
            details: Additional activity details
        """
        if session_id not in self.activities:
            self.activities[session_id] = []

        self.activities[session_id].append({
            'timestamp': datetime.utcnow().isoformat(),
            'type': activity_type,
            'details': details or {}
        })

        # Limit history per session to prevent memory bloat
        if len(self.activities[session_id]) > 1000:
            self.activities[session_id] = self.activities[session_id][-500:]

    def get_session_activities(self, session_id: str) -> list:
        """Get all activities for a session"""
        return self.activities.get(session_id, [])

    def detect_suspicious_activity(self, session_id: str) -> Optional[dict]:
        """
        Detect potentially suspicious activity patterns

        Args:
            session_id: Session to check

        Returns:
            Suspicious activity details or None
        """
        activities = self.activities.get(session_id, [])

        if not activities:
            return None

        # Check for rapid-fire requests (potential automation)
        if len(activities) >= 10:
            recent = activities[-10:]
            first_time = datetime.fromisoformat(recent[0]['timestamp'])
            last_time = datetime.fromisoformat(recent[-1]['timestamp'])
            duration = (last_time - first_time).total_seconds()

            if duration < 2:  # 10 requests in 2 seconds
                return {
                    'type': 'rapid_requests',
                    'message': 'Unusually rapid request pattern detected',
                    'count': len(recent),
                    'duration': duration
                }

        # Check for unusual document access patterns
        doc_accesses = [a for a in activities if 'document' in a['type']]
        if len(doc_accesses) > 50:  # More than 50 document operations
            return {
                'type': 'excessive_document_access',
                'message': 'Excessive document operations detected',
                'count': len(doc_accesses)
            }

        # Check for failed operations
        failures = [a for a in activities if a.get('details', {}).get('success') is False]
        if len(failures) > 10:
            return {
                'type': 'multiple_failures',
                'message': 'Multiple failed operations detected',
                'count': len(failures)
            }

        return None

    def clear_session(self, session_id: str):
        """Clear activity history for a session"""
        if session_id in self.activities:
            del self.activities[session_id]


# Global activity tracker
activity_tracker = SessionActivityTracker()