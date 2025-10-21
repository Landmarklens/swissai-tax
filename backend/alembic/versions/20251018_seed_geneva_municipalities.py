"""Seed Geneva municipalities

Revision ID: 20251018_ge_munic
Revises: 20251018_nw_munic
Create Date: 2025-10-18

Source: https://www.ge.ch/document/7698/telecharger
Tax year: 2024
Canton: Geneva (GE)
Municipalities: 45

Note: Geneva uses "centimes additionnels" system
Canton: 47.5 centimes
Municipal rates (CA - Centimes Additionnels) from official PDF
Rates stored as decimals (45.49 centimes = 0.4549)
"""
from alembic import op

revision = '20251018_ge_munic'
down_revision = '20251018_nw_munic'

def upgrade():
    """Seed 45 Geneva municipalities with 2024 tax rates (centimes additionnels)."""
    # Delete existing GE 2024 data for idempotency
    op.execute("DELETE FROM swisstax.municipalities WHERE canton = 'GE' AND tax_year = 2024")

    # Insert all 45 municipalities
    # Municipal rates are "centimes additionnels communaux" (CA)
    op.execute("""
        INSERT INTO swisstax.municipalities (canton, name, tax_multiplier, tax_year) VALUES
        ('GE', 'Aire-la-Ville', 0.5000, 2024),
        ('GE', 'Anières', 0.3100, 2024),
        ('GE', 'Avully', 0.5100, 2024),
        ('GE', 'Avusy', 0.5000, 2024),
        ('GE', 'Bardonnex', 0.4300, 2024),
        ('GE', 'Bellevue', 0.4100, 2024),
        ('GE', 'Bernex', 0.4800, 2024),
        ('GE', 'Carouge', 0.4000, 2024),
        ('GE', 'Cartigny', 0.4200, 2024),
        ('GE', 'Céligny', 0.3300, 2024),
        ('GE', 'Chancy', 0.5100, 2024),
        ('GE', 'Chêne-Bougeries', 0.3200, 2024),
        ('GE', 'Chêne-Bourg', 0.4600, 2024),
        ('GE', 'Choulex', 0.4000, 2024),
        ('GE', 'Collex-Bossy', 0.4600, 2024),
        ('GE', 'Collonge-Bellerive', 0.2800, 2024),
        ('GE', 'Cologny', 0.2700, 2024),          -- Lowest rate
        ('GE', 'Confignon', 0.4600, 2024),
        ('GE', 'Corsier', 0.3200, 2024),
        ('GE', 'Dardagny', 0.4800, 2024),
        ('GE', 'Genève', 0.4549, 2024),           -- City of Geneva
        ('GE', 'Genthod', 0.2500, 2024),          -- Second lowest
        ('GE', 'Grand-Saconnex', 0.4400, 2024),
        ('GE', 'Gy', 0.4600, 2024),
        ('GE', 'Hermance', 0.4200, 2024),
        ('GE', 'Jussy', 0.4100, 2024),
        ('GE', 'Laconnex', 0.4400, 2024),
        ('GE', 'Lancy', 0.4700, 2024),
        ('GE', 'Meinier', 0.4200, 2024),
        ('GE', 'Meyrin', 0.4400, 2024),
        ('GE', 'Onex', 0.5050, 2024),
        ('GE', 'Perly-Certoux', 0.4300, 2024),
        ('GE', 'Plan-les-Ouates', 0.3500, 2024),
        ('GE', 'Pregny-Chambésy', 0.3200, 2024),
        ('GE', 'Presinge', 0.4000, 2024),
        ('GE', 'Puplinge', 0.4800, 2024),
        ('GE', 'Russin', 0.3900, 2024),
        ('GE', 'Satigny', 0.3900, 2024),
        ('GE', 'Soral', 0.4400, 2024),
        ('GE', 'Thônex', 0.4400, 2024),
        ('GE', 'Troinex', 0.4000, 2024),
        ('GE', 'Vandoeuvres', 0.2900, 2024),
        ('GE', 'Vernier', 0.5000, 2024),
        ('GE', 'Versoix', 0.4550, 2024),
        ('GE', 'Veyrier', 0.3700, 2024)           -- 45 municipalities
        ON CONFLICT (canton, name, tax_year)
        DO UPDATE SET
            tax_multiplier = EXCLUDED.tax_multiplier,
            updated_at = CURRENT_TIMESTAMP
    """)

    print("✓ Seeded 45 Geneva municipalities for 2024")

def downgrade():
    """Remove Geneva 2024 municipality data."""
    op.execute("DELETE FROM swisstax.municipalities WHERE canton = 'GE' AND tax_year = 2024")
    print("✓ Removed Geneva 2024 municipalities")
