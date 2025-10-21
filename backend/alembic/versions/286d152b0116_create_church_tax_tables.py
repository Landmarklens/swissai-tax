"""create_church_tax_tables

Revision ID: 286d152b0116
Revises: d2437bf32c7a
Create Date: 2025-10-20 11:14:14.906856

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '286d152b0116'
down_revision: Union[str, Sequence[str], None] = 'd2437bf32c7a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create church tax tables for Swiss canton and municipality-level church tax data."""

    print("Creating church tax tables...")

    # Table 1: church_tax_config - Canton-level configuration
    op.create_table(
        'church_tax_config',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('canton', sa.String(length=2), nullable=False),
        sa.Column('has_church_tax', sa.Boolean(), nullable=False),
        sa.Column('recognized_denominations', sa.ARRAY(sa.Text()), nullable=True),
        sa.Column('calculation_method', sa.String(length=50), nullable=True),
        sa.Column('tax_year', sa.Integer(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('official_source', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('canton', 'tax_year', name='uq_church_tax_config_canton_year'),
        schema='swisstax'
    )

    # Table 2: church_tax_rates - Municipality/parish-level rates
    op.create_table(
        'church_tax_rates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('canton', sa.String(length=2), nullable=False),
        sa.Column('municipality_id', sa.Integer(), nullable=True),
        sa.Column('municipality_name', sa.String(length=100), nullable=True),
        sa.Column('denomination', sa.String(length=50), nullable=False),
        sa.Column('rate_percentage', sa.Numeric(precision=5, scale=4), nullable=False),
        sa.Column('tax_year', sa.Integer(), nullable=False),
        sa.Column('source', sa.String(length=50), nullable=True),
        sa.Column('parish_name', sa.Text(), nullable=True),
        sa.Column('official_source', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('canton', 'municipality_id', 'denomination', 'tax_year',
                           name='uq_church_tax_rates_unique'),
        sa.ForeignKeyConstraint(['canton', 'tax_year'],
                               ['swisstax.church_tax_config.canton', 'swisstax.church_tax_config.tax_year'],
                               name='fk_church_tax_rates_config'),
        schema='swisstax'
    )

    # Create indexes for faster lookups
    op.create_index('ix_church_tax_config_canton_year', 'church_tax_config',
                    ['canton', 'tax_year'], schema='swisstax')
    op.create_index('ix_church_tax_rates_canton_year', 'church_tax_rates',
                    ['canton', 'tax_year'], schema='swisstax')
    op.create_index('ix_church_tax_rates_municipality', 'church_tax_rates',
                    ['municipality_id'], schema='swisstax')

    print("✓ Created church_tax_config table")
    print("✓ Created church_tax_rates table")
    print("✓ Created indexes for fast lookups")
    print("✅ Church tax tables created successfully")


def downgrade() -> None:
    """Drop church tax tables."""
    op.drop_index('ix_church_tax_rates_municipality', table_name='church_tax_rates', schema='swisstax')
    op.drop_index('ix_church_tax_rates_canton_year', table_name='church_tax_rates', schema='swisstax')
    op.drop_index('ix_church_tax_config_canton_year', table_name='church_tax_config', schema='swisstax')
    op.drop_table('church_tax_rates', schema='swisstax')
    op.drop_table('church_tax_config', schema='swisstax')
    print("✓ Dropped church tax tables")
