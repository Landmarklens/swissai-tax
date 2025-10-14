"""add_fields_to_interview_sessions

Revision ID: 07f827c17d02
Revises: 20251014_perf_idx
Create Date: 2025-10-14 22:17:53.357663

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '07f827c17d02'
down_revision: Union[str, Sequence[str], None] = '20251014_perf_idx'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - Add missing fields to interview_sessions for multi-instance support."""

    # Add answers column (JSONB for storing all interview answers)
    op.execute("ALTER TABLE swisstax.interview_sessions ADD COLUMN IF NOT EXISTS answers JSONB DEFAULT '{}'::jsonb")

    # Add session metadata column for context (child loops, cantons, etc.)
    op.execute("ALTER TABLE swisstax.interview_sessions ADD COLUMN IF NOT EXISTS session_context JSONB DEFAULT '{}'::jsonb")

    # Add completed_questions array
    op.execute("ALTER TABLE swisstax.interview_sessions ADD COLUMN IF NOT EXISTS completed_questions JSONB DEFAULT '[]'::jsonb")

    # Add pending_questions array
    op.execute("ALTER TABLE swisstax.interview_sessions ADD COLUMN IF NOT EXISTS pending_questions JSONB DEFAULT '[]'::jsonb")

    # Add progress field (0-100)
    op.execute("ALTER TABLE swisstax.interview_sessions ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0")

    # Add language field
    op.execute("ALTER TABLE swisstax.interview_sessions ADD COLUMN IF NOT EXISTS language VARCHAR(2) DEFAULT 'en'")

    # Add filing_id to link to tax_filing_sessions
    op.execute("""
        ALTER TABLE swisstax.interview_sessions
        ADD COLUMN IF NOT EXISTS filing_id VARCHAR(36)
    """)

    # Add foreign key for filing_id
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint
                WHERE conname = 'interview_sessions_filing_id_fkey'
            ) THEN
                ALTER TABLE swisstax.interview_sessions
                ADD CONSTRAINT interview_sessions_filing_id_fkey
                FOREIGN KEY (filing_id) REFERENCES swisstax.tax_filing_sessions(id) ON DELETE CASCADE;
            END IF;
        END $$;
    """)

    # Add index on filing_id
    op.execute("CREATE INDEX IF NOT EXISTS idx_interview_sessions_filing_id ON swisstax.interview_sessions(filing_id)")

    # Add updated_at column
    op.execute("ALTER TABLE swisstax.interview_sessions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP")

    # Add expires_at column for session expiration
    op.execute("ALTER TABLE swisstax.interview_sessions ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP")

    # Rename current_question to current_question_id for consistency
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'swisstax'
                AND table_name = 'interview_sessions'
                AND column_name = 'current_question'
            ) THEN
                ALTER TABLE swisstax.interview_sessions RENAME COLUMN current_question TO current_question_id;
            END IF;
        END $$;
    """)

    # Update current_question_id type to VARCHAR(50) if needed
    op.execute("ALTER TABLE swisstax.interview_sessions ALTER COLUMN current_question_id TYPE VARCHAR(50)")


def downgrade() -> None:
    """Downgrade schema - Remove added fields."""

    # Remove added columns
    op.execute("ALTER TABLE swisstax.interview_sessions DROP COLUMN IF EXISTS answers")
    op.execute("ALTER TABLE swisstax.interview_sessions DROP COLUMN IF EXISTS session_context")
    op.execute("ALTER TABLE swisstax.interview_sessions DROP COLUMN IF EXISTS completed_questions")
    op.execute("ALTER TABLE swisstax.interview_sessions DROP COLUMN IF EXISTS pending_questions")
    op.execute("ALTER TABLE swisstax.interview_sessions DROP COLUMN IF EXISTS progress")
    op.execute("ALTER TABLE swisstax.interview_sessions DROP COLUMN IF EXISTS language")
    op.execute("ALTER TABLE swisstax.interview_sessions DROP COLUMN IF EXISTS expires_at")
    op.execute("ALTER TABLE swisstax.interview_sessions DROP COLUMN IF EXISTS updated_at")

    # Remove filing_id foreign key and column
    op.execute("ALTER TABLE swisstax.interview_sessions DROP CONSTRAINT IF EXISTS interview_sessions_filing_id_fkey")
    op.execute("DROP INDEX IF EXISTS swisstax.idx_interview_sessions_filing_id")
    op.execute("ALTER TABLE swisstax.interview_sessions DROP COLUMN IF EXISTS filing_id")

    # Rename current_question_id back to current_question
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'swisstax'
                AND table_name = 'interview_sessions'
                AND column_name = 'current_question_id'
            ) THEN
                ALTER TABLE swisstax.interview_sessions RENAME COLUMN current_question_id TO current_question;
            END IF;
        END $$;
    """)
