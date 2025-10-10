"""merge stripe and incidents branches

Revision ID: 286b9925d9d0
Revises: 20251010_stripe_customer, 20251010_incidents
Create Date: 2025-10-10 19:15:26.683306

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '286b9925d9d0'
down_revision: Union[str, Sequence[str], None] = ('20251010_stripe_customer', '20251010_incidents')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
