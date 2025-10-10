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

# Load database configuration from Parameter Store using Python boto3
echo "========================================="
echo "LOADING CONFIGURATION FROM PARAMETER STORE"
echo "========================================="
python3 << 'PYTHON_SCRIPT'
import boto3
import os

ssm = boto3.client('ssm', region_name='us-east-1')

params = {
    'DATABASE_HOST': '/swissai-tax/db/host',
    'DATABASE_PORT': '/swissai-tax/db/port',
    'DATABASE_NAME': '/swissai-tax/db/database',
    'DATABASE_USER': '/swissai-tax/db/username',
    'DATABASE_PASSWORD': '/swissai-tax/db/password',
    'DATABASE_SCHEMA': '/swissai-tax/db/schema'
}

for env_var, param_name in params.items():
    try:
        decrypt = env_var == 'DATABASE_PASSWORD'
        response = ssm.get_parameter(Name=param_name, WithDecryption=decrypt)
        value = response['Parameter']['Value']
        print(f"export {env_var}='{value}'")
    except Exception as e:
        # Use defaults for optional parameters
        if env_var == 'DATABASE_PORT':
            print(f"export {env_var}='5432'")
        elif env_var == 'DATABASE_SCHEMA':
            print(f"export {env_var}='public'")
        elif env_var == 'DATABASE_NAME':
            print(f"export {env_var}='swissai_tax'")
        else:
            print(f"export {env_var}=''")
            print(f"# Warning: Failed to fetch {param_name}: {e}", file=__import__('sys').stderr)
PYTHON_SCRIPT

# Source the exports
eval "$(python3 << 'PYTHON_SCRIPT'
import boto3
ssm = boto3.client('ssm', region_name='us-east-1')
params = {
    'DATABASE_HOST': '/swissai-tax/db/host',
    'DATABASE_PORT': '/swissai-tax/db/port',
    'DATABASE_NAME': '/swissai-tax/db/database',
    'DATABASE_USER': '/swissai-tax/db/username',
    'DATABASE_PASSWORD': '/swissai-tax/db/password',
    'DATABASE_SCHEMA': '/swissai-tax/db/schema'
}
for env_var, param_name in params.items():
    try:
        decrypt = env_var == 'DATABASE_PASSWORD'
        response = ssm.get_parameter(Name=param_name, WithDecryption=decrypt)
        value = response['Parameter']['Value'].replace("'", "'\\''")
        print(f"export {env_var}='{value}'")
    except:
        if env_var == 'DATABASE_PORT':
            print(f"export {env_var}='5432'")
        elif env_var == 'DATABASE_SCHEMA':
            print(f"export {env_var}='public'")
        elif env_var == 'DATABASE_NAME':
            print(f"export {env_var}='swissai_tax'")
        else:
            print(f"export {env_var}=''")
PYTHON_SCRIPT
)"

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