"""Security monitoring and alerting service"""

import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from collections import defaultdict
import asyncio
from enum import Enum
import hashlib
import socket

logger = logging.getLogger(__name__)


class SecurityEventType(Enum):
    """Types of security events to monitor"""
    AUTHENTICATION_FAILED = "auth_failed"
    AUTHENTICATION_SUCCESS = "auth_success"
    RATE_LIMIT_EXCEEDED = "rate_limit"
    SUSPICIOUS_FILE_UPLOAD = "suspicious_file"
    SQL_INJECTION_ATTEMPT = "sql_injection"
    XSS_ATTEMPT = "xss"
    UNAUTHORIZED_ACCESS = "unauthorized"
    DATA_BREACH_ATTEMPT = "data_breach"
    BRUTE_FORCE_ATTEMPT = "brute_force"
    SESSION_HIJACK_ATTEMPT = "session_hijack"
    PRIVILEGE_ESCALATION = "privilege_escalation"
    MALWARE_DETECTED = "malware"
    ENCRYPTION_FAILURE = "encryption_fail"
    AUDIT_LOG_TAMPER = "audit_tamper"


class SecuritySeverity(Enum):
    """Security event severity levels"""
    CRITICAL = "critical"  # Immediate action required
    HIGH = "high"         # Urgent investigation needed
    MEDIUM = "medium"     # Review within 24 hours
    LOW = "low"          # Informational
    INFO = "info"        # Normal activity


