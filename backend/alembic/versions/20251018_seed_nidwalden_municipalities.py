"""Seed Nidwalden municipalities

Revision ID: 20251018_nw_munic
Revises: 20251018_ow_munic
Create Date: 2025-10-18

Source: https://www.steuern-nw.ch/app/uploads/2024/01/Steuerfuesse_2024.pdf
Tax year: 2024
Canton: Nidwalden (NW)
Municipalities: 11

Note: Rates are in tax units (1.0 = 100%)
Municipal rates include political + school communities (excluding church tax)
"""
from alembic import op

revision = '20251018_nw_munic'
down_revision = '20251018_ow_munic'

def upgrade():
    """Seed 11 Nidwalden municipalities with 2024 tax rates."""
    # Delete existing NW 2024 data for idempotency
    op.execute("DELETE FROM swisstax.municipalities WHERE canton = 'NW' AND tax_year = 2024")

    # Insert all 11 municipalities
    # Rates are municipal only (political + school, canton excluded)
    op.execute("""
        INSERT INTO swisstax.municipalities (canton, name, tax_multiplier, tax_year) VALUES
        ('NW', 'Beckenried', 1.7900, 2024),
        ('NW', 'Buochs', 2.1700, 2024),          -- With 0.10 discount applied
        ('NW', 'Dallenwil', 2.4000, 2024),
        ('NW', 'Emmetten', 2.2200, 2024),
        ('NW', 'Ennetbürgen', 1.5000, 2024),     -- Lowest rate
        ('NW', 'Ennetmoos', 2.0000, 2024),
        ('NW', 'Hergiswil', 1.4900, 2024),       -- Second lowest
        ('NW', 'Oberdorf', 2.0000, 2024),        -- Polit 0.45 + School 1.55
        ('NW', 'Stans', 2.3500, 2024),           -- Capital
        ('NW', 'Stansstad', 1.8700, 2024),       -- Polit 0.74 + School 1.13
        ('NW', 'Wolfenschiessen', 2.5000, 2024)  -- Highest rate
        ON CONFLICT (canton, name, tax_year)
        DO UPDATE SET
            tax_multiplier = EXCLUDED.tax_multiplier,
            updated_at = CURRENT_TIMESTAMP
    """)

    print("✓ Seeded 11 Nidwalden municipalities for 2024")

def downgrade():
    """Remove Nidwalden 2024 municipality data."""
    op.execute("DELETE FROM swisstax.municipalities WHERE canton = 'NW' AND tax_year = 2024")
    print("✓ Removed Nidwalden 2024 municipalities")
