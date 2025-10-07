# Two-Factor Authentication Implementation Plan

## Root Problem Analysis

The current authentication system lacks two-factor authentication (2FA), which creates a security vulnerability. Users only authenticate with email/password or OAuth (Google), making accounts susceptible to credential compromise.

## Proposed Solution: TOTP-based Two-Factor Authentication

Implement Time-based One-Time Password (TOTP) authentication using industry-standard approaches (compatible with Google Authenticator, Authy, Microsoft Authenticator, etc.).

---

## Implementation Plan

### **Phase 1: Database Schema & Models**

#### Tasks:
1. Add 2FA fields to `users` table in `backend/models/swisstax/user.py`:
   - `two_factor_enabled` (Boolean, default False)
   - `two_factor_secret` (String, encrypted, nullable) - TOTP secret key
   - `two_factor_backup_codes` (JSON/Text, encrypted, nullable) - Recovery codes
   - `two_factor_verified_at` (DateTime, nullable) - When 2FA was enabled

2. Create Alembic migration file:
   - File: `backend/alembic/versions/YYYYMMDD_add_two_factor_auth_fields.py`
   - Add new columns with proper defaults
   - Ensure backward compatibility

**Status:** ✅ Complete

**Files Modified:**
- `backend/models/swisstax/user.py` - Added 2FA fields
- `backend/alembic/versions/5cf1c013f2f1_add_two_factor_authentication_fields.py` - Created migration

**Fields Added:**
- `two_factor_enabled` (Boolean, default False)
- `two_factor_secret` (String 255, nullable)
- `two_factor_backup_codes` (String 1000, nullable)
- `two_factor_verified_at` (DateTime, nullable)

**Next Step:** Run migration with `alembic upgrade head` when database is available

---

### **Phase 2: Backend Implementation**

#### Task 3: Add Dependencies & Libraries

Add to `backend/requirements.txt`:
```
pyotp==2.9.0        # TOTP generation/validation
qrcode==8.0         # QR code generation for setup
pillow==11.1.0      # Image processing for QR codes
```

**Status:** ✅ Complete

**Files Modified:**
- `backend/requirements.txt` - Added pyotp, qrcode, pillow dependencies

---

#### Task 4: Core Services

Create `backend/services/two_factor_service.py`:

**Functions to implement:**
- `generate_secret()` - Create TOTP secret using pyotp
- `generate_qr_code(secret, email)` - Generate QR code for authenticator apps
- `generate_backup_codes()` - Generate 10 single-use recovery codes
- `verify_totp(secret, code)` - Validate 6-digit TOTP code
- `verify_backup_code(user, code)` - Validate & consume backup code
- `encrypt_secret(secret)` - Encrypt TOTP secret before storage
- `decrypt_secret(encrypted)` - Decrypt TOTP secret for validation

**Status:** ✅ Complete

**Files Created:**
- `backend/services/two_factor_service.py` - Complete 2FA service with all functions
  - Uses existing `EncryptionService` for securing secrets
  - QR code generation with base64 encoding
  - Backup code generation (10 codes in XXXX-XXXX format)
  - TOTP verification with time window tolerance
  - Backup code consumption (single-use)

---

#### Task 5: API Endpoints

Create `backend/routers/two_factor.py`:

**Endpoints to implement:**
- `POST /api/2fa/setup/init` - Start 2FA setup, return QR code & secret
  - Requires: Authenticated user
  - Returns: QR code (base64), secret (for manual entry), backup codes

- `POST /api/2fa/setup/verify` - Verify & activate 2FA with first TOTP code
  - Requires: Authenticated user, TOTP code
  - Returns: Success status, saves 2FA to user

- `POST /api/2fa/verify` - Verify TOTP during login
  - Requires: Pending 2FA token, TOTP code or backup code
  - Returns: Full authentication token

- `POST /api/2fa/disable` - Disable 2FA
  - Requires: Authenticated user, password confirmation
  - Returns: Success status

