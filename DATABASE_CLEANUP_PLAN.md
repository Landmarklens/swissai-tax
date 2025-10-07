# Database Schema Cleanup Plan

## Current Problem

The application has a **mixed schema design** causing failures:
- Some models use `public` schema (via `db.base.Base`)
- Some models use `swisstax` schema (via `models.swisstax.base.Base`)
- Cross-schema foreign keys failing: `tax_filing_sessions` (public) → `swisstax.users`
- Migration error: `relation "users" does not exist` when trying to create FK to users

## Decision: Use ONLY swisstax Schema

All SwissAI Tax models should be in the `swisstax` schema. No public schema models.

---

## Step 1: Identify All Public Schema Models

### Models Currently Using Public Schema (db.base.Base):
1. ✅ `backend/models/user.py` - **ALREADY DELETED** (legacy)
2. `backend/models/user_counter.py` - User counter widget
3. `backend/models/tax_filing_session.py` - Tax filing sessions
4. `backend/models/tax_answer.py` - Tax answers
5. `backend/models/tax_calculation.py` - Tax calculations
6. `backend/models/tax_insight.py` - Tax insights
7. `backend/models/interview_session.py` - Interview sessions
8. `backend/models/document.py` - Documents
9. `backend/models/reset_token.py` - Password reset tokens (already has schema='swisstax')

### Models Already Using swisstax Schema:
- `backend/models/swisstax/user.py` ✅
- `backend/models/swisstax/filing.py` ✅
- `backend/models/swisstax/subscription.py` ✅
- `backend/models/swisstax/settings.py` ✅
- `backend/models/swisstax/interview.py` ✅
- `backend/models/swisstax/document.py` ✅
- `backend/models/swisstax/tax.py` ✅

---

## Step 2: Move Public Schema Models to swisstax

### Option A: Move Existing Public Models to swisstax (Recommended)

For each public schema model:

1. **Change the import** from `db.base.Base` to `models.swisstax.base.Base`
2. **Update foreign keys** to use schema-qualified names:
   - `ForeignKey('users.id')` → `ForeignKey('swisstax.users.id')`
3. **Create new migration** to move tables from public to swisstax schema

### Models to Update:

#### 1. `backend/models/user_counter.py`
```python
# Change FROM:
from db.base import Base

class UserCounter(Base):
    __tablename__ = "user_counter"
    # No schema specified = public

# Change TO:
from models.swisstax.base import Base

class UserCounter(Base):
    __tablename__ = "user_counter"
    # Inherits schema='swisstax' from Base
```

#### 2. `backend/models/tax_filing_session.py`
```python
# Change FROM:
from db.base import Base
user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), ...)

# Change TO:
from models.swisstax.base import Base
user_id = Column(UUID(as_uuid=True), ForeignKey('swisstax.users.id'), ...)
```

#### 3. `backend/models/tax_answer.py`
```python
# Change FROM:
from db.base import Base
filing_session_id = Column(String(36), ForeignKey('tax_filing_sessions.id'), ...)

# Change TO:
from models.swisstax.base import Base
filing_session_id = Column(String(36), ForeignKey('swisstax.tax_filing_sessions.id'), ...)
```

#### 4. `backend/models/tax_calculation.py`
```python
# Change FROM:
from db.base import Base
session_id = Column(UUID, ForeignKey('interview_sessions.id'), ...)

# Change TO:
from models.swisstax.base import Base
session_id = Column(UUID, ForeignKey('swisstax.interview_sessions.id'), ...)
```

#### 5. `backend/models/tax_insight.py`
```python
# Change FROM:
from db.base import Base
filing_session_id = Column(String(36), ForeignKey('tax_filing_sessions.id'), ...)

# Change TO:
from models.swisstax.base import Base
filing_session_id = Column(String(36), ForeignKey('swisstax.tax_filing_sessions.id'), ...)
```

#### 6. `backend/models/interview_session.py`
```python
# Change FROM:
from db.base import Base

# Change TO:
from models.swisstax.base import Base
```

#### 7. `backend/models/document.py`
```python
# Change FROM:
from db.base import Base
session_id = Column(UUID, ForeignKey('interview_sessions.id'), ...)

# Change TO:
from models.swisstax.base import Base
session_id = Column(UUID, ForeignKey('swisstax.interview_sessions.id'), ...)
```

---

## Step 3: Create Migration to Move Tables

### Create new Alembic migration:

```bash
cd backend
alembic revision -m "move_all_tables_to_swisstax_schema"
```

### Migration Code:

```python
"""move_all_tables_to_swisstax_schema

Revision ID: move_to_swisstax
Revises: 20251006_160955_multi_filing_support
Create Date: 2025-10-07
"""
from alembic import op

revision = 'move_to_swisstax'
down_revision = '20251006_160955_multi_filing_support'

def upgrade():
    # Move tables from public to swisstax schema
    tables_to_move = [
        'user_counter',
        'tax_filing_sessions',
        'tax_answers',
        'tax_calculations',
        'tax_insights',
        'interview_sessions',
        'documents',
    ]

    for table in tables_to_move:
        # Only move if table exists in public schema
        op.execute(f"""
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM information_schema.tables
                    WHERE table_schema = 'public'
                    AND table_name = '{table}'
                ) THEN
                    ALTER TABLE public.{table} SET SCHEMA swisstax;
                END IF;
            END $$;
        """)

def downgrade():
    # Move tables back to public schema
    tables_to_move = [
        'user_counter',
        'tax_filing_sessions',
        'tax_answers',
        'tax_calculations',
        'tax_insights',
        'interview_sessions',
        'documents',
    ]

    for table in tables_to_move:
        op.execute(f"ALTER TABLE swisstax.{table} SET SCHEMA public;")
```

