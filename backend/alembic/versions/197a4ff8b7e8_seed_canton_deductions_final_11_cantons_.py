"""seed_canton_deductions_final_11_cantons_bl_sz_tg_sh_ju_gl_ur_ow_nw_ar_ai

Revision ID: 197a4ff8b7e8
Revises: cf2ba28f80fc
Create Date: 2025-10-21 06:28:43.272065

Seed canton-specific tax deductions for final 11 cantons:
- BL (Basel-Landschaft): 19 deductions - UNIQUE: Unlimited charitable donations
- SZ (Schwyz): 24 deductions - Degressive relief deduction system
- TG (Thurgau): 18 deductions - CHF 10,100 childcare, CHF 6,000 commuting
- SH (Schaffhausen): 20 deductions - Major 2024 reform, CHF 30,000 child deduction
- JU (Jura): 22 deductions - French-speaking canton
- GL (Glarus): 25 deductions - Lower 2% medical threshold
- UR (Uri): 20 deductions - Cold progression adjustments
- OW (Obwalden): 20 deductions - 20% percentage-based insurance
- NW (Nidwalden): 18 deductions - CHF 70,000 married social deduction
- AR (Appenzell Ausserrhoden): 24 deductions - Political donations CHF 10,000
- AI (Appenzell Innerrhoden): 22 deductions - Smallest canton

Total: 232 deduction rules for tax year 2024

🎉 MILESTONE: 100% COVERAGE - All 26 Swiss cantons now have deduction data!

Official sources:
- BL: https://www.baselland.ch/politik-und-behorden/direktionen/finanz-und-kirchendirektion/steuerverwaltung
- SZ: https://www.sz.ch/behoerden/verwaltung/finanzdepartement/steuerverwaltung
- TG: https://steuerverwaltung.tg.ch/
- SH: https://sh.ch/CMS/Webseite/Kanton-Schaffhausen/Beh-rde/Verwaltung/Finanzdepartement/Steuerverwaltung
- JU: https://www.jura.ch/DFI/CTR/Personnes-physiques/Personnes-physiques.html
- GL: https://www.gl.ch/verwaltung/finanzen-und-gesundheit/steuerverwaltung.html
- UR: https://www.ur.ch/verwaltung/finanzdirektion/steuerverwaltung
- OW: https://www.ow.ch/verwaltung/2689
- NW: https://www.steuern-nw.ch
- AR: https://ar.ch/verwaltung/departement-finanzen/steuerverwaltung/
- AI: https://www.ai.ch/verwaltung/finanzdepartement/steuerverwaltung
"""
from typing import Sequence, Union
from pathlib import Path

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '197a4ff8b7e8'
down_revision: Union[str, Sequence[str], None] = 'cf2ba28f80fc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Seed canton deductions for final 11 Swiss cantons (100% coverage)."""

    # Delete existing records for these cantons (idempotent)
    op.execute("""
        DELETE FROM swisstax.standard_deductions
        WHERE canton IN ('BL', 'SZ', 'TG', 'SH', 'JU', 'GL', 'UR', 'OW', 'NW', 'AR', 'AI')
          AND tax_year = 2024;
    """)

    # Read and execute the generated SQL
    backend_dir = Path(__file__).parent.parent.parent
    sql_file = backend_dir / '11cantons_migration_sql.txt'

    if not sql_file.exists():
        raise FileNotFoundError(
            f"SQL file not found: {sql_file}\n"
            "Run: python backend/generate_11cantons_migration.py"
        )

    # Read and execute the SQL
    with open(sql_file, 'r', encoding='utf-8') as f:
        sql_content = f.read()

    op.execute(sql_content)

    print("✅ Seeded 232 deductions for final 11 cantons (BL, SZ, TG, SH, JU, GL, UR, OW, NW, AR, AI)")
    print("🎉 MILESTONE: 100% COVERAGE - All 26 Swiss cantons complete!")
    print(f"   Total deductions in database: 507 (275 from previous + 232 from this migration)")


def downgrade() -> None:
    """Remove canton deductions for final 11 cantons."""
    op.execute("""
        DELETE FROM swisstax.standard_deductions
        WHERE canton IN ('BL', 'SZ', 'TG', 'SH', 'JU', 'GL', 'UR', 'OW', 'NW', 'AR', 'AI')
          AND tax_year = 2024;
    """)