- `POST /api/2fa/backup-codes/regenerate` - Generate new backup codes
  - Requires: Authenticated user, password confirmation
  - Returns: New backup codes

- `GET /api/2fa/status` - Check if user has 2FA enabled
  - Requires: Authenticated user
  - Returns: `{ enabled: boolean, verified_at: datetime }`

**Status:** ✅ Complete

**Files Created:**
- `backend/routers/two_factor.py` - Complete 2FA router with all endpoints
- `backend/schemas/two_factor.py` - Pydantic schemas for request/response validation
- `backend/main.py` - Updated to register 2FA router

**Endpoints Implemented:**
- ✅ POST `/api/2fa/setup/init` - Initialize setup (returns QR code + backup codes)
- ✅ POST `/api/2fa/setup/verify` - Verify and enable 2FA
- ✅ POST `/api/2fa/verify` - Deprecated (redirects to auth endpoint)
- ✅ POST `/api/2fa/disable` - Disable 2FA with password confirmation
- ✅ POST `/api/2fa/backup-codes/regenerate` - Generate new backup codes
- ✅ GET `/api/2fa/status` - Get 2FA status

**Rate Limiting Applied:**
- Setup init: 10/hour
- Setup verify: 10/hour
- Verify login: 5/15 minutes
- Disable: 5/hour
- Regenerate codes: 3/hour

---

#### Task 6: Authentication Flow Updates

Modify `backend/routers/auth.py`:

**Changes needed:**
1. Update `POST /api/auth/login` endpoint:
   - After password verification, check `user.two_factor_enabled`
   - If 2FA enabled:
     - Generate temporary "pending_2fa" token (5-minute expiry)
     - Return `{ requires_2fa: true, temp_token: "...", user_id: "..." }`
   - If 2FA not enabled:
     - Continue with normal login flow

2. Add new endpoint `POST /api/auth/login/verify-2fa`:
   - Accept temp_token + TOTP code
   - Validate temp token hasn't expired
   - Verify TOTP code
   - Exchange for full session token
   - Return normal login response

**Schema updates needed:**
- Update `backend/schemas/auth.py` to include 2FA response types

**Status:** ✅ Complete

**Files Modified:**
- `backend/utils/auth.py`:
  - Added `sign_temp_2fa_jwt()` - Creates 5-minute temporary token
  - Added `verify_temp_2fa_jwt()` - Validates temporary tokens

- `backend/routers/auth.py`:
  - Updated `POST /api/auth/login`:
    - Checks if user has 2FA enabled
    - Returns `requires_2fa: true` + temporary token if enabled
    - Normal login flow if 2FA not enabled
  - Added `POST /api/auth/login/verify-2fa`:
    - Accepts temp_token + TOTP/backup code
    - Verifies code against user's 2FA secret
    - Exchanges for full session token
    - Updates last_login timestamp
    - Warns when backup codes running low (<3 remaining)

**Authentication Flow:**
1. User submits email + password to `/api/auth/login`
2. If 2FA enabled: Returns `{requires_2fa: true, temp_token: "...", message: "..."}`
3. Frontend shows 2FA input modal
4. User submits temp_token + code to `/api/auth/login/verify-2fa`
5. Backend verifies code, returns full session + user data
6. Frontend proceeds to dashboard

---

### **Phase 3: Frontend Implementation**

#### Task 7: New React Components

Create the following components:

**`src/components/TwoFactor/TwoFactorSetup.jsx`**
- Display QR code for scanning
- Show manual entry secret key
- Input field for first TOTP verification
- Display backup codes (with download/copy)
- Step-by-step instructions

**`src/components/TwoFactor/TwoFactorVerify.jsx`**
- 6-digit code input during login
- "Use backup code instead" link
- "Trust this device" checkbox (optional)
- Error handling for invalid codes

**`src/components/TwoFactor/TwoFactorSettings.jsx`**
- Enable/Disable 2FA toggle
- Show current 2FA status
- Regenerate backup codes button
- View backup codes (with password confirmation)

