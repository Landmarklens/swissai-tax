"""add_tax_insights_table

Revision ID: 7a4d3e2bab48
Revises: 5cf1c013f2f1
Create Date: 2025-10-08 00:06:40.074313

Adds tax_insights table for storing AI-generated tax insights and recommendations.
This table stores personalized tax advice based on user's specific situation.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7a4d3e2bab48'
down_revision: Union[str, Sequence[str], None] = '5cf1c013f2f1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create tax_insights table if it doesn't exist (idempotent)."""

    # Get connection to check existing tables
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_tables = inspector.get_table_names(schema='swisstax')

    # Create tax_insights table only if it doesn't exist
    if 'tax_insights' not in existing_tables:
        op.create_table(
            'tax_insights',
            sa.Column('id', sa.String(36), nullable=False, comment='Unique insight ID (UUID)'),
            sa.Column('filing_session_id', sa.String(36), nullable=False, comment='Foreign key to tax_filing_sessions'),
            sa.Column('insight_type', sa.Enum(
                'DEDUCTION_OPPORTUNITY',
                'TAX_SAVING_TIP',
                'COMPLIANCE_WARNING',
                'MISSING_DOCUMENT',
                'OPTIMIZATION_SUGGESTION',
                'CALCULATION_EXPLANATION',
                name='insighttype',
                schema='swisstax'
            ), nullable=False, comment='Type of insight'),
            sa.Column('priority', sa.Enum(
                'HIGH',
                'MEDIUM',
                'LOW',
                name='insightpriority',
                schema='swisstax'
            ), nullable=False, server_default='MEDIUM', comment='Priority level'),
            sa.Column('title', sa.String(255), nullable=False, comment='Short title for the insight'),
            sa.Column('description', sa.Text(), nullable=False, comment='Detailed description of the insight'),
            sa.Column('action_items', sa.Text(), nullable=True, comment='JSON array of suggested actions'),
            sa.Column('estimated_savings_chf', sa.Integer(), nullable=True, comment='Estimated tax savings in CHF'),
            sa.Column('related_questions', sa.Text(), nullable=True, comment='JSON array of related question IDs'),
            sa.Column('is_acknowledged', sa.Integer(), nullable=False, server_default='0', comment='User has seen the insight'),
            sa.Column('is_applied', sa.Integer(), nullable=False, server_default='0', comment='User has acted on the insight'),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP'), comment='When insight was created'),
            sa.Column('acknowledged_at', sa.DateTime(), nullable=True, comment='When user acknowledged the insight'),
            sa.PrimaryKeyConstraint('id'),
            sa.ForeignKeyConstraint(['filing_session_id'], ['swisstax.tax_filing_sessions.id'], ondelete='CASCADE'),
            schema='swisstax'
        )

        # Create indexes for better query performance
        op.create_index(
            'ix_swisstax_tax_insights_filing_session_id',
            'tax_insights',
            ['filing_session_id'],
            schema='swisstax'
        )
        op.create_index(
            'ix_swisstax_tax_insights_insight_type',
            'tax_insights',
            ['insight_type'],
            schema='swisstax'
        )
        op.create_index(
            'ix_swisstax_tax_insights_priority',
            'tax_insights',
            ['priority'],
            schema='swisstax'
        )
    else:
        print("ℹ️  Table 'swisstax.tax_insights' already exists, skipping creation")


def downgrade() -> None:
    """Drop tax_insights table if it exists (idempotent)."""

    # Get connection to check existing tables
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_tables = inspector.get_table_names(schema='swisstax')

    # Drop table only if it exists
    if 'tax_insights' in existing_tables:
        # Drop indexes first
        existing_indexes = [idx['name'] for idx in inspector.get_indexes('tax_insights', schema='swisstax')]

        if 'ix_swisstax_tax_insights_priority' in existing_indexes:
            op.drop_index('ix_swisstax_tax_insights_priority', table_name='tax_insights', schema='swisstax')

        if 'ix_swisstax_tax_insights_insight_type' in existing_indexes:
            op.drop_index('ix_swisstax_tax_insights_insight_type', table_name='tax_insights', schema='swisstax')

        if 'ix_swisstax_tax_insights_filing_session_id' in existing_indexes:
            op.drop_index('ix_swisstax_tax_insights_filing_session_id', table_name='tax_insights', schema='swisstax')

        # Drop table
        op.drop_table('tax_insights', schema='swisstax')

        # Drop enums
        op.execute('DROP TYPE IF EXISTS swisstax.insightpriority')
        op.execute('DROP TYPE IF EXISTS swisstax.insighttype')
    else:
        print("ℹ️  Table 'swisstax.tax_insights' does not exist, skipping drop")
