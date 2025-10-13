"""
Session Service
Manages user sessions including creation, validation, and revocation
"""
from typing import List, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
import uuid
import logging

from models.user_session import UserSession
from utils.device_parser import DeviceParser

logger = logging.getLogger(__name__)


class SessionService:
    """Service for managing user sessions"""

    @staticmethod
    def create_session(
        db: Session,
        user_id: str,
        session_id: str,
        request,
        is_current: bool = True,
        expires_in_days: int = 30
    ) -> UserSession:
        """
        Create a new user session

        Args:
            db: Database session
            user_id: User ID
            session_id: Unique session identifier (from JWT)
            request: FastAPI Request object for extracting device info
            is_current: Whether this is the current/active session
            expires_in_days: Number of days until session expires

        Returns:
            Created UserSession object
        """
        try:
            # Check if session already exists (prevent duplicates)
            existing_session = db.query(UserSession).filter(
                UserSession.session_id == session_id
            ).first()

            if existing_session:
                logger.info(f"Session {session_id} already exists, returning existing session")
                # Update last_active and return existing session
                existing_session.last_active = datetime.utcnow()
                if is_current and not existing_session.is_current:
                    # Mark all other sessions as not current
                    db.query(UserSession).filter(
                        and_(
                            UserSession.user_id == existing_session.user_id,
                            UserSession.is_current == True,
                            UserSession.id != existing_session.id
                        )
                    ).update({"is_current": False})
                    existing_session.is_current = True
                db.commit()
                db.refresh(existing_session)
                return existing_session

            # Parse device information from User-Agent
            user_agent = request.headers.get("user-agent", "")
            device_info = DeviceParser.parse_user_agent(user_agent)

            # Get IP address
            ip_address = SessionService._get_client_ip(request)

            # Create session
            new_session = UserSession(
                user_id=uuid.UUID(user_id) if isinstance(user_id, str) else user_id,
                session_id=session_id,
                device_name=device_info["device_name"],
                device_type=device_info["device_type"],
                browser=device_info["browser"],
                browser_version=device_info["browser_version"],
                os=device_info["os"],
                os_version=device_info["os_version"],
                ip_address=ip_address,
                location=None,  # TODO: Add geolocation service
                is_active=True,
                is_current=is_current,
                last_active=datetime.utcnow(),
                created_at=datetime.utcnow(),
                expires_at=datetime.utcnow() + timedelta(days=expires_in_days)
            )

            # If this is the current session, mark all other sessions as not current
            if is_current:
                db.query(UserSession).filter(
                    and_(
                        UserSession.user_id == new_session.user_id,
                        UserSession.is_current == True
                    )
                ).update({"is_current": False})

            # Clean up old sessions from the same device using hybrid approach:
            # 1. Same device + same IP: Always revoke (immediate duplicate)
            # 2. Same device + different IP: Only revoke if inactive > 30 min (stale session)
            try:
                # Criterion 1: Same device AND same IP (definite duplicate)
                exact_duplicates = db.query(UserSession).filter(
                    and_(
                        UserSession.user_id == new_session.user_id,
                        UserSession.device_name == new_session.device_name,
                        UserSession.ip_address == new_session.ip_address,
                        UserSession.is_active == True,
                        UserSession.session_id != session_id
                    )
                ).all()

                # Criterion 2: Same device, different IP, but inactive for > 30 minutes
                # (likely a stale session from network switch)
                stale_threshold = datetime.utcnow() - timedelta(minutes=30)
                stale_same_device = db.query(UserSession).filter(
                    and_(
                        UserSession.user_id == new_session.user_id,
                        UserSession.device_name == new_session.device_name,
                        UserSession.ip_address != new_session.ip_address,
                        UserSession.is_active == True,
                        UserSession.last_active < stale_threshold,
                        UserSession.session_id != session_id
                    )
                ).all()

                old_sessions = exact_duplicates + stale_same_device

                if old_sessions:
                    logger.info(f"Found {len(old_sessions)} old sessions ({len(exact_duplicates)} exact duplicates, {len(stale_same_device)} stale) from same device for user {user_id}, revoking them")
                    for old_session in old_sessions:
                        old_session.revoke()
            except Exception as e:
                logger.warning(f"Failed to cleanup old sessions during creation: {e}")
                # Don't fail the session creation if cleanup fails

            db.add(new_session)
            db.commit()
            db.refresh(new_session)

            logger.info(f"Created session {session_id} for user {user_id}")
            return new_session

        except Exception as e:
            db.rollback()
            logger.error(f"Failed to create session: {e}", exc_info=True)
            raise

    @staticmethod
    def get_user_sessions(
        db: Session,
        user_id: str,
        active_only: bool = True,
        include_expired: bool = False
    ) -> List[UserSession]:
        """
        Get all sessions for a user

        Args:
            db: Database session
            user_id: User ID
            active_only: Only return active sessions
            include_expired: Include expired sessions

        Returns:
            List of UserSession objects
        """
        # Expire all cached objects to ensure we get fresh data from DB
        db.expire_all()

        query = db.query(UserSession).filter(UserSession.user_id == uuid.UUID(user_id))

        if active_only:
            query = query.filter(UserSession.is_active == True)

        if not include_expired:
            query = query.filter(UserSession.expires_at > datetime.utcnow())

        # Order by created_at descending (newest first)
        sessions = query.order_by(UserSession.created_at.desc()).all()

        return sessions

    @staticmethod
    def get_session_by_id(db: Session, session_id: str) -> Optional[UserSession]:
        """
        Get a session by its session_id

        Args:
            db: Database session
            session_id: Session identifier

        Returns:
            UserSession object or None
        """
        return db.query(UserSession).filter(
            UserSession.session_id == session_id
        ).first()

    @staticmethod
    def get_session_by_uuid(db: Session, session_uuid: str) -> Optional[UserSession]:
        """
        Get a session by its UUID (primary key)

        Args:
            db: Database session
            session_uuid: Session UUID

        Returns:
            UserSession object or None
        """
        return db.query(UserSession).filter(
            UserSession.id == uuid.UUID(session_uuid)
        ).first()

    @staticmethod
    def update_last_active(db: Session, session_id: str) -> None:
        """
        Update the last_active timestamp for a session

        Args:
            db: Database session
            session_id: Session identifier
        """
        try:
            result = db.query(UserSession).filter(
                UserSession.session_id == session_id
            ).update({"last_active": datetime.utcnow()})
            db.commit()
            logger.debug(f"Updated last_active for session {session_id}, rows affected: {result}")
        except Exception as e:
            logger.warning(f"Failed to update last_active for session {session_id}: {e}", exc_info=True)
            db.rollback()

    @staticmethod
    def revoke_session(db: Session, session_uuid: str, user_id: str) -> bool:
        """
        Revoke a specific session

        Args:
            db: Database session
            session_uuid: Session UUID to revoke
            user_id: User ID (for authorization check)

        Returns:
            True if revoked successfully, False otherwise
        """
        try:
            session = db.query(UserSession).filter(
                and_(
                    UserSession.id == uuid.UUID(session_uuid),
                    UserSession.user_id == uuid.UUID(user_id)
                )
            ).first()

            if not session:
                logger.warning(f"Session {session_uuid} not found or unauthorized")
                return False

            session.revoke()
            db.commit()

            logger.info(f"Revoked session {session_uuid} for user {user_id}")
            return True

        except Exception as e:
            db.rollback()
            logger.error(f"Failed to revoke session {session_uuid}: {e}", exc_info=True)
            return False

    @staticmethod
    def revoke_session_by_session_id(db: Session, session_id: str) -> bool:
        """
        Revoke a session by its session_id

        Args:
            db: Database session
            session_id: Session identifier

        Returns:
            True if revoked successfully
        """
        try:
            session = SessionService.get_session_by_id(db, session_id)
            if session:
                session.revoke()
                db.commit()
                logger.info(f"Revoked session {session_id}")
                return True
            return False
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to revoke session {session_id}: {e}")
            return False

    @staticmethod
    def revoke_all_other_sessions(
        db: Session,
        current_session_id: str,
        user_id: str
    ) -> int:
        """
        Revoke all sessions for a user except the current one

        Args:
            db: Database session
            current_session_id: Session ID to keep active
            user_id: User ID

        Returns:
            Number of sessions revoked
        """
        try:
            # Find all active sessions except the current one
            sessions = db.query(UserSession).filter(
                and_(
                    UserSession.user_id == uuid.UUID(user_id),
                    UserSession.session_id != current_session_id,
                    UserSession.is_active == True
                )
            ).all()

            count = 0
            for session in sessions:
                session.revoke()
                count += 1

            db.commit()

            logger.info(f"Revoked {count} sessions for user {user_id}")
            return count

        except Exception as e:
            db.rollback()
            logger.error(f"Failed to revoke all other sessions for user {user_id}: {e}", exc_info=True)
            return 0

    @staticmethod
    def validate_session(db: Session, session_id: str) -> bool:
        """
        Validate if a session is active and not expired

        Args:
            db: Database session
            session_id: Session identifier

        Returns:
            True if session is valid, False otherwise
        """
        session = SessionService.get_session_by_id(db, session_id)

        if not session:
            return False

        # Check if session is valid (active and not expired)
        is_valid = session.is_valid()

        if is_valid:
            # Update last active timestamp
            SessionService.update_last_active(db, session_id)

        return is_valid

    @staticmethod
    def cleanup_expired_sessions(db: Session) -> int:
        """
        Clean up expired sessions

        Args:
            db: Database session

        Returns:
            Number of sessions cleaned up
        """
        try:
            # Find expired sessions that are still marked as active
            expired_sessions = db.query(UserSession).filter(
                and_(
                    UserSession.expires_at < datetime.utcnow(),
                    UserSession.is_active == True
                )
            ).all()

            count = 0
            for session in expired_sessions:
                session.revoke()
                count += 1

            db.commit()

            logger.info(f"Cleaned up {count} expired sessions")
            return count

        except Exception as e:
            db.rollback()
            logger.error(f"Failed to cleanup expired sessions: {e}", exc_info=True)
            return 0

    @staticmethod
    def get_active_session_count(db: Session, user_id: str) -> int:
        """
        Get count of active sessions for a user

        Args:
            db: Database session
            user_id: User ID

        Returns:
            Number of active sessions
        """
        return db.query(UserSession).filter(
            and_(
                UserSession.user_id == uuid.UUID(user_id),
                UserSession.is_active == True,
                UserSession.expires_at > datetime.utcnow()
            )
        ).count()

    @staticmethod
    def _get_client_ip(request) -> Optional[str]:
        """
        Extract client IP address from request

        Handles X-Forwarded-For and X-Real-IP headers for proxies

        Args:
            request: FastAPI Request object

        Returns:
            IP address string or None
        """
        # Check X-Forwarded-For header (for proxies/load balancers)
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            # Take the first IP in the list
            return forwarded_for.split(",")[0].strip()

        # Check X-Real-IP header
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip

        # Fall back to direct client IP
        if request.client:
            return request.client.host

        return None


# Create singleton instance
session_service = SessionService()
