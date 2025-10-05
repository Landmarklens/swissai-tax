"""
Email service using EmailJS (SES replacement)
"""

import aiohttp
from config import settings


class EmailJSService:
    """Service for sending emails via EmailJS"""

    @staticmethod
    async def send_email(to_email: str, template_data: dict, template_id: str = None):
        """
        Send email via EmailJS API

        Args:
            to_email: Recipient email address
            template_data: Template variables
            template_id: EmailJS template ID

        Returns:
            dict: Response with status and status_code
        """
        # TODO: Implement actual EmailJS integration
        # For now, return a mock success response

        print(f"[EMAIL] Would send to {to_email} with data: {template_data}")

        return {
            "status": "success",
            "status_code": 200,
            "message": "Email sent successfully (mock)"
        }
