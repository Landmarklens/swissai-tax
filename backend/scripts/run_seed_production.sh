#!/bin/bash
# Script to seed incidents table on production database
# This connects to your production RDS instance and runs the seed SQL

set -e

echo "🌱 Seeding incidents table on production database..."
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    echo ""
    echo "Please set DATABASE_URL to your production database connection string:"
    echo "  export DATABASE_URL='postgresql://user:password@host:5432/database'"
    echo ""
    echo "Or get it from AWS Parameter Store:"
    echo "  aws ssm get-parameter --name /swissai-tax/db/connection-string --with-decryption --region us-east-1"
    exit 1
fi

# Confirm before running
echo "This will add 7 historical incidents to the incidents table."
echo "The script is idempotent - it will skip if incidents already exist."
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
fi

# Run the seed script
psql "$DATABASE_URL" -f "$(dirname "$0")/seed_incidents.sql"

echo ""
echo "✅ Seed script completed!"
