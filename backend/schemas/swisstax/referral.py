"""
Pydantic schemas for referral system
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field, validator


# ============================================================================
# REFERRAL CODE SCHEMAS
# ============================================================================

class ReferralCodeBase(BaseModel):
    """Base schema for referral codes"""
    code: str = Field(..., min_length=1, max_length=50)
    code_type: str = Field(..., pattern="^(user_referral|promotional|partner)$")
    discount_type: str = Field(..., pattern="^(percentage|fixed_amount|trial_extension|account_credit)$")
    discount_value: Decimal = Field(..., gt=0)
    max_discount_amount: Optional[Decimal] = None
    applicable_plans: Optional[List[str]] = None
    first_time_only: bool = True
    minimum_subscription_months: int = 1
    max_total_uses: Optional[int] = None
    max_uses_per_user: int = 1
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    is_active: bool = True
    is_stackable: bool = False
    campaign_name: Optional[str] = None
    description: Optional[str] = None


class ReferralCodeCreate(ReferralCodeBase):
    """Schema for creating a promotional code"""
    owner_user_id: Optional[UUID] = None
    internal_notes: Optional[str] = None
    created_by_admin_id: Optional[UUID] = None


class ReferralCodeUpdate(BaseModel):
    """Schema for updating a referral code"""
    is_active: Optional[bool] = None
    max_total_uses: Optional[int] = None
    valid_until: Optional[datetime] = None
    description: Optional[str] = None
    internal_notes: Optional[str] = None


class ReferralCodeResponse(ReferralCodeBase):
    """Schema for referral code response"""
    id: UUID
    owner_user_id: Optional[UUID]
    current_usage_count: int
    created_at: datetime
    updated_at: datetime
    uses_remaining: Optional[int] = None
    is_valid: bool

    class Config:
        from_attributes = True


# ============================================================================
# DISCOUNT VALIDATION SCHEMAS
# ============================================================================

class DiscountCodeValidateRequest(BaseModel):
    """Schema for validating a discount code"""
    code: str = Field(..., min_length=1, max_length=50)
    plan_type: str = Field(..., pattern="^(basic|pro|premium)$")


class DiscountCodeValidateResponse(BaseModel):
    """Schema for discount code validation response"""
    valid: bool
    code: str
    discount_amount_chf: Optional[Decimal] = None
    original_price_chf: Optional[Decimal] = None
    final_price_chf: Optional[Decimal] = None
    discount_type: Optional[str] = None
    error_message: Optional[str] = None
    code_details: Optional[ReferralCodeResponse] = None


# ============================================================================
# REFERRAL USAGE SCHEMAS
# ============================================================================

class ReferralUsageCreate(BaseModel):
    """Schema for creating a referral usage record"""
    code: str
    user_id: UUID
    subscription_id: UUID
    discount_amount_chf: Decimal
    original_price_chf: Decimal
    final_price_chf: Decimal
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None


class ReferralUsageResponse(BaseModel):
    """Schema for referral usage response"""
    id: UUID
    code_used: str
    referred_user_id: UUID
    subscription_id: Optional[UUID]
    discount_amount_chf: Decimal
    original_price_chf: Decimal
    final_price_chf: Decimal
    discount_type: str
    status: str
    used_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


# ============================================================================
# REFERRAL REWARD SCHEMAS
# ============================================================================

class ReferralRewardResponse(BaseModel):
    """Schema for referral reward response"""
    id: UUID
    referrer_user_id: UUID
    referred_user_id: Optional[UUID]
    reward_type: str
    reward_amount_chf: Decimal
    status: str
    created_at: datetime
    approved_at: Optional[datetime]
    paid_at: Optional[datetime]
    expires_at: Optional[datetime]

    class Config:
        from_attributes = True


# ============================================================================
# REFERRAL STATISTICS SCHEMAS
# ============================================================================

class ReferralStatsResponse(BaseModel):
    """Schema for user referral statistics"""
    referral_code: Optional[str]
    total_referrals: int
    successful_referrals: int
    pending_referrals: int
    total_rewards_earned_chf: Decimal
    account_credit_balance_chf: Decimal
    pending_rewards_count: int
    approved_rewards_count: int
    recent_referrals: List[ReferralUsageResponse] = []


# ============================================================================
# ACCOUNT CREDIT SCHEMAS
# ============================================================================

class AccountCreditResponse(BaseModel):
    """Schema for account credit transaction"""
    id: UUID
    user_id: UUID
    amount_chf: Decimal
    transaction_type: str
    source_type: Optional[str]
    balance_before: Decimal
    balance_after: Decimal
    description: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class AccountCreditSummary(BaseModel):
    """Schema for account credit summary"""
    current_balance_chf: Decimal
    total_earned_chf: Decimal
    total_spent_chf: Decimal
    recent_transactions: List[AccountCreditResponse] = []


# ============================================================================
# SUBSCRIPTION WITH DISCOUNT SCHEMAS
# ============================================================================

class SubscriptionCreateWithDiscount(BaseModel):
    """Schema for creating subscription with discount code"""
    plan_type: str = Field(..., pattern="^(basic|pro|premium)$")
    payment_method_id: str
    referral_code: Optional[str] = None
    use_account_credits: bool = False


class SubscriptionDiscountInfo(BaseModel):
    """Schema for subscription discount information"""
    referral_code_used: Optional[str]
    discount_applied_chf: Decimal
    original_price_chf: Decimal
    account_credits_used_chf: Decimal
    final_amount_chf: Decimal
