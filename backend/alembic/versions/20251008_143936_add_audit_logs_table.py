"""Add audit logs table

Revision ID: 20251008_143936
Revises: add_encryption_tax_filing_models
Create Date: 2025-10-08 14:39:36

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy import text

# revision identifiers, used by Alembic.
revision = '20251008_143936'
down_revision = 'd8e7f9a1b2c3'
branch_labels = None
depends_on = None


def upgrade():
    # Check if table already exists
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    
    if 'audit_logs' not in inspector.get_table_names():
        # Create audit_logs table
        op.create_table(
            'audit_logs',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('event_type', sa.String(50), nullable=False),
            sa.Column('event_category', sa.String(50), nullable=False),
            sa.Column('description', sa.Text(), nullable=False),
            sa.Column('ip_address', sa.String(45), nullable=True),
            sa.Column('user_agent', sa.Text(), nullable=True),
            sa.Column('device_info', JSONB, nullable=True),
            sa.Column('event_metadata', JSONB, nullable=True),
            sa.Column('status', sa.String(20), nullable=False, server_default='success'),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.PrimaryKeyConstraint('id'),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE')
        )
        
        # Create indexes
        op.create_index('idx_audit_user_created', 'audit_logs', ['user_id', 'created_at'], postgresql_using='btree')
        op.create_index('idx_audit_event_type', 'audit_logs', ['event_type'])
        op.create_index('idx_audit_created_at', 'audit_logs', ['created_at'])
        
        print("✓ Created audit_logs table and indexes")
    else:
        print("⊙ Table audit_logs already exists, skipping creation")


def downgrade():
    # Check if table exists before dropping
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    
    if 'audit_logs' in inspector.get_table_names():
        op.drop_index('idx_audit_created_at', table_name='audit_logs')
        op.drop_index('idx_audit_event_type', table_name='audit_logs')
        op.drop_index('idx_audit_user_created', table_name='audit_logs')
        op.drop_table('audit_logs')
        print("✓ Dropped audit_logs table and indexes")
    else:
        print("⊙ Table audit_logs does not exist, skipping drop")
