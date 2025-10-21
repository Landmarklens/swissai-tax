"""seed_schwyz_sz_church_tax_municipalities

Revision ID: 20251021_schwyz
Revises: 20251021_special_cases
Create Date: 2025-10-21 17:00:00.000000

Seed municipality-level church tax data for Schwyz (SZ) canton.

- 30 municipalities with Catholic and Reformed rates
- Tax year: 2025
- Source: Official canton PDF (Steuerfusstabelle 2025)
- Total: 60 church tax rates (30 municipalities × 2 denominations)

Official source: https://www.sz.ch/public/upload/assets/82883/Steuerfusstabelle_2025.pdf
"""
from typing import Sequence, Union
from pathlib import Path
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '20251021_schwyz'
down_revision: Union[str, Sequence[str], None] = '20251021_special_cases'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Seed Schwyz church tax municipality data."""

    # Delete existing SZ records (idempotent)
    op.execute("""
        DELETE FROM swisstax.church_tax_rates WHERE canton = 'SZ' AND tax_year = 2025;
    """)

    # Read and execute the generated SQL
    backend_dir = Path(__file__).parent.parent.parent
    sql_file = backend_dir / 'sz_church_tax_migration_sql.txt'

    if not sql_file.exists():
        raise FileNotFoundError(
            f"SQL file not found: {sql_file}\n"
            "Run: python backend/generate_sz_church_tax_migration.py"
        )

    with open(sql_file, 'r', encoding='utf-8') as f:
        sql_content = f.read()

    # Execute only the INSERT part
    if 'INSERT INTO' in sql_content:
        # Find the INSERT statement and execute it
        insert_start = sql_content.find('INSERT INTO')
        insert_sql = sql_content[insert_start:]
        op.execute(insert_sql)
    else:
        raise ValueError("No INSERT statement found in SQL file")

    print("✅ Seeded Schwyz (SZ) church tax data")
    print("   - 30 municipalities")
    print("   - 60 rates (Catholic + Reformed)")
    print("   - Tax year: 2025")
    print("   - Source: https://www.sz.ch/public/upload/assets/82883/Steuerfusstabelle_2025.pdf")


def downgrade() -> None:
    """Remove Schwyz church tax data."""
    op.execute("""
        DELETE FROM swisstax.church_tax_rates WHERE canton = 'SZ' AND tax_year = 2025;
    """)
    print("✅ Removed Schwyz church tax data")
