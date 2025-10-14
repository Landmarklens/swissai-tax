"""add_performance_indexes_for_auth

Revision ID: 20251014_perf_idx
Revises: 5eef7342e477
Create Date: 2025-10-14 10:00:00.000000

This migration adds performance indexes for login/logout operations:
- Composite index on user_sessions for session cleanup queries
- Composite index on audit_logs for user activity queries

The migration is idempotent - it can be run multiple times safely.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision: str = '20251014_perf_idx'
down_revision: Union[str, Sequence[str], None] = '20251014_185037'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def table_exists(table_name: str, schema: str = 'swisstax') -> bool:
    """Check if a table exists."""
    bind = op.get_bind()
    inspector = inspect(bind)
    return table_name in inspector.get_table_names(schema=schema)


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

    # Performance indexes for user_sessions table
    # These optimize session cleanup queries during login
    session_indexes = [
        # Optimize: Finding sessions by device_name and IP for duplicate detection
        ('idx_user_sessions_device_ip', 'user_sessions', ['user_id', 'device_name', 'ip_address', 'is_active']),

        # Optimize: Finding stale sessions for cleanup
        ('idx_user_sessions_active_last_active', 'user_sessions', ['user_id', 'is_active', 'last_active']),
    ]

    for index_name, table_name, columns in session_indexes:
        if not index_exists(table_name, index_name):
            op.create_index(
                index_name,
                table_name,
                columns,
                schema='swisstax'
            )
            print(f"✓ Created index {index_name} on {table_name}")
        else:
            print(f"- Index {index_name} already exists, skipping")

    # Performance indexes for audit_logs table
    # These optimize audit log queries for user activity
    audit_indexes = [
        # Optimize: User activity queries with filtering by event type and time
        ('idx_audit_logs_user_event_created', 'audit_logs', ['user_id', 'event_type', 'created_at']),

        # Optimize: Recent activity queries with event category filter
        ('idx_audit_logs_user_category_created', 'audit_logs', ['user_id', 'event_category', 'created_at']),
    ]

    for index_name, table_name, columns in audit_indexes:
        if not index_exists(table_name, index_name):
            op.create_index(
                index_name,
                table_name,
                columns,
                schema='swisstax'
            )
            print(f"✓ Created index {index_name} on {table_name}")
        else:
            print(f"- Index {index_name} already exists, skipping")


def downgrade() -> None:
    """Downgrade schema - idempotent."""

    # Drop audit_logs indexes
    audit_indexes = [
        'idx_audit_logs_user_category_created',
        'idx_audit_logs_user_event_created',
    ]

    for index_name in audit_indexes:
        if index_exists('audit_logs', index_name):
            op.drop_index(index_name, table_name='audit_logs', schema='swisstax')
            print(f"✓ Dropped index {index_name}")
        else:
            print(f"- Index {index_name} does not exist, skipping")

    # Drop user_sessions indexes
    session_indexes = [
        'idx_user_sessions_active_last_active',
        'idx_user_sessions_device_ip',
    ]

    for index_name in session_indexes:
        if index_exists('user_sessions', index_name):
            op.drop_index(index_name, table_name='user_sessions', schema='swisstax')
            print(f"✓ Dropped index {index_name}")
        else:
            print(f"- Index {index_name} does not exist, skipping")
