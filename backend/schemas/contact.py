"""
Pydantic schemas for contact form
"""

from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator


class ContactFormRequest(BaseModel):
    """Contact form submission request"""

    firstName: str = Field(..., min_length=2, max_length=50, description="First name")
    lastName: str = Field(..., min_length=2, max_length=50, description="Last name")
    email: EmailStr = Field(..., description="Email address")
    phone: Optional[str] = Field(None, min_length=7, max_length=20, description="Phone number")
    subject: str = Field(..., min_length=3, max_length=100, description="Subject")
    message: str = Field(..., min_length=10, max_length=2000, description="Message")
    inquiry: Optional[str] = Field("general", description="Inquiry type")

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        """Validate phone number format"""
        if v is None or v == '':
            return None

        # Remove spaces, hyphens, and plus signs for validation
        cleaned = v.replace(' ', '').replace('-', '').replace('+', '')

        # Check if remaining characters are digits
        if not cleaned.isdigit():
            raise ValueError('Phone number must contain only digits, spaces, +, or -')

        return v

    @field_validator('message', 'subject')
    @classmethod
    def validate_no_html(cls, v: str) -> str:
        """Prevent HTML injection in message and subject"""
        # Simple check for common HTML tags
        if '<' in v or '>' in v:
            raise ValueError('HTML tags are not allowed')
        return v


class ContactFormResponse(BaseModel):
    """Contact form submission response"""

    message: str = Field(..., description="Response message")
    success: bool = Field(..., description="Whether submission was successful")
