# Migration Setup Complete ✅

## Summary

Database migrations have been configured with **idempotent logic** to prevent duplicate runs. Migrations can now be safely run multiple times without errors.

## What Was Done

### 1. Made Migrations Idempotent

**Updated Files:**
- `/backend/alembic/versions/add_auth_fields_to_users.py`
- `/backend/alembic/versions/add_new_swisstax_tables.py`

**Changes:**
- Added `column_exists()` function to check before adding columns
- Added `table_exists()` function to check before creating tables
- Updated revision chain: `add_auth_fields` now revises `6f18eae11a19` (latest migration)

**Result:** Migrations will skip operations if they've already been applied.

### 2. Created Migration Runner

**File:** `/backend/run_migrations.py`

**Features:**
- Shows current database revision before running
- Runs all pending migrations
- Shows final revision after completion
- Provides clear success/failure messages
- Handles errors gracefully

### 3. Created Documentation

**File:** `/backend/MIGRATIONS_README.md`

**Contents:**
- Complete migration guide
- Idempotent design explanation
- CI/CD integration instructions
- Troubleshooting guide
- Safety checklist

---

## How to Run Migrations

### When You Have Database Access

```bash
cd /home/cn/Desktop/HomeAiCode/swissai-tax/backend

# Option 1: Use the migration runner (recommended)
python run_migrations.py

# Option 2: Use Alembic directly
alembic upgrade head
```

### What Will Happen

1. **First Run:** Migrations will create new columns and tables
2. **Subsequent Runs:** Migrations will detect existing objects and skip creation
3. **Alembic Tracking:** Version table prevents re-running completed migrations

### Expected Output

```
============================================================
SwissAI Tax - Database Migration Runner
============================================================

✓ Current database revision: 6f18eae11a19

Running migrations...
------------------------------------------------------------
INFO  [alembic.runtime.migration] Running upgrade 6f18eae11a19 -> add_auth_fields
  ✓ Added 'password' column
  ✓ Added 'provider' column
  ✓ Added 'provider_id' column
  ✓ Added 'avatar_url' column
  ✓ Added 'is_grandfathered' column
  ✓ Added 'is_test_user' column
✓ Authentication fields migration completed

INFO  [alembic.runtime.migration] Running upgrade add_auth_fields -> add_new_tables
  ✓ Created 'filings' table
  ✓ Created 'subscriptions' table
  ✓ Created 'payments' table
  ✓ Created 'user_settings' table
✓ New SwissAI Tax tables migration completed
------------------------------------------------------------

✅ Migrations completed successfully!
✓ Database is now at revision: add_new_tables
============================================================
```

---

## CI/CD Integration

### In Your CI Pipeline

Add this step to your GitHub Actions or deployment script:

```yaml
# .github/workflows/deploy.yml
- name: Run Database Migrations
  run: |
    cd backend
    python run_migrations.py
```

### Why It's Safe

1. **Idempotent Checks**: Migrations check if changes already exist
2. **Alembic Version Table**: Tracks which migrations have run
3. **Automatic Skip**: Already-run migrations are automatically skipped

### Example: Multiple Pushes

**Push 1:**
```bash
python run_migrations.py
# Creates columns and tables
# ✅ Success
```

**Push 2 (same migrations):**
```bash
python run_migrations.py
# Detects current revision is already add_new_tables
# Skips all migrations
# ✅ Success (no changes needed)
```

**Push 3 (new migration added):**
```bash
python run_migrations.py
# Skips add_auth_fields and add_new_tables (already run)
# Runs only the new migration
# ✅ Success
```

---

## New Database Tables Created

When migrations run, these tables will be created in the `swisstax` schema:

### 1. Updated: `swisstax.users`
**New Columns Added:**
- `password` - Hashed password for local auth
- `provider` - OAuth provider (local, google)
- `provider_id` - OAuth provider user ID
- `avatar_url` - User avatar URL
- `is_grandfathered` - Bypass subscription requirement
- `is_test_user` - Test account flag

