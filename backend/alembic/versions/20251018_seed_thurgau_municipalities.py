"""Seed Thurgau municipalities

Revision ID: 20251018_tg_munic
Revises: 20251018_sg_munic
Create Date: 2025-10-18

Source: https://data.tg.ch/explore/dataset/sk-stat-70/
Canton: Thurgau (TG), Municipalities: 80
"""
from alembic import op

revision = '20251018_tg_munic'
down_revision = '20251018_sg_munic'

def upgrade():
    op.execute("DELETE FROM swisstax.municipalities WHERE canton = 'TG' AND tax_year = 2024")
    op.execute("""
        INSERT INTO swisstax.municipalities (canton, name, tax_multiplier, tax_year) VALUES
        ('TG', 'Aadorf', 2.64, 2024), ('TG', 'Affeltrangen', 2.58, 2024), ('TG', 'Altnau', 2.50, 2024), ('TG', 'Amlikon-Bissegg', 2.68, 2024),
        ('TG', 'Amriswil', 2.65, 2024), ('TG', 'Arbon', 2.86, 2024), ('TG', 'Basadingen-Schlattingen', 2.52, 2024), ('TG', 'Berg', 2.46, 2024),
        ('TG', 'Berlingen', 2.38, 2024), ('TG', 'Bettwiesen', 2.44, 2024), ('TG', 'Bichelsee-Balterswil', 2.59, 2024), ('TG', 'Birwinken', 2.61, 2024),
        ('TG', 'Bischofszell', 2.67, 2024), ('TG', 'Bottighofen', 2.01, 2024), ('TG', 'Braunau', 2.56, 2024), ('TG', 'Bürglen', 2.60, 2024),
        ('TG', 'Bussnang', 2.44, 2024), ('TG', 'Diessenhofen', 2.49, 2024), ('TG', 'Dozwil', 2.31, 2024), ('TG', 'Egnach', 2.59, 2024),
        ('TG', 'Erlen', 2.57, 2024), ('TG', 'Ermatingen', 2.15, 2024), ('TG', 'Eschenz', 2.51, 2024), ('TG', 'Eschlikon', 2.53, 2024),
        ('TG', 'Felben-Wellhausen', 2.52, 2024), ('TG', 'Fischingen', 2.64, 2024), ('TG', 'Frauenfeld', 2.53, 2024), ('TG', 'Gachnang', 2.41, 2024),
        ('TG', 'Gottlieben', 2.38, 2024), ('TG', 'Güttingen', 2.51, 2024), ('TG', 'Hauptwil-Gottshaus', 2.54, 2024), ('TG', 'Hefenhofen', 2.68, 2024),
        ('TG', 'Herdern', 2.55, 2024), ('TG', 'Hohentannen', 2.52, 2024), ('TG', 'Homburg', 2.57, 2024), ('TG', 'Horn', 2.08, 2024),
        ('TG', 'Hüttlingen', 2.64, 2024), ('TG', 'Hüttwilen', 2.46, 2024), ('TG', 'Kemmental', 2.60, 2024), ('TG', 'Kesswil', 2.37, 2024),
        ('TG', 'Kradolf-Schönenberg', 2.57, 2024), ('TG', 'Kreuzlingen', 2.41, 2024), ('TG', 'Langrickenbach', 2.58, 2024), ('TG', 'Lengwil', 2.42, 2024),
        ('TG', 'Lommis', 2.49, 2024), ('TG', 'Mammern', 2.48, 2024), ('TG', 'Märstetten', 2.60, 2024), ('TG', 'Matzingen', 2.60, 2024),
        ('TG', 'Müllheim', 2.49, 2024), ('TG', 'Münchwilen', 2.60, 2024), ('TG', 'Münsterlingen', 2.26, 2024), ('TG', 'Neunforn', 2.33, 2024),
        ('TG', 'Pfyn', 2.66, 2024), ('TG', 'Raperswilen', 2.72, 2024), ('TG', 'Rickenbach', 2.56, 2024), ('TG', 'Roggwil', 2.53, 2024),
        ('TG', 'Romanshorn', 2.71, 2024), ('TG', 'Salenstein', 2.24, 2024), ('TG', 'Salmsach', 2.62, 2024), ('TG', 'Schlatt', 2.50, 2024),
        ('TG', 'Schönholzerswilen', 2.60, 2024), ('TG', 'Sirnach', 2.51, 2024), ('TG', 'Sommeri', 2.57, 2024), ('TG', 'Steckborn', 2.30, 2024),
        ('TG', 'Stettfurt', 2.52, 2024), ('TG', 'Sulgen', 2.52, 2024), ('TG', 'Tägerwilen', 2.24, 2024), ('TG', 'Thundorf', 2.61, 2024),
        ('TG', 'Tobel-Tägerschen', 2.60, 2024), ('TG', 'Uesslingen-Buch', 2.51, 2024), ('TG', 'Uttwil', 2.26, 2024), ('TG', 'Wagenhausen', 2.60, 2024),
        ('TG', 'Wäldi', 2.61, 2024), ('TG', 'Wängi', 2.51, 2024), ('TG', 'Warth-Weiningen', 1.93, 2024), ('TG', 'Weinfelden', 2.46, 2024),
        ('TG', 'Wigoltingen', 2.68, 2024), ('TG', 'Wilen', 2.46, 2024), ('TG', 'Wuppenau', 2.55, 2024), ('TG', 'Zihlschlacht-Sitterdorf', 2.64, 2024)
        ON CONFLICT (canton, name, tax_year) DO UPDATE SET tax_multiplier = EXCLUDED.tax_multiplier, updated_at = CURRENT_TIMESTAMP
    """)
    print("✓ Seeded 80 Thurgau municipalities for 2024")

def downgrade():
    op.execute("DELETE FROM swisstax.municipalities WHERE canton = 'TG' AND tax_year = 2024")
    print("✓ Removed TG 2024 municipalities")
