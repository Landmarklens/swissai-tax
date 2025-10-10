# SwissAI Tax - Swiss Data Migration Plan (Option 2)

## Migration Overview

**Objective:** Migrate database and S3 storage to Switzerland (eu-central-2) while keeping App Runner in us-east-1

**Timeline:** 2-3 days (with testing)

**Estimated Downtime:** 1-2 hours for final cutover

**Cost Impact:** +$7-15/month

---

## Pre-Migration Checklist

### 1. Backup Current Data ✅

```bash
# Database snapshot
aws rds create-db-cluster-snapshot \
  --db-cluster-identifier webscraping-database \
  --db-cluster-snapshot-identifier swissai-pre-swiss-migration-$(date +%Y%m%d) \
  --region us-east-1

# S3 backup (optional - S3 has versioning)
aws s3 sync s3://swissai-tax-documents-1758721021/ \
  s3://swissai-tax-documents-backup-$(date +%Y%m%d)/ \
  --region us-east-1
```

### 2. Document Current Configuration ✅

```bash
# Export current database credentials (save to secure location)
aws ssm get-parameters-by-path \
  --path "/swissai-tax/db" \
  --recursive \
  --with-decryption \
  --region us-east-1 > swissai-db-params-backup.json

# Export S3 bucket policy
aws s3api get-bucket-policy \
  --bucket swissai-tax-documents-1758721021 \
  --region us-east-1 > s3-bucket-policy-backup.json

# Export S3 CORS configuration
aws s3api get-bucket-cors \
  --bucket swissai-tax-documents-1758721021 \
  --region us-east-1 > s3-cors-backup.json
```

### 3. Set Up Cost Monitoring ✅

```bash
# Create billing alarm
aws cloudwatch put-metric-alarm \
  --alarm-name swiss-migration-cost-alert \
  --alarm-description "Alert if migration costs exceed $100" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 21600 \
  --evaluation-periods 1 \
  --threshold 100 \
  --comparison-operator GreaterThanThreshold \
  --region us-east-1
```

---

## Phase 1: Database Migration (Day 1-2)

### Step 1.1: Create VPC Infrastructure in eu-central-2

```bash
# Create VPC (or use default VPC)
VPC_ID=$(aws ec2 create-vpc \
  --cidr-block 10.0.0.0/16 \
  --region eu-central-2 \
  --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=swissai-tax-vpc}]' \
  --query 'Vpc.VpcId' \
  --output text)

echo "Created VPC: $VPC_ID"

# Create subnets in different AZs (required for RDS)
SUBNET_1=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.1.0/24 \
  --availability-zone eu-central-2a \
  --region eu-central-2 \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=swissai-db-subnet-1}]' \
  --query 'Subnet.SubnetId' \
  --output text)

SUBNET_2=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.2.0/24 \
  --availability-zone eu-central-2b \
  --region eu-central-2 \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=swissai-db-subnet-2}]' \
  --query 'Subnet.SubnetId' \
  --output text)

echo "Created Subnets: $SUBNET_1, $SUBNET_2"

# Create DB subnet group
aws rds create-db-subnet-group \
  --db-subnet-group-name swissai-tax-db-subnet-group \
  --db-subnet-group-description "SwissAI Tax DB Subnet Group" \
  --subnet-ids $SUBNET_1 $SUBNET_2 \
  --region eu-central-2 \
  --tags Key=Name,Value=swissai-tax-db-subnet-group
```

### Step 1.2: Create Security Group

```bash
# Create security group for RDS
SG_ID=$(aws ec2 create-security-group \
  --group-name swissai-tax-rds-sg \
  --description "Security group for SwissAI Tax RDS in Switzerland" \
  --vpc-id $VPC_ID \
  --region eu-central-2 \
  --query 'GroupId' \
  --output text)

echo "Created Security Group: $SG_ID"

# Allow PostgreSQL from anywhere (App Runner in us-east-1)
# Note: App Runner uses dynamic IPs, so we need to allow 0.0.0.0/0
# In production, consider using VPC peering or PrivateLink
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 5432 \
  --cidr 0.0.0.0/0 \
  --region eu-central-2

# For better security: Get App Runner IP ranges and whitelist
# https://ip-ranges.amazonaws.com/ip-ranges.json (filter by service=APPRUNNER)
```

