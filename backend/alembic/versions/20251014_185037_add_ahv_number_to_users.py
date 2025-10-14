"""add_ahv_number_to_users

Revision ID: 20251014_185037
Revises: 4e8df3b26975
Create Date: 2025-10-14 18:50:37

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '20251014_185037'
down_revision: Union[str, Sequence[str], None] = '4e8df3b26975'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - Add ahv_number column to users table."""
    # Add ahv_number column using raw SQL for idempotency
    op.execute("""
        DO $$
        BEGIN
            -- Add ahv_number column if not exists
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'swisstax'
                AND table_name = 'users'
                AND column_name = 'ahv_number'
            ) THEN
                ALTER TABLE swisstax.users
                ADD COLUMN ahv_number VARCHAR(20);
            END IF;
        END $$;
    """)

    # Create index on ahv_number for performance (idempotent)
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_users_ahv_number
        ON swisstax.users(ahv_number);
    """)

    # Add comment to column
    op.execute("""
        COMMENT ON COLUMN swisstax.users.ahv_number IS
        'Swiss social security number (AHV/AVS/AVS). Format: 756.XXXX.XXXX.XX';
    """)


def downgrade() -> None:
    """Downgrade schema - Remove ahv_number column."""
    # Drop index
    op.execute("DROP INDEX IF EXISTS swisstax.idx_users_ahv_number")

    # Drop column
    op.execute("""
        ALTER TABLE swisstax.users
        DROP COLUMN IF EXISTS ahv_number
    """)
