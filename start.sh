#!/bin/bash
# Start script for App Runner

# Set Python path
export PYTHONPATH="/app/backend:$PYTHONPATH"

# Install dependencies at runtime if needed
if [ ! -d "/root/.local/lib/python3.11/site-packages/fastapi" ]; then
    echo "Installing dependencies..."
    cd /app/backend
    python3 -m pip install -r requirements-apprunner.txt
fi

# Create database if needed
echo "Checking database..."
cd /app
python3 backend/create_database.py

# Start the application
exec python3 backend/app.py