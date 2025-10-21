"""Seed church tax config for 2025

Revision ID: 20251020_132500_config_2025
Revises: consolidated_municipalities
Create Date: 2025-10-20 13:25:00

Add 2025 tax year configuration for all 26 Swiss cantons.
This allows for yearly updates while maintaining historical data.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '20251020_132500_config_2025'
down_revision: Union[str, Sequence[str], None] = 'consolidated_municipalities'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Seed 2025 church tax config for all 26 cantons - IDEMPOTENT."""

    print("\n" + "="*70)
    print("SEEDING 2025 CHURCH TAX CONFIG FOR ALL 26 SWISS CANTONS")
    print("="*70 + "\n")

    print("Adding 2025 tax year configurations...")

    op.execute("""
        INSERT INTO swisstax.church_tax_config
        (canton, has_church_tax, recognized_denominations, calculation_method,
         tax_year, notes, official_source)
        VALUES
        -- CANTONS WITH CHURCH TAX (22 cantons) - 2025
        ('ZH', TRUE, ARRAY['catholic', 'reformed', 'christian_catholic'],
         'percentage_of_cantonal_tax', 2025,
         'Rates vary by Kirchgemeinde. Catholic avg 13%, Reformed avg 12%',
         'https://www.zh.ch/de/steuern-finanzen/steuern/kirchensteuer.html'),

        ('BE', TRUE, ARRAY['catholic', 'reformed', 'christian_catholic'],
         'percentage_of_cantonal_tax', 2025,
         'HIGHEST in Switzerland! Catholic ~20%, Reformed ~18%',
         'https://www.sv.fin.be.ch/'),

        ('LU', TRUE, ARRAY['catholic', 'reformed'],
         'percentage_of_cantonal_tax', 2025,
         '80 municipalities. Both denominations typically 25%',
         'https://steuern.lu.ch/'),

        ('UR', TRUE, ARRAY['catholic', 'reformed'],
         'percentage_of_cantonal_tax', 2025,
         'Canton-level: Catholic 12%, Reformed 10-11%',
         'https://www.ur.ch/'),

        ('SZ', TRUE, ARRAY['catholic', 'reformed'],
         'percentage_of_cantonal_tax', 2025,
         'Varies by municipality. Catholic avg 11%, Reformed avg 10%',
         'https://www.sz.ch/'),

        ('OW', TRUE, ARRAY['catholic', 'reformed'],
         'percentage_of_cantonal_tax', 2025,
         'Primarily Catholic canton. Rates 10-12%',
         'https://www.ow.ch/'),

        ('NW', TRUE, ARRAY['catholic', 'reformed'],
         'percentage_of_cantonal_tax', 2025,
         'Primarily Catholic canton. Rates 10-11%',
         'https://www.steuern-nw.ch/'),

        ('GL', TRUE, ARRAY['catholic', 'reformed'],
         'percentage_of_cantonal_tax', 2025,
         'Mixed canton. Rates 11-13%',
         'https://www.gl.ch/'),

        ('ZG', TRUE, ARRAY['catholic', 'reformed', 'christian_catholic'],
         'percentage_of_cantonal_tax', 2025,
         'Low-tax canton. Catholic 7-10%, Reformed similar',
         'https://www.zg.ch/'),

        ('FR', TRUE, ARRAY['catholic', 'reformed'],
         'percentage_of_cantonal_tax', 2025,
         'Bilingual canton. Rates 14-17%',
         'https://www.fr.ch/'),

        ('SO', TRUE, ARRAY['catholic', 'reformed'],
         'percentage_of_cantonal_tax', 2025,
         'Kirchgemeinden. Rates vary 12-16%',
         'https://steuerbuch.so.ch/'),

        ('BS', TRUE, ARRAY['catholic', 'reformed', 'christian_catholic', 'jewish'],
         'percentage_of_cantonal_tax', 2025,
         'UNIFORM 8% across entire canton (simplest system)',
         'https://www.steuerverwaltung.bs.ch/'),

        ('BL', TRUE, ARRAY['catholic', 'reformed'],
         'percentage_of_cantonal_tax', 2025,
         'Varies by municipality. Rates 10-13%',
         'https://www.baselland.ch/'),

        ('SH', TRUE, ARRAY['catholic', 'reformed'],
         'percentage_of_cantonal_tax', 2025,
         'Small canton. Rates 11-14%',
         'https://sh.ch/'),

        ('AR', TRUE, ARRAY['catholic', 'reformed'],
         'percentage_of_cantonal_tax', 2025,
         'UNIQUE: Reformed rates > Catholic rates (opposite of norm)',
         'https://www.ar.ch/'),

        ('AI', TRUE, ARRAY['catholic', 'reformed'],
         'percentage_of_cantonal_tax', 2025,
         'Primarily Catholic canton. Rates 11-13%',
         'https://www.ai.ch/'),

        ('SG', TRUE, ARRAY['catholic', 'reformed', 'christian_catholic'],
         'percentage_of_cantonal_tax', 2025,
         '75 municipalities. Christian Catholic uniform 24%. Others vary',
         'https://www.sg.ch/'),

        ('GR', TRUE, ARRAY['catholic', 'reformed'],
         'percentage_of_cantonal_tax', 2025,
         'Mountain canton. Rates 12-15%',
         'https://www.gr.ch/'),

        ('AG', TRUE, ARRAY['catholic', 'reformed', 'christian_catholic'],
         'percentage_of_cantonal_tax', 2025,
         '197 municipalities. Rates vary widely. Complete data from 2025 PDF',
         'https://www.ag.ch/'),

        ('TG', TRUE, ARRAY['catholic', 'reformed'],
         'percentage_of_cantonal_tax', 2025,
         'Open data available. Rates 10-14%',
         'https://steuerverwaltung.tg.ch/'),

        ('VS', TRUE, ARRAY['catholic', 'reformed'],
         'percentage_of_cantonal_tax', 2025,
         'Special case: Only 3 municipalities levy separate tax',
         'https://www.vs.ch/'),

        ('JU', TRUE, ARRAY['catholic', 'reformed'],
         'percentage_of_cantonal_tax', 2025,
         'French-speaking canton. Rates 15-18%',
         'https://www.jura.ch/'),

        -- CANTONS WITHOUT CHURCH TAX (4 cantons) - 2025
        ('GE', FALSE, ARRAY[]::text[], NULL, 2025,
         'NO church tax. Voluntary contributions only',
         'https://www.ge.ch/'),

        ('NE', FALSE, ARRAY[]::text[], NULL, 2025,
         'NO church tax. Voluntary contributions only',
         'https://www.ne.ch/'),

        ('VD', FALSE, ARRAY[]::text[], NULL, 2025,
         'NO church tax. State covers church costs from general taxes',
         'https://www.vd.ch/'),

        ('TI', FALSE, ARRAY[]::text[], NULL, 2025,
         'NO mandatory church tax. Optional in some municipalities',
         'https://www4.ti.ch/')

        ON CONFLICT (canton, tax_year) DO NOTHING
    """)

    print("✓ Seeded 2025 configurations for all 26 cantons (idempotent)")
    print("="*70 + "\n")


def downgrade() -> None:
    """Remove 2025 church tax config."""
    op.execute("DELETE FROM swisstax.church_tax_config WHERE tax_year = 2025")
    print("✓ Removed 2025 church tax config")
