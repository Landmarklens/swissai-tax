"""Initial schema with users, questions, sessions, documents, and tax tables

Revision ID: 9eadbee3622b
Revises: 
Create Date: 2025-09-23 21:27:24.038680

"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '9eadbee3622b'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create schema
    op.execute("CREATE SCHEMA IF NOT EXISTS swisstax")

    # Users table
    op.create_table('users',
        sa.Column('id', sa.UUID, primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('email', sa.String(255), unique=True, nullable=False),
        sa.Column('phone', sa.String(50)),
        sa.Column('first_name', sa.String(100)),
        sa.Column('last_name', sa.String(100)),
        sa.Column('preferred_language', sa.String(2), server_default='DE'),
        sa.Column('canton', sa.String(2)),
        sa.Column('municipality', sa.String(100)),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('last_login', sa.TIMESTAMP(timezone=True)),
        sa.Column('is_active', sa.Boolean, server_default='true'),
        schema='swisstax'
    )

    # Tax years table
    op.create_table('tax_years',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('year', sa.Integer, unique=True, nullable=False),
        sa.Column('is_current', sa.Boolean, server_default='false'),
        sa.Column('filing_deadline', sa.Date),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
        schema='swisstax'
    )

    # Questions table
    op.create_table('questions',
        sa.Column('id', sa.String(10), primary_key=True),
        sa.Column('category', sa.String(50)),
        sa.Column('question_text_de', sa.Text, nullable=False),
        sa.Column('question_text_fr', sa.Text),
        sa.Column('question_text_en', sa.Text),
        sa.Column('question_text_it', sa.Text),
        sa.Column('help_text_de', sa.Text),
        sa.Column('help_text_fr', sa.Text),
        sa.Column('help_text_en', sa.Text),
        sa.Column('help_text_it', sa.Text),
        sa.Column('question_type', sa.String(20), nullable=False),
        sa.Column('options', sa.JSON),
        sa.Column('validation_rules', sa.JSON),
        sa.Column('depends_on', sa.String(10)),
        sa.Column('depends_on_value', sa.JSON),
        sa.Column('sort_order', sa.Integer),
        sa.Column('is_active', sa.Boolean, server_default='true'),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
        schema='swisstax'
    )

    # Interview sessions table
    op.create_table('interview_sessions',
        sa.Column('id', sa.UUID, primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', sa.UUID, sa.ForeignKey('swisstax.users.id', ondelete='CASCADE')),
        sa.Column('tax_year', sa.Integer),
        sa.Column('status', sa.String(20), server_default='in_progress'),
        sa.Column('current_question', sa.String(10)),
        sa.Column('completion_percentage', sa.Integer, server_default='0'),
        sa.Column('started_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('completed_at', sa.TIMESTAMP(timezone=True)),
        sa.Column('submitted_at', sa.TIMESTAMP(timezone=True)),
        sa.UniqueConstraint('user_id', 'tax_year'),
        schema='swisstax'
    )

    # Interview answers table
    op.create_table('interview_answers',
        sa.Column('id', sa.UUID, primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('session_id', sa.UUID, sa.ForeignKey('swisstax.interview_sessions.id', ondelete='CASCADE')),
        sa.Column('question_id', sa.String(10), sa.ForeignKey('swisstax.questions.id')),
        sa.Column('answer_value', sa.JSON),
        sa.Column('answered_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.UniqueConstraint('session_id', 'question_id'),
        schema='swisstax'
    )

    # Document types table
    op.create_table('document_types',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('code', sa.String(50), unique=True, nullable=False),
        sa.Column('name_de', sa.String(255), nullable=False),
        sa.Column('name_fr', sa.String(255)),
        sa.Column('name_en', sa.String(255)),
        sa.Column('name_it', sa.String(255)),
        sa.Column('description_de', sa.Text),
        sa.Column('description_fr', sa.Text),
        sa.Column('description_en', sa.Text),
        sa.Column('description_it', sa.Text),
        sa.Column('category', sa.String(50)),
        sa.Column('is_mandatory', sa.Boolean, server_default='false'),
        sa.Column('sort_order', sa.Integer),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
        schema='swisstax'
    )

    # Required documents table
    op.create_table('required_documents',
        sa.Column('id', sa.UUID, primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('session_id', sa.UUID, sa.ForeignKey('swisstax.interview_sessions.id', ondelete='CASCADE')),
        sa.Column('document_type_id', sa.Integer, sa.ForeignKey('swisstax.document_types.id')),
        sa.Column('is_required', sa.Boolean, server_default='true'),
        sa.Column('reason', sa.String(255)),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.UniqueConstraint('session_id', 'document_type_id'),
        schema='swisstax'
    )

    # Documents table
    op.create_table('documents',
        sa.Column('id', sa.UUID, primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('session_id', sa.UUID, sa.ForeignKey('swisstax.interview_sessions.id', ondelete='CASCADE')),
        sa.Column('document_type_id', sa.Integer, sa.ForeignKey('swisstax.document_types.id')),
        sa.Column('file_name', sa.String(255), nullable=False),
        sa.Column('file_size', sa.Integer),
        sa.Column('mime_type', sa.String(100)),
        sa.Column('s3_key', sa.String(500), nullable=False),
        sa.Column('s3_bucket', sa.String(255), nullable=False),
        sa.Column('status', sa.String(20), server_default='uploaded'),
        sa.Column('ocr_data', sa.JSON),
        sa.Column('extracted_fields', sa.JSON),
        sa.Column('uploaded_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('processed_at', sa.TIMESTAMP(timezone=True)),
        schema='swisstax'
    )

    # Tax calculations table
    op.create_table('tax_calculations',
        sa.Column('id', sa.UUID, primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('session_id', sa.UUID, sa.ForeignKey('swisstax.interview_sessions.id', ondelete='CASCADE')),
        sa.Column('calculation_type', sa.String(20)),
        sa.Column('gross_income', sa.Numeric(12, 2)),
        sa.Column('deductions', sa.Numeric(12, 2)),
        sa.Column('taxable_income', sa.Numeric(12, 2)),
        sa.Column('federal_tax', sa.Numeric(12, 2)),
        sa.Column('cantonal_tax', sa.Numeric(12, 2)),
        sa.Column('municipal_tax', sa.Numeric(12, 2)),
        sa.Column('church_tax', sa.Numeric(12, 2)),
        sa.Column('total_tax', sa.Numeric(12, 2)),
        sa.Column('calculation_details', sa.JSON),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
        schema='swisstax'
    )

    # Tax rates table
    op.create_table('tax_rates',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('canton', sa.String(2), nullable=False),
        sa.Column('municipality', sa.String(100)),
        sa.Column('tax_year', sa.Integer, nullable=False),
        sa.Column('rate_type', sa.String(20)),
        sa.Column('tax_bracket_min', sa.Numeric(12, 2)),
        sa.Column('tax_bracket_max', sa.Numeric(12, 2)),
        sa.Column('tax_rate', sa.Numeric(5, 4)),
        sa.Column('fixed_amount', sa.Numeric(12, 2)),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.UniqueConstraint('canton', 'municipality', 'tax_year', 'rate_type', 'tax_bracket_min'),
        schema='swisstax'
    )

    # Standard deductions table
    op.create_table('standard_deductions',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('canton', sa.String(2)),
        sa.Column('deduction_type', sa.String(50), nullable=False),
        sa.Column('deduction_name_de', sa.String(255)),
        sa.Column('deduction_name_fr', sa.String(255)),
        sa.Column('deduction_name_en', sa.String(255)),
        sa.Column('deduction_name_it', sa.String(255)),
        sa.Column('amount', sa.Numeric(12, 2)),
        sa.Column('percentage', sa.Numeric(5, 2)),
        sa.Column('max_amount', sa.Numeric(12, 2)),
        sa.Column('min_amount', sa.Numeric(12, 2)),
        sa.Column('tax_year', sa.Integer, nullable=False),
        sa.Column('conditions', sa.JSON),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
        schema='swisstax'
    )

    # Audit log table
    op.create_table('audit_log',
        sa.Column('id', sa.UUID, primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', sa.UUID, sa.ForeignKey('swisstax.users.id')),
        sa.Column('action', sa.String(50), nullable=False),
        sa.Column('entity_type', sa.String(50)),
        sa.Column('entity_id', sa.String(100)),
        sa.Column('old_value', sa.JSON),
        sa.Column('new_value', sa.JSON),
        sa.Column('ip_address', sa.dialects.postgresql.INET),
        sa.Column('user_agent', sa.Text),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
        schema='swisstax'
    )

    # Create indexes
    op.create_index('idx_users_email', 'users', ['email'], schema='swisstax')
    op.create_index('idx_interview_sessions_user_id', 'interview_sessions', ['user_id'], schema='swisstax')
    op.create_index('idx_interview_sessions_status', 'interview_sessions', ['status'], schema='swisstax')
    op.create_index('idx_interview_answers_session_id', 'interview_answers', ['session_id'], schema='swisstax')
    op.create_index('idx_documents_session_id', 'documents', ['session_id'], schema='swisstax')
    op.create_index('idx_documents_status', 'documents', ['status'], schema='swisstax')
    op.create_index('idx_tax_calculations_session_id', 'tax_calculations', ['session_id'], schema='swisstax')
    op.create_index('idx_audit_log_user_id', 'audit_log', ['user_id'], schema='swisstax')
    op.create_index('idx_audit_log_created_at', 'audit_log', ['created_at'], schema='swisstax')

    # Create update trigger function
    op.execute("""
        CREATE OR REPLACE FUNCTION swisstax.update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ language 'plpgsql';
    """)

    # Create trigger for users table
    op.execute("""
        CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON swisstax.users
        FOR EACH ROW EXECUTE FUNCTION swisstax.update_updated_at_column();
    """)


def downgrade() -> None:
    """Downgrade schema."""
    # Drop all tables in reverse order
    op.drop_table('audit_log', schema='swisstax')
    op.drop_table('standard_deductions', schema='swisstax')
    op.drop_table('tax_rates', schema='swisstax')
    op.drop_table('tax_calculations', schema='swisstax')
    op.drop_table('documents', schema='swisstax')
    op.drop_table('required_documents', schema='swisstax')
    op.drop_table('document_types', schema='swisstax')
    op.drop_table('interview_answers', schema='swisstax')
    op.drop_table('interview_sessions', schema='swisstax')
    op.drop_table('questions', schema='swisstax')
    op.drop_table('tax_years', schema='swisstax')
    op.drop_table('users', schema='swisstax')

    # Drop trigger and function
    op.execute("DROP TRIGGER IF EXISTS update_users_updated_at ON swisstax.users")
    op.execute("DROP FUNCTION IF EXISTS swisstax.update_updated_at_column()")

    # Drop schema
    op.execute("DROP SCHEMA IF EXISTS swisstax CASCADE")
