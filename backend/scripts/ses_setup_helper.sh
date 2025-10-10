#!/bin/bash
# AWS SES Setup Helper for SwissAI Tax
# Quick reference commands for SES configuration

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

DOMAIN="swissai.tax"
SENDER_EMAIL="noreply@swissai.tax"
CONTACT_EMAIL="contact@swissai.tax"
AWS_REGION="eu-central-1"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}AWS SES Setup Helper for SwissAI Tax${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to check if AWS CLI is installed
check_aws_cli() {
    if ! command -v aws &> /dev/null; then
        echo -e "${RED}❌ AWS CLI not installed${NC}"
        echo -e "${YELLOW}Install: https://aws.amazon.com/cli/${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ AWS CLI installed${NC}"
}

# Function to check AWS credentials
check_aws_credentials() {
    if aws sts get-caller-identity &> /dev/null; then
        echo -e "${GREEN}✅ AWS credentials configured${NC}"
        ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
        echo -e "   Account: ${ACCOUNT_ID}"
    else
        echo -e "${RED}❌ AWS credentials not configured${NC}"
        echo -e "${YELLOW}Run: aws configure${NC}"
        exit 1
    fi
}

# Function to check verified identities
check_verified_identities() {
    echo ""
    echo -e "${BLUE}Checking Verified Identities in SES...${NC}"

    # Check domain
    DOMAIN_STATUS=$(aws ses get-identity-verification-attributes \
        --identities "$DOMAIN" \
        --region "$AWS_REGION" \
        --query "VerificationAttributes.\"$DOMAIN\".VerificationStatus" \
        --output text 2>/dev/null || echo "NotFound")

    if [ "$DOMAIN_STATUS" = "Success" ]; then
        echo -e "${GREEN}✅ Domain verified: $DOMAIN${NC}"
    else
        echo -e "${YELLOW}⚠️  Domain not verified: $DOMAIN (Status: $DOMAIN_STATUS)${NC}"
    fi

    # Check sender email
    SENDER_STATUS=$(aws ses get-identity-verification-attributes \
        --identities "$SENDER_EMAIL" \
        --region "$AWS_REGION" \
        --query "VerificationAttributes.\"$SENDER_EMAIL\".VerificationStatus" \
        --output text 2>/dev/null || echo "NotFound")

    if [ "$SENDER_STATUS" = "Success" ]; then
        echo -e "${GREEN}✅ Email verified: $SENDER_EMAIL${NC}"
    else
        echo -e "${YELLOW}⚠️  Email not verified: $SENDER_EMAIL (Status: $SENDER_STATUS)${NC}"
    fi

    # Check contact email
    CONTACT_STATUS=$(aws ses get-identity-verification-attributes \
        --identities "$CONTACT_EMAIL" \
        --region "$AWS_REGION" \
        --query "VerificationAttributes.\"$CONTACT_EMAIL\".VerificationStatus" \
        --output text 2>/dev/null || echo "NotFound")

    if [ "$CONTACT_STATUS" = "Success" ]; then
        echo -e "${GREEN}✅ Email verified: $CONTACT_EMAIL${NC}"
    else
        echo -e "${YELLOW}⚠️  Email not verified: $CONTACT_EMAIL (Status: $CONTACT_STATUS)${NC}"
    fi
}

# Function to check sandbox status
check_sandbox_status() {
    echo ""
    echo -e "${BLUE}Checking SES Account Status...${NC}"

    SENDING_ENABLED=$(aws ses get-account-sending-enabled \
        --region "$AWS_REGION" \
        --query "Enabled" \
        --output text)

    if [ "$SENDING_ENABLED" = "True" ]; then
        echo -e "${GREEN}✅ Sending enabled${NC}"
    else
        echo -e "${RED}❌ Sending disabled${NC}"
    fi

    # Note: There's no direct API to check sandbox status
    # Users need to check in AWS Console
    echo -e "${YELLOW}ℹ️  Check sandbox status in AWS Console:${NC}"
    echo -e "   https://console.aws.amazon.com/ses/home?region=$AWS_REGION#/account"
}

# Function to send test email
send_test_email() {
    echo ""
    echo -e "${BLUE}Sending Test Email...${NC}"

    aws ses send-email \
        --region "$AWS_REGION" \
        --from "$SENDER_EMAIL" \
        --destination "ToAddresses=$CONTACT_EMAIL" \
        --message "Subject={Data='Test Email from SES Setup Helper',Charset=utf8},Body={Text={Data='This is a test email to verify SES configuration for SwissAI Tax.',Charset=utf8}}" \
        && echo -e "${GREEN}✅ Test email sent successfully!${NC}" \
        && echo -e "   Check inbox: $CONTACT_EMAIL" \
        || echo -e "${RED}❌ Failed to send test email${NC}"
}

# Function to verify email address
verify_email() {
    EMAIL=$1
    echo ""
    echo -e "${BLUE}Verifying email: $EMAIL${NC}"

    aws ses verify-email-identity \
        --region "$AWS_REGION" \
        --email-address "$EMAIL" \
        && echo -e "${GREEN}✅ Verification email sent to: $EMAIL${NC}" \
        && echo -e "   Check inbox and click verification link" \
        || echo -e "${RED}❌ Failed to send verification email${NC}"
}

# Function to verify domain
verify_domain() {
    echo ""
    echo -e "${BLUE}Verifying domain: $DOMAIN${NC}"

    RESPONSE=$(aws ses verify-domain-identity \
        --region "$AWS_REGION" \
        --domain "$DOMAIN" \
        --output json)

    if [ $? -eq 0 ]; then
        TOKEN=$(echo "$RESPONSE" | grep -o '"VerificationToken": "[^"]*"' | cut -d'"' -f4)
        echo -e "${GREEN}✅ Domain verification initiated${NC}"
        echo -e "${YELLOW}Add this TXT record to your DNS:${NC}"
        echo -e "   Name: _amazonses.$DOMAIN"
        echo -e "   Type: TXT"
        echo -e "   Value: \"$TOKEN\""
    else
        echo -e "${RED}❌ Failed to initiate domain verification${NC}"
    fi
}

# Function to check DNS records
check_dns() {
    echo ""
    echo -e "${BLUE}Checking DNS Records...${NC}"

    # Check TXT record
    echo -e "\n${YELLOW}Checking _amazonses TXT record:${NC}"
    dig "_amazonses.$DOMAIN" TXT +short || echo -e "${RED}Not found${NC}"

    # Check DKIM records (you'll need to get actual values from SES)
    echo -e "\n${YELLOW}To check DKIM records, run:${NC}"
    echo -e "   dig <token>._domainkey.$DOMAIN CNAME +short"
}

# Main menu
show_menu() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}What would you like to do?${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    echo "1) Check SES configuration"
    echo "2) Verify email address (noreply@swissai.tax)"
    echo "3) Verify email address (contact@swissai.tax)"
    echo "4) Verify domain (swissai.tax)"
    echo "5) Send test email"
    echo "6) Check DNS records"
    echo "7) Run Python test script"
    echo "8) Open AWS SES Console"
    echo "9) View setup guide"
    echo "0) Exit"
    echo ""
    read -p "Enter choice [0-9]: " choice

    case $choice in
        1) check_verified_identities; check_sandbox_status ;;
        2) verify_email "$SENDER_EMAIL" ;;
        3) verify_email "$CONTACT_EMAIL" ;;
        4) verify_domain ;;
        5) send_test_email ;;
        6) check_dns ;;
        7) python3 "$(dirname "$0")/test_ses_email.py" ;;
        8) open "https://console.aws.amazon.com/ses/home?region=$AWS_REGION" ;;
        9) cat "$(dirname "$0")/../docs/AWS_SES_SETUP_GUIDE.md" | less ;;
        0) echo "Goodbye!"; exit 0 ;;
        *) echo -e "${RED}Invalid choice${NC}" ;;
    esac

    show_menu
}

# Main execution
check_aws_cli
check_aws_credentials
show_menu
