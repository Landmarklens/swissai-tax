"""Add deletion_requests and data_exports tables for GDPR compliance

Revision ID: 20251008_add_deletion_and_export
Revises: 20251008_143936
Create Date: 2025-10-08 15:00:00

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.engine.reflection import Inspector

# revision identifiers, used by Alembic.
revision: str = '20251008_add_deletion_and_export'
down_revision: Union[str, Sequence[str], None] = '20251008_143936'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def table_exists(table_name, schema='swisstax'):
    """Check if a table exists in a schema"""
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    return table_name in inspector.get_table_names(schema=schema)


def upgrade() -> None:
    """Add deletion_requests and data_exports tables"""

    # Create deletion_requests table
    if not table_exists('deletion_requests'):
        op.create_table(
            'deletion_requests',
            sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
            sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('swisstax.users.id', ondelete='CASCADE'), nullable=False, index=True),
            sa.Column('verification_code', sa.String(6), nullable=False),
            sa.Column('verification_token', sa.String(255), nullable=False, unique=True),
            sa.Column('requested_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
            sa.Column('expires_at', sa.TIMESTAMP(timezone=True), nullable=False),
            sa.Column('scheduled_deletion_at', sa.TIMESTAMP(timezone=True), nullable=False),
            sa.Column('status', sa.String(20), nullable=False, server_default='pending', index=True),
            sa.Column('ip_address', sa.String(45)),
            sa.Column('user_agent', sa.Text()),
            sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
            schema='swisstax'
        )

        # Create indexes for deletion_requests
        op.create_index('idx_deletion_user_id', 'deletion_requests', ['user_id'], schema='swisstax')
        op.create_index('idx_deletion_status', 'deletion_requests', ['status'], schema='swisstax')
        op.create_index('idx_deletion_scheduled', 'deletion_requests', ['scheduled_deletion_at'], schema='swisstax')
        op.create_index('idx_deletion_token', 'deletion_requests', ['verification_token'], unique=True, schema='swisstax')

        print("  ✓ Created 'deletion_requests' table with indexes")
    else:
        print("  ⊙ Table 'deletion_requests' already exists, skipping creation")

    # Create data_exports table
    if not table_exists('data_exports'):
        op.create_table(
            'data_exports',
            sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
            sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('swisstax.users.id', ondelete='CASCADE'), nullable=False, index=True),
            sa.Column('status', sa.String(20), nullable=False, server_default='pending', index=True),
            sa.Column('format', sa.String(10), nullable=False),
            sa.Column('file_url', sa.String(500)),
            sa.Column('file_size_bytes', sa.BigInteger()),
            sa.Column('expires_at', sa.TIMESTAMP(timezone=True), nullable=False),
            sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.Column('completed_at', sa.TIMESTAMP(timezone=True)),
            sa.Column('error_message', sa.Text()),
            schema='swisstax'
        )

        # Create indexes for data_exports
        op.create_index('idx_export_user_id', 'data_exports', ['user_id'], schema='swisstax')
        op.create_index('idx_export_status', 'data_exports', ['status'], schema='swisstax')
        op.create_index('idx_export_created', 'data_exports', ['created_at'], schema='swisstax')

        print("  ✓ Created 'data_exports' table with indexes")
    else:
        print("  ⊙ Table 'data_exports' already exists, skipping creation")

    print("\n✓ Deletion and export tables migration completed")


def downgrade() -> None:
    """Remove deletion_requests and data_exports tables"""

    # Drop data_exports table
    if table_exists('data_exports'):
        op.drop_index('idx_export_created', table_name='data_exports', schema='swisstax')
        op.drop_index('idx_export_status', table_name='data_exports', schema='swisstax')
        op.drop_index('idx_export_user_id', table_name='data_exports', schema='swisstax')
        op.drop_table('data_exports', schema='swisstax')
        print("  ✓ Dropped 'data_exports' table and indexes")
    else:
        print("  ⊙ Table 'data_exports' does not exist, skipping drop")

    # Drop deletion_requests table
    if table_exists('deletion_requests'):
        op.drop_index('idx_deletion_token', table_name='deletion_requests', schema='swisstax')
        op.drop_index('idx_deletion_scheduled', table_name='deletion_requests', schema='swisstax')
        op.drop_index('idx_deletion_status', table_name='deletion_requests', schema='swisstax')
        op.drop_index('idx_deletion_user_id', table_name='deletion_requests', schema='swisstax')
        op.drop_table('deletion_requests', schema='swisstax')
        print("  ✓ Dropped 'deletion_requests' table and indexes")
    else:
        print("  ⊙ Table 'deletion_requests' does not exist, skipping drop")

    print("\n✓ Deletion and export tables rollback completed")