### Step 1.3: Create Aurora PostgreSQL Cluster in eu-central-2

```bash
# Create Aurora cluster (same version as current: 16.6)
aws rds create-db-cluster \
  --db-cluster-identifier swissai-tax-db-swiss \
  --engine aurora-postgresql \
  --engine-version 16.6 \
  --master-username webscrapinguser \
  --master-user-password "$(aws ssm get-parameter --name /swissai-tax/db/password --with-decryption --query 'Parameter.Value' --output text --region us-east-1)" \
  --database-name swissai_tax \
  --db-subnet-group-name swissai-tax-db-subnet-group \
  --vpc-security-group-ids $SG_ID \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "mon:04:00-mon:05:00" \
  --enable-cloudwatch-logs-exports '["postgresql"]' \
  --storage-encrypted \
  --region eu-central-2 \
  --tags Key=Name,Value=swissai-tax-db-swiss Key=Environment,Value=production

# Wait for cluster to be available
aws rds wait db-cluster-available \
  --db-cluster-identifier swissai-tax-db-swiss \
  --region eu-central-2

echo "Aurora cluster created!"

# Create instance in the cluster
aws rds create-db-instance \
  --db-instance-identifier swissai-tax-db-swiss-instance-1 \
  --db-instance-class db.t3.medium \
  --engine aurora-postgresql \
  --db-cluster-identifier swissai-tax-db-swiss \
  --publicly-accessible \
  --region eu-central-2 \
  --tags Key=Name,Value=swissai-tax-db-swiss-instance

# Wait for instance to be available
aws rds wait db-instance-available \
  --db-instance-identifier swissai-tax-db-swiss-instance-1 \
  --region eu-central-2

echo "Database instance created!"

# Get the new endpoint
NEW_DB_ENDPOINT=$(aws rds describe-db-clusters \
  --db-cluster-identifier swissai-tax-db-swiss \
  --region eu-central-2 \
  --query 'DBClusters[0].Endpoint' \
  --output text)

echo "New DB Endpoint: $NEW_DB_ENDPOINT"
```

### Step 1.4: Migrate Database Data

**Method 1: pg_dump/pg_restore (Recommended for small DBs)**

```bash
# From your local machine (with SSH tunnel to old DB)

# Start SSH tunnel to old database
ssh -N -L 15433:webscraping-database.cluster-c9y2u088elix.us-east-1.rds.amazonaws.com:5432 \
    ubuntu@3.221.26.92 -i ~/Desktop/HomeAiCode/id_rsa &

SSH_PID=$!

# Wait for tunnel
sleep 5

# Dump the database
PGPASSWORD=IXq3IC0Uw6StMkBhb4mb pg_dump \
  -h localhost \
  -p 15433 \
  -U webscrapinguser \
  -d swissai_tax \
  --schema=swisstax \
  --no-owner \
  --no-acl \
  -F c \
  -f swissai_tax_backup.dump

echo "Database dumped!"

# Restore to new Swiss database (publicly accessible)
PGPASSWORD=IXq3IC0Uw6StMkBhb4mb pg_restore \
  -h $NEW_DB_ENDPOINT \
  -U webscrapinguser \
  -d swissai_tax \
  --schema=swisstax \
  --no-owner \
  --no-acl \
  swissai_tax_backup.dump

echo "Database restored to Swiss cluster!"

# Kill SSH tunnel
kill $SSH_PID
```

**Method 2: AWS Database Migration Service (For larger DBs or minimal downtime)**

