#!/bin/bash

# Setup custom domain for SwissTax API
# Run this AFTER you have registered swisstax.ai domain

set -e

DOMAIN="swisstax.ai"
SUBDOMAIN="api"
FULL_DOMAIN="${SUBDOMAIN}.${DOMAIN}"
REGION="us-east-1"
API_ID="64syu6573b"

echo "🌐 Setting up custom domain: $FULL_DOMAIN"

# Step 1: Create Hosted Zone (if not exists)
echo "Creating Route53 hosted zone..."
HOSTED_ZONE_ID=$(aws route53 create-hosted-zone \
    --name $DOMAIN \
    --caller-reference "$(date +%s)" \
    --query 'HostedZone.Id' \
    --output text 2>/dev/null | cut -d'/' -f3) || \
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones \
    --query "HostedZones[?Name=='${DOMAIN}.'].Id" \
    --output text | cut -d'/' -f3)

echo "Hosted Zone ID: $HOSTED_ZONE_ID"

# Step 2: Request SSL Certificate
echo "Requesting SSL certificate..."
CERT_ARN=$(aws acm request-certificate \
    --domain-name $FULL_DOMAIN \
    --validation-method DNS \
    --region $REGION \
    --query 'CertificateArn' \
    --output text 2>/dev/null) || \
CERT_ARN=$(aws acm list-certificates \
    --region $REGION \
    --query "CertificateSummaryList[?DomainName=='${FULL_DOMAIN}'].CertificateArn" \
    --output text)

echo "Certificate ARN: $CERT_ARN"

# Step 3: Get certificate validation DNS records
echo "Getting validation records..."
VALIDATION_RECORD=$(aws acm describe-certificate \
    --certificate-arn $CERT_ARN \
    --region $REGION \
    --query 'Certificate.DomainValidationOptions[0].ResourceRecord' \
    --output json)

if [ "$VALIDATION_RECORD" != "null" ]; then
    VALIDATION_NAME=$(echo $VALIDATION_RECORD | jq -r '.Name')
    VALIDATION_VALUE=$(echo $VALIDATION_RECORD | jq -r '.Value')

    echo "Creating DNS validation record..."
    aws route53 change-resource-record-sets \
        --hosted-zone-id $HOSTED_ZONE_ID \
        --change-batch "{
            \"Changes\": [{
                \"Action\": \"CREATE\",
                \"ResourceRecordSet\": {
                    \"Name\": \"$VALIDATION_NAME\",
                    \"Type\": \"CNAME\",
                    \"TTL\": 300,
                    \"ResourceRecords\": [{\"Value\": \"$VALIDATION_VALUE\"}]
                }
            }]
        }" 2>/dev/null || echo "Validation record may already exist"
fi

# Wait for certificate validation
echo "Waiting for certificate validation (this may take a few minutes)..."
aws acm wait certificate-validated \
    --certificate-arn $CERT_ARN \
    --region $REGION || echo "Certificate may already be validated"

# Step 4: Create API Gateway custom domain
echo "Creating API Gateway custom domain..."
aws apigateway create-domain-name \
    --domain-name $FULL_DOMAIN \
    --certificate-arn $CERT_ARN \
    --region $REGION 2>/dev/null || echo "Custom domain may already exist"

# Get the CloudFront distribution domain
CF_DOMAIN=$(aws apigateway get-domain-name \
    --domain-name $FULL_DOMAIN \
    --region $REGION \
    --query 'distributionDomainName' \
    --output text)

echo "CloudFront domain: $CF_DOMAIN"

# Step 5: Create base path mapping
echo "Creating base path mapping..."
aws apigateway create-base-path-mapping \
    --domain-name $FULL_DOMAIN \
    --rest-api-id $API_ID \
    --stage prod \
    --region $REGION 2>/dev/null || echo "Base path mapping may already exist"

# Step 6: Create Route53 A record
echo "Creating Route53 A record..."
aws route53 change-resource-record-sets \
    --hosted-zone-id $HOSTED_ZONE_ID \
    --change-batch "{
        \"Changes\": [{
            \"Action\": \"UPSERT\",
            \"ResourceRecordSet\": {
                \"Name\": \"$FULL_DOMAIN\",
                \"Type\": \"A\",
                \"AliasTarget\": {
                    \"HostedZoneId\": \"Z2FDTNDATAQYW2\",
                    \"DNSName\": \"$CF_DOMAIN\",
                    \"EvaluateTargetHealth\": false
                }
            }
        }]
    }"

echo ""
echo "========================================="
echo "✅ Custom domain setup complete!"
echo "========================================="
echo "API is now available at: https://$FULL_DOMAIN"
echo ""
echo "Name servers for your domain (update at your registrar):"
aws route53 get-hosted-zone --id $HOSTED_ZONE_ID --query 'DelegationSet.NameServers' --output text
echo ""
echo "Update your frontend .env:"
echo "REACT_APP_API_URL=https://$FULL_DOMAIN"