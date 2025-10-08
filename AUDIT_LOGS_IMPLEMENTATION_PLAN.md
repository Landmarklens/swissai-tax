# Audit Logs Implementation Plan

**Timeline:** 1-2 weeks
**Impact:** High - Users can track account activity, improves trust and security
**Priority:** Medium (Phase 2 trust-building feature)

---

## 📋 Overview

Implement comprehensive audit logging to track user account activities, security events, and critical actions. Users will be able to view their activity history through a dedicated UI.

---

## 🎯 Goals

1. **Track Security Events**: Login attempts, password changes, 2FA events
2. **Track Data Actions**: Tax filing submissions, document uploads/downloads, data exports
3. **User Visibility**: Provide users access to their audit logs
4. **Compliance**: Support GDPR right to access personal data
5. **Security**: Detect suspicious activity patterns

---

## 📊 Phase 1: Backend Implementation (Week 1)

### 1.1 Database Schema Design

**Create `audit_logs` table:**

```sql
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    event_category VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_info JSONB,
    metadata JSONB,
    status VARCHAR(20) DEFAULT 'success',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_created (user_id, created_at DESC),
    INDEX idx_event_type (event_type),
    INDEX idx_created_at (created_at)
);

-- Auto-delete logs older than 90 days
CREATE INDEX idx_cleanup ON audit_logs(created_at) WHERE created_at < NOW() - INTERVAL '90 days';
```

**Event Categories:**
- `authentication` - Login, logout, 2FA events
- `security` - Password changes, 2FA setup/disable, session management
- `data_access` - File downloads, data exports, profile views
- `data_modification` - Tax filing submissions, profile updates, document uploads
- `account` - Account creation, deletion, settings changes

**Event Types:**
- `login_success`, `login_failed`, `logout`
- `password_changed`, `password_reset_requested`, `password_reset_completed`
- `2fa_enabled`, `2fa_disabled`, `2fa_verified`, `2fa_failed`
- `tax_filing_submitted`, `tax_filing_updated`, `tax_filing_deleted`
- `document_uploaded`, `document_downloaded`, `document_deleted`
- `data_exported`, `profile_updated`, `account_deleted`
- `session_created`, `session_revoked`

### 1.2 Create Alembic Migration

**File:** `backend/alembic/versions/YYYYMMDD_add_audit_logs.py`

```python
"""Add audit logs table

Revision ID: <generated>
Revises: <previous>
Create Date: <date>
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

def upgrade():
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('event_type', sa.String(50), nullable=False),
        sa.Column('event_category', sa.String(50), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('device_info', JSONB, nullable=True),
        sa.Column('metadata', JSONB, nullable=True),
        sa.Column('status', sa.String(20), nullable=False, server_default='success'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE')
    )

    op.create_index('idx_user_created', 'audit_logs', ['user_id', 'created_at'])
    op.create_index('idx_event_type', 'audit_logs', ['event_type'])
    op.create_index('idx_created_at', 'audit_logs', ['created_at'])

def downgrade():
    op.drop_index('idx_created_at', table_name='audit_logs')
    op.drop_index('idx_event_type', table_name='audit_logs')
    op.drop_index('idx_user_created', table_name='audit_logs')
    op.drop_table('audit_logs')
```

### 1.3 Create SQLAlchemy Model

**File:** `backend/models/audit_log.py`

```python
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
from db.base import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    event_type = Column(String(50), nullable=False, index=True)
    event_category = Column(String(50), nullable=False)
    description = Column(Text, nullable=False)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    device_info = Column(JSONB, nullable=True)
    metadata = Column(JSONB, nullable=True)
    status = Column(String(20), nullable=False, default="success")
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)

    # Relationship
    user = relationship("User", back_populates="audit_logs")

    __table_args__ = (
        Index('idx_user_created', 'user_id', 'created_at'),
    )
```

**Update User model:**
```python
# Add to backend/models/user.py
audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")
```

### 1.4 Create Audit Log Service

**File:** `backend/services/audit_log_service.py`