```bash
# Create replication instance
aws dms create-replication-instance \
  --replication-instance-identifier swissai-tax-migration \
  --replication-instance-class dms.t3.medium \
  --allocated-storage 50 \
  --vpc-security-group-ids $SG_ID \
  --region eu-central-2

# Create source endpoint (us-east-1 DB)
aws dms create-endpoint \
  --endpoint-identifier swissai-source-us \
  --endpoint-type source \
  --engine-name aurora-postgresql \
  --server-name webscraping-database.cluster-c9y2u088elix.us-east-1.rds.amazonaws.com \
  --port 5432 \
  --username webscrapinguser \
  --password "$(aws ssm get-parameter --name /swissai-tax/db/password --with-decryption --query 'Parameter.Value' --output text --region us-east-1)" \
  --database-name swissai_tax \
  --region eu-central-2

# Create target endpoint (eu-central-2 DB)
aws dms create-endpoint \
  --endpoint-identifier swissai-target-swiss \
  --endpoint-type target \
  --engine-name aurora-postgresql \
  --server-name $NEW_DB_ENDPOINT \
  --port 5432 \
  --username webscrapinguser \
  --password "$(aws ssm get-parameter --name /swissai-tax/db/password --with-decryption --query 'Parameter.Value' --output text --region us-east-1)" \
  --database-name swissai_tax \
  --region eu-central-2

# Create and start replication task
# (This requires more detailed configuration - see AWS DMS documentation)
```

### Step 1.5: Verify Database Migration

```bash
# Connect to new database and verify
PGPASSWORD=IXq3IC0Uw6StMkBhb4mb psql \
  -h $NEW_DB_ENDPOINT \
  -U webscrapinguser \
  -d swissai_tax \
  -c "SELECT COUNT(*) FROM swisstax.users;"

PGPASSWORD=IXq3IC0Uw6StMkBhb4mb psql \
  -h $NEW_DB_ENDPOINT \
  -U webscrapinguser \
  -d swissai_tax \
  -c "SELECT COUNT(*) FROM swisstax.tax_filings;"

# Compare with old database counts
```

---

## Phase 2: S3 Migration (Day 2)

### Step 2.1: Create New S3 Bucket in eu-central-2

```bash
# Create bucket
aws s3api create-bucket \
  --bucket swissai-tax-documents-swiss \
  --region eu-central-2 \
  --create-bucket-configuration LocationConstraint=eu-central-2

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket swissai-tax-documents-swiss \
  --versioning-configuration Status=Enabled \
  --region eu-central-2

# Enable encryption (SSE-S3 or SSE-KMS)
aws s3api put-bucket-encryption \
  --bucket swissai-tax-documents-swiss \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      },
      "BucketKeyEnabled": true
    }]
  }' \
  --region eu-central-2

# Block public access
aws s3api put-public-access-block \
  --bucket swissai-tax-documents-swiss \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true" \
  --region eu-central-2

# Enable lifecycle policy (optional)
aws s3api put-bucket-lifecycle-configuration \
  --bucket swissai-tax-documents-swiss \
  --lifecycle-configuration file://s3-lifecycle.json \
  --region eu-central-2
```

### Step 2.2: Copy CORS and Bucket Policies

```bash
# Copy CORS configuration
aws s3api put-bucket-cors \
  --bucket swissai-tax-documents-swiss \
  --cors-configuration file://s3-cors-backup.json \
  --region eu-central-2

# Copy bucket policy (update bucket name in the file first)
sed 's/swissai-tax-documents-1758721021/swissai-tax-documents-swiss/g' \
  s3-bucket-policy-backup.json > s3-bucket-policy-new.json

aws s3api put-bucket-policy \
  --bucket swissai-tax-documents-swiss \
  --policy file://s3-bucket-policy-new.json \
  --region eu-central-2
```

### Step 2.3: Migrate S3 Data

```bash
# Sync all objects from old bucket to new bucket
aws s3 sync \
  s3://swissai-tax-documents-1758721021/ \
  s3://swissai-tax-documents-swiss/ \
  --source-region us-east-1 \
  --region eu-central-2 \
  --storage-class STANDARD

# Verify object count
echo "Old bucket:"
aws s3 ls s3://swissai-tax-documents-1758721021/ --recursive --summarize | grep "Total Objects"

echo "New bucket:"
aws s3 ls s3://swissai-tax-documents-swiss/ --recursive --summarize | grep "Total Objects"
```

---

## Phase 3: Update Configuration (Day 2-3)

### Step 3.1: Update AWS Parameter Store

