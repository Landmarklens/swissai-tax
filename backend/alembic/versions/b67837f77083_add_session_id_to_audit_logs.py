"""add_session_id_to_audit_logs

Revision ID: b67837f77083
Revises: 20251008_add_s3_key
Create Date: 2025-10-08 15:47:37.956716

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = 'b67837f77083'
down_revision: Union[str, Sequence[str], None] = '20251008_add_s3_key'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def column_exists(table_name: str, column_name: str, schema: str = 'swisstax') -> bool:
    """Check if a column exists in a table."""
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = [col['name'] for col in inspector.get_columns(table_name, schema=schema)]
    return column_name in columns


def index_exists(table_name: str, index_name: str, schema: str = 'swisstax') -> bool:
    """Check if an index exists on a table."""
    bind = op.get_bind()
    inspector = inspect(bind)
    indexes = [idx['name'] for idx in inspector.get_indexes(table_name, schema=schema)]
    return index_name in indexes


def upgrade() -> None:
    """Upgrade schema - idempotent."""
    # Add session_id column to audit_logs table if it doesn't exist
    if not column_exists('audit_logs', 'session_id'):
        op.add_column(
            'audit_logs',
            sa.Column('session_id', sa.String(255), nullable=True),
            schema='swisstax'
        )

    # Add index on session_id if it doesn't exist
    if not index_exists('audit_logs', 'idx_audit_session_id'):
        op.create_index(
            'idx_audit_session_id',
            'audit_logs',
            ['session_id'],
            schema='swisstax'
        )


def downgrade() -> None:
    """Downgrade schema - idempotent."""
    # Drop index if it exists
    if index_exists('audit_logs', 'idx_audit_session_id'):
        op.drop_index('idx_audit_session_id', table_name='audit_logs', schema='swisstax')

    # Drop column if it exists
    if column_exists('audit_logs', 'session_id'):
        op.drop_column('audit_logs', 'session_id', schema='swisstax')
