"""Seed Valais municipalities

Revision ID: 20251018_vs_munic
Revises: 20251018_ti_munic
Create Date: 2025-10-18

Source: https://www.vs.ch/web/scc/baremes-canton-communes (Coefficients et Indexations des Communes 2022-2027)
Canton: Valais (VS) / Wallis, Municipalities: 121, Canton indexation: 167%
Bilingual canton (French/German). Unique dual-multiplier system:
- Fixed canton indexation: 167% (applies to all)
- Variable municipal: coefficient (1.00-1.45) × indexation (110%-176%) per municipality
- Stored multiplier = municipal_coefficient × (municipal_indexation / 100)
Example: Sion has coefficient 1.10 and indexation 173%, so multiplier = 1.10 × 1.73 = 1.903
"""
from alembic import op

revision = '20251018_vs_munic'
down_revision = '20251018_ti_munic'

def upgrade():
    op.execute("DELETE FROM swisstax.municipalities WHERE canton = 'VS' AND tax_year = 2024")
    op.execute("""
        INSERT INTO swisstax.municipalities (canton, name, tax_multiplier, tax_year) VALUES
        ('VS', 'Bellwald', 2.08, 2024), ('VS', 'Binn', 1.84, 2024), ('VS', 'Ernen (Ausserbinn, Ernen, Mühlebach, Steinhaus)', 1.71, 2024), ('VS', 'Fiesch', 1.84, 2024),
        ('VS', 'Fieschertal', 1.90, 2024), ('VS', 'Lax', 2.28, 2024), ('VS', 'Obergoms (Obergesteln-Oberwald-Ulrichen)', 1.90, 2024), ('VS', 'Bettmeralp (Betten-Martisberg)', 1.60, 2024),
        ('VS', 'Bister', 1.73, 2024), ('VS', 'Bitsch', 1.73, 2024), ('VS', 'Grengiols', 1.86, 2024), ('VS', 'Mörel-Filet (01.01.2009)', 1.61, 2024),
        ('VS', 'Riederalp (Greich, Goppisberg, Ried-Mörel)', 1.66, 2024), ('VS', 'Brig/Glis', 1.73, 2024), ('VS', 'Eggerberg', 1.73, 2024), ('VS', 'Naters (Birgisch, Mund, Naters / 1.1.2013)', 1.90, 2024),
        ('VS', 'Ried-Brig', 1.76, 2024), ('VS', 'Simplon', 1.73, 2024), ('VS', 'Termen', 2.08, 2024), ('VS', 'Zwischbergen', 1.73, 2024),
        ('VS', 'Baltschieder', 1.96, 2024), ('VS', 'Eisten', 1.73, 2024), ('VS', 'Embd', 2.02, 2024), ('VS', 'Grächen', 1.79, 2024),
        ('VS', 'Lalden', 1.86, 2024), ('VS', 'Randa', 1.90, 2024), ('VS', 'Saas-Almagell', 1.56, 2024), ('VS', 'Saas-Balen', 1.80, 2024),
        ('VS', 'Saas-Fee', 1.62, 2024), ('VS', 'Saas-Grund', 1.69, 2024), ('VS', 'St. Niklaus', 1.92, 2024), ('VS', 'Stalden', 1.85, 2024),
        ('VS', 'Staldenried', 1.90, 2024), ('VS', 'Täsch', 1.80, 2024), ('VS', 'Törbel', 2.42, 2024), ('VS', 'Visp', 1.79, 2024),
        ('VS', 'Visperterminen', 1.95, 2024), ('VS', 'Zeneggen', 1.92, 2024), ('VS', 'Zermatt', 1.90, 2024), ('VS', 'Ausserberg', 1.93, 2024),
        ('VS', 'Blatten', 1.86, 2024), ('VS', 'Bürchen', 1.86, 2024), ('VS', 'Eischoll', 1.86, 2024), ('VS', 'Ferden', 2.07, 2024),
        ('VS', 'Kippel', 1.86, 2024), ('VS', 'Niedergesteln', 1.84, 2024), ('VS', 'Raron', 1.98, 2024), ('VS', 'Steg-Hohtenn (01.01.2009)', 1.84, 2024),
        ('VS', 'Unterbäch', 1.66, 2024), ('VS', 'Wiler', 2.00, 2024), ('VS', 'Agarn', 1.99, 2024), ('VS', 'Albinen', 1.89, 2024),
        ('VS', 'Ergisch', 1.73, 2024), ('VS', 'Gampel-Bratsch (01.01.2009)', 1.92, 2024), ('VS', 'Guttet-Feschel (01.10.2000)', 1.89, 2024), ('VS', 'Inden', 1.46, 2024),
        ('VS', 'Leuk (Erschmatt, Leuk / 1.1.2013)', 1.99, 2024), ('VS', 'Leukerbad', 2.15, 2024), ('VS', 'Oberems', 1.73, 2024), ('VS', 'Salgesch', 1.60, 2024),
        ('VS', 'Turtmann - Unterems (1.1.2013)', 1.96, 2024), ('VS', 'Varen', 1.84, 2024), ('VS', 'Chalais', 1.86, 2024), ('VS', 'Chippis', 1.72, 2024),
        ('VS', 'Grône', 1.75, 2024), ('VS', 'Icogne', 2.08, 2024), ('VS', 'Lens', 1.82, 2024), ('VS', 'Crans-Montana ( Chermignon, Montana, Randogne Mollens)', 1.99, 2024),
        ('VS', 'St- Léonard', 1.86, 2024), ('VS', 'Sierre', 1.90, 2024), ('VS', 'Noble-Contrée (Miège - Venthône - Veyras / 1.1.2021)', 1.79, 2024), ('VS', 'Anniviers (Ayer-Chandolin-Grimentz-St-Jean-St-Luc-Vissoie / 1.1.2009)', 1.79, 2024),
        ('VS', 'Ayent', 2.05, 2024), ('VS', 'Evolène', 1.75, 2024), ('VS', 'Hérémence', 1.73, 2024), ('VS', 'Mont-Noble (Nax - Mase - Vernamiège / 1.1.2011)', 1.96, 2024),
        ('VS', 'St-Martin', 1.96, 2024), ('VS', 'Vex', 2.12, 2024), ('VS', 'Arbaz', 1.79, 2024), ('VS', 'Grimisuat', 2.05, 2024),
        ('VS', 'Savièse', 1.76, 2024), ('VS', 'Sion (Salins, Sion / 1.1.2013 - Agettes)', 1.90, 2024), ('VS', 'Veysonnaz', 1.32, 2024), ('VS', 'Ardon', 2.12, 2024),
        ('VS', 'Chamoson', 1.75, 2024), ('VS', 'Conthey', 1.92, 2024), ('VS', 'Nendaz', 1.99, 2024), ('VS', 'Vétroz', 1.87, 2024),
        ('VS', 'Bovernier', 1.84, 2024), ('VS', 'Fully', 1.98, 2024), ('VS', 'Isérables', 1.82, 2024), ('VS', 'Leytron', 1.72, 2024),
        ('VS', 'Martigny-Combe', 1.79, 2024), ('VS', 'Martigny (Charrat / 1.1.2021)', 1.79, 2024), ('VS', 'Riddes', 1.91, 2024), ('VS', 'Saillon', 1.72, 2024),
        ('VS', 'Saxon', 1.96, 2024), ('VS', 'Trient', 1.73, 2024), ('VS', 'Val de Bagnes (Bagnes, Vollèges / 1.1.2021)', 1.73, 2024), ('VS', 'Bourg-St-Pierre', 1.70, 2024),
        ('VS', 'Liddes', 1.79, 2024), ('VS', 'Orsières', 1.80, 2024), ('VS', 'Sembrancher', 1.80, 2024), ('VS', 'Collonges', 1.74, 2024),
        ('VS', 'Dorénaz', 1.90, 2024), ('VS', 'Evionnaz', 2.25, 2024), ('VS', 'Finhaut', 1.73, 2024), ('VS', 'Massongex', 1.84, 2024),
        ('VS', 'St-Maurice (Mex, St-Maurice / 1.1.2013)', 2.04, 2024), ('VS', 'Salvan', 1.99, 2024), ('VS', 'Vernayaz', 1.96, 2024), ('VS', 'Vérossaz', 1.99, 2024),
        ('VS', 'Champéry', 1.86, 2024), ('VS', 'Collombey-Muraz', 2.10, 2024), ('VS', 'Monthey', 1.98, 2024), ('VS', 'Port-Valais', 1.87, 2024),
        ('VS', 'St-Gingolph', 1.80, 2024), ('VS', 'Troistorrents', 1.96, 2024), ('VS', 'Val d''Illiez', 1.92, 2024), ('VS', 'Vionnaz', 1.68, 2024),
        ('VS', 'Vouvry', 1.94, 2024)
        ON CONFLICT (canton, name, tax_year) DO UPDATE SET tax_multiplier = EXCLUDED.tax_multiplier, updated_at = CURRENT_TIMESTAMP
    """)
    print("✓ Seeded 121 Valais municipalities for 2024")

def downgrade():
    op.execute("DELETE FROM swisstax.municipalities WHERE canton = 'VS' AND tax_year = 2024")
    print("✓ Removed VS 2024 municipalities")
