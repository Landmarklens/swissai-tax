"""
Encryption monitoring and key rotation support
Tracks encryption operations, performance, and key rotation status
"""
import json
import logging
import os
import time
from dataclasses import asdict, dataclass
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


@dataclass
class EncryptionMetrics:
    """Metrics for encryption operations"""
    operation: str  # 'encrypt' or 'decrypt'
    duration_ms: float
    data_size_bytes: int
    success: bool
    error_message: Optional[str] = None
    timestamp: str = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.utcnow().isoformat()


class EncryptionMonitor:
    """
    Monitor encryption operations for performance and security
    Tracks metrics, detects anomalies, and supports key rotation
    """

    def __init__(self):
        self.metrics: List[EncryptionMetrics] = []
        self.max_metrics = int(os.environ.get('ENCRYPTION_METRICS_MAX', '10000'))
        self.alert_threshold_ms = float(os.environ.get('ENCRYPTION_ALERT_THRESHOLD_MS', '1000'))

    def record_operation(
        self,
        operation: str,
        duration_ms: float,
        data_size_bytes: int,
        success: bool,
        error_message: Optional[str] = None
    ):
        """
        Record an encryption/decryption operation

        Args:
            operation: 'encrypt' or 'decrypt'
            duration_ms: Operation duration in milliseconds
            data_size_bytes: Size of data processed
            success: Whether operation succeeded
            error_message: Error message if failed
        """
        metric = EncryptionMetrics(
            operation=operation,
            duration_ms=duration_ms,
            data_size_bytes=data_size_bytes,
            success=success,
            error_message=error_message
        )

        self.metrics.append(metric)

        # Trim metrics if exceeding max
        if len(self.metrics) > self.max_metrics:
            self.metrics = self.metrics[-self.max_metrics:]

        # Alert on slow operations
        if duration_ms > self.alert_threshold_ms:
            logger.warning(
                f"Slow {operation} operation: {duration_ms:.2f}ms for {data_size_bytes} bytes"
            )

        # Alert on failures
        if not success:
            logger.error(
                f"Failed {operation} operation: {error_message}"
            )

    def get_metrics_summary(self, hours: int = 24) -> Dict[str, Any]:
        """
        Get summary of encryption metrics for last N hours

        Args:
            hours: Number of hours to include in summary

        Returns:
            Dictionary with metrics summary
        """
        cutoff = datetime.utcnow() - timedelta(hours=hours)
        recent_metrics = [
            m for m in self.metrics
            if datetime.fromisoformat(m.timestamp) > cutoff
        ]

        if not recent_metrics:
            return {
                'period_hours': hours,
                'total_operations': 0,
                'encrypt_count': 0,
                'decrypt_count': 0
            }

        encrypt_metrics = [m for m in recent_metrics if m.operation == 'encrypt']
        decrypt_metrics = [m for m in recent_metrics if m.operation == 'decrypt']

        success_count = len([m for m in recent_metrics if m.success])
        failure_count = len([m for m in recent_metrics if not m.success])

        summary = {
            'period_hours': hours,
            'total_operations': len(recent_metrics),
            'encrypt_count': len(encrypt_metrics),
            'decrypt_count': len(decrypt_metrics),
            'success_count': success_count,
            'failure_count': failure_count,
            'success_rate': (success_count / len(recent_metrics) * 100) if recent_metrics else 0,
            'avg_encrypt_time_ms': sum(m.duration_ms for m in encrypt_metrics) / len(encrypt_metrics) if encrypt_metrics else 0,
            'avg_decrypt_time_ms': sum(m.duration_ms for m in decrypt_metrics) / len(decrypt_metrics) if decrypt_metrics else 0,
            'avg_data_size_bytes': sum(m.data_size_bytes for m in recent_metrics) / len(recent_metrics) if recent_metrics else 0,
            'slow_operations': len([m for m in recent_metrics if m.duration_ms > self.alert_threshold_ms])
        }

        return summary

    def detect_anomalies(self) -> List[Dict[str, Any]]:
        """
        Detect anomalies in encryption operations

        Returns:
            List of detected anomalies
        """
        anomalies = []

        # Get recent metrics (last hour)
        summary = self.get_metrics_summary(hours=1)

        # Check failure rate
        if summary['total_operations'] > 10 and summary['success_rate'] < 95:
            anomalies.append({
                'type': 'high_failure_rate',
                'severity': 'high',
                'message': f"High failure rate: {100 - summary['success_rate']:.1f}%",
                'value': summary['success_rate']
            })

        # Check slow operations
        if summary.get('slow_operations', 0) > summary['total_operations'] * 0.1:
            anomalies.append({
                'type': 'many_slow_operations',
                'severity': 'medium',
                'message': f"{summary['slow_operations']} slow operations detected",
                'value': summary['slow_operations']
            })

        # Check average times
        if summary.get('avg_encrypt_time_ms', 0) > 500:
            anomalies.append({
                'type': 'slow_encryption',
                'severity': 'medium',
                'message': f"Average encryption time is high: {summary['avg_encrypt_time_ms']:.1f}ms",
                'value': summary['avg_encrypt_time_ms']
            })

        return anomalies

    def export_metrics(self, filepath: str):
        """
        Export metrics to JSON file

        Args:
            filepath: Path to export file
        """
        try:
            with open(filepath, 'w') as f:
                json.dump([asdict(m) for m in self.metrics], f, indent=2)
            logger.info(f"Exported {len(self.metrics)} metrics to {filepath}")
        except Exception as e:
            logger.error(f"Failed to export metrics: {e}")

    def clear_metrics(self):
        """Clear all stored metrics"""
        count = len(self.metrics)
        self.metrics = []
        logger.info(f"Cleared {count} metrics")


