#!/bin/bash

# SwissTax.ai Infrastructure Deployment Script

set -e

echo "🚀 Starting SwissTax.ai deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID="445567083171"
ECR_REPO="swisstax-ai-backend"
GITHUB_REPO="https://github.com/trustorno/swisstax-ai"

echo -e "${YELLOW}Step 1: Checking prerequisites...${NC}"

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}AWS CLI is not installed${NC}"
    exit 1
fi

# Check GitHub CLI
if ! command -v gh &> /dev/null; then
    echo -e "${RED}GitHub CLI is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Prerequisites check passed${NC}"

# Step 2: ECR Repository
echo -e "${YELLOW}Step 2: Setting up ECR repository...${NC}"
aws ecr describe-repositories --repository-names $ECR_REPO --region $AWS_REGION 2>/dev/null || \
    aws ecr create-repository --repository-name $ECR_REPO --region $AWS_REGION

echo -e "${GREEN}✓ ECR repository ready${NC}"

# Step 3: Create IAM roles if needed
echo -e "${YELLOW}Step 3: Creating IAM roles...${NC}"

# CodeBuild service role
cat > /tmp/codebuild-trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "codebuild.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

aws iam create-role --role-name codebuild-swisstax-service-role \
    --assume-role-policy-document file:///tmp/codebuild-trust-policy.json 2>/dev/null || \
    echo "CodeBuild role already exists"

# Attach policies to CodeBuild role
aws iam attach-role-policy --role-name codebuild-swisstax-service-role \
    --policy-arn arn:aws:iam::aws:policy/AWSCodeBuildAdminAccess 2>/dev/null || true
aws iam attach-role-policy --role-name codebuild-swisstax-service-role \
    --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser 2>/dev/null || true
aws iam attach-role-policy --role-name codebuild-swisstax-service-role \
    --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess 2>/dev/null || true

echo -e "${GREEN}✓ IAM roles configured${NC}"

# Step 4: Create CodeBuild project
echo -e "${YELLOW}Step 4: Creating CodeBuild project...${NC}"
aws codebuild create-project --cli-input-json file://infrastructure/codebuild-project.json 2>/dev/null || \
    echo "CodeBuild project already exists"

echo -e "${GREEN}✓ CodeBuild project ready${NC}"

# Step 5: Create CodePipeline
echo -e "${YELLOW}Step 5: Creating CodePipeline...${NC}"

# Note: CodePipeline requires GitHub OAuth token or GitHub App connection
echo -e "${YELLOW}Note: CodePipeline requires GitHub connection setup in AWS Console${NC}"
echo "Please set up GitHub connection manually in AWS CodePipeline console"

# Step 6: Amplify App
echo -e "${YELLOW}Step 6: Setting up Amplify app...${NC}"
echo -e "${YELLOW}Note: Amplify requires manual setup in AWS Console for GitHub authorization${NC}"
echo "1. Go to AWS Amplify Console"
echo "2. Click 'New app' -> 'Host web app'"
echo "3. Choose GitHub and authorize"
echo "4. Select repository: trustorno/swisstax-ai"
echo "5. Use the buildspec from infrastructure/amplify.yml"

echo -e "${GREEN}🎉 Deployment script completed!${NC}"
echo ""
echo "Next manual steps:"
echo "1. Set up GitHub connection in CodePipeline"
echo "2. Connect GitHub to Amplify Console"
echo "3. Configure environment variables in both services"
echo ""
echo "Repository: $GITHUB_REPO"
echo "ECR Repository: $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO"