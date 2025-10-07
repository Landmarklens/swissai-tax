# Security Credentials Rotation Guide

## ⚠️ CRITICAL: Exposed Credentials Found

During code review, production database credentials and JWT secrets were found hardcoded in:
- `backend/config.py` (lines 23-25, line 19)
- `backend/db/session.py` (lines 14-16)
- `apprunner.yaml` (lines 26-35)

These credentials are exposed in Git history and must be rotated immediately.

---

## Step 1: Rotate Database Credentials in AWS RDS

### Option A: Using AWS Console
1. Go to AWS RDS Console: https://console.aws.amazon.com/rds/
2. Select database: `webscraping-database.cluster-c9y2u088elix.us-east-1.rds.amazonaws.com`
3. Click "Modify"
4. Under "Master password", click "Auto generate a password" or enter a new strong password
5. Click "Continue" → "Modify immediately" → "Modify DB cluster"
6. **Save the new password securely!**

### Option B: Using AWS CLI
```bash
# Generate a strong random password
NEW_PASSWORD=$(openssl rand -base64 32 | tr -d '/+=')

# Modify the RDS cluster master password
aws rds modify-db-cluster \
    --db-cluster-identifier webscraping-database \
    --master-user-password "$NEW_PASSWORD" \
    --apply-immediately \
    --region us-east-1

echo "New password: $NEW_PASSWORD"
# SAVE THIS PASSWORD SECURELY!
```

---

## Step 2: Store New Credentials in AWS Parameter Store

### Automated Script (Recommended)
Run the setup script:
```bash
bash /tmp/setup_parameter_store.sh
```

The script will:
1. Generate a strong JWT secret
2. Prompt you for the NEW database credentials
3. Store everything securely in Parameter Store under `/swissai/*` paths

### Manual Setup
If you prefer manual setup:

```bash
# Database credentials (use NEW values after rotation)
aws ssm put-parameter \
    --name "/swissai/db/host" \
    --value "webscraping-database.cluster-c9y2u088elix.us-east-1.rds.amazonaws.com" \
    --type "String" \
    --region us-east-1

aws ssm put-parameter \
    --name "/swissai/db/port" \
    --value "5432" \
    --type "String" \
    --region us-east-1

aws ssm put-parameter \
    --name "/swissai/db/name" \
    --value "swissai_tax" \
    --type "String" \
    --region us-east-1

aws ssm put-parameter \
    --name "/swissai/db/user" \
    --value "YOUR_NEW_USER" \
    --type "String" \
    --region us-east-1

aws ssm put-parameter \
    --name "/swissai/db/password" \
    --value "YOUR_NEW_PASSWORD" \
    --type "SecureString" \
    --region us-east-1

# JWT Secret (generate with: openssl rand -base64 32)
aws ssm put-parameter \
    --name "/swissai/api/jwt-secret" \
    --value "YOUR_GENERATED_JWT_SECRET" \
    --type "SecureString" \
    --region us-east-1
```

---

## Step 3: Verify Parameter Store Setup

```bash
# List all parameters
aws ssm get-parameters-by-path \
    --path "/swissai/" \
    --recursive \
    --region us-east-1

# Test retrieval (without decryption for SecureString)
aws ssm get-parameter \
    --name "/swissai/db/host" \
    --region us-east-1

# Test retrieval with decryption
aws ssm get-parameter \
    --name "/swissai/db/password" \
    --with-decryption \
    --region us-east-1
```

---

## Step 4: Grant App Runner Access to Parameter Store

Ensure your App Runner service role has permission to read from Parameter Store:

```bash
# Get the App Runner service role
SERVICE_ARN="arn:aws:apprunner:us-east-1:445567083171:service/swissai-tax-api/24aca2fd82984653bccef22774cf1c3b"

aws apprunner describe-service \
    --service-arn "$SERVICE_ARN" \
    --query 'Service.InstanceConfiguration.InstanceRoleArn' \
    --region us-east-1
```

Attach this policy to the instance role:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ssm:GetParameter",
                "ssm:GetParameters",
                "ssm:GetParametersByPath"
            ],
            "Resource": [
                "arn:aws:ssm:us-east-1:445567083171:parameter/swissai/*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "kms:Decrypt"
            ],
            "Resource": "*"
        }
    ]
}
```

---

## Step 5: Code Changes (Automated - See Next Section)

The following changes will be made automatically:
1. Update `config.py` to use `/swissai/` paths instead of `/homeai/`
2. Remove hardcoded default values from `config.py`
3. Remove hardcoded credentials from `db/session.py`
4. Update `apprunner.yaml` to remove exposed credentials

---

## Step 6: Deploy Changes

After code changes are committed:

```bash
# Trigger deployment
aws apprunner start-deployment \
    --service-arn "$SERVICE_ARN" \
    --region us-east-1
```

---

## Verification After Deployment

1. Check App Runner logs to ensure Parameter Store loading works:
```bash
aws logs tail /aws/apprunner/swissai-tax-api --follow
```

Look for: `"Loaded X parameters from Parameter Store"`

2. Test database connection:
```bash
curl https://api.swissai.tax/health
```

Should return: `{"status":"healthy","database":"connected"}`

3. Test authentication (JWT):
```bash
# Try to access a protected endpoint
curl https://api.swissai.tax/api/user/profile \
  -H "Authorization: Bearer invalid_token"
```

Should return 401 Unauthorized (not 500 error)

---

## Rollback Plan

If deployment fails:

1. Revert code changes
2. Use old credentials temporarily
3. Debug Parameter Store access issues
4. Re-deploy after fixes

---

## Security Checklist

- [ ] Database password rotated in RDS
- [ ] New credentials stored in Parameter Store
- [ ] Parameter Store paths use `/swissai/` prefix
- [ ] App Runner role has SSM read permissions
- [ ] Hardcoded credentials removed from code
- [ ] Changes committed and deployed
- [ ] Health check passes
- [ ] Authentication works
- [ ] No errors in logs
- [ ] Old credentials revoked/invalidated

---

## Important Notes

1. **Never commit credentials to Git** - Even if you delete them later, they remain in Git history
2. **Use SecureString for sensitive values** - Database passwords and JWT secrets should use SecureString type
3. **Rotate regularly** - Set up a schedule to rotate credentials every 90 days
4. **Monitor access** - Enable CloudTrail logging for Parameter Store access
5. **Test thoroughly** - Always test in staging before production

---

## Support

If you encounter issues:
- Check App Runner logs for detailed error messages
- Verify IAM permissions for the service role
- Ensure Parameter Store region matches your service (us-east-1)
- Contact AWS support if Parameter Store access fails
