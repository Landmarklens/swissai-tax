"""seed_ai_extraction_data

Revision ID: ed83d192d899
Revises: 252747af2481
Create Date: 2025-10-14 11:04:26.917350

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ed83d192d899'
down_revision: Union[str, Sequence[str], None] = '252747af2481'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Seed AI extraction data including templates, minimal questions, and document requirements"""

    # 1. Insert AI extraction templates for all document types
    op.execute("""
        INSERT INTO swisstax.ai_extraction_templates (document_type, extraction_prompt, field_mappings, validation_rules, version)
        VALUES
        -- Employment & Income
        ('lohnausweis',
         'Extract: employer name, employee name, AHV number, gross salary, net salary, AHV/IV/EO deductions, BVG contributions (employer and employee), taxable allowances, tax withheld.',
         '{"employer": "employer_name", "employee": "employee_name", "ahv": "ahv_number", "gross": "gross_salary", "net": "net_salary", "social": "social_deductions", "bvg_employer": "pension.employer", "bvg_employee": "pension.employee"}',
         '{"gross_salary": {"min": 0, "max": 10000000}, "net_salary": {"min": 0, "max": "gross_salary"}}',
         '1.0'),

        -- Banking
        ('bank_statement',
         'Extract: bank name, account holder name, IBAN, account number, currency, year-end balance (31.12), interest income, fees, transaction summary.',
         '{"bank": "bank_name", "holder": "account_holder", "iban": "account_iban", "balance": "year_end_balance", "interest": "interest_income", "fees": "annual_fees"}',
         '{"year_end_balance": {"type": "number"}, "iban": {"pattern": "^CH\\d{2}[A-Z0-9]{4}\\d{12}$"}}',
         '1.0'),

        -- Investments
        ('broker_statement',
         'Extract: broker/custodian name, account holder, portfolio total value (31.12), complete holdings list (for each: asset type, name, ISIN/ticker, quantity, year-end value), dividends received, foreign withholding tax, realized gains/losses.',
         '{"broker": "broker_name", "portfolio": "portfolio_value", "holdings": "securities_list", "dividends": "dividend_income", "withholding": "foreign_withholding_tax", "gains": "realized_gains"}',
         '{"portfolio_value": {"min": 0}, "holdings": {"type": "array"}}',
         '1.0'),

        -- Property & Mortgages
        ('mortgage_statement',
         'Extract: lender name, loan identifier, outstanding principal (31.12), interest paid in year, amortization paid, collateral/property reference.',
         '{"lender": "lender_name", "loan_id": "loan_number", "outstanding": "principal_outstanding", "interest": "interest_paid", "amortization": "principal_repaid"}',
         '{"principal_outstanding": {"min": 0}, "interest_paid": {"min": 0}}',
         '1.0'),

        ('property_valuation',
         'Extract: property address, owner name, ownership share (%), official tax value (Steuerwert), imputed rental value (Eigenmietwert) if owner-occupied.',
         '{"address": "property_address", "owner": "owner_name", "share": "ownership_percentage", "tax_value": "steuerwert", "imputed_rent": "eigenmietwert"}',
         '{"ownership_percentage": {"min": 0, "max": 100}}',
         '1.0'),

        -- Pension & Insurance
        ('pillar_3a_certificate',
         'Extract: provider/bank name, account holder, annual contribution amount, current balance, tax year.',
         '{"provider": "institution_name", "contribution": "annual_contribution", "balance": "account_balance"}',
         '{"annual_contribution": {"min": 0, "max": 7056}}',
         '1.0'),

        ('pillar_2_statement',
         'Extract: pension fund name, employer contributions, employee contributions, vested benefits balance, projected retirement capital.',
         '{"fund": "pension_fund", "employer_contrib": "employer_contribution", "employee_contrib": "employee_contribution", "vested": "vested_benefits"}',
         '{"employer_contribution": {"min": 0}, "employee_contribution": {"min": 0}}',
         '1.0'),

        ('insurance_premium',
         'Extract: insurer name, insured person(s), insurance type (health/life/accident/disability), annual premium amount.',
         '{"insurer": "insurance_company", "insured": "insured_persons", "type": "insurance_type", "premium": "annual_premium"}',
         '{"annual_premium": {"min": 0}}',
         '1.0'),

        -- Deductions
        ('daycare_invoice',
         'Extract: daycare/Kita provider name, child name, service period (from/to dates), invoice amount, payment date.',
         '{"provider": "daycare_name", "child": "child_name", "period": "service_period", "amount": "invoice_amount"}',
         '{"invoice_amount": {"min": 0, "max": 50000}}',
         '1.0'),

        ('medical_invoice',
         'Extract: healthcare provider, patient name, service date, service type, invoice amount, reimbursed amount (if shown).',
         '{"provider": "medical_provider", "patient": "patient_name", "amount": "invoice_amount", "reimbursed": "insurance_reimbursement"}',
         '{"invoice_amount": {"min": 0}}',
         '1.0'),

        ('donation_receipt',
         'Extract: charity/organization name, registration number, donation date, donation amount, donor name.',
         '{"charity": "organization_name", "registration": "registration_number", "date": "donation_date", "amount": "donation_amount"}',
         '{"donation_amount": {"min": 100}}',
         '1.0'),

        ('education_invoice',
         'Extract: educational institution, course/program name, student name, tuition amount, period.',
         '{"institution": "school_name", "course": "program_name", "amount": "tuition_amount", "period": "course_period"}',
         '{"tuition_amount": {"min": 0}}',
         '1.0'),

        -- Self-Employment
        ('business_pnl',
         'Extract: business name, revenue total, expenses by category (office, travel, wages, depreciation, other), net income, VAT if applicable.',
         '{"business": "business_name", "revenue": "total_revenue", "expenses": "expense_breakdown", "net": "net_income", "vat": "vat_amount"}',
         '{"total_revenue": {"min": 0}, "net_income": {"type": "number"}}',
         '1.0'),

        ('vat_statement',
         'Extract: VAT collected on sales, VAT paid on purchases, net VAT payable/receivable, reporting period.',
         '{"vat_collected": "output_vat", "vat_paid": "input_vat", "net_vat": "vat_balance", "period": "reporting_period"}',
         '{"vat_balance": {"type": "number"}}',
         '1.0'),

        -- Foreign Income
        ('foreign_income_statement',
         'Extract: country of source, income type, gross amount in foreign currency, exchange rate, CHF equivalent, foreign tax withheld.',
         '{"country": "source_country", "type": "income_type", "gross": "foreign_amount", "chf": "chf_equivalent", "tax": "foreign_tax"}',
         '{"foreign_amount": {"min": 0}, "foreign_tax": {"min": 0}}',
         '1.0')
        ON CONFLICT (document_type) DO UPDATE SET
            extraction_prompt = EXCLUDED.extraction_prompt,
            field_mappings = EXCLUDED.field_mappings,
            validation_rules = EXCLUDED.validation_rules;
    """)

    # 2. Insert minimal questions
    op.execute("""
        INSERT INTO swisstax.questions (id, category, question_text_de, question_text_fr, question_text_it, question_text_en,
                                        question_type, is_minimal, ai_extractable, skip_option_enabled, options, sort_order)
        VALUES
        -- Setup questions (required)
        ('M01', 'setup', 'Wohnsitzkanton', 'Canton de résidence', 'Cantone di residenza', 'Canton of residence',
         'single_choice', true, false, false,
         '{"options": ["Zürich", "Aargau", "Bern", "Basel-Stadt", "Basel-Land", "Luzern", "Zug", "Schwyz", "St. Gallen", "Thurgau"]}',
         1),

        ('M02', 'setup', 'Wohnsitzgemeinde', 'Commune de résidence', 'Comune di residenza', 'Municipality',
         'text', true, false, false, null, 2),

        ('M03', 'setup', 'Ich stimme der KI-Extraktion meiner Dokumente zu',
         'Je consens à l''extraction IA de mes documents',
         'Acconsento all''estrazione AI dei miei documenti',
         'I consent to AI extraction of my documents',
         'boolean', true, false, false, null, 3),

        -- Situation questions (with Skip option)
        ('M04', 'situation', 'Haben Sie einen Ehepartner/Partner für gemeinsame Veranlagung?',
         'Avez-vous un conjoint/partenaire pour une déclaration commune?',
         'Ha un coniuge/partner per dichiarazione congiunta?',
         'Do you have a spouse/partner for joint filing?',
         'single_choice', true, true, true,
         '{"options": ["Ja", "Nein", "Überspringen"], "extraction_sources": ["lohnausweis", "insurance_statements"]}',
         4),

        ('M05', 'situation', 'Haben Sie unterstützungspflichtige Kinder?',
         'Avez-vous des enfants à charge?',
         'Ha figli a carico?',
         'Do you have dependent children?',
         'single_choice', true, true, true,
         '{"options": ["Ja", "Nein", "Überspringen"], "extraction_sources": ["daycare_invoices", "family_allowance", "insurance_statements"]}',
         5),

        ('M06', 'situation', 'Sind Sie selbstständig erwerbend?',
         'Êtes-vous indépendant?',
         'È lavoratore autonomo?',
         'Are you self-employed?',
         'single_choice', true, true, true,
         '{"options": ["Ja", "Nein", "Überspringen"], "extraction_sources": ["business_pnl", "vat_statements", "business_bank_statements"]}',
         6),

        ('M07', 'situation', 'Besitzen Sie Immobilien?',
         'Possédez-vous des biens immobiliers?',
         'Possiede immobili?',
         'Do you own real estate?',
         'single_choice', true, true, true,
         '{"options": ["Ja", "Nein", "Überspringen"], "extraction_sources": ["mortgage_statements", "property_tax_valuation"]}',
         7),

        ('M08', 'situation', 'Haben Sie Wertschriftenanlagen (Aktien, Fonds, etc.)?',
         'Avez-vous des placements en valeurs mobilières?',
         'Ha investimenti in titoli?',
         'Do you have investment accounts?',
         'single_choice', true, true, true,
         '{"options": ["Ja", "Nein", "Überspringen"], "extraction_sources": ["broker_statements", "dividend_statements", "crypto_reports"]}',
         8),

        ('M09', 'situation', 'Möchten Sie die elektronische Einreichung bei den Steuerbehörden aktivieren?',
         'Souhaitez-vous activer la soumission électronique?',
         'Desidera attivare l''invio elettronico?',
         'Do you want to enable electronic submission to tax authorities?',
         'boolean', true, false, false, null, 9)
        ON CONFLICT (id) DO UPDATE SET
            is_minimal = EXCLUDED.is_minimal,
            ai_extractable = EXCLUDED.ai_extractable,
            skip_option_enabled = EXCLUDED.skip_option_enabled,
            extraction_sources = EXCLUDED.extraction_sources;
    """)

    # 3. Insert document requirements by profile
    op.execute("""
        INSERT INTO swisstax.document_requirements (profile_type, document_type, is_required, condition_expression, priority,
                                                    help_text_de, help_text_en)
        VALUES
        -- Always required
        (NULL, 'lohnausweis', true, NULL, 1,
         'Lohnausweis aller Arbeitgeber', 'Salary certificate from all employers'),

        (NULL, 'bank_statement', true, NULL, 2,
         'Jahresendauszüge aller Bank- und Postkonten', 'Year-end statements for all bank accounts'),

        -- Conditional requirements
        ('self_employed', 'business_pnl', true, 'self_employed == true', 3,
         'Gewinn- und Verlustrechnung', 'Profit and loss statement'),

        ('self_employed', 'vat_statement', false, 'self_employed == true AND vat_registered == true', 4,
         'MWST-Abrechnung', 'VAT statement'),

        ('investor', 'broker_statement', true, 'has_investments == true', 5,
         'Wertschriftenverzeichnis', 'Securities portfolio statement'),

        ('property_owner', 'mortgage_statement', true, 'has_property == true', 6,
         'Hypothekarauszug', 'Mortgage statement'),

        ('property_owner', 'property_valuation', true, 'has_property == true', 7,
         'Amtliche Bewertung der Liegenschaft', 'Official property valuation'),

        (NULL, 'pillar_3a_certificate', false, NULL, 8,
         'Säule 3a Bescheinigung', 'Pillar 3a certificate'),

        (NULL, 'insurance_premium', false, NULL, 9,
         'Krankenversicherungsprämien', 'Health insurance premiums'),

        (NULL, 'daycare_invoice', false, 'has_children == true', 10,
         'Kinderbetreuungskosten', 'Childcare costs'),

        (NULL, 'donation_receipt', false, NULL, 11,
         'Spendenbescheinigungen (über CHF 100)', 'Donation receipts (over CHF 100)')
        ON CONFLICT DO NOTHING;
    """)

    # 4. Insert canton form mappings
    op.execute("""
        INSERT INTO swisstax.canton_form_mappings (canton, tax_year, form_type, field_mappings, validation_rules)
        VALUES
        -- Zurich 2024
        ('ZH', 2024, 'hauptformular',
         '{
            "personal.full_name": "field_001",
            "personal.ahv": "field_002",
            "personal.date_of_birth": "field_003",
            "personal.address": "field_004",
            "employment[0].gross_salary": "field_110",
            "employment[0].net_salary": "field_111",
            "employment[0].ahv_deductions": "field_112",
            "bank_accounts.total_balance": "field_310",
            "securities.portfolio_value": "field_320",
            "deductions.pillar_3a": "field_410",
            "deductions.insurance": "field_420",
            "deductions.childcare": "field_430"
         }',
         '{
            "field_110": {"required": true, "type": "number", "min": 0},
            "field_310": {"required": true, "type": "number"}
         }'),

        -- Aargau 2024
        ('AG', 2024, 'easytax_main',
         '{
            "personal.full_name": "A01",
            "personal.ahv": "A02",
            "personal.date_of_birth": "A03",
            "employment[0].gross_salary": "B10",
            "employment[0].net_salary": "B11",
            "bank_accounts.total_balance": "C10",
            "securities.portfolio_value": "C20",
            "deductions.total": "D01"
         }',
         '{
            "B10": {"required": true, "type": "number", "min": 0},
            "C10": {"required": true, "type": "number"}
         }'),

        -- Zurich Wertschriftenverzeichnis
        ('ZH', 2024, 'wertschriftenverzeichnis',
         '{
            "securities[].name": "WS_name",
            "securities[].isin": "WS_isin",
            "securities[].quantity": "WS_quantity",
            "securities[].value": "WS_value",
            "securities[].dividends": "WS_dividends",
            "securities[].withholding": "WS_withholding"
         }',
         '{}'),

        -- Zurich Liegenschaftenverzeichnis
        ('ZH', 2024, 'liegenschaftenverzeichnis',
         '{
            "properties[].address": "L_address",
            "properties[].tax_value": "L_steuerwert",
            "properties[].eigenmietwert": "L_eigenmietwert",
            "properties[].mortgage_interest": "L_hypozins"
         }',
         '{}')
        ON CONFLICT (canton, tax_year, form_type) DO UPDATE SET
            field_mappings = EXCLUDED.field_mappings,
            validation_rules = EXCLUDED.validation_rules;
    """)

    # 5. Insert question conditions for dynamic flow
    op.execute("""
        INSERT INTO swisstax.question_conditions (question_id, condition_type, condition_expression, target_question_id, priority)
        VALUES
        -- Show childcare questions only if has children
        ('Q08', 'show_if', 'M05 == "Ja"', NULL, 1),

        -- Show self-employment section if self-employed
        ('Q09', 'show_if', 'M06 == "Ja"', NULL, 2),

        -- Show property section if owns property
        ('Q10', 'show_if', 'M07 == "Ja"', NULL, 3),

        -- Show investment section if has investments
        ('Q11', 'show_if', 'M08 == "Ja"', NULL, 4),

        -- Make spouse income required if married
        ('Q03', 'required_if', 'M04 == "Ja"', NULL, 5)
        ON CONFLICT DO NOTHING;
    """)

    print("✅ AI extraction seed data inserted successfully")


def downgrade() -> None:
    """Remove seeded AI extraction data"""

    # Delete in reverse order of dependencies
    op.execute("DELETE FROM swisstax.question_conditions WHERE question_id LIKE 'M%'")
    op.execute("DELETE FROM swisstax.canton_form_mappings WHERE tax_year = 2024")
    op.execute("DELETE FROM swisstax.document_requirements")
    op.execute("DELETE FROM swisstax.questions WHERE id LIKE 'M%'")
    op.execute("DELETE FROM swisstax.ai_extraction_templates")

    print("✅ AI extraction seed data removed successfully")
