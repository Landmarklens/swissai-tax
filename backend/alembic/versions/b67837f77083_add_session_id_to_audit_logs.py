"""add_session_id_to_audit_logs

Revision ID: b67837f77083
Revises: 20251008_add_s3_key
Create Date: 2025-10-08 15:47:37.956716

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b67837f77083'
down_revision: Union[str, Sequence[str], None] = '20251008_add_s3_key'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add session_id column to audit_logs table
    op.add_column(
        'audit_logs',
        sa.Column('session_id', sa.String(255), nullable=True),
        schema='swisstax'
    )
    # Add index on session_id
    op.create_index(
        'idx_audit_session_id',
        'audit_logs',
        ['session_id'],
        schema='swisstax'
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Drop index
    op.drop_index('idx_audit_session_id', table_name='audit_logs', schema='swisstax')
    # Drop column
    op.drop_column('audit_logs', 'session_id', schema='swisstax')
