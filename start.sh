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

# Start the application
# Use main.py which includes all router registrations
exec python3 backend/main.py