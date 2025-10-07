"""Seed tax rates and deductions for major cantons

Revision ID: 6f18eae11a19
Revises: 88f38ccb234e
Create Date: 2025-09-24 08:08:00.938889

"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '6f18eae11a19'
down_revision: Union[str, Sequence[str], None] = '88f38ccb234e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Seed tax rates and standard deductions"""

    # Seed tax year
    op.execute("""
        INSERT INTO swisstax.tax_years (year, is_current, filing_deadline)
        VALUES (2024, true, '2025-03-31')
        ON CONFLICT (year) DO NOTHING
    """)

    # Seed standard deductions for 2024
    op.execute("""
        INSERT INTO swisstax.standard_deductions
        (canton, deduction_type, deduction_name_en, amount, tax_year)
        VALUES
        -- Federal deductions
        (NULL, 'professional_expenses', 'Professional expenses', 4000.00, 2024),
        (NULL, 'pillar_3a_employed', 'Pillar 3a (employed)', 7056.00, 2024),
        (NULL, 'pillar_3a_self_employed', 'Pillar 3a (self-employed)', 35280.00, 2024),
        (NULL, 'child_deduction', 'Child deduction', 6600.00, 2024),
        (NULL, 'insurance_single', 'Insurance premium (single)', 1750.00, 2024),
        (NULL, 'insurance_married', 'Insurance premium (married)', 3500.00, 2024),

        -- Zurich canton deductions
        ('ZH', 'professional_expenses', 'Professional expenses', 4000.00, 2024),
        ('ZH', 'child_deduction', 'Child deduction', 9000.00, 2024),
        ('ZH', 'childcare', 'Childcare costs', 10100.00, 2024),

        -- Bern canton deductions
        ('BE', 'professional_expenses', 'Professional expenses', 4000.00, 2024),
        ('BE', 'child_deduction', 'Child deduction', 8000.00, 2024),
        ('BE', 'childcare', 'Childcare costs', 8000.00, 2024),

        -- Lucerne canton deductions
        ('LU', 'professional_expenses', 'Professional expenses', 4000.00, 2024),
        ('LU', 'child_deduction', 'Child deduction', 6700.00, 2024),
        ('LU', 'childcare', 'Childcare costs', 6000.00, 2024),

        -- Basel-Stadt deductions
        ('BS', 'professional_expenses', 'Professional expenses', 4000.00, 2024),
        ('BS', 'child_deduction', 'Child deduction', 7800.00, 2024),
        ('BS', 'childcare', 'Childcare costs', 11000.00, 2024),

        -- Zug canton deductions
        ('ZG', 'professional_expenses', 'Professional expenses', 4000.00, 2024),
        ('ZG', 'child_deduction', 'Child deduction', 12000.00, 2024),
        ('ZG', 'childcare', 'Childcare costs', 12000.00, 2024)

        ON CONFLICT DO NOTHING
    """)

    # Seed document types
    op.execute("""
        INSERT INTO swisstax.document_types
        (code, name_en, name_de, category, is_mandatory, sort_order)
        VALUES
        ('PERSONAL_ID', 'Personal identification', 'Personalausweis', 'identity', true, 1),
        ('LOHNAUSWEIS', 'Salary certificate', 'Lohnausweis', 'income', false, 10),
        ('BANK_STATEMENTS', 'Bank statements', 'Kontoauszüge', 'income', false, 20),
        ('DIVIDEND_STATEMENTS', 'Dividend statements', 'Dividendenauszüge', 'income', false, 21),
        ('PILLAR_3A', 'Pillar 3a certificate', 'Säule 3a Bescheinigung', 'deductions', false, 30),
        ('INSURANCE_PREMIUM', 'Insurance premium statement', 'Versicherungsprämien', 'deductions', false, 31),
        ('MEDICAL_RECEIPTS', 'Medical expense receipts', 'Arztkosten Belege', 'deductions', false, 32),
        ('TRAINING_RECEIPTS', 'Training expense receipts', 'Weiterbildungskosten', 'deductions', false, 33),
        ('PROPERTY_OWNERSHIP', 'Property ownership documents', 'Eigentumsnachweis', 'assets', false, 40),
        ('RENTAL_INCOME', 'Rental income statements', 'Mieteinnahmen', 'income', false, 41),
        ('MORTGAGE_STATEMENT', 'Mortgage interest statement', 'Hypothekarzinsen', 'deductions', false, 42),
        ('BUSINESS_STATEMENTS', 'Business income statements', 'Geschäftseinkommen', 'income', false, 50),
        ('ALIMONY_PROOF', 'Alimony payment proof', 'Unterhaltszahlungen', 'deductions', false, 60),
        ('FOREIGN_TAX_STATEMENTS', 'Foreign tax statements', 'Ausländische Steuererklärungen', 'international', false, 70),
        ('CRYPTO_STATEMENTS', 'Cryptocurrency statements', 'Kryptowährung Auszüge', 'assets', false, 80)

        ON CONFLICT (code) DO UPDATE SET
            name_en = EXCLUDED.name_en,
            name_de = EXCLUDED.name_de,
            category = EXCLUDED.category,
            sort_order = EXCLUDED.sort_order
    """)


def downgrade() -> None:
    """Remove seeded data"""
    op.execute("DELETE FROM swisstax.document_types WHERE code IN ('PERSONAL_ID', 'LOHNAUSWEIS', 'BANK_STATEMENTS')")
    op.execute("DELETE FROM swisstax.standard_deductions WHERE tax_year = 2024")
    op.execute("DELETE FROM swisstax.tax_years WHERE year = 2024")
