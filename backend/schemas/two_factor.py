"""
Pydantic schemas for two-factor authentication
"""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class TwoFactorSetupInitResponse(BaseModel):
    """Response for 2FA setup initialization"""
    secret: str = Field(..., description="TOTP secret for manual entry")
    qr_code: str = Field(..., description="Base64-encoded QR code image")
    backup_codes: List[str] = Field(..., min_length=10, max_length=10, description="List of 10 backup recovery codes")


class TwoFactorSetupVerifyRequest(BaseModel):
    """Request to verify and enable 2FA"""
    code: str = Field(..., min_length=6, max_length=6, description="6-digit TOTP code")


class TwoFactorVerifyRequest(BaseModel):
    """Request to verify 2FA during login"""
    code: str = Field(..., min_length=4, max_length=10, description="6-digit TOTP code or backup code")
    temp_token: Optional[str] = Field(None, description="Temporary auth token from login")


class TwoFactorDisableRequest(BaseModel):
    """Request to disable 2FA"""
    password: str = Field(..., description="User password for confirmation")


class TwoFactorRegenerateCodesRequest(BaseModel):
    """Request to regenerate backup codes"""
    password: str = Field(..., description="User password for confirmation")


class TwoFactorRegenerateCodesResponse(BaseModel):
    """Response with new backup codes"""
    backup_codes: List[str] = Field(..., description="New list of backup recovery codes")


class TwoFactorStatusResponse(BaseModel):
    """Response with 2FA status"""
    enabled: bool = Field(..., description="Whether 2FA is enabled")
    verified_at: Optional[datetime] = Field(None, description="When 2FA was enabled")
    backup_codes_remaining: int = Field(0, description="Number of unused backup codes")


class TwoFactorMessageResponse(BaseModel):
    """Generic message response"""
    message: str = Field(..., description="Status message")
    success: bool = Field(True, description="Operation success status")
