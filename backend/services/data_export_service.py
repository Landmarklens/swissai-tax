"""
Data Export Service
Handles GDPR-compliant data export (Right to Data Portability)
"""
import csv
import json
import io
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from models.swisstax import (
    DataExport,
    Filing,
    InterviewAnswer,
    Payment,
    Subscription,
    User,
    UserSettings
)
from services.audit_log_service import AuditLogService

logger = logging.getLogger(__name__)


class DataExportService:
    """Service for exporting user data in various formats"""

    EXPORT_EXPIRY_HOURS = 48

    def __init__(self, db: Session):
        self.db = db

    def request_export(
        self,
        user_id: UUID,
        format: str,
        ip_address: str,
        user_agent: str
    ) -> DataExport:
        """
        Create a data export request

        Args:
            user_id: User ID
            format: Export format (json or csv)
            ip_address: Request IP address
            user_agent: Request user agent

        Returns:
            DataExport object

        Raises:
            ValueError: If format is invalid
        """
        if format not in ['json', 'csv']:
            raise ValueError("Format must be 'json' or 'csv'")

        # Create export request
        now = datetime.utcnow()
        expires_at = now + timedelta(hours=self.EXPORT_EXPIRY_HOURS)

        export = DataExport(
            user_id=user_id,
            status='pending',
            format=format,
            expires_at=expires_at,
            created_at=now
        )

        self.db.add(export)
        self.db.commit()
        self.db.refresh(export)

        # Log event
        logger.info(
            f"Data export requested: user_id={user_id}, export_id={export.id}, "
            f"format={format}, ip={ip_address}"
        )
        AuditLogService.log_event(
            self.db, user_id, "data_export_requested", "privacy",
            f"User requested data export in {format} format",
            ip_address, user_agent,
            metadata={'export_id': str(export.id), 'format': format}
        )

        return export

    def collect_user_data(self, user_id: UUID) -> Dict:
        """
        Collect all user data for export

        Args:
            user_id: User ID

        Returns:
            Dictionary containing all user data
        """
        # Get user profile
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        # Get user settings
        settings = self.db.query(UserSettings).filter(
            UserSettings.user_id == user_id
        ).first()

        # Get filings
        filings = self.db.query(Filing).filter(
            Filing.user_id == user_id
        ).all()

        # Get subscriptions
        subscriptions = self.db.query(Subscription).filter(
            Subscription.user_id == user_id
        ).all()

        # Get payments
        payments = self.db.query(Payment).filter(
            Payment.user_id == user_id
        ).all()

        # Get interview answers (from all sessions)
        # Note: This would need to join with interview_sessions
        # For now, we'll include a placeholder

        # Compile data
        data = {
            'export_metadata': {
                'generated_at': datetime.utcnow().isoformat(),
                'user_id': str(user_id),
                'format_version': '1.0'
            },
            'profile': {
                'id': str(user.id),
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'phone': user.phone,
                'preferred_language': user.preferred_language,
                'canton': user.canton,
                'municipality': user.municipality,
                'provider': user.provider,
                'avatar_url': user.avatar_url,
                'created_at': user.created_at.isoformat() if user.created_at else None,
                'updated_at': user.updated_at.isoformat() if user.updated_at else None,
                'last_login': user.last_login.isoformat() if user.last_login else None,
                'is_active': user.is_active,
                'is_grandfathered': user.is_grandfathered,
                'is_test_user': user.is_test_user,
                'two_factor_enabled': user.two_factor_enabled,
            },
            'settings': self._serialize_settings(settings) if settings else None,
            'filings': [self._serialize_filing(f) for f in filings],
            'subscriptions': [self._serialize_subscription(s) for s in subscriptions],
            'payments': [self._serialize_payment(p) for p in payments],
        }

        return data

    def _serialize_settings(self, settings: UserSettings) -> Dict:
        """Serialize user settings to dict"""
        return {
            'language': settings.language,
            'date_format': settings.date_format,
            'currency': settings.currency,
            'default_canton': settings.default_canton,
            'theme': settings.theme,
            'auto_save_enabled': settings.auto_save_enabled,
            'auto_save_interval': settings.auto_save_interval,
            'show_tax_tips': settings.show_tax_tips,
            'enable_ocr': settings.enable_ocr,
            'email_notifications': settings.email_notifications,
            'sms_notifications': settings.sms_notifications,
            'ocr_enabled': settings.ocr_enabled,
            'compress_documents': settings.compress_documents,
            'retention_years': settings.retention_years,
            'created_at': settings.created_at.isoformat() if settings.created_at else None,
            'updated_at': settings.updated_at.isoformat() if settings.updated_at else None,
        }

    def _serialize_filing(self, filing: Filing) -> Dict:
        """Serialize filing to dict"""
        return {
            'id': str(filing.id),
            'tax_year': filing.tax_year,
            'status': filing.status,
            'submission_method': filing.submission_method,
            'submitted_at': filing.submitted_at.isoformat() if filing.submitted_at else None,
            'confirmation_number': filing.confirmation_number,
            'refund_amount': float(filing.refund_amount) if filing.refund_amount else None,
            'payment_amount': float(filing.payment_amount) if filing.payment_amount else None,
            'created_at': filing.created_at.isoformat() if filing.created_at else None,
            'updated_at': filing.updated_at.isoformat() if filing.updated_at else None,
        }

    def _serialize_subscription(self, subscription: Subscription) -> Dict:
        """Serialize subscription to dict"""
        return {
            'id': str(subscription.id),
            'plan_type': subscription.plan_type,
            'status': subscription.status,
            'current_period_start': subscription.current_period_start.isoformat() if subscription.current_period_start else None,
            'current_period_end': subscription.current_period_end.isoformat() if subscription.current_period_end else None,
            'cancel_at_period_end': subscription.cancel_at_period_end,
            'canceled_at': subscription.canceled_at.isoformat() if subscription.canceled_at else None,
            'price_chf': float(subscription.price_chf) if subscription.price_chf else None,
            'currency': subscription.currency,
            'created_at': subscription.created_at.isoformat() if subscription.created_at else None,
            'updated_at': subscription.updated_at.isoformat() if subscription.updated_at else None,
        }

    def _serialize_payment(self, payment: Payment) -> Dict:
        """Serialize payment to dict"""
        return {
            'id': str(payment.id),
            'amount_chf': float(payment.amount_chf) if payment.amount_chf else None,
            'currency': payment.currency,
            'status': payment.status,
            'payment_method': payment.payment_method,
            'card_brand': payment.card_brand,
            'card_last4': payment.card_last4,
            'description': payment.description,
            'created_at': payment.created_at.isoformat() if payment.created_at else None,
            'paid_at': payment.paid_at.isoformat() if payment.paid_at else None,
        }

    def generate_json_export(self, data: Dict) -> str:
        """
        Generate JSON export file content

        Args:
            data: User data dictionary

        Returns:
            JSON string
        """
        return json.dumps(data, indent=2, ensure_ascii=False)

    def generate_csv_export(self, data: Dict) -> str:
        """
        Generate CSV export file content
        Creates multiple CSV sections for different data types

        Args:
            data: User data dictionary

        Returns:
            CSV string
        """
        output = io.StringIO()

        # Profile section
        output.write("=== PROFILE ===\n")
        if data.get('profile'):
            profile_writer = csv.writer(output)
            profile_writer.writerow(['Field', 'Value'])
            for key, value in data['profile'].items():
                profile_writer.writerow([key, value])
        output.write("\n")

        # Settings section
        output.write("=== SETTINGS ===\n")
        if data.get('settings'):
            settings_writer = csv.writer(output)
            settings_writer.writerow(['Setting', 'Value'])
            for key, value in data['settings'].items():
                settings_writer.writerow([key, value])
        output.write("\n")

        # Filings section
        output.write("=== TAX FILINGS ===\n")
        if data.get('filings'):
            filings_writer = csv.DictWriter(
                output,
                fieldnames=['id', 'tax_year', 'status', 'submission_method', 'submitted_at',
                           'refund_amount', 'payment_amount', 'created_at']
            )
            filings_writer.writeheader()
            filings_writer.writerows(data['filings'])
        output.write("\n")

        # Subscriptions section
        output.write("=== SUBSCRIPTIONS ===\n")
        if data.get('subscriptions'):
            subs_writer = csv.DictWriter(
                output,
                fieldnames=['id', 'plan_type', 'status', 'price_chf', 'currency',
                           'current_period_start', 'current_period_end', 'created_at']
            )
            subs_writer.writeheader()
            subs_writer.writerows(data['subscriptions'])
        output.write("\n")

        # Payments section
        output.write("=== PAYMENTS ===\n")
        if data.get('payments'):
            payments_writer = csv.DictWriter(
                output,
                fieldnames=['id', 'amount_chf', 'currency', 'status', 'payment_method',
                           'card_brand', 'card_last4', 'created_at', 'paid_at']
            )
            payments_writer.writeheader()
            payments_writer.writerows(data['payments'])
        output.write("\n")

        return output.getvalue()

    def generate_export(self, export_id: UUID) -> DataExport:
        """
        Generate the export file (would be run as background job)
        In production, this would:
        1. Generate the file
        2. Upload to S3
        3. Update export record with file_url
        4. Send email notification

        Args:
            export_id: Export ID

        Returns:
            Updated DataExport

        Raises:
            ValueError: If export not found or in invalid state
        """
        export = self.db.query(DataExport).filter(
            DataExport.id == export_id
        ).first()

        if not export:
            raise ValueError("Export not found")

        if export.status not in ['pending', 'processing']:
            raise ValueError(f"Export is in {export.status} status, cannot generate")

        try:
            # Update status to processing
            export.status = 'processing'
            self.db.commit()

            # Collect data
            data = self.collect_user_data(export.user_id)

            # Generate file based on format
            if export.format == 'json':
                content = self.generate_json_export(data)
            elif export.format == 'csv':
                content = self.generate_csv_export(data)
            else:
                raise ValueError(f"Unsupported format: {export.format}")

            # Calculate file size
            file_size = len(content.encode('utf-8'))

            # In production, upload to S3 here
            # For now, we'll just store a placeholder URL
            file_url = f"/api/user/download-export/{export.id}"

            # Update export record
            export.file_url = file_url
            export.file_size_bytes = file_size
            export.status = 'completed'
            export.completed_at = datetime.utcnow()

            self.db.commit()
            self.db.refresh(export)

            # Log completion
            logger.info(
                f"Data export completed: user_id={export.user_id}, export_id={export.id}, "
                f"format={export.format}, size_mb={export.file_size_mb}"
            )
            AuditLogService.log_event(
                self.db, export.user_id, "data_export_completed", "privacy",
                f"Data export completed ({export.format}, {export.file_size_mb} MB)",
                metadata={'export_id': str(export.id), 'format': export.format}
            )

            return export

        except Exception as e:
            # Mark as failed
            export.status = 'failed'
            export.error_message = str(e)
            self.db.commit()

            # Log failure
            logger.error(
                f"Data export failed: user_id={export.user_id}, export_id={export.id}, "
                f"error={str(e)}"
            )

            raise

    def get_user_exports(
        self,
        user_id: UUID,
        include_expired: bool = False
    ) -> List[DataExport]:
        """
        Get all exports for a user

        Args:
            user_id: User ID
            include_expired: Include expired exports

        Returns:
            List of DataExport objects
        """
        query = self.db.query(DataExport).filter(
            DataExport.user_id == user_id
        )

        if not include_expired:
            query = query.filter(
                DataExport.expires_at > datetime.utcnow()
            )

        return query.order_by(DataExport.created_at.desc()).all()

    def cleanup_expired_exports(self) -> int:
        """
        Delete expired exports (run as scheduled job)

        Returns:
            Number of exports deleted
        """
        now = datetime.utcnow()

        expired = self.db.query(DataExport).filter(
            DataExport.expires_at < now,
            DataExport.status == 'completed'
        ).all()

        count = len(expired)

        for export in expired:
            # In production, delete S3 file here
            self.db.delete(export)

        self.db.commit()

        return count
