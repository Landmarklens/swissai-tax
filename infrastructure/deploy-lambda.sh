#!/bin/bash

# SwissTax Lambda Deployment Script

set -e

echo "🚀 Deploying SwissTax Lambda Function..."

# Configuration
FUNCTION_NAME="swisstax-api"
RUNTIME="python3.11"
HANDLER="lambda_handler.lambda_handler"
REGION="us-east-1"
ROLE_NAME="swisstax-lambda-role"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Step 1: Create IAM role for Lambda
echo -e "${YELLOW}Creating IAM role for Lambda...${NC}"

# Create trust policy
cat > /tmp/lambda-trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create role
aws iam create-role \
    --role-name $ROLE_NAME \
    --assume-role-policy-document file:///tmp/lambda-trust-policy.json \
    2>/dev/null || echo "Role already exists"

# Attach policies
aws iam attach-role-policy \
    --role-name $ROLE_NAME \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole \
    2>/dev/null || true

aws iam attach-role-policy \
    --role-name $ROLE_NAME \
    --policy-arn arn:aws:iam::aws:policy/AWSLambdaVPCAccessExecutionRole \
    2>/dev/null || true

# Get role ARN
ROLE_ARN=$(aws iam get-role --role-name $ROLE_NAME --query 'Role.Arn' --output text)
echo -e "${GREEN}✓ IAM role ready: $ROLE_ARN${NC}"

# Step 2: Create deployment package
echo -e "${YELLOW}Creating deployment package...${NC}"
cd backend
zip -r ../lambda-deployment.zip lambda_handler.py
cd ..
echo -e "${GREEN}✓ Deployment package created${NC}"

# Step 3: Create or update Lambda function
echo -e "${YELLOW}Deploying Lambda function...${NC}"

# Check if function exists
if aws lambda get-function --function-name $FUNCTION_NAME 2>/dev/null; then
    # Update existing function
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --zip-file fileb://lambda-deployment.zip \
        --region $REGION
    echo -e "${GREEN}✓ Lambda function updated${NC}"
else
    # Wait for role to be available
    echo "Waiting for IAM role to propagate..."
    sleep 10

    # Create new function
    aws lambda create-function \
        --function-name $FUNCTION_NAME \
        --runtime $RUNTIME \
        --role $ROLE_ARN \
        --handler $HANDLER \
        --zip-file fileb://lambda-deployment.zip \
        --timeout 30 \
        --memory-size 512 \
        --environment Variables={CORS_ORIGIN='*'} \
        --region $REGION
    echo -e "${GREEN}✓ Lambda function created${NC}"
fi

# Step 4: Create API Gateway
echo -e "${YELLOW}Setting up API Gateway...${NC}"

# Create REST API
API_NAME="swisstax-api"
API_ID=$(aws apigateway create-rest-api \
    --name $API_NAME \
    --description "SwissTax.ai API" \
    --region $REGION \
    --query 'id' \
    --output text 2>/dev/null || \
    aws apigateway get-rest-apis \
    --query "items[?name=='$API_NAME'].id" \
    --output text \
    --region $REGION)

echo "API Gateway ID: $API_ID"

# Get root resource ID
ROOT_ID=$(aws apigateway get-resources \
    --rest-api-id $API_ID \
    --query 'items[?path==`/`].id' \
    --output text \
    --region $REGION)

# Create proxy resource
RESOURCE_ID=$(aws apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $ROOT_ID \
    --path-part '{proxy+}' \
    --region $REGION \
    --query 'id' \
    --output text 2>/dev/null || \
    aws apigateway get-resources \
    --rest-api-id $API_ID \
    --query 'items[?pathPart==`{proxy+}`].id' \
    --output text \
    --region $REGION)

# Create ANY method on proxy resource
aws apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $RESOURCE_ID \
    --http-method ANY \
    --authorization-type NONE \
    --region $REGION 2>/dev/null || true

# Create Lambda integration
LAMBDA_ARN="arn:aws:lambda:$REGION:445567083171:function:$FUNCTION_NAME"

aws apigateway put-integration \
    --rest-api-id $API_ID \
    --resource-id $RESOURCE_ID \
    --http-method ANY \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations" \
    --region $REGION 2>/dev/null || true

# Add Lambda permission for API Gateway
aws lambda add-permission \
    --function-name $FUNCTION_NAME \
    --statement-id apigateway-invoke \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:$REGION:445567083171:$API_ID/*/*" \
    --region $REGION 2>/dev/null || true

# Deploy API
aws apigateway create-deployment \
    --rest-api-id $API_ID \
    --stage-name prod \
    --region $REGION

echo -e "${GREEN}✓ API Gateway configured${NC}"

# Output the API endpoint
API_ENDPOINT="https://$API_ID.execute-api.$REGION.amazonaws.com/prod"
echo ""
echo "========================================="
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo "========================================="
echo "API Endpoint: $API_ENDPOINT"
echo "Test with: curl $API_ENDPOINT/health"
echo ""
echo "To use in frontend, update .env:"
echo "REACT_APP_API_URL=$API_ENDPOINT"