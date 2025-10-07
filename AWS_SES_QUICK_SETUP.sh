#!/bin/bash

###############################################################################
# AWS SES Quick Setup Script for SwissAI Tax Password Reset
#
# This script automates the AWS SES setup for password reset emails.
# Run with appropriate AWS credentials configured.
###############################################################################

set -e  # Exit on error

# Configuration
REGION="us-east-1"
SENDER_EMAIL="noreply@swissai.tax"
DOMAIN="swissai.tax"
PARAMETER_NAME="/swissai-tax/email/sender"

echo "=========================================="
echo "SwissAI Tax - AWS SES Setup"
echo "=========================================="
echo ""

# Check AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ Error: AWS CLI is not installed."
    echo "   Install: https://aws.amazon.com/cli/"
    exit 1
fi

echo "✓ AWS CLI found"

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ Error: AWS credentials not configured."
    echo "   Run: aws configure"
    exit 1
fi

echo "✓ AWS credentials configured"
echo ""

# Display menu
echo "Choose setup option:"
echo "1) Verify individual email address (for testing/sandbox)"
echo "2) Verify domain (recommended for production)"
echo "3) Add Parameter Store entry"
echo "4) Check SES verification status"
echo "5) Request production access"
echo "6) Test email sending"
echo "7) Full setup (all steps)"
echo ""
read -p "Enter choice [1-7]: " choice

