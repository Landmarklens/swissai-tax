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
    plan_type: str = Field(..., pattern="^(basic|standard|premium)$")
    payment_method_id: str


class SubscriptionResponse(BaseModel):
    """Subscription details"""
    id: str
    plan_type: str
    status: str
    current_period_end: datetime
    price_chf: float
    cancel_at_period_end: bool

    class Config:
        from_attributes = True


class SubscriptionCancel(BaseModel):
    """Cancel subscription request"""
    immediately: bool = Field(
        False,
        description="If true, cancel immediately. If false, cancel at period end"
    )


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
