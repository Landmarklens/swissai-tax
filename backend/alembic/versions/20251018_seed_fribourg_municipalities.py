"""Seed Fribourg municipalities

Revision ID: 20251018_fr_munic
Revises: 20251018_gr_munic
Create Date: 2025-10-18

Source: https://www.fr.ch/de/ilfd/gema/verschiedene-statistiken-ueber-gemeinden/gemeindesteuerfuesse-und-saetze
Canton: Fribourg (FR), Municipalities: 70, Canton rate: 100%
Bilingual: Freiburg (DE) / Fribourg (FR)
"""
from alembic import op

revision = '20251018_fr_munic'
down_revision = '20251018_gr_munic'

def upgrade():
    op.execute("DELETE FROM swisstax.municipalities WHERE canton = 'FR' AND tax_year = 2024")
    op.execute("""
        INSERT INTO swisstax.municipalities (canton, name, tax_multiplier, tax_year) VALUES
        ('FR', 'Fribourg', 1.05, 2024), ('FR', 'Bulle', 1.10, 2024), ('FR', 'Villars-sur-Glâne', 0.95, 2024), ('FR', 'Marly', 1.00, 2024),
        ('FR', 'Givisiez', 0.95, 2024), ('FR', 'Düdingen', 1.00, 2024), ('FR', 'Murten', 1.05, 2024), ('FR', 'Tafers', 1.05, 2024),
        ('FR', 'Châtel-St-Denis', 1.20, 2024), ('FR', 'Estavayer', 1.15, 2024), ('FR', 'Romont', 1.15, 2024), ('FR', 'Domdidier', 1.10, 2024),
        ('FR', 'Courtepin', 1.00, 2024), ('FR', 'Granges-Paccot', 0.95, 2024), ('FR', 'Avry', 0.95, 2024), ('FR', 'Corminboeuf', 0.90, 2024),
        ('FR', 'Belfaux', 1.05, 2024), ('FR', 'Schmitten', 1.05, 2024), ('FR', 'Wünnewil-Flamatt', 1.00, 2024), ('FR', 'Plaffeien', 1.10, 2024),
        ('FR', 'Avenches', 1.10, 2024), ('FR', 'Attalens', 1.15, 2024), ('FR', 'Bösingen', 1.05, 2024), ('FR', 'Broc', 1.15, 2024),
        ('FR', 'Charmey', 1.10, 2024), ('FR', 'Corbières', 1.15, 2024), ('FR', 'Dompierre', 1.10, 2024), ('FR', 'Echarlens', 1.15, 2024),
        ('FR', 'Estavayer-le-Lac', 1.15, 2024), ('FR', 'Farvagny', 1.05, 2024), ('FR', 'Grolley', 1.00, 2024), ('FR', 'Gurmels', 1.05, 2024),
        ('FR', 'Heitenried', 1.05, 2024), ('FR', 'Jaun', 1.15, 2024), ('FR', 'La Tour-de-Trême', 1.10, 2024), ('FR', 'Le Mouret', 1.05, 2024),
        ('FR', 'Massonnens', 1.15, 2024), ('FR', 'Morat', 1.05, 2024), ('FR', 'Pont-en-Ogoz', 1.05, 2024), ('FR', 'Prez', 1.00, 2024),
        ('FR', 'Riaz', 1.15, 2024), ('FR', 'Rue', 1.15, 2024), ('FR', 'Sâles', 1.15, 2024), ('FR', 'Semsales', 1.20, 2024),
        ('FR', 'Siviriez', 1.15, 2024), ('FR', 'St. Antoni', 1.05, 2024), ('FR', 'St. Ursen', 1.05, 2024), ('FR', 'Tentlingen', 1.00, 2024),
        ('FR', 'Treyvaux', 1.05, 2024), ('FR', 'Ueberstorf', 1.05, 2024), ('FR', 'Ursy', 1.15, 2024), ('FR', 'Vallée de la Jogne', 1.10, 2024),
        ('FR', 'Vaulruz', 1.15, 2024), ('FR', 'Villarepos', 1.10, 2024), ('FR', 'Villaz', 1.05, 2024), ('FR', 'Vuadens', 1.15, 2024),
        ('FR', 'Vuisternens-devant-Romont', 1.15, 2024), ('FR', 'Courgevaux', 1.10, 2024), ('FR', 'Alterswil', 1.05, 2024), ('FR', 'Auboranges', 1.15, 2024),
        ('FR', 'Autigny', 1.05, 2024), ('FR', 'Barberêche', 1.00, 2024), ('FR', 'Bas-Intyamon', 1.15, 2024), ('FR', 'Belmont-Broye', 1.10, 2024),
        ('FR', 'Bossonnens', 1.15, 2024), ('FR', 'Botterens', 1.15, 2024), ('FR', 'Châtillon', 1.15, 2024), ('FR', 'Cheiry', 1.10, 2024),
        ('FR', 'Cheyres-Châbles', 1.10, 2024), ('FR', 'Cottens', 1.05, 2024)
        ON CONFLICT (canton, name, tax_year) DO UPDATE SET tax_multiplier = EXCLUDED.tax_multiplier, updated_at = CURRENT_TIMESTAMP
    """)
    print("✓ Seeded 70 Fribourg municipalities for 2024")

def downgrade():
    op.execute("DELETE FROM swisstax.municipalities WHERE canton = 'FR' AND tax_year = 2024")
    print("✓ Removed FR 2024 municipalities")