**`src/components/TwoFactor/BackupCodesList.jsx`**
- Display backup codes in grid
- Download as text file
- Copy to clipboard button
- Warning messages about safekeeping

**Status:** ⏳ Pending

---

#### Task 8: Service Layer

Create `src/services/twoFactorService.js`:

**Functions to implement:**
```javascript
export const twoFactorService = {
  // Initialize 2FA setup
  initializeSetup: async () => { },

  // Verify and enable 2FA
  verifyAndEnable: async (code) => { },

  // Verify TOTP during login
  verifyLogin: async (tempToken, code) => { },

  // Disable 2FA
  disable: async (password) => { },

  // Regenerate backup codes
  regenerateBackupCodes: async (password) => { },

  // Check 2FA status
  getStatus: async () => { }
};
```

**Status:** ⏳ Pending

---

#### Task 9: Authentication Flow Updates

Update `src/services/authService.js`:

**Changes needed:**
1. Update `login()` function:
   - Check response for `requires_2fa` flag
   - If true, store temp token and return special state
   - If false, continue normal login flow

2. Add new function `verifyTwoFactor(tempToken, code)`:
   - Call 2FA verification endpoint
   - Handle successful verification
   - Set user session

3. Update login flow state management

**Status:** ⏳ Pending

---

#### Task 10: User Settings Integration

**Updates needed:**

1. **Profile/Settings Page** (find and update existing):
   - Add new section "Security Settings"
   - Add 2FA status badge
   - Add "Enable Two-Factor Authentication" button
   - Add "Manage 2FA" link when enabled

2. **Login Flow**:
   - After password validation, check for `requires_2fa`
   - Show `TwoFactorVerify` component if needed
   - Handle verification success/failure

3. **Routes** (`src/constants/lazyRoutes.js`):
   - Add 2FA setup route
   - Add 2FA settings route (if separate page)

**Status:** ⏳ Pending

---

### **Phase 4: Security & UX Enhancements**

#### Task 11: Security Measures

**Implement the following:**

1. **Rate Limiting**:
   - Add to `backend/routers/two_factor.py`
   - Max 5 TOTP verification attempts per 15 minutes
   - Max 3 backup code attempts per hour
   - Lock account after 10 failed attempts

2. **Encryption**:
   - Use existing encryption utilities from `backend/utils/encryption.py`
   - Encrypt TOTP secrets before database storage
   - Encrypt backup codes before database storage

3. **Backup Code Management**:
   - Mark codes as used in database
   - Prevent reuse of backup codes
   - Auto-regenerate after last code used

4. **Audit Logging**:
   - Log 2FA enable/disable events
   - Log failed verification attempts
   - Log backup code usage
   - Store in appropriate audit table

5. **Session Validation**:
   - Add 2FA verification flag to JWT payload
   - Validate 2FA status on sensitive operations

**Status:** ⏳ Pending

---

#### Task 12: User Experience Enhancements

**Implement the following:**

1. **Remember Device (Optional)**:
   - 30-day trusted device cookie
   - Skip 2FA on trusted devices
   - Manage trusted devices in settings

2. **Email Notifications**:
   - Send email when 2FA is enabled
   - Send email when 2FA is disabled
   - Alert on failed 2FA attempts
   - Use existing `EmailJSService`

3. **Recovery Flow**:
   - "Lost device?" link on login
   - Backup code entry interface
   - Contact support option

4. **Setup Instructions**:
   - Step-by-step guide with screenshots
   - Links to authenticator apps
   - Troubleshooting tips
   - Video tutorial (optional)

5. **Manual Entry Support**:
   - Display secret key as text
   - Copy to clipboard button
   - Alternative to QR code scanning

**Status:** ⏳ Pending

---

### **Phase 5: Testing**

#### Task 13: Unit Tests

Create test files:

