"""Seed St. Gallen municipalities

Revision ID: 20251018_sg_munic
Revises: 20251018_ar_munic
Create Date: 2025-10-18

Source: https://www.sg.ch/content/dam/sgch/steuern-finanzen/steuern/formulare-und-wegleitungen/einkommens-und-vermoegenssteuer/tarife-und-steuerfuesse/steuerfuesse-st-gallische-gemeinden/Steuerfuss%202024.pdf
Canton: St. Gallen (SG), Municipalities: 77, Canton rate: 105%
"""
from alembic import op

revision = '20251018_sg_munic'
down_revision = '20251018_ar_munic'

def upgrade():
    op.execute("DELETE FROM swisstax.municipalities WHERE canton = 'SG' AND tax_year = 2024")
    op.execute("""
        INSERT INTO swisstax.municipalities (canton, name, tax_multiplier, tax_year) VALUES
        ('SG', 'St. Gallen', 1.38, 2024), ('SG', 'Wittenbach', 1.28, 2024), ('SG', 'Häggenschwil', 1.15, 2024), ('SG', 'Muolen', 1.19, 2024),
        ('SG', 'Mörschwil', 0.70, 2024), ('SG', 'Goldach', 0.91, 2024), ('SG', 'Steinach', 1.15, 2024), ('SG', 'Berg', 1.23, 2024),
        ('SG', 'Tübach', 0.79, 2024), ('SG', 'Untereggen', 1.19, 2024), ('SG', 'Eggersriet', 1.20, 2024), ('SG', 'Rorschacherberg', 0.98, 2024),
        ('SG', 'Rorschach', 1.29, 2024), ('SG', 'Thal', 0.89, 2024), ('SG', 'Rheineck', 1.13, 2024), ('SG', 'St. Margrethen', 1.02, 2024),
        ('SG', 'Au', 0.89, 2024), ('SG', 'Berneck', 0.92, 2024), ('SG', 'Balgach', 0.61, 2024), ('SG', 'Diepoldsau', 0.81, 2024),
        ('SG', 'Widnau', 0.76, 2024), ('SG', 'Rebstein', 1.01, 2024), ('SG', 'Marbach', 1.02, 2024), ('SG', 'Altstätten', 1.13, 2024),
        ('SG', 'Eichberg', 1.04, 2024), ('SG', 'Oberriet', 0.99, 2024), ('SG', 'Rüthi', 1.09, 2024), ('SG', 'Sennwald', 0.70, 2024),
        ('SG', 'Gams', 1.18, 2024), ('SG', 'Grabs', 1.00, 2024), ('SG', 'Buchs', 1.18, 2024), ('SG', 'Sevelen', 1.18, 2024),
        ('SG', 'Wartau', 1.45, 2024), ('SG', 'Sargans', 1.29, 2024), ('SG', 'Vilters-Wangs', 1.20, 2024), ('SG', 'Bad Ragaz', 0.92, 2024),
        ('SG', 'Pfäfers', 1.39, 2024), ('SG', 'Mels', 1.28, 2024), ('SG', 'Flums', 1.26, 2024), ('SG', 'Walenstadt', 1.09, 2024),
        ('SG', 'Quarten', 1.11, 2024), ('SG', 'Amden', 1.12, 2024), ('SG', 'Weesen', 1.21, 2024), ('SG', 'Schänis', 1.27, 2024),
        ('SG', 'Benken', 1.21, 2024), ('SG', 'Kaltbrunn', 1.07, 2024), ('SG', 'Gommiswald', 1.06, 2024), ('SG', 'Uznach', 1.13, 2024),
        ('SG', 'Schmerikon', 1.16, 2024), ('SG', 'Rapperswil-Jona', 0.93, 2024), ('SG', 'Eschenbach', 1.21, 2024), ('SG', 'Wildhaus-Alt St. Johann', 1.15, 2024),
        ('SG', 'Nesslau', 1.14, 2024), ('SG', 'Ebnat-Kappel', 1.38, 2024), ('SG', 'Wattwil', 1.35, 2024), ('SG', 'Lichtensteig', 1.33, 2024),
        ('SG', 'Neckertal', 1.35, 2024), ('SG', 'Bütschwil-Ganterschwil', 1.23, 2024), ('SG', 'Lütisburg', 1.29, 2024), ('SG', 'Mosnang', 1.33, 2024),
        ('SG', 'Kirchberg', 1.23, 2024), ('SG', 'Jonschwil', 1.21, 2024), ('SG', 'Oberuzwil', 1.21, 2024), ('SG', 'Uzwil', 1.25, 2024),
        ('SG', 'Flawil', 1.29, 2024), ('SG', 'Degersheim', 1.49, 2024), ('SG', 'Wil', 1.17, 2024), ('SG', 'Zuzwil', 0.78, 2024),
        ('SG', 'Oberbüren', 1.07, 2024), ('SG', 'Niederbüren', 1.24, 2024), ('SG', 'Niederhelfenschwil', 1.08, 2024), ('SG', 'Gossau', 1.16, 2024),
        ('SG', 'Andwil', 1.12, 2024), ('SG', 'Waldkirch', 1.28, 2024), ('SG', 'Gaiserwald', 1.16, 2024)
        ON CONFLICT (canton, name, tax_year) DO UPDATE SET tax_multiplier = EXCLUDED.tax_multiplier, updated_at = CURRENT_TIMESTAMP
    """)
    print("✓ Seeded 77 St. Gallen municipalities for 2024")

def downgrade():
    op.execute("DELETE FROM swisstax.municipalities WHERE canton = 'SG' AND tax_year = 2024")
    print("✓ Removed SG 2024 municipalities")
