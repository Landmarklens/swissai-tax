"""add_s3_key_to_data_exports

Revision ID: 20251008_add_s3_key
Revises: c5885098c62c
Create Date: 2025-10-08 15:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '20251008_add_s3_key'
down_revision: Union[str, Sequence[str], None] = 'c5885098c62c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add s3_key column to data_exports table"""
    # Add s3_key column for S3 object cleanup
    op.add_column(
        'data_exports',
        sa.Column('s3_key', sa.String(500), nullable=True),
        schema='swisstax'
    )


def downgrade() -> None:
    """Remove s3_key column from data_exports table"""
    op.drop_column('data_exports', 's3_key', schema='swisstax')
