"""Seed church tax data for 6 cantons with official data (AR, GR, JU, ZG, SH, TG)

Revision ID: 20251021_6cantons
Revises:
Create Date: 2025-10-21

This migration seeds church tax rates for 6 cantons with complete, verified official data:
- AR (Appenzell Ausserrhoden): 20 municipalities - Reformed and Catholic
- GR (Graubünden): 97 municipalities - Reformed (two-component system) and Catholic
- JU (Jura): 52 municipalities - Reformed and Catholic (uniform rates)
- ZG (Zug): 11 municipalities - Reformed and Catholic
- SH (Schaffhausen): 26 municipalities - Reformed and Catholic
- TG (Thurgau): 80 municipalities - Reformed and Catholic

Total: 286 municipalities = 572 database rows

Data Quality:
- All data extracted from official canton sources
- No estimations or unofficial sources
- Tax year: 2024-2025
"""
from alembic import op
import sqlalchemy as sa
from pathlib import Path


# revision identifiers, used by Alembic.
revision = '20251021_6cantons'
down_revision = '20251021_schwyz'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Delete existing data for these cantons to avoid duplicates
    op.execute("""
        DELETE FROM swisstax.church_tax_rates
        WHERE canton IN ('AR', 'GR', 'JU', 'ZG', 'SH', 'TG')
          AND tax_year IN (2024, 2025);
    """)

    # Load the SQL from the generated file
    backend_dir = Path(__file__).parent.parent.parent
    sql_file = backend_dir / '6cantons_consolidated_migration_sql.txt'

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
    # Remove all rows for these 6 cantons
    op.execute("""
        DELETE FROM swisstax.church_tax_rates
        WHERE canton IN ('AR', 'GR', 'JU', 'ZG', 'SH', 'TG')
          AND tax_year IN (2024, 2025);
    """)