```python
from sqlalchemy.orm import Session
from models.audit_log import AuditLog
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
import logging
from user_agents import parse

logger = logging.getLogger(__name__)

class AuditLogService:

    @staticmethod
    def log_event(
        db: Session,
        user_id: int,
        event_type: str,
        event_category: str,
        description: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        status: str = "success"
    ) -> AuditLog:
        """
        Create an audit log entry
        """
        try:
            # Parse device info from user agent
            device_info = None
            if user_agent:
                ua = parse(user_agent)
                device_info = {
                    "browser": ua.browser.family,
                    "browser_version": ua.browser.version_string,
                    "os": ua.os.family,
                    "os_version": ua.os.version_string,
                    "device": ua.device.family,
                    "is_mobile": ua.is_mobile,
                    "is_tablet": ua.is_tablet,
                    "is_pc": ua.is_pc
                }

            audit_log = AuditLog(
                user_id=user_id,
                event_type=event_type,
                event_category=event_category,
                description=description,
                ip_address=ip_address,
                user_agent=user_agent,
                device_info=device_info,
                metadata=metadata,
                status=status
            )

            db.add(audit_log)
            db.commit()
            db.refresh(audit_log)

            logger.info(f"Audit log created: user_id={user_id}, event={event_type}")
            return audit_log

        except Exception as e:
            logger.error(f"Failed to create audit log: {e}")
            db.rollback()
            # Don't fail the main operation if audit logging fails
            return None

    @staticmethod
    def get_user_logs(
        db: Session,
        user_id: int,
        limit: int = 50,
        offset: int = 0,
        event_category: Optional[str] = None,
        event_type: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> tuple[List[AuditLog], int]:
        """
        Get audit logs for a user with filters
        Returns (logs, total_count)
        """
        query = db.query(AuditLog).filter(AuditLog.user_id == user_id)

        if event_category:
            query = query.filter(AuditLog.event_category == event_category)

        if event_type:
            query = query.filter(AuditLog.event_type == event_type)

        if start_date:
            query = query.filter(AuditLog.created_at >= start_date)

        if end_date:
            query = query.filter(AuditLog.created_at <= end_date)

        total_count = query.count()

        logs = query.order_by(AuditLog.created_at.desc()).limit(limit).offset(offset).all()

        return logs, total_count

    @staticmethod
    def cleanup_old_logs(db: Session, days: int = 90) -> int:
        """
        Delete audit logs older than specified days
        Returns number of deleted rows
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days)

        deleted_count = db.query(AuditLog).filter(
            AuditLog.created_at < cutoff_date
        ).delete()

        db.commit()

        logger.info(f"Deleted {deleted_count} audit logs older than {days} days")
        return deleted_count

# Convenience functions
def log_login_success(db: Session, user_id: int, ip: str, user_agent: str):
    return AuditLogService.log_event(
        db, user_id, "login_success", "authentication",
        "User logged in successfully",
        ip, user_agent
    )

def log_login_failed(db: Session, user_id: int, ip: str, user_agent: str, reason: str):
    return AuditLogService.log_event(
        db, user_id, "login_failed", "authentication",
        f"Login failed: {reason}",
        ip, user_agent, status="failed"
    )

def log_password_changed(db: Session, user_id: int, ip: str, user_agent: str):
    return AuditLogService.log_event(
        db, user_id, "password_changed", "security",
        "Password was changed",
        ip, user_agent
    )

def log_2fa_enabled(db: Session, user_id: int, ip: str, user_agent: str):
    return AuditLogService.log_event(
        db, user_id, "2fa_enabled", "security",
        "Two-factor authentication enabled",
        ip, user_agent
    )

def log_tax_filing_submitted(db: Session, user_id: int, filing_id: int, ip: str, user_agent: str):
    return AuditLogService.log_event(
        db, user_id, "tax_filing_submitted", "data_modification",
        f"Tax filing submitted for year",
        ip, user_agent, metadata={"filing_id": filing_id}
    )

def log_document_uploaded(db: Session, user_id: int, document_name: str, ip: str, user_agent: str):
    return AuditLogService.log_event(
        db, user_id, "document_uploaded", "data_modification",
        f"Document uploaded: {document_name}",
        ip, user_agent, metadata={"document": document_name}
    )

def log_data_exported(db: Session, user_id: int, export_type: str, ip: str, user_agent: str):
    return AuditLogService.log_event(
        db, user_id, "data_exported", "data_access",
        f"Data exported: {export_type}",
        ip, user_agent, metadata={"export_type": export_type}
    )
```

