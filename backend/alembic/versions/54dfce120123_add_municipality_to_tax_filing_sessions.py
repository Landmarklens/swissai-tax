"""add_municipality_to_tax_filing_sessions

Revision ID: 54dfce120123
Revises: f7a413dd9ee4
Create Date: 2025-10-07 19:07:35.325998

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '54dfce120123'
down_revision: Union[str, Sequence[str], None] = 'f7a413dd9ee4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add municipality column to tax_filing_sessions table."""
    # Check if column already exists (idempotent)
    conn = op.get_bind()
    result = conn.execute(sa.text("""
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'swisstax'
        AND table_name = 'tax_filing_sessions'
        AND column_name = 'municipality'
    """))

    if result.fetchone() is None:
        # Column doesn't exist, add it
        op.add_column(
            'tax_filing_sessions',
            sa.Column('municipality', sa.String(255), nullable=True),
            schema='swisstax'
        )
        print("✓ Added municipality column to tax_filing_sessions")
    else:
        print("✓ municipality column already exists, skipping")


def downgrade() -> None:
    """Remove municipality column from tax_filing_sessions table."""
    # Check if column exists before dropping (idempotent)
    conn = op.get_bind()
    result = conn.execute(sa.text("""
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'swisstax'
        AND table_name = 'tax_filing_sessions'
        AND column_name = 'municipality'
    """))

    if result.fetchone() is not None:
        op.drop_column('tax_filing_sessions', 'municipality', schema='swisstax')
        print("✓ Removed municipality column")
    else:
        print("✓ municipality column doesn't exist, skipping")
