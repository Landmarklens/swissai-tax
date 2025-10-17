"""Seed Basel-Stadt municipalities

Revision ID: 20251017_basel_stadt_munic
Revises: 20251017_zug_munic
Create Date: 2025-10-17

Source: https://media.bs.ch/original_file/12a2569768d1cae30205ccb8a3a6674faa042050/17000-steuertarife-2024.pdf

IMPORTANT: Basel-Stadt has a unique system:
- Basel (city): 100% canton, 0% municipal (no municipal tax)
- Bettingen: 50% canton + 37.50% municipal
- Riehen: 50% canton + 40.00% municipal

Canton Basel-Stadt has exactly 3 municipalities.
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20251017_basel_stadt_munic'
down_revision = '20251017_zug_munic'
branch_labels = None
depends_on = None


def upgrade():
    """Seed all 3 Basel-Stadt municipalities (idempotent)"""

    # Delete existing Basel-Stadt 2024 data to ensure idempotence
    op.execute("""
        DELETE FROM swisstax.municipalities
        WHERE canton = 'BS' AND tax_year = 2024
    """)

    # Insert all 3 Basel-Stadt municipalities with 2024 rates
    # IMPORTANT: Basel-Stadt has a unique system:
    # - Basel: No municipal tax (stores 0.0000 because residents pay full canton tax)
    # - Bettingen & Riehen: Have municipal taxes (50% canton + municipal)
    #
    # The tax_multiplier column stores the MUNICIPAL rate only.
    # Canton rates are handled separately in the calculator.
    op.execute("""
        INSERT INTO swisstax.municipalities (canton, name, tax_multiplier, tax_year)
        VALUES
        ('BS', 'Basel', 0.0000, 2024),        -- City: full canton tax, NO municipal tax
        ('BS', 'Bettingen', 0.3750, 2024),    -- 37.50% municipal (+ 50% canton = 87.50% total)
        ('BS', 'Riehen', 0.4000, 2024)        -- 40.00% municipal (+ 50% canton = 90.00% total)

        ON CONFLICT (canton, name, tax_year) DO UPDATE SET
            tax_multiplier = EXCLUDED.tax_multiplier,
            updated_at = CURRENT_TIMESTAMP
    """)

    print("✓ Seeded 3 Basel-Stadt municipalities for 2024")
    print("  Basel: 0% municipal (pays 100% canton tax)")
    print("  Bettingen: 37.50% municipal (+ 50% canton = 87.50% total)")
    print("  Riehen: 40.00% municipal (+ 50% canton = 90.00% total)")
    print("  Source: https://media.bs.ch/original_file/12a2569768d1cae30205ccb8a3a6674faa042050/17000-steuertarife-2024.pdf")


def downgrade():
    """Remove Basel-Stadt municipalities"""
    op.execute("""
        DELETE FROM swisstax.municipalities
        WHERE canton = 'BS' AND tax_year = 2024
    """)