### 1.5 Create Pydantic Schemas

**File:** `backend/schemas/audit_log.py`

```python
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Dict, Any

class AuditLogBase(BaseModel):
    event_type: str
    event_category: str
    description: str
    status: str = "success"

class AuditLogResponse(AuditLogBase):
    id: int
    user_id: int
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    device_info: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True

class AuditLogListResponse(BaseModel):
    logs: list[AuditLogResponse]
    total: int
    page: int
    page_size: int
    has_more: bool
```

### 1.6 Create API Router

**File:** `backend/routers/audit_logs.py`

```python
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from db.session import get_db
from core.security import get_current_user
from models.user import User
from schemas.audit_log import AuditLogListResponse, AuditLogResponse
from services.audit_log_service import AuditLogService

router = APIRouter()

@router.get("/", response_model=AuditLogListResponse)
async def get_my_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    event_category: Optional[str] = Query(None),
    event_type: Optional[str] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get audit logs for the current user
    """
    offset = (page - 1) * page_size

    logs, total = AuditLogService.get_user_logs(
        db,
        current_user.id,
        limit=page_size,
        offset=offset,
        event_category=event_category,
        event_type=event_type,
        start_date=start_date,
        end_date=end_date
    )

    return AuditLogListResponse(
        logs=logs,
        total=total,
        page=page,
        page_size=page_size,
        has_more=total > (page * page_size)
    )

@router.get("/categories")
async def get_event_categories(
    current_user: User = Depends(get_current_user)
):
    """
    Get available event categories for filtering
    """
    return {
        "categories": [
            {"value": "authentication", "label": "Authentication"},
            {"value": "security", "label": "Security"},
            {"value": "data_access", "label": "Data Access"},
            {"value": "data_modification", "label": "Data Modification"},
            {"value": "account", "label": "Account"}
        ]
    }
```

### 1.7 Integrate Logging into Existing Routes

Update existing routes to log events:

**`backend/routers/auth.py`:**
```python
from services.audit_log_service import log_login_success, log_login_failed

# In login endpoint
if user and verify_password(login_request.password, user.hashed_password):
    log_login_success(db, user.id, request.client.host, request.headers.get("user-agent"))
else:
    log_login_failed(db, user.id if user else None, request.client.host, request.headers.get("user-agent"), "Invalid credentials")
```

**Add to other critical operations similarly**

### 1.8 Add Cleanup Job

**File:** `backend/scripts/cleanup_audit_logs.py`

```python
from db.session import get_db
from services.audit_log_service import AuditLogService

def cleanup_old_audit_logs():
    db = next(get_db())
    try:
        deleted = AuditLogService.cleanup_old_logs(db, days=90)
        print(f"Cleaned up {deleted} old audit logs")
    finally:
        db.close()

if __name__ == "__main__":
    cleanup_old_audit_logs()
```

**Add cron job or AWS EventBridge rule to run daily**

---

## 🎨 Phase 2: Frontend Implementation (Week 2)

### 2.1 Create Audit Logs Page