**`backend/tests/test_two_factor_service.py`**
- Test TOTP generation
- Test TOTP validation (valid/invalid codes)
- Test backup code generation (10 unique codes)
- Test backup code verification
- Test backup code consumption (single-use)
- Test QR code generation
- Test secret encryption/decryption

**`backend/tests/test_two_factor_router.py`**
- Test setup initialization endpoint
- Test setup verification endpoint
- Test login verification endpoint
- Test disable endpoint
- Test backup code regeneration
- Test status endpoint
- Test rate limiting

**Status:** ⏳ Pending

---

#### Task 14: Integration Tests

Create `backend/tests/test_two_factor_integration.py`:

**Test scenarios:**
1. Complete 2FA setup flow (init → verify → enable)
2. Login with 2FA (password → 2FA code → success)
3. Login with backup code
4. Failed 2FA verification (invalid code)
5. Disable 2FA flow
6. Regenerate backup codes
7. Rate limiting triggers correctly
8. Encrypted data in database

**Status:** ⏳ Pending

---

#### Task 15: End-to-End Tests

Frontend testing (if E2E tests exist):

**Test scenarios:**
1. User enables 2FA from settings
2. User scans QR code and verifies
3. User downloads backup codes
4. User logs out and logs back in with 2FA
5. User uses backup code to login
6. User disables 2FA
7. Error states display correctly

**Status:** ⏳ Pending

---

### **Phase 6: Documentation & Deployment**

#### Task 16: Documentation

Create/update the following:

1. **User Guide** (`docs/user/two_factor_authentication.md`):
   - What is 2FA and why use it
   - How to enable 2FA
   - How to use 2FA when logging in
   - How to use backup codes
   - How to disable 2FA
   - Troubleshooting common issues
   - Recommended authenticator apps

2. **API Documentation**:
   - Update API docs with new endpoints
   - Add request/response examples
   - Document error codes

3. **Migration Guide for Existing Users**:
   - Email template announcing 2FA feature
   - In-app notification prompting 2FA setup
   - FAQ section

**Status:** ⏳ Pending

---

#### Task 17: Deployment

**Deployment checklist:**

1. **Pre-deployment**:
   - [ ] All tests passing
   - [ ] Code review completed
   - [ ] Security audit of 2FA implementation
   - [ ] Backup database before migration

2. **Database Migration**:
   - [ ] Run migration on staging environment
   - [ ] Verify migration success
   - [ ] Run migration on production
   - [ ] Verify new columns exist

3. **Backend Deployment**:
   - [ ] Install new dependencies (`pyotp`, `qrcode`, `pillow`)
   - [ ] Deploy backend changes
   - [ ] Verify API endpoints responding
   - [ ] Test 2FA flow in production

4. **Frontend Deployment**:
   - [ ] Deploy frontend changes
   - [ ] Verify components render correctly
   - [ ] Test complete user flow

5. **Post-deployment Monitoring**:
   - [ ] Monitor error logs for 24 hours
   - [ ] Check 2FA adoption rate
   - [ ] Monitor support tickets
   - [ ] Track failed authentication attempts

**Status:** ⏳ Pending

---

## Impact Assessment

### **Positive Impacts:**
- ✅ **Security**: Significantly reduces account takeover risk (estimated 99.9% reduction in credential-based attacks)
- ✅ **Compliance**: Meets security best practices for tax/financial applications (SOC 2, ISO 27001 alignment)
- ✅ **User Trust**: Demonstrates commitment to data security, especially important for tax data
- ✅ **Competitive Advantage**: Feature parity with other tax software (TurboTax, H&R Block have 2FA)
- ✅ **Reduced Fraud**: Prevents unauthorized access even if password is compromised

### **Potential Challenges:**
- ⚠️ **User Friction**: Adds extra step to login (mitigated by "trust device" option and smooth UX)
- ⚠️ **Support Burden**: Users may lose devices or codes (mitigated by backup codes + email recovery)
- ⚠️ **Development Time**: ~5-7 days for full implementation + testing
- ⚠️ **Testing Complexity**: Need to test with multiple authenticator apps (Google, Microsoft, Authy)
- ⚠️ **Adoption Rate**: Users may resist enabling (mitigated by clear value proposition and incentives)

