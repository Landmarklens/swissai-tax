#!/bin/bash
# Script to run Alembic migrations locally against swisstax database

# Database connection details
export DATABASE_HOST="webscraping-database.cluster-c9y2u088elix.us-east-1.rds.amazonaws.com"
export DATABASE_PORT="5432"
export DATABASE_NAME="homeai_db"
export DATABASE_USER="webscrapinguser"
export DATABASE_PASSWORD="IXq3IC0Uw6StMkBhb4mb"
export DATABASE_SCHEMA="swisstax"

echo "=== Running Alembic Migration for 2FA ==="
echo "Target Database: $DATABASE_HOST"
echo "Database Name: $DATABASE_NAME"
echo "Schema: $DATABASE_SCHEMA"
echo ""

# Check current migration status
echo "Current migration status:"
alembic current
echo ""

# Show pending migrations
echo "Pending migrations:"
alembic heads
echo ""

# Run the migration
echo "Running migration..."
alembic upgrade head

# Show final status
echo ""
echo "Final migration status:"
alembic current
