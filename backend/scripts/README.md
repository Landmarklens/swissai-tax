# Backend Scripts

This directory contains utility scripts for database seeding and maintenance.

## Status Page Incidents

### seed_incidents.sql

SQL script to populate the incidents table with realistic historical data for the status page.

**Usage:**

```bash
# Connect to production database
psql $DATABASE_URL -f scripts/seed_incidents.sql
```

The script:
- ✅ Only inserts if incidents table is empty (idempotent)
- ✅ Creates 7 realistic historical incidents spanning 45 days
- ✅ Includes various severity levels and affected services
- ✅ Shows verification queries after insertion

**Incidents Added:**
- Database Connection Pool Exhaustion (45 days ago, high severity)
- Scheduled Maintenance - Database Upgrade (30 days ago, medium severity)
- Intermittent S3 Upload Failures (22 days ago, medium severity)
- Email Delivery Delays (15 days ago, low severity)
- SSL Certificate Renewal (8 days ago, low severity)
- API Response Time Degradation (5 days ago, medium severity)
- Google OAuth Login Issues (2 days ago, medium severity)

### seed_status_incidents.py

Python script alternative (requires local database access).

**Usage:**

```bash
python scripts/seed_status_incidents.py
```

**Note:** This script requires database credentials and may timeout if trying to connect to Parameter Store locally. Use the SQL script instead for production.

## Why Seed Data?

The status page shows incident history to build trust with users. Without historical data, the page appears hardcoded and less credible. These realistic incidents:

- Show transparency about past issues
- Demonstrate quick response times
- Prove the system is actively monitored
- Make the status page feel authentic
