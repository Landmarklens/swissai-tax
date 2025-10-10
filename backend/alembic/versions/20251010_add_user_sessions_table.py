"""add_user_sessions_table

Revision ID: 20251010_sessions
Revises: b67837f77083
Create Date: 2025-10-10 10:00:00.000000

This migration creates the user_sessions table for session management.
The migration is idempotent - it can be run multiple times safely.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect
from sqlalchemy.dialects import postgresql
import uuid

# revision identifiers, used by Alembic.
revision: str = '20251010_sessions'
down_revision: Union[str, Sequence[str], None] = 'b67837f77083'
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

    # Create user_sessions table if it doesn't exist
    if not table_exists('user_sessions'):
        op.create_table(
            'user_sessions',
            sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
            sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column('session_id', sa.String(255), nullable=False),
            sa.Column('device_name', sa.String(200), nullable=True),
            sa.Column('device_type', sa.String(20), nullable=True),
            sa.Column('browser', sa.String(50), nullable=True),
            sa.Column('browser_version', sa.String(50), nullable=True),
            sa.Column('os', sa.String(50), nullable=True),
            sa.Column('os_version', sa.String(50), nullable=True),
            sa.Column('ip_address', sa.String(45), nullable=True),
            sa.Column('location', sa.String(200), nullable=True),
            sa.Column('device_metadata', postgresql.JSONB, nullable=True),
            sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
            sa.Column('is_current', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('last_active', sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.Column('expires_at', sa.DateTime(), nullable=False),
            sa.Column('revoked_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['user_id'], ['swisstax.users.id'], ondelete='CASCADE'),
            schema='swisstax'
        )
        print("✓ Created user_sessions table")

    # Create indexes if they don't exist
    indexes_to_create = [
        ('idx_user_session_user_id', ['user_id'], False),
        ('idx_user_session_session_id', ['session_id'], True),  # Unique index
        ('idx_user_session_user_active', ['user_id', 'is_active'], False),
        ('idx_user_session_expires', ['expires_at'], False),
    ]

    for index_name, columns, unique in indexes_to_create:
        if not index_exists('user_sessions', index_name):
            op.create_index(
                index_name,
                'user_sessions',
                columns,
                unique=unique,
                schema='swisstax'
            )
            print(f"✓ Created index {index_name}")


def downgrade() -> None:
    """Downgrade schema - idempotent."""

    # Drop indexes if they exist
    indexes_to_drop = [
        'idx_user_session_expires',
        'idx_user_session_user_active',
        'idx_user_session_session_id',
        'idx_user_session_user_id',
    ]

    for index_name in indexes_to_drop:
        if index_exists('user_sessions', index_name):
            op.drop_index(index_name, table_name='user_sessions', schema='swisstax')
            print(f"✓ Dropped index {index_name}")

    # Drop table if it exists
    if table_exists('user_sessions'):
        op.drop_table('user_sessions', schema='swisstax')
        print("✓ Dropped user_sessions table")