**File:** `src/pages/Settings/AuditLogsTab.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Button,
  Pagination,
  CircularProgress,
  Stack,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Security as SecurityIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  FileUpload as FileUploadIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import axios from 'axios';

const AuditLogsTab = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [category, setCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const pageSize = 20;

  useEffect(() => {
    fetchLogs();
  }, [page, category, startDate, endDate]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        page_size: pageSize,
        ...(category && { event_category: category }),
        ...(startDate && { start_date: startDate }),
        ...(endDate && { end_date: endDate })
      };

      const response = await axios.get('/api/audit-logs/', { params });
      setLogs(response.data.logs);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (eventType) => {
    if (eventType.includes('login')) return <LoginIcon />;
    if (eventType.includes('logout')) return <LogoutIcon />;
    if (eventType.includes('upload')) return <FileUploadIcon />;
    if (eventType.includes('download') || eventType.includes('export')) return <DownloadIcon />;
    if (eventType.includes('update') || eventType.includes('change')) return <EditIcon />;
    return <SecurityIcon />;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'success';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight={600}>
        Activity Log
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        View your account activity and security events. Logs are kept for 90 days.
      </Typography>

      {/* Filters */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={category}
            label="Category"
            onChange={(e) => setCategory(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="authentication">Authentication</MenuItem>
            <MenuItem value="security">Security</MenuItem>
            <MenuItem value="data_access">Data Access</MenuItem>
            <MenuItem value="data_modification">Data Modification</MenuItem>
            <MenuItem value="account">Account</MenuItem>
          </Select>
        </FormControl>

        <TextField
          label="Start Date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />

        <TextField
          label="End Date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />

        <Button onClick={() => {
          setCategory('');
          setStartDate('');
          setEndDate('');
        }}>
          Clear Filters
        </Button>
      </Stack>

      {/* Logs Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Event</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Device</TableCell>
                  <TableCell>IP Address</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date/Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        {getEventIcon(log.event_type)}
                        <Typography variant="body2" fontWeight={500}>
                          {log.event_type.replace(/_/g, ' ').toUpperCase()}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>{log.description}</TableCell>
                    <TableCell>
                      {log.device_info ? (
                        <Tooltip title={`${log.device_info.os} - ${log.device_info.browser}`}>
                          <Typography variant="caption">
                            {log.device_info.device} {log.device_info.is_mobile ? '(Mobile)' : ''}
                          </Typography>
                        </Tooltip>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">{log.ip_address || '-'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={log.status}
                        color={getStatusColor(log.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={Math.ceil(total / pageSize)}
              page={page}
              onChange={(e, value) => setPage(value)}
              color="primary"
            />
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
            Showing {logs.length} of {total} events
          </Typography>
        </>
      )}
    </Box>
  );
};

export default AuditLogsTab;
```

### 2.2 Add to Settings Page

Update `src/pages/Settings/Settings.jsx`:

```jsx
import AuditLogsTab from './AuditLogsTab';

// Add to tabs
<Tab label="Activity Log" value="audit-logs" icon={<HistoryIcon />} />

// Add to tab panels
<TabPanel value="audit-logs">
  <AuditLogsTab />
</TabPanel>
```

### 2.3 Add API Configuration

Update `src/config/api.js`:
```javascript
export const API_ENDPOINTS = {
  // ... existing endpoints
  AUDIT_LOGS: '/api/audit-logs',
  AUDIT_LOGS_CATEGORIES: '/api/audit-logs/categories'
};
```

---

## 🧪 Phase 3: Testing (Days 8-9)

### 3.1 Backend Tests

**File:** `backend/tests/test_audit_logs.py`

```python
import pytest
from services.audit_log_service import AuditLogService, log_login_success

def test_create_audit_log(db_session, test_user):
    log = AuditLogService.log_event(
        db_session,
        test_user.id,
        "test_event",
        "test_category",
        "Test description",
        "127.0.0.1",
        "Mozilla/5.0"
    )

    assert log is not None
    assert log.user_id == test_user.id
    assert log.event_type == "test_event"

def test_get_user_logs(db_session, test_user):
    # Create test logs
    for i in range(5):
        AuditLogService.log_event(
            db_session, test_user.id,
            f"event_{i}", "test", f"Event {i}"
        )

    logs, total = AuditLogService.get_user_logs(db_session, test_user.id)
    assert total == 5
    assert len(logs) == 5

def test_cleanup_old_logs(db_session, test_user):
    # Create old log (mock created_at)
    # Test cleanup function
    pass
```

### 3.2 Frontend Tests

