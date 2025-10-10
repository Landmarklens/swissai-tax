"""
Payment and Subscription Pydantic schemas
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class PaymentIntentCreate(BaseModel):
    """Create a Stripe payment intent"""
    plan_type: str = Field(..., pattern="^(basic|standard|premium)$")
    filing_id: Optional[str] = None


class PaymentIntentResponse(BaseModel):
    """Payment intent response"""
    client_secret: str
    payment_intent_id: str
    amount_chf: float


class SubscriptionCreate(BaseModel):
    """Create a new subscription"""
    plan_type: str = Field(..., pattern="^(free|basic|pro|premium|annual_flex|5_year_lock)$")
    payment_method_id: Optional[str] = None  # Can be None if using SetupIntent


class SetupIntentCreate(BaseModel):
    """Create a SetupIntent for collecting payment method"""
    plan_type: str = Field(..., pattern="^(basic|pro|premium|annual_flex|5_year_lock)$")


class SetupIntentResponse(BaseModel):
    """SetupIntent response"""
    client_secret: str
    setup_intent_id: str


class SubscriptionResponse(BaseModel):
    """Subscription details"""
    id: str
    plan_type: str
    status: str
    current_period_end: Optional[datetime] = None
    current_period_start: Optional[datetime] = None
    price_chf: float
    cancel_at_period_end: bool
    canceled_at: Optional[datetime] = None
    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None

    # Trial information
    trial_start: Optional[datetime] = None
    trial_end: Optional[datetime] = None
    is_in_trial: bool = False

    # Commitment information
    plan_commitment_years: int = 1
    commitment_start_date: Optional[datetime] = None
    commitment_end_date: Optional[datetime] = None
    is_committed: bool = False
    can_cancel_now: bool = True

    # Management requests
    pause_requested: bool = False
    switch_requested: bool = False
    cancellation_requested_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SubscriptionCancel(BaseModel):
    """Cancel subscription request"""
    reason: Optional[str] = Field(None, description="Cancellation reason")


class SubscriptionSwitch(BaseModel):
    """Switch subscription plan"""
    new_plan_type: str = Field(..., pattern="^(basic|pro|premium|annual_flex|5_year_lock)$")
    reason: Optional[str] = Field(None, description="Reason for switching")


class SubscriptionPause(BaseModel):
    """Pause subscription request"""
    reason: str = Field(..., description="Reason for pausing")
    resume_date: Optional[datetime] = Field(None, description="When to resume (None = indefinite)")


class PaymentResponse(BaseModel):
    """Payment record"""
    id: str
    amount_chf: float
    status: str
    payment_method: Optional[str] = None
    created_at: datetime
    paid_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class InvoiceResponse(BaseModel):
    """Invoice/receipt"""
    id: str
    amount_chf: float
    description: str
    status: str
    created_at: datetime
    pdf_url: Optional[str] = None
    payment_method: Optional[str] = None
    card_brand: Optional[str] = None
    card_last4: Optional[str] = None
