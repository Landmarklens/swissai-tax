# Cookie Consent System - Usage Guide

## Overview

The cookie consent system is now fully integrated and **actively enforces** user preferences. When users customize their cookie settings, those preferences are:

1. ✅ **Saved** to localStorage
2. ✅ **Applied** to Google Analytics immediately
3. ✅ **Enforced** across all tracking/analytics features

## How It Works

### 1. User Interaction Flow

```
First Visit → Banner Appears (bottom of screen)
              ↓
User clicks one of three options:
  - Accept All      → Enables all cookies (Analytics + Preferences)
  - Reject Non-Essential → Only essential cookies (no tracking)
  - Customize       → Opens detailed settings dialog
              ↓
Preferences saved to localStorage
              ↓
Google Analytics updated immediately
              ↓
Banner disappears (won't show again)
```

### 2. What Gets Saved

```json
{
  "version": "1.0",
  "timestamp": "2025-10-09T12:34:56.789Z",
  "preferences": {
    "essential": true,    // Always true
    "analytics": false,   // User's choice
    "preferences": false  // User's choice
  }
}
```

### 3. What Happens When Preferences Change

**When user ACCEPTS analytics:**
- ✅ Google Analytics consent mode updated to 'granted'
- ✅ Analytics cookies can be set
- ✅ User behavior is tracked (respecting privacy)
- ✅ Page views and events are recorded

**When user REJECTS analytics:**
- ✅ Google Analytics consent mode updated to 'denied'
- ✅ Analytics cookies are blocked
- ✅ Existing GA cookies are deleted
- ✅ No tracking occurs

## Integration Points

### 1. Google Analytics (Already Integrated)

The system automatically manages Google Analytics based on user consent:

```javascript
// In your code, analytics will automatically respect consent
// No additional code needed!

// Example: Track custom events (only works if consent given)
import { trackEvent } from './utils/cookieConsent/analyticsIntegration';

trackEvent('button_click', 'user_interaction', 'signup_button');
// ↑ This will only fire if user has accepted analytics cookies
```

### 2. Custom Features Requiring Cookies

To check if a feature can be used:

```javascript
import { canUseFeature, CookieCategories } from './utils/cookieConsent/cookieConsentManager';

// Check before using a feature
if (canUseFeature(CookieCategories.ANALYTICS)) {
  // User has consented to analytics
  initializeAnalyticsFeature();
}

if (canUseFeature(CookieCategories.PREFERENCES)) {
  // User has consented to preference cookies
  saveUserPreferences();
}
```

### 3. React Components

Listen to consent changes in components:

```javascript
import { useEffect } from 'react';
import { getCookieConsent } from './utils/cookieConsent/cookieConsentManager';

function MyComponent() {
  useEffect(() => {
    // Listen for consent updates
    const handleConsentUpdate = (event) => {
      const consent = event.detail;
      console.log('Consent updated:', consent);

      if (consent.preferences.analytics) {
        // Re-enable analytics features
      }
    };

    window.addEventListener('cookieConsentUpdated', handleConsentUpdate);

    return () => {
      window.removeEventListener('cookieConsentUpdated', handleConsentUpdate);
    };
  }, []);

  return <div>My Component</div>;
}
```

## Available API Functions

### Cookie Consent Manager

```javascript
import {
  getCookieConsent,           // Get current consent object
  hasConsent,                 // Check if user has made a choice
  isCategoryAllowed,          // Check if specific category is allowed
  acceptAllCookies,           // Accept all cookies
  rejectNonEssentialCookies,  // Reject analytics & preferences
  setCookieConsent,           // Set specific preferences
  clearCookieConsent,         // Clear all consent (for testing)
  CookieCategories            // { ESSENTIAL, ANALYTICS, PREFERENCES }
} from './utils/cookieConsent/cookieConsentManager';
```

### Analytics Integration

```javascript
import {
  initializeAnalytics,   // Initialize GA based on consent
  trackPageView,         // Track page view (respects consent)
  trackEvent,           // Track custom event (respects consent)
  disableAnalytics,     // Disable and clear analytics cookies
  canUseFeature,        // Check if feature can be used
  setupConsentListener  // Setup event listeners (already done in index.js)
} from './utils/cookieConsent/analyticsIntegration';
```

## Testing

### Test Different Scenarios

1. **First Visit (Incognito/Private Window)**
   - Open `http://localhost:3000` in incognito mode
   - Banner should appear at bottom
   - Try each button option

2. **Accept All Cookies**
   - Click "Accept All"
   - Open DevTools → Application → Cookies
   - Should see `_ga`, `_gat`, `_gid` cookies

3. **Reject Non-Essential**
   - Clear localStorage & cookies
   - Refresh page
   - Click "Reject Non-Essential"
   - Analytics cookies should NOT be set

4. **Customize Preferences**
   - Clear localStorage & cookies
   - Click "Customize"
   - Toggle Analytics ON
   - Click "Save Preferences"
   - Analytics should be enabled

5. **Check localStorage**
   ```javascript
   // In browser console
   localStorage.getItem('swissai_cookie_consent')
   ```

### Debug Mode

To see what's happening:

```javascript
// In browser console
window.addEventListener('cookieConsentUpdated', (e) => {
  console.log('Consent updated:', e.detail);
});

// Check current consent
import { getCookieConsent } from './utils/cookieConsent/cookieConsentManager';
console.log(getCookieConsent());
```

## Google Analytics Consent Mode

The system uses Google's official Consent Mode v2:

- **Default state**: All tracking DENIED
- **After user choice**: Updated based on preferences
- **Privacy-first**: Anonymous IPs, no tracking until consent
- **GDPR compliant**: Respects user choices immediately

## Events Dispatched

The system dispatches custom events you can listen to:

```javascript
// When consent is updated
window.addEventListener('cookieConsentUpdated', (event) => {
  const consent = event.detail;
  // consent = { version, timestamp, preferences }
});

// When consent is cleared
window.addEventListener('cookieConsentCleared', () => {
  // Handle consent being cleared
});
```

## Force Re-consent (After Policy Update)

If you update your cookie policy, increment the version:

```javascript
// In src/utils/cookieConsent/cookieConsentManager.js
const CONSENT_VERSION = '1.1'; // Changed from '1.0'
```

Users will see the banner again on next visit.

## Summary

✅ **Preferences ARE saved** to localStorage
✅ **Google Analytics IS controlled** by consent
✅ **Cookies ARE blocked/allowed** based on choice
✅ **System IS actively enforcing** user preferences

The cookie consent system is **fully functional and integrated** - user choices directly control what tracking happens on your site!
