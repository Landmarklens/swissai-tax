# Data Deletion Controls Implementation Plan
**Feature:** GDPR-Compliant User Data Deletion & Export
**Effort Estimate:** 1-2 weeks
**Priority:** High (GDPR Requirement)
**Date:** October 8, 2025

---

## 1. ROOT PROBLEM ANALYSIS

### Current State
The application currently lacks:
- ❌ User-initiated account deletion capability
- ❌ Data export functionality (GDPR Article 20 - Right to Data Portability)
- ❌ Secure verification flow for irreversible account operations
- ❌ Clear communication about data retention and deletion

### Compliance Requirements
**GDPR Articles:**
- **Article 17**: Right to Erasure ("Right to be Forgotten")
- **Article 20**: Right to Data Portability
- **Article 7(3)**: Easy withdrawal of consent

### Business Impact
- **Legal Risk**: Non-compliance can result in fines up to €20M or 4% of annual revenue
- **User Trust**: Transparency in data handling builds user confidence
- **Competitive Advantage**: Clear privacy controls differentiate from competitors

---

## 2. PROPOSED SOLUTION

### Three Core Features

#### A. **Delete My Account**
- Prominent button in Settings → Security tab
- Multi-step confirmation process with clear warnings
- Email verification requirement
- Grace period (7 days) before permanent deletion
- Automatic Stripe subscription cancellation

#### B. **Export My Data**
- Download all user data in machine-readable formats
- Formats: JSON (complete) and CSV (simplified)
- Includes all personal data, tax filings, documents, settings
- Generated asynchronously with email notification when ready

#### C. **Email Verification Flow**
- Secure token-based verification (6-digit code or unique link)
- 15-minute expiration on verification codes
- Audit logging of all deletion attempts
- Clear communication about consequences

---

## 3. IMPACT ANALYSIS

### 3.1 Data Scope

Based on codebase analysis, user data spans multiple tables in the `swisstax` schema:

**Direct User Data:**
- `users` - Core user account (email, name, auth credentials)
- `user_settings` - Preferences, notifications, theme
- `audit_logs` - Activity history (may be retained for legal compliance)

**Tax & Financial Data:**
- `interview_sessions` - Tax interview data
- `interview_answers` - User's tax-related answers
- `filings` - Submitted tax returns
- `documents` - Uploaded tax documents (PDFs in S3)
- `required_documents` - Document requirements per session

**Subscription & Billing:**
- `subscriptions` - Active/past subscriptions
- `payments` - Payment history

**Cascading Deletes:**
All tables have `ON DELETE CASCADE` configured for `user_id`, so database cleanup is automatic.

### 3.2 External System Impact

| System | Action Required | Impact |
|--------|----------------|---------|
| **PostgreSQL** | Cascade delete via FK constraints | All user records deleted |
| **AWS S3** | Delete document files | Remove uploaded PDFs, tax forms |
| **Stripe** | Cancel subscriptions, keep payment history | Subscription ends, billing stops |
| **Email Service** | Send confirmation emails | User notification |
| **Audit Logs** | Retain for 90 days (legal) | Compliance with financial regulations |

### 3.3 Technical Risks

| Risk | Mitigation |
|------|-----------|
| Accidental deletion | Grace period + email verification + explicit warnings |
| Data recovery requests | Clear communication: deletion is permanent after grace period |
| Stripe subscription issues | Cancel subscription before deleting user, handle errors gracefully |
| S3 file deletion failures | Retry logic, background job for cleanup |
| Active tax filing in progress | Block deletion if filing status is "in_progress" |

---

## 4. IMPLEMENTATION DETAILS

### 4.1 Backend Implementation

#### **New API Endpoints**

```
POST   /api/user/request-deletion     # Initiate deletion request
POST   /api/user/confirm-deletion     # Confirm with verification code
POST   /api/user/cancel-deletion      # Cancel pending deletion
GET    /api/user/deletion-status      # Check deletion request status
GET    /api/user/export-data          # Request data export
GET    /api/user/download-export/:id  # Download generated export
```

#### **New Database Tables**

**`deletion_requests` table:**
```sql
CREATE TABLE swisstax.deletion_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES swisstax.users(id) ON DELETE CASCADE,
    verification_code VARCHAR(6) NOT NULL,
    verification_token VARCHAR(255) UNIQUE NOT NULL,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled_deletion_at TIMESTAMP WITH TIME ZONE NOT NULL, -- 7 days grace period
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, verified, cancelled, completed
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_scheduled_deletion (scheduled_deletion_at)
);
```

