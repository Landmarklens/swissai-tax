"""add_two_factor_authentication_fields

Revision ID: 5cf1c013f2f1
Revises: 54dfce120123
Create Date: 2025-10-07 20:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5cf1c013f2f1'
down_revision: Union[str, Sequence[str], None] = '54dfce120123'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add two-factor authentication columns to users table."""
    conn = op.get_bind()

    # Check and add two_factor_enabled column
    result = conn.execute(sa.text("""
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'swisstax'
        AND table_name = 'users'
        AND column_name = 'two_factor_enabled'
    """))

    if result.fetchone() is None:
        op.add_column(
            'users',
            sa.Column('two_factor_enabled', sa.Boolean(), server_default='false', nullable=False),
            schema='swisstax'
        )
        print("✓ Added two_factor_enabled column to users")
    else:
        print("✓ two_factor_enabled column already exists, skipping")

    # Check and add two_factor_secret column
    result = conn.execute(sa.text("""
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'swisstax'
        AND table_name = 'users'
        AND column_name = 'two_factor_secret'
    """))

    if result.fetchone() is None:
        op.add_column(
            'users',
            sa.Column('two_factor_secret', sa.String(255), nullable=True),
            schema='swisstax'
        )
        print("✓ Added two_factor_secret column to users")
    else:
        print("✓ two_factor_secret column already exists, skipping")

    # Check and add two_factor_backup_codes column
    result = conn.execute(sa.text("""
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'swisstax'
        AND table_name = 'users'
        AND column_name = 'two_factor_backup_codes'
    """))

    if result.fetchone() is None:
        op.add_column(
            'users',
            sa.Column('two_factor_backup_codes', sa.String(1000), nullable=True),
            schema='swisstax'
        )
        print("✓ Added two_factor_backup_codes column to users")
    else:
        print("✓ two_factor_backup_codes column already exists, skipping")

    # Check and add two_factor_verified_at column
    result = conn.execute(sa.text("""
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'swisstax'
        AND table_name = 'users'
        AND column_name = 'two_factor_verified_at'
    """))

    if result.fetchone() is None:
        op.add_column(
            'users',
            sa.Column('two_factor_verified_at', sa.DateTime(timezone=True), nullable=True),
            schema='swisstax'
        )
        print("✓ Added two_factor_verified_at column to users")
    else:
        print("✓ two_factor_verified_at column already exists, skipping")


def downgrade() -> None:
    """Remove two-factor authentication columns from users table."""
    conn = op.get_bind()

    # Check and drop two_factor_verified_at column
    result = conn.execute(sa.text("""
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'swisstax'
        AND table_name = 'users'
        AND column_name = 'two_factor_verified_at'
    """))

    if result.fetchone() is not None:
        op.drop_column('users', 'two_factor_verified_at', schema='swisstax')
        print("✓ Removed two_factor_verified_at column")
    else:
        print("✓ two_factor_verified_at column doesn't exist, skipping")

    # Check and drop two_factor_backup_codes column
    result = conn.execute(sa.text("""
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'swisstax'
        AND table_name = 'users'
        AND column_name = 'two_factor_backup_codes'
    """))

    if result.fetchone() is not None:
        op.drop_column('users', 'two_factor_backup_codes', schema='swisstax')
        print("✓ Removed two_factor_backup_codes column")
    else:
        print("✓ two_factor_backup_codes column doesn't exist, skipping")

    # Check and drop two_factor_secret column
    result = conn.execute(sa.text("""
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'swisstax'
        AND table_name = 'users'
        AND column_name = 'two_factor_secret'
    """))

    if result.fetchone() is not None:
        op.drop_column('users', 'two_factor_secret', schema='swisstax')
        print("✓ Removed two_factor_secret column")
    else:
        print("✓ two_factor_secret column doesn't exist, skipping")

    # Check and drop two_factor_enabled column
    result = conn.execute(sa.text("""
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'swisstax'
        AND table_name = 'users'
        AND column_name = 'two_factor_enabled'
    """))

    if result.fetchone() is not None:
        op.drop_column('users', 'two_factor_enabled', schema='swisstax')
        print("✓ Removed two_factor_enabled column")
    else:
        print("✓ two_factor_enabled column doesn't exist, skipping")
