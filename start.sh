#!/bin/bash
# Start script for App Runner

echo "========================================="
echo "START SCRIPT BEGINNING"
echo "========================================="
echo "Script started at: $(date)"
echo "Working directory: $(pwd)"
echo "Python version: $(python3 --version)"
echo "Python3 path: $(which python3)"
echo "Python path (if exists): $(which python || echo 'python command not found - THIS IS EXPECTED')"
echo "Environment variables:"
env | grep -E "(PYTHON|PATH|DATABASE)" | sort
echo "========================================="

# Set Python path
export PYTHONPATH="/app/backend:$PYTHONPATH"
echo "PYTHONPATH set to: $PYTHONPATH"

# Skip runtime dependency installation - already installed during build phase
echo "Dependencies already installed during build phase, skipping..."

# Create database if needed
echo "========================================="
echo "DATABASE SETUP"
echo "========================================="
echo "Database user: ${DATABASE_USER}"
echo "Database host: ${DATABASE_HOST}"
echo "Database name: ${DATABASE_NAME}"
cd /app
echo "Running create_database.py..."
python3 backend/create_database.py || echo "Database setup failed, continuing anyway..."
echo "Database setup completed"

# Run Alembic migrations to create swisstax schema and tables
echo "========================================="
echo "DATABASE MIGRATIONS"
echo "========================================="
cd /app/backend
echo "Changed to directory: $(pwd)"
echo "Listing alembic directory:"
ls -la alembic/ 2>&1 | head -10
echo "Current database state:"
alembic current || echo "No migrations applied yet"
echo "Upgrading to head..."
alembic upgrade head || {
    echo "FATAL: Database migration failed. Cannot start application."
    exit 1
}
echo "Final database state:"
alembic current
echo "Migration completed successfully"

# Start the application
echo "========================================="
echo "STARTING APPLICATION"
echo "========================================="
cd /app/backend
echo "Final working directory: $(pwd)"
echo "Listing main.py:"
ls -la main.py
echo "Starting uvicorn on port 8000..."
exec uvicorn main:app --host 0.0.0.0 --port 8000