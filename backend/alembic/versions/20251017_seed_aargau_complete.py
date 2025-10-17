"""Seed ALL 197 Aargau municipalities with 2024 tax rates - COMPLETE DATASET

Revision ID: 20251017_seed_aargau_complete
Revises: 20251017_municipalities
Create Date: 2025-10-17

This migration replaces the previous partial Aargau dataset (47 municipalities)
with the COMPLETE official dataset of all 197 Aargau municipalities.

Data source:
- Official Canton Aargau Department of Finance
- https://www.ag.ch/media/kanton-aargau/dfr/dokumente/steuern/natuerliche-personen/
  steuerberechnung-tarife-natuerliche-personen/gemeinde-und-kirchensteuerf-sse-2024-v6a.pdf
- Document: "VERZEICHNIS DER GEMEINDE- UND KIRCHENSTEUERFÜSSE für das Jahr 2024"
- Canton tax rate (Steuerfuss Kanton): 112%
- Tax year: 2024
- Coverage: 100% (all 197 municipalities)
- Range: 48% (Oberwil-Lieli) to 127% (Mellikon, Hallwil, Tägerig)
- Median: 102%
"""
from alembic import op

# revision identifiers, used by Alembic.
revision = '20251017_seed_aargau_complete'
down_revision = '20251017_municipalities'
branch_labels = None
depends_on = None


