"""add_structured_import_columns_to_documents

Revision ID: bd575eb2f745
Revises: a1f6af017273
Create Date: 2025-10-21 22:16:16.895580

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bd575eb2f745'
down_revision: Union[str, Sequence[str], None] = 'a1f6af017273'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - add structured import support to documents table."""
    # Add 3 new columns to documents table for eCH-0196 and Swissdec support

    # 1. is_structured_import: Boolean flag to indicate if document is eCH-0196/Swissdec
    op.execute("""
        ALTER TABLE swisstax.documents
        ADD COLUMN IF NOT EXISTS is_structured_import BOOLEAN DEFAULT FALSE;
    """)

    # 2. import_format: String to store format type (eCH-0196, Swissdec-ELM-5.0, etc.)
    op.execute("""
        ALTER TABLE swisstax.documents
        ADD COLUMN IF NOT EXISTS import_format VARCHAR(100);
    """)

    # 3. structured_data: JSONB to store parsed structured data
    op.execute("""
        ALTER TABLE swisstax.documents
        ADD COLUMN IF NOT EXISTS structured_data JSONB;
    """)

    # Create index on is_structured_import for faster filtering
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_documents_is_structured_import
        ON swisstax.documents(is_structured_import);
    """)

    # Create index on import_format for filtering by format type
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_documents_import_format
        ON swisstax.documents(import_format);
    """)


def downgrade() -> None:
    """Downgrade schema - remove structured import columns."""
    # Drop indexes first
    op.execute("DROP INDEX IF EXISTS swisstax.idx_documents_import_format;")
    op.execute("DROP INDEX IF EXISTS swisstax.idx_documents_is_structured_import;")

    # Drop columns
    op.execute("ALTER TABLE swisstax.documents DROP COLUMN IF EXISTS structured_data;")
    op.execute("ALTER TABLE swisstax.documents DROP COLUMN IF EXISTS import_format;")
    op.execute("ALTER TABLE swisstax.documents DROP COLUMN IF EXISTS is_structured_import;")
