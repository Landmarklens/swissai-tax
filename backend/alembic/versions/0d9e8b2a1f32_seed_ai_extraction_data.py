"""seed_ai_extraction_data

Revision ID: 0d9e8b2a1f32
Revises: 252747af2481
Create Date: 2025-10-14 11:04:20.150201

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0d9e8b2a1f32'
down_revision: Union[str, Sequence[str], None] = '252747af2481'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
