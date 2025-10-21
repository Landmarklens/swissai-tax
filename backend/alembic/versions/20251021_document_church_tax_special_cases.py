"""document_church_tax_special_cases_vd_ge_ne

Revision ID: 20251021_special_cases
Revises: 20251021_basel_stadt
Create Date: 2025-10-21 16:30:00.000000

Document special case cantons that do NOT have traditional mandatory church tax:

1. VD (Vaud): State subsidy system - Churches funded through direct state subsidies
2. GE (Geneva): Laïcité (separation of church and state) - CRV voluntary contribution only
3. NE (Neuchâtel): Voluntary contribution system (11% if opted in)

These cantons should have church_tax = 0 for mandatory calculations.

Official sources:
- VD: https://www.vd.ch/themes/etat-droit-finances/impots/
- GE: https://www.ge.ch/impots/
- NE: https://www.ne.ch/autorites/DFIRE/SCFI
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '20251021_special_cases'
down_revision: Union[str, Sequence[str], None] = '20251021_basel_stadt'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Document special case cantons without mandatory church tax."""

    # Delete any existing records for these cantons (idempotent)
    op.execute("""
        DELETE FROM swisstax.church_tax_rates WHERE canton IN ('VD', 'GE', 'NE') AND tax_year = 2024;
        DELETE FROM swisstax.church_tax_config WHERE canton IN ('VD', 'GE', 'NE') AND tax_year = 2024;
    """)

    # Insert configurations for special case cantons
    op.execute("""
        -- VAUD (VD): State subsidy system
        INSERT INTO swisstax.church_tax_config (
            canton,
            has_church_tax,
            recognized_denominations,
            calculation_method,
            tax_year,
            special_case,
            cantonal_rate,
            notes,
            official_source
        ) VALUES (
            'VD',
            false,  -- No traditional church tax
            ARRAY['catholic', 'protestant'],
            'state_subsidy',
            2024,
            true,
            NULL,  -- No rate - churches funded by state
            'SPECIAL CASE: Vaud does NOT have traditional church tax. Reformed and Catholic churches are public institutions funded through direct state subsidies from general taxation. All taxpayers contribute indirectly regardless of religious affiliation. NO separate church tax is levied.',
            'https://www.vd.ch/themes/etat-droit-finances/impots/'
        );

        -- GENEVA (GE): Voluntary contribution (laïcité)
        INSERT INTO swisstax.church_tax_config (
            canton,
            has_church_tax,
            recognized_denominations,
            calculation_method,
            tax_year,
            special_case,
            cantonal_rate,
            notes,
            official_source
        ) VALUES (
            'GE',
            false,  -- No mandatory church tax
            ARRAY['catholic', 'protestant', 'christian_catholic', 'jewish'],
            'voluntary',
            2024,
            true,
            NULL,  -- Voluntary - no mandatory rate
            'SPECIAL CASE: Geneva practices laïcité (separation of church and state). NO mandatory church tax exists. The CRV (Contribution Religieuse Volontaire) is a completely optional voluntary contribution system. Taxpayers can choose to donate to recognized religious organizations through their tax declaration.',
            'https://www.ge.ch/impots/'
        );

        -- NEUCHÂTEL (NE): Voluntary contribution system
        INSERT INTO swisstax.church_tax_config (
            canton,
            has_church_tax,
            recognized_denominations,
            calculation_method,
            tax_year,
            special_case,
            cantonal_rate,
            notes,
            official_source
        ) VALUES (
            'NE',
            false,  -- No mandatory church tax
            ARRAY['catholic', 'protestant'],
            'voluntary',
            2024,
            true,
            11.0,  -- Voluntary contribution rate (if opted in)
            'SPECIAL CASE: Neuchâtel has a voluntary church contribution system (similar to Geneva). NO mandatory church tax is levied. If taxpayers opt in to contribute, a uniform 11% rate applies canton-wide. This is NOT a mandatory tax.',
            'https://www.ne.ch/autorites/DFIRE/SCFI'
        );
    """)

    print("✅ Documented special case cantons (VD, GE, NE)")
    print("   - VD (Vaud): State subsidy system - NO mandatory church tax")
    print("   - GE (Geneva): Laïcité - Voluntary contribution only")
    print("   - NE (Neuchâtel): Voluntary contribution system (11% if opted in)")
    print("   - These cantons will have church_tax = 0 in calculations")


def downgrade() -> None:
    """Remove special case canton configurations."""
    op.execute("""
        DELETE FROM swisstax.church_tax_rates WHERE canton IN ('VD', 'GE', 'NE') AND tax_year = 2024;
        DELETE FROM swisstax.church_tax_config WHERE canton IN ('VD', 'GE', 'NE') AND tax_year = 2024;
    """)
    print("✅ Removed special case canton configurations (VD, GE, NE)")
