"""Add multi-filing support for multiple years and cantons

Revision ID: 20251006_160955_multi_filing_support
Revises: 20251006_154734_add_encrypted_tax_models
Create Date: 2025-10-06 16:09:55

Adds support for:
- Multiple filings per user (different years)
- Multiple canton filings (for property owners with multiple locations)
- Copy from previous year functionality
- Soft delete support
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20251006_160955_multi_filing_support'
down_revision = 'add_encrypted_tax_models'
branch_labels = None
depends_on = None


def upgrade():
    """Add multi-filing support columns and constraints"""

    # Get connection to check existing columns
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_columns = [col['name'] for col in inspector.get_columns('tax_filing_sessions')]

    # Add new columns to tax_filing_sessions (idempotent)
    if 'is_primary' not in existing_columns:
        op.add_column('tax_filing_sessions',
            sa.Column('is_primary', sa.Boolean(), nullable=False, server_default='true',
                      comment='TRUE for main filing (primary residence), FALSE for additional filings (other cantons)')
        )

    if 'parent_filing_id' not in existing_columns:
        op.add_column('tax_filing_sessions',
            sa.Column('parent_filing_id', sa.String(36), nullable=True,
                      comment='Links secondary canton filings to main filing')
        )

    if 'source_filing_id' not in existing_columns:
        op.add_column('tax_filing_sessions',
            sa.Column('source_filing_id', sa.String(36), nullable=True,
                      comment='Tracks if filing was copied from previous year')
        )

    if 'deleted_at' not in existing_columns:
        op.add_column('tax_filing_sessions',
            sa.Column('deleted_at', sa.DateTime(), nullable=True,
                      comment='Soft delete timestamp')
        )

    # Get existing foreign keys and indexes
    existing_fks = [fk['name'] for fk in inspector.get_foreign_keys('tax_filing_sessions')]
    existing_indexes = [idx['name'] for idx in inspector.get_indexes('tax_filing_sessions')]

    # Add foreign key constraints (idempotent)
    if 'fk_tax_filing_parent' not in existing_fks:
        op.create_foreign_key(
            'fk_tax_filing_parent',
            'tax_filing_sessions', 'tax_filing_sessions',
            ['parent_filing_id'], ['id'],
            ondelete='SET NULL'
        )

    if 'fk_tax_filing_source' not in existing_fks:
        op.create_foreign_key(
            'fk_tax_filing_source',
            'tax_filing_sessions', 'tax_filing_sessions',
            ['source_filing_id'], ['id'],
            ondelete='SET NULL'
        )

    # Create performance indexes (idempotent)
    if 'idx_tax_filing_user_year' not in existing_indexes:
        op.create_index(
            'idx_tax_filing_user_year',
            'tax_filing_sessions',
            ['user_id', 'tax_year'],
            unique=False
        )

    if 'idx_tax_filing_canton' not in existing_indexes:
        op.create_index(
            'idx_tax_filing_canton',
            'tax_filing_sessions',
            ['canton'],
            unique=False
        )

    if 'idx_tax_filing_parent' not in existing_indexes:
        op.create_index(
            'idx_tax_filing_parent',
            'tax_filing_sessions',
            ['parent_filing_id'],
            unique=False
        )

    if 'idx_tax_filing_deleted' not in existing_indexes:
        op.create_index(
            'idx_tax_filing_deleted',
            'tax_filing_sessions',
            ['deleted_at'],
            unique=False
        )

    # Create unique constraint: one filing per user/year/canton (excluding deleted)
    # This prevents duplicate filings for the same year and canton
    if 'idx_tax_filing_unique_user_year_canton' not in existing_indexes:
        op.create_index(
            'idx_tax_filing_unique_user_year_canton',
            'tax_filing_sessions',
            ['user_id', 'tax_year', 'canton'],
            unique=True,
            postgresql_where=sa.text('deleted_at IS NULL')
        )


def downgrade():
    """Remove multi-filing support (idempotent)"""

    # Get connection to check existing objects
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_columns = [col['name'] for col in inspector.get_columns('tax_filing_sessions')]
    existing_fks = [fk['name'] for fk in inspector.get_foreign_keys('tax_filing_sessions')]
    existing_indexes = [idx['name'] for idx in inspector.get_indexes('tax_filing_sessions')]

    # Drop indexes (idempotent)
    if 'idx_tax_filing_unique_user_year_canton' in existing_indexes:
        op.drop_index('idx_tax_filing_unique_user_year_canton', table_name='tax_filing_sessions')

    if 'idx_tax_filing_deleted' in existing_indexes:
        op.drop_index('idx_tax_filing_deleted', table_name='tax_filing_sessions')

    if 'idx_tax_filing_parent' in existing_indexes:
        op.drop_index('idx_tax_filing_parent', table_name='tax_filing_sessions')

    if 'idx_tax_filing_canton' in existing_indexes:
        op.drop_index('idx_tax_filing_canton', table_name='tax_filing_sessions')

    if 'idx_tax_filing_user_year' in existing_indexes:
        op.drop_index('idx_tax_filing_user_year', table_name='tax_filing_sessions')

    # Drop foreign keys (idempotent)
    if 'fk_tax_filing_source' in existing_fks:
        op.drop_constraint('fk_tax_filing_source', 'tax_filing_sessions', type_='foreignkey')

    if 'fk_tax_filing_parent' in existing_fks:
        op.drop_constraint('fk_tax_filing_parent', 'tax_filing_sessions', type_='foreignkey')

    # Drop columns (idempotent)
    if 'deleted_at' in existing_columns:
        op.drop_column('tax_filing_sessions', 'deleted_at')

    if 'source_filing_id' in existing_columns:
        op.drop_column('tax_filing_sessions', 'source_filing_id')

    if 'parent_filing_id' in existing_columns:
        op.drop_column('tax_filing_sessions', 'parent_filing_id')

    if 'is_primary' in existing_columns:
        op.drop_column('tax_filing_sessions', 'is_primary')