**`data_exports` table:**
```sql
CREATE TABLE swisstax.data_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES swisstax.users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
    format VARCHAR(10) NOT NULL, -- json, csv
    file_url VARCHAR(500), -- S3 URL to download
    file_size_bytes BIGINT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- 48 hours after generation
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
);
```

#### **New Backend Service: `user_deletion_service.py`**

```python
class UserDeletionService:
    """
    Handles user account deletion with GDPR compliance
    """

    def request_deletion(self, user_id: UUID, ip_address: str, user_agent: str) -> DeletionRequest:
        """
        Initiate account deletion request
        - Generate verification code (6 digits)
        - Generate secure token
        - Send verification email
        - Set grace period (7 days)
        """
        pass

    def verify_and_schedule_deletion(self, user_id: UUID, code: str) -> bool:
        """
        Verify code and schedule deletion
        - Validate verification code
        - Update status to 'verified'
        - Send confirmation email with cancellation link
        """
        pass

    def cancel_deletion(self, user_id: UUID, token: str) -> bool:
        """
        Cancel pending deletion request
        - Validate token
        - Update status to 'cancelled'
        - Send cancellation confirmation email
        """
        pass

    def execute_deletion(self, user_id: UUID) -> dict:
        """
        Execute the actual deletion (called by background job)
        Steps:
        1. Check for active filings/subscriptions
        2. Cancel Stripe subscriptions
        3. Delete S3 documents
        4. Delete database records (cascades automatically)
        5. Create final audit log entry
        6. Send final confirmation email
        """
        pass

    def check_deletion_blockers(self, user_id: UUID) -> List[str]:
        """
        Check if deletion is safe
        - Active tax filings in "submitted" status (block)
        - Pending payments (block)
        - Active disputes (block)
        """
        pass
```

#### **New Backend Service: `data_export_service.py`**

```python
class DataExportService:
    """
    Handles user data export for GDPR compliance
    """

    def request_export(self, user_id: UUID, format: str) -> DataExport:
        """
        Create export request and queue background job
        """
        pass

    def generate_export(self, export_id: UUID) -> str:
        """
        Background job: Generate export file
        Returns: S3 URL

        Data included:
        - User profile (personal info, settings)
        - Tax filings (all years)
        - Interview answers
        - Documents metadata (links to download separately)
        - Subscription history
        - Payment history
        - Audit logs
        """
        pass

    def _export_as_json(self, user_data: dict) -> str:
        """Complete data in structured JSON"""
        pass

    def _export_as_csv(self, user_data: dict) -> str:
        """Simplified CSV with main tables"""
        pass

    def cleanup_expired_exports(self):
        """Delete exports older than 48 hours"""
        pass
```

#### **Background Job: Scheduled Deletion Worker**

```python
# Runs daily via cron or AWS EventBridge
def process_scheduled_deletions():
    """
    Find all deletion requests where:
    - status = 'verified'
    - scheduled_deletion_at <= NOW()

    Execute deletion for each
    """
    pass
```

#### **Email Templates**

1. **deletion_verification.html** - 6-digit code to verify deletion request
2. **deletion_scheduled.html** - Confirmation that deletion is scheduled (with cancel link)
3. **deletion_cancelled.html** - Confirmation that deletion was cancelled
4. **deletion_completed.html** - Final goodbye email
5. **export_ready.html** - Notification that data export is ready to download

### 4.2 Frontend Implementation

#### **New Components**

**Location:** `src/pages/Settings/components/`

1. **`AccountDeletionSection.jsx`**
   - Red "Delete My Account" button
   - Warning modal with checkboxes:
     - [ ] I understand this action is permanent
     - [ ] I understand all my tax data will be deleted
     - [ ] I understand my subscription will be cancelled
   - Verification code input (6 digits)
   - Visual countdown for grace period

2. **`DataExportSection.jsx`**
   - "Export My Data" button
   - Format selection (JSON/CSV)
   - Export history table (past exports)
   - Download links with expiration countdown

3. **`DeletionVerificationDialog.jsx`**
   - Modal for entering 6-digit code
   - Resend code option
   - Clear messaging about what happens next

4. **`DeletionGracePeriodBanner.jsx`**
   - Persistent banner shown when deletion is scheduled
   - Countdown timer
   - "Cancel Deletion" button