case $choice in
    1)
        echo ""
        echo "=========================================="
        echo "Verifying Email Address: $SENDER_EMAIL"
        echo "=========================================="
        aws ses verify-email-identity \
            --email-address "$SENDER_EMAIL" \
            --region "$REGION"
        echo ""
        echo "✓ Verification email sent to $SENDER_EMAIL"
        echo "  Check your inbox and click the verification link."
        ;;

    2)
        echo ""
        echo "=========================================="
        echo "Verifying Domain: $DOMAIN"
        echo "=========================================="

        # Verify domain
        VERIFICATION_TOKEN=$(aws ses verify-domain-identity \
            --domain "$DOMAIN" \
            --region "$REGION" \
            --query 'VerificationToken' \
            --output text)

        echo ""
        echo "✓ Domain verification initiated"
        echo ""
        echo "Add this TXT record to your DNS:"
        echo "  Name:  _amazonses.$DOMAIN"
        echo "  Value: $VERIFICATION_TOKEN"
        echo "  Type:  TXT"
        echo ""
        echo "After adding the DNS record, verification can take up to 72 hours."
        ;;

    3)
        echo ""
        echo "=========================================="
        echo "Adding Parameter Store Entry"
        echo "=========================================="

        aws ssm put-parameter \
            --name "$PARAMETER_NAME" \
            --value "$SENDER_EMAIL" \
            --type "String" \
            --description "Verified SES sender email for SwissAI Tax password reset" \
            --region "$REGION" \
            --overwrite

        echo ""
        echo "✓ Parameter stored: $PARAMETER_NAME = $SENDER_EMAIL"

        # Verify it was stored
        STORED_VALUE=$(aws ssm get-parameter \
            --name "$PARAMETER_NAME" \
            --region "$REGION" \
            --query 'Parameter.Value' \
            --output text)

        echo "✓ Verified parameter value: $STORED_VALUE"
        ;;

    4)
        echo ""
        echo "=========================================="
        echo "Checking SES Verification Status"
        echo "=========================================="

        # Check email verification
        echo ""
        echo "Email Verification Status:"
        aws ses get-identity-verification-attributes \
            --identities "$SENDER_EMAIL" \
            --region "$REGION" \
            --query "VerificationAttributes.\"$SENDER_EMAIL\".VerificationStatus" \
            --output text || echo "Not verified"

        # Check domain verification
        echo ""
        echo "Domain Verification Status:"
        aws ses get-identity-verification-attributes \
            --identities "$DOMAIN" \
            --region "$REGION" \
            --query "VerificationAttributes.\"$DOMAIN\".VerificationStatus" \
            --output text || echo "Not verified"

        # Check sandbox status
        echo ""
        echo "SES Account Status:"
        aws ses get-account-sending-enabled \
            --region "$REGION" \
            --query 'Enabled' \
            --output text
        ;;

    5)
        echo ""
        echo "=========================================="
        echo "Request Production Access"
        echo "=========================================="
        echo ""
        echo "To move out of SES sandbox, visit:"
        echo "https://console.aws.amazon.com/ses/home?region=$REGION#/account"
        echo ""
        echo "Then click: 'Request production access'"
        echo ""
        echo "Fill in the form:"
        echo "  Mail Type: Transactional"
        echo "  Website URL: https://swissai.tax"
        echo "  Use Case: Password reset emails for tax filing application"
        echo ""
        echo "Approval typically takes 24-48 hours."
        ;;

    6)
        echo ""
        echo "=========================================="
        echo "Test Email Sending"
        echo "=========================================="

        read -p "Enter recipient email for test: " TEST_EMAIL

        if [ -z "$TEST_EMAIL" ]; then
            echo "❌ Error: Email address required"
            exit 1
        fi

        echo ""
        echo "Sending test email to: $TEST_EMAIL"

        MESSAGE_ID=$(aws ses send-email \
            --from "$SENDER_EMAIL" \
            --destination "ToAddresses=$TEST_EMAIL" \
            --message "Subject={Data='SwissAI Tax - SES Test Email',Charset=UTF-8},Body={Text={Data='This is a test email from SwissAI Tax password reset system. If you receive this, SES is configured correctly!',Charset=UTF-8}}" \
            --region "$REGION" \
            --query 'MessageId' \
            --output text)

        echo ""
        echo "✓ Test email sent successfully!"
        echo "  Message ID: $MESSAGE_ID"
        echo "  Check $TEST_EMAIL inbox (including spam folder)"
        ;;

    7)
        echo ""
        echo "=========================================="
        echo "Full Setup - All Steps"
        echo "=========================================="

        # Step 1: Verify email
        echo ""
        echo "Step 1/3: Verifying email address..."
        aws ses verify-email-identity \
            --email-address "$SENDER_EMAIL" \
            --region "$REGION"
        echo "✓ Verification email sent to $SENDER_EMAIL"
        echo "  Check your inbox and click the verification link before continuing."
        read -p "Press Enter after verifying email..."

        # Step 2: Add to Parameter Store
        echo ""
        echo "Step 2/3: Adding to Parameter Store..."
        aws ssm put-parameter \
            --name "$PARAMETER_NAME" \
            --value "$SENDER_EMAIL" \
            --type "String" \
            --description "Verified SES sender email for SwissAI Tax" \
            --region "$REGION" \
            --overwrite
        echo "✓ Parameter stored successfully"

        # Step 3: Test email
        echo ""
        echo "Step 3/3: Testing email sending..."
        read -p "Enter test recipient email: " TEST_EMAIL

        if [ -n "$TEST_EMAIL" ]; then
            MESSAGE_ID=$(aws ses send-email \
                --from "$SENDER_EMAIL" \
                --destination "ToAddresses=$TEST_EMAIL" \
                --message "Subject={Data='SwissAI Tax - Setup Complete',Charset=UTF-8},Body={Text={Data='SES is configured correctly for SwissAI Tax password reset!',Charset=UTF-8}}" \
                --region "$REGION" \
                --query 'MessageId' \
                --output text)
            echo "✓ Test email sent (ID: $MESSAGE_ID)"
        fi

        echo ""
        echo "=========================================="
        echo "✓ Full Setup Complete!"
        echo "=========================================="
        echo ""
        echo "Next steps:"
        echo "1. Check $TEST_EMAIL for test email"
        echo "2. Request production access (option 5) to send to unverified emails"
        echo "3. Configure IAM permissions for your App Runner/EC2 role"
        echo ""
        echo "See SES_PASSWORD_RESET_SETUP.md for detailed IAM configuration."
        ;;

    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "Done!"