```bash
# Update database host
aws ssm put-parameter \
  --name "/swissai-tax/db/host" \
  --value "$NEW_DB_ENDPOINT" \
  --type "String" \
  --overwrite \
  --region us-east-1

# Update S3 bucket name
aws ssm put-parameter \
  --name "/swissai-tax/s3/documents-bucket" \
  --value "swissai-tax-documents-swiss" \
  --type "String" \
  --overwrite \
  --region us-east-1

# Verify updates
aws ssm get-parameter \
  --name "/swissai-tax/db/host" \
  --region us-east-1 \
  --query 'Parameter.Value' \
  --output text

aws ssm get-parameter \
  --name "/swissai-tax/s3/documents-bucket" \
  --region us-east-1 \
  --query 'Parameter.Value' \
  --output text
```

### Step 3.2: Update Code Configuration

**Update region references (if needed):**

```bash
# backend/utils/s3_encryption.py:38
# Change default region for S3
sed -i '' "s/region_name or os.environ.get('AWS_REGION', 'us-east-1')/region_name or os.environ.get('AWS_REGION', 'eu-central-2')/" \
  backend/utils/s3_encryption.py

# Or better: Add S3_REGION parameter to Parameter Store
aws ssm put-parameter \
  --name "/swissai-tax/s3/region" \
  --value "eu-central-2" \
  --type "String" \
  --region us-east-1
```

**Update backend/config.py to read S3 region from Parameter Store:**

```python
# Add to param_mappings in backend/config.py:118
'/swissai-tax/s3/region': 'AWS_S3_REGION',
```

### Step 3.3: Deploy Updated Configuration

```bash
# Trigger App Runner deployment
# Option A: Push a commit to GitHub (auto-deploys)
git add .
git commit -m "Update configuration for Swiss database and S3"
git push origin main

# Option B: Manual redeploy via AWS Console
# App Runner → swissai-tax-api → Deploy → Redeploy

# Option C: CLI redeploy
SERVICE_ARN=$(aws apprunner list-services \
  --region us-east-1 \
  --query "ServiceSummaryList[?ServiceName=='swissai-tax-api'].ServiceArn" \
  --output text)

aws apprunner start-deployment \
  --service-arn $SERVICE_ARN \
  --region us-east-1
```

---

## Phase 4: Testing & Validation (Day 3)

### Step 4.1: Test Database Connectivity

```bash
# Check App Runner can connect to Swiss database
# Monitor CloudWatch Logs for connection errors

# Test health endpoint
curl https://api.swissai.tax/health

# Expected response:
# {
#   "status": "healthy",
#   "database": "connected",
#   "timestamp": "..."
# }
```

### Step 4.2: Test S3 Document Upload/Download

```bash
# Test document upload via API
curl -X POST https://api.swissai.tax/api/documents/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test-document.pdf"

# Verify document is in Swiss bucket
aws s3 ls s3://swissai-tax-documents-swiss/ --recursive --region eu-central-2 | tail -5
```

### Step 4.3: Test Full Application Flow

```
1. Login to application
2. Create a new tax filing
3. Upload a document
4. Verify document appears
5. Download document
6. Check all data saves correctly
7. Test Google OAuth login
```

### Step 4.4: Performance Testing

```bash
# Test database query latency
time curl https://api.swissai.tax/api/interview/questions?language=en

# Compare with pre-migration baseline
# Expect ~100-150ms additional latency due to cross-region
```

### Step 4.5: Monitor Costs

```bash
# Check AWS Cost Explorer
# Monitor first 24-48 hours of costs

# View data transfer metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name NetworkThroughput \
  --dimensions Name=DBClusterIdentifier,Value=swissai-tax-db-swiss \
  --start-time $(date -u -d '1 day ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Average \
  --region eu-central-2
```

---

## Phase 5: Cleanup & Optimization (Day 4+)

### Step 5.1: Monitor for 1 Week

- ✅ Monitor CloudWatch logs for errors
- ✅ Monitor database performance
- ✅ Monitor S3 access patterns
- ✅ Monitor costs daily
- ✅ Monitor application performance

### Step 5.2: Optimize Cross-Region Costs

**Enable connection pooling (already have this!):**
- File: `backend/database/connection_pool.py`

**Add response compression:**

```python
# Add to backend/main.py
from fastapi.middleware.gzip import GZipMiddleware

app.add_middleware(GZipMiddleware, minimum_size=1000)
```

**Add database query caching (optional):**

