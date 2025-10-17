"""add_category_to_tax_insights

Revision ID: c6d6a6f8aded
Revises: 823d2f0a83ca
Create Date: 2025-10-17 10:02:34.107010

Adds 'category' field to tax_insights table to distinguish between:
- 'completed': Insights from answered questions
- 'action_required': Insights from skipped questions or pending documents
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c6d6a6f8aded'
down_revision: Union[str, Sequence[str], None] = '823d2f0a83ca'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add category field to tax_insights table (idempotent)."""
    # Check if column exists before adding (idempotent)
    op.execute("""
        DO $$
        BEGIN
            -- Add category column if it doesn't exist
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'swisstax'
                AND table_name = 'tax_insights'
                AND column_name = 'category'
            ) THEN
                -- Add category enum type if it doesn't exist
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'insightcategory') THEN
                    CREATE TYPE swisstax.insightcategory AS ENUM ('completed', 'action_required');
                END IF;

                -- Add category column with default 'completed' for existing rows
                ALTER TABLE swisstax.tax_insights
                ADD COLUMN category swisstax.insightcategory NOT NULL DEFAULT 'completed';

                -- Add index on category for faster filtering
                CREATE INDEX IF NOT EXISTS idx_tax_insights_category
                ON swisstax.tax_insights(category);

                RAISE NOTICE 'Added category column to tax_insights table';
            ELSE
                RAISE NOTICE 'Category column already exists in tax_insights table';
            END IF;
        END
        $$;
    """)


def downgrade() -> None:
    """Remove category field from tax_insights table (idempotent)."""
    op.execute("""
        DO $$
        BEGIN
            -- Drop index if exists
            DROP INDEX IF EXISTS swisstax.idx_tax_insights_category;

            -- Drop column if exists
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'swisstax'
                AND table_name = 'tax_insights'
                AND column_name = 'category'
            ) THEN
                ALTER TABLE swisstax.tax_insights DROP COLUMN category;
                RAISE NOTICE 'Removed category column from tax_insights table';
            ELSE
                RAISE NOTICE 'Category column does not exist in tax_insights table';
            END IF;

            -- Drop enum type if exists and not used by other tables
            IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'insightcategory') THEN
                DROP TYPE IF EXISTS swisstax.insightcategory;
                RAISE NOTICE 'Removed insightcategory enum type';
            END IF;
        END
        $$;
    """)
