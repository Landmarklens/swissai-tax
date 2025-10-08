"""add_address_and_postal_code_to_users

Revision ID: 20251008_add_address
Revises: b67837f77083
Create Date: 2025-10-08 16:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = '20251008_add_address'
down_revision: Union[str, Sequence[str], None] = 'b67837f77083'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def column_exists(table_name: str, column_name: str, schema: str = 'swisstax') -> bool:
    """Check if a column exists in a table."""
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = [col['name'] for col in inspector.get_columns(table_name, schema=schema)]
    return column_name in columns


def upgrade() -> None:
    """Upgrade schema - Add address and postal_code columns to users table."""

    # Add address column if it doesn't exist
    if not column_exists('users', 'address'):
        op.add_column(
            'users',
            sa.Column('address', sa.String(255), nullable=True),
            schema='swisstax'
        )

    # Add postal_code column if it doesn't exist
    if not column_exists('users', 'postal_code'):
        op.add_column(
            'users',
            sa.Column('postal_code', sa.String(20), nullable=True),
            schema='swisstax'
        )


def downgrade() -> None:
    """Downgrade schema - Remove address and postal_code columns from users table."""

    # Drop postal_code column if it exists
    if column_exists('users', 'postal_code'):
        op.drop_column('users', 'postal_code', schema='swisstax')

    # Drop address column if it exists
    if column_exists('users', 'address'):
        op.drop_column('users', 'address', schema='swisstax')
