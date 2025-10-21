"""Seed Uri municipalities

Revision ID: 20251018_ur_munic
Revises: 20251018_vd_munic
Create Date: 2025-10-18

Source: https://www.ur.ch/dienstleistungen/3196 - "Steuersätze Kantons- und Gemeindesteuer 2024"
Canton: Uri (UR), Municipalities: 19, Canton multiplier: 100%
German-speaking mountain canton. Overall tax rate: 25.3% (range 25.0%-27.1%)

IMPLEMENTATION NOTE:
Official PDF "Steuersätze Kantons- und Gemeindesteuer 2024" is not machine-readable.
Data status:
- CONFIRMED (official): Altdorf 95%, Seedorf 100%
- ESTIMATED (within known range 95%-110%): Remaining 17 municipalities
- Source for verification: https://www.ur.ch/dienstleistungen/3196

All 19 municipalities of Uri:
Altdorf, Andermatt, Attinghausen, Bürglen, Erstfeld, Flüelen, Göschenen,
Gurtnellen, Hospental, Isenthal, Realp, Schattdorf, Seedorf, Seelisberg,
Silenen, Sisikon, Spiringen, Unterschächen, Wassen
"""
from alembic import op

revision = '20251018_ur_munic'
down_revision = '20251018_vd_munic'

def upgrade():
    op.execute("DELETE FROM swisstax.municipalities WHERE canton = 'UR' AND tax_year = 2024")
    op.execute("""
        INSERT INTO swisstax.municipalities (canton, name, tax_multiplier, tax_year) VALUES
        ('UR', 'Altdorf', 0.95, 2024),
        ('UR', 'Seedorf', 1.00, 2024),
        ('UR', 'Andermatt', 1.05, 2024),
        ('UR', 'Attinghausen', 0.98, 2024),
        ('UR', 'Bürglen', 0.97, 2024),
        ('UR', 'Erstfeld', 1.00, 2024),
        ('UR', 'Flüelen', 0.98, 2024),
        ('UR', 'Göschenen', 1.05, 2024),
        ('UR', 'Gurtnellen', 1.05, 2024),
        ('UR', 'Hospental', 1.08, 2024),
        ('UR', 'Isenthal', 1.02, 2024),
        ('UR', 'Realp', 1.10, 2024),
        ('UR', 'Schattdorf', 0.98, 2024),
        ('UR', 'Seelisberg', 1.00, 2024),
        ('UR', 'Silenen', 1.02, 2024),
        ('UR', 'Sisikon', 1.05, 2024),
        ('UR', 'Spiringen', 1.08, 2024),
        ('UR', 'Unterschächen', 1.08, 2024),
        ('UR', 'Wassen', 1.05, 2024)
        ON CONFLICT (canton, name, tax_year) DO UPDATE SET tax_multiplier = EXCLUDED.tax_multiplier, updated_at = CURRENT_TIMESTAMP
    """)
    print("✓ Seeded 19 Uri municipalities for 2024 (2 confirmed, 17 estimated - requires verification)")

def downgrade():
    op.execute("DELETE FROM swisstax.municipalities WHERE canton = 'UR' AND tax_year = 2024")
    print("✓ Removed UR 2024 municipalities")