class KeyRotationManager:
    """
    Manage encryption key rotation
    Tracks key age and facilitates rotation
    """

    def __init__(self):
        self.key_created_at = os.environ.get('ENCRYPTION_KEY_CREATED_AT')
        self.rotation_days = int(os.environ.get('ENCRYPTION_KEY_ROTATION_DAYS', '90'))

    def check_key_age(self) -> Dict[str, Any]:
        """
        Check encryption key age

        Returns:
            Dictionary with key age information
        """
        if not self.key_created_at:
            return {
                'age_known': False,
                'message': 'Key creation date not configured',
                'requires_rotation': False
            }

        try:
            created_at = datetime.fromisoformat(self.key_created_at)
            age_days = (datetime.utcnow() - created_at).days
            days_until_rotation = self.rotation_days - age_days

            return {
                'age_known': True,
                'created_at': self.key_created_at,
                'age_days': age_days,
                'rotation_policy_days': self.rotation_days,
                'days_until_rotation': days_until_rotation,
                'requires_rotation': age_days >= self.rotation_days,
                'message': f"Key is {age_days} days old. Rotation {'required' if age_days >= self.rotation_days else f'in {days_until_rotation} days'}"
            }
        except Exception as e:
            logger.error(f"Failed to check key age: {e}")
            return {
                'age_known': False,
                'error': str(e),
                'requires_rotation': False
            }

    def initiate_key_rotation(self) -> Dict[str, Any]:
        """
        Initiate key rotation process

        This triggers the key rotation procedure using the rotation script.
        The actual re-encryption should be done during a maintenance window.

        Returns:
            Dictionary with rotation status and instructions
        """
        from cryptography.fernet import Fernet

        logger.warning("Key rotation initiated")

        # Generate new key
        new_key = Fernet.generate_key().decode()

        return {
            'status': 'ready_to_rotate',
            'message': 'New encryption key generated. Follow the steps below to complete rotation.',
            'new_key_generated': True,
            'new_key': new_key[:10] + '...' + new_key[-10:],  # Partial key for verification only
            'requires_manual_steps': True,
            'next_steps': [
                '1. Schedule a maintenance window (no user access)',
                '2. Create a database backup',
                '3. Run: python scripts/rotate_encryption_key.py --rotate --old-key <OLD_KEY> --new-key <NEW_KEY>',
                '4. Update AWS Secrets Manager with new key',
                '5. Update ENCRYPTION_KEY_CREATED_AT environment variable to: ' + datetime.utcnow().isoformat(),
                '6. Restart application servers',
                '7. Verify: python scripts/rotate_encryption_key.py --verify',
                '8. Monitor logs for any decryption errors'
            ],
            'script_location': 'backend/scripts/rotate_encryption_key.py',
            'documentation': 'See ENCRYPTION_ARCHITECTURE.md for detailed rotation procedures'
        }


