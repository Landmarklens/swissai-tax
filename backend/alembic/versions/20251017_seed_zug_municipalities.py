"""Seed Zug municipalities

Revision ID: 20251017_zug_munic
Revises: 20251017_seed_zurich_municipalities
Create Date: 2025-10-17

Source: https://zg.ch/dam/jcr:3286163b-1522-4b63-92cf-0aecfbd6a1e9/Steuerfuesse%202024-22.1.24.pdf
Canton Zug has exactly 11 municipalities (Einwohnergemeinden)
All rates are for tax year 2024 and include applicable discounts
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20251017_zug_munic'
down_revision = '20251017_seed_zurich_munic'
branch_labels = None
depends_on = None


def upgrade():
    """Seed all 11 Zug municipalities (idempotent)"""

    # Delete existing Zug 2024 data to ensure idempotence
    op.execute("""
        DELETE FROM swisstax.municipalities
        WHERE canton = 'ZG' AND tax_year = 2024
    """)

    # Insert all 11 Zug municipalities with 2024 rates
    # Rates are stored as decimals (0.5211 = 52.11%)
    # Source PDF shows rates as percentages with discounts already applied
    op.execute("""
        INSERT INTO swisstax.municipalities (canton, name, tax_multiplier, tax_year)
        VALUES
        ('ZG', 'Baar', 0.5088, 2024),          -- Lowest rate (53% with 4% discount)
        ('ZG', 'Cham', 0.5600, 2024),
        ('ZG', 'Hünenberg', 0.5700, 2024),
        ('ZG', 'Menzingen', 0.6100, 2024),     -- 65% with 4% discount
        ('ZG', 'Neuheim', 0.6500, 2024),       -- Highest rate
        ('ZG', 'Oberägeri', 0.5700, 2024),
        ('ZG', 'Risch', 0.5500, 2024),
        ('ZG', 'Steinhausen', 0.5400, 2024),   -- 56% with 2% discount
        ('ZG', 'Unterägeri', 0.5600, 2024),    -- 59% with 3% discount
        ('ZG', 'Walchwil', 0.5300, 2024),
        ('ZG', 'Zug', 0.5211, 2024)            -- Capital city (54% with 3.5% discount)

        ON CONFLICT (canton, name, tax_year) DO UPDATE SET
            tax_multiplier = EXCLUDED.tax_multiplier,
            updated_at = CURRENT_TIMESTAMP
    """)

    print("✓ Seeded 11 Zug municipalities for 2024")
    print("  Rate range: 50.88% (Baar) to 65% (Neuheim)")
    print("  Canton rate: 82%")
    print("  Source: https://zg.ch/dam/jcr:3286163b-1522-4b63-92cf-0aecfbd6a1e9/Steuerfuesse%202024-22.1.24.pdf")


def downgrade():
    """Remove Zug municipalities"""
    op.execute("""
        DELETE FROM swisstax.municipalities
        WHERE canton = 'ZG' AND tax_year = 2024
    """)
