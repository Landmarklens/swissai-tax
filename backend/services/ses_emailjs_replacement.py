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

    async def send_contact_form_email(self, form_data: dict) -> Dict:
        """
        Send contact form submission via SNS to contact@swissai.tax

        Uses SNS instead of direct SES because SES emails to the same domain
        in the same AWS account don't trigger receipt rules to WorkMail.

        Args:
            form_data: Dictionary containing form fields
                - firstName: User's first name
                - lastName: User's last name
                - email: User's email address
                - phone: User's phone number (optional)
                - subject: Subject line
                - message: Message content
                - inquiry: Inquiry type (optional)

        Returns:
            dict: Response with status and status_code
        """
        # Use SNS for contact form notifications
        try:
            sns_client = boto3.client(
                'sns',
                region_name=settings.AWS_REGION,
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
            )
        except Exception as e:
            logger.error(f"Failed to initialize SNS client: {str(e)}")
            return {
                "status": "error",
                "status_code": 500,
                "message": "Notification service not configured"
            }

        # SNS topic ARN for contact form notifications
        sns_topic_arn = 'arn:aws:sns:us-east-1:445567083171:SwissAITax-ContactForm-Notifications'

        # Extract form data
        first_name = form_data.get('firstName', '')
        last_name = form_data.get('lastName', '')
        user_email = form_data.get('email', '')
        phone = form_data.get('phone', 'Not provided')
        subject = form_data.get('subject', 'Contact Form Submission')
        message = form_data.get('message', '')
        inquiry_type = form_data.get('inquiry', 'general')

        # Get current timestamp
        from datetime import datetime
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")

        # Email subject for SNS
        email_subject = f"SwissAI Tax Contact Form: {subject}"

        # HTML email body
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #DC0018; color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 30px; background-color: #f9f9f9; }}
                .field {{ margin-bottom: 15px; }}
                .field-label {{ font-weight: bold; color: #555; }}
                .field-value {{ color: #333; margin-top: 5px; }}
                .message-box {{
                    background-color: white;
                    padding: 15px;
                    border-left: 4px solid #DC0018;
                    margin-top: 10px;
                }}
                .footer {{ padding: 20px; text-align: center; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>SwissAI Tax - Contact Form</h1>
                </div>
                <div class="content">
                    <h2>New Contact Form Submission</h2>

                    <div class="field">
                        <div class="field-label">Name:</div>
                        <div class="field-value">{first_name} {last_name}</div>
                    </div>

                    <div class="field">
                        <div class="field-label">Email:</div>
                        <div class="field-value"><a href="mailto:{user_email}">{user_email}</a></div>
                    </div>

                    <div class="field">
                        <div class="field-label">Phone:</div>
                        <div class="field-value">{phone}</div>
                    </div>

                    <div class="field">
                        <div class="field-label">Subject:</div>
                        <div class="field-value">{subject}</div>
                    </div>

                    <div class="field">
                        <div class="field-label">Inquiry Type:</div>
                        <div class="field-value">{inquiry_type}</div>
                    </div>

                    <div class="field">
                        <div class="field-label">Message:</div>
                        <div class="message-box">{message}</div>
                    </div>

                    <div class="field">
                        <div class="field-label">Submitted:</div>
                        <div class="field-value">{timestamp}</div>
                    </div>
                </div>
                <div class="footer">
                    <p>© 2024 SwissAI Tax. All rights reserved.</p>
                    <p>This is an automated notification from the contact form.</p>
                </div>
            </div>
        </body>
        </html>
        """

        # Plain text version
        text_body = f"""
        SwissAI Tax - Contact Form Submission

        Name: {first_name} {last_name}
        Email: {user_email}
        Phone: {phone}
        Subject: {subject}
        Inquiry Type: {inquiry_type}

        Message:
        {message}

        Submitted: {timestamp}

        © 2024 SwissAI Tax. All rights reserved.
        """

        try:
            # Publish to SNS topic (which emails contact@swissai.tax)
            # SNS messages arrive in WorkMail because they come from external AWS service
            response = sns_client.publish(
                TopicArn=sns_topic_arn,
                Subject=email_subject,
                Message=text_body
            )

            logger.info(f"Contact form notification published to SNS from {user_email}. MessageId: {response['MessageId']}")

            return {
                "status": "success",
                "status_code": 200,
                "message": "Contact form submitted successfully",
                "message_id": response['MessageId']
            }

        except ClientError as e:
            error_code = e.response['Error']['Code']
            error_message = e.response['Error']['Message']
            logger.error(f"SNS Error publishing contact form: {error_code} - {error_message}")

            return {
                "status": "error",
                "status_code": 500,
                "message": f"Failed to send notification: {error_code}"
            }
        except Exception as e:
            logger.error(f"Unexpected error publishing contact form to SNS: {str(e)}")
            return {
                "status": "error",
                "status_code": 500,
                "message": "Failed to send notification"
            }


# Maintain backward compatibility with EmailJSService name
EmailJSService = EmailService()
