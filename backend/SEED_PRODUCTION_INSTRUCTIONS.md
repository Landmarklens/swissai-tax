# Seed Production Database with Status Page Incidents

## Quick Start

To populate your production status page with realistic incident history, run:

```bash
# Get your production database connection details from AWS Parameter Store
export DB_HOST=$(aws ssm get-parameter --name /swissai-tax/db/host --with-decryption --region us-east-1 --query 'Parameter.Value' --output text)
export DB_NAME=$(aws ssm get-parameter --name /swissai-tax/db/database --with-decryption --region us-east-1 --query 'Parameter.Value' --output text)
export DB_USER=$(aws ssm get-parameter --name /swissai-tax/db/username --with-decryption --region us-east-1 --query 'Parameter.Value' --output text)
export DB_PASSWORD=$(aws ssm get-parameter --name /swissai-tax/db/password --with-decryption --region us-east-1 --query 'Parameter.Value' --output text)
export DB_PORT=$(aws ssm get-parameter --name /swissai-tax/db/port --with-decryption --region us-east-1 --query 'Parameter.Value' --output text 2>/dev/null || echo "5432")

# Build connection string
export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

# Run the seed script
cd backend
psql "$DATABASE_URL" -f scripts/seed_incidents.sql
```

## Alternative: Use the Helper Script

```bash
cd backend
export DATABASE_URL="postgresql://user:password@your-rds-host:5432/swissai_tax"
./scripts/run_seed_production.sh
```

## What Gets Added

The script adds 7 realistic historical incidents:

| Incident | Days Ago | Severity | Duration |
|----------|----------|----------|----------|
| Database Connection Pool Exhaustion | 45 | High | 2 hours |
| Scheduled Maintenance - Database Upgrade | 30 | Medium | 1h 15m |
| Intermittent S3 Upload Failures | 22 | Medium | 3h 45m |
| Email Delivery Delays | 15 | Low | 4 hours |
| SSL Certificate Renewal | 8 | Low | 25 minutes |
| API Response Time Degradation | 5-4 | Medium | 1 day |
| Google OAuth Login Issues | 2 | Medium | 6 hours |

## Verification

After running the seed, verify the data:

```sql
-- Check incident count
SELECT COUNT(*) FROM incidents;

-- View all incidents
SELECT
    title,
    severity,
    status,
    EXTRACT(DAY FROM (NOW() - created_at)) as days_ago
FROM incidents
ORDER BY created_at DESC;
```

## Safety

- ✅ **Idempotent**: Only inserts if incidents table is empty
- ✅ **Safe to run multiple times**: Won't create duplicates
- ✅ **No data loss**: Doesn't delete or modify existing data

## Need to Re-seed?

If you want to re-seed with fresh data:

```sql
-- Clear existing incidents
TRUNCATE TABLE incidents CASCADE;

-- Then run the seed script again
\i scripts/seed_incidents.sql
```