---

## Step 4: Update Migrations for Already-Created Tables

Some tables were already created by earlier migrations in public schema. We need to handle them:

### Migrations to Check/Update:

1. **`add_encryption_tax_filing_models.py`** - Creates `tax_filing_sessions`, `tax_answers`
   - Add `schema='swisstax'` to all `op.create_table()` calls
   - Update FK references: `'users.id'` → `'swisstax.users.id'`

2. **`20251006_154734_add_encrypted_tax_models.py`** - Creates encrypted models
   - Add `schema='swisstax'` to all tables
   - Update all FK references

3. **`20251006_160955_multi_filing_support.py`** - Modifies `tax_filing_sessions`
   - Change to reference `swisstax.tax_filing_sessions`

4. **`cb4ced9eea89_add_user_counter_table.py`** - Creates `user_counter`
   - Add `schema='swisstax'` to `op.create_table()`

---

## Step 5: Clean Up Legacy Code

### Delete Unused Public Schema Models:
- ✅ `backend/models/user.py` - ALREADY DELETED

### Remove/Update create_database.py:

The `backend/create_database.py` script creates tables in public schema. Either:
- **Option A**: Delete it (migrations handle everything)
- **Option B**: Update it to create tables in swisstax schema

**Recommendation**: Delete it. Alembic migrations should handle all table creation.

---

## Step 6: Verify No Duplicates

After moving, ensure we don't have duplicate models:

### Check for Duplicates:
- `backend/models/interview_session.py` vs `backend/models/swisstax/interview.py` (InterviewSession)
- `backend/models/document.py` vs `backend/models/swisstax/document.py` (Document)

### Resolution:
- Keep the `swisstax` versions if they're more complete
- Delete the public schema versions
- Update all imports in routers/services

---

## Step 7: Update All Imports

### Search and Replace in All Files:

```bash
# Find all imports of public schema models
grep -r "from models.tax_filing_session import" backend/
grep -r "from models.tax_answer import" backend/
grep -r "from models.user_counter import" backend/
grep -r "from models.interview_session import" backend/
grep -r "from models.document import" backend/
```

Update imports to use swisstax versions or the moved models.

---

## Step 8: Drop and Recreate Database

Once all code changes are done:

1. **Drop database** (we already did this)
2. **Push code changes**
3. **Let migrations run** - will create everything in swisstax schema
4. **Verify** all tables are in swisstax schema:
   ```sql
   SELECT schemaname, tablename
   FROM pg_tables
   WHERE schemaname IN ('public', 'swisstax')
   ORDER BY schemaname, tablename;
   ```

---

## Step 9: Verify Application Works

### Test Checklist:
- [ ] Health check returns healthy
- [ ] User registration works (swisstax.users)
- [ ] User login works
- [ ] User counter endpoint works (swisstax.user_counter)
- [ ] Tax filing session creation works (swisstax.tax_filing_sessions)
- [ ] Document upload works (swisstax.documents)
- [ ] Tax calculation works (swisstax.tax_calculations)

---

## Implementation Order

1. ✅ Drop database (DONE)
2. ✅ Update Parameter Store to use `swissai_tax` (DONE)
3. **Update all public schema models to use swisstax.base.Base**
4. **Update all ForeignKey references to include schema**
5. **Create migration to move tables to swisstax**
6. **Update/fix existing migrations to use swisstax schema**
7. **Delete create_database.py** (or update it)
8. **Verify no duplicate models**
9. **Update all imports in routers/services**
10. **Commit and push**
11. **Let App Runner deploy and run migrations**
12. **Test all endpoints**

---

## Files to Modify

### Models to Update (Change to swisstax):
- [ ] `backend/models/user_counter.py`
- [ ] `backend/models/tax_filing_session.py`
- [ ] `backend/models/tax_answer.py`
- [ ] `backend/models/tax_calculation.py`
- [ ] `backend/models/tax_insight.py`
- [ ] `backend/models/interview_session.py`
- [ ] `backend/models/document.py`

### Migrations to Update:
- [ ] `backend/alembic/versions/add_encryption_tax_filing_models.py`
- [ ] `backend/alembic/versions/20251006_154734_add_encrypted_tax_models.py`
- [ ] `backend/alembic/versions/20251006_160955_multi_filing_support.py`
- [ ] `backend/alembic/versions/cb4ced9eea89_add_user_counter_table.py`

### New Migration to Create:
- [ ] `backend/alembic/versions/move_to_swisstax_schema.py` (if needed)

### Files to Delete:
- [x] `backend/models/user.py` (DONE)
- [ ] `backend/create_database.py` (optional)

### Services/Routers to Check:
- All files that import the models above need to be checked

---

## Expected Outcome

After completion:
- ✅ Single schema: `swisstax`
- ✅ No public schema tables
- ✅ No cross-schema foreign keys
- ✅ Clean migration chain
- ✅ All endpoints working
- ✅ User counter displays correctly

---

## Rollback Plan

If something goes wrong:
1. Revert all code changes
2. Drop database again
3. Restore from backup (if needed)
4. Run old migrations

---

## Notes

- The `reset_token` model already has `__table_args__ = {'schema': 'swisstax'}` ✅
- Some swisstax models already exist and are being used correctly
- Main issue: legacy public schema models mixed with new swisstax models
- This cleanup should have been done from the start but fixing now
