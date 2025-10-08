"""merge_audit_and_deletion_heads

Revision ID: c5885098c62c
Revises: 20251008_add_deletion_and_export, 7a4d3e2bab48
Create Date: 2025-10-08 15:09:02.109704

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c5885098c62c'
down_revision: Union[str, Sequence[str], None] = ('20251008_add_deletion_and_export', '7a4d3e2bab48')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
