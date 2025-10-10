#!/bin/bash
# Stripe Configuration Verification Script
# Checks if all required AWS Parameter Store values are set

set -e

echo "=================================================="
echo "🔍 SwissAI Tax - Stripe Configuration Verification"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Required parameters
REQUIRED_PARAMS=(
    "/swissai-tax/stripe/secret-key"
    "/swissai-tax/stripe/publishable-key"
    "/swissai-tax/stripe/webhook-secret"
    "/swissai-tax/stripe/price-basic"
    "/swissai-tax/stripe/price-pro"
    "/swissai-tax/stripe/price-premium"
    "/swissai-tax/features/enable-subscriptions"
)

echo ""
echo "Checking AWS Parameter Store..."
echo ""

MISSING_COUNT=0
SUCCESS_COUNT=0

for param in "${REQUIRED_PARAMS[@]}"; do
    # Try to get parameter
    if aws ssm get-parameter --name "$param" --region us-east-1 &> /dev/null; then
        echo -e "${GREEN}✅${NC} $param"
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))

        # Show value preview (masked for secrets)
        VALUE=$(aws ssm get-parameter --name "$param" --region us-east-1 --query 'Parameter.Value' --output text)
        if [[ "$param" == *"secret"* ]] || [[ "$param" == *"key"* ]]; then
            echo "   Value: ${VALUE:0:20}... (masked)"
        else
            echo "   Value: $VALUE"
        fi
    else
        echo -e "${RED}❌${NC} $param - NOT SET"
        MISSING_COUNT=$((MISSING_COUNT + 1))
    fi
done

echo ""
echo "=================================================="
echo "Summary: $SUCCESS_COUNT/${#REQUIRED_PARAMS[@]} parameters configured"
echo "=================================================="

if [ $MISSING_COUNT -eq 0 ]; then
    echo -e "${GREEN}✅ All Stripe parameters are configured!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Verify REACT_APP_STRIPE_PUBLISHABLE_KEY is set in frontend .env"
    echo "2. Run database migrations: cd backend && alembic upgrade head"
    echo "3. Restart backend to load new configuration"
    echo "4. Test subscription flow with Stripe test card"
    exit 0
else
    echo -e "${RED}❌ Missing $MISSING_COUNT parameter(s)${NC}"
    echo ""
    echo "To configure missing parameters:"
    echo "1. Run: python scripts/setup_stripe_products.py --mode test"
    echo "2. Or manually set with AWS CLI (see STRIPE_STATUS_REPORT.md)"
    exit 1
fi
