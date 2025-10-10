"""add_subscription_commitment_fields

Revision ID: 20251010_subscription
Revises: 20251010_sessions
Create Date: 2025-10-10 14:00:00.000000

This migration adds fields to support 5-year commitment subscriptions.
The migration is idempotent - it can be run multiple times safely.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '20251010_subscription'
down_revision: Union[str, Sequence[str], None] = '20251010_sessions'
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


def upgrade() -> None:
    """Upgrade schema - idempotent."""

    # Add commitment tracking columns to subscriptions table
    columns_to_add = [
        ('plan_commitment_years', sa.Integer(), {'server_default': '1'}),
        ('commitment_start_date', sa.DateTime(timezone=True), {'nullable': True}),
        ('commitment_end_date', sa.DateTime(timezone=True), {'nullable': True}),
        ('trial_start', sa.DateTime(timezone=True), {'nullable': True}),
        ('trial_end', sa.DateTime(timezone=True), {'nullable': True}),
        ('pause_requested', sa.Boolean(), {'server_default': 'false'}),
        ('pause_reason', sa.String(500), {'nullable': True}),
        ('switch_requested', sa.Boolean(), {'server_default': 'false'}),
        ('switch_to_plan', sa.String(50), {'nullable': True}),
        ('cancellation_requested_at', sa.DateTime(timezone=True), {'nullable': True}),
        ('cancellation_reason', sa.String(500), {'nullable': True}),
    ]

    for column_name, column_type, kwargs in columns_to_add:
        if not column_exists('subscriptions', column_name):
            op.add_column(
                'subscriptions',
                sa.Column(column_name, column_type, **kwargs),
                schema='swisstax'
            )
            print(f"✓ Added column {column_name} to subscriptions table")


def downgrade() -> None:
    """Downgrade schema - idempotent."""

    # Drop added columns if they exist
    columns_to_drop = [
        'cancellation_reason',
        'cancellation_requested_at',
        'switch_to_plan',
        'switch_requested',
        'pause_reason',
        'pause_requested',
        'trial_end',
        'trial_start',
        'commitment_end_date',
        'commitment_start_date',
        'plan_commitment_years',
    ]

    for column_name in columns_to_drop:
        if column_exists('subscriptions', column_name):
            op.drop_column('subscriptions', column_name, schema='swisstax')
            print(f"✓ Dropped column {column_name} from subscriptions table")
