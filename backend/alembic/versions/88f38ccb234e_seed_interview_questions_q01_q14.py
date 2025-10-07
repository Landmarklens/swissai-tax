"""Seed interview questions Q01-Q14

Revision ID: 88f38ccb234e
Revises: 9eadbee3622b
Create Date: 2025-09-23 21:34:25.606072

"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '88f38ccb234e'
down_revision: Union[str, Sequence[str], None] = '9eadbee3622b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
