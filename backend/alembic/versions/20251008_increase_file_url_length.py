"""Increase file_url column length for presigned URLs

Revision ID: 20251008_file_url
Revises: 20251008_add_prefs
Create Date: 2025-10-08 17:52:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20251008_file_url'
down_revision = '20251008_add_prefs'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Increase file_url column length from 500 to 2000 characters
    op.alter_column(
        'data_exports',
        'file_url',
        type_=sa.String(2000),
        existing_type=sa.String(500),
        schema='swisstax'
    )


def downgrade() -> None:
    op.alter_column(
        'data_exports',
        'file_url',
        type_=sa.String(500),
        existing_type=sa.String(2000),
        schema='swisstax'
    )
