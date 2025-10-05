"""Add auth fields to swisstax.users table

Revision ID: add_auth_fields
Revises: 6f18eae11a19
Create Date: 2025-10-05 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector


# revision identifiers, used by Alembic.
revision: str = 'add_auth_fields'
down_revision: Union[str, Sequence[str], None] = '6f18eae11a19'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def column_exists(table_name, column_name, schema='swisstax'):
    """Check if a column exists in a table"""
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    columns = [col['name'] for col in inspector.get_columns(table_name, schema=schema)]
    return column_name in columns


def upgrade() -> None:
    """Add authentication fields to users table"""

    # Add password field (nullable for OAuth users)
    if not column_exists('users', 'password'):
        op.add_column('users',
            sa.Column('password', sa.String(255), nullable=True),
            schema='swisstax'
        )
        print("  ✓ Added 'password' column")

    # Add OAuth provider fields
    if not column_exists('users', 'provider'):
        op.add_column('users',
            sa.Column('provider', sa.String(20), server_default='local'),
            schema='swisstax'
        )
        print("  ✓ Added 'provider' column")

    if not column_exists('users', 'provider_id'):
        op.add_column('users',
            sa.Column('provider_id', sa.String(255), nullable=True),
            schema='swisstax'
        )
        print("  ✓ Added 'provider_id' column")

    # Add avatar URL
    if not column_exists('users', 'avatar_url'):
        op.add_column('users',
            sa.Column('avatar_url', sa.String(255), nullable=True),
            schema='swisstax'
        )
        print("  ✓ Added 'avatar_url' column")

    # Add subscription bypass flags
    if not column_exists('users', 'is_grandfathered'):
        op.add_column('users',
            sa.Column('is_grandfathered', sa.Boolean(), server_default='false', nullable=False),
            schema='swisstax'
        )
        print("  ✓ Added 'is_grandfathered' column")

    if not column_exists('users', 'is_test_user'):
        op.add_column('users',
            sa.Column('is_test_user', sa.Boolean(), server_default='false', nullable=False),
            schema='swisstax'
        )
        print("  ✓ Added 'is_test_user' column")

    print("✓ Authentication fields migration completed")


def downgrade() -> None:
    """Remove authentication fields from users table"""

    op.drop_column('users', 'is_test_user', schema='swisstax')
    op.drop_column('users', 'is_grandfathered', schema='swisstax')
    op.drop_column('users', 'avatar_url', schema='swisstax')
    op.drop_column('users', 'provider_id', schema='swisstax')
    op.drop_column('users', 'provider', schema='swisstax')
    op.drop_column('users', 'password', schema='swisstax')
