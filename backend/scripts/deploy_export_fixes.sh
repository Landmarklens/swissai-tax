#!/bin/bash
set -e

echo "============================================================"
echo "Deploying Data Export Fixes"
echo "============================================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo ""
echo -e "${YELLOW}Step 1: Running tests${NC}"
cd /home/cn/Desktop/HomeAiCode/swissai-tax/backend

# Run quick validation
echo "Testing Python syntax..."
python -m py_compile models/swisstax/data_export.py
python -m py_compile routers/user_data.py
python -m py_compile services/background_jobs.py
python -m py_compile services/data_export_service.py
python -m py_compile utils/s3_encryption.py
echo -e "${GREEN}✓ Python syntax valid${NC}"

echo ""
echo -e "${YELLOW}Step 2: Committing changes${NC}"
cd /home/cn/Desktop/HomeAiCode/swissai-tax

git add backend/models/swisstax/data_export.py
git add backend/routers/user_data.py
git add backend/services/background_jobs.py
git add backend/utils/s3_encryption.py
git add backend/scripts/test_s3_access.py
git add backend/scripts/cleanup_stuck_exports.py
git add backend/scripts/update_iam_policy.json

git commit -m "$(cat <<'EOF'
Fix data export system - resolve 500 errors and S3 upload failures

Root causes fixed:
1. Timezone comparison errors in DataExport model properties
2. Missing error handling in export list endpoint
3. Enhanced IAM permissions (KMS, SES)
4. S3 storage service now uses correct bucket from config
5. Background job to process exports every 5 minutes
6. Cleanup script for stuck exports

Changes:
- backend/models/swisstax/data_export.py: Add timezone-aware datetime handling with fallbacks
- backend/routers/user_data.py: Add comprehensive error handling, remove synchronous export generation
- backend/services/background_jobs.py: Add process_pending_exports job (every 5 minutes)
- backend/utils/s3_encryption.py: Use settings.AWS_S3_BUCKET_NAME instead of env var
- backend/scripts/test_s3_access.py: S3 access diagnostic tool
- backend/scripts/cleanup_stuck_exports.py: Cleanup tool for stuck exports
- backend/scripts/update_iam_policy.json: Enhanced IAM policy with KMS and SES

Impact:
- Fixes 500 errors on /api/user/export/list endpoint
- Fixes CORS errors (symptom of 500 errors)
- Enables S3 uploads to succeed in production
- Processes exports asynchronously via background jobs
- Prevents exports from getting stuck in 'processing' status

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"

echo -e "${GREEN}✓ Changes committed${NC}"

echo ""
echo -e "${YELLOW}Step 3: Pushing to repository${NC}"
git push

echo -e "${GREEN}✓ Pushed to repository${NC}"

echo ""
echo -e "${YELLOW}Step 4: Deploying to App Runner${NC}"

# App Runner will auto-deploy on git push, but we can trigger it manually too
SERVICE_ARN="arn:aws:apprunner:us-east-1:445567083171:service/swissai-tax-api/24aca2fd82984653bccef22774cf1c3b"

echo "Triggering App Runner deployment..."
aws apprunner start-deployment --service-arn "$SERVICE_ARN"

echo ""
echo -e "${GREEN}✓ Deployment triggered${NC}"
echo ""
echo "Waiting for deployment to complete (this may take 5-10 minutes)..."

# Wait for deployment
max_attempts=60
attempt=0

while [ $attempt -lt $max_attempts ]; do
    status=$(aws apprunner describe-service --service-arn "$SERVICE_ARN" --query "Service.Status" --output text)

    if [ "$status" = "RUNNING" ]; then
        echo -e "${GREEN}✓ Deployment complete - Service is RUNNING${NC}"
        break
    fi

    echo "Status: $status (attempt $((attempt+1))/$max_attempts)"
    sleep 10
    attempt=$((attempt+1))
done

if [ $attempt -ge $max_attempts ]; then
    echo -e "${RED}✗ Deployment timed out${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 5: Running cleanup script for stuck exports${NC}"

# SSH tunnel should already be open
echo "Cleaning up stuck exports..."
python /home/cn/Desktop/HomeAiCode/swissai-tax/backend/scripts/cleanup_stuck_exports.py --execute

echo ""
echo "============================================================"
echo -e "${GREEN}✓ Deployment Complete!${NC}"
echo "============================================================"
echo ""
echo "Next steps:"
echo "1. Monitor CloudWatch logs for any errors"
echo "2. Test the export functionality in the UI"
echo "3. Verify background jobs are running"
echo ""
echo "Useful commands:"
echo "  - View logs: aws logs tail /aws/apprunner/swissai-tax-api/.../application --follow"
echo "  - Check exports: python scripts/cleanup_stuck_exports.py"
echo "  - Test S3: python scripts/test_s3_access.py"
echo ""
