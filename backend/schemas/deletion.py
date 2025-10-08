"""
Pydantic schemas for account deletion endpoints
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, UUID4


# Request schemas
class DeletionRequest(BaseModel):
    """Request to initiate account deletion"""
    pass  # No body needed, user identified from JWT


class DeletionVerification(BaseModel):
    """Verify deletion request with code"""
    code: str = Field(..., min_length=6, max_length=6, description="6-digit verification code")


class DeletionCancellation(BaseModel):
    """Cancel pending deletion"""
    token: str = Field(..., description="Cancellation token from email")


# Response schemas
class DeletionRequestResponse(BaseModel):
    """Response after initiating deletion"""
    request_id: UUID4
    message: str
    email_sent: bool
    expires_at: datetime

    class Config:
        from_attributes = True


class DeletionVerificationResponse(BaseModel):
    """Response after verifying deletion"""
    request_id: UUID4
    message: str
    scheduled_deletion_at: datetime
    grace_period_days: int

    class Config:
        from_attributes = True


class DeletionStatusResponse(BaseModel):
    """Current deletion request status"""
    has_pending_deletion: bool
    request_id: Optional[UUID4] = None
    status: Optional[str] = None
    scheduled_deletion_at: Optional[datetime] = None
    days_remaining: Optional[int] = None
    can_cancel: Optional[bool] = None

    class Config:
        from_attributes = True


class DeletionCancellationResponse(BaseModel):
    """Response after cancelling deletion"""
    message: str
    cancelled_at: datetime

    class Config:
        from_attributes = True
