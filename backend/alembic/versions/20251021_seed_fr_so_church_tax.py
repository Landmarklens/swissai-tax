"""Seed church tax data for FR (Fribourg) and SO (Solothurn)

Revision ID: 20251021_fr_so
Revises: 20251021_6cantons
Create Date: 2025-10-21

This migration seeds church tax rates for:
- FR (Fribourg): 123 municipalities - Reformed rates (2025)
  Note: Catholic rates were already extracted but estimated Reformed rates replaced with official data
- SO (Solothurn): 102 municipalities - Catholic and Reformed rates (2024)

Total: 225 municipalities = 327 database rows

Data Quality:
- All data from official canton sources
- FR: Official Reformed Church document from Canton Fribourg
- SO: Official PDF "Steuerfüsse und Gebühren 2024"
- No estimations
"""
from alembic import op
import sqlalchemy as sa
from pathlib import Path


# revision identifiers, used by Alembic.
revision = '20251021_fr_so'
down_revision = '20251021_6cantons'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Delete existing data for these cantons to avoid duplicates
    # For FR, only delete Reformed (protestant) as Catholic already exists
    # For SO, delete all as this is new data
    op.execute("""
        DELETE FROM swisstax.church_tax_rates
        WHERE (canton = 'FR' AND denomination = 'protestant' AND tax_year = 2025)
           OR (canton = 'SO' AND tax_year = 2024);
    """)

    # Load the SQL from the generated file
    backend_dir = Path(__file__).parent.parent.parent
    sql_file = backend_dir / 'fr_so_migration_sql.txt'

    with open(sql_file, 'r', encoding='utf-8') as f:
        sql_content = f.read()

    # Extract just the INSERT statement (skip DELETE and comments)
    if 'INSERT INTO' in sql_content:
        insert_start = sql_content.find('INSERT INTO')
        insert_sql = sql_content[insert_start:]
        op.execute(insert_sql)
    else:
        raise ValueError("No INSERT statement found in migration SQL file")


def downgrade() -> None:
    # Remove all rows for these cantons
    op.execute("""
        DELETE FROM swisstax.church_tax_rates
        WHERE (canton = 'FR' AND denomination = 'protestant' AND tax_year = 2025)
           OR (canton = 'SO' AND tax_year = 2024);
    """)
