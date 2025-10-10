"""add referral system

Revision ID: 20251011_referral
Revises: 20251010_add_subscription_commitment_fields
Create Date: 2025-10-11 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20251011_referral'
down_revision = '20251011_015019'
branch_labels = None
depends_on = None


def upgrade():
    """
    Create referral system tables - IDEMPOTENT
    """

    # Create referral_codes table
    op.execute("""
        CREATE TABLE IF NOT EXISTS swisstax.referral_codes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

            -- Code Details
            code VARCHAR(50) UNIQUE NOT NULL,
            code_type VARCHAR(20) NOT NULL CHECK (code_type IN ('user_referral', 'promotional', 'partner')),

            -- Ownership (null for promotional codes)
            owner_user_id UUID REFERENCES swisstax.users(id) ON DELETE SET NULL,

            -- Discount Configuration
            discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount', 'trial_extension', 'account_credit')),
            discount_value DECIMAL(10, 2) NOT NULL,
            max_discount_amount DECIMAL(10, 2),

            -- Applicability
            applicable_plans JSONB,
            first_time_only BOOLEAN DEFAULT TRUE,
            minimum_subscription_months INTEGER DEFAULT 1,

            -- Usage Limits
            max_total_uses INTEGER,
            max_uses_per_user INTEGER DEFAULT 1,
            current_usage_count INTEGER DEFAULT 0,

            -- Validity Period
            valid_from TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            valid_until TIMESTAMP WITH TIME ZONE,

            -- Status
            is_active BOOLEAN DEFAULT TRUE,
            is_stackable BOOLEAN DEFAULT FALSE,

            -- Metadata
            campaign_name VARCHAR(255),
            description TEXT,
            internal_notes TEXT,
            created_by_admin_id UUID,

            -- Timestamps
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

            CONSTRAINT valid_discount_value CHECK (discount_value > 0)
        );
    """)

    # Create indexes for referral_codes
    op.execute("CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON swisstax.referral_codes(code);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_referral_codes_owner ON swisstax.referral_codes(owner_user_id);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_referral_codes_active ON swisstax.referral_codes(is_active, valid_until);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_referral_codes_type ON swisstax.referral_codes(code_type);")

    # Create referral_usages table
    op.execute("""
        CREATE TABLE IF NOT EXISTS swisstax.referral_usages (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

            -- Code & User
            referral_code_id UUID REFERENCES swisstax.referral_codes(id) ON DELETE CASCADE,
            code_used VARCHAR(50) NOT NULL,
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
            stripe_coupon_id VARCHAR(255),
            stripe_promotion_code_id VARCHAR(255),

            -- Validation Status
            status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'refunded', 'fraud_suspected')),

            -- Fraud Detection
            ip_address INET,
            user_agent TEXT,
            device_fingerprint VARCHAR(255),
            fraud_score DECIMAL(3, 2) DEFAULT 0.0,
            fraud_checks JSONB,

            -- Timestamps
            used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMP WITH TIME ZONE,

            CONSTRAINT valid_prices CHECK (final_price_chf >= 0 AND final_price_chf <= original_price_chf)
        );
    """)

    # Create indexes for referral_usages
    op.execute("CREATE INDEX IF NOT EXISTS idx_referral_usages_code ON swisstax.referral_usages(referral_code_id);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_referral_usages_user ON swisstax.referral_usages(referred_user_id);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_referral_usages_status ON swisstax.referral_usages(status);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_referral_usages_date ON swisstax.referral_usages(used_at);")

    # Create referral_rewards table
    op.execute("""
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
            payout_method VARCHAR(50),
            payout_reference VARCHAR(255),
            paid_at TIMESTAMP WITH TIME ZONE,

            -- Expiration (for credits/coupons)
            expires_at TIMESTAMP WITH TIME ZONE,

            -- Timestamps
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    """)

    # Create indexes for referral_rewards
    op.execute("CREATE INDEX IF NOT EXISTS idx_referral_rewards_referrer ON swisstax.referral_rewards(referrer_user_id);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_referral_rewards_status ON swisstax.referral_rewards(status);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_referral_rewards_date ON swisstax.referral_rewards(created_at);")

    # Create user_account_credits table
    op.execute("""
        CREATE TABLE IF NOT EXISTS swisstax.user_account_credits (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

            user_id UUID REFERENCES swisstax.users(id) ON DELETE CASCADE,

            -- Credit Details
            amount_chf DECIMAL(10, 2) NOT NULL,
            transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('earned', 'spent', 'expired', 'refunded', 'adjusted')),

            -- Source
            source_type VARCHAR(30) CHECK (source_type IN ('referral_reward', 'promotional', 'refund', 'admin_adjustment')),
            source_id UUID,

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
    """)

    # Create indexes for user_account_credits
    op.execute("CREATE INDEX IF NOT EXISTS idx_user_credits_user ON swisstax.user_account_credits(user_id, created_at);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_user_credits_type ON swisstax.user_account_credits(transaction_type);")

    # Add referral-related columns to users table
    op.execute("""
        ALTER TABLE swisstax.users
        ADD COLUMN IF NOT EXISTS personal_referral_code VARCHAR(50) UNIQUE,
        ADD COLUMN IF NOT EXISTS total_referrals_count INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS successful_referrals_count INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS total_rewards_earned_chf DECIMAL(10, 2) DEFAULT 0.00,
        ADD COLUMN IF NOT EXISTS account_credit_balance_chf DECIMAL(10, 2) DEFAULT 0.00,
        ADD COLUMN IF NOT EXISTS referred_by_code VARCHAR(50);
    """)

    op.execute("CREATE INDEX IF NOT EXISTS idx_users_referral_code ON swisstax.users(personal_referral_code);")

    # Add discount tracking to subscriptions table
    op.execute("""
        ALTER TABLE swisstax.subscriptions
        ADD COLUMN IF NOT EXISTS referral_code_used VARCHAR(50),
        ADD COLUMN IF NOT EXISTS discount_applied_chf DECIMAL(10, 2) DEFAULT 0.00,
        ADD COLUMN IF NOT EXISTS original_price_chf DECIMAL(10, 2),
        ADD COLUMN IF NOT EXISTS account_credits_used_chf DECIMAL(10, 2) DEFAULT 0.00;
    """)

    op.execute("CREATE INDEX IF NOT EXISTS idx_subscriptions_referral ON swisstax.subscriptions(referral_code_used);")

    # Create trigger for updated_at on referral_codes
    op.execute("""
        CREATE OR REPLACE FUNCTION update_referral_codes_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ language 'plpgsql';
    """)

    op.execute("""
        DROP TRIGGER IF EXISTS trigger_update_referral_codes_updated_at ON swisstax.referral_codes;
        CREATE TRIGGER trigger_update_referral_codes_updated_at
        BEFORE UPDATE ON swisstax.referral_codes
        FOR EACH ROW EXECUTE FUNCTION update_referral_codes_updated_at();
    """)

    # Create trigger for updated_at on referral_rewards
    op.execute("""
        CREATE OR REPLACE FUNCTION update_referral_rewards_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ language 'plpgsql';
    """)

    op.execute("""
        DROP TRIGGER IF EXISTS trigger_update_referral_rewards_updated_at ON swisstax.referral_rewards;
        CREATE TRIGGER trigger_update_referral_rewards_updated_at
        BEFORE UPDATE ON swisstax.referral_rewards
        FOR EACH ROW EXECUTE FUNCTION update_referral_rewards_updated_at();
    """)


def downgrade():
    """
    Remove referral system tables
    """
    # Drop triggers
    op.execute("DROP TRIGGER IF EXISTS trigger_update_referral_codes_updated_at ON swisstax.referral_codes;")
    op.execute("DROP TRIGGER IF EXISTS trigger_update_referral_rewards_updated_at ON swisstax.referral_rewards;")
    op.execute("DROP FUNCTION IF EXISTS update_referral_codes_updated_at();")
    op.execute("DROP FUNCTION IF EXISTS update_referral_rewards_updated_at();")

    # Remove columns from existing tables
    op.execute("""
        ALTER TABLE swisstax.subscriptions
        DROP COLUMN IF EXISTS referral_code_used,
        DROP COLUMN IF EXISTS discount_applied_chf,
        DROP COLUMN IF EXISTS original_price_chf,
        DROP COLUMN IF EXISTS account_credits_used_chf;
    """)

    op.execute("""
        ALTER TABLE swisstax.users
        DROP COLUMN IF EXISTS personal_referral_code,
        DROP COLUMN IF EXISTS total_referrals_count,
        DROP COLUMN IF EXISTS successful_referrals_count,
        DROP COLUMN IF EXISTS total_rewards_earned_chf,
        DROP COLUMN IF EXISTS account_credit_balance_chf,
        DROP COLUMN IF EXISTS referred_by_code;
    """)

    # Drop tables in reverse order of dependencies
    op.execute("DROP TABLE IF EXISTS swisstax.user_account_credits CASCADE;")
    op.execute("DROP TABLE IF EXISTS swisstax.referral_rewards CASCADE;")
    op.execute("DROP TABLE IF EXISTS swisstax.referral_usages CASCADE;")
    op.execute("DROP TABLE IF EXISTS swisstax.referral_codes CASCADE;")
