#!/bin/bash
# Migration runner script for SwissAI Tax
# Connects to database via SSH tunnel and applies migrations

echo "========================================"
echo "SwissAI Tax - Database Migration Runner"
echo "========================================"
echo ""

# Set database URL for localhost connection (via SSH tunnel)
# Using port 5433 to avoid conflicts with local PostgreSQL
export DATABASE_URL="postgresql://webscrapinguser:IXq3IC0Uw6StMkBhb4mb@localhost:5433/swissai_tax"

cd "$(dirname "$0")" || exit

echo "Checking database connection..."
psql "$DATABASE_URL" -c "SELECT version();" 2>&1 | head -1

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ ERROR: Cannot connect to database"
    echo ""
    echo "Please ensure SSH tunnel is running:"
    echo "ssh -i ~/Desktop/HomeAiCode/id_rsa -L 5433:webscraping-database.cluster-c9y2u088elix.us-east-1.rds.amazonaws.com:5432 ubuntu@3.221.26.92 -N -f"
    echo ""
    exit 1
fi

echo "✅ Database connection successful"
echo ""

# Show current migration
echo "Current migration version:"
python -m alembic current

echo ""
echo "Pending migrations:"
python -m alembic heads

echo ""
# Auto-apply if --auto flag is passed
if [ "$1" = "--auto" ]; then
    AUTO_APPLY=true
else
    read -p "Apply migrations? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        AUTO_APPLY=true
    else
        AUTO_APPLY=false
    fi
fi

if [ "$AUTO_APPLY" = true ]; then
    echo "Applying migrations..."
    python -m alembic upgrade head

    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Migration successful!"
        echo ""
        echo "New version:"
        python -m alembic current
    else
        echo ""
        echo "❌ Migration failed!"
        exit 1
    fi
else
    echo "Migration cancelled"
    exit 0
fi
