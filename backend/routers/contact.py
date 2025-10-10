"""
Contact form router
Handles contact form submissions and sends emails to contact@swissai.tax
"""

import logging
from datetime import datetime, timedelta
from typing import Dict
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse

from schemas.contact import ContactFormRequest, ContactFormResponse
from services.ses_emailjs_replacement import EmailService

logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize email service
email_service = EmailService()

# Simple in-memory rate limiting
# Maps IP address to list of submission timestamps
rate_limit_store: Dict[str, list] = {}


def check_rate_limit(ip_address: str, max_requests: int = 3, window_minutes: int = 60) -> bool:
    """
    Check if IP address has exceeded rate limit

    Args:
        ip_address: Client IP address
        max_requests: Maximum number of requests allowed
        window_minutes: Time window in minutes

    Returns:
        bool: True if within limit, False if exceeded
    """
    current_time = datetime.now()
    cutoff_time = current_time - timedelta(minutes=window_minutes)

    # Clean up old entries for this IP
    if ip_address in rate_limit_store:
        rate_limit_store[ip_address] = [
            timestamp for timestamp in rate_limit_store[ip_address]
            if timestamp > cutoff_time
        ]

    # Check current count
    request_count = len(rate_limit_store.get(ip_address, []))

    if request_count >= max_requests:
        logger.warning(f"Rate limit exceeded for IP: {ip_address}")
        return False

    # Add current request timestamp
    if ip_address not in rate_limit_store:
        rate_limit_store[ip_address] = []

    rate_limit_store[ip_address].append(current_time)

    return True


@router.post("/api/contact", response_model=ContactFormResponse)
async def submit_contact_form(
    contact_form: ContactFormRequest,
    request: Request
):
    """
    Handle contact form submission

    Args:
        contact_form: Contact form data (validated by Pydantic)
        request: FastAPI request object (to get client IP)

    Returns:
        ContactFormResponse: Success or error response

    Raises:
        HTTPException: 429 if rate limit exceeded, 500 if email sending fails
    """
    # Get client IP for rate limiting
    client_ip = request.client.host if request.client else "unknown"

    # Check rate limit (3 submissions per hour per IP)
    if not check_rate_limit(client_ip, max_requests=3, window_minutes=60):
        raise HTTPException(
            status_code=429,
            detail="Too many requests. Please wait a moment and try again."
        )

    # Convert Pydantic model to dict for email service
    form_data = contact_form.model_dump()

    logger.info(f"Processing contact form from {form_data.get('email')} (IP: {client_ip})")

    # Send email using SES
    try:
        result = await email_service.send_contact_form_email(form_data)

        if result.get("status") == "success":
            logger.info(f"Contact form email sent successfully. MessageId: {result.get('message_id')}")
            return ContactFormResponse(
                message="Thank you for your message! We'll get back to you soon.",
                success=True
            )
        else:
            error_message = result.get("message", "Unknown error")
            logger.error(f"Failed to send contact form email: {error_message}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to send message: {error_message}"
            )

    except HTTPException:
        # Re-raise HTTP exceptions
        raise

    except Exception as e:
        logger.error(f"Unexpected error processing contact form: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An error occurred while processing your request. Please try again later."
        )


# Cleanup old rate limit entries periodically
# This prevents the rate_limit_store from growing indefinitely
def cleanup_rate_limit_store():
    """Remove entries older than 2 hours from rate limit store"""
    cutoff_time = datetime.now() - timedelta(hours=2)

    for ip_address in list(rate_limit_store.keys()):
        rate_limit_store[ip_address] = [
            timestamp for timestamp in rate_limit_store[ip_address]
            if timestamp > cutoff_time
        ]

        # Remove IP entirely if no recent requests
        if not rate_limit_store[ip_address]:
            del rate_limit_store[ip_address]


# Note: In production, consider using Redis or similar for rate limiting
# to support multiple server instances
