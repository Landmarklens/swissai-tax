#!/usr/bin/env python3
"""
Run Alembic migration through SSH tunnel (localhost:5432)
"""
import os
import sys
from alembic.config import Config
from alembic import command

# Get database credentials from AWS Parameter Store
import boto3

def get_parameter(name):
    """Get parameter from AWS Parameter Store"""
    try:
        ssm = boto3.client('ssm', region_name='us-east-1')
        response = ssm.get_parameter(Name=name, WithDecryption=True)
        return response['Parameter']['Value']
    except Exception as e:
        print(f"Warning: Could not get parameter {name}: {e}")
        return None

# Get credentials
db_user = get_parameter('/swissai-tax/db/username')
db_password = get_parameter('/swissai-tax/db/password')
db_name = get_parameter('/swissai-tax/db/database')

if not all([db_user, db_password, db_name]):
    print("Error: Could not retrieve database credentials from Parameter Store")
    sys.exit(1)

# Build database URL for localhost (through SSH tunnel)
database_url = f"postgresql://{db_user}:{db_password}@localhost:5432/{db_name}"

# Override environment variables (get_db_config checks these first)
os.environ['DATABASE_HOST'] = 'localhost'
os.environ['DATABASE_PORT'] = '5432'
os.environ['DATABASE_NAME'] = db_name
os.environ['DATABASE_USER'] = db_user
os.environ['DATABASE_PASSWORD'] = db_password
os.environ['DATABASE_SCHEMA'] = 'swisstax'
os.environ['DATABASE_URL'] = database_url

# Configure Alembic
alembic_cfg = Config("alembic.ini")
alembic_cfg.set_main_option("sqlalchemy.url", database_url)

print("=" * 60)
print("Running Alembic Migration")
print("=" * 60)
print(f"Database: {db_name}")
print(f"Host: localhost:5432 (via SSH tunnel)")
print(f"User: {db_user}")
print("=" * 60)

try:
    # Show current revision
    print("\nCurrent database revision:")
    command.current(alembic_cfg, verbose=True)

    print("\nUpgrading to head...")
    command.upgrade(alembic_cfg, "head")

    print("\n✓ Migration completed successfully!")
    print("\nNew database revision:")
    command.current(alembic_cfg, verbose=True)

except Exception as e:
    print(f"\n✗ Migration failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