```javascript
describe('AuditLogsTab', () => {
  it('renders audit logs correctly', () => {
    // Test rendering
  });

  it('filters logs by category', () => {
    // Test filtering
  });

  it('paginates correctly', () => {
    // Test pagination
  });
});
```

---

## 📦 Phase 4: Deployment (Day 10)

### 4.1 Database Migration

```bash
# Run migration
cd backend
alembic upgrade head
```

### 4.2 Install Dependencies

```bash
# Add to backend/requirements.txt
user-agents==2.2.0

pip install -r requirements.txt
```

### 4.3 Update App Router

**`backend/app.py`:**
```python
from routers import audit_logs

app.include_router(audit_logs.router, prefix="/api/audit-logs", tags=["audit-logs"])
```

### 4.4 Create Cleanup Cron Job

**Option 1: AWS EventBridge Rule**
- Create rule to trigger Lambda
- Lambda calls cleanup endpoint

**Option 2: System Cron**
```bash
# Add to crontab
0 2 * * * cd /app/backend && python scripts/cleanup_audit_logs.py
```

---

## 🔒 Security Considerations

1. **Data Privacy**
   - Only show user their own logs
   - Don't log sensitive data (passwords, tokens) in metadata
   - Encrypt IP addresses if required by GDPR

2. **Performance**
   - Index on user_id and created_at for fast queries
   - Limit page size to prevent large queries
   - Consider archiving old logs to cold storage

3. **Access Control**
   - Require authentication to view logs
   - No admin endpoint to view other users' logs (separate if needed)

---

## 📈 Success Metrics

- [ ] All critical events are logged
- [ ] Users can view their audit logs
- [ ] Page load time < 2 seconds
- [ ] Logs auto-cleanup after 90 days
- [ ] Zero security incidents from logging system

---

## 🚀 Future Enhancements (Post-MVP)

1. **Email Alerts** - Notify users of suspicious activity
2. **Export Logs** - Allow users to download their activity history
3. **Anomaly Detection** - Flag unusual login patterns
4. **Admin Dashboard** - View system-wide security events
5. **Real-time Notifications** - WebSocket updates for new events
6. **Log Retention Settings** - Let users choose retention period

---

## 📋 Checklist

### Backend
- [ ] Create database migration
- [ ] Create AuditLog model
- [ ] Implement AuditLogService
- [ ] Create API endpoints
- [ ] Integrate logging into auth routes
- [ ] Integrate logging into filing routes
- [ ] Integrate logging into document routes
- [ ] Create cleanup script
- [ ] Write unit tests
- [ ] Test API endpoints

### Frontend
- [ ] Create AuditLogsTab component
- [ ] Add to Settings page
- [ ] Implement filtering UI
- [ ] Implement pagination
- [ ] Add date range picker
- [ ] Test responsiveness
- [ ] Write component tests

### Deployment
- [ ] Run database migration
- [ ] Deploy backend changes
- [ ] Deploy frontend changes
- [ ] Set up cleanup cron job
- [ ] Verify logs are being created
- [ ] Test end-to-end functionality

### Documentation
- [ ] Update API documentation
- [ ] Add user guide for Activity Log
- [ ] Document event types
- [ ] Update privacy policy

---

## ⏱️ Estimated Timeline

| Phase | Tasks | Duration |
|-------|-------|----------|
| **Week 1** | Backend implementation | 5 days |
| Day 1-2 | Database schema, models, migration | 2 days |
| Day 3-4 | Service layer, API routes | 2 days |
| Day 5 | Integration into existing routes | 1 day |
| **Week 2** | Frontend & testing | 5 days |
| Day 6-7 | UI components | 2 days |
| Day 8-9 | Testing | 2 days |
| Day 10 | Deployment & monitoring | 1 day |

**Total: 10 working days (2 weeks)**

---

## 💡 Tips

1. Start with authentication events (login/logout) as they're most critical
2. Test logging doesn't break existing functionality
3. Monitor database size growth
4. Consider using background tasks for logging to avoid blocking requests
5. Add feature flag to enable/disable audit logging if needed
