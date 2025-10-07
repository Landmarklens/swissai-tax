"""
Email service using AWS SES
"""

import logging
from typing import Dict

import boto3
from botocore.exceptions import ClientError

from config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending emails via AWS SES"""

    def __init__(self):
        """Initialize SES client"""
        self.ses_client = None
        self._initialize_client()

    def _initialize_client(self):
        """Initialize AWS SES client with credentials"""
        try:
            # Use credentials from settings (loaded from Parameter Store or env)
            self.ses_client = boto3.client(
                'ses',
                region_name=settings.AWS_REGION,
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
            )
            logger.info(f"SES client initialized for region: {settings.AWS_REGION}")
        except Exception as e:
            logger.error(f"Failed to initialize SES client: {str(e)}")
            self.ses_client = None

    async def send_password_reset_email(self, to_email: str, reset_link: str) -> Dict:
        """
        Send password reset email using SES

        Args:
            to_email: Recipient email address
            reset_link: Password reset link with token

        Returns:
            dict: Response with status and status_code
        """
        if not self.ses_client:
            logger.error("SES client not initialized")
            return {
                "status": "error",
                "status_code": 500,
                "message": "Email service not configured"
            }

        # Get sender email from settings
        sender_email = getattr(settings, 'SES_SENDER_EMAIL', 'noreply@swissai.tax')

        # Email subject and body
        subject = "Reset Your SwissAI Tax Password"

        # HTML email body
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #1976d2; color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 30px; background-color: #f9f9f9; }}
                .button {{
                    display: inline-block;
                    padding: 12px 30px;
                    background-color: #1976d2;
                    color: white;
                    text-decoration: none;
                    border-radius: 5px;
                    margin: 20px 0;
                }}
                .footer {{ padding: 20px; text-align: center; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>SwissAI Tax</h1>
                </div>
                <div class="content">
                    <h2>Password Reset Request</h2>
                    <p>You recently requested to reset your password for your SwissAI Tax account.</p>
                    <p>Click the button below to reset your password. This link will expire in 1 hour.</p>
                    <p style="text-align: center;">
                        <a href="{reset_link}" class="button">Reset Password</a>
                    </p>
                    <p>If the button doesn't work, copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #1976d2;">{reset_link}</p>
                    <p><strong>If you didn't request a password reset, please ignore this email.</strong></p>
                </div>
                <div class="footer">
                    <p>© 2024 SwissAI Tax. All rights reserved.</p>
                    <p>This is an automated email. Please do not reply.</p>
                </div>
            </div>
        </body>
        </html>
        """

        # Plain text version for email clients that don't support HTML
        text_body = f"""
        SwissAI Tax - Password Reset Request

        You recently requested to reset your password for your SwissAI Tax account.

        Click the link below to reset your password. This link will expire in 1 hour.

        {reset_link}

        If you didn't request a password reset, please ignore this email.

        © 2024 SwissAI Tax. All rights reserved.
        This is an automated email. Please do not reply.
        """

        try:
            # Send email using SES
            response = self.ses_client.send_email(
                Source=sender_email,
                Destination={
                    'ToAddresses': [to_email]
                },
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

            logger.info(f"Password reset email sent to {to_email}. MessageId: {response['MessageId']}")

            return {
                "status": "success",
                "status_code": 200,
                "message": "Email sent successfully",
                "message_id": response['MessageId']
            }

        except ClientError as e:
            error_code = e.response['Error']['Code']
            error_message = e.response['Error']['Message']
            logger.error(f"SES Error sending email to {to_email}: {error_code} - {error_message}")

            return {
                "status": "error",
                "status_code": 500,
                "message": f"Failed to send email: {error_code}"
            }
        except Exception as e:
            logger.error(f"Unexpected error sending email to {to_email}: {str(e)}")
            return {
                "status": "error",
                "status_code": 500,
                "message": "Failed to send email"
            }

    async def send_email(self, to_email: str, template_data: dict, template_id: str = None):
        """
        Generic send email method for backward compatibility

        Args:
            to_email: Recipient email address
            template_data: Template variables (expects 'link' key for password reset)
            template_id: Template ID (not used in SES implementation)

        Returns:
            dict: Response with status and status_code
        """
        # Extract reset link from template data
        reset_link = template_data.get('link')

        if not reset_link:
            logger.error("No reset link provided in template_data")
            return {
                "status": "error",
                "status_code": 400,
                "message": "Missing reset link in template data"
            }

        return await self.send_password_reset_email(to_email, reset_link)


# Maintain backward compatibility with EmailJSService name
EmailJSService = EmailService()
