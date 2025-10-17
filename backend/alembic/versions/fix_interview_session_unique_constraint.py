"""Fix interview_sessions unique constraint to allow multiple filings per year

Revision ID: fix_unique_constraint
Revises:
Create Date: 2025-10-17

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'fix_unique_constraint'
down_revision = 'c6d6a6f8aded'
branch_labels = None
depends_on = None


def upgrade():
    # Drop the old unique constraint on (user_id, tax_year)
    op.drop_constraint(
        'interview_sessions_user_id_tax_year_key',
        'interview_sessions',
        schema='swisstax',
        type_='unique'
    )

    # Create new unique constraint on (user_id, tax_year, filing_id)
    # This allows multiple interview sessions per year (one per filing)
    op.create_unique_constraint(
        'interview_sessions_user_filing_year_key',
        'interview_sessions',
        ['user_id', 'tax_year', 'filing_id'],
        schema='swisstax'
    )


def downgrade():
    # Drop the new constraint
    op.drop_constraint(
        'interview_sessions_user_filing_year_key',
        'interview_sessions',
        schema='swisstax',
        type_='unique'
    )

    # Restore the old constraint
    op.create_unique_constraint(
        'interview_sessions_user_id_tax_year_key',
        'interview_sessions',
        ['user_id', 'tax_year'],
        schema='swisstax'
    )
