"""Seed Schwyz municipalities

Revision ID: 20251018_sz_munic
Revises: 20251018_lu_munic
Create Date: 2025-10-18

Source: https://data.sz.ch/explore/dataset/gesamtsteuerfuesse-der-schwyzer-gemeinden/
Tax year: 2024
Canton: Schwyz (SZ)
Municipalities: 30

Note: Schwyz uses percentage multiplier system
Municipal rates stored as decimal (325% = 3.25 multiplier)
Formula: Municipal Tax = Simple Tax (§ 36) × Multiplier
"""
from alembic import op

revision = '20251018_sz_munic'
down_revision = '20251018_lu_munic'

def upgrade():
    """Seed 30 Schwyz municipalities with 2024 tax rates."""
    op.execute("DELETE FROM swisstax.municipalities WHERE canton = 'SZ' AND tax_year = 2024")

    op.execute("""
        INSERT INTO swisstax.municipalities (canton, name, tax_multiplier, tax_year) VALUES
        ('SZ', 'Alpthal', 2.95, 2024),
        ('SZ', 'Altendorf', 2.45, 2024),
        ('SZ', 'Arth', 2.80, 2024),
        ('SZ', 'Einsiedeln', 3.20, 2024),
        ('SZ', 'Feusisberg', 1.94, 2024),
        ('SZ', 'Freienbach', 1.89, 2024),
        ('SZ', 'Galgenen', 2.85, 2024),
        ('SZ', 'Gersau', 3.10, 2024),
        ('SZ', 'Illgau', 3.30, 2024),
        ('SZ', 'Ingenbohl', 3.20, 2024),
        ('SZ', 'Innerthal', 2.90, 2024),
        ('SZ', 'Küssnacht', 2.75, 2024),
        ('SZ', 'Lachen', 2.55, 2024),
        ('SZ', 'Lauerz', 3.20, 2024),
        ('SZ', 'Morschach', 3.00, 2024),
        ('SZ', 'Muotathal', 2.90, 2024),
        ('SZ', 'Oberiberg', 3.00, 2024),
        ('SZ', 'Reichenburg', 3.10, 2024),
        ('SZ', 'Riemenstalden', 2.60, 2024),
        ('SZ', 'Rothenthurm', 2.95, 2024),
        ('SZ', 'Sattel', 3.00, 2024),
        ('SZ', 'Schübelbach', 3.30, 2024),
        ('SZ', 'Schwyz', 3.25, 2024),
        ('SZ', 'Steinen', 3.20, 2024),
        ('SZ', 'Steinerberg', 2.80, 2024),
        ('SZ', 'Tuggen', 2.99, 2024),
        ('SZ', 'Unteriberg', 3.25, 2024),
        ('SZ', 'Vorderthal', 2.95, 2024),
        ('SZ', 'Wangen', 3.10, 2024),
        ('SZ', 'Wollerau', 1.94, 2024)
        ON CONFLICT (canton, name, tax_year)
        DO UPDATE SET
            tax_multiplier = EXCLUDED.tax_multiplier,
            updated_at = CURRENT_TIMESTAMP
    """)

    print("✓ Seeded 30 Schwyz municipalities for 2024")

def downgrade():
    """Remove Schwyz 2024 municipality data."""
    op.execute("DELETE FROM swisstax.municipalities WHERE canton = 'SZ' AND tax_year = 2024")
    print("✓ Removed Schwyz 2024 municipalities")
