"""Add encrypted tax models (TaxAnswer, TaxInsight, TaxCalculation)

Revision ID: add_encrypted_tax_models
Revises: d8e7f9a1b2c3
Create Date: 2025-10-06 15:47:34

Implements AES-256 encryption for sensitive PII and financial data
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_encrypted_tax_models'
down_revision = 'd8e7f9a1b2c3'
branch_labels = None
depends_on = None


def upgrade():
    """Add encrypted tax models"""

    # Create tax_answers table with encrypted answer_value
    op.create_table('tax_answers',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('filing_session_id', sa.String(length=36), nullable=False),
        sa.Column('question_id', sa.String(length=50), nullable=False),
        sa.Column('answer_value', sa.Text(), nullable=False),  # ENCRYPTED
        sa.Column('question_text', sa.Text(), nullable=True),
        sa.Column('question_type', sa.String(length=50), nullable=True),
        sa.Column('is_sensitive', sa.Boolean(), nullable=True, default=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['filing_session_id'], ['tax_filing_sessions.id'], ),
    )
    op.create_index(op.f('ix_tax_answers_filing_session_id'), 'tax_answers', ['filing_session_id'], unique=False)
    op.create_index(op.f('ix_tax_answers_question_id'), 'tax_answers', ['question_id'], unique=False)

    # Create tax_insights table
    op.create_table('tax_insights',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('filing_session_id', sa.String(length=36), nullable=False),
        sa.Column('insight_type', sa.Enum('DEDUCTION_OPPORTUNITY', 'TAX_SAVING_TIP', 'COMPLIANCE_WARNING',
                                          'MISSING_DOCUMENT', 'OPTIMIZATION_SUGGESTION', 'CALCULATION_EXPLANATION',
                                          name='insighttype'), nullable=False),
        sa.Column('priority', sa.Enum('HIGH', 'MEDIUM', 'LOW', name='insightpriority'), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('action_items', sa.Text(), nullable=True),
        sa.Column('estimated_savings_chf', sa.Integer(), nullable=True),
        sa.Column('related_questions', sa.Text(), nullable=True),
        sa.Column('is_acknowledged', sa.Integer(), nullable=True, default=0),
        sa.Column('is_applied', sa.Integer(), nullable=True, default=0),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('acknowledged_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['filing_session_id'], ['tax_filing_sessions.id'], ),
    )
    op.create_index(op.f('ix_tax_insights_filing_session_id'), 'tax_insights', ['filing_session_id'], unique=False)
    op.create_index(op.f('ix_tax_insights_insight_type'), 'tax_insights', ['insight_type'], unique=False)
    op.create_index(op.f('ix_tax_insights_priority'), 'tax_insights', ['priority'], unique=False)

    # Create tax_calculations table
    op.create_table('tax_calculations',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('filing_session_id', sa.String(length=36), nullable=False),
        sa.Column('calculation_type', sa.Enum('ESTIMATE', 'DRAFT', 'FINAL', 'REVISED', name='calculationtype'), nullable=False),
        sa.Column('version', sa.Integer(), nullable=False, default=1),
        sa.Column('tax_year', sa.Integer(), nullable=False),
        sa.Column('canton', sa.String(length=2), nullable=False),
        sa.Column('municipality', sa.String(length=100), nullable=True),

        # Income
        sa.Column('gross_income', sa.Integer(), nullable=True, default=0),
        sa.Column('employment_income', sa.Integer(), nullable=True, default=0),
        sa.Column('self_employment_income', sa.Integer(), nullable=True, default=0),
        sa.Column('pension_income', sa.Integer(), nullable=True, default=0),
        sa.Column('investment_income', sa.Integer(), nullable=True, default=0),
        sa.Column('rental_income', sa.Integer(), nullable=True, default=0),
        sa.Column('other_income', sa.Integer(), nullable=True, default=0),

        # Deductions
        sa.Column('total_deductions', sa.Integer(), nullable=True, default=0),
        sa.Column('pillar_2_deduction', sa.Integer(), nullable=True, default=0),
        sa.Column('pillar_3a_deduction', sa.Integer(), nullable=True, default=0),
        sa.Column('social_security_deduction', sa.Integer(), nullable=True, default=0),
        sa.Column('professional_expenses', sa.Integer(), nullable=True, default=0),
        sa.Column('commuting_costs', sa.Integer(), nullable=True, default=0),
        sa.Column('charitable_donations', sa.Integer(), nullable=True, default=0),
        sa.Column('medical_expenses', sa.Integer(), nullable=True, default=0),
        sa.Column('alimony_deduction', sa.Integer(), nullable=True, default=0),
        sa.Column('childcare_costs', sa.Integer(), nullable=True, default=0),
        sa.Column('insurance_premiums', sa.Integer(), nullable=True, default=0),
        sa.Column('other_deductions', sa.Integer(), nullable=True, default=0),

        # Tax Calculation
        sa.Column('taxable_income', sa.Integer(), nullable=True, default=0),
        sa.Column('federal_tax', sa.Integer(), nullable=True, default=0),
        sa.Column('federal_tax_rate', sa.Numeric(precision=5, scale=2), nullable=True, default=0),
        sa.Column('cantonal_tax', sa.Integer(), nullable=True, default=0),
        sa.Column('municipal_tax', sa.Integer(), nullable=True, default=0),
        sa.Column('church_tax', sa.Integer(), nullable=True, default=0),
        sa.Column('total_tax', sa.Integer(), nullable=True, default=0),
        sa.Column('effective_tax_rate', sa.Numeric(precision=5, scale=2), nullable=True, default=0),

        # Additional
        sa.Column('wealth_tax', sa.Integer(), nullable=True, default=0),
        sa.Column('capital_gains_tax', sa.Integer(), nullable=True, default=0),
        sa.Column('total_tax_credits', sa.Integer(), nullable=True, default=0),
        sa.Column('family_tax_credit', sa.Integer(), nullable=True, default=0),
        sa.Column('net_tax_due', sa.Integer(), nullable=True, default=0),
        sa.Column('is_refund', sa.Integer(), nullable=True, default=0),

        # Metadata
        sa.Column('calculation_details', sa.Text(), nullable=True),
        sa.Column('tax_rules_applied', sa.Text(), nullable=True),
        sa.Column('confidence_score', sa.Numeric(precision=3, scale=2), nullable=True, default=0.95),
        sa.Column('validation_warnings', sa.Text(), nullable=True),

        # Timestamps
        sa.Column('calculated_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=True),

        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['filing_session_id'], ['tax_filing_sessions.id'], ),
    )
    op.create_index(op.f('ix_tax_calculations_filing_session_id'), 'tax_calculations', ['filing_session_id'], unique=False)
    op.create_index(op.f('ix_tax_calculations_calculation_type'), 'tax_calculations', ['calculation_type'], unique=False)
    op.create_index(op.f('ix_tax_calculations_tax_year'), 'tax_calculations', ['tax_year'], unique=False)
    op.create_index(op.f('ix_tax_calculations_canton'), 'tax_calculations', ['canton'], unique=False)
    op.create_index(op.f('ix_tax_calculations_calculated_at'), 'tax_calculations', ['calculated_at'], unique=False)


def downgrade():
    """Remove encrypted tax models"""

    # Drop tables
    op.drop_table('tax_calculations')
    op.drop_table('tax_insights')
    op.drop_table('tax_answers')

    # Drop enums (PostgreSQL)
    op.execute('DROP TYPE IF EXISTS calculationtype')
    op.execute('DROP TYPE IF EXISTS insighttype')
    op.execute('DROP TYPE IF EXISTS insightpriority')
