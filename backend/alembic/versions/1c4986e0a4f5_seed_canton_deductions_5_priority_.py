"""seed_canton_deductions_5_priority_cantons

Revision ID: 1c4986e0a4f5
Revises: 20251020_133030_sg_munic_v2
Create Date: 2025-10-20 16:58:51.996105

Seed canton-specific tax deductions for 5 priority cantons:
- VD (Vaud): 30 deductions
- GE (Geneva): 15 deductions
- SG (St. Gallen): 13 deductions
- FR (Fribourg): 21 deductions
- NE (Neuchâtel): 9 deductions

Total: 88 deduction rules for tax year 2024

Data sources:
- VD: https://www.vd.ch/etat-droit-finances/impots/impots-pour-les-individus/les-deductions
- GE: https://www.ge.ch/imposition-famille/deductions-vos-enfants
- SG: https://www.sg.ch/steuern-finanzen/steuern.html
- FR: https://www.fr.ch/impots/personnes-physiques
- NE: https://www.ne.ch/autorites/DFS/SCCO/impot-pp/
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1c4986e0a4f5'
down_revision: Union[str, Sequence[str], None] = '20251020_133030_sg_munic_v2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Seed canton deductions for 5 priority cantons."""

    # Delete existing records for these cantons (idempotent)
    op.execute("""
        DELETE FROM swisstax.standard_deductions
        WHERE canton IN ('VD', 'GE', 'SG', 'FR', 'NE')
          AND tax_year = 2024;
    """)

    # Read and execute the generated SQL
    # This is more maintainable than embedding 1200+ lines of SQL directly
    import os
    from pathlib import Path

    # Get the SQL file path
    backend_dir = Path(__file__).parent.parent.parent
    sql_file = backend_dir / 'deductions_migration_sql.txt'

    if not sql_file.exists():
        raise FileNotFoundError(
            f"SQL file not found: {sql_file}\n"
            "Run: python backend/generate_deductions_migration.py"
        )

    # Read and execute the SQL
    with open(sql_file, 'r', encoding='utf-8') as f:
        sql_content = f.read()

    op.execute(sql_content)

    print("✅ Seeded 88 deductions for VD, GE, SG, FR, NE cantons")


def downgrade() -> None:
    """Remove canton deductions for 5 priority cantons."""
    op.execute("""
        DELETE FROM swisstax.standard_deductions
        WHERE canton IN ('VD', 'GE', 'SG', 'FR', 'NE')
          AND tax_year = 2024;
    """)
