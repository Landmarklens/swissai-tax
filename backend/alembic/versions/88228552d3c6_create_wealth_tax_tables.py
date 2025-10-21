"""Create wealth tax tables and seed 2024 rates

Revision ID: 88228552d3c6
Revises: ce652dd16873
Create Date: 2025-10-20 09:52:51.158075

Creates tables to store wealth tax rates for all 26 Swiss cantons.

Wealth tax (Vermögenssteuer) is levied by cantons and municipalities
on net worth (assets minus debts) as of December 31st each year.

Sources: Official canton tax administration websites (.ch domains)
Tax Year: 2024

Schema Design:
- wealth_tax_thresholds: Tax-free thresholds by canton
- wealth_tax_brackets: Progressive rate brackets (for cantons with progressive rates)
- wealth_tax_proportional: Single proportional rates (for cantons with flat rates)
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '88228552d3c6'
down_revision: Union[str, Sequence[str], None] = 'ce652dd16873'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create wealth tax tables."""

    # Table 1: Wealth Tax Thresholds (tax-free amounts)
    op.execute("""
        CREATE TABLE IF NOT EXISTS swisstax.wealth_tax_thresholds (
            id SERIAL PRIMARY KEY,
            canton VARCHAR(2) NOT NULL,
            threshold_single NUMERIC(12, 2) NOT NULL,
            threshold_married NUMERIC(12, 2) NOT NULL,
            rate_structure VARCHAR(20) NOT NULL,  -- 'progressive' or 'proportional'
            has_municipal_multiplier BOOLEAN DEFAULT TRUE,
            tax_year INTEGER NOT NULL,
            official_source TEXT,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(canton, tax_year)
        )
    """)

    # Table 2: Progressive Wealth Tax Brackets
    op.execute("""
        CREATE TABLE IF NOT EXISTS swisstax.wealth_tax_brackets (
            id SERIAL PRIMARY KEY,
            canton VARCHAR(2) NOT NULL,
            wealth_from NUMERIC(15, 2) NOT NULL,
            wealth_to NUMERIC(15, 2),  -- NULL means infinity (top bracket)
            rate_per_mille NUMERIC(6, 3) NOT NULL,  -- Rate in per mille (‰)
            tax_year INTEGER NOT NULL,
            bracket_order INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(canton, tax_year, bracket_order),
            FOREIGN KEY (canton, tax_year)
                REFERENCES swisstax.wealth_tax_thresholds(canton, tax_year)
        )
    """)

    # Table 3: Proportional Wealth Tax Rates (for cantons with flat rates)
    op.execute("""
        CREATE TABLE IF NOT EXISTS swisstax.wealth_tax_proportional (
            id SERIAL PRIMARY KEY,
            canton VARCHAR(2) NOT NULL,
            rate_per_mille NUMERIC(6, 3) NOT NULL,  -- Single proportional rate in ‰
            tax_year INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(canton, tax_year),
            FOREIGN KEY (canton, tax_year)
                REFERENCES swisstax.wealth_tax_thresholds(canton, tax_year)
        )
    """)

    print("✓ Created wealth_tax_thresholds table")
    print("✓ Created wealth_tax_brackets table (for progressive cantons)")
    print("✓ Created wealth_tax_proportional table (for flat-rate cantons)")
    print("")
    print("Note: Rate data will be seeded in separate migration after research is complete")


def downgrade() -> None:
    """Drop wealth tax tables."""
    op.execute("DROP TABLE IF EXISTS swisstax.wealth_tax_proportional CASCADE")
    op.execute("DROP TABLE IF EXISTS swisstax.wealth_tax_brackets CASCADE")
    op.execute("DROP TABLE IF EXISTS swisstax.wealth_tax_thresholds CASCADE")
    print("✓ Dropped all wealth tax tables")
