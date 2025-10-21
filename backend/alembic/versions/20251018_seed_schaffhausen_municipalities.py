"""Seed Schaffhausen municipalities

Revision ID: 20251018_schaffhausen_munic
Revises: 20251017_basel_stadt_munic
Create Date: 2025-10-18
"""
from alembic import op

revision = '20251018_schaffhausen_munic'
down_revision = '20251017_basel_stadt_munic'
branch_labels = None
depends_on = None

def upgrade():
    op.execute("DELETE FROM swisstax.municipalities WHERE canton = 'SH' AND tax_year = 2024")
    
    op.execute("""
        INSERT INTO swisstax.municipalities (canton, name, tax_multiplier, tax_year) VALUES
        ('SH', 'Bargen', 1.02, 2024), ('SH', 'Beggingen', 1.17, 2024),
        ('SH', 'Beringen', 0.91, 2024), ('SH', 'Buch', 0.96, 2024),
        ('SH', 'Buchberg', 0.62, 2024), ('SH', 'Büttenhardt', 0.85, 2024),
        ('SH', 'Dörflingen', 0.88, 2024), ('SH', 'Gächlingen', 1.07, 2024),
        ('SH', 'Hallau', 1.12, 2024), ('SH', 'Hemishofen', 0.96, 2024),
        ('SH', 'Löhningen', 0.89, 2024), ('SH', 'Lohn', 0.98, 2024),
        ('SH', 'Merishausen', 1.10, 2024), ('SH', 'Neuhausen', 0.93, 2024),
        ('SH', 'Neunkirch', 0.99, 2024), ('SH', 'Oberhallau', 1.17, 2024),
        ('SH', 'Ramsen', 0.95, 2024), ('SH', 'Rüdlingen', 0.75, 2024),
        ('SH', 'Schaffhausen', 0.90, 2024), ('SH', 'Schleitheim', 1.15, 2024),
        ('SH', 'Siblingen', 1.05, 2024), ('SH', 'Stein am Rhein', 0.95, 2024),
        ('SH', 'Stetten', 0.61, 2024), ('SH', 'Thayngen', 0.92, 2024),
        ('SH', 'Trasadingen', 1.12, 2024), ('SH', 'Wilchingen', 1.12, 2024)
        ON CONFLICT (canton, name, tax_year) DO UPDATE SET
            tax_multiplier = EXCLUDED.tax_multiplier, updated_at = CURRENT_TIMESTAMP
    """)
    print("✓ Seeded 26 Schaffhausen municipalities for 2024")

def downgrade():
    op.execute("DELETE FROM swisstax.municipalities WHERE canton = 'SH' AND tax_year = 2024")
