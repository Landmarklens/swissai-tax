"""merge_migration_heads

Revision ID: a1f6af017273
Revises: 197a4ff8b7e8, 20251021_enhance_metadata, 20251021_fr_so
Create Date: 2025-10-21 22:16:08.413262

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1f6af017273'
down_revision: Union[str, Sequence[str], None] = ('197a4ff8b7e8', '20251021_enhance_metadata', '20251021_fr_so')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
