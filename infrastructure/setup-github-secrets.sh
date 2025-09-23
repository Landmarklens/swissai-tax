#!/bin/bash

# Setup GitHub Secrets for CI/CD

echo "Setting up GitHub secrets for swisstax-ai..."

# AWS Credentials
gh secret set AWS_ACCESS_KEY_ID --body "$AWS_ACCESS_KEY_ID" 2>/dev/null || echo "AWS_ACCESS_KEY_ID already set"
gh secret set AWS_SECRET_ACCESS_KEY --body "$AWS_SECRET_ACCESS_KEY" 2>/dev/null || echo "AWS_SECRET_ACCESS_KEY already set"
gh secret set AWS_ACCOUNT_ID --body "445567083171" 2>/dev/null || echo "AWS_ACCOUNT_ID already set"

# ECR Registry
gh secret set ECR_REGISTRY --body "445567083171.dkr.ecr.us-east-1.amazonaws.com" 2>/dev/null || echo "ECR_REGISTRY already set"
gh secret set ECR_REPOSITORY --body "swisstax-ai-backend" 2>/dev/null || echo "ECR_REPOSITORY already set"

echo "✓ GitHub secrets configured"
echo ""
echo "To view secrets: gh secret list"