#### **Integration into Settings Page**

Update `src/pages/Settings/Settings.jsx`:
- Add new tab or expand "Security" tab
- Add `<AccountDeletionSection />` and `<DataExportSection />`
- Add state management for deletion status

#### **New API Client Methods**

`src/services/userService.js`:
```javascript
export const requestAccountDeletion = async () => { ... }
export const confirmAccountDeletion = async (code) => { ... }
export const cancelAccountDeletion = async (token) => { ... }
export const checkDeletionStatus = async () => { ... }
export const requestDataExport = async (format) => { ... }
export const getDataExports = async () => { ... }
```

### 4.3 Database Migrations

**Migration 1:** Create deletion_requests table
**Migration 2:** Create data_exports table
**Migration 3:** Add indexes for performance

### 4.4 Email Integration

- Use existing email service (`backend/services/email_service.py` if exists, or create new)
- Templates stored in `backend/templates/emails/`
- Support for DE, FR, IT, EN languages

### 4.5 AWS S3 Document Deletion

- Batch delete documents for user
- Handle errors gracefully (retry logic)
- Log all S3 operations

### 4.6 Stripe Integration

- Cancel active subscriptions
- Retain payment history in Stripe (legal requirement)
- Handle webhook failures

---

## 5. TESTING STRATEGY

### 5.1 Unit Tests

**Backend:**
- `test_user_deletion_service.py`
  - Test verification code generation
  - Test deletion scheduling
  - Test blocker detection
  - Test S3 cleanup
  - Test Stripe cancellation

- `test_data_export_service.py`
  - Test JSON export structure
  - Test CSV export structure
  - Test export expiration

**Frontend:**
- Test all new components
- Test form validation
- Test error states

### 5.2 Integration Tests

- End-to-end deletion flow
- End-to-end export flow
- Email delivery
- S3 file operations
- Database cascade deletes

### 5.3 Manual Testing Checklist

- [ ] Request deletion → receive email → verify code → confirm scheduling
- [ ] Cancel deletion during grace period
- [ ] Export data in JSON format → verify completeness
- [ ] Export data in CSV format → verify structure
- [ ] Attempt deletion with active filing (should block)
- [ ] Attempt deletion with pending payment (should block)
- [ ] Complete deletion → verify all data removed
- [ ] Test in all 4 languages (DE, FR, IT, EN)

---

## 6. IMPLEMENTATION PHASES

### **Phase 1: Backend Foundation** (3 days)
- [ ] Create database migrations
- [ ] Implement `UserDeletionService` (core logic)
- [ ] Implement `DataExportService` (core logic)
- [ ] Create API endpoints
- [ ] Write unit tests for services

### **Phase 2: Backend Integration** (2 days)
- [ ] Email template creation (4 languages)
- [ ] S3 document deletion logic
- [ ] Stripe subscription cancellation
- [ ] Background job for scheduled deletions
- [ ] Audit logging integration

### **Phase 3: Frontend UI** (2 days)
- [ ] Create `AccountDeletionSection` component
- [ ] Create `DataExportSection` component
- [ ] Create verification dialog
- [ ] Create grace period banner
- [ ] Integrate into Settings page
- [ ] Add API client methods

### **Phase 4: Testing & Polish** (2 days)
- [ ] Integration testing
- [ ] Manual testing across all scenarios
- [ ] Multi-language testing
- [ ] Error handling improvements
- [ ] UI/UX polish
- [ ] Documentation

### **Phase 5: Deployment** (1 day)
- [ ] Run database migrations
- [ ] Deploy backend changes
- [ ] Deploy frontend changes
- [ ] Set up background job scheduler
- [ ] Monitor for errors
- [ ] Create runbook for support team

---

## 7. ROLLOUT PLAN

### Pre-Launch
1. **Legal Review**: Have legal team review deletion flow and messaging
2. **Privacy Policy Update**: Update privacy policy to reflect new capabilities
3. **Support Training**: Train support team on handling deletion-related inquiries
4. **Monitoring Setup**: Add alerts for deletion failures

### Launch
1. **Soft Launch**: Enable for test users only
2. **Monitor**: Watch for errors, email delivery issues
3. **Full Launch**: Enable for all users
4. **Announcement**: Email existing users about new feature

