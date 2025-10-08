"""
Audit Log Service
Handles creation and retrieval of audit logs for user activities
"""
from sqlalchemy.orm import Session
from models.audit_log import AuditLog
from typing import Optional, Dict, Any, List, Tuple, Union
from datetime import datetime, timedelta
from uuid import UUID
import logging

logger = logging.getLogger(__name__)


class AuditLogService:
    """Service for managing audit logs"""

    @staticmethod
    def log_event(
        db: Session,
        user_id: Union[UUID, str],
        event_type: str,
        event_category: str,
        description: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        status: str = "success",
        session_id: Optional[str] = None
    ) -> Optional[AuditLog]:
        """
        Create an audit log entry
        
        Args:
            db: Database session
            user_id: User ID
            event_type: Type of event (e.g., 'login_success', 'password_changed')
            event_category: Category of event (e.g., 'authentication', 'security')
            description: Human-readable description
            ip_address: IP address of the request
            user_agent: User agent string
            metadata: Additional metadata as JSON
            status: Status of the event ('success' or 'failed')
            
        Returns:
            AuditLog instance or None if logging fails
        """
        try:
            # Parse device info from user agent
            device_info = None
            if user_agent:
                device_info = AuditLogService._parse_user_agent(user_agent)

            audit_log = AuditLog(
                user_id=user_id,
                session_id=session_id,
                event_type=event_type,
                event_category=event_category,
                description=description,
                ip_address=ip_address,
                user_agent=user_agent,
                device_info=device_info,
                event_metadata=metadata,
                status=status
            )

            db.add(audit_log)
            db.commit()
            db.refresh(audit_log)

            logger.info(f"Audit log created: user_id={user_id}, event={event_type}, status={status}")
            return audit_log

        except Exception as e:
            logger.error(f"Failed to create audit log: {e}")
            db.rollback()
            # Don't fail the main operation if audit logging fails
            return None

    @staticmethod
    def _parse_user_agent(user_agent: str) -> Dict[str, Any]:
        """
        Parse user agent string to extract device info
        Simple parsing without external dependencies
        """
        device_info = {
            "browser": "Unknown",
            "os": "Unknown",
            "device": "Desktop",
            "is_mobile": False,
            "is_tablet": False,
            "is_pc": True
        }

        user_agent_lower = user_agent.lower()

        # Detect mobile/tablet
        if any(mobile in user_agent_lower for mobile in ['mobile', 'android', 'iphone', 'ipod']):
            device_info["is_mobile"] = True
            device_info["is_pc"] = False
            device_info["device"] = "Mobile"
        
        if any(tablet in user_agent_lower for tablet in ['tablet', 'ipad']):
            device_info["is_tablet"] = True
            device_info["is_mobile"] = False
            device_info["is_pc"] = False
            device_info["device"] = "Tablet"

        # Detect browser
        if 'chrome' in user_agent_lower and 'edg' not in user_agent_lower:
            device_info["browser"] = "Chrome"
        elif 'firefox' in user_agent_lower:
            device_info["browser"] = "Firefox"
        elif 'safari' in user_agent_lower and 'chrome' not in user_agent_lower:
            device_info["browser"] = "Safari"
        elif 'edg' in user_agent_lower:
            device_info["browser"] = "Edge"
        elif 'opera' in user_agent_lower or 'opr' in user_agent_lower:
            device_info["browser"] = "Opera"

        # Detect OS (check more specific patterns first)
        if 'android' in user_agent_lower:
            device_info["os"] = "Android"
        elif 'iphone' in user_agent_lower or 'ipad' in user_agent_lower:
            device_info["os"] = "iOS"
        elif 'windows' in user_agent_lower:
            device_info["os"] = "Windows"
        elif 'mac os' in user_agent_lower or 'macos' in user_agent_lower:
            device_info["os"] = "macOS"
        elif 'linux' in user_agent_lower:
            device_info["os"] = "Linux"

        return device_info

    @staticmethod
    def get_user_logs(
        db: Session,
        user_id: Union[UUID, str],
        limit: int = 50,
        offset: int = 0,
        event_category: Optional[str] = None,
        event_type: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Tuple[List[AuditLog], int]:
        """
        Get audit logs for a user with filters
        
        Returns:
            Tuple of (logs, total_count)
        """
        query = db.query(AuditLog).filter(AuditLog.user_id == user_id)

        if event_category:
            query = query.filter(AuditLog.event_category == event_category)

        if event_type:
            query = query.filter(AuditLog.event_type == event_type)

        if start_date:
            query = query.filter(AuditLog.created_at >= start_date)

        if end_date:
            query = query.filter(AuditLog.created_at <= end_date)

        total_count = query.count()

        logs = query.order_by(AuditLog.created_at.desc()).limit(limit).offset(offset).all()

        return logs, total_count

    @staticmethod
    def cleanup_old_logs(db: Session, days: int = 90) -> int:
        """
        Delete audit logs older than specified days
        
        Returns:
            Number of deleted rows
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days)

        deleted_count = db.query(AuditLog).filter(
            AuditLog.created_at < cutoff_date
        ).delete()

        db.commit()

        logger.info(f"Deleted {deleted_count} audit logs older than {days} days")
        return deleted_count


# Convenience functions for common events
def log_login_success(db: Session, user_id: Union[UUID, str], ip: str, user_agent: str, session_id: Optional[str] = None) -> Optional[AuditLog]:
    """Log successful login"""
    return AuditLogService.log_event(
        db, user_id, "login_success", "authentication",
        "User logged in successfully",
        ip, user_agent, session_id=session_id
    )


def log_login_failed(db: Session, email: str, ip: str, user_agent: str, reason: str) -> Optional[AuditLog]:
    """Log failed login attempt (user_id may not be available)"""
    # For failed logins, we might not have user_id, so we'll need to handle this differently
    # Store email in metadata instead
    return None  # Will implement this differently


def log_logout(db: Session, user_id: Union[UUID, str], ip: str, user_agent: str) -> Optional[AuditLog]:
    """Log user logout"""
    return AuditLogService.log_event(
        db, user_id, "logout", "authentication",
        "User logged out",
        ip, user_agent
    )


def log_password_changed(db: Session, user_id: Union[UUID, str], ip: str, user_agent: str) -> Optional[AuditLog]:
    """Log password change"""
    return AuditLogService.log_event(
        db, user_id, "password_changed", "security",
        "Password was changed",
        ip, user_agent
    )


def log_2fa_enabled(db: Session, user_id: Union[UUID, str], ip: str, user_agent: str) -> Optional[AuditLog]:
    """Log 2FA enabled"""
    return AuditLogService.log_event(
        db, user_id, "2fa_enabled", "security",
        "Two-factor authentication enabled",
        ip, user_agent
    )


def log_2fa_disabled(db: Session, user_id: Union[UUID, str], ip: str, user_agent: str) -> Optional[AuditLog]:
    """Log 2FA disabled"""
    return AuditLogService.log_event(
        db, user_id, "2fa_disabled", "security",
        "Two-factor authentication disabled",
        ip, user_agent
    )


def log_document_uploaded(db: Session, user_id: Union[UUID, str], document_name: str, ip: str, user_agent: str) -> Optional[AuditLog]:
    """Log document upload"""
    return AuditLogService.log_event(
        db, user_id, "document_uploaded", "data_modification",
        f"Document uploaded: {document_name}",
        ip, user_agent, metadata={"document": document_name}
    )


def log_document_downloaded(db: Session, user_id: Union[UUID, str], document_name: str, ip: str, user_agent: str) -> Optional[AuditLog]:
    """Log document download"""
    return AuditLogService.log_event(
        db, user_id, "document_downloaded", "data_access",
        f"Document downloaded: {document_name}",
        ip, user_agent, metadata={"document": document_name}
    )


def log_data_exported(db: Session, user_id: Union[UUID, str], export_type: str, ip: str, user_agent: str) -> Optional[AuditLog]:
    """Log data export"""
    return AuditLogService.log_event(
        db, user_id, "data_exported", "data_access",
        f"Data exported: {export_type}",
        ip, user_agent, metadata={"export_type": export_type}
    )


def log_profile_updated(db: Session, user_id: Union[UUID, str], ip: str, user_agent: str) -> Optional[AuditLog]:
    """Log profile update"""
    return AuditLogService.log_event(
        db, user_id, "profile_updated", "data_modification",
        "Profile information updated",
        ip, user_agent
    )


def log_tax_filing_created(db: Session, user_id: Union[UUID, str], filing_id: str, tax_year: int, canton: str, ip: str, user_agent: str) -> Optional[AuditLog]:
    """Log tax filing creation"""
    return AuditLogService.log_event(
        db, user_id, "tax_filing_created", "data_modification",
        f"Created tax filing for {tax_year} - {canton}",
        ip, user_agent,
        metadata={"filing_id": filing_id, "tax_year": tax_year, "canton": canton}
    )


def log_tax_filing_submitted(db: Session, user_id: Union[UUID, str], filing_id: str, tax_year: int, canton: str, ip: str, user_agent: str) -> Optional[AuditLog]:
    """Log tax filing submission"""
    return AuditLogService.log_event(
        db, user_id, "tax_filing_submitted", "data_modification",
        f"Submitted tax filing for {tax_year} - {canton}",
        ip, user_agent,
        metadata={"filing_id": filing_id, "tax_year": tax_year, "canton": canton}
    )


def log_tax_filing_updated(db: Session, user_id: Union[UUID, str], filing_id: str, tax_year: int, canton: str, ip: str, user_agent: str) -> Optional[AuditLog]:
    """Log tax filing update"""
    return AuditLogService.log_event(
        db, user_id, "tax_filing_updated", "data_modification",
        f"Updated tax filing for {tax_year} - {canton}",
        ip, user_agent,
        metadata={"filing_id": filing_id, "tax_year": tax_year, "canton": canton}
    )


def log_tax_filing_deleted(db: Session, user_id: Union[UUID, str], filing_id: str, tax_year: int, canton: str, ip: str, user_agent: str) -> Optional[AuditLog]:
    """Log tax filing deletion"""
    return AuditLogService.log_event(
        db, user_id, "tax_filing_deleted", "data_modification",
        f"Deleted tax filing for {tax_year} - {canton}",
        ip, user_agent,
        metadata={"filing_id": filing_id, "tax_year": tax_year, "canton": canton}
    )


def log_tax_filing_copied(db: Session, user_id: Union[UUID, str], source_filing_id: str, new_filing_id: str, source_year: int, new_year: int, canton: str, ip: str, user_agent: str) -> Optional[AuditLog]:
    """Log tax filing copied from previous year"""
    return AuditLogService.log_event(
        db, user_id, "tax_filing_copied", "data_modification",
        f"Copied tax filing from {source_year} to {new_year} - {canton}",
        ip, user_agent,
        metadata={
            "source_filing_id": source_filing_id,
            "new_filing_id": new_filing_id,
            "source_year": source_year,
            "new_year": new_year,
            "canton": canton
        }
    )


def log_tax_filing_restored(db: Session, user_id: Union[UUID, str], filing_id: str, tax_year: int, canton: str, ip: str, user_agent: str) -> Optional[AuditLog]:
    """Log tax filing restored from soft delete"""
    return AuditLogService.log_event(
        db, user_id, "tax_filing_restored", "data_modification",
        f"Restored tax filing for {tax_year} - {canton}",
        ip, user_agent,
        metadata={"filing_id": filing_id, "tax_year": tax_year, "canton": canton}
    )
