"""Create municipalities table for Swiss canton municipal tax rates

Revision ID: 20251017_municipalities
Revises: add_subcategory_insights
Create Date: 2025-10-17

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20251017_municipalities'
down_revision = 'add_subcategory_insights'
branch_labels = None
depends_on = None


def upgrade():
    """Create municipalities table"""

    # Create municipalities table (idempotent)
    op.execute("""
        CREATE TABLE IF NOT EXISTS swisstax.municipalities (
            id SERIAL PRIMARY KEY,
            canton VARCHAR(2) NOT NULL,
            name VARCHAR(100) NOT NULL,
            tax_multiplier NUMERIC(6, 4) NOT NULL,  -- e.g., 1.0200 for 102%, 0.4800 for 48%
            tax_year INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(canton, name, tax_year)
        )
    """)

    # Create index for fast lookups (idempotent)
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_municipalities_lookup
        ON swisstax.municipalities(canton, name, tax_year)
    """)

    # Create index on canton and tax_year for filtering (idempotent)
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_municipalities_canton_year
        ON swisstax.municipalities(canton, tax_year)
    """)

    # Add trigger for updated_at (idempotent)
    op.execute("""
        CREATE OR REPLACE FUNCTION swisstax.update_municipalities_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ language 'plpgsql'
    """)

    op.execute("""
        DROP TRIGGER IF EXISTS update_municipalities_updated_at
        ON swisstax.municipalities
    """)

    op.execute("""
        CREATE TRIGGER update_municipalities_updated_at
        BEFORE UPDATE ON swisstax.municipalities
        FOR EACH ROW EXECUTE FUNCTION swisstax.update_municipalities_updated_at_column()
    """)


def downgrade():
    """Drop municipalities table"""
    op.execute("DROP TRIGGER IF EXISTS update_municipalities_updated_at ON swisstax.municipalities")
    op.execute("DROP FUNCTION IF EXISTS swisstax.update_municipalities_updated_at_column()")
    op.execute("DROP INDEX IF EXISTS swisstax.idx_municipalities_canton_year")
    op.execute("DROP INDEX IF EXISTS swisstax.idx_municipalities_lookup")
    op.execute("DROP TABLE IF EXISTS swisstax.municipalities")