class SecurityMonitor:
    """Central security monitoring service"""

    def __init__(self):
        self.events = defaultdict(list)
        self.alert_thresholds = {
            SecurityEventType.AUTHENTICATION_FAILED: (5, timedelta(minutes=5)),  # 5 fails in 5 mins
            SecurityEventType.RATE_LIMIT_EXCEEDED: (10, timedelta(minutes=10)),
            SecurityEventType.SUSPICIOUS_FILE_UPLOAD: (3, timedelta(minutes=30)),
            SecurityEventType.SQL_INJECTION_ATTEMPT: (1, timedelta(hours=24)),  # Any attempt
            SecurityEventType.XSS_ATTEMPT: (1, timedelta(hours=24)),
            SecurityEventType.BRUTE_FORCE_ATTEMPT: (10, timedelta(minutes=10)),
            SecurityEventType.DATA_BREACH_ATTEMPT: (1, timedelta(hours=24)),
        }
        self.blocked_ips = set()
        self.suspicious_users = set()

    async def log_security_event(
        self,
        event_type: SecurityEventType,
        severity: SecuritySeverity,
        user_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        request_path: Optional[str] = None
    ):
        """
        Log a security event

        Args:
            event_type: Type of security event
            severity: Severity level
            user_id: User involved (if any)
            ip_address: IP address of request
            details: Additional event details
            request_path: Request path that triggered event
        """
        event = {
            'timestamp': datetime.utcnow().isoformat(),
            'type': event_type.value,
            'severity': severity.value,
            'user_id': user_id,
            'ip_address': ip_address,
            'request_path': request_path,
            'details': details or {},
            'host': socket.gethostname()
        }

        # Add to in-memory events
        key = f"{event_type.value}:{user_id or ip_address}"
        self.events[key].append(event)

        # Log based on severity
        if severity == SecuritySeverity.CRITICAL:
            logger.critical(f"SECURITY EVENT: {json.dumps(event)}")
            await self._send_critical_alert(event)
        elif severity == SecuritySeverity.HIGH:
            logger.error(f"SECURITY EVENT: {json.dumps(event)}")
            await self._check_alert_threshold(event_type, key)
        elif severity == SecuritySeverity.MEDIUM:
            logger.warning(f"SECURITY EVENT: {json.dumps(event)}")
        else:
            logger.info(f"SECURITY EVENT: {json.dumps(event)}")

        # Check for patterns
        await self._analyze_patterns(event)

        # Store in database (if configured)
        await self._store_event(event)

    async def _check_alert_threshold(
        self,
        event_type: SecurityEventType,
        key: str
    ):
        """Check if event threshold exceeded"""
        if event_type not in self.alert_thresholds:
            return

        threshold_count, threshold_time = self.alert_thresholds[event_type]
        cutoff = datetime.utcnow() - threshold_time

        # Filter recent events
        recent_events = [
            e for e in self.events[key]
            if datetime.fromisoformat(e['timestamp']) > cutoff
        ]

        if len(recent_events) >= threshold_count:
            await self._trigger_alert(event_type, recent_events)

    async def _trigger_alert(
        self,
        event_type: SecurityEventType,
        events: List[Dict[str, Any]]
    ):
        """Trigger security alert"""
        alert = {
            'alert_type': 'threshold_exceeded',
            'event_type': event_type.value,
            'event_count': len(events),
            'first_event': events[0],
            'last_event': events[-1],
            'timestamp': datetime.utcnow().isoformat()
        }

        logger.critical(f"SECURITY ALERT: {json.dumps(alert)}")

        # Take automatic action based on event type
        if event_type == SecurityEventType.BRUTE_FORCE_ATTEMPT:
            ip = events[0].get('ip_address')
            if ip:
                await self.block_ip(ip)

        # Send notifications
        await self._send_alert_notification(alert)

    async def block_ip(self, ip_address: str):
        """Block an IP address"""
        self.blocked_ips.add(ip_address)
        logger.warning(f"Blocked IP address: {ip_address}")

        # Store in database
        await self._store_blocked_ip(ip_address)

    async def block_user(self, user_id: str):
        """Mark user as suspicious"""
        self.suspicious_users.add(user_id)
        logger.warning(f"Marked user as suspicious: {user_id}")

        # Update user record
        await self._update_user_status(user_id, 'suspended')

    async def _analyze_patterns(self, event: Dict[str, Any]):
        """Analyze event patterns for anomalies"""

        # Check for rapid authentication failures
        if event['type'] == SecurityEventType.AUTHENTICATION_FAILED.value:
            await self._check_brute_force(event)

        # Check for SQL injection patterns
        if 'details' in event and 'query' in event['details']:
            if self._detect_sql_injection(event['details']['query']):
                await self.log_security_event(
                    SecurityEventType.SQL_INJECTION_ATTEMPT,
                    SecuritySeverity.CRITICAL,
                    user_id=event.get('user_id'),
                    ip_address=event.get('ip_address'),
                    details={'original_event': event}
                )

        # Check for XSS patterns
        if 'details' in event and 'input' in event['details']:
            if self._detect_xss(event['details']['input']):
                await self.log_security_event(
                    SecurityEventType.XSS_ATTEMPT,
                    SecuritySeverity.HIGH,
                    user_id=event.get('user_id'),
                    ip_address=event.get('ip_address'),
                    details={'original_event': event}
                )

    async def _check_brute_force(self, event: Dict[str, Any]):
        """Check for brute force patterns"""
        key = f"auth_failed:{event.get('ip_address')}"
        cutoff = datetime.utcnow() - timedelta(minutes=5)

        recent_failures = [
            e for e in self.events[key]
            if datetime.fromisoformat(e['timestamp']) > cutoff
        ]

        if len(recent_failures) >= 10:
            await self.log_security_event(
                SecurityEventType.BRUTE_FORCE_ATTEMPT,
                SecuritySeverity.HIGH,
                ip_address=event.get('ip_address'),
                details={'failure_count': len(recent_failures)}
            )

    def _detect_sql_injection(self, text: str) -> bool:
        """Detect potential SQL injection attempts"""
        sql_patterns = [
            r"(\b(union|select|insert|update|delete|drop|create)\b.*\b(from|into|where)\b)",
            r"(--|\#|\/\*|\*\/)",
            r"(\bor\b.*=.*)",
            r"(\band\b.*=.*)",
            r"(';|\";\s*(--)?)",
            r"(\bexec\b|\bexecute\b)",
            r"(\bxp_\w+)",
            r"(\bsp_\w+)",
        ]

        import re
        text_lower = text.lower()
        for pattern in sql_patterns:
            if re.search(pattern, text_lower):
                return True
        return False

    def _detect_xss(self, text: str) -> bool:
        """Detect potential XSS attempts"""
        xss_patterns = [
            r"<script[^>]*>.*?</script>",
            r"javascript:",
            r"on\w+\s*=",
            r"<iframe",
            r"<object",
            r"<embed",
            r"eval\(",
            r"alert\(",
            r"document\.(cookie|write|location)",
            r"window\.(location|open)",
        ]

        import re
        text_lower = text.lower()
        for pattern in xss_patterns:
            if re.search(pattern, text_lower):
                return True
        return False

    async def _send_critical_alert(self, event: Dict[str, Any]):
        """Send critical security alert"""
        # Implement email/SMS/Slack notification
        logger.critical(f"CRITICAL ALERT SENT: {event['type']}")

    async def _send_alert_notification(self, alert: Dict[str, Any]):
        """Send alert notifications"""
        # Implement notification system
        logger.info(f"Alert notification sent: {alert['alert_type']}")

    async def _store_event(self, event: Dict[str, Any]):
        """Store security event in database"""
        # Store in security_events table
        from database.database import get_db
        db = next(get_db())

        try:
            # Create security event record
            from sqlalchemy import text
            query = text("""
                INSERT INTO security_events
                (timestamp, event_type, severity, user_id, ip_address, request_path, details)
                VALUES (:timestamp, :event_type, :severity, :user_id, :ip_address, :request_path, :details)
            """)

            db.execute(query, {
                'timestamp': event['timestamp'],
                'event_type': event['type'],
                'severity': event['severity'],
                'user_id': event.get('user_id'),
                'ip_address': event.get('ip_address'),
                'request_path': event.get('request_path'),
                'details': json.dumps(event.get('details', {}))
            })
            db.commit()
        except Exception as e:
            logger.error(f"Failed to store security event: {e}")
        finally:
            db.close()

    async def _store_blocked_ip(self, ip_address: str):
        """Store blocked IP in database"""
        # Implement IP blocking storage
        pass

    async def _update_user_status(self, user_id: str, status: str):
        """Update user account status"""
        # Implement user status update
        pass

    def get_security_summary(self) -> Dict[str, Any]:
        """Get security summary for dashboard"""
        now = datetime.utcnow()
        last_24h = now - timedelta(hours=24)

        summary = {
            'blocked_ips': list(self.blocked_ips),
            'suspicious_users': list(self.suspicious_users),
            'events_24h': {},
            'critical_events': [],
            'high_events': []
        }

        # Count events by type in last 24h
        for key, events in self.events.items():
            recent = [
                e for e in events
                if datetime.fromisoformat(e['timestamp']) > last_24h
            ]

            if recent:
                event_type = recent[0]['type']
                summary['events_24h'][event_type] = len(recent)

                # Collect critical and high events
                for event in recent:
                    if event['severity'] == SecuritySeverity.CRITICAL.value:
                        summary['critical_events'].append(event)
                    elif event['severity'] == SecuritySeverity.HIGH.value:
                        summary['high_events'].append(event)

        return summary

    async def cleanup_old_events(self, days: int = 30):
        """Clean up old security events"""
        cutoff = datetime.utcnow() - timedelta(days=days)

        # Clean in-memory events
        for key in list(self.events.keys()):
            self.events[key] = [
                e for e in self.events[key]
                if datetime.fromisoformat(e['timestamp']) > cutoff
            ]

            if not self.events[key]:
                del self.events[key]

        logger.info(f"Cleaned up security events older than {days} days")