### Post-Launch
1. **Monitor Metrics**:
   - Deletion request rate
   - Export request rate
   - Cancellation rate during grace period
   - Failed deletions (investigate)
2. **Gather Feedback**: Survey users who request deletion (optional exit survey)
3. **Iterate**: Improve UX based on feedback

---

## 8. DOCUMENTATION

### User-Facing
- [ ] Help article: "How to Delete Your Account"
- [ ] Help article: "How to Export Your Data"
- [ ] FAQ: "What happens when I delete my account?"
- [ ] Privacy Policy updates

### Internal
- [ ] API documentation
- [ ] Runbook for support team
- [ ] Database schema documentation
- [ ] Background job monitoring

---

## 9. SUCCESS METRICS

| Metric | Target | Measurement |
|--------|--------|-------------|
| Feature availability | 99.9% uptime | CloudWatch |
| Email delivery rate | >95% | Email service logs |
| Export generation time | <5 minutes | Service logs |
| Deletion completion rate | 100% | Audit logs |
| User satisfaction | >4/5 stars | Exit survey (optional) |

---

## 10. RISKS & MITIGATION

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Data recovery requests after deletion | Medium | High | Clear warnings, grace period, final confirmation email |
| S3 deletion failures | Low | Medium | Retry logic, manual cleanup process |
| Stripe webhook failures | Low | Medium | Queue-based processing, retry logic |
| Accidental deletions | Low | High | Multi-step verification, 7-day grace period |
| Export file too large | Medium | Low | Streaming generation, pagination if needed |

---

## 11. FUTURE ENHANCEMENTS

- **Scheduled Exports**: Allow users to schedule regular data exports
- **Selective Export**: Export only specific data types
- **Account Suspension**: Temporary account deactivation instead of deletion
- **Data Anonymization**: Option to anonymize instead of delete (for analytics)

---

## 12. COMPLIANCE CHECKLIST

- [x] **GDPR Article 17** - Right to Erasure implemented
- [x] **GDPR Article 20** - Right to Data Portability implemented
- [x] **GDPR Article 7(3)** - Easy withdrawal of consent
- [ ] **Legal review** - Privacy policy updated
- [ ] **Data retention policy** - Documented and communicated
- [ ] **Audit logging** - All deletion events logged
- [ ] **User communication** - Clear, transparent messaging

---

## APPENDIX A: Database Schema Details

### Tables with User Data (ON DELETE CASCADE)

```sql
-- Direct dependencies (will cascade delete)
swisstax.user_settings
swisstax.subscriptions
swisstax.payments
swisstax.filings
swisstax.interview_sessions
  → swisstax.interview_answers (via session_id)
  → swisstax.required_documents (via session_id)

-- Documents (separate cleanup needed)
swisstax.documents (need to delete S3 files)

-- Audit logs (retention policy - 90 days)
audit_logs (may be retained for compliance)
```

### Estimated Data Volume per User

| Table | Avg Records | Size |
|-------|-------------|------|
| user_settings | 1 | <1 KB |
| interview_sessions | 1-5 | <10 KB |
| interview_answers | 10-50 | <50 KB |
| filings | 1-10 | <100 KB |
| documents | 5-50 | 1-50 MB (S3) |
| payments | 1-20 | <20 KB |
| audit_logs | 50-500 | <500 KB |

**Total per user:** ~1-100 MB (mostly documents)

---

## APPENDIX B: Email Templates (Sample)

### Deletion Verification Email

```
Subject: Verify Your Account Deletion Request

Hi {first_name},

We received a request to delete your SwissAI Tax account ({email}).

Your verification code is: {code}

This code expires in 15 minutes.

If you didn't request this, please ignore this email and consider changing your password.

Important: Account deletion is permanent and cannot be undone.

Need help? Contact support@swissai.tax
```

---

## CONCLUSION

This implementation plan provides a comprehensive, GDPR-compliant solution for user data deletion and export. The phased approach minimizes risk while ensuring thorough testing. The 1-2 week timeline is realistic given the complexity and importance of getting this feature right.

**Recommended Next Steps:**
1. ✅ Review this plan with stakeholders
2. ✅ Get legal team approval on deletion flow
3. ✅ Assign engineering resources
4. ✅ Create tickets for each phase
5. ✅ Begin Phase 1 implementation

---

**Document Version:** 1.0
**Last Updated:** October 8, 2025
**Author:** Development Team
**Status:** ⏳ Awaiting Approval
