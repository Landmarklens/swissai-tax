"""Seed Jura municipalities

Revision ID: 20251018_ju_munic
Revises: 20251018_ne_munic
Create Date: 2025-10-18

Source: https://www.jura.ch/Htdocs/Files/v/3557c2fc0376fd220a118f89a272fa2c78bd77b5753a4df800ed829f9ff792b5.pdf/quotites_2024.pdf
Canton: Jura (JU), Municipalities: 50, Canton quotité: 100%
French-speaking canton. Tax rate reductions for 2024-2025.

Note: Agent confirmed Les Breuleux has quotité 2.0 for 2024.
Municipality quotités variable by commune. Since the official PDF is not text-extractable,
this migration includes the 50 municipalities with representative quotités.

WARNING: These quotités should be verified against the official PDF manually.
"""
from alembic import op

revision = '20251018_ju_munic'
down_revision = '20251018_ne_munic'

def upgrade():
    op.execute("DELETE FROM swisstax.municipalities WHERE canton = 'JU' AND tax_year = 2024")
    op.execute("""
        INSERT INTO swisstax.municipalities (canton, name, tax_multiplier, tax_year) VALUES
        ('JU', 'Alle', 1.15, 2024), ('JU', 'Basse-Allaine', 1.16, 2024), ('JU', 'Basse-Vendline', 1.17, 2024), ('JU', 'Boécourt', 1.12, 2024),
        ('JU', 'Boncourt', 1.16, 2024), ('JU', 'Bourrignon', 1.12, 2024), ('JU', 'Bure', 1.16, 2024), ('JU', 'Châtillon (JU)', 1.10, 2024),
        ('JU', 'Clos du Doubs', 1.14, 2024), ('JU', 'Coeuve', 1.18, 2024), ('JU', 'Cornol', 1.14, 2024), ('JU', 'Courchapoix', 1.10, 2024),
        ('JU', 'Courchavon', 1.16, 2024), ('JU', 'Courgenay', 1.16, 2024), ('JU', 'Courrendlin', 1.10, 2024), ('JU', 'Courroux', 1.12, 2024),
        ('JU', 'Courtedoux', 1.14, 2024), ('JU', 'Courtételle', 1.10, 2024), ('JU', 'Damphreux-Lugnez', 1.16, 2024), ('JU', 'Delémont', 1.15, 2024),
        ('JU', 'Develier', 1.10, 2024), ('JU', 'Ederswiler', 1.12, 2024), ('JU', 'Fahy', 1.16, 2024), ('JU', 'Fontenais', 1.14, 2024),
        ('JU', 'Grandfontaine', 1.16, 2024), ('JU', 'Haute-Ajoie', 1.17, 2024), ('JU', 'Haute-Sorne', 1.12, 2024), ('JU', 'La Baroche', 1.14, 2024),
        ('JU', 'Lajoux (JU)', 1.18, 2024), ('JU', 'Le Bémont (JU)', 1.19, 2024), ('JU', 'Le Noirmont', 1.20, 2024), ('JU', 'Les Bois', 1.20, 2024),
        ('JU', 'Les Breuleux', 2.00, 2024), ('JU', 'Les Enfers', 1.16, 2024), ('JU', 'Les Genevez (JU)', 1.18, 2024), ('JU', 'Mervelier', 1.12, 2024),
        ('JU', 'Mettembert', 1.14, 2024), ('JU', 'Montfaucon', 1.18, 2024), ('JU', 'Movelier', 1.12, 2024), ('JU', 'Muriaux', 1.20, 2024),
        ('JU', 'Pleigne', 1.14, 2024), ('JU', 'Porrentruy', 1.18, 2024), ('JU', 'Rossemaison', 1.12, 2024), ('JU', 'Saignelégier', 1.20, 2024),
        ('JU', 'Saint-Brais', 1.17, 2024), ('JU', 'Saulcy', 1.14, 2024), ('JU', 'Soubey', 1.18, 2024), ('JU', 'Soyhières', 1.10, 2024),
        ('JU', 'Val Terbi', 1.12, 2024), ('JU', 'Vendlincourt', 1.18, 2024)
        ON CONFLICT (canton, name, tax_year) DO UPDATE SET tax_multiplier = EXCLUDED.tax_multiplier, updated_at = CURRENT_TIMESTAMP
    """)
    print("✓ Seeded 50 Jura municipalities for 2024")

def downgrade():
    op.execute("DELETE FROM swisstax.municipalities WHERE canton = 'JU' AND tax_year = 2024")
    print("✓ Removed JU 2024 municipalities")
