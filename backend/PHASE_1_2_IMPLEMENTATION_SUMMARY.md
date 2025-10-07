# Two-Factor Authentication - Phase 1 & 2 Implementation Summary

**Date:** 2025-10-07
**Status:** ✅ Backend Complete (Phase 1 & 2)

---

## Overview

Successfully implemented the complete backend infrastructure for Two-Factor Authentication (2FA) using TOTP (Time-based One-Time Password) standard. The implementation is compatible with all major authenticator apps (Google Authenticator, Authy, Microsoft Authenticator, etc.).

---

## Phase 1: Database Schema & Models ✅

### Files Modified:

1. **`backend/models/swisstax/user.py`** (Lines 68-72)
   - Added 4 new columns to User model:
     - `two_factor_enabled` - Boolean flag (default: False)
     - `two_factor_secret` - Encrypted TOTP secret key (String 255)
     - `two_factor_backup_codes` - Encrypted backup codes (String 1000)
     - `two_factor_verified_at` - Timestamp when 2FA was enabled

2. **`backend/alembic/versions/5cf1c013f2f1_add_two_factor_authentication_fields.py`**
   - Created idempotent migration
   - Adds all 4 columns with proper types and defaults
   - Includes rollback functionality
   - Safe to run multiple times (checks column existence)

### Migration Command:
```bash
alembic upgrade head
```

---

## Phase 2: Backend Implementation ✅

### 1. Dependencies Added (`backend/requirements.txt`)

```
pyotp==2.9.0        # TOTP implementation (RFC 6238)
qrcode==8.0         # QR code generation for setup
pillow==11.1.0      # Image processing for QR codes
```

**Install command:**
```bash
pip install -r backend/requirements.txt
```

---

### 2. Core Service (`backend/services/two_factor_service.py`)

**Complete 2FA service with 15+ functions:**

#### Secret Management:
- `generate_secret()` - Generates TOTP secret using pyotp
- `encrypt_secret(secret)` - Encrypts secret using existing EncryptionService
- `decrypt_secret(encrypted)` - Decrypts secret for verification

#### QR Code Generation:
- `generate_qr_code(secret, email)` - Creates base64-encoded QR code PNG
  - Includes provisioning URI for authenticator apps
  - Format: `otpauth://totp/SwissAI Tax:email?secret=...&issuer=SwissAI Tax`

#### Backup Codes:
- `generate_backup_codes(count=10)` - Creates 10 recovery codes
  - Format: `XXXX-XXXX` (8-character alphanumeric)
  - Cryptographically secure using `secrets` module
- `encrypt_backup_codes(codes)` - Encrypts codes as JSON
- `decrypt_backup_codes(encrypted)` - Decrypts codes from storage
- `verify_backup_code(user, code, db)` - Validates and consumes code (single-use)
- `get_remaining_backup_codes_count(user)` - Returns count of unused codes

#### TOTP Verification:
- `verify_totp(secret, code, window=1)` - Validates 6-digit code
  - Allows ±30 second time window for clock skew
  - Normalizes input (removes spaces/dashes)

#### User Management:
- `enable_two_factor(user, secret, backup_codes, db)` - Activates 2FA
- `disable_two_factor(user, db)` - Deactivates 2FA
- `regenerate_backup_codes(user, db)` - Creates new backup codes

---

### 3. API Schemas (`backend/schemas/two_factor.py`)

**Request/Response models:**
- `TwoFactorSetupInitResponse` - QR code + secret + backup codes
- `TwoFactorSetupVerifyRequest` - 6-digit TOTP code
- `TwoFactorVerifyRequest` - Code + temp token for login
- `TwoFactorDisableRequest` - Password confirmation
- `TwoFactorRegenerateCodesRequest` - Password confirmation
- `TwoFactorRegenerateCodesResponse` - New backup codes
- `TwoFactorStatusResponse` - Enabled status + codes remaining
- `TwoFactorMessageResponse` - Generic success/error messages

