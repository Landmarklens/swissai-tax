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

# Debug: Check Python package locations
echo "Python site-packages locations:"
python3 -c "import site; print('\n'.join(site.getsitepackages()))"
echo "Checking for key packages:"
python3 -m pip list | grep -E "(alembic|psycopg2|fastapi)" || echo "No packages found via pip list"
echo "Attempting alembic import:"
python3 -c "import alembic; print(f'alembic found at: {alembic.__file__}')" 2>&1 || echo "alembic import failed"

# Install runtime dependencies - App Runner build doesn't persist to runtime
echo "Installing runtime dependencies (required for App Runner)..."
cd /app/backend
python3 -m pip install --quiet --no-cache-dir -r requirements-apprunner.txt
echo "Dependencies installed successfully"

# Load database configuration from Parameter Store
echo "========================================="
echo "LOADING CONFIGURATION FROM PARAMETER STORE"
echo "========================================="
export DATABASE_HOST=$(aws ssm get-parameter --name "/swissai-tax/db/host" --region us-east-1 --query "Parameter.Value" --output text 2>/dev/null || echo "")
export DATABASE_PORT=$(aws ssm get-parameter --name "/swissai-tax/db/port" --region us-east-1 --query "Parameter.Value" --output text 2>/dev/null || echo "5432")
export DATABASE_NAME=$(aws ssm get-parameter --name "/swissai-tax/db/database" --region us-east-1 --query "Parameter.Value" --output text 2>/dev/null || echo "swissai_tax")
export DATABASE_USER=$(aws ssm get-parameter --name "/swissai-tax/db/username" --region us-east-1 --query "Parameter.Value" --output text 2>/dev/null || echo "")
export DATABASE_PASSWORD=$(aws ssm get-parameter --name "/swissai-tax/db/password" --with-decryption --region us-east-1 --query "Parameter.Value" --output text 2>/dev/null || echo "")
export DATABASE_SCHEMA=$(aws ssm get-parameter --name "/swissai-tax/db/schema" --region us-east-1 --query "Parameter.Value" --output text 2>/dev/null || echo "public")

echo "Configuration loaded from Parameter Store:"
echo "  DATABASE_HOST: ${DATABASE_HOST}"
echo "  DATABASE_PORT: ${DATABASE_PORT}"
echo "  DATABASE_NAME: ${DATABASE_NAME}"
echo "  DATABASE_USER: ${DATABASE_USER}"
echo "  DATABASE_SCHEMA: ${DATABASE_SCHEMA}"

# Create database if needed
echo "========================================="
echo "DATABASE SETUP"
echo "========================================="
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