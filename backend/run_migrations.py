#!/usr/bin/env python3
"""
Migration runner with idempotent checks
Runs migrations only if they haven't been applied yet
"""

import sys
from database.connection import get_db_config
from sqlalchemy import create_engine, text, inspect
from alembic.config import Config
from alembic import command
import os

# Get database configuration
db_config = get_db_config()
database_url = f"postgresql://{db_config['user']}:{db_config['password']}@{db_config['host']}:{db_config['port']}/{db_config['database']}"

# Create engine
engine = create_engine(database_url)

def check_alembic_version_table():
    """Check if alembic_version table exists"""
    inspector = inspect(engine)
    return 'alembic_version' in inspector.get_table_names()

def get_current_revision():
    """Get current database revision"""
    if not check_alembic_version_table():
        return None

    with engine.connect() as conn:
        result = conn.execute(text("SELECT version_num FROM alembic_version"))
        row = result.fetchone()
        return row[0] if row else None

def run_migrations():
    """Run Alembic migrations"""
    print("=" * 60)
    print("SwissAI Tax - Database Migration Runner")
    print("=" * 60)

    # Check current revision
    current = get_current_revision()
    if current:
        print(f"\n✓ Current database revision: {current}")
    else:
        print("\n⚠  No migrations have been run yet")

    print("\nRunning migrations...")
    print("-" * 60)

    # Configure Alembic
    alembic_cfg = Config("alembic.ini")
    alembic_cfg.set_main_option("sqlalchemy.url", database_url)

    # Run upgrade
    try:
        command.upgrade(alembic_cfg, "head")
        print("-" * 60)
        print("\n✅ Migrations completed successfully!")

        # Show new revision
        new_revision = get_current_revision()
        print(f"✓ Database is now at revision: {new_revision}")

    except Exception as e:
        print("-" * 60)
        print(f"\n❌ Migration failed: {e}")
        sys.exit(1)

    print("=" * 60)

if __name__ == "__main__":
    run_migrations()
