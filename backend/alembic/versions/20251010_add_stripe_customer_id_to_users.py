"""add_stripe_customer_id_to_users

Revision ID: 20251010_stripe_customer
Revises: 20251010_subscription
Create Date: 2025-10-10 15:00:00.000000

This migration adds stripe_customer_id to users table.
The migration is idempotent - it can be run multiple times safely.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision: str = '20251010_stripe_customer'
down_revision: Union[str, Sequence[str], None] = '20251010_subscription'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def table_exists(table_name: str, schema: str = 'swisstax') -> bool:
    """Check if a table exists."""
    bind = op.get_bind()
    inspector = inspect(bind)
    return table_name in inspector.get_table_names(schema=schema)


def column_exists(table_name: str, column_name: str, schema: str = 'swisstax') -> bool:
    """Check if a column exists in a table."""
    if not table_exists(table_name, schema):
        return False
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = [col['name'] for col in inspector.get_columns(table_name, schema=schema)]
    return column_name in columns


def index_exists(table_name: str, index_name: str, schema: str = 'swisstax') -> bool:
    """Check if an index exists on a table."""
    if not table_exists(table_name, schema):
        return False
    bind = op.get_bind()
    inspector = inspect(bind)
    indexes = [idx['name'] for idx in inspector.get_indexes(table_name, schema=schema)]
    return index_name in indexes


def upgrade() -> None:
    """Upgrade schema - idempotent."""

    # Add stripe_customer_id column if it doesn't exist
    if not column_exists('users', 'stripe_customer_id'):
        op.add_column(
            'users',
            sa.Column('stripe_customer_id', sa.String(255), nullable=True),
            schema='swisstax'
        )
        print("✓ Added stripe_customer_id column to users table")

    # Add unique index on stripe_customer_id if it doesn't exist
    if not index_exists('users', 'idx_users_stripe_customer_id'):
        op.create_index(
            'idx_users_stripe_customer_id',
            'users',
            ['stripe_customer_id'],
            unique=True,
            schema='swisstax'
        )
        print("✓ Created unique index on stripe_customer_id")


def downgrade() -> None:
    """Downgrade schema - idempotent."""

    # Drop index if it exists
    if index_exists('users', 'idx_users_stripe_customer_id'):
        op.drop_index('idx_users_stripe_customer_id', table_name='users', schema='swisstax')
        print("✓ Dropped index idx_users_stripe_customer_id")

    # Drop column if it exists
    if column_exists('users', 'stripe_customer_id'):
        op.drop_column('users', 'stripe_customer_id', schema='swisstax')
        print("✓ Dropped stripe_customer_id column from users table")