def upgrade():
    """Seed all 197 Aargau municipalities (idempotent) - replaces partial dataset"""

    # Delete ALL existing Aargau 2024 data to ensure clean replacement
    op.execute("""
        DELETE FROM swisstax.municipalities
        WHERE canton = 'AG' AND tax_year = 2024
    """)

    # Insert ALL 197 Aargau municipalities for 2024
    # Tax multipliers are stored as decimals (e.g., 0.48 for 48%, 0.96 for 96%)
    op.execute("""
        INSERT INTO swisstax.municipalities (canton, name, tax_multiplier, tax_year)
        VALUES
        ('AG', 'Aarau', 0.9600, 2024),\n        ('AG', 'Aarburg', 1.1600, 2024),\n        ('AG', 'Abtwil', 1.1300, 2024),\n        ('AG', 'Ammerswil', 1.0900, 2024),\n        ('AG', 'Aristau', 1.0900, 2024),\n        ('AG', 'Arni (AG)', 0.8300, 2024),\n        ('AG', 'Auenstein', 0.9300, 2024),\n        ('AG', 'Auw', 1.0600, 2024),\n        ('AG', 'Baden', 0.9200, 2024),\n        ('AG', 'Beinwil (Freiamt)', 0.9800, 2024),\n        ('AG', 'Beinwil am See', 1.0200, 2024),\n        ('AG', 'Bellikon', 0.8900, 2024),\n        ('AG', 'Bergdietikon', 0.8400, 2024),\n        ('AG', 'Berikon', 0.8900, 2024),\n        ('AG', 'Besenbüren', 1.1300, 2024),\n        ('AG', 'Bettwil', 1.0200, 2024),\n        ('AG', 'Biberstein', 0.9200, 2024),\n        ('AG', 'Birmenstorf (AG)', 0.9800, 2024),\n        ('AG', 'Birr', 1.1700, 2024),\n        ('AG', 'Birrhard', 1.0900, 2024),\n        ('AG', 'Birrwil', 0.9500, 2024),\n        ('AG', 'Boniswil', 1.0500, 2024),\n        ('AG', 'Boswil', 1.0100, 2024),\n        ('AG', 'Bottenwil', 1.1900, 2024),\n        ('AG', 'Bremgarten (AG)', 0.9700, 2024),\n        ('AG', 'Brittnau', 1.1400, 2024),\n        ('AG', 'Brugg (AG)', 0.9700, 2024),\n        ('AG', 'Brunegg', 1.0500, 2024),\n        ('AG', 'Buchs (AG)', 1.1800, 2024),\n        ('AG', 'Buttwil', 1.0200, 2024),\n        ('AG', 'Böttstein', 1.0700, 2024),\n        ('AG', 'Bözberg', 0.9600, 2024),\n        ('AG', 'Böztal', 1.1400, 2024),\n        ('AG', 'Bünzen', 1.1000, 2024),\n        ('AG', 'Büttikon', 0.9600, 2024),\n        ('AG', 'Densbüren', 1.1700, 2024),\n        ('AG', 'Dietwil', 1.0400, 2024),\n        ('AG', 'Dintikon', 0.9800, 2024),\n        ('AG', 'Dottikon', 0.9200, 2024),\n        ('AG', 'Döttingen', 1.1000, 2024),\n        ('AG', 'Dürrenäsch', 1.1800, 2024),\n        ('AG', 'Eggenwil', 1.0600, 2024),\n        ('AG', 'Egliswil', 1.0500, 2024),\n        ('AG', 'Ehrendingen', 1.0800, 2024),\n        ('AG', 'Eiken', 1.1100, 2024),\n        ('AG', 'Endingen', 1.1100, 2024),\n        ('AG', 'Ennetbaden', 0.9200, 2024),\n        ('AG', 'Erlinsbach (AG)', 0.8900, 2024),\n        ('AG', 'Fahrwangen', 1.1800, 2024),\n        ('AG', 'Fischbach-Göslikon', 1.0900, 2024),\n        ('AG', 'Fisibach', 1.1500, 2024),\n        ('AG', 'Fislisbach', 1.0900, 2024),\n        ('AG', 'Freienwil', 1.1400, 2024),\n        ('AG', 'Frick', 1.0200, 2024),\n        ('AG', 'Full-Reuenthal', 1.2200, 2024),\n        ('AG', 'Gansingen', 1.2000, 2024),\n        ('AG', 'Gebenstorf', 1.0500, 2024),\n        ('AG', 'Geltwil', 0.5000, 2024),\n        ('AG', 'Gipf-Oberfrick', 0.9700, 2024),\n        ('AG', 'Gontenschwil', 1.1700, 2024),\n        ('AG', 'Gränichen', 1.1100, 2024),\n        ('AG', 'Habsburg', 0.8200, 2024),\n        ('AG', 'Hallwil', 1.2700, 2024),\n        ('AG', 'Hausen (AG)', 1.1000, 2024),\n        ('AG', 'Hellikon', 1.2000, 2024),\n        ('AG', 'Hendschiken', 1.2500, 2024),\n        ('AG', 'Herznach-Ueken', 1.1000, 2024),\n        ('AG', 'Hirschthal', 1.0000, 2024),\n        ('AG', 'Holderbank (AG)', 0.9800, 2024),\n        ('AG', 'Holziken', 1.0600, 2024),\n        ('AG', 'Hunzenschwil', 1.0200, 2024),\n        ('AG', 'Hägglingen', 1.1400, 2024),\n        ('AG', 'Islisberg', 0.9200, 2024),\n        ('AG', 'Jonen', 0.8700, 2024),\n        ('AG', 'Kaiseraugst', 0.6000, 2024),\n        ('AG', 'Kaisten', 1.0200, 2024),\n        ('AG', 'Kallern', 1.0200, 2024),\n        ('AG', 'Killwangen', 1.0500, 2024),\n        ('AG', 'Kirchleerau', 1.2300, 2024),\n        ('AG', 'Klingnau', 1.1400, 2024),\n        ('AG', 'Koblenz', 1.1800, 2024),\n        ('AG', 'Kölliken', 1.1400, 2024),\n        ('AG', 'Künten', 1.0400, 2024),\n        ('AG', 'Küttigen', 1.0000, 2024),\n        ('AG', 'Laufenburg', 1.0800, 2024),\n        ('AG', 'Leibstadt', 1.0200, 2024),\n        ('AG', 'Leimbach (AG)', 1.2200, 2024),\n        ('AG', 'Lengnau (AG)', 1.0300, 2024),\n        ('AG', 'Lenzburg', 1.0500, 2024),\n        ('AG', 'Leuggern', 1.0700, 2024),\n        ('AG', 'Leutwil', 1.2100, 2024),\n        ('AG', 'Lupfig', 1.1000, 2024),\n        ('AG', 'Magden', 0.9500, 2024),\n        ('AG', 'Mandach', 1.1700, 2024),\n        ('AG', 'Meisterschwanden', 0.6000, 2024),\n        ('AG', 'Mellikon', 1.2700, 2024),\n        ('AG', 'Mellingen', 1.1000, 2024),\n        ('AG', 'Menziken', 1.1800, 2024),\n        ('AG', 'Merenschwand', 0.9600, 2024),\n        ('AG', 'Mettauertal', 1.0900, 2024),\n        ('AG', 'Moosleerau', 1.2300, 2024),\n        ('AG', 'Muhen', 1.1200, 2024),\n        ('AG', 'Mumpf', 1.1900, 2024),\n        ('AG', 'Murgenthal', 1.1500, 2024),\n        ('AG', 'Muri (AG)', 1.0200, 2024),\n        ('AG', 'Mägenwil', 1.1300, 2024),\n        ('AG', 'Möhlin', 1.1200, 2024),\n        ('AG', 'Mönthal', 1.1500, 2024),\n        ('AG', 'Möriken-Wildegg', 0.9400, 2024),\n        ('AG', 'Mühlau', 1.1700, 2024),\n        ('AG', 'Mülligen', 1.0900, 2024),\n        ('AG', 'Münchwilen (AG)', 1.1300, 2024),\n        ('AG', 'Neuenhof', 1.1200, 2024),\n        ('AG', 'Niederlenz', 1.1700, 2024),\n        ('AG', 'Niederrohrdorf', 0.9700, 2024),\n        ('AG', 'Niederwil (AG)', 1.0300, 2024),\n        ('AG', 'Oberentfelden', 1.1000, 2024),\n        ('AG', 'Oberhof', 1.2500, 2024),\n        ('AG', 'Oberkulm', 1.1900, 2024),\n        ('AG', 'Oberlunkhofen', 0.7400, 2024),\n        ('AG', 'Obermumpf', 1.2200, 2024),\n        ('AG', 'Oberrohrdorf', 0.8500, 2024),\n        ('AG', 'Oberrüti', 1.1400, 2024),\n        ('AG', 'Obersiggenthal', 1.1000, 2024),\n        ('AG', 'Oberwil-Lieli', 0.4800, 2024),\n        ('AG', 'Oeschgen', 1.1400, 2024),\n        ('AG', 'Oftringen', 1.1300, 2024),\n        ('AG', 'Olsberg', 0.9200, 2024),\n        ('AG', 'Othmarsingen', 1.0400, 2024),\n        ('AG', 'Reinach (AG)', 1.1500, 2024),\n        ('AG', 'Reitnau', 1.2200, 2024),\n        ('AG', 'Remetschwil', 0.9200, 2024),\n        ('AG', 'Remigen', 0.9800, 2024),\n        ('AG', 'Rheinfelden', 0.9000, 2024),\n        ('AG', 'Riniken', 1.1900, 2024),\n        ('AG', 'Rothrist', 1.1000, 2024),\n        ('AG', 'Rottenschwil', 0.9900, 2024),\n        ('AG', 'Rudolfstetten-Friedlisberg', 0.9500, 2024),\n        ('AG', 'Rupperswil', 0.9900, 2024),\n        ('AG', 'Rüfenach', 1.1800, 2024),\n        ('AG', 'Safenwil', 1.1500, 2024),\n        ('AG', 'Sarmenstorf', 1.0500, 2024),\n        ('AG', 'Schafisheim', 0.9900, 2024),\n        ('AG', 'Schinznach', 1.1000, 2024),\n        ('AG', 'Schlossrued', 1.2000, 2024),\n        ('AG', 'Schmiedrued', 1.2000, 2024),\n        ('AG', 'Schneisingen', 1.1500, 2024),\n        ('AG', 'Schupfart', 1.1000, 2024),\n        ('AG', 'Schwaderloch', 1.2300, 2024),\n        ('AG', 'Schöftland', 1.0300, 2024),\n        ('AG', 'Seengen', 0.7200, 2024),\n        ('AG', 'Seon', 1.0800, 2024),\n        ('AG', 'Siglistorf', 1.2100, 2024),\n        ('AG', 'Sins', 0.9800, 2024),\n        ('AG', 'Sisseln', 0.8000, 2024),\n        ('AG', 'Spreitenbach', 1.0000, 2024),\n        ('AG', 'Staffelbach', 1.1900, 2024),\n        ('AG', 'Staufen', 0.8200, 2024),\n        ('AG', 'Stein (AG)', 0.8800, 2024),\n        ('AG', 'Stetten (AG)', 1.0500, 2024),\n        ('AG', 'Strengelbach', 1.0300, 2024),\n        ('AG', 'Suhr', 1.1200, 2024),\n        ('AG', 'Tegerfelden', 1.0700, 2024),\n        ('AG', 'Teufenthal (AG)', 1.2200, 2024),\n        ('AG', 'Thalheim (AG)', 1.0900, 2024),\n        ('AG', 'Tägerig', 1.2700, 2024),\n        ('AG', 'Uerkheim', 1.1900, 2024),\n        ('AG', 'Uezwil', 1.0600, 2024),\n        ('AG', 'Unterentfelden', 1.1300, 2024),\n        ('AG', 'Unterkulm', 1.1500, 2024),\n        ('AG', 'Unterlunkhofen', 0.6900, 2024),\n        ('AG', 'Untersiggenthal', 1.0500, 2024),\n        ('AG', 'Veltheim (AG)', 1.0500, 2024),\n        ('AG', 'Villigen', 0.8700, 2024),\n        ('AG', 'Villmergen', 1.0200, 2024),\n        ('AG', 'Villnachern', 1.2000, 2024),\n        ('AG', 'Vordemwald', 1.1800, 2024),\n        ('AG', 'Wallbach', 0.9500, 2024),\n        ('AG', 'Waltenschwil', 1.0600, 2024),\n        ('AG', 'Wegenstetten', 1.1800, 2024),\n        ('AG', 'Wettingen', 0.9500, 2024),\n        ('AG', 'Widen', 0.7500, 2024),\n        ('AG', 'Wiliberg', 1.0900, 2024),\n        ('AG', 'Windisch', 1.1500, 2024),\n        ('AG', 'Wittnau', 1.1900, 2024),\n        ('AG', 'Wohlen (AG)', 1.1600, 2024),\n        ('AG', 'Wohlenschwil', 1.1600, 2024),\n        ('AG', 'Wölflinswil', 1.2500, 2024),\n        ('AG', 'Würenlingen', 1.0000, 2024),\n        ('AG', 'Würenlos', 0.9900, 2024),\n        ('AG', 'Zeihen', 1.1400, 2024),\n        ('AG', 'Zeiningen', 1.1200, 2024),\n        ('AG', 'Zetzwil', 1.1800, 2024),\n        ('AG', 'Zofingen', 0.9900, 2024),\n        ('AG', 'Zufikon', 0.7900, 2024),\n        ('AG', 'Zurzach', 1.1500, 2024),\n        ('AG', 'Zuzgen', 1.1500, 2024)

        ON CONFLICT (canton, name, tax_year) DO UPDATE SET
            tax_multiplier = EXCLUDED.tax_multiplier,
            updated_at = CURRENT_TIMESTAMP
    """)


def downgrade():
    """Remove complete Aargau 2024 dataset"""
    op.execute("""
        DELETE FROM swisstax.municipalities
        WHERE canton = 'AG' AND tax_year = 2024
    """)