class EncryptionHealthCheck:
    """
    Health check for encryption system
    Validates encryption is working correctly
    """

    def __init__(self, monitor: EncryptionMonitor, key_manager: KeyRotationManager):
        self.monitor = monitor
        self.key_manager = key_manager

    def perform_health_check(self) -> Dict[str, Any]:
        """
        Perform complete encryption health check

        Returns:
            Dictionary with health check results
        """
        health = {
            'timestamp': datetime.utcnow().isoformat(),
            'overall_status': 'healthy',
            'checks': {}
        }

        # Check 1: Encryption service availability
        try:
            from utils.encryption import get_encryption_service
            service = get_encryption_service()
            test_data = "health_check_test"
            encrypted = service.encrypt(test_data)
            decrypted = service.decrypt(encrypted)
            assert decrypted == test_data

            health['checks']['encryption_service'] = {
                'status': 'healthy',
                'message': 'Encryption service working correctly'
            }
        except Exception as e:
            health['checks']['encryption_service'] = {
                'status': 'unhealthy',
                'error': str(e)
            }
            health['overall_status'] = 'unhealthy'

        # Check 2: Recent metrics
        summary = self.monitor.get_metrics_summary(hours=1)
        if summary['total_operations'] > 0 and summary['success_rate'] >= 95:
            health['checks']['recent_operations'] = {
                'status': 'healthy',
                'operations': summary['total_operations'],
                'success_rate': summary['success_rate']
            }
        elif summary['total_operations'] > 0:
            health['checks']['recent_operations'] = {
                'status': 'degraded',
                'operations': summary['total_operations'],
                'success_rate': summary['success_rate']
            }
            health['overall_status'] = 'degraded'
        else:
            health['checks']['recent_operations'] = {
                'status': 'unknown',
                'message': 'No recent operations'
            }

        # Check 3: Key age
        key_status = self.key_manager.check_key_age()
        if key_status.get('requires_rotation'):
            health['checks']['key_rotation'] = {
                'status': 'warning',
                'message': key_status.get('message'),
                'age_days': key_status.get('age_days')
            }
        else:
            health['checks']['key_rotation'] = {
                'status': 'healthy',
                'message': key_status.get('message', 'Key age within policy')
            }

        # Check 4: Anomaly detection
        anomalies = self.monitor.detect_anomalies()
        if anomalies:
            health['checks']['anomalies'] = {
                'status': 'warning',
                'count': len(anomalies),
                'anomalies': anomalies
            }
            if any(a['severity'] == 'high' for a in anomalies):
                health['overall_status'] = 'degraded'
        else:
            health['checks']['anomalies'] = {
                'status': 'healthy',
                'message': 'No anomalies detected'
            }

        return health


# Singleton instances
_monitor = None
_key_manager = None
_health_check = None


def get_encryption_monitor() -> EncryptionMonitor:
    """Get or create encryption monitor instance"""
    global _monitor
    if _monitor is None:
        _monitor = EncryptionMonitor()
    return _monitor


def get_key_rotation_manager() -> KeyRotationManager:
    """Get or create key rotation manager instance"""
    global _key_manager
    if _key_manager is None:
        _key_manager = KeyRotationManager()
    return _key_manager


def get_encryption_health_check() -> EncryptionHealthCheck:
    """Get or create encryption health check instance"""
    global _health_check
    if _health_check is None:
        monitor = get_encryption_monitor()
        key_manager = get_key_rotation_manager()
        _health_check = EncryptionHealthCheck(monitor, key_manager)
    return _health_check
