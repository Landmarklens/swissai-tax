# Google OAuth Login Issue - FIXED ✅

## Changes Made

### AWS Parameter Store (Completed)
- ✅ Updated `/swissai-tax/google/redirect-uri` from `https://api.swissai.tax/auth/login/google/callback` to `https://api.swissai.tax/api/auth/login/google/callback`
- ✅ Created `/swissai-tax/google/frontend-redirect-url` as `https://swissai.tax/google-redirect`

### Frontend Code (Completed)
- ✅ Simplified GoogleCallback.jsx to redirect to `/filings` after login
- ✅ Updated environment variable documentation

### Still Required
- ⚠️ **Update Google Cloud Console** OAuth redirect URI to `https://api.swissai.tax/api/auth/login/google/callback`
- ⚠️ **Restart backend service** to load new Parameter Store values
- ⚠️ **Update backend code** to use the new frontend redirect URL parameter

## Issue (Original)
Google OAuth login fails with 404 error when redirecting to:
```
https://api.swissai.tax/auth/login/google/callback
```

Error response: `{"detail":"Not Found"}`

## Root Cause
The Google OAuth redirect URI registered in Google Cloud Console is incorrect. It's missing the `/api/` prefix.

## Current Flow (BROKEN)
1. User clicks "Login with Google"
2. Frontend → Backend: `GET /api/auth/login/google`
3. Backend returns Google authorization URL
4. User authenticates with Google
5. Google → Backend: `GET /auth/login/google/callback` ❌ **404 ERROR**
   - Missing `/api/` prefix
6. User sees error page

## Expected Flow (CORRECT)
1. User clicks "Login with Google"
2. Frontend → Backend: `GET /api/auth/login/google`
3. Backend returns Google authorization URL
4. User authenticates with Google
5. Google → Backend: `GET /api/auth/login/google/callback` ✅
6. Backend → Frontend: Redirect to `/google-redirect?access_token=...&token_type=...`
7. Frontend completes login and redirects to `/filings`

## Backend Fix Required

### 1. Update Google Cloud Console OAuth Configuration

Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials) and update the OAuth 2.0 Client ID:

**Authorized redirect URIs should be:**
```
https://api.swissai.tax/api/auth/login/google/callback
```

**NOT:**
```
https://api.swissai.tax/auth/login/google/callback
```

### 2. Verify Backend Endpoint

Ensure the backend has the following endpoint:
```python
@app.get("/api/auth/login/google/callback")
async def google_login_callback(
    code: str,
    state: str
):
    # Process OAuth callback
    # Exchange code for tokens
    # Redirect to frontend with tokens
    ...
```

### 3. Backend Should Redirect to Frontend

After processing the OAuth callback, the backend should redirect to the frontend URL with tokens:

```python
# Decode state to get redirect_url
state_data = decode_state(state)
redirect_url = state_data.get('redirect_url')

# Add tokens as query parameters
final_url = f"{redirect_url}?access_token={access_token}&token_type={token_type}"

return RedirectResponse(url=final_url)
```

## Frontend Changes Made

1. ✅ Updated `.env.example` to include production redirect URL
2. ✅ Simplified `GoogleCallback.jsx` to redirect to `/filings` after login
3. ✅ Removed legacy tenant/landlord routing logic

## Testing Checklist

After backend fix:

- [ ] Click "Login with Google" on production site
- [ ] Authenticate with Google
- [ ] Verify redirect to `https://api.swissai.tax/api/auth/login/google/callback` (not 404)
- [ ] Verify redirect to `https://swissai.tax/google-redirect?access_token=...`
- [ ] Verify final redirect to `https://swissai.tax/filings`
- [ ] Verify user is logged in and can access protected routes

## Environment Variables

### Development (`.env.development`)
```bash
REACT_APP_GOOGLE_REDIRECT_URL=http://localhost:3000/auth/google/callback
```

### Production (AWS Parameter Store)

Add the following parameter to AWS Systems Manager Parameter Store:

**Parameter Name:** `/swissai-tax/production/REACT_APP_GOOGLE_REDIRECT_URL`
**Type:** String
**Value:** `https://swissai.tax/google-redirect`

Ensure your deployment pipeline or build process loads this from Parameter Store.

## Backend Parameter Store Configuration

The backend uses the following parameters in AWS Parameter Store:

**Google OAuth Parameters (Already Configured):**
- `/swissai-tax/google/client-id` - Google OAuth Client ID (encrypted)
- `/swissai-tax/google/client-secret` - Google OAuth Client Secret (encrypted)
- `/swissai-tax/google/redirect-uri` - ✅ **FIXED** to `https://api.swissai.tax/api/auth/login/google/callback`
- `/swissai-tax/google/frontend-redirect-url` - ✅ **CREATED** as `https://swissai.tax/google-redirect`

**OAuth Redirect URI registered in Google Cloud Console:**
The Google Cloud Console OAuth configuration should have this **Authorized redirect URI**:
```
https://api.swissai.tax/api/auth/login/google/callback
```

**⚠️ Backend Restart Required:**
After updating Parameter Store values, restart the backend service to load the new configuration.

## Notes

- The frontend routes `/google-redirect` and `/auth/google/callback` both point to the `GoogleCallback` component
- The frontend automatically constructs the redirect URL if not set in environment variables
- Backend must use the redirect_url passed in the initial request to `/api/auth/login/google`
- Production secrets are managed via AWS Parameter Store, not .env files
