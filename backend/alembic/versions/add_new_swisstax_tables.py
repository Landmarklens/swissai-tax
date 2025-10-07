"""Add filings, subscriptions, payments, and user_settings tables

Revision ID: add_new_tables
Revises: add_auth_fields
Create Date: 2025-10-05 12:30:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.engine.reflection import Inspector

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'add_new_tables'
down_revision: Union[str, Sequence[str], None] = 'add_auth_fields'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def table_exists(table_name, schema='swisstax'):
    """Check if a table exists in a schema"""
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    return table_name in inspector.get_table_names(schema=schema)


def upgrade() -> None:
    """Add new tables for filings, subscriptions, payments, and settings"""

    # Filings table
    if not table_exists('filings'):
        op.create_table('filings',
            sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
            sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('swisstax.users.id', ondelete='CASCADE'), nullable=False, index=True),
            sa.Column('session_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('swisstax.interview_sessions.id'), nullable=False),
            sa.Column('tax_year', sa.Integer, nullable=False),
            sa.Column('status', sa.String(20), nullable=False, index=True),
            sa.Column('submission_method', sa.String(20)),
            sa.Column('submitted_at', sa.TIMESTAMP(timezone=True)),
            sa.Column('confirmation_number', sa.String(100), unique=True),
            sa.Column('pdf_url', sa.String(500)),
            sa.Column('confirmation_pdf_url', sa.String(500)),
            sa.Column('refund_amount', sa.Numeric(12, 2)),
            sa.Column('payment_amount', sa.Numeric(12, 2)),
            sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
            schema='swisstax'
        )
        print("  ✓ Created 'filings' table")

    # Subscriptions table
    if not table_exists('subscriptions'):
        op.create_table('subscriptions',
            sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
            sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('swisstax.users.id', ondelete='CASCADE'), nullable=False, index=True),
            sa.Column('plan_type', sa.String(20), nullable=False),
            sa.Column('status', sa.String(20), nullable=False, index=True),
            sa.Column('stripe_subscription_id', sa.String(255), unique=True),
            sa.Column('stripe_customer_id', sa.String(255)),
            sa.Column('stripe_price_id', sa.String(255)),
            sa.Column('current_period_start', sa.TIMESTAMP(timezone=True)),
            sa.Column('current_period_end', sa.TIMESTAMP(timezone=True)),
            sa.Column('cancel_at_period_end', sa.Boolean, server_default='false'),
            sa.Column('canceled_at', sa.TIMESTAMP(timezone=True)),
            sa.Column('price_chf', sa.Numeric(10, 2), nullable=False),
            sa.Column('currency', sa.String(3), server_default='CHF'),
            sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
            schema='swisstax'
        )
        print("  ✓ Created 'subscriptions' table")

    # Payments table
    if not table_exists('payments'):
        op.create_table('payments',
            sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
            sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('swisstax.users.id', ondelete='CASCADE'), nullable=False, index=True),
            sa.Column('filing_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('swisstax.filings.id'), nullable=True),
            sa.Column('amount_chf', sa.Numeric(10, 2), nullable=False),
            sa.Column('currency', sa.String(3), server_default='CHF'),
            sa.Column('status', sa.String(20), nullable=False, index=True),
            sa.Column('stripe_payment_intent_id', sa.String(255), unique=True),
            sa.Column('stripe_charge_id', sa.String(255)),
            sa.Column('payment_method', sa.String(50)),
            sa.Column('card_brand', sa.String(20)),
            sa.Column('card_last4', sa.String(4)),
            sa.Column('description', sa.String(500)),
            sa.Column('failure_message', sa.String(500)),
            sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.Column('paid_at', sa.TIMESTAMP(timezone=True)),
            schema='swisstax'
        )
        print("  ✓ Created 'payments' table")

    # User Settings table
    if not table_exists('user_settings'):
        op.create_table('user_settings',
            sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
            sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('swisstax.users.id', ondelete='CASCADE'), nullable=False, unique=True, index=True),
            sa.Column('language', sa.String(2), server_default='de'),
            sa.Column('date_format', sa.String(20), server_default='DD.MM.YYYY'),
            sa.Column('currency', sa.String(3), server_default='CHF'),
            sa.Column('default_canton', sa.String(2)),
            sa.Column('theme', sa.String(10), server_default='auto'),
            sa.Column('auto_save_enabled', sa.Boolean, server_default='true'),
            sa.Column('auto_save_interval', sa.Integer, server_default='30'),
            sa.Column('show_tax_tips', sa.Boolean, server_default='true'),
            sa.Column('enable_ocr', sa.Boolean, server_default='true'),
            sa.Column('email_deadline_reminders', sa.Boolean, server_default='true'),
            sa.Column('email_document_processing', sa.Boolean, server_default='true'),
            sa.Column('email_tax_calculation', sa.Boolean, server_default='true'),
            sa.Column('email_marketing', sa.Boolean, server_default='false'),
            sa.Column('sms_account_updates', sa.Boolean, server_default='true'),
            sa.Column('sms_filing_reminders', sa.Boolean, server_default='false'),
            sa.Column('ocr_enabled', sa.Boolean, server_default='true'),
            sa.Column('compress_documents', sa.Boolean, server_default='true'),
            sa.Column('retention_years', sa.Integer, server_default='7'),
            sa.Column('additional_preferences', sa.JSON),
            sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
            schema='swisstax'
        )
        print("  ✓ Created 'user_settings' table")

    print("\n✓ New SwissAI Tax tables migration completed")

    op.create_index('idx_payments_user_id', 'payments', ['user_id'], schema='swisstax')
    op.create_index('idx_payments_status', 'payments', ['status'], schema='swisstax')
    op.create_index('idx_payments_filing_id', 'payments', ['filing_id'], schema='swisstax')

    print("✓ Created filings, subscriptions, payments, and user_settings tables")


def downgrade() -> None:
    """Remove new tables"""

    # Drop tables in reverse order (to handle foreign keys)
    op.drop_table('user_settings', schema='swisstax')
    op.drop_table('payments', schema='swisstax')
    op.drop_table('subscriptions', schema='swisstax')
    op.drop_table('filings', schema='swisstax')
