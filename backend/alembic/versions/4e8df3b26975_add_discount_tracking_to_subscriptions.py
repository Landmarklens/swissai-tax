"""add_discount_tracking_to_subscriptions

Revision ID: 4e8df3b26975
Revises: f492ec67b656
Create Date: 2025-10-14 18:19:26.257619

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4e8df3b26975'
down_revision: Union[str, Sequence[str], None] = 'f492ec67b656'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - Add discount tracking columns to subscriptions table."""
    # Add discount tracking columns using raw SQL for idempotency
    op.execute("""
        DO $$
        BEGIN
            -- Add discount_code_used column if not exists
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'swisstax'
                AND table_name = 'subscriptions'
                AND column_name = 'discount_code_used'
            ) THEN
                ALTER TABLE swisstax.subscriptions
                ADD COLUMN discount_code_used VARCHAR(50);
            END IF;

            -- Add original_price_chf column if not exists
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'swisstax'
                AND table_name = 'subscriptions'
                AND column_name = 'original_price_chf'
            ) THEN
                ALTER TABLE swisstax.subscriptions
                ADD COLUMN original_price_chf NUMERIC(10, 2);
            END IF;

            -- Add discount_amount_chf column if not exists
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'swisstax'
                AND table_name = 'subscriptions'
                AND column_name = 'discount_amount_chf'
            ) THEN
                ALTER TABLE swisstax.subscriptions
                ADD COLUMN discount_amount_chf NUMERIC(10, 2);
            END IF;

            -- Add referral_code_id column if not exists
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'swisstax'
                AND table_name = 'subscriptions'
                AND column_name = 'referral_code_id'
            ) THEN
                ALTER TABLE swisstax.subscriptions
                ADD COLUMN referral_code_id UUID;
            END IF;
        END $$;
    """)

    # Add foreign key constraint if not exists (idempotent)
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.table_constraints
                WHERE constraint_schema = 'swisstax'
                AND table_name = 'subscriptions'
                AND constraint_name = 'fk_subscriptions_referral_code'
            ) THEN
                ALTER TABLE swisstax.subscriptions
                ADD CONSTRAINT fk_subscriptions_referral_code
                FOREIGN KEY (referral_code_id)
                REFERENCES swisstax.referral_codes(id);
            END IF;
        END $$;
    """)

    # Create index on referral_code_id for performance (idempotent)
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_subscriptions_referral_code
        ON swisstax.subscriptions(referral_code_id);
    """)


def downgrade() -> None:
    """Downgrade schema - Remove discount tracking columns."""
    # Drop index
    op.execute("DROP INDEX IF EXISTS swisstax.idx_subscriptions_referral_code")

    # Drop foreign key constraint
    op.execute("""
        ALTER TABLE swisstax.subscriptions
        DROP CONSTRAINT IF EXISTS fk_subscriptions_referral_code
    """)

    # Drop columns
    op.execute("""
        ALTER TABLE swisstax.subscriptions
        DROP COLUMN IF EXISTS discount_code_used,
        DROP COLUMN IF EXISTS original_price_chf,
        DROP COLUMN IF EXISTS discount_amount_chf,
        DROP COLUMN IF EXISTS referral_code_id
    """)
