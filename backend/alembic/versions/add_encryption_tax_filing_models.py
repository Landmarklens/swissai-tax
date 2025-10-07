"""Add encryption and tax filing models

Revision ID: d8e7f9a1b2c3
Revises: cb4ced9eea89
Create Date: 2025-10-06 14:30:00.000000

This migration adds:
1. TaxFilingSession model with encrypted profile column
2. TaxAnswer model with encrypted answer_value column
3. Relationships to User model
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'd8e7f9a1b2c3'
down_revision = 'cb4ced9eea89'
branch_labels = None
depends_on = None


def upgrade():
    """Add tax filing tables with encryption support"""

    # Create FilingStatus enum (idempotent)
    conn = op.get_bind()
    enum_exists = conn.execute(sa.text(
        "SELECT 1 FROM pg_type WHERE typname = 'filing_status_enum'"
    )).scalar()

    if not enum_exists:
        filing_status_enum = postgresql.ENUM(
            'draft', 'in_progress', 'completed', 'submitted', 'archived',
            name='filing_status_enum',
            create_type=True
        )
        filing_status_enum.create(conn, checkfirst=False)

    filing_status_enum = postgresql.ENUM(
        'draft', 'in_progress', 'completed', 'submitted', 'archived',
        name='filing_status_enum',
        create_type=False
    )

    # Create tax_filing_sessions table
    op.create_table(
        'tax_filing_sessions',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=False), sa.ForeignKey('swisstax.users.id'), nullable=False, index=True),
        sa.Column('name', sa.String(255), nullable=True),
        sa.Column('tax_year', sa.Integer, nullable=False),

        # Encrypted profile column (stores sensitive financial data)
        # Note: Encryption handled by EncryptedJSON custom type
        sa.Column('profile', sa.Text, nullable=False, server_default='{}'),
        sa.Column('summarized_description', sa.Text, nullable=True),

        # Status and progress
        sa.Column('status', filing_status_enum, nullable=False, server_default='draft', index=True),
        sa.Column('completion_percentage', sa.Integer, nullable=False, server_default='0'),
        sa.Column('current_question_id', sa.String(50), nullable=True),
        sa.Column('completed_questions', sa.JSON, nullable=False, server_default='[]'),

        # UI enhancement fields
        sa.Column('is_pinned', sa.Boolean, nullable=False, server_default='false', index=True),
        sa.Column('is_archived', sa.Boolean, nullable=False, server_default='false', index=True),
        sa.Column('last_activity', sa.DateTime, nullable=False, server_default=sa.func.now(), index=True),
        sa.Column('question_count', sa.Integer, nullable=False, server_default='0'),

        # Localization
        sa.Column('language', sa.String(2), nullable=False, server_default='en'),
        sa.Column('canton', sa.String(2), nullable=True),

        # Timestamps
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
        schema='swisstax'
    )

    # Indexes already created by index=True in column definitions above
    # (user_id, status, is_pinned, is_archived, last_activity)

    # Create tax_answers table
    op.create_table(
        'tax_answers',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('filing_session_id', sa.String(36), sa.ForeignKey('swisstax.tax_filing_sessions.id'), nullable=False, index=True),
        sa.Column('question_id', sa.String(50), nullable=False, index=True),

        # Encrypted answer value (stores sensitive personal/financial data)
        # Note: Encryption handled by EncryptedText custom type
        sa.Column('answer_value', sa.Text, nullable=False),

        # Metadata (non-sensitive)
        sa.Column('question_text', sa.Text, nullable=True),
        sa.Column('question_type', sa.String(50), nullable=True),
        sa.Column('is_sensitive', sa.Boolean, nullable=False, server_default='true'),

        # Timestamps
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
        schema='swisstax'
    )

    # Indexes already created by index=True in column definitions above
    # (filing_session_id, question_id)

    # Create composite index for common query pattern
    op.create_index(
        'ix_tax_answers_session_question',
        'tax_answers',
        ['filing_session_id', 'question_id'],
        unique=True,
        schema='swisstax'
    )

    print("✓ Created tax_filing_sessions table with encrypted profile column")
    print("✓ Created tax_answers table with encrypted answer_value column")
    print("✓ Created all necessary indexes")
    print("✓ Encryption will be handled transparently by SQLAlchemy custom types")


def downgrade():
    """Remove tax filing tables"""

    # Drop indexes
    op.drop_index('ix_tax_answers_session_question', table_name='tax_answers', schema='swisstax')
    op.drop_index('ix_tax_answers_question_id', table_name='tax_answers', schema='swisstax')
    op.drop_index('ix_tax_answers_filing_session_id', table_name='tax_answers', schema='swisstax')

    op.drop_index('ix_tax_filing_sessions_last_activity', table_name='tax_filing_sessions', schema='swisstax')
    op.drop_index('ix_tax_filing_sessions_status', table_name='tax_filing_sessions', schema='swisstax')
    op.drop_index('ix_tax_filing_sessions_user_id', table_name='tax_filing_sessions', schema='swisstax')

    # Drop tables
    op.drop_table('tax_answers', schema='swisstax')
    op.drop_table('tax_filing_sessions', schema='swisstax')

    # Drop enum
    filing_status_enum = postgresql.ENUM(
        'draft', 'in_progress', 'completed', 'submitted', 'archived',
        name='filing_status_enum'
    )
    filing_status_enum.drop(op.get_bind(), checkfirst=True)

    print("✓ Removed tax filing tables and encryption columns")
