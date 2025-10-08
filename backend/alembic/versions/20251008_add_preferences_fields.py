"""add_preferences_fields_to_user_settings

Revision ID: 20251008_add_prefs
Revises: 20251008_add_address
Create Date: 2025-10-08 16:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = '20251008_add_prefs'
down_revision: Union[str, Sequence[str], None] = '20251008_add_address'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def column_exists(table_name: str, column_name: str, schema: str = 'swisstax') -> bool:
    """Check if a column exists in a table."""
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = [col['name'] for col in inspector.get_columns(table_name, schema=schema)]
    return column_name in columns


def upgrade() -> None:
    """Upgrade schema - Add missing preference fields to user_settings table."""

    # Add auto_calculate_enabled column if it doesn't exist
    if not column_exists('user_settings', 'auto_calculate_enabled'):
        op.add_column(
            'user_settings',
            sa.Column('auto_calculate_enabled', sa.Boolean, server_default='true', nullable=False),
            schema='swisstax'
        )

    # Add default_tax_year column if it doesn't exist
    if not column_exists('user_settings', 'default_tax_year'):
        op.add_column(
            'user_settings',
            sa.Column('default_tax_year', sa.Integer, nullable=True),
            schema='swisstax'
        )

    # Add rounding_method column if it doesn't exist
    if not column_exists('user_settings', 'rounding_method'):
        op.add_column(
            'user_settings',
            sa.Column('rounding_method', sa.String(20), server_default='standard', nullable=False),
            schema='swisstax'
        )


def downgrade() -> None:
    """Downgrade schema - Remove preference fields from user_settings table."""

    # Drop rounding_method column if it exists
    if column_exists('user_settings', 'rounding_method'):
        op.drop_column('user_settings', 'rounding_method', schema='swisstax')

    # Drop default_tax_year column if it exists
    if column_exists('user_settings', 'default_tax_year'):
        op.drop_column('user_settings', 'default_tax_year', schema='swisstax')

    # Drop auto_calculate_enabled column if it exists
    if column_exists('user_settings', 'auto_calculate_enabled'):
        op.drop_column('user_settings', 'auto_calculate_enabled', schema='swisstax')
