#!/usr/bin/env python3
"""Check current database state"""

import os
os.environ['DATABASE_HOST'] = 'localhost'
os.environ['DATABASE_PORT'] = '5433'
os.environ['DATABASE_NAME'] = 'homeai_db'
os.environ['DATABASE_USER'] = 'webscrapinguser'
os.environ['DATABASE_PASSWORD'] = 'IXq3IC0Uw6StMkBhb4mb'
os.environ['DATABASE_SCHEMA'] = 'swisstax'

from database.connection import execute_query, execute_one

print("=" * 60)
print("Database State Check")
print("=" * 60)

# Check current alembic version
try:
    result = execute_one('SELECT version_num FROM alembic_version')
    print(f"\nCurrent Alembic Revision: {result['version_num'] if result else 'None'}")
except Exception as e:
    print(f"\nAlembic version table: Does not exist (no migrations run yet)")

# Check all schemas
schemas = execute_query("""
    SELECT schema_name FROM information_schema.schemata
    WHERE schema_name NOT IN ('pg_catalog', 'information_schema')
    ORDER BY schema_name
""")
print(f"\nSchemas in database:")
for s in schemas:
    print(f"  - {s['schema_name']}")

# Check tables in all schemas
tables = execute_query("""
    SELECT table_schema, table_name FROM information_schema.tables
    WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
    ORDER BY table_schema, table_name
""")
print(f"\nAll tables in database: ({len(tables)} tables)")
current_schema = None
for t in tables:
    if t['table_schema'] != current_schema:
        current_schema = t['table_schema']
        print(f"\n  {current_schema}:")
    print(f"    - {t['table_name']}")

# Check columns in users table if it exists
users_check = execute_query("""
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'swisstax' AND table_name = 'users'
    ORDER BY ordinal_position
""")
if users_check:
    print(f"\nColumns in swisstax.users:")
    for c in users_check:
        print(f"  - {c['column_name']}")
else:
    print("\nswisstax.users table does not exist")

print("\n" + "=" * 60)
