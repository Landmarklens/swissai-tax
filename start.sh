#!/bin/bash
# Start script for App Runner

# Set Python path
export PYTHONPATH="/app/backend:$PYTHONPATH"

# Install dependencies at runtime if needed
if [ ! -d "/root/.local/lib/python3.11/site-packages/fastapi" ]; then
    echo "Installing dependencies..."
    cd /app/backend
    python3 -m pip install -r requirements.txt
fi

# Create database if needed
echo "Checking database..."
echo "Database user: ${DATABASE_USER}"
cd /app
python3 backend/create_database.py || echo "Database setup failed, continuing anyway..."

# Run Alembic migrations to create swisstax schema and tables
echo "Running database migrations..."
cd /app/backend
echo "Current database state:"
alembic current || echo "No migrations applied yet"
echo "Upgrading to head..."
alembic upgrade head || {
    echo "FATAL: Database migration failed. Cannot start application."
    exit 1
}
echo "Final database state:"
alembic current

# Start the application
# Use uvicorn with proper import string for production
cd /app/backend
exec uvicorn main:app --host 0.0.0.0 --port 8000