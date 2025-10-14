"""fix_documents_table_add_missing_columns

Revision ID: 2f5abbc1dce7
Revises: 5eef7342e477
Create Date: 2025-10-14 11:11:01.774677

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2f5abbc1dce7'
down_revision: Union[str, Sequence[str], None] = '5eef7342e477'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add missing columns to documents table for user document management."""

    # Add user_id column (needed for user-specific queries)
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'swisstax'
                AND table_name = 'documents'
                AND column_name = 'user_id'
            ) THEN
                ALTER TABLE swisstax.documents
                ADD COLUMN user_id VARCHAR(255);
            END IF;

            -- Create index on user_id (idempotent)
            IF NOT EXISTS (
                SELECT 1 FROM pg_indexes
                WHERE schemaname = 'swisstax'
                AND tablename = 'documents'
                AND indexname = 'idx_documents_user_id'
            ) THEN
                CREATE INDEX idx_documents_user_id ON swisstax.documents(user_id);
            END IF;
        END $$;
    """)

    # Add document_type column (string version alongside document_type_id)
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'swisstax'
                AND table_name = 'documents'
                AND column_name = 'document_type'
            ) THEN
                ALTER TABLE swisstax.documents
                ADD COLUMN document_type VARCHAR(100);

                -- Populate from document_types table if possible
                UPDATE swisstax.documents d
                SET document_type = dt.code
                FROM swisstax.document_types dt
                WHERE d.document_type_id = dt.id;
            END IF;
        END $$;
    """)

    # Add ocr_status column (rename/alias status to ocr_status)
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'swisstax'
                AND table_name = 'documents'
                AND column_name = 'ocr_status'
            ) THEN
                ALTER TABLE swisstax.documents
                ADD COLUMN ocr_status VARCHAR(50) DEFAULT 'pending';

                -- Copy existing status values to ocr_status
                UPDATE swisstax.documents
                SET ocr_status = COALESCE(status, 'pending');
            END IF;
        END $$;
    """)

    # Add created_at column (alias for uploaded_at)
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'swisstax'
                AND table_name = 'documents'
                AND column_name = 'created_at'
            ) THEN
                ALTER TABLE swisstax.documents
                ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

                -- Copy uploaded_at to created_at for existing records
                UPDATE swisstax.documents
                SET created_at = COALESCE(uploaded_at, CURRENT_TIMESTAMP);
            END IF;
        END $$;
    """)

    # Add ocr_result column (JSONB for OCR results)
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'swisstax'
                AND table_name = 'documents'
                AND column_name = 'ocr_result'
            ) THEN
                ALTER TABLE swisstax.documents
                ADD COLUMN ocr_result JSONB;
            END IF;
        END $$;
    """)

    # Add metadata column (for additional document metadata)
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'swisstax'
                AND table_name = 'documents'
                AND column_name = 'metadata'
            ) THEN
                ALTER TABLE swisstax.documents
                ADD COLUMN metadata JSONB DEFAULT '{}';
            END IF;
        END $$;
    """)

    print("✅ Added missing columns to documents table")


def downgrade() -> None:
    """Remove added columns from documents table."""

    # Remove columns in reverse order
    op.execute("""
        ALTER TABLE swisstax.documents
        DROP COLUMN IF EXISTS metadata,
        DROP COLUMN IF EXISTS ocr_result,
        DROP COLUMN IF EXISTS created_at,
        DROP COLUMN IF EXISTS ocr_status,
        DROP COLUMN IF EXISTS document_type,
        DROP COLUMN IF EXISTS user_id CASCADE;
    """)

    # Remove index
    op.execute("DROP INDEX IF EXISTS swisstax.idx_documents_user_id;")

    print("✅ Removed columns from documents table")
