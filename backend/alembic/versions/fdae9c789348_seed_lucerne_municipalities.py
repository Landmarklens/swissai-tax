"""seed_lucerne_municipalities

Revision ID: fdae9c789348
Revises: 04958a9fc8b7
Create Date: 2025-10-20 11:37:26.115908

Seed municipality-level church tax rates for Lucerne canton.
80 municipalities with official parish-level data for 2024.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fdae9c789348'
down_revision: Union[str, Sequence[str], None] = '04958a9fc8b7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
