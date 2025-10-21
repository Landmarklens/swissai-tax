"""Seed Solothurn municipalities

Revision ID: 20251018_so_munic
Revises: 20251018_bl_munic
Create Date: 2025-10-18

Source: https://so.ch/fileadmin/internet/vwd/vwd-agem/pdf/Gemeindefinanzen/Statistik/Steuern_und_Gebuehren_2024_online_inkl._Korrekturen.pdf
Canton: Solothurn (SO), Municipalities: 106, Canton rate: 100%
Publication date: April 29, 2024
"""
from alembic import op

revision = '20251018_so_munic'
down_revision = '20251018_bl_munic'

def upgrade():
    op.execute("DELETE FROM swisstax.municipalities WHERE canton = 'SO' AND tax_year = 2024")
    op.execute("""
        INSERT INTO swisstax.municipalities (canton, name, tax_multiplier, tax_year) VALUES
        ('SO', 'Aedermannsdorf', 1.22, 2024), ('SO', 'Aeschi', 1.15, 2024), ('SO', 'Balm bei Günsberg', 1.00, 2024), ('SO', 'Balsthal', 1.25, 2024),
        ('SO', 'Beinwil', 1.25, 2024), ('SO', 'Bellach', 1.25, 2024), ('SO', 'Bettlach', 0.99, 2024), ('SO', 'Biberist', 1.25, 2024),
        ('SO', 'Biezwil', 1.25, 2024), ('SO', 'Bolken', 1.45, 2024), ('SO', 'Boningen', 1.25, 2024), ('SO', 'Breitenbach', 1.13, 2024),
        ('SO', 'Buchegg', 1.10, 2024), ('SO', 'Bärschwil', 1.25, 2024), ('SO', 'Bättwil', 1.22, 2024), ('SO', 'Büren', 1.25, 2024),
        ('SO', 'Büsserach', 1.11, 2024), ('SO', 'Deitingen', 1.22, 2024), ('SO', 'Derendingen', 1.28, 2024), ('SO', 'Dornach', 0.88, 2024),
        ('SO', 'Drei Höfe', 1.15, 2024), ('SO', 'Dulliken', 1.19, 2024), ('SO', 'Däniken', 0.80, 2024), ('SO', 'Egerkingen', 1.12, 2024),
        ('SO', 'Eppenberg-Wöschnau', 0.99, 2024), ('SO', 'Erlinsbach SO', 1.02, 2024), ('SO', 'Erschwil', 1.28, 2024), ('SO', 'Etziken', 1.30, 2024),
        ('SO', 'Fehren', 1.30, 2024), ('SO', 'Feldbrunnen-St. Niklaus', 0.72, 2024), ('SO', 'Flumenthal', 1.25, 2024), ('SO', 'Fulenbach', 1.10, 2024),
        ('SO', 'Gempen', 1.17, 2024), ('SO', 'Gerlafingen', 1.25, 2024), ('SO', 'Grenchen', 1.17, 2024), ('SO', 'Gretzenbach', 1.18, 2024),
        ('SO', 'Grindel', 1.30, 2024), ('SO', 'Gunzgen', 1.08, 2024), ('SO', 'Günsberg', 1.20, 2024), ('SO', 'Halten', 1.20, 2024),
        ('SO', 'Hauenstein-Ifenthal', 1.25, 2024), ('SO', 'Herbetswil', 1.29, 2024), ('SO', 'Himmelried', 1.24, 2024), ('SO', 'Hochwald', 1.16, 2024),
        ('SO', 'Hofstetten-Flüh', 1.10, 2024), ('SO', 'Holderbank', 1.32, 2024), ('SO', 'Horriwil', 1.20, 2024), ('SO', 'Hubersdorf', 1.27, 2024),
        ('SO', 'Hägendorf', 1.07, 2024), ('SO', 'Härkingen', 0.89, 2024), ('SO', 'Hüniken', 1.20, 2024), ('SO', 'Kammersrohr', 0.65, 2024),
        ('SO', 'Kappel', 1.22, 2024), ('SO', 'Kestenholz', 1.17, 2024), ('SO', 'Kienberg', 1.29, 2024), ('SO', 'Kleinlützel', 1.29, 2024),
        ('SO', 'Kriegstetten', 1.19, 2024), ('SO', 'Langendorf', 1.19, 2024), ('SO', 'Laupersdorf', 1.23, 2024), ('SO', 'Lohn-Ammannsegg', 1.00, 2024),
        ('SO', 'Lommiswil', 1.27, 2024), ('SO', 'Lostorf', 1.13, 2024), ('SO', 'Luterbach', 1.23, 2024), ('SO', 'Lüsslingen-Nennigkofen', 1.25, 2024),
        ('SO', 'Lüterkofen-Ichertswil', 1.10, 2024), ('SO', 'Matzendorf', 1.30, 2024), ('SO', 'Meltingen', 1.23, 2024), ('SO', 'Messen', 1.13, 2024),
        ('SO', 'Metzerlen-Mariastein', 1.24, 2024), ('SO', 'Mümliswil-Ramiswil', 1.23, 2024), ('SO', 'Neuendorf', 1.18, 2024), ('SO', 'Niederbuchsiten', 1.07, 2024),
        ('SO', 'Niedergösgen', 1.05, 2024), ('SO', 'Nuglar-St. Pantaleon', 1.21, 2024), ('SO', 'Nunningen', 1.24, 2024), ('SO', 'Oberbuchsiten', 1.07, 2024),
        ('SO', 'Oberdorf', 1.20, 2024), ('SO', 'Obergerlafingen', 1.10, 2024), ('SO', 'Obergösgen', 1.22, 2024), ('SO', 'Oekingen', 1.22, 2024),
        ('SO', 'Oensingen', 1.11, 2024), ('SO', 'Olten', 1.08, 2024), ('SO', 'Recherswil', 1.20, 2024), ('SO', 'Rickenbach', 0.95, 2024),
        ('SO', 'Riedholz', 1.15, 2024), ('SO', 'Rodersdorf', 1.20, 2024), ('SO', 'Rüttenen', 1.18, 2024), ('SO', 'Schnottwil', 1.24, 2024),
        ('SO', 'Schönenwerd', 1.15, 2024), ('SO', 'Seewen', 1.25, 2024), ('SO', 'Selzach', 1.08, 2024), ('SO', 'Solothurn', 1.07, 2024),
        ('SO', 'Starrkirch-Wil', 1.10, 2024), ('SO', 'Stüsslingen', 1.25, 2024), ('SO', 'Subingen', 1.25, 2024), ('SO', 'Trimbach', 1.25, 2024),
        ('SO', 'Unterramsern', 1.05, 2024), ('SO', 'Walterswil', 1.25, 2024), ('SO', 'Wangen bei Olten', 1.19, 2024), ('SO', 'Welschenrohr-Gänsbrunnen', 1.24, 2024),
        ('SO', 'Winznau', 1.21, 2024), ('SO', 'Wisen', 1.25, 2024), ('SO', 'Witterswil', 1.10, 2024), ('SO', 'Wolfwil', 1.17, 2024),
        ('SO', 'Zuchwil', 1.18, 2024), ('SO', 'Zullwil', 1.39, 2024)
        ON CONFLICT (canton, name, tax_year) DO UPDATE SET tax_multiplier = EXCLUDED.tax_multiplier, updated_at = CURRENT_TIMESTAMP
    """)
    print("✓ Seeded 106 Solothurn municipalities for 2024")

def downgrade():
    op.execute("DELETE FROM swisstax.municipalities WHERE canton = 'SO' AND tax_year = 2024")
    print("✓ Removed SO 2024 municipalities")
