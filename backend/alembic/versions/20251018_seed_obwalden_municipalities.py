"""Seed Obwalden municipalities

Revision ID: 20251018_ow_munic
Revises: 20251018_ai_munic
Create Date: 2025-10-18

Source: https://www.ow.ch/publikationen/8258
Tax year: 2024
Canton: Obwalden (OW)
Municipalities: 7

Note: Tax rates in Obwalden are expressed as "tax units" where 1.0 = 100%
Canton: 3.35 (3.25 + 0.10 flood protection levy)
Municipal rates include special levies for some municipalities
"""
from alembic import op

revision = '20251018_ow_munic'
down_revision = '20251018_ai_munic'

def upgrade():
    """Seed 7 Obwalden municipalities with 2024 tax rates."""
    # Delete existing OW 2024 data for idempotency
    op.execute("DELETE FROM swisstax.municipalities WHERE canton = 'OW' AND tax_year = 2024")

    # Insert all 7 municipalities
    # Municipal rates in tax units (1.0 = 100%)
    op.execute("""
        INSERT INTO swisstax.municipalities (canton, name, tax_multiplier, tax_year) VALUES
        ('OW', 'Sarnen', 3.8600, 2024),          -- 3.76 + 0.10 flood levy
        ('OW', 'Kerns', 4.5000, 2024),           -- 4.70 - 0.20 rebate
        ('OW', 'Sachseln', 4.7000, 2024),        -- 4.45 + 0.25 special levy
        ('OW', 'Alpnach', 4.8500, 2024),
        ('OW', 'Giswil', 4.8500, 2024),
        ('OW', 'Lungern', 5.2500, 2024),         -- Highest rate
        ('OW', 'Engelberg', 4.6500, 2024)        -- 4.85 - 0.20 rebate
        ON CONFLICT (canton, name, tax_year)
        DO UPDATE SET
            tax_multiplier = EXCLUDED.tax_multiplier,
            updated_at = CURRENT_TIMESTAMP
    """)

    print("✓ Seeded 7 Obwalden municipalities for 2024")

def downgrade():
    """Remove Obwalden 2024 municipality data."""
    op.execute("DELETE FROM swisstax.municipalities WHERE canton = 'OW' AND tax_year = 2024")
    print("✓ Removed Obwalden 2024 municipalities")
