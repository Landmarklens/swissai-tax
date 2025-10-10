# Referral & Discount Code System - Implementation Plan
**SwissAI Tax Platform**

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Database Schema Design](#database-schema-design)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Implementation](#frontend-implementation)
6. [Stripe Integration](#stripe-integration)
7. [Business Rules & Logic](#business-rules--logic)
8. [Security & Fraud Prevention](#security--fraud-prevention)
9. [Testing Strategy](#testing-strategy)
10. [Deployment Plan](#deployment-plan)
11. [Analytics & Monitoring](#analytics--monitoring)
12. [Timeline & Milestones](#timeline--milestones)

---

## Executive Summary

### Objective
Implement a comprehensive referral and discount code system that:
- Enables users to refer friends and earn rewards
- Supports promotional discount codes for marketing campaigns
- Integrates seamlessly with existing Stripe subscription system
- Provides anti-fraud protection and usage tracking
- Offers analytics for measuring program effectiveness

### Key Features
- **User Referrals**: Each user gets a unique referral code to share
- **Promotional Codes**: Admin-created codes for marketing campaigns
- **Flexible Discounts**: Percentage off, fixed amount, extended trials, or account credits
- **Reward System**: Referrers earn credits, discounts, or cash rewards
- **Fraud Prevention**: Multi-layered protection against abuse
- **Analytics Dashboard**: Track performance and ROI

### Success Metrics
- Referral conversion rate > 15%
- 30% of new subscriptions use referral/discount codes within 6 months
- Referred user retention rate >= organic user retention
- Average customer acquisition cost (CAC) reduction of 25%

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Subscription │  │   Referral   │  │    Admin     │      │
│  │   Checkout   │  │  Dashboard   │  │   Panel      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────────┬────────────────────────────────┘
                             │
                             │ REST API
                             │
┌────────────────────────────▼────────────────────────────────┐
│                   Backend (FastAPI)                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            Referral & Discount Services              │  │
│  │  • Code Generation    • Validation                   │  │
│  │  • Reward Calculation • Fraud Detection              │  │
│  └──────────────────────────────────────────────────────┘  │
│                             │                                │
│  ┌──────────────┐  ┌───────▼────────┐  ┌──────────────┐   │
│  │   Stripe     │  │   PostgreSQL   │  │   AWS SES    │   │
│  │   Service    │  │   (swisstax)   │  │   (Emails)   │   │
│  └──────────────┘  └────────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack
- **Database**: PostgreSQL (existing swisstax schema)
- **Backend**: Python 3.11+ with FastAPI
- **Payment Processing**: Stripe API with Coupons
- **Frontend**: React with Material-UI
- **Email**: AWS SES (existing)
- **Cache**: Redis (optional, for fraud detection)

---

## Database Schema Design

### 1. Referral Codes Table

```sql
-- swisstax.referral_codes
CREATE TABLE IF NOT EXISTS swisstax.referral_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Code Details
    code VARCHAR(50) UNIQUE NOT NULL,  -- e.g., 'SPRING2024' or 'USER-ABC123'
    code_type VARCHAR(20) NOT NULL CHECK (code_type IN ('user_referral', 'promotional', 'partner')),

    -- Ownership (null for promotional codes)
    owner_user_id UUID REFERENCES swisstax.users(id) ON DELETE SET NULL,

    -- Discount Configuration
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount', 'trial_extension', 'account_credit')),
    discount_value DECIMAL(10, 2) NOT NULL,  -- e.g., 20 (for 20% or CHF 20)
    max_discount_amount DECIMAL(10, 2),  -- Cap for percentage discounts

    -- Applicability
    applicable_plans JSONB,  -- ['basic', 'pro', 'premium'] or null for all
    first_time_only BOOLEAN DEFAULT TRUE,
    minimum_subscription_months INTEGER DEFAULT 1,

    -- Usage Limits
    max_total_uses INTEGER,  -- null = unlimited
    max_uses_per_user INTEGER DEFAULT 1,
    current_usage_count INTEGER DEFAULT 0,

    -- Validity Period
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP WITH TIME ZONE,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_stackable BOOLEAN DEFAULT FALSE,  -- Can be combined with other codes

    -- Metadata
    campaign_name VARCHAR(255),
    description TEXT,
    internal_notes TEXT,
    created_by_admin_id UUID,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Indexes
    CONSTRAINT valid_discount_value CHECK (discount_value > 0)
);

CREATE INDEX idx_referral_codes_code ON swisstax.referral_codes(code);
CREATE INDEX idx_referral_codes_owner ON swisstax.referral_codes(owner_user_id);
CREATE INDEX idx_referral_codes_active ON swisstax.referral_codes(is_active, valid_until);
CREATE INDEX idx_referral_codes_type ON swisstax.referral_codes(code_type);
```

### 2. Referral Usage/History Table

```sql
-- swisstax.referral_usages
CREATE TABLE IF NOT EXISTS swisstax.referral_usages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Code & User
    referral_code_id UUID REFERENCES swisstax.referral_codes(id) ON DELETE CASCADE,
    code_used VARCHAR(50) NOT NULL,  -- Denormalized for history
    referred_user_id UUID REFERENCES swisstax.users(id) ON DELETE SET NULL,

    -- Subscription Created
    subscription_id UUID REFERENCES swisstax.subscriptions(id) ON DELETE SET NULL,
    payment_id UUID REFERENCES swisstax.payments(id) ON DELETE SET NULL,

    -- Discount Applied
    discount_amount_chf DECIMAL(10, 2) NOT NULL,
    original_price_chf DECIMAL(10, 2) NOT NULL,
    final_price_chf DECIMAL(10, 2) NOT NULL,
    discount_type VARCHAR(20),

    -- Stripe Integration
    stripe_coupon_id VARCHAR(255),  -- If Stripe coupon was created
    stripe_promotion_code_id VARCHAR(255),

    -- Validation Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'refunded', 'fraud_suspected')),

    -- Fraud Detection
    ip_address INET,
    user_agent TEXT,
    device_fingerprint VARCHAR(255),
    fraud_score DECIMAL(3, 2) DEFAULT 0.0,  -- 0.0 to 1.0
    fraud_checks JSONB,  -- Store fraud check results

    -- Timestamps
    used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,  -- When subscription becomes eligible for reward

    -- Indexes
    CONSTRAINT valid_prices CHECK (final_price_chf >= 0 AND final_price_chf <= original_price_chf)
);

CREATE INDEX idx_referral_usages_code ON swisstax.referral_usages(referral_code_id);
CREATE INDEX idx_referral_usages_user ON swisstax.referral_usages(referred_user_id);
CREATE INDEX idx_referral_usages_status ON swisstax.referral_usages(status);
CREATE INDEX idx_referral_usages_date ON swisstax.referral_usages(used_at);
```

### 3. Referral Rewards Table

```sql
-- swisstax.referral_rewards
CREATE TABLE IF NOT EXISTS swisstax.referral_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Referrer (person who gets the reward)
    referrer_user_id UUID REFERENCES swisstax.users(id) ON DELETE CASCADE,

    -- Source
    referral_usage_id UUID REFERENCES swisstax.referral_usages(id) ON DELETE CASCADE,
    referred_user_id UUID REFERENCES swisstax.users(id) ON DELETE SET NULL,

    -- Reward Details
    reward_type VARCHAR(20) NOT NULL CHECK (reward_type IN ('account_credit', 'discount_coupon', 'cash_payout', 'extended_trial')),
    reward_amount_chf DECIMAL(10, 2) NOT NULL,

    -- Status & Processing
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected', 'expired')),
    approval_required BOOLEAN DEFAULT TRUE,
    approved_by_admin_id UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,

    -- Payout Details (for cash rewards)
    payout_method VARCHAR(50),  -- 'bank_transfer', 'paypal', etc.
    payout_reference VARCHAR(255),
    paid_at TIMESTAMP WITH TIME ZONE,

    -- Expiration (for credits/coupons)
    expires_at TIMESTAMP WITH TIME ZONE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_referral_rewards_referrer ON swisstax.referral_rewards(referrer_user_id);
CREATE INDEX idx_referral_rewards_status ON swisstax.referral_rewards(status);
CREATE INDEX idx_referral_rewards_date ON swisstax.referral_rewards(created_at);
```

### 4. User Account Credits Table

```sql
-- swisstax.user_account_credits
CREATE TABLE IF NOT EXISTS swisstax.user_account_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID REFERENCES swisstax.users(id) ON DELETE CASCADE,

    -- Credit Details
    amount_chf DECIMAL(10, 2) NOT NULL,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('earned', 'spent', 'expired', 'refunded', 'adjusted')),

    -- Source
    source_type VARCHAR(30) CHECK (source_type IN ('referral_reward', 'promotional', 'refund', 'admin_adjustment')),
    source_id UUID,  -- referral_reward_id, payment_id, etc.

    -- Balance Tracking
    balance_before DECIMAL(10, 2) NOT NULL,
    balance_after DECIMAL(10, 2) NOT NULL,

    -- Description
    description TEXT,

    -- Applied To (when spent)
    applied_to_subscription_id UUID REFERENCES swisstax.subscriptions(id),
    applied_to_payment_id UUID REFERENCES swisstax.payments(id),

    -- Expiration
    expires_at TIMESTAMP WITH TIME ZONE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_amount CHECK (amount_chf != 0)
);

CREATE INDEX idx_user_credits_user ON swisstax.user_account_credits(user_id, created_at);
CREATE INDEX idx_user_credits_type ON swisstax.user_account_credits(transaction_type);
```

### 5. Update Existing Users Table

```sql
-- Add referral-related columns to swisstax.users
ALTER TABLE swisstax.users ADD COLUMN IF NOT EXISTS personal_referral_code VARCHAR(50) UNIQUE;
ALTER TABLE swisstax.users ADD COLUMN IF NOT EXISTS total_referrals_count INTEGER DEFAULT 0;
ALTER TABLE swisstax.users ADD COLUMN IF NOT EXISTS successful_referrals_count INTEGER DEFAULT 0;
ALTER TABLE swisstax.users ADD COLUMN IF NOT EXISTS total_rewards_earned_chf DECIMAL(10, 2) DEFAULT 0.00;
ALTER TABLE swisstax.users ADD COLUMN IF NOT EXISTS account_credit_balance_chf DECIMAL(10, 2) DEFAULT 0.00;
ALTER TABLE swisstax.users ADD COLUMN IF NOT EXISTS referred_by_code VARCHAR(50);

CREATE INDEX idx_users_referral_code ON swisstax.users(personal_referral_code);
```

### 6. Update Existing Subscriptions Table

```sql
-- Add discount tracking to swisstax.subscriptions
ALTER TABLE swisstax.subscriptions ADD COLUMN IF NOT EXISTS referral_code_used VARCHAR(50);
ALTER TABLE swisstax.subscriptions ADD COLUMN IF NOT EXISTS discount_applied_chf DECIMAL(10, 2) DEFAULT 0.00;
ALTER TABLE swisstax.subscriptions ADD COLUMN IF NOT EXISTS original_price_chf DECIMAL(10, 2);
ALTER TABLE swisstax.subscriptions ADD COLUMN IF NOT EXISTS account_credits_used_chf DECIMAL(10, 2) DEFAULT 0.00;

CREATE INDEX idx_subscriptions_referral ON swisstax.subscriptions(referral_code_used);
```

---

## Backend Implementation

### Directory Structure

```
backend/
├── models/
│   └── swisstax/
│       ├── referral_code.py          # New
│       ├── referral_usage.py         # New
│       ├── referral_reward.py        # New
│       └── account_credit.py         # New
├── schemas/
│   └── swisstax/
│       ├── referral.py               # New - Pydantic schemas
│       └── discount.py               # New
├── services/
│   ├── referral_service.py           # New - Core referral logic
│   ├── discount_service.py           # New - Discount validation
│   ├── reward_service.py             # New - Reward calculation
│   ├── fraud_detection_service.py    # New - Anti-fraud
│   └── stripe_service.py             # Update - Add coupon support
├── routers/
│   └── swisstax/
│       ├── referrals.py              # New - Referral endpoints
│       ├── discounts.py              # New - Discount endpoints
│       └── subscription_new.py       # Update - Add discount logic
└── alembic/
    └── versions/
        └── add_referral_system.py    # New migration
```

### 1. Models

**backend/models/swisstax/referral_code.py**

```python
"""
Referral Code Model
"""
from datetime import datetime
from typing import Optional, List
from sqlalchemy import Column, String, Boolean, Integer, Numeric, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB, INET
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .base import Base, SwissTaxBase


class ReferralCode(SwissTaxBase, Base):
    """Referral and promotional discount codes"""
    __tablename__ = "referral_codes"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())

    # Code Details
    code = Column(String(50), unique=True, nullable=False, index=True)
    code_type = Column(String(20), nullable=False)  # user_referral, promotional, partner

    # Ownership
    owner_user_id = Column(UUID(as_uuid=True), ForeignKey('swisstax.users.id', ondelete='SET NULL'), index=True)

    # Discount Configuration
    discount_type = Column(String(20), nullable=False)  # percentage, fixed_amount, trial_extension, account_credit
    discount_value = Column(Numeric(10, 2), nullable=False)
    max_discount_amount = Column(Numeric(10, 2))

    # Applicability
    applicable_plans = Column(JSONB)  # ['basic', 'pro'] or null for all
    first_time_only = Column(Boolean, default=True)
    minimum_subscription_months = Column(Integer, default=1)

    # Usage Limits
    max_total_uses = Column(Integer)  # null = unlimited
    max_uses_per_user = Column(Integer, default=1)
    current_usage_count = Column(Integer, default=0)

    # Validity
    valid_from = Column(DateTime(timezone=True), server_default=func.now())
    valid_until = Column(DateTime(timezone=True))

    # Status
    is_active = Column(Boolean, default=True, index=True)
    is_stackable = Column(Boolean, default=False)

    # Metadata
    campaign_name = Column(String(255))
    description = Column(String)
    internal_notes = Column(String)
    created_by_admin_id = Column(UUID(as_uuid=True))

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    owner = relationship("User", foreign_keys=[owner_user_id])
    usages = relationship("ReferralUsage", back_populates="referral_code", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint('discount_value > 0', name='valid_discount_value'),
        CheckConstraint("code_type IN ('user_referral', 'promotional', 'partner')", name='valid_code_type'),
        CheckConstraint("discount_type IN ('percentage', 'fixed_amount', 'trial_extension', 'account_credit')", name='valid_discount_type'),
    )

    def __repr__(self):
        return f"<ReferralCode(code={self.code}, type={self.code_type})>"

    @property
    def is_valid(self) -> bool:
        """Check if code is currently valid"""
        now = datetime.utcnow()

        # Check active status
        if not self.is_active:
            return False

        # Check date validity
        if self.valid_from and now < self.valid_from:
            return False
        if self.valid_until and now > self.valid_until:
            return False

        # Check usage limits
        if self.max_total_uses and self.current_usage_count >= self.max_total_uses:
            return False

        return True

    @property
    def uses_remaining(self) -> Optional[int]:
        """Calculate remaining uses"""
        if self.max_total_uses is None:
            return None
        return max(0, self.max_total_uses - self.current_usage_count)
```

**backend/models/swisstax/referral_usage.py**

```python
"""
Referral Usage/History Model
"""
from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB, INET
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .base import Base, SwissTaxBase


class ReferralUsage(SwissTaxBase, Base):
    """Track when referral codes are used"""
    __tablename__ = "referral_usages"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())

    # Code & User
    referral_code_id = Column(UUID(as_uuid=True), ForeignKey('swisstax.referral_codes.id', ondelete='CASCADE'), index=True)
    code_used = Column(String(50), nullable=False)
    referred_user_id = Column(UUID(as_uuid=True), ForeignKey('swisstax.users.id', ondelete='SET NULL'), index=True)

    # Subscription Created
    subscription_id = Column(UUID(as_uuid=True), ForeignKey('swisstax.subscriptions.id', ondelete='SET NULL'))
    payment_id = Column(UUID(as_uuid=True), ForeignKey('swisstax.payments.id', ondelete='SET NULL'))

    # Discount Applied
    discount_amount_chf = Column(Numeric(10, 2), nullable=False)
    original_price_chf = Column(Numeric(10, 2), nullable=False)
    final_price_chf = Column(Numeric(10, 2), nullable=False)
    discount_type = Column(String(20))

    # Stripe Integration
    stripe_coupon_id = Column(String(255))
    stripe_promotion_code_id = Column(String(255))

    # Status
    status = Column(String(20), default='pending', index=True)

    # Fraud Detection
    ip_address = Column(INET)
    user_agent = Column(String)
    device_fingerprint = Column(String(255))
    fraud_score = Column(Numeric(3, 2), default=0.0)
    fraud_checks = Column(JSONB)

    # Timestamps
    used_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    completed_at = Column(DateTime(timezone=True))

    # Relationships
    referral_code = relationship("ReferralCode", back_populates="usages")
    referred_user = relationship("User", foreign_keys=[referred_user_id])
    subscription = relationship("Subscription")
    rewards = relationship("ReferralReward", back_populates="referral_usage")

    def __repr__(self):
        return f"<ReferralUsage(code={self.code_used}, user={self.referred_user_id})>"
```

**backend/models/swisstax/referral_reward.py**

```python
"""
Referral Reward Model
"""
from sqlalchemy import Column, String, Boolean, Numeric, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .base import Base, SwissTaxBase


class ReferralReward(SwissTaxBase, Base):
    """Rewards earned by referrers"""
    __tablename__ = "referral_rewards"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())

    # Referrer
    referrer_user_id = Column(UUID(as_uuid=True), ForeignKey('swisstax.users.id', ondelete='CASCADE'), index=True)

    # Source
    referral_usage_id = Column(UUID(as_uuid=True), ForeignKey('swisstax.referral_usages.id', ondelete='CASCADE'))
    referred_user_id = Column(UUID(as_uuid=True), ForeignKey('swisstax.users.id', ondelete='SET NULL'))

    # Reward Details
    reward_type = Column(String(20), nullable=False)
    reward_amount_chf = Column(Numeric(10, 2), nullable=False)

    # Status
    status = Column(String(20), default='pending', index=True)
    approval_required = Column(Boolean, default=True)
    approved_by_admin_id = Column(UUID(as_uuid=True))
    approved_at = Column(DateTime(timezone=True))
    rejection_reason = Column(String)

    # Payout
    payout_method = Column(String(50))
    payout_reference = Column(String(255))
    paid_at = Column(DateTime(timezone=True))

    # Expiration
    expires_at = Column(DateTime(timezone=True))

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    referrer = relationship("User", foreign_keys=[referrer_user_id])
    referral_usage = relationship("ReferralUsage", back_populates="rewards")

    def __repr__(self):
        return f"<ReferralReward(referrer={self.referrer_user_id}, amount={self.reward_amount_chf})>"
```

### 2. Services

**backend/services/referral_service.py**

```python
"""
Referral Service - Core referral business logic
"""
import logging
import secrets
import string
from typing import Optional, List, Dict, Tuple
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func

from models.swisstax.referral_code import ReferralCode
from models.swisstax.referral_usage import ReferralUsage
from models.swisstax.referral_reward import ReferralReward
from models.swisstax.user import User
from services.fraud_detection_service import FraudDetectionService

logger = logging.getLogger(__name__)


class ReferralService:
    """Service for managing referral codes and rewards"""

    def __init__(self, db: Session):
        self.db = db
        self.fraud_service = FraudDetectionService(db)

    # ============================================================================
    # CODE GENERATION
    # ============================================================================

    def generate_user_referral_code(self, user_id: str, custom_code: Optional[str] = None) -> ReferralCode:
        """
        Generate a unique referral code for a user

        Args:
            user_id: User UUID
            custom_code: Optional custom code (must be unique)

        Returns:
            ReferralCode object
        """
        # Check if user already has a code
        existing = self.db.query(ReferralCode).filter(
            ReferralCode.owner_user_id == user_id,
            ReferralCode.code_type == 'user_referral'
        ).first()

        if existing:
            logger.info(f"User {user_id} already has referral code: {existing.code}")
            return existing

        # Generate or validate custom code
        if custom_code:
            code = custom_code.upper()
            if not self._is_code_available(code):
                raise ValueError(f"Code '{code}' is already in use")
        else:
            code = self._generate_unique_code(prefix="REF")

        # Create referral code with default settings
        referral_code = ReferralCode(
            code=code,
            code_type='user_referral',
            owner_user_id=user_id,
            discount_type='percentage',
            discount_value=10.0,  # 10% off default
            first_time_only=True,
            max_total_uses=None,  # Unlimited
            max_uses_per_user=1,
            is_active=True
        )

        self.db.add(referral_code)
        self.db.commit()
        self.db.refresh(referral_code)

        # Update user record
        user = self.db.query(User).filter(User.id == user_id).first()
        if user:
            user.personal_referral_code = code
            self.db.commit()

        logger.info(f"Created referral code {code} for user {user_id}")
        return referral_code

    def create_promotional_code(
        self,
        code: str,
        discount_type: str,
        discount_value: float,
        campaign_name: str,
        admin_id: str,
        max_uses: Optional[int] = None,
        valid_until: Optional[datetime] = None,
        applicable_plans: Optional[List[str]] = None,
        **kwargs
    ) -> ReferralCode:
        """
        Create a promotional discount code

        Args:
            code: Discount code (e.g., 'SPRING2024')
            discount_type: 'percentage', 'fixed_amount', 'trial_extension', 'account_credit'
            discount_value: Discount amount
            campaign_name: Marketing campaign name
            admin_id: Admin user who created the code
            max_uses: Maximum total uses
            valid_until: Expiration date
            applicable_plans: List of plan types or None for all

        Returns:
            ReferralCode object
        """
        code = code.upper()

        if not self._is_code_available(code):
            raise ValueError(f"Code '{code}' is already in use")

        promo_code = ReferralCode(
            code=code,
            code_type='promotional',
            discount_type=discount_type,
            discount_value=discount_value,
            campaign_name=campaign_name,
            created_by_admin_id=admin_id,
            max_total_uses=max_uses,
            valid_until=valid_until,
            applicable_plans=applicable_plans,
            **kwargs
        )

        self.db.add(promo_code)
        self.db.commit()
        self.db.refresh(promo_code)

        logger.info(f"Created promotional code {code} for campaign '{campaign_name}'")
        return promo_code

    def _generate_unique_code(self, prefix: str = "REF", length: int = 8) -> str:
        """Generate a unique random code"""
        chars = string.ascii_uppercase + string.digits
        max_attempts = 100

        for _ in range(max_attempts):
            random_part = ''.join(secrets.choice(chars) for _ in range(length))
            code = f"{prefix}-{random_part}"

            if self._is_code_available(code):
                return code

        raise RuntimeError("Failed to generate unique code after maximum attempts")

    def _is_code_available(self, code: str) -> bool:
        """Check if code is available (not in use)"""
        existing = self.db.query(ReferralCode).filter(
            func.upper(ReferralCode.code) == code.upper()
        ).first()
        return existing is None

    # ============================================================================
    # CODE VALIDATION
    # ============================================================================

    def validate_code(
        self,
        code: str,
        user_id: str,
        plan_type: str,
        request_metadata: Dict
    ) -> Tuple[bool, Optional[ReferralCode], Optional[str]]:
        """
        Validate if a referral/discount code can be used

        Args:
            code: The code to validate
            user_id: User attempting to use the code
            plan_type: Subscription plan type
            request_metadata: IP, user_agent, etc. for fraud detection

        Returns:
            Tuple of (is_valid, referral_code, error_message)
        """
        # Find code
        referral_code = self.db.query(ReferralCode).filter(
            func.upper(ReferralCode.code) == code.upper()
        ).first()

        if not referral_code:
            return False, None, "Invalid code"

        # Check if code is valid (active, not expired, has uses remaining)
        if not referral_code.is_valid:
            if not referral_code.is_active:
                return False, referral_code, "This code is no longer active"
            if referral_code.valid_until and datetime.now(timezone.utc) > referral_code.valid_until:
                return False, referral_code, "This code has expired"
            if referral_code.uses_remaining == 0:
                return False, referral_code, "This code has reached its usage limit"
            return False, referral_code, "This code is not currently valid"

        # Check self-referral
        if referral_code.code_type == 'user_referral' and referral_code.owner_user_id == user_id:
            return False, referral_code, "You cannot use your own referral code"

        # Check plan applicability
        if referral_code.applicable_plans and plan_type not in referral_code.applicable_plans:
            return False, referral_code, f"This code is not valid for the {plan_type} plan"

        # Check first-time user restriction
        if referral_code.first_time_only:
            existing_subs = self._user_has_subscription(user_id)
            if existing_subs:
                return False, referral_code, "This code is only valid for first-time subscribers"

        # Check per-user usage limit
        user_usage_count = self.db.query(ReferralUsage).filter(
            ReferralUsage.referral_code_id == referral_code.id,
            ReferralUsage.referred_user_id == user_id
        ).count()

        if referral_code.max_uses_per_user and user_usage_count >= referral_code.max_uses_per_user:
            return False, referral_code, "You have already used this code the maximum number of times"

        # Fraud detection
        fraud_result = self.fraud_service.check_referral_fraud(
            code=code,
            user_id=user_id,
            referral_code=referral_code,
            request_metadata=request_metadata
        )

        if fraud_result['is_suspicious']:
            logger.warning(f"Fraud suspected for code {code} by user {user_id}: {fraud_result['reason']}")
            return False, referral_code, "Unable to validate code at this time. Please contact support."

        return True, referral_code, None

    def _user_has_subscription(self, user_id: str) -> bool:
        """Check if user has ever had a subscription"""
        from models.swisstax.subscription import Subscription
        count = self.db.query(Subscription).filter(
            Subscription.user_id == user_id
        ).count()
        return count > 0

    # ============================================================================
    # USAGE TRACKING
    # ============================================================================

    def record_code_usage(
        self,
        code: str,
        user_id: str,
        subscription_id: str,
        discount_applied: float,
        original_price: float,
        final_price: float,
        request_metadata: Dict,
        stripe_coupon_id: Optional[str] = None
    ) -> ReferralUsage:
        """
        Record that a referral code was used

        Args:
            code: The code used
            user_id: User who used the code
            subscription_id: Subscription created
            discount_applied: Discount amount in CHF
            original_price: Original subscription price
            final_price: Final price after discount
            request_metadata: Request info for fraud tracking
            stripe_coupon_id: Stripe coupon ID if applicable

        Returns:
            ReferralUsage object
        """
        referral_code = self.db.query(ReferralCode).filter(
            func.upper(ReferralCode.code) == code.upper()
        ).first()

        if not referral_code:
            raise ValueError(f"Referral code {code} not found")

        # Create usage record
        usage = ReferralUsage(
            referral_code_id=referral_code.id,
            code_used=code.upper(),
            referred_user_id=user_id,
            subscription_id=subscription_id,
            discount_amount_chf=discount_applied,
            original_price_chf=original_price,
            final_price_chf=final_price,
            discount_type=referral_code.discount_type,
            stripe_coupon_id=stripe_coupon_id,
            ip_address=request_metadata.get('ip_address'),
            user_agent=request_metadata.get('user_agent'),
            device_fingerprint=request_metadata.get('device_fingerprint'),
            fraud_score=request_metadata.get('fraud_score', 0.0),
            fraud_checks=request_metadata.get('fraud_checks'),
            status='pending'
        )

        self.db.add(usage)

        # Increment code usage count
        referral_code.current_usage_count += 1

        # Update user stats
        user = self.db.query(User).filter(User.id == user_id).first()
        if user:
            user.referred_by_code = code.upper()

        # Update referrer stats if this is a user referral
        if referral_code.code_type == 'user_referral' and referral_code.owner_user_id:
            owner = self.db.query(User).filter(User.id == referral_code.owner_user_id).first()
            if owner:
                owner.total_referrals_count += 1

        self.db.commit()
        self.db.refresh(usage)

        logger.info(f"Recorded usage of code {code} by user {user_id}")
        return usage

    # ============================================================================
    # REWARD MANAGEMENT
    # ============================================================================

    def calculate_and_create_reward(
        self,
        referral_usage_id: str
    ) -> Optional[ReferralReward]:
        """
        Calculate and create reward for a referral
        Called after subscription is confirmed (e.g., after trial or first payment)

        Args:
            referral_usage_id: The referral usage to reward

        Returns:
            ReferralReward object or None if not applicable
        """
        usage = self.db.query(ReferralUsage).filter(
            ReferralUsage.id == referral_usage_id
        ).first()

        if not usage:
            raise ValueError(f"Referral usage {referral_usage_id} not found")

        # Only reward user referrals, not promotional codes
        if usage.referral_code.code_type != 'user_referral':
            return None

        referrer_id = usage.referral_code.owner_user_id
        if not referrer_id:
            return None

        # Calculate reward (e.g., 10% of first payment, or fixed CHF 10)
        reward_amount = self._calculate_reward_amount(usage)

        # Create reward
        reward = ReferralReward(
            referrer_user_id=referrer_id,
            referral_usage_id=usage.id,
            referred_user_id=usage.referred_user_id,
            reward_type='account_credit',  # Default to account credit
            reward_amount_chf=reward_amount,
            status='pending',
            approval_required=False  # Auto-approve for now
        )

        self.db.add(reward)

        # Update referrer stats
        referrer = self.db.query(User).filter(User.id == referrer_id).first()
        if referrer:
            referrer.successful_referrals_count += 1

        # Mark usage as completed
        usage.status = 'completed'
        usage.completed_at = datetime.now(timezone.utc)

        self.db.commit()
        self.db.refresh(reward)

        # Auto-approve if applicable
        if not reward.approval_required:
            self._approve_reward(reward.id)

        logger.info(f"Created reward {reward.id} for referrer {referrer_id}: CHF {reward_amount}")
        return reward

    def _calculate_reward_amount(self, usage: ReferralUsage) -> float:
        """
        Calculate reward amount based on referral usage

        Business rules:
        - CHF 10 flat reward per successful referral
        - OR 10% of first payment (whichever is less)
        """
        flat_reward = 10.0
        percentage_reward = float(usage.final_price_chf) * 0.10

        return min(flat_reward, percentage_reward)

    def _approve_reward(self, reward_id: str) -> ReferralReward:
        """Approve a reward and credit the referrer's account"""
        reward = self.db.query(ReferralReward).filter(
            ReferralReward.id == reward_id
        ).first()

        if not reward:
            raise ValueError(f"Reward {reward_id} not found")

        # Update reward status
        reward.status = 'approved'
        reward.approved_at = datetime.now(timezone.utc)

        # Credit referrer's account
        from models.swisstax.account_credit import UserAccountCredit

        referrer = self.db.query(User).filter(User.id == reward.referrer_user_id).first()
        if not referrer:
            raise ValueError(f"Referrer {reward.referrer_user_id} not found")

        # Create credit transaction
        credit = UserAccountCredit(
            user_id=referrer.id,
            amount_chf=reward.reward_amount_chf,
            transaction_type='earned',
            source_type='referral_reward',
            source_id=reward.id,
            balance_before=referrer.account_credit_balance_chf,
            balance_after=referrer.account_credit_balance_chf + reward.reward_amount_chf,
            description=f"Referral reward for code {reward.referral_usage.code_used}"
        )

        self.db.add(credit)

        # Update user balance
        referrer.account_credit_balance_chf += reward.reward_amount_chf
        referrer.total_rewards_earned_chf += reward.reward_amount_chf

        self.db.commit()

        logger.info(f"Approved reward {reward_id}, credited CHF {reward.reward_amount_chf} to user {referrer.id}")
        return reward

    # ============================================================================
    # STATISTICS & REPORTING
    # ============================================================================

    def get_user_referral_stats(self, user_id: str) -> Dict:
        """Get referral statistics for a user"""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError(f"User {user_id} not found")

        # Get user's referral code
        referral_code = self.db.query(ReferralCode).filter(
            ReferralCode.owner_user_id == user_id,
            ReferralCode.code_type == 'user_referral'
        ).first()

        # Get pending and approved rewards
        rewards_query = self.db.query(ReferralReward).filter(
            ReferralReward.referrer_user_id == user_id
        )

        pending_rewards = rewards_query.filter(ReferralReward.status == 'pending').count()
        approved_rewards = rewards_query.filter(ReferralReward.status == 'approved').count()

        return {
            'referral_code': referral_code.code if referral_code else None,
            'total_referrals': user.total_referrals_count,
            'successful_referrals': user.successful_referrals_count,
            'pending_referrals': user.total_referrals_count - user.successful_referrals_count,
            'total_rewards_earned_chf': float(user.total_rewards_earned_chf),
            'account_credit_balance_chf': float(user.account_credit_balance_chf),
            'pending_rewards_count': pending_rewards,
            'approved_rewards_count': approved_rewards
        }
```

**backend/services/discount_service.py**

```python
"""
Discount Service - Calculate and apply discounts
"""
import logging
from typing import Dict, Optional
from decimal import Decimal
from sqlalchemy.orm import Session

from models.swisstax.referral_code import ReferralCode

logger = logging.getLogger(__name__)


class DiscountService:
    """Service for calculating discount amounts"""

    # Base plan prices in CHF
    PLAN_PRICES = {
        'basic': Decimal('49.00'),
        'pro': Decimal('99.00'),
        'premium': Decimal('149.00')
    }

    def __init__(self, db: Session):
        self.db = db

    def calculate_discount(
        self,
        referral_code: ReferralCode,
        plan_type: str,
        original_price: Optional[Decimal] = None
    ) -> Dict:
        """
        Calculate discount amount for a given code and plan

        Args:
            referral_code: The referral code being applied
            plan_type: Subscription plan type
            original_price: Original price (if not standard)

        Returns:
            Dict with discount_amount_chf, final_price_chf, discount_type
        """
        # Get original price
        if original_price is None:
            original_price = self.PLAN_PRICES.get(plan_type)
            if original_price is None:
                raise ValueError(f"Unknown plan type: {plan_type}")

        discount_amount = Decimal('0.00')
        discount_type = referral_code.discount_type

        if discount_type == 'percentage':
            # Calculate percentage discount
            percentage = Decimal(str(referral_code.discount_value)) / Decimal('100')
            discount_amount = original_price * percentage

            # Apply max discount cap if set
            if referral_code.max_discount_amount:
                max_discount = Decimal(str(referral_code.max_discount_amount))
                discount_amount = min(discount_amount, max_discount)

        elif discount_type == 'fixed_amount':
            # Fixed amount discount
            discount_amount = Decimal(str(referral_code.discount_value))

            # Don't discount more than the price
            discount_amount = min(discount_amount, original_price)

        elif discount_type == 'trial_extension':
            # Trial extension doesn't affect price
            discount_amount = Decimal('0.00')

        elif discount_type == 'account_credit':
            # Account credit doesn't affect subscription price
            discount_amount = Decimal('0.00')

        else:
            raise ValueError(f"Unknown discount type: {discount_type}")

        # Calculate final price
        final_price = max(Decimal('0.00'), original_price - discount_amount)

        return {
            'discount_amount_chf': float(discount_amount),
            'original_price_chf': float(original_price),
            'final_price_chf': float(final_price),
            'discount_type': discount_type,
            'discount_value': float(referral_code.discount_value)
        }

    def apply_account_credits(
        self,
        user_id: str,
        amount_due: Decimal,
        subscription_id: str
    ) -> Dict:
        """
        Apply user's account credits to a subscription payment

        Args:
            user_id: User UUID
            amount_due: Amount to be paid
            subscription_id: Subscription being paid for

        Returns:
            Dict with credits_applied, final_amount, remaining_balance
        """
        from models.swisstax.user import User
        from models.swisstax.account_credit import UserAccountCredit

        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError(f"User {user_id} not found")

        available_credits = Decimal(str(user.account_credit_balance_chf))

        if available_credits <= 0:
            return {
                'credits_applied_chf': 0.00,
                'final_amount_chf': float(amount_due),
                'remaining_balance_chf': 0.00
            }

        # Calculate how much credit to apply
        credits_to_apply = min(available_credits, amount_due)
        final_amount = amount_due - credits_to_apply
        remaining_balance = available_credits - credits_to_apply

        # Create credit transaction
        credit_tx = UserAccountCredit(
            user_id=user_id,
            amount_chf=-credits_to_apply,  # Negative for spending
            transaction_type='spent',
            source_type='subscription_payment',
            balance_before=available_credits,
            balance_after=remaining_balance,
            applied_to_subscription_id=subscription_id,
            description=f"Applied to subscription {subscription_id}"
        )

        self.db.add(credit_tx)

        # Update user balance
        user.account_credit_balance_chf = remaining_balance

        self.db.commit()

        logger.info(f"Applied CHF {credits_to_apply} credits for user {user_id}")

        return {
            'credits_applied_chf': float(credits_to_apply),
            'final_amount_chf': float(final_amount),
            'remaining_balance_chf': float(remaining_balance)
        }
```

**(Continuing in next message due to length...)**

Would you like me to continue with:
1. Fraud Detection Service
2. API Routers/Endpoints
3. Frontend Implementation
4. Stripe Integration Details
5. Testing Strategy
6. Deployment Steps

Let me know which sections you'd like me to expand on next!
