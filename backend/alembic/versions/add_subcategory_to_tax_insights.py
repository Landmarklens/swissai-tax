"""Add subcategory to tax_insights

Revision ID: add_subcategory_insights
Revises:
Create Date: 2025-10-17

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_subcategory_insights'
down_revision = ('fix_unique_constraint',)  # Depends on the latest head
head = None

def upgrade():
    # Create the enum type for subcategory
    subcategory_enum = postgresql.ENUM(
        'personal', 'partner', 'kids', 'employment', 'location',
        'property_assets', 'retirement_savings', 'deductions', 'general',
        name='insightsubcategory',
        schema='swisstax'
    )
    subcategory_enum.create(op.get_bind(), checkfirst=True)

    # Add subcategory column with default value 'general'
    op.add_column(
        'tax_insights',
        sa.Column('subcategory', subcategory_enum, nullable=False, server_default='general'),
        schema='swisstax'
    )

    # Create index on subcategory for faster queries
    op.create_index(
        'ix_swisstax_tax_insights_subcategory',
        'tax_insights',
        ['subcategory'],
        schema='swisstax'
    )


def downgrade():
    # Remove index
    op.drop_index('ix_swisstax_tax_insights_subcategory', table_name='tax_insights', schema='swisstax')

    # Remove column
    op.drop_column('tax_insights', 'subcategory', schema='swisstax')

    # Drop enum type
    op.execute('DROP TYPE IF EXISTS swisstax.insightsubcategory')