```python
# Install Redis if not already
# Use for frequent read queries
```

### Step 5.3: Cleanup Old Resources (After 2 weeks of successful operation)

```bash
# Delete old S3 bucket (after verifying all data migrated)
aws s3 rb s3://swissai-tax-documents-1758721021 --force --region us-east-1

# Delete old RDS cluster snapshot (keep snapshot for 30 days)
# Don't delete the running cluster yet - keep as backup for 30 days

# Update documentation
# Update DEPLOYMENT.md with new endpoints
```

---

## Rollback Plan

**If migration fails:**

### Database Rollback

```bash
# Revert Parameter Store
aws ssm put-parameter \
  --name "/swissai-tax/db/host" \
  --value "webscraping-database.cluster-c9y2u088elix.us-east-1.rds.amazonaws.com" \
  --type "String" \
  --overwrite \
  --region us-east-1

# Redeploy App Runner
aws apprunner start-deployment --service-arn $SERVICE_ARN --region us-east-1
```

### S3 Rollback

```bash
# Revert S3 bucket
aws ssm put-parameter \
  --name "/swissai-tax/s3/documents-bucket" \
  --value "swissai-tax-documents-1758721021" \
  --type "String" \
  --overwrite \
  --region us-east-1

# Redeploy App Runner
aws apprunner start-deployment --service-arn $SERVICE_ARN --region us-east-1
```

---

## Success Criteria

- ✅ Database fully operational in eu-central-2
- ✅ All data migrated successfully
- ✅ S3 bucket operational in eu-central-2
- ✅ All documents accessible
- ✅ App Runner connecting successfully
- ✅ No errors in CloudWatch logs
- ✅ Application performance acceptable (< 200ms additional latency)
- ✅ Costs within expected range ($7-15/month increase)
- ✅ All features working (login, upload, download, tax filing)

---

## Post-Migration Marketing

**Update website copy:**

> "Your sensitive tax data and documents are securely stored in Swiss data centers (Zurich, Switzerland), ensuring compliance with Swiss data protection standards."

**Update Privacy Policy:**

> "SwissAI Tax stores all user data and documents in AWS data centers located in Zurich, Switzerland (eu-central-2 region)."

**Update FAQ:**

> **Q: Where is my data stored?**
>
> A: All your tax filings and uploaded documents are stored in secure, encrypted AWS data centers in Zurich, Switzerland. We use Aurora PostgreSQL for database storage and S3 for document storage, both located in the eu-central-2 (Zurich) AWS region.

---

## Timeline Summary

| Day | Tasks | Duration |
|-----|-------|----------|
| **Day 1** | Backups, VPC setup, RDS creation | 4-6 hours |
| **Day 2** | Database migration, S3 setup, data sync | 6-8 hours |
| **Day 3** | Parameter updates, testing, validation | 4-6 hours |
| **Day 4+** | Monitoring, optimization | Ongoing |

**Total effort:** 14-20 hours over 3-4 days

---

## Contacts & Support

**AWS Support:** (if issues arise)
- Create support ticket via AWS Console
- Priority: Business or Enterprise support recommended

**Database Issues:**
- Check CloudWatch Logs: `/aws/rds/cluster/swissai-tax-db-swiss/postgresql`
- Check RDS Events in Console

**S3 Issues:**
- Check S3 Access Logs
- Verify IAM permissions for App Runner

---

## Cost Estimate

| Item | One-Time | Monthly Recurring |
|------|----------|-------------------|
| Database migration (DMS) | $2-5 | - |
| S3 data transfer | $2 | - |
| Aurora RDS (premium) | - | +$6-7 |
| Cross-region data transfer | - | $0.30-30 |
| S3 storage | - | $0 (same) |
| **TOTAL** | **$4-7** | **+$7-37** |

**Most likely monthly cost:** +$7-15/month (light to moderate usage)

---

## Notes

- Keep old database running for 30 days as backup
- Monitor costs closely in first month
- Consider moving to Fargate if cross-region costs exceed $30/month
- Document any issues encountered during migration
- Update DEPLOYMENT.md after successful migration

---

**Last Updated:** 2025-10-10
**Migration Owner:** [Your Name]
**Status:** DRAFT - Ready for execution
