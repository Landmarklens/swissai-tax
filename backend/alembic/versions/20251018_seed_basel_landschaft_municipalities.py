"""Seed Basel-Landschaft municipalities

Revision ID: 20251018_bl_munic
Revises: 20251018_tg_munic
Create Date: 2025-10-18

Source: https://statistik.bl.ch/web_portal/18_4_5
Canton: Basel-Landschaft (BL), Municipalities: 86, Canton rate: 100%
"""
from alembic import op

revision = '20251018_bl_munic'
down_revision = '20251018_tg_munic'

def upgrade():
    op.execute("DELETE FROM swisstax.municipalities WHERE canton = 'BL' AND tax_year = 2024")
    op.execute("""
        INSERT INTO swisstax.municipalities (canton, name, tax_multiplier, tax_year) VALUES
        ('BL', 'Aesch', 0.56, 2024), ('BL', 'Allschwil', 0.58, 2024), ('BL', 'Anwil', 0.60, 2024), ('BL', 'Arboldswil', 0.60, 2024),
        ('BL', 'Arisdorf', 0.59, 2024), ('BL', 'Arlesheim', 0.47, 2024), ('BL', 'Augst', 0.53, 2024), ('BL', 'Bennwil', 0.64, 2024),
        ('BL', 'Biel-Benken', 0.46, 2024), ('BL', 'Binningen', 0.49, 2024), ('BL', 'Birsfelden', 0.62, 2024), ('BL', 'Blauen', 0.59, 2024),
        ('BL', 'Bottmingen', 0.45, 2024), ('BL', 'Bretzwil', 0.58, 2024), ('BL', 'Brislach', 0.57, 2024), ('BL', 'Bubendorf', 0.60, 2024),
        ('BL', 'Buckten', 0.64, 2024), ('BL', 'Burg i.L.', 0.68, 2024), ('BL', 'Buus', 0.58, 2024), ('BL', 'Böckten', 0.59, 2024),
        ('BL', 'Diegten', 0.56, 2024), ('BL', 'Diepflingen', 0.65, 2024), ('BL', 'Dittingen', 0.64, 2024), ('BL', 'Duggingen', 0.54, 2024),
        ('BL', 'Eptingen', 0.65, 2024), ('BL', 'Ettingen', 0.61, 2024), ('BL', 'Frenkendorf', 0.57, 2024), ('BL', 'Füllinsdorf', 0.60, 2024),
        ('BL', 'Gelterkinden', 0.59, 2024), ('BL', 'Giebenach', 0.55, 2024), ('BL', 'Grellingen', 0.62, 2024), ('BL', 'Hemmiken', 0.67, 2024),
        ('BL', 'Hersberg', 0.59, 2024), ('BL', 'Häfelfingen', 0.61, 2024), ('BL', 'Hölstein', 0.63, 2024), ('BL', 'Itingen', 0.63, 2024),
        ('BL', 'Kilchberg', 0.64, 2024), ('BL', 'Känerkinden', 0.63, 2024), ('BL', 'Lampenberg', 0.62, 2024), ('BL', 'Langenbruck', 0.56, 2024),
        ('BL', 'Laufen', 0.59, 2024), ('BL', 'Lausen', 0.55, 2024), ('BL', 'Lauwil', 0.60, 2024), ('BL', 'Liedertswil', 0.55, 2024),
        ('BL', 'Liesberg', 0.61, 2024), ('BL', 'Liestal', 0.65, 2024), ('BL', 'Lupsingen', 0.58, 2024), ('BL', 'Läufelfingen', 0.64, 2024),
        ('BL', 'Maisprach', 0.56, 2024), ('BL', 'Muttenz', 0.56, 2024), ('BL', 'Münchenstein', 0.60, 2024), ('BL', 'Nenzlingen', 0.62, 2024),
        ('BL', 'Niederdorf', 0.64, 2024), ('BL', 'Nusshof', 0.59, 2024), ('BL', 'Oberdorf', 0.65, 2024), ('BL', 'Oberwil', 0.50, 2024),
        ('BL', 'Oltingen', 0.64, 2024), ('BL', 'Ormalingen', 0.59, 2024), ('BL', 'Pfeffingen', 0.45, 2024), ('BL', 'Pratteln', 0.58, 2024),
        ('BL', 'Ramlinsburg', 0.52, 2024), ('BL', 'Reigoldswil', 0.66, 2024), ('BL', 'Reinach', 0.55, 2024), ('BL', 'Rickenbach', 0.62, 2024),
        ('BL', 'Roggenburg', 0.62, 2024), ('BL', 'Rothenfluh', 0.62, 2024), ('BL', 'Röschenz', 0.58, 2024), ('BL', 'Rümlingen', 0.63, 2024),
        ('BL', 'Rünenberg', 0.62, 2024), ('BL', 'Schönenbuch', 0.52, 2024), ('BL', 'Seltisberg', 0.59, 2024), ('BL', 'Sissach', 0.57, 2024),
        ('BL', 'Tecknau', 0.60, 2024), ('BL', 'Tenniken', 0.60, 2024), ('BL', 'Therwil', 0.52, 2024), ('BL', 'Thürnen', 0.56, 2024),
        ('BL', 'Titterten', 0.65, 2024), ('BL', 'Wahlen', 0.60, 2024), ('BL', 'Waldenburg', 0.69, 2024), ('BL', 'Wenslingen', 0.58, 2024),
        ('BL', 'Wintersingen', 0.56, 2024), ('BL', 'Wittinsburg', 0.63, 2024), ('BL', 'Zeglingen', 0.64, 2024), ('BL', 'Ziefen', 0.63, 2024),
        ('BL', 'Zunzgen', 0.56, 2024), ('BL', 'Zwingen', 0.59, 2024)
        ON CONFLICT (canton, name, tax_year) DO UPDATE SET tax_multiplier = EXCLUDED.tax_multiplier, updated_at = CURRENT_TIMESTAMP
    """)
    print("✓ Seeded 86 Basel-Landschaft municipalities for 2024")

def downgrade():
    op.execute("DELETE FROM swisstax.municipalities WHERE canton = 'BL' AND tax_year = 2024")
    print("✓ Removed BL 2024 municipalities")
