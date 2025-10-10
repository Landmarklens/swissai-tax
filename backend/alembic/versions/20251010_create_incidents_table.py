"""create incidents table for status page

Revision ID: 20251010_incidents
Revises: 20251010_sessions
Create Date: 2025-10-10

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
import uuid


# revision identifiers, used by Alembic.
revision = '20251010_incidents'
down_revision = '20251010_sessions'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create incidents table and related enums (idempotent)"""

    # Create enum types if they don't exist
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE incidentstatus AS ENUM ('investigating', 'identified', 'monitoring', 'resolved');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    op.execute("""
        DO $$ BEGIN
            CREATE TYPE incidentseverity AS ENUM ('low', 'medium', 'high', 'critical');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    # Create incidents table if it doesn't exist
    op.execute("""
        CREATE TABLE IF NOT EXISTS incidents (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            status incidentstatus NOT NULL DEFAULT 'investigating',
            severity incidentseverity NOT NULL DEFAULT 'medium',
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
            resolved_at TIMESTAMP NULL,
            affected_services TEXT NULL,
            post_mortem_url VARCHAR(512) NULL
        );
    """)

    # Create indexes if they don't exist (idempotent)
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_incidents_title ON incidents(title);
    """)

    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_incidents_status ON incidents(status);
    """)

    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_incidents_created_at ON incidents(created_at);
    """)

    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_incidents_status_created ON incidents(status, created_at);
    """)


def downgrade() -> None:
    """Drop incidents table and related enums"""
    op.execute('DROP INDEX IF EXISTS ix_incidents_status_created')
    op.execute('DROP INDEX IF EXISTS ix_incidents_created_at')
    op.execute('DROP INDEX IF EXISTS ix_incidents_status')
    op.execute('DROP INDEX IF EXISTS ix_incidents_title')
    op.drop_table('incidents', if_exists=True)
    op.execute('DROP TYPE IF EXISTS incidentstatus')
    op.execute('DROP TYPE IF EXISTS incidentseverity')
