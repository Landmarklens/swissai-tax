"""Add feature_usage table for tracking subscription limits

Revision ID: 20251013_feature_usage
Revises: 20251011_referral
Create Date: 2025-10-13

Adds feature_usage table to track:
- Usage-based limits (filings per year, documents, AI questions)
- Period-based tracking (monthly/annual resets)
- Per-user, per-feature usage counts
"""
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision = '20251013_feature_usage'
down_revision = '20251011_referral'
branch_labels = None
depends_on = None


def upgrade():
    """Create feature_usage table"""

    # Check if table already exists
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_tables = inspector.get_table_names(schema='swisstax')

    if 'feature_usage' not in existing_tables:
        # Create feature_usage table
        op.create_table(
            'feature_usage',
            sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True,
                     server_default=sa.text('gen_random_uuid()'),
                     comment='Unique identifier for usage record'),
            sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False,
                     comment='Reference to user'),
            sa.Column('feature_name', sa.String(100), nullable=False,
                     comment='Name of feature being tracked (e.g., filings_per_year)'),
            sa.Column('usage_count', sa.Integer, nullable=False, server_default='0',
                     comment='Current usage count for this period'),
            sa.Column('period_start', sa.Date, nullable=False,
                     comment='Start date of tracking period'),
            sa.Column('period_end', sa.Date, nullable=False,
                     comment='End date of tracking period'),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(),
                     comment='When this record was created'),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(),
                     onupdate=sa.func.now(),
                     comment='When this record was last updated'),
            schema='swisstax'
        )

        # Add foreign key constraint
        op.create_foreign_key(
            'fk_feature_usage_user_id',
            'feature_usage', 'users',
            ['user_id'], ['id'],
            source_schema='swisstax',
            referent_schema='swisstax',
            ondelete='CASCADE'
        )

        # Add indexes for efficient querying
        op.create_index(
            'ix_feature_usage_user_id',
            'feature_usage',
            ['user_id'],
            schema='swisstax'
        )

        op.create_index(
            'ix_feature_usage_feature_name',
            'feature_usage',
            ['feature_name'],
            schema='swisstax'
        )

        op.create_index(
            'ix_feature_usage_period_start',
            'feature_usage',
            ['period_start'],
            schema='swisstax'
        )

        op.create_index(
            'ix_feature_usage_period_end',
            'feature_usage',
            ['period_end'],
            schema='swisstax'
        )

        # Add compound index for efficient lookups
        op.create_index(
            'ix_feature_usage_user_feature_period',
            'feature_usage',
            ['user_id', 'feature_name', 'period_start', 'period_end'],
            schema='swisstax'
        )

        # Add unique constraint to prevent duplicate usage records
        op.create_unique_constraint(
            'uq_user_feature_period',
            'feature_usage',
            ['user_id', 'feature_name', 'period_start', 'period_end'],
            schema='swisstax'
        )

        print("✅ Created feature_usage table with indexes and constraints")
    else:
        print("ℹ️  feature_usage table already exists, skipping")


def downgrade():
    """Drop feature_usage table"""

    # Check if table exists
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_tables = inspector.get_table_names(schema='swisstax')

    if 'feature_usage' in existing_tables:
        # Drop table (indexes and constraints are dropped automatically)
        op.drop_table('feature_usage', schema='swisstax')
        print("✅ Dropped feature_usage table")
    else:
        print("ℹ️  feature_usage table does not exist, skipping")
