"""add_pending_documents_table

Revision ID: f492ec67b656
Revises: 2f5abbc1dce7
Create Date: 2025-10-14 17:15:26.816003

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f492ec67b656'
down_revision: Union[str, Sequence[str], None] = '2f5abbc1dce7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create document_status_enum type in swisstax schema (if not exists)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE swisstax.document_status_enum AS ENUM ('pending', 'uploaded', 'verified', 'failed');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    # Create pending_documents table using raw SQL to avoid enum re-creation
    op.execute("""
        CREATE TABLE IF NOT EXISTS swisstax.pending_documents (
            id UUID PRIMARY KEY,
            filing_session_id VARCHAR(36) NOT NULL,
            question_id VARCHAR(50) NOT NULL,
            document_type VARCHAR(100) NOT NULL,
            status swisstax.document_status_enum NOT NULL DEFAULT 'pending',
            document_label VARCHAR(255),
            help_text VARCHAR(500),
            document_id VARCHAR(36),
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            uploaded_at TIMESTAMP,
            verified_at TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
            CONSTRAINT fk_pending_documents_filing_session
                FOREIGN KEY (filing_session_id)
                REFERENCES swisstax.tax_filing_sessions(id)
        )
    """)

    # Create indexes (if not exists)
    op.execute("CREATE INDEX IF NOT EXISTS idx_pending_docs_filing_session ON swisstax.pending_documents(filing_session_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_pending_docs_status ON swisstax.pending_documents(status)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_pending_docs_filing_status ON swisstax.pending_documents(filing_session_id, status)")


def downgrade() -> None:
    """Downgrade schema."""
    # Drop indexes
    op.drop_index('idx_pending_docs_filing_status', table_name='pending_documents', schema='swisstax')
    op.drop_index('idx_pending_docs_status', table_name='pending_documents', schema='swisstax')
    op.drop_index('idx_pending_docs_filing_session', table_name='pending_documents', schema='swisstax')

    # Drop table
    op.drop_table('pending_documents', schema='swisstax')

    # Drop enum type
    op.execute("DROP TYPE swisstax.document_status_enum")
