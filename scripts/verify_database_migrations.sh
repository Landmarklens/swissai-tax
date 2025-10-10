#!/bin/bash
# Database Migration Verification Script
# Checks if all required subscription fields exist in database

set -e

echo "========================================================"
echo "🔍 SwissAI Tax - Database Migration Verification"
echo "========================================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Change to backend directory
cd "$(dirname "$0")/../backend" || exit 1

echo ""
echo "Checking Alembic migration status..."
echo ""

# Check current migration version
CURRENT_VERSION=$(alembic current 2>/dev/null | grep -oE '[a-f0-9]{12}' || echo "none")

if [ "$CURRENT_VERSION" == "none" ]; then
    echo -e "${RED}❌ No migrations have been applied${NC}"
    echo ""
    echo "Run migrations with:"
    echo "  cd backend"
    echo "  alembic upgrade head"
    exit 1
fi

echo -e "${GREEN}✅ Current migration: $CURRENT_VERSION${NC}"

# Check if at head
HEAD_VERSION=$(alembic heads 2>/dev/null | grep -oE '[a-f0-9]{12}' | head -1 || echo "unknown")

if [ "$CURRENT_VERSION" != "$HEAD_VERSION" ]; then
    echo -e "${YELLOW}⚠️  Not at latest migration${NC}"
    echo "   Current: $CURRENT_VERSION"
    echo "   Latest:  $HEAD_VERSION"
    echo ""
    echo "Run migrations with:"
    echo "  cd backend"
    echo "  alembic upgrade head"
    exit 1
fi

echo -e "${GREEN}✅ Database is at latest migration${NC}"

# Verify subscription table has required fields
echo ""
echo "Checking subscription table schema..."
echo ""

# Required fields for subscription commitments
REQUIRED_SUBSCRIPTION_FIELDS=(
    "plan_commitment_years"
    "commitment_start_date"
    "commitment_end_date"
    "trial_start"
    "trial_end"
    "pause_requested"
    "pause_reason"
    "switch_requested"
    "switch_to_plan"
    "cancellation_requested_at"
    "cancellation_reason"
)

# Required fields for users
REQUIRED_USER_FIELDS=(
    "stripe_customer_id"
)

# Get database URL from environment or .env file
if [ -z "$DATABASE_URL" ]; then
    if [ -f ".env" ]; then
        export $(grep -v '^#' .env | xargs)
    fi
fi

if [ -z "$DATABASE_URL" ]; then
    echo -e "${YELLOW}⚠️  DATABASE_URL not set, skipping table schema check${NC}"
    echo "   Set DATABASE_URL to verify table schema"
    echo ""
    echo "Manual verification:"
    echo "  psql <your-db-url> -c \"\\d subscriptions\""
    echo "  psql <your-db-url> -c \"\\d users\""
else
    echo "Checking 'subscriptions' table..."

    MISSING_SUBSCRIPTION_FIELDS=0
    for field in "${REQUIRED_SUBSCRIPTION_FIELDS[@]}"; do
        if psql "$DATABASE_URL" -t -c "SELECT column_name FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='$field';" 2>/dev/null | grep -q "$field"; then
            echo -e "${GREEN}  ✅${NC} $field"
        else
            echo -e "${RED}  ❌${NC} $field - MISSING"
            MISSING_SUBSCRIPTION_FIELDS=$((MISSING_SUBSCRIPTION_FIELDS + 1))
        fi
    done

    echo ""
    echo "Checking 'users' table..."

    MISSING_USER_FIELDS=0
    for field in "${REQUIRED_USER_FIELDS[@]}"; do
        if psql "$DATABASE_URL" -t -c "SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='$field';" 2>/dev/null | grep -q "$field"; then
            echo -e "${GREEN}  ✅${NC} $field"
        else
            echo -e "${RED}  ❌${NC} $field - MISSING"
            MISSING_USER_FIELDS=$((MISSING_USER_FIELDS + 1))
        fi
    done

    TOTAL_MISSING=$((MISSING_SUBSCRIPTION_FIELDS + MISSING_USER_FIELDS))

    echo ""
    echo "========================================================"
    if [ $TOTAL_MISSING -eq 0 ]; then
        echo -e "${GREEN}✅ All required database fields exist!${NC}"
        echo "========================================================"
        exit 0
    else
        echo -e "${RED}❌ Missing $TOTAL_MISSING required field(s)${NC}"
        echo "========================================================"
        echo ""
        echo "Run migrations to add missing fields:"
        echo "  cd backend"
        echo "  alembic upgrade head"
        exit 1
    fi
fi

echo ""
echo "========================================================"
echo -e "${GREEN}✅ Migration verification complete${NC}"
echo "========================================================"
