#!/usr/bin/env python3
"""Run Alembic migrations with SSH tunnel connection"""

import os
import sys

from alembic import command
from alembic.config import Config

# Set up direct database URL for local execution
os.environ['DATABASE_URL'] = 'postgresql://webscrapinguser:IXq3IC0Uw6StMkBhb4mb@localhost:15433/swissai_tax_db'

# Create Alembic configuration
alembic_cfg = Config("alembic.ini")

# Override the database URL in Alembic config
alembic_cfg.set_main_option("sqlalchemy.url", os.environ['DATABASE_URL'])

# Run the upgrade
try:
    print("Running database migrations...")
    command.upgrade(alembic_cfg, "head")
    print("Migrations completed successfully!")
except Exception as e:
    print(f"Migration failed: {e}")
    sys.exit(1)