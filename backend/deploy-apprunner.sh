#!/bin/bash

# SwissAI Tax - App Runner Deployment Script
# This script deploys the FastAPI backend to AWS App Runner

set -e

echo "🚀 Starting App Runner deployment for SwissAI Tax API..."

# Variables
SERVICE_NAME="swissai-tax-api"
REGION="us-east-1"
ECR_REPO="swissai-tax-backend"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_URI="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${ECR_REPO}"
IMAGE_TAG="apprunner-$(date +%Y%m%d%H%M%S)"

echo "📦 Building Docker image for App Runner..."

# Create Dockerfile for App Runner
cat > Dockerfile.apprunner <<EOF
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements-apprunner.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements-apprunner.txt

# Copy application code
COPY app.py .
COPY services/ ./services/
COPY database/ ./database/

# Expose port
EXPOSE 8000

# Run the application
CMD ["python", "app.py"]
EOF

# Build Docker image
docker build -f Dockerfile.apprunner -t ${ECR_REPO}:${IMAGE_TAG} .

echo "🔐 Logging into ECR..."
aws ecr get-login-password --region ${REGION} | docker login --username AWS --password-stdin ${ECR_URI}

# Create ECR repository if it doesn't exist
aws ecr describe-repositories --repository-names ${ECR_REPO} --region ${REGION} 2>/dev/null || \
    aws ecr create-repository --repository-name ${ECR_REPO} --region ${REGION}

echo "📤 Pushing image to ECR..."
docker tag ${ECR_REPO}:${IMAGE_TAG} ${ECR_URI}:${IMAGE_TAG}
docker tag ${ECR_REPO}:${IMAGE_TAG} ${ECR_URI}:latest
docker push ${ECR_URI}:${IMAGE_TAG}
docker push ${ECR_URI}:latest

echo "🔧 Configuring App Runner service..."

# Create App Runner configuration
cat > apprunner-config.json <<EOF
{
  "ServiceName": "${SERVICE_NAME}",
  "SourceConfiguration": {
    "ImageRepository": {
      "ImageIdentifier": "${ECR_URI}:latest",
      "ImageConfiguration": {
        "Port": "8000",
        "RuntimeEnvironmentVariables": {
          "PORT": "8000",
          "PYTHONUNBUFFERED": "1",
          "AWS_DEFAULT_REGION": "${REGION}"
        }
      },
      "ImageRepositoryType": "ECR"
    },
    "AutoDeploymentsEnabled": true,
    "AuthenticationConfiguration": {
      "AccessRoleArn": "arn:aws:iam::${ACCOUNT_ID}:role/service-role/AppRunnerECRAccessRole"
    }
  },
  "InstanceConfiguration": {
    "Cpu": "0.25 vCPU",
    "Memory": "0.5 GB"
  },
  "HealthCheckConfiguration": {
    "Protocol": "HTTP",
    "Path": "/health",
    "Interval": 10,
    "Timeout": 5,
    "HealthyThreshold": 1,
    "UnhealthyThreshold": 5
  },
  "AutoScalingConfigurationArn": "arn:aws:apprunner:${REGION}:${ACCOUNT_ID}:autoscalingconfiguration/DefaultConfiguration/1/00000000000000000000000000000001"
}
EOF

# Check if service exists
SERVICE_EXISTS=$(aws apprunner list-services --region ${REGION} --query "ServiceSummaryList[?ServiceName=='${SERVICE_NAME}'].ServiceArn" --output text)

if [ -z "$SERVICE_EXISTS" ]; then
    echo "✨ Creating new App Runner service..."

    # First create IAM role for App Runner if it doesn't exist
    aws iam create-role --role-name AppRunnerECRAccessRole \
        --assume-role-policy-document '{
          "Version": "2012-10-17",
          "Statement": [{
            "Effect": "Allow",
            "Principal": {"Service": "build.apprunner.amazonaws.com"},
            "Action": "sts:AssumeRole"
          }]
        }' 2>/dev/null || true

    # Attach policy to role
    aws iam attach-role-policy --role-name AppRunnerECRAccessRole \
        --policy-arn arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess 2>/dev/null || true

    # Create the service
    aws apprunner create-service --cli-input-json file://apprunner-config.json --region ${REGION}

    echo "⏳ Waiting for service to be running..."
    sleep 30

    # Get service URL
    SERVICE_URL=$(aws apprunner list-services --region ${REGION} \
        --query "ServiceSummaryList[?ServiceName=='${SERVICE_NAME}'].ServiceUrl" --output text)

else
    echo "🔄 Updating existing App Runner service..."

    # Get service ARN
    SERVICE_ARN=$(aws apprunner list-services --region ${REGION} \
        --query "ServiceSummaryList[?ServiceName=='${SERVICE_NAME}'].ServiceArn" --output text)

    # Update the service
    aws apprunner update-service \
        --service-arn ${SERVICE_ARN} \
        --source-configuration "{
            \"ImageRepository\": {
                \"ImageIdentifier\": \"${ECR_URI}:latest\",
                \"ImageConfiguration\": {
                    \"Port\": \"8000\",
                    \"RuntimeEnvironmentVariables\": {
                        \"PORT\": \"8000\",
                        \"PYTHONUNBUFFERED\": \"1\",
                        \"AWS_DEFAULT_REGION\": \"${REGION}\"
                    }
                },
                \"ImageRepositoryType\": \"ECR\"
            }
        }" \
        --region ${REGION}

    # Get service URL
    SERVICE_URL=$(aws apprunner describe-service --service-arn ${SERVICE_ARN} --region ${REGION} \
        --query "Service.ServiceUrl" --output text)
fi

# Clean up temporary files
rm -f Dockerfile.apprunner apprunner-config.json

echo ""
echo "✅ App Runner deployment complete!"
echo "🌐 Service URL: https://${SERVICE_URL}"
echo ""
echo "📝 Next steps:"
echo "1. Update Route 53 to point api.swissai.tax to: ${SERVICE_URL}"
echo "2. Test the API: curl https://${SERVICE_URL}/health"
echo "3. View logs: aws logs tail /aws/apprunner/${SERVICE_NAME} --follow"
echo ""
echo "💡 To update the service, just push new image to ECR:latest and App Runner will auto-deploy"