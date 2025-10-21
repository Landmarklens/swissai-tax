"""Create social_security_rates table and seed 2024 rates

Revision ID: ce652dd16873
Revises: 20251018_ur_munic
Create Date: 2025-10-20 09:20:14.383634

Source: Official Swiss Federal Social Insurance Office (FSIO)
- AHV/IV/EO: https://www.ahv-iv.ch/de/Merkblätter-Formulare/Merkblätter/Beiträge
- ALV: https://www.ahv-iv.ch/de/Merkblätter-Formulare/Merkblätter/Arbeitslosenversicherung
- BVG: https://www.bsv.admin.ch/bsv/de/home/sozialversicherungen/bv.html
Tax year: 2024
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'ce652dd16873'
down_revision: Union[str, Sequence[str], None] = '20251018_ur_munic'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create social_security_rates table and seed 2024 rates."""

    # Create social_security_rates table
    op.execute("""
        CREATE TABLE IF NOT EXISTS swisstax.social_security_rates (
            id SERIAL PRIMARY KEY,
            contribution_type VARCHAR(50) NOT NULL,
            employment_type VARCHAR(50) NOT NULL,
            rate_employee NUMERIC(6, 5),
            rate_employer NUMERIC(6, 5),
            rate_total NUMERIC(6, 5),
            income_threshold_min NUMERIC(12, 2),
            income_threshold_max NUMERIC(12, 2),
            rate_category VARCHAR(50),
            tax_year INTEGER NOT NULL,
            is_tax_deductible BOOLEAN DEFAULT FALSE,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(contribution_type, employment_type, rate_category, tax_year)
        )
    """)

    # Seed 2024 rates
    op.execute("""
        INSERT INTO swisstax.social_security_rates
        (contribution_type, employment_type, rate_employee, rate_employer, rate_total,
         income_threshold_min, income_threshold_max, rate_category, tax_year, is_tax_deductible, notes)
        VALUES
        -- AHV/IV/EO for employed persons (10.6% total, split 50/50)
        ('AHV_IV_EO', 'employed', 0.05300, 0.05300, 0.10600, NULL, NULL, 'standard', 2024, FALSE,
         'Old Age, Disability, Income Compensation Insurance - Employed'),

        -- AHV/IV/EO for self-employed (sliding scale based on income)
        ('AHV_IV_EO', 'self_employed', 0.05371, NULL, 0.05371, 0.00, 9800.00, 'lowest', 2024, FALSE,
         'Self-employed: 5.371% for income up to CHF 9,800 (incl. admin costs)'),
        ('AHV_IV_EO', 'self_employed', 0.06800, NULL, 0.06800, 9800.01, 58800.00, 'sliding', 2024, FALSE,
         'Self-employed: 6.8% sliding scale (58,800 = CHF 4,000/year)'),
        ('AHV_IV_EO', 'self_employed', 0.10000, NULL, 0.10000, 58800.01, NULL, 'highest', 2024, FALSE,
         'Self-employed: 10.0% for income above CHF 58,800'),

        -- ALV (Unemployment Insurance) - standard rate up to ceiling
        ('ALV', 'employed', 0.01100, 0.01100, 0.02200, NULL, 148200.00, 'standard', 2024, FALSE,
         'Unemployment insurance up to CHF 148,200'),

        -- ALV solidarity contribution above ceiling
        ('ALV', 'employed', 0.00500, 0.00500, 0.01000, 148200.01, NULL, 'solidarity', 2024, FALSE,
         'ALV solidarity contribution above CHF 148,200'),

        -- ALV for self-employed (optional, not mandatory)
        ('ALV', 'self_employed', NULL, NULL, NULL, NULL, NULL, 'not_applicable', 2024, FALSE,
         'Self-employed persons are not covered by ALV'),

        -- UVG NBU (Non-occupational accident insurance) - employee pays
        ('UVG_NBU', 'employed', 0.01600, NULL, 0.01600, NULL, NULL, 'standard', 2024, FALSE,
         'Non-occupational accident insurance (average rate, varies by insurer)'),

        -- UVG for self-employed (optional private insurance)
        ('UVG_NBU', 'self_employed', NULL, NULL, NULL, NULL, NULL, 'private', 2024, FALSE,
         'Self-employed: Optional private accident insurance'),

        -- BVG/Pillar 2 age 25-34 (on coordinated salary)
        ('BVG', 'employed', 0.07000, 0.07000, 0.14000, NULL, NULL, 'age_25_34', 2024, TRUE,
         'Occupational pension age 25-34: 7% each on coordinated salary'),

        -- BVG/Pillar 2 age 35-44
        ('BVG', 'employed', 0.10000, 0.10000, 0.20000, NULL, NULL, 'age_35_44', 2024, TRUE,
         'Occupational pension age 35-44: 10% each on coordinated salary'),

        -- BVG/Pillar 2 age 45-54
        ('BVG', 'employed', 0.15000, 0.15000, 0.30000, NULL, NULL, 'age_45_54', 2024, TRUE,
         'Occupational pension age 45-54: 15% each on coordinated salary'),

        -- BVG/Pillar 2 age 55-65
        ('BVG', 'employed', 0.18000, 0.18000, 0.36000, NULL, NULL, 'age_55_65', 2024, TRUE,
         'Occupational pension age 55-65: 18% each on coordinated salary')

        ON CONFLICT (contribution_type, employment_type, rate_category, tax_year)
        DO UPDATE SET
            rate_employee = EXCLUDED.rate_employee,
            rate_employer = EXCLUDED.rate_employer,
            rate_total = EXCLUDED.rate_total,
            income_threshold_min = EXCLUDED.income_threshold_min,
            income_threshold_max = EXCLUDED.income_threshold_max,
            is_tax_deductible = EXCLUDED.is_tax_deductible,
            notes = EXCLUDED.notes,
            updated_at = CURRENT_TIMESTAMP
    """)

    print("✓ Created social_security_rates table")
    print("✓ Seeded 2024 Swiss social security contribution rates")
    print("  - AHV/IV/EO: employed (10.6%) and self-employed sliding scale (5.371%-10%)")
    print("  - ALV: 1.1% up to CHF 148,200, 0.5% solidarity above")
    print("  - UVG NBU: 1.6% average (employee pays)")
    print("  - BVG: 7%-18% age-dependent on coordinated salary")


def downgrade() -> None:
    """Drop social_security_rates table."""
    op.execute("DROP TABLE IF EXISTS swisstax.social_security_rates")
    print("✓ Dropped social_security_rates table")
