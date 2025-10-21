"""Seed Glarus municipalities"""
from alembic import op

revision = '20251018_glarus_munic'
down_revision = '20251018_schaffhausen_munic'

def upgrade():
    op.execute("DELETE FROM swisstax.municipalities WHERE canton = 'GL' AND tax_year = 2024")
    op.execute("""INSERT INTO swisstax.municipalities (canton, name, tax_multiplier, tax_year) VALUES
        ('GL', 'Glarus Nord', 0.60, 2024), ('GL', 'Glarus', 0.56, 2024), ('GL', 'Glarus Süd', 0.60, 2024)
        ON CONFLICT (canton, name, tax_year) DO UPDATE SET tax_multiplier = EXCLUDED.tax_multiplier, updated_at = CURRENT_TIMESTAMP""")
    print("✓ Seeded 3 Glarus municipalities")

def downgrade():
    op.execute("DELETE FROM swisstax.municipalities WHERE canton = 'GL' AND tax_year = 2024")
