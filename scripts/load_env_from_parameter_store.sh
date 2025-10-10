#!/bin/bash
# Load environment variables from AWS Parameter Store
# This script fetches secrets from Parameter Store and creates .env.local

set -e

echo "Loading environment variables from AWS Parameter Store..."

# Get Stripe publishable key
STRIPE_KEY=$(aws ssm get-parameter \
  --name '/swissai-tax/stripe/publishable-key' \
  --region us-east-1 \
  --with-decryption \
  --query 'Parameter.Value' \
  --output text)

# Create .env.local file (gitignored)
cat > .env.local << EOF
# Auto-generated from AWS Parameter Store
# Generated: $(date)

REACT_APP_STRIPE_PUBLISHABLE_KEY=${STRIPE_KEY}
REACT_APP_API_URL=http://localhost:8000
REACT_APP_ENVIRONMENT=development
REACT_APP_ENABLE_SUBSCRIPTIONS=true
EOF

echo "✅ Created .env.local with values from Parameter Store"
echo "   Stripe key: ${STRIPE_KEY:0:20}..."
