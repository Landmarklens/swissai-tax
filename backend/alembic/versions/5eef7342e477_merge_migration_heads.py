"""merge_migration_heads

Revision ID: 5eef7342e477
Revises: 0d9e8b2a1f32, ed83d192d899
Create Date: 2025-10-14 11:10:56.539363

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5eef7342e477'
down_revision: Union[str, Sequence[str], None] = ('0d9e8b2a1f32', 'ed83d192d899')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