### 2. New: `swisstax.filings`
**Purpose:** Track tax filing submissions

**Key Columns:**
- `id` (UUID)
- `user_id` (FK to users)
- `session_id` (FK to interview_sessions)
- `tax_year`
- `status` (draft, review, submitted, accepted, rejected)
- `confirmation_number`
- `refund_amount`
- `pdf_url`

### 3. New: `swisstax.subscriptions`
**Purpose:** Manage user subscriptions

**Key Columns:**
- `id` (UUID)
- `user_id` (FK to users)
- `plan_type` (basic, standard, premium)
- `status` (active, canceled, expired)
- `stripe_subscription_id`
- `stripe_customer_id`
- `price_chf`

### 4. New: `swisstax.payments`
**Purpose:** Track payment transactions

**Key Columns:**
- `id` (UUID)
- `user_id` (FK to users)
- `filing_id` (FK to filings)
- `amount_chf`
- `status` (pending, succeeded, failed)
- `stripe_payment_intent_id`
- `payment_method`

### 5. New: `swisstax.user_settings`
**Purpose:** Store user preferences

**Key Columns:**
- `id` (UUID)
- `user_id` (FK to users, unique)
- `language` (de, en, fr, it)
- `theme` (light, dark, auto)
- `email_deadline_reminders`
- `auto_save_enabled`
- `retention_years`

---

## Migration Files

### Location
`/backend/alembic/versions/`

### New Migrations

**1. `add_auth_fields_to_users.py`**
- Revision: `add_auth_fields`
- Revises: `6f18eae11a19`
- Adds: Authentication fields to users table

**2. `add_new_swisstax_tables.py`**
- Revision: `add_new_tables`
- Revises: `add_auth_fields`
- Adds: Filings, subscriptions, payments, user_settings tables

---

## Verification Steps

After running migrations, verify:

```sql
-- Check new columns in users table
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'swisstax' AND table_name = 'users'
AND column_name IN ('password', 'provider', 'provider_id', 'avatar_url', 'is_grandfathered', 'is_test_user');

-- Check new tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'swisstax'
AND table_name IN ('filings', 'subscriptions', 'payments', 'user_settings');

-- Check current migration version
SELECT * FROM alembic_version;
```

---

## Rollback (if needed)

To rollback migrations:

```bash
# Rollback last migration
alembic downgrade -1

# Rollback to specific revision
alembic downgrade 6f18eae11a19

# Rollback all new migrations
alembic downgrade 6f18eae11a19
```

---

## Troubleshooting

### Issue: "column already exists"
**Solution:** Migration is working correctly - it detected existing column and skipped creation

### Issue: "table already exists"
**Solution:** Migration is working correctly - it detected existing table and skipped creation

### Issue: Connection timeout
**Solution:** Check database credentials in AWS Parameter Store

### Issue: "alembic_version table not found"
**Solution:** No migrations have run yet - this is normal for first run

---

## Next Steps

1. **Connect to Database:** Ensure you have database access (via SSH tunnel or direct connection)
2. **Run Migrations:** Execute `python run_migrations.py`
3. **Verify Tables:** Check that new tables exist in `swisstax` schema
4. **Test Backend:** Start backend server and test new endpoints
5. **Deploy:** Push to production and migrations will run automatically in CI/CD

---

## Files Created/Modified

**Created:**
- `/backend/run_migrations.py` - Migration runner script
- `/backend/MIGRATIONS_README.md` - Comprehensive migration guide
- `/backend/MIGRATION_SETUP_COMPLETE.md` - This file

**Modified:**
- `/backend/alembic/versions/add_auth_fields_to_users.py` - Added idempotent checks
- `/backend/alembic/versions/add_new_swisstax_tables.py` - Added idempotent checks

---

**Status:** ✅ Ready to run migrations when database is accessible

**Last Updated:** 2025-10-05