---

### 4. API Endpoints (`backend/routers/two_factor.py`)

**6 endpoints with rate limiting:**

#### Setup & Management:
```
POST /api/2fa/setup/init
```
- **Rate Limit:** 10/hour
- **Auth:** Required (current user)
- **Returns:** QR code, secret (for manual entry), 10 backup codes
- **Purpose:** Initialize 2FA setup (doesn't enable yet)

```
POST /api/2fa/setup/verify
```
- **Rate Limit:** 10/hour
- **Auth:** Required
- **Body:** `{ code: "123456", secret: "...", backup_codes: "[...]" }`
- **Returns:** Success message
- **Purpose:** Verify first TOTP code and enable 2FA

```
POST /api/2fa/disable
```
- **Rate Limit:** 5/hour
- **Auth:** Required
- **Body:** `{ password: "..." }`
- **Returns:** Success message
- **Purpose:** Disable 2FA (requires password confirmation)

```
POST /api/2fa/backup-codes/regenerate
```
- **Rate Limit:** 3/hour
- **Auth:** Required
- **Body:** `{ password: "..." }`
- **Returns:** 10 new backup codes
- **Purpose:** Generate new backup codes (invalidates old ones)

```
GET /api/2fa/status
```
- **Rate Limit:** None
- **Auth:** Required
- **Returns:** `{ enabled: bool, verified_at: datetime, backup_codes_remaining: int }`
- **Purpose:** Check current 2FA status

```
POST /api/2fa/verify (DEPRECATED)
```
- **Status:** 410 Gone
- **Redirects to:** `POST /api/auth/login/verify-2fa`
- **Purpose:** Backward compatibility placeholder

---

### 5. Authentication Flow Updates

#### A. Helper Functions (`backend/utils/auth.py`)

**New functions:**
```python
sign_temp_2fa_jwt(email, user_id) -> dict
```
- Creates temporary JWT token valid for 5 minutes
- Contains `requires_2fa: true` flag
- Used for 2FA verification step

```python
verify_temp_2fa_jwt(token) -> Optional[dict]
```
- Validates temporary 2FA token
- Checks expiration and `requires_2fa` flag
- Returns payload or None

#### B. Login Endpoint Updates (`backend/routers/auth.py`)

**Modified: `POST /api/auth/login`**

Flow now branches based on 2FA status:

```python
if user.two_factor_enabled:
    return {
        "success": True,
        "requires_2fa": True,
        "temp_token": "...",  # 5-minute token
        "message": "Please enter your 2FA code to complete login"
    }
else:
    # Normal login flow (set cookie + return user data)
    ...
```

**New: `POST /api/auth/login/verify-2fa`**

- **Rate Limit:** 5/15 minutes (strict security)
- **Body:** `{ temp_token: "...", code: "123456" }`
- **Process:**
  1. Validates temporary token (5-minute expiry)
  2. Retrieves user from database
  3. Tries TOTP verification first (6-digit codes)
  4. Falls back to backup code if TOTP fails
  5. Marks backup code as used if successful
  6. Generates full session token
  7. Sets httpOnly cookie (if use_cookie=true)
  8. Returns user data + session
  9. Warns if backup codes running low (<3 remaining)

---

### 6. Router Registration (`backend/main.py`)

Added 2FA router to application:
```python
from routers import two_factor

app.include_router(two_factor.router, tags=["Two-Factor Authentication"])
```

---

## Complete Authentication Flow

### Setup Flow:
1. **User requests 2FA setup:** `POST /api/2fa/setup/init`
2. **Backend returns:** QR code + secret + 10 backup codes
3. **User scans QR code** with authenticator app (or enters secret manually)
4. **User verifies:** `POST /api/2fa/setup/verify` with first TOTP code
5. **Backend enables 2FA** and saves encrypted secret + backup codes
6. **User downloads/saves** backup codes

### Login Flow (with 2FA enabled):
1. **User submits** email + password → `POST /api/auth/login`
2. **Backend checks** password validity
3. **Backend detects** 2FA enabled → returns `{requires_2fa: true, temp_token: "..."}`
4. **Frontend shows** 2FA input modal
5. **User enters** TOTP code (or backup code)
6. **User submits** → `POST /api/auth/login/verify-2fa`
7. **Backend verifies** code against secret
8. **Backend returns** full session + user data
9. **Frontend redirects** to dashboard

### Login Flow (without 2FA):
1. **User submits** email + password → `POST /api/auth/login`
2. **Backend checks** password validity
3. **Backend sets** session cookie
4. **Backend returns** user data
5. **Frontend redirects** to dashboard

---

## Security Features Implemented

✅ **Encryption at Rest:**
- TOTP secrets encrypted using `EncryptionService`
- Backup codes encrypted as JSON
- Uses application encryption key from AWS Secrets Manager or env var

✅ **Rate Limiting:**
- Login verification: 5 attempts per 15 minutes
- Setup endpoints: 10 per hour
- Disable/regenerate: 3-5 per hour

✅ **Token Security:**
- Temporary 2FA tokens expire in 5 minutes
- Full session tokens use existing JWT system
- httpOnly cookies prevent XSS attacks

✅ **Code Security:**
- Backup codes are single-use only
- Marked as consumed in database after use
- TOTP has ±30 second time window (clock skew tolerance)

✅ **Input Validation:**
- TOTP codes must be exactly 6 digits
- Backup codes normalized (spaces/dashes removed)
- Pydantic schemas validate all requests

✅ **Audit Logging:**
- All 2FA events logged (enable/disable/verification)
- Failed attempts logged with user email
- Backup code usage tracked

---

## API Endpoints Summary

| Method | Endpoint | Auth | Rate Limit | Purpose |
|--------|----------|------|------------|---------|
| POST | `/api/2fa/setup/init` | ✓ | 10/hour | Initialize 2FA setup |
| POST | `/api/2fa/setup/verify` | ✓ | 10/hour | Enable 2FA |
| POST | `/api/2fa/disable` | ✓ | 5/hour | Disable 2FA |
| POST | `/api/2fa/backup-codes/regenerate` | ✓ | 3/hour | New backup codes |
| GET | `/api/2fa/status` | ✓ | - | Check 2FA status |
| POST | `/api/auth/login` | - | 1000/min | Login (now checks 2FA) |
| POST | `/api/auth/login/verify-2fa` | - | 5/15min | Verify 2FA code |

---

## Files Created/Modified

### Created:
- `backend/services/two_factor_service.py` - 380 lines
- `backend/schemas/two_factor.py` - 45 lines
- `backend/routers/two_factor.py` - 305 lines
- `backend/alembic/versions/5cf1c013f2f1_add_two_factor_authentication_fields.py` - 170 lines
- `backend/PHASE_1_2_IMPLEMENTATION_SUMMARY.md` - This file

### Modified:
- `backend/models/swisstax/user.py` - Added 4 columns
- `backend/utils/auth.py` - Added 2 functions (60 lines)
- `backend/routers/auth.py` - Updated login flow + new endpoint (135 lines)
- `backend/main.py` - Registered 2FA router
- `backend/requirements.txt` - Added 3 dependencies

**Total Lines Added:** ~1,095 lines of production code

---

## Testing Checklist

### Manual Testing (Before Frontend):

Using tools like Postman or curl:

1. **Setup Flow:**
   ```bash
   # 1. Login and get auth token
   curl -X POST http://localhost:8000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com", "password": "password123"}'

   # 2. Initialize 2FA setup (use token from step 1)
   curl -X POST http://localhost:8000/api/2fa/setup/init \
     -H "Authorization: Bearer <token>"

   # 3. Scan QR code with authenticator app, get TOTP code

   # 4. Verify and enable 2FA
   curl -X POST http://localhost:8000/api/2fa/setup/verify \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"code": "123456"}' \
     -G --data-urlencode "secret=<secret from step 2>" \
        --data-urlencode "backup_codes=<codes from step 2>"
   ```

2. **Login Flow:**
   ```bash
   # 1. Login with password (returns requires_2fa=true)
   curl -X POST http://localhost:8000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com", "password": "password123"}'

   # 2. Verify 2FA code
   curl -X POST http://localhost:8000/api/auth/login/verify-2fa \
     -H "Content-Type: application/json" \
     -d '{"temp_token": "<temp token from step 1>", "code": "123456"}'
   ```

3. **Status Check:**
   ```bash
   curl -X GET http://localhost:8000/api/2fa/status \
     -H "Authorization: Bearer <token>"
   ```

4. **Disable 2FA:**
   ```bash
   curl -X POST http://localhost:8000/api/2fa/disable \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"password": "password123"}'
   ```

---

## Next Steps

### Phase 3: Frontend Implementation (Pending)

1. **React Components to Create:**
   - `TwoFactorSetup.jsx` - QR code display + initial setup
   - `TwoFactorVerify.jsx` - Login 2FA code input
   - `TwoFactorSettings.jsx` - Manage 2FA in settings
   - `BackupCodesList.jsx` - Display/download codes

2. **Service Layer:**
   - `src/services/twoFactorService.js` - API wrapper

3. **Authentication Updates:**
   - `src/services/authService.js` - Handle 2FA flow
   - Update login components to show 2FA modal

4. **Settings Integration:**
   - Add 2FA section to user profile/settings page

See `TWO_FACTOR_AUTHENTICATION_PLAN.md` for complete Phase 3 details.

---

## Rollback Instructions

If issues arise:

1. **Disable 2FA enforcement (no rollback needed):**
   - All users with 2FA disabled can login normally
   - Users with 2FA enabled can disable it via settings

2. **Database rollback (if necessary):**
   ```bash
   alembic downgrade -1
   ```
   This removes the 4 new columns from the users table.

3. **Code rollback:**
   - Revert changes to `auth.py` login endpoint
   - Remove 2FA router registration from `main.py`

---

## Performance Considerations

- **QR Code Generation:** ~50-100ms per request
- **TOTP Verification:** <10ms per request
- **Database Impact:** 4 new columns, minimal overhead
- **Encryption/Decryption:** ~5-10ms per operation

**Expected Load:**
- Setup: Low frequency (once per user)
- Login verification: Medium frequency (per login for 2FA users)
- Status checks: Low frequency (on settings page load)

---

## Monitoring & Alerts

**Recommended metrics to track:**
- 2FA adoption rate (% of users with 2FA enabled)
- Failed 2FA verification attempts
- Backup code usage frequency
- Backup codes running low (<3 remaining)
- Temporary token expiration rate

**Log patterns to monitor:**
- `[2FA] TOTP verification for ... : failed` - Potential attacks
- `[2FA] Backup code used for ...` - Track recovery usage
- `User ... has only X backup codes remaining` - Proactive regeneration

---

## Documentation Links

- **Implementation Plan:** `TWO_FACTOR_AUTHENTICATION_PLAN.md`
- **API Documentation:** Auto-generated at `/docs` (FastAPI Swagger)
- **RFC 6238 (TOTP):** https://tools.ietf.org/html/rfc6238
- **pyotp Documentation:** https://pyauth.github.io/pyotp/

---

## Support & Troubleshooting

### Common Issues:

**Q: TOTP code not working**
A: Check server time synchronization (NTP). TOTP requires accurate time.

**Q: QR code not scanning**
A: Provide manual entry option (secret key) for users.

**Q: User lost device + backup codes**
A: Admin must manually disable 2FA in database or provide account recovery flow.

**Q: Temporary token expired**
A: User must restart login flow. 5-minute window is security feature.

---

*Last Updated: 2025-10-07*
*Phase 1 & 2: Complete ✅*
*Phase 3 & Beyond: Pending ⏳*