# Global security monitor instance
security_monitor = SecurityMonitor()


# Audit logging
class AuditLogger:
    """Audit logging for compliance"""

    @staticmethod
    async def log_data_access(
        user_id: str,
        resource_type: str,
        resource_id: str,
        action: str,
        ip_address: Optional[str] = None
    ):
        """Log data access for audit trail"""
        audit_entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'user_id': user_id,
            'resource_type': resource_type,
            'resource_id': resource_id,
            'action': action,
            'ip_address': ip_address
        }

        logger.info(f"AUDIT: {json.dumps(audit_entry)}")

        # Store in audit_logs table
        # Implementation depends on database schema

    @staticmethod
    async def log_configuration_change(
        user_id: str,
        config_type: str,
        old_value: Any,
        new_value: Any,
        ip_address: Optional[str] = None
    ):
        """Log configuration changes"""
        audit_entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'user_id': user_id,
            'config_type': config_type,
            'old_value': old_value,
            'new_value': new_value,
            'ip_address': ip_address
        }

        logger.warning(f"CONFIG CHANGE: {json.dumps(audit_entry)}")

    @staticmethod
    async def log_privilege_change(
        admin_id: str,
        target_user_id: str,
        old_role: str,
        new_role: str,
        ip_address: Optional[str] = None
    ):
        """Log privilege/role changes"""
        audit_entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'admin_id': admin_id,
            'target_user_id': target_user_id,
            'old_role': old_role,
            'new_role': new_role,
            'ip_address': ip_address
        }

        logger.warning(f"PRIVILEGE CHANGE: {json.dumps(audit_entry)}")


# Global audit logger
audit_logger = AuditLogger()