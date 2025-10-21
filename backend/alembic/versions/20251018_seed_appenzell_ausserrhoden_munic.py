"""Seed Appenzell Ausserrhoden municipalities

Revision ID: 20251018_ar_munic
Revises: 20251018_sz_munic
Create Date: 2025-10-18

Source: https://ar.ch/fileadmin/user_upload/Departement_Finanzen/Steuerverwaltung/Bibliothek/2024/Steuerfuesse_2024.pdf
Tax year: 2024
Canton: Appenzell Ausserrhoden (AR)
Municipalities: 20

Note: AR uses "Einheiten" (units) multiplier system
Canton: 3.30 Einheiten
"""
from alembic import op

revision = '20251018_ar_munic'
down_revision = '20251018_sz_munic'

def upgrade():
    """Seed 20 Appenzell Ausserrhoden municipalities with 2024 tax rates."""
    op.execute("DELETE FROM swisstax.municipalities WHERE canton = 'AR' AND tax_year = 2024")

    op.execute("""
        INSERT INTO swisstax.municipalities (canton, name, tax_multiplier, tax_year) VALUES
        ('AR', 'Bühler', 3.90, 2024),
        ('AR', 'Gais', 3.35, 2024),
        ('AR', 'Grub', 4.00, 2024),
        ('AR', 'Heiden', 3.70, 2024),
        ('AR', 'Herisau', 4.10, 2024),
        ('AR', 'Hundwil', 4.70, 2024),
        ('AR', 'Lutzenberg', 3.50, 2024),
        ('AR', 'Rehetobel', 4.20, 2024),
        ('AR', 'Reute', 3.70, 2024),
        ('AR', 'Schönengrund', 4.20, 2024),
        ('AR', 'Schwellbrunn', 4.20, 2024),
        ('AR', 'Speicher', 3.60, 2024),
        ('AR', 'Stein', 3.70, 2024),
        ('AR', 'Teufen', 2.60, 2024),
        ('AR', 'Trogen', 4.50, 2024),
        ('AR', 'Urnäsch', 4.20, 2024),
        ('AR', 'Wald', 4.10, 2024),
        ('AR', 'Waldstatt', 3.90, 2024),
        ('AR', 'Walzenhausen', 3.20, 2024),
        ('AR', 'Wolfhalden', 3.90, 2024)
        ON CONFLICT (canton, name, tax_year)
        DO UPDATE SET
            tax_multiplier = EXCLUDED.tax_multiplier,
            updated_at = CURRENT_TIMESTAMP
    """)

    print("✓ Seeded 20 Appenzell Ausserrhoden municipalities for 2024")

def downgrade():
    """Remove AR 2024 municipality data."""
    op.execute("DELETE FROM swisstax.municipalities WHERE canton = 'AR' AND tax_year = 2024")
    print("✓ Removed AR 2024 municipalities")
