"""add_user_counter_table

Revision ID: cb4ced9eea89
Revises: add_new_tables
Create Date: 2025-10-06 10:32:54.200769

"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'cb4ced9eea89'
down_revision: Union[str, Sequence[str], None] = 'add_new_tables'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'user_counter',
        sa.Column('id', sa.Integer(), nullable=False, default=1),
        sa.Column('user_count', sa.Integer(), nullable=False, default=15),
        sa.Column('target_count', sa.Integer(), nullable=False),
        sa.Column('last_reset', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('last_updated', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint('id = 1', name='single_row_check'),
        schema='swisstax'
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('user_counter', schema='swisstax')
