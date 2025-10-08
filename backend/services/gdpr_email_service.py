"""
GDPR Email Service
Handles sending emails for data deletion and export using AWS SES with Jinja2 templates
"""

import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional

import boto3
from botocore.exceptions import ClientError
from jinja2 import Environment, FileSystemLoader, Template, TemplateNotFound

from config import settings

logger = logging.getLogger(__name__)


class GDPREmailService:
    """Service for sending GDPR-related emails (deletion, export) via AWS SES"""

    # Template directory (relative to backend/)
    TEMPLATE_DIR = Path(__file__).parent.parent / "templates" / "emails"

    # Language fallback order
    SUPPORTED_LANGUAGES = ['en', 'de', 'fr', 'it']
    DEFAULT_LANGUAGE = 'en'

    def __init__(self):
        """Initialize SES client and Jinja2 environment"""
        self.ses_client = None
        self._initialize_client()
        self._initialize_template_environment()

    def _initialize_client(self):
        """Initialize AWS SES client with credentials"""
        try:
            self.ses_client = boto3.client(
                'ses',
                region_name=settings.AWS_REGION,
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
            )
            logger.info(f"SES client initialized for GDPR emails in region: {settings.AWS_REGION}")
        except Exception as e:
            logger.error(f"Failed to initialize SES client: {str(e)}")
            self.ses_client = None

    def _initialize_template_environment(self):
        """Initialize Jinja2 template environment"""
        try:
            self.jinja_env = Environment(
                loader=FileSystemLoader(str(self.TEMPLATE_DIR)),
                autoescape=True
            )
            logger.info(f"Jinja2 environment initialized. Template directory: {self.TEMPLATE_DIR}")
        except Exception as e:
            logger.error(f"Failed to initialize Jinja2 environment: {str(e)}")
            self.jinja_env = None

    def _get_template(self, template_name: str, language: str) -> Optional[Template]:
        """
        Get template for specified language with fallback to English

        Args:
            template_name: Base template name (e.g., 'deletion_verification')
            language: Language code (en, de, fr, it)

        Returns:
            Jinja2 Template or None if not found
        """
        if not self.jinja_env:
            logger.error("Jinja2 environment not initialized")
            return None

        # Normalize language code
        lang = language.lower() if language else self.DEFAULT_LANGUAGE
        if lang not in self.SUPPORTED_LANGUAGES:
            lang = self.DEFAULT_LANGUAGE

        # Try requested language first
        template_file = f"{template_name}_{lang}.html"
        try:
            return self.jinja_env.get_template(template_file)
        except TemplateNotFound:
            logger.warning(f"Template {template_file} not found, falling back to English")
            # Fallback to English
            try:
                return self.jinja_env.get_template(f"{template_name}_en.html")
            except TemplateNotFound:
                logger.error(f"Template {template_name}_en.html not found")
                return None

    def _send_email(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: Optional[str] = None
    ) -> Dict:
        """
        Send email via AWS SES

        Args:
            to_email: Recipient email address
            subject: Email subject
            html_body: HTML email body
            text_body: Plain text email body (optional)

        Returns:
            dict: Response with status and message
        """
        if not self.ses_client:
            logger.error("SES client not initialized")
            return {
                "status": "error",
                "message": "Email service not configured"
            }

        # Get sender email from settings
        sender_email = getattr(settings, 'SES_SENDER_EMAIL', 'noreply@swissai.tax')

        # If no text body provided, create a simple one
        if not text_body:
            text_body = f"SwissAI Tax\n\n{subject}\n\nPlease view this email in an HTML-enabled email client."

        try:
            # Send email using SES
            response = self.ses_client.send_email(
                Source=sender_email,
                Destination={'ToAddresses': [to_email]},
                Message={
                    'Subject': {
                        'Data': subject,
                        'Charset': 'UTF-8'
                    },
                    'Body': {
                        'Text': {
                            'Data': text_body,
                            'Charset': 'UTF-8'
                        },
                        'Html': {
                            'Data': html_body,
                            'Charset': 'UTF-8'
                        }
                    }
                }
            )

            logger.info(f"Email sent to {to_email}. Subject: {subject}. MessageId: {response['MessageId']}")

            return {
                "status": "success",
                "message": "Email sent successfully",
                "message_id": response['MessageId']
            }

        except ClientError as e:
            error_code = e.response['Error']['Code']
            error_message = e.response['Error']['Message']
            logger.error(f"SES Error sending email to {to_email}: {error_code} - {error_message}")

            return {
                "status": "error",
                "message": f"Failed to send email: {error_code}"
            }
        except Exception as e:
            logger.error(f"Unexpected error sending email to {to_email}: {str(e)}")
            return {
                "status": "error",
                "message": "Failed to send email"
            }

    def send_deletion_verification_email(
        self,
        to_email: str,
        user_first_name: str,
        verification_code: str,
        language: str = 'en'
    ) -> Dict:
        """
        Send account deletion verification email with 6-digit code

        Args:
            to_email: Recipient email address
            user_first_name: User's first name
            verification_code: 6-digit verification code
            language: Language code (en, de, fr, it)

        Returns:
            dict: Response with status and message
        """
        template = self._get_template('deletion_verification', language)
        if not template:
            return {"status": "error", "message": "Template not found"}

        # Render template
        html_body = template.render(
            user_first_name=user_first_name,
            user_email=to_email,
            verification_code=verification_code
        )

        # Subject based on language
        subjects = {
            'en': 'Verify Account Deletion Request',
            'de': 'Kontolöschungsantrag Verifizieren',
            'fr': 'Vérifier la Demande de Suppression du Compte',
            'it': 'Verifica Richiesta di Eliminazione Account'
        }
        subject = subjects.get(language.lower(), subjects['en'])

        return self._send_email(to_email, subject, html_body)

    def send_deletion_scheduled_email(
        self,
        to_email: str,
        user_first_name: str,
        scheduled_deletion_date: str,
        days_until_deletion: int,
        cancellation_link: str,
        language: str = 'en'
    ) -> Dict:
        """
        Send email confirming deletion is scheduled with grace period

        Args:
            to_email: Recipient email address
            user_first_name: User's first name
            scheduled_deletion_date: Formatted date string
            days_until_deletion: Number of days until deletion
            cancellation_link: Link to cancel deletion
            language: Language code (en, de, fr, it)

        Returns:
            dict: Response with status and message
        """
        template = self._get_template('deletion_scheduled', language)
        if not template:
            return {"status": "error", "message": "Template not found"}

        # Render template
        html_body = template.render(
            user_first_name=user_first_name,
            scheduled_deletion_date=scheduled_deletion_date,
            days_until_deletion=days_until_deletion,
            cancellation_link=cancellation_link
        )

        # Subject based on language
        subjects = {
            'en': 'Account Deletion Scheduled',
            'de': 'Kontolöschung Geplant',
            'fr': 'Suppression du Compte Planifiée',
            'it': 'Eliminazione Account Pianificata'
        }
        subject = subjects.get(language.lower(), subjects['en'])

        return self._send_email(to_email, subject, html_body)

    def send_deletion_cancelled_email(
        self,
        to_email: str,
        user_first_name: str,
        user_email: str,
        language: str = 'en'
    ) -> Dict:
        """
        Send email confirming deletion request was cancelled

        Args:
            to_email: Recipient email address
            user_first_name: User's first name
            user_email: User's email (for display in email)
            language: Language code (en, de, fr, it)

        Returns:
            dict: Response with status and message
        """
        template = self._get_template('deletion_cancelled', language)
        if not template:
            return {"status": "error", "message": "Template not found"}

        # Render template
        html_body = template.render(
            user_first_name=user_first_name,
            user_email=user_email
        )

        # Subject based on language
        subjects = {
            'en': 'Account Deletion Cancelled',
            'de': 'Kontolöschung Abgebrochen',
            'fr': 'Suppression du Compte Annulée',
            'it': 'Eliminazione Account Annullata'
        }
        subject = subjects.get(language.lower(), subjects['en'])

        return self._send_email(to_email, subject, html_body)

    def send_deletion_completed_email(
        self,
        to_email: str,
        user_first_name: str,
        user_email: str,
        language: str = 'en'
    ) -> Dict:
        """
        Send final email confirming account has been deleted

        Args:
            to_email: Recipient email address
            user_first_name: User's first name
            user_email: User's email (for display in email)
            language: Language code (en, de, fr, it)

        Returns:
            dict: Response with status and message
        """
        template = self._get_template('deletion_completed', language)
        if not template:
            return {"status": "error", "message": "Template not found"}

        # Render template
        html_body = template.render(
            user_first_name=user_first_name,
            user_email=user_email
        )

        # Subject based on language
        subjects = {
            'en': 'Account Successfully Deleted',
            'de': 'Konto Erfolgreich Gelöscht',
            'fr': 'Compte Supprimé avec Succès',
            'it': 'Account Eliminato con Successo'
        }
        subject = subjects.get(language.lower(), subjects['en'])

        return self._send_email(to_email, subject, html_body)

    def send_export_ready_email(
        self,
        to_email: str,
        user_first_name: str,
        export_format: str,
        file_size_mb: float,
        generated_date: str,
        download_link: str,
        hours_until_expiry: int,
        expiry_date: str,
        language: str = 'en'
    ) -> Dict:
        """
        Send email when data export is ready for download

        Args:
            to_email: Recipient email address
            user_first_name: User's first name
            export_format: Format of export (JSON/CSV)
            file_size_mb: File size in MB
            generated_date: Formatted generation date string
            download_link: Presigned S3 download link
            hours_until_expiry: Hours until link expires
            expiry_date: Formatted expiry date string
            language: Language code (en, de, fr, it)

        Returns:
            dict: Response with status and message
        """
        template = self._get_template('export_ready', language)
        if not template:
            return {"status": "error", "message": "Template not found"}

        # Render template
        html_body = template.render(
            user_first_name=user_first_name,
            export_format=export_format.upper(),
            file_size_mb=file_size_mb,
            generated_date=generated_date,
            download_link=download_link,
            hours_until_expiry=hours_until_expiry,
            expiry_date=expiry_date
        )

        # Subject based on language
        subjects = {
            'en': 'Your Data Export is Ready',
            'de': 'Ihr Datenexport ist Bereit',
            'fr': 'Votre Export de Données est Prêt',
            'it': 'Il Tuo Export dei Dati è Pronto'
        }
        subject = subjects.get(language.lower(), subjects['en'])

        return self._send_email(to_email, subject, html_body)


# Singleton instance
_gdpr_email_service = None


def get_gdpr_email_service() -> GDPREmailService:
    """Get singleton instance of GDPR email service"""
    global _gdpr_email_service
    if _gdpr_email_service is None:
        _gdpr_email_service = GDPREmailService()
    return _gdpr_email_service
