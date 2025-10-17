"""add_performance_indexes_for_interview_flow

Revision ID: 823d2f0a83ca
Revises: 07f827c17d02
Create Date: 2025-10-17 09:11:40.763345

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '823d2f0a83ca'
down_revision: Union[str, Sequence[str], None] = '07f827c17d02'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add performance indexes for interview flow optimization."""

    # Index on tax_answers.filing_session_id for fast answer lookups
    # This dramatically speeds up the /api/interview/filings/{filing_session_id}/answers endpoint
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_tax_answers_filing_session
        ON swisstax.tax_answers(filing_session_id)
    """)

    # Index on tax_answers.question_id for faster individual answer lookups
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_tax_answers_question_id
        ON swisstax.tax_answers(question_id)
    """)

    # Composite index on tax_answers for faster upsert operations (check if answer exists)
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_tax_answers_filing_question
        ON swisstax.tax_answers(filing_session_id, question_id)
    """)

    # Index on interview_sessions.filing_id for faster session lookups
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_interview_sessions_filing
        ON swisstax.interview_sessions(filing_id)
    """)

    # Index on interview_sessions.user_id and tax_year for session retrieval
    # This speeds up finding existing sessions for a user + year
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_interview_sessions_user_year
        ON swisstax.interview_sessions(user_id, tax_year)
    """)

    # Index on interview_sessions.status for filtering active sessions
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_interview_sessions_status
        ON swisstax.interview_sessions(status)
    """)


def downgrade() -> None:
    """Remove performance indexes."""

    # Drop all indexes created in upgrade
    op.execute("DROP INDEX IF EXISTS swisstax.idx_tax_answers_filing_session")
    op.execute("DROP INDEX IF EXISTS swisstax.idx_tax_answers_question_id")
    op.execute("DROP INDEX IF EXISTS swisstax.idx_tax_answers_filing_question")
    op.execute("DROP INDEX IF EXISTS swisstax.idx_interview_sessions_filing")
    op.execute("DROP INDEX IF EXISTS swisstax.idx_interview_sessions_user_year")
    op.execute("DROP INDEX IF EXISTS swisstax.idx_interview_sessions_status")