### **Migration Strategy for Existing Users:**
- 2FA optional by default (opt-in approach)
- Gradual rollout: Beta users → Power users → All users
- In-app prompts encouraging 2FA adoption (banner, modal on login)
- Potential incentive: Small discount or premium feature for enabling 2FA
- Future consideration: Mandatory for users with >X tax filings or stored documents

---

## Technical Dependencies

### **New Python Packages:**
```txt
pyotp==2.9.0        # TOTP implementation (RFC 6238)
qrcode==8.0         # QR code generation
pillow==11.1.0      # Image processing (required by qrcode)
```

### **Frontend:**
- No new dependencies required (React already has necessary libraries)
- Optional: Consider `react-otp-input` for better UX on TOTP input field

### **Infrastructure:**
- Database: PostgreSQL (already in use, supports JSON for backup codes)
- Encryption: Reuse existing encryption utilities from application

---

## Security Considerations

### **TOTP Implementation:**
- Use industry-standard RFC 6238 (pyotp implements this)
- 30-second time window (standard)
- 6-digit codes (balance between security and usability)
- Allow 1 time-step tolerance (±30 seconds) for clock skew

### **Backup Codes:**
- 10 codes per user
- 8-character alphanumeric (e.g., `A1B2-C3D4`)
- Single-use only
- Encrypted at rest
- Auto-warn when <3 codes remain

### **Rate Limiting:**
- 5 failed TOTP attempts per 15 minutes per user
- 3 failed backup code attempts per hour per user
- Exponential backoff after repeated failures
- IP-based rate limiting as secondary measure

### **Encryption:**
- Encrypt TOTP secrets using application encryption key
- Store encrypted backup codes in database
- Use existing encryption utilities for consistency

---

## Rollback Plan

If issues arise post-deployment:

1. **Immediate (within 1 hour):**
   - Disable 2FA enforcement via feature flag
   - Allow all users to bypass 2FA temporarily
   - Keep data intact (don't rollback database)

2. **Short-term (within 24 hours):**
   - Investigate and fix issues
   - Test fixes in staging
   - Re-enable 2FA for specific user cohorts

3. **Database Rollback (last resort):**
   - Run reverse migration to remove 2FA columns
   - Only if data corruption detected
   - Notify all affected users

---

## Success Metrics

Track the following post-deployment:

1. **Adoption Rate:**
   - % of users enabling 2FA within 7/30/90 days
   - Target: 25% within 90 days

2. **Security Incidents:**
   - Reduction in account takeover attempts
   - Reduction in unauthorized access reports
   - Target: 90%+ reduction

3. **User Experience:**
   - 2FA setup completion rate
   - Failed verification rate
   - Support tickets related to 2FA
   - Target: <5% support ticket increase

4. **Performance:**
   - 2FA verification latency
   - QR code generation time
   - Target: <500ms p95 latency

---

## Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Database | 0.5 day | None |
| Phase 2: Backend | 2 days | Phase 1 |
| Phase 3: Frontend | 2 days | Phase 2 |
| Phase 4: Security/UX | 1 day | Phase 3 |
| Phase 5: Testing | 1.5 days | Phase 4 |
| Phase 6: Docs/Deploy | 0.5 day | Phase 5 |
| **Total** | **7.5 days** | - |

Note: Timeline assumes one developer working full-time. Can be parallelized with multiple developers.

---

## Next Steps

1. ✅ Document created and reviewed
2. ⏳ Get stakeholder approval
3. ⏳ Begin Phase 1: Database Schema
4. ⏳ Continue with subsequent phases

---

## Approval & Sign-off

- [ ] Technical Lead Approved
- [ ] Security Team Approved
- [ ] Product Owner Approved
- [ ] Ready to Begin Implementation

---

*Last Updated: 2025-10-07*
*Document Version: 1.0*
