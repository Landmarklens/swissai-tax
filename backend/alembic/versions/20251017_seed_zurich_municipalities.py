"""Seed Zurich municipalities with 2024 tax rates

Revision ID: 20251017_seed_zurich_munic
Revises: 20251017_seed_aargau_complete
Create Date: 2025-10-17

This migration seeds all 160 Zurich municipalities with their 2024 tax multipliers.

Data source:
- Official Canton Zurich Statistical Office
- https://www.web.statistik.zh.ch/ogd/data/steuerfuesse/kanton_zuerich_stf_timeseries.csv
- Column: STF_O_KIRCHE1 (base municipal tax rate for natural persons)
- Tax year: 2024
- Range: 0.72 (Kilchberg) to 1.30 (highest)

Note: Canton Zurich reduced cantonal tax rate from 99% to 98% for 2024.
"""
from alembic import op

# revision identifiers, used by Alembic.
revision = '20251017_seed_zurich_munic'
down_revision = '20251017_seed_aargau_complete'
branch_labels = None
depends_on = None


def upgrade():
    """Seed Zurich municipalities (idempotent)"""

    # Delete existing Zurich 2024 data to ensure idempotency
    op.execute("""
        DELETE FROM swisstax.municipalities
        WHERE canton = 'ZH' AND tax_year = 2024
    """)

    # Insert all 160 Zurich municipalities for 2024
    # Tax multipliers are stored as decimals (e.g., 0.92 for 92%, 1.19 for 119%)
    op.execute("""
        INSERT INTO swisstax.municipalities (canton, name, tax_multiplier, tax_year)
        VALUES
        ('ZH', 'Adliswil', 1.0200, 2024),\n        ('ZH', 'Aesch', 0.9100, 2024),\n        ('ZH', 'Aeugst a.A.', 0.9200, 2024),\n        ('ZH', 'Affoltern a.A.', 1.2400, 2024),\n        ('ZH', 'Altikon', 1.1400, 2024),\n        ('ZH', 'Andelfingen', 1.1400, 2024),\n        ('ZH', 'Bachenbülach', 1.0600, 2024),\n        ('ZH', 'Bachs', 1.2800, 2024),\n        ('ZH', 'Bassersdorf', 1.1400, 2024),\n        ('ZH', 'Bauma', 1.2000, 2024),\n        ('ZH', 'Benken', 1.1000, 2024),\n        ('ZH', 'Berg a.I.', 0.9800, 2024),\n        ('ZH', 'Birmensdorf', 1.1200, 2024),\n        ('ZH', 'Bonstetten', 1.1000, 2024),\n        ('ZH', 'Boppelsen', 0.9400, 2024),\n        ('ZH', 'Brütten', 0.8900, 2024),\n        ('ZH', 'Bubikon', 1.1800, 2024),\n        ('ZH', 'Buch a.I.', 1.0600, 2024),\n        ('ZH', 'Buchs', 1.0500, 2024),\n        ('ZH', 'Bäretswil', 1.0600, 2024),\n        ('ZH', 'Bülach', 1.1000, 2024),\n        ('ZH', 'Dachsen', 1.1100, 2024),\n        ('ZH', 'Dielsdorf', 1.0500, 2024),\n        ('ZH', 'Dietikon', 1.2300, 2024),\n        ('ZH', 'Dietlikon', 1.0500, 2024),\n        ('ZH', 'Dinhard', 0.8300, 2024),\n        ('ZH', 'Dorf', 1.0400, 2024),\n        ('ZH', 'Dägerlen', 1.0500, 2024),\n        ('ZH', 'Dällikon', 1.0800, 2024),\n        ('ZH', 'Dänikon', 1.2200, 2024),\n        ('ZH', 'Dättlikon', 1.1600, 2024),\n        ('ZH', 'Dübendorf', 0.9600, 2024),\n        ('ZH', 'Dürnten', 1.1300, 2024),\n        ('ZH', 'Egg', 1.0100, 2024),\n        ('ZH', 'Eglisau', 1.1300, 2024),\n        ('ZH', 'Elgg', 1.1900, 2024),\n        ('ZH', 'Ellikon a.d.Th.', 1.1500, 2024),\n        ('ZH', 'Elsau', 1.2000, 2024),\n        ('ZH', 'Embrach', 1.1400, 2024),\n        ('ZH', 'Erlenbach', 0.7600, 2024),\n        ('ZH', 'Fehraltorf', 1.0900, 2024),\n        ('ZH', 'Feuerthalen', 1.1400, 2024),\n        ('ZH', 'Fischenthal', 1.2200, 2024),\n        ('ZH', 'Flaach', 1.0700, 2024),\n        ('ZH', 'Flurlingen', 1.1100, 2024),\n        ('ZH', 'Freienstein-Teufen', 0.9900, 2024),\n        ('ZH', 'Fällanden', 0.9900, 2024),\n        ('ZH', 'Geroldswil', 1.1000, 2024),\n        ('ZH', 'Glattfelden', 1.2000, 2024),\n        ('ZH', 'Gossau', 1.1700, 2024),\n        ('ZH', 'Greifensee', 0.9400, 2024),\n        ('ZH', 'Grüningen', 1.1300, 2024),\n        ('ZH', 'Hagenbuch', 1.1800, 2024),\n        ('ZH', 'Hausen a.A.', 1.1200, 2024),\n        ('ZH', 'Hedingen', 1.0000, 2024),\n        ('ZH', 'Henggart', 1.0200, 2024),\n        ('ZH', 'Herrliberg', 0.7500, 2024),\n        ('ZH', 'Hettlingen', 0.9600, 2024),\n        ('ZH', 'Hinwil', 1.1200, 2024),\n        ('ZH', 'Hittnau', 1.1300, 2024),\n        ('ZH', 'Hochfelden', 1.1600, 2024),\n        ('ZH', 'Hombrechtikon', 1.1300, 2024),\n        ('ZH', 'Horgen', 0.9000, 2024),\n        ('ZH', 'Höri', 1.1000, 2024),\n        ('ZH', 'Hüntwangen', 1.0800, 2024),\n        ('ZH', 'Hüttikon', 1.1500, 2024),\n        ('ZH', 'Illnau-Effretikon', 1.1000, 2024),\n        ('ZH', 'Kappel a.A.', 1.0200, 2024),\n        ('ZH', 'Kilchberg', 0.7200, 2024),\n        ('ZH', 'Kleinandelfingen', 1.1200, 2024),\n        ('ZH', 'Kloten', 1.0300, 2024),\n        ('ZH', 'Knonau', 1.1600, 2024),\n        ('ZH', 'Küsnacht', 0.7300, 2024),\n        ('ZH', 'Langnau a.A.', 1.0600, 2024),\n        ('ZH', 'Laufen-Uhwiesen', 1.0400, 2024),\n        ('ZH', 'Lindau', 1.0600, 2024),\n        ('ZH', 'Lufingen', 0.9200, 2024),\n        ('ZH', 'Marthalen', 1.0700, 2024),\n        ('ZH', 'Maschwanden', 1.3000, 2024),\n        ('ZH', 'Maur', 0.8500, 2024),\n        ('ZH', 'Meilen', 0.7900, 2024),\n        ('ZH', 'Mettmenstetten', 0.9800, 2024),\n        ('ZH', 'Männedorf', 0.9300, 2024),\n        ('ZH', 'Mönchaltorf', 1.0800, 2024),\n        ('ZH', 'Neerach', 0.7700, 2024),\n        ('ZH', 'Neftenbach', 1.0500, 2024),\n        ('ZH', 'Niederglatt', 1.0600, 2024),\n        ('ZH', 'Niederhasli', 1.1200, 2024),\n        ('ZH', 'Niederweningen', 1.0200, 2024),\n        ('ZH', 'Nürensdorf', 0.9000, 2024),\n        ('ZH', 'Oberembrach', 1.2200, 2024),\n        ('ZH', 'Oberengstringen', 1.0900, 2024),\n        ('ZH', 'Oberglatt', 1.1700, 2024),\n        ('ZH', 'Oberrieden', 0.8800, 2024),\n        ('ZH', 'Oberweningen', 0.9600, 2024),\n        ('ZH', 'Obfelden', 1.2100, 2024),\n        ('ZH', 'Oetwil a.S.', 1.1600, 2024),\n        ('ZH', 'Oetwil a.d.L.', 1.0500, 2024),\n        ('ZH', 'Opfikon', 0.9400, 2024),\n        ('ZH', 'Ossingen', 0.9900, 2024),\n        ('ZH', 'Otelfingen', 1.1200, 2024),\n        ('ZH', 'Ottenbach', 1.1700, 2024),\n        ('ZH', 'Pfungen', 1.1700, 2024),\n        ('ZH', 'Pfäffikon', 1.1000, 2024),\n        ('ZH', 'Rafz', 1.1300, 2024),\n        ('ZH', 'Regensberg', 1.1100, 2024),\n        ('ZH', 'Regensdorf', 1.1800, 2024),\n        ('ZH', 'Rheinau', 1.1400, 2024),\n        ('ZH', 'Richterswil', 0.9900, 2024),\n        ('ZH', 'Rickenbach', 1.0200, 2024),\n        ('ZH', 'Rifferswil', 1.2200, 2024),\n        ('ZH', 'Rorbas', 1.0300, 2024),\n        ('ZH', 'Russikon', 1.1300, 2024),\n        ('ZH', 'Rümlang', 1.0900, 2024),\n        ('ZH', 'Rüschlikon', 0.7500, 2024),\n        ('ZH', 'Rüti', 1.1900, 2024),\n        ('ZH', 'Schlatt', 1.2500, 2024),\n        ('ZH', 'Schleinikon', 1.0800, 2024),\n        ('ZH', 'Schlieren', 1.1100, 2024),\n        ('ZH', 'Schwerzenbach', 1.0100, 2024),\n        ('ZH', 'Schöfflisdorf', 0.9900, 2024),\n        ('ZH', 'Seegräben', 1.1300, 2024),\n        ('ZH', 'Seuzach', 0.9900, 2024),\n        ('ZH', 'Stadel', 1.1300, 2024),\n        ('ZH', 'Stallikon', 1.0200, 2024),\n        ('ZH', 'Stammheim', 1.1400, 2024),\n        ('ZH', 'Steinmaur', 1.1200, 2024),\n        ('ZH', 'Stäfa', 0.7800, 2024),\n        ('ZH', 'Thalheim a.d.Th.', 1.0800, 2024),\n        ('ZH', 'Thalwil', 0.8300, 2024),\n        ('ZH', 'Truttikon', 1.0900, 2024),\n        ('ZH', 'Trüllikon', 1.1000, 2024),\n        ('ZH', 'Turbenthal', 1.2200, 2024),\n        ('ZH', 'Uetikon a.S.', 0.8400, 2024),\n        ('ZH', 'Uitikon', 0.8000, 2024),\n        ('ZH', 'Unterengstringen', 1.0000, 2024),\n        ('ZH', 'Urdorf', 1.1500, 2024),\n        ('ZH', 'Uster', 1.1200, 2024),\n        ('ZH', 'Volken', 1.1100, 2024),\n        ('ZH', 'Volketswil', 1.0100, 2024),\n        ('ZH', 'Wald', 1.2200, 2024),\n        ('ZH', 'Wallisellen', 0.9500, 2024),\n        ('ZH', 'Wangen-Brüttisellen', 1.0100, 2024),\n        ('ZH', 'Wasterkingen', 1.1600, 2024),\n        ('ZH', 'Weiach', 0.9600, 2024),\n        ('ZH', 'Weiningen', 1.0300, 2024),\n        ('ZH', 'Weisslingen', 1.1600, 2024),\n        ('ZH', 'Wettswil a.A.', 0.9000, 2024),\n        ('ZH', 'Wetzikon', 1.1900, 2024),\n        ('ZH', 'Wiesendangen', 0.8800, 2024),\n        ('ZH', 'Wil', 0.9900, 2024),\n        ('ZH', 'Wila', 1.2500, 2024),\n        ('ZH', 'Wildberg', 1.2700, 2024),\n        ('ZH', 'Winkel', 0.7600, 2024),\n        ('ZH', 'Winterthur', 1.2500, 2024),\n        ('ZH', 'Wädenswil', 1.0400, 2024),\n        ('ZH', 'Zell', 1.1800, 2024),\n        ('ZH', 'Zollikon', 0.7600, 2024),\n        ('ZH', 'Zumikon', 0.7700, 2024),\n        ('ZH', 'Zürich', 1.1900, 2024)

        ON CONFLICT (canton, name, tax_year) DO UPDATE SET
            tax_multiplier = EXCLUDED.tax_multiplier,
            updated_at = CURRENT_TIMESTAMP
    """)


def downgrade():
    """Remove Zurich 2024 seeded data"""
    op.execute("""
        DELETE FROM swisstax.municipalities
        WHERE canton = 'ZH' AND tax_year = 2024
    """)
