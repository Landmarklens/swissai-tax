#!/bin/bash
# Script to run Alembic migrations via SSH tunnel

# SSH tunnel configuration
SSH_HOST="3.221.26.92"
SSH_USER="ubuntu"
SSH_KEY="$HOME/Desktop/HomeAiCode/id_rsa"
LOCAL_PORT="5433"  # Use different port to avoid conflicts with local postgres

# Database configuration (through tunnel)
DB_HOST="webscraping-database.cluster-c9y2u088elix.us-east-1.rds.amazonaws.com"
DB_PORT="5432"
DB_NAME="swissai_tax"
DB_USER="webscrapinguser"
DB_PASSWORD="IXq3IC0Uw6StMkBhb4mb"
DB_SCHEMA="swisstax"

echo "=== Setting up SSH Tunnel ==="
echo "SSH Host: $SSH_HOST"
echo "Local Port: $LOCAL_PORT"
echo "Remote DB: $DB_HOST:$DB_PORT"
echo ""

# Kill any existing tunnel on the port
pkill -f "ssh.*$LOCAL_PORT:$DB_HOST" 2>/dev/null || true
sleep 1

# Create SSH tunnel in background
ssh -f -N -L $LOCAL_PORT:$DB_HOST:$DB_PORT -i "$SSH_KEY" $SSH_USER@$SSH_HOST -o StrictHostKeyChecking=no

if [ $? -ne 0 ]; then
    echo "ERROR: Failed to create SSH tunnel"
    exit 1
fi

echo "✓ SSH tunnel established"
sleep 2

# Export database configuration for Alembic
export DATABASE_HOST="localhost"
export DATABASE_PORT="$LOCAL_PORT"
export DATABASE_NAME="$DB_NAME"
export DATABASE_USER="$DB_USER"
export DATABASE_PASSWORD="$DB_PASSWORD"
export DATABASE_SCHEMA="$DB_SCHEMA"

echo ""
echo "=== Running Alembic Migration ==="
echo "Database: $DATABASE_NAME"
echo "Schema: $DATABASE_SCHEMA"
echo ""

# Check current migration status
echo "Current migration status:"
alembic current
echo ""

# Run the migration
echo "Running migration to head..."
alembic upgrade head

MIGRATION_EXIT_CODE=$?

echo ""
if [ $MIGRATION_EXIT_CODE -eq 0 ]; then
    echo "✓ Migration completed successfully"
    echo ""
    echo "Final migration status:"
    alembic current
else
    echo "✗ Migration failed with exit code $MIGRATION_EXIT_CODE"
fi

# Clean up: kill SSH tunnel
echo ""
echo "Closing SSH tunnel..."
pkill -f "ssh.*$LOCAL_PORT:$DB_HOST"

exit $MIGRATION_EXIT_CODE
