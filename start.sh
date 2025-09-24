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

# Start the application
cd /app
exec python3 backend/app.py