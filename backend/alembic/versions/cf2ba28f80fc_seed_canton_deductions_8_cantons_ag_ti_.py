"""seed_canton_deductions_8_cantons_ag_ti_vs_gr_zh_be_lu_zg

Revision ID: cf2ba28f80fc
Revises: 138c44e8f466
Create Date: 2025-10-20 17:42:05.565738

Seed canton-specific tax deductions for 8 major cantons:
- AG (Aargau): 16 deductions
- TI (Ticino): 16 deductions
- VS (Valais): 19 deductions
- GR (Graubünden): 20 deductions
- ZH (Zürich): 21 deductions
- BE (Bern): 21 deductions
- LU (Lucerne): 21 deductions
- ZG (Zug): 22 deductions

Total: 156 deduction rules for tax year 2024

Official sources:
- AG: https://www.ag.ch/de/verwaltung/dfr/steuern
- TI: https://www4.ti.ch/dfe/dc/sportello/imposte/
- VS: https://www.vs.ch/web/sfc
- GR: https://www.gr.ch/DE/institutionen/verwaltung/dfg/stv
- ZH: https://www.zh.ch/de/steuern-finanzen/steuern.html
- BE: https://www.be.ch/de/start/themen/steuern.html
- LU: https://steuern.lu.ch/
- ZG: https://www.zg.ch/de/steuern-finanzen/steuern
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cf2ba28f80fc'
down_revision: Union[str, Sequence[str], None] = '138c44e8f466'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Seed canton deductions for 8 major Swiss cantons."""

    # Delete existing records for these cantons (idempotent)
    op.execute("""
        DELETE FROM swisstax.standard_deductions
        WHERE canton IN ('AG', 'TI', 'VS', 'GR', 'ZH', 'BE', 'LU', 'ZG')
          AND tax_year = 2024;
    """)

    # Read and execute the generated SQL
    import os
    from pathlib import Path

    # Get the SQL file path
    backend_dir = Path(__file__).parent.parent.parent
    sql_file = backend_dir / '8cantons_migration_sql.txt'

    if not sql_file.exists():
        raise FileNotFoundError(
            f"SQL file not found: {sql_file}\n"
            "Run: python backend/generate_8cantons_migration.py"
        )

    # Read and execute the SQL
    with open(sql_file, 'r', encoding='utf-8') as f:
        sql_content = f.read()

    op.execute(sql_content)

    print("✅ Seeded 156 deductions for AG, TI, VS, GR, ZH, BE, LU, ZG cantons")


def downgrade() -> None:
    """Remove canton deductions for 8 cantons."""
    op.execute("""
        DELETE FROM swisstax.standard_deductions
        WHERE canton IN ('AG', 'TI', 'VS', 'GR', 'ZH', 'BE', 'LU', 'ZG')
          AND tax_year = 2024;
    """)

