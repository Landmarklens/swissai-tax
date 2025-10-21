"""seed_canton_deductions_bs_so

Revision ID: 138c44e8f466
Revises: 1c4986e0a4f5
Create Date: 2025-10-20 17:21:54.073465

Seed canton-specific tax deductions for 2 additional cantons:
- BS (Basel-Stadt): 15 deductions
- SO (Solothurn): 16 deductions

Total: 31 deduction rules for tax year 2024

Data sources:
- BS: https://www.bs.ch/themen/arbeit-und-steuern/steuererklaerung
- SO: https://steuerbuch.so.ch/
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '138c44e8f466'
down_revision: Union[str, Sequence[str], None] = '1c4986e0a4f5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Seed canton deductions for Basel-Stadt and Solothurn."""

    # Delete existing records for these cantons (idempotent)
    op.execute("""
        DELETE FROM swisstax.standard_deductions
        WHERE canton IN ('BS', 'SO')
          AND tax_year = 2024;
    """)

    # Read and execute the generated SQL
    import os
    from pathlib import Path

    # Get the SQL file path
    backend_dir = Path(__file__).parent.parent.parent
    sql_file = backend_dir / 'bs_so_migration_sql.txt'

    if not sql_file.exists():
        raise FileNotFoundError(
            f"SQL file not found: {sql_file}\n"
            "Run: python backend/generate_bs_so_migration.py"
        )

    # Read and execute the SQL
    with open(sql_file, 'r', encoding='utf-8') as f:
        sql_content = f.read()

    op.execute(sql_content)

    print("✅ Seeded 31 deductions for BS, SO cantons")


def downgrade() -> None:
    """Remove canton deductions for Basel-Stadt and Solothurn."""
    op.execute("""
        DELETE FROM swisstax.standard_deductions
        WHERE canton IN ('BS', 'SO')
          AND tax_year = 2024;
    """)

