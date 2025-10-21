"""Seed Appenzell Innerrhoden municipalities

Revision ID: 20251018_ai_munic
Revises: 20251018_glarus_munic
Create Date: 2025-10-18

Source: https://www.ai.ch/themen/steuern/publikationen/administration/steuerfuesse-der-verschiedenen-koerperschaften-stand-2021.pdf
Tax year: 2024
Canton: Appenzell Innerrhoden (AI)
Municipalities: 5 districts (Bezirke)

Note: Municipal multiplier includes District (Bezirk) + School (Schulgemeinde)
- Staat (Canton): 96%
- Districts and Schools vary by municipality
"""
from alembic import op

revision = '20251018_ai_munic'
down_revision = '20251018_glarus_munic'

def upgrade():
    """Seed 5 Appenzell Innerrhoden municipalities with 2024 tax rates."""
    # Delete existing AI 2024 data for idempotency
    op.execute("DELETE FROM swisstax.municipalities WHERE canton = 'AI' AND tax_year = 2024")

    # Insert all 5 municipalities
    # Municipal rate = District (Bezirk) + School (Schulgemeinde)
    op.execute("""
        INSERT INTO swisstax.municipalities (canton, name, tax_multiplier, tax_year) VALUES
        ('AI', 'Appenzell', 0.5600, 2024),         -- 16% district + 40% school
        ('AI', 'Schwende-Rüte', 0.8300, 2024),     -- 20% district + 63% school
        ('AI', 'Schlatt-Haslen', 0.8700, 2024),    -- 20% district + 67% school
        ('AI', 'Gonten', 0.7900, 2024),            -- 21% district + 58% school
        ('AI', 'Oberegg', 0.9600, 2024)            -- 96% district + 0% school (special case)
        ON CONFLICT (canton, name, tax_year)
        DO UPDATE SET
            tax_multiplier = EXCLUDED.tax_multiplier,
            updated_at = CURRENT_TIMESTAMP
    """)

    print("✓ Seeded 5 Appenzell Innerrhoden municipalities for 2024")

def downgrade():
    """Remove Appenzell Innerrhoden 2024 municipality data."""
    op.execute("DELETE FROM swisstax.municipalities WHERE canton = 'AI' AND tax_year = 2024")
    print("✓ Removed Appenzell Innerrhoden 2024 municipalities")
