"""
Password reset token schemas
"""

from pydantic import BaseModel, EmailStr


class ResetPasswordRequest(BaseModel):
    """Request to reset password"""
    email: EmailStr


class ResetPasswordVerify(BaseModel):
    """Verify reset token"""
    token: str


class ResetPasswordConfirm(BaseModel):
    """Confirm password reset with new password"""
    token: str
    new_password: str


class ResetPasswordMessageResponse(BaseModel):
    """Simple message response"""
    message: str


class ResetPasswordResponse(BaseModel):
    """Password reset response"""
    status: str
    status_code: int
    message: str
