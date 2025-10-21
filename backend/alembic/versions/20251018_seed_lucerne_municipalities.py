"""Seed Lucerne municipalities

Revision ID: 20251018_lu_munic
Revises: 20251018_ge_munic
Create Date: 2025-10-18

Source: https://steuern.lu.ch/-/media/Steuern/Dokumente/Publikationen/2024/Steuereinheiten_2024_NP.pdf
Tax year: 2024
Canton: Lucerne (LU)
Municipalities: 80

Note: Lucerne uses "Einheiten" (units) multiplier system
Canton: 1.60 Einheiten
Municipal rates (Einheiten) from official PDF
Formula: Total Tax = Simple Tax × (Canton Units + Municipal Units)
"""
from alembic import op

revision = '20251018_lu_munic'
down_revision = '20251018_ge_munic'

def upgrade():
    """Seed 80 Lucerne municipalities with 2024 tax rates (Einheiten)."""
    # Delete existing LU 2024 data for idempotency
    op.execute("DELETE FROM swisstax.municipalities WHERE canton = 'LU' AND tax_year = 2024")

    # Insert all 80 municipalities
    # Municipal rates are "Einheiten" (units) - multipliers for simple tax
    op.execute("""
        INSERT INTO swisstax.municipalities (canton, name, tax_multiplier, tax_year) VALUES
        ('LU', 'Adligenswil', 1.95, 2024),
        ('LU', 'Aesch', 1.80, 2024),
        ('LU', 'Alberswil', 2.05, 2024),
        ('LU', 'Altbüron', 2.40, 2024),
        ('LU', 'Altishofen', 1.70, 2024),
        ('LU', 'Ballwil', 1.50, 2024),
        ('LU', 'Beromünster', 1.85, 2024),
        ('LU', 'Buchrain', 1.95, 2024),
        ('LU', 'Büron', 2.00, 2024),
        ('LU', 'Buttisholz', 1.90, 2024),
        ('LU', 'Dagmersellen', 1.75, 2024),
        ('LU', 'Dierikon', 1.85, 2024),
        ('LU', 'Doppleschwand', 2.30, 2024),
        ('LU', 'Ebikon', 2.05, 2024),
        ('LU', 'Egolzwil', 2.05, 2024),
        ('LU', 'Eich', 1.10, 2024),
        ('LU', 'Emmen', 2.15, 2024),
        ('LU', 'Entlebuch', 2.10, 2024),
        ('LU', 'Ermensee', 1.95, 2024),
        ('LU', 'Eschenbach', 1.40, 2024),
        ('LU', 'Escholzmatt-Marbach', 2.00, 2024),
        ('LU', 'Ettiswil', 2.15, 2024),
        ('LU', 'Fischbach', 2.20, 2024),
        ('LU', 'Flühli', 2.20, 2024),
        ('LU', 'Geuensee', 2.05, 2024),
        ('LU', 'Gisikon', 1.60, 2024),
        ('LU', 'Greppen', 1.75, 2024),
        ('LU', 'Grossdietwil', 2.30, 2024),
        ('LU', 'Grosswangen', 1.85, 2024),
        ('LU', 'Hasle', 2.30, 2024),
        ('LU', 'Hergiswil', 2.00, 2024),
        ('LU', 'Hildisrieden', 1.50, 2024),
        ('LU', 'Hitzkirch', 1.80, 2024),
        ('LU', 'Hochdorf', 1.90, 2024),
        ('LU', 'Hohenrain', 2.15, 2024),
        ('LU', 'Honau', 1.80, 2024),
        ('LU', 'Horw', 1.45, 2024),
        ('LU', 'Inwil', 1.70, 2024),
        ('LU', 'Knutwil', 2.15, 2024),
        ('LU', 'Kriens', 1.90, 2024),
        ('LU', 'Luthern', 2.40, 2024),
        ('LU', 'Luzern', 1.65, 2024),
        ('LU', 'Malters', 1.95, 2024),
        ('LU', 'Mauensee', 1.90, 2024),
        ('LU', 'Meggen', 0.90, 2024),
        ('LU', 'Meierskappel', 2.00, 2024),
        ('LU', 'Menznau', 1.95, 2024),
        ('LU', 'Nebikon', 1.80, 2024),
        ('LU', 'Neuenkirch', 1.85, 2024),
        ('LU', 'Nottwil', 1.85, 2024),
        ('LU', 'Oberkirch', 1.55, 2024),
        ('LU', 'Pfaffnau', 2.20, 2024),
        ('LU', 'Rain', 1.70, 2024),
        ('LU', 'Reiden', 2.20, 2024),
        ('LU', 'Rickenbach', 1.80, 2024),
        ('LU', 'Roggliswil', 2.10, 2024),
        ('LU', 'Römerswil', 2.10, 2024),
        ('LU', 'Romoos', 2.20, 2024),
        ('LU', 'Root', 1.50, 2024),
        ('LU', 'Rothenburg', 1.65, 2024),
        ('LU', 'Ruswil', 2.00, 2024),
        ('LU', 'Schenkon', 1.10, 2024),
        ('LU', 'Schlierbach', 1.65, 2024),
        ('LU', 'Schongau', 2.10, 2024),
        ('LU', 'Schötz', 2.15, 2024),
        ('LU', 'Schüpfheim', 2.20, 2024),
        ('LU', 'Schwarzenberg', 2.10, 2024),
        ('LU', 'Sempach', 1.70, 2024),
        ('LU', 'Sursee', 1.75, 2024),
        ('LU', 'Triengen', 1.90, 2024),
        ('LU', 'Udligenswil', 1.85, 2024),
        ('LU', 'Ufhusen', 2.20, 2024),
        ('LU', 'Vitznau', 1.40, 2024),
        ('LU', 'Wauwil', 2.05, 2024),
        ('LU', 'Weggis', 1.35, 2024),
        ('LU', 'Werthenstein', 2.15, 2024),
        ('LU', 'Wikon', 2.30, 2024),
        ('LU', 'Willisau', 2.10, 2024),
        ('LU', 'Wolhusen', 2.30, 2024),
        ('LU', 'Zell', 1.90, 2024)
        ON CONFLICT (canton, name, tax_year)
        DO UPDATE SET
            tax_multiplier = EXCLUDED.tax_multiplier,
            updated_at = CURRENT_TIMESTAMP
    """)

    print("✓ Seeded 80 Lucerne municipalities for 2024")

def downgrade():
    """Remove Lucerne 2024 municipality data."""
    op.execute("DELETE FROM swisstax.municipalities WHERE canton = 'LU' AND tax_year = 2024")
    print("✓ Removed Lucerne 2024 municipalities")
