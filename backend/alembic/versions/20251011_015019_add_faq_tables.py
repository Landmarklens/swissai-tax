"""add_faq_tables

Revision ID: 20251011_015019
Revises: cb4ced9eea89
Create Date: 2025-10-11 01:50:19.000000

Adds faq_categories and faqs tables for storing FAQ content.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '20251011_015019'
down_revision: Union[str, Sequence[str], None] = '286b9925d9d0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create FAQ tables if they don't exist (idempotent)."""

    # Get connection to check existing tables
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_tables = inspector.get_table_names(schema='swisstax')

    # Check if UserType enum already exists, create if not
    result = conn.execute(sa.text("""
        SELECT EXISTS (
            SELECT 1 FROM pg_type t
            JOIN pg_namespace n ON n.oid = t.typnamespace
            WHERE t.typname = 'usertype' AND n.nspname = 'swisstax'
        );
    """))
    enum_exists = result.scalar()

    if not enum_exists:
        conn.execute(sa.text("CREATE TYPE swisstax.usertype AS ENUM ('tenant', 'landlord', 'both')"))
        conn.commit()
        print("✓ Created enum type 'swisstax.usertype'")
    else:
        print("ℹ️  Enum type 'swisstax.usertype' already exists, skipping creation")

    # Create faq_categories table
    if 'faq_categories' not in existing_tables:
        # Use raw SQL for table creation to avoid enum recreation issues
        conn.execute(sa.text("""
            CREATE TABLE swisstax.faq_categories (
                id VARCHAR(36) NOT NULL,
                name VARCHAR(255) NOT NULL,
                slug VARCHAR(255) NOT NULL,
                description TEXT,
                user_type swisstax.usertype NOT NULL DEFAULT 'both',
                sort_order INTEGER NOT NULL DEFAULT 0,
                is_active INTEGER NOT NULL DEFAULT 1,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                UNIQUE (slug)
            );
        """))
        conn.commit()

        # Create indexes using op for consistency
        op.create_index(
            'ix_swisstax_faq_categories_slug',
            'faq_categories',
            ['slug'],
            unique=True,
            schema='swisstax'
        )
        op.create_index(
            'ix_swisstax_faq_categories_user_type',
            'faq_categories',
            ['user_type'],
            schema='swisstax'
        )

        print("✓ Created table 'swisstax.faq_categories'")
    else:
        print("ℹ️  Table 'swisstax.faq_categories' already exists, skipping creation")

    # Create faqs table
    if 'faqs' not in existing_tables:
        # Use raw SQL for table creation to avoid enum recreation issues
        conn.execute(sa.text("""
            CREATE TABLE swisstax.faqs (
                id VARCHAR(36) NOT NULL,
                category_id VARCHAR(36) NOT NULL,
                question TEXT NOT NULL,
                answer TEXT NOT NULL,
                user_type swisstax.usertype NOT NULL DEFAULT 'both',
                bullet_points TEXT,
                detailed_points TEXT,
                conclusion TEXT,
                related_faq_ids TEXT,
                view_count INTEGER NOT NULL DEFAULT 0,
                helpful_count INTEGER NOT NULL DEFAULT 0,
                sort_order INTEGER NOT NULL DEFAULT 0,
                is_active INTEGER NOT NULL DEFAULT 1,
                meta_keywords TEXT,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                FOREIGN KEY (category_id) REFERENCES swisstax.faq_categories(id) ON DELETE CASCADE
            );
        """))
        conn.commit()

        # Create indexes using op
        op.create_index(
            'ix_swisstax_faqs_category_id',
            'faqs',
            ['category_id'],
            schema='swisstax'
        )
        op.create_index(
            'ix_swisstax_faqs_user_type',
            'faqs',
            ['user_type'],
            schema='swisstax'
        )

        print("✓ Created table 'swisstax.faqs'")
    else:
        print("ℹ️  Table 'swisstax.faqs' already exists, skipping creation")


def downgrade() -> None:
    """Drop FAQ tables if they exist (idempotent)."""

    # Get connection to check existing tables
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_tables = inspector.get_table_names(schema='swisstax')

    # Drop faqs table
    if 'faqs' in existing_tables:
        # Drop indexes first
        existing_indexes = [idx['name'] for idx in inspector.get_indexes('faqs', schema='swisstax')]

        if 'ix_swisstax_faqs_user_type' in existing_indexes:
            op.drop_index('ix_swisstax_faqs_user_type', table_name='faqs', schema='swisstax')

        if 'ix_swisstax_faqs_category_id' in existing_indexes:
            op.drop_index('ix_swisstax_faqs_category_id', table_name='faqs', schema='swisstax')

        # Drop table
        op.drop_table('faqs', schema='swisstax')
        print("✓ Dropped table 'swisstax.faqs'")
    else:
        print("ℹ️  Table 'swisstax.faqs' does not exist, skipping drop")

    # Drop faq_categories table
    if 'faq_categories' in existing_tables:
        # Drop indexes first
        existing_indexes = [idx['name'] for idx in inspector.get_indexes('faq_categories', schema='swisstax')]

        if 'ix_swisstax_faq_categories_user_type' in existing_indexes:
            op.drop_index('ix_swisstax_faq_categories_user_type', table_name='faq_categories', schema='swisstax')

        if 'ix_swisstax_faq_categories_slug' in existing_indexes:
            op.drop_index('ix_swisstax_faq_categories_slug', table_name='faq_categories', schema='swisstax')

        # Drop table
        op.drop_table('faq_categories', schema='swisstax')
        print("✓ Dropped table 'swisstax.faq_categories'")
    else:
        print("ℹ️  Table 'swisstax.faq_categories' does not exist, skipping drop")

    # Drop UserType enum
    op.execute('DROP TYPE IF EXISTS swisstax.usertype')
