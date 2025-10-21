"""Seed Neuchâtel municipalities

Revision ID: 20251018_ne_munic
Revises: 20251018_vs_munic
Create Date: 2025-10-18

Source: https://www.ne.ch/autorites/DFS/SCCO/impot-pp/Pages/coefficients.aspx
Canton: Neuchâtel (NE), Municipalities: 27 (2024), Canton rate: 125%
French-speaking canton. Municipal rates: 63%-79%

Note: On January 1, 2025, Enges, Hauterive, La Tène, and Saint-Blaise merged into Laténa,
reducing the total to 24 municipalities. This migration reflects the 2024 structure.
"""
from alembic import op

revision = '20251018_ne_munic'
down_revision = '20251018_vs_munic'

def upgrade():
    op.execute("DELETE FROM swisstax.municipalities WHERE canton = 'NE' AND tax_year = 2024")
    op.execute("""
        INSERT INTO swisstax.municipalities (canton, name, tax_multiplier, tax_year) VALUES
        ('NE', 'La Grande Béroche', 0.63, 2024), ('NE', 'Milvignes', 0.63, 2024), ('NE', 'Neuchâtel', 0.65, 2024), ('NE', 'Cortaillod', 0.66, 2024),
        ('NE', 'Le Landeron', 0.66, 2024), ('NE', 'Saint-Blaise', 0.66, 2024), ('NE', 'Val-de-Ruz', 0.66, 2024), ('NE', 'Rochefort', 0.67, 2024),
        ('NE', 'Boudry', 0.68, 2024), ('NE', 'Le Locle', 0.69, 2024), ('NE', 'Hauterive', 0.70, 2024), ('NE', 'Le Cerneux-Péquignot', 0.72, 2024),
        ('NE', 'Cornaux', 0.74, 2024), ('NE', 'Brot-Plamboz', 0.75, 2024), ('NE', 'La Brévine', 0.75, 2024), ('NE', 'La Chaux-de-Fonds', 0.75, 2024),
        ('NE', 'La Chaux-du-Milieu', 0.75, 2024), ('NE', 'La Côte-aux-Fées', 0.75, 2024), ('NE', 'La Sagne', 0.75, 2024), ('NE', 'Les Ponts-de-Martel', 0.75, 2024),
        ('NE', 'Val-de-Travers', 0.76, 2024), ('NE', 'Cressier', 0.77, 2024), ('NE', 'Lignières', 0.77, 2024), ('NE', 'Les Planchettes', 0.78, 2024),
        ('NE', 'Enges', 0.79, 2024), ('NE', 'Les Verrières', 0.79, 2024), ('NE', 'La Tène', 0.68, 2024)
        ON CONFLICT (canton, name, tax_year) DO UPDATE SET tax_multiplier = EXCLUDED.tax_multiplier, updated_at = CURRENT_TIMESTAMP
    """)
    print("✓ Seeded 27 Neuchâtel municipalities for 2024")

def downgrade():
    op.execute("DELETE FROM swisstax.municipalities WHERE canton = 'NE' AND tax_year = 2024")
    print("✓ Removed NE 2024 municipalities")
