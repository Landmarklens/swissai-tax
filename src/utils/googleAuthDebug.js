// Google Auth Debug Helper
// This file provides utilities to debug the Google OAuth flow

export const checkGoogleAuthLogs = () => {
  console.group('🔍 Google Auth Debug Logs');

  const logs = [
    'google_auth_start',
    'google_auth_debug',
    'google_auth_response',
    'google_auth_redirect_url',
    'google_auth_error',
    'google_callback_debug'
  ];

  logs.forEach(key => {
    const value = localStorage.getItem(key);
    if (value) {
      try {
        const parsed = JSON.parse(value);
        console.log(`📝 ${key}:`, parsed);
      } catch {
        console.log(`📝 ${key}:`, value);
      }
    } else {
      console.log(`❌ ${key}: Not found`);
    }
  });

  console.groupEnd();
};

export const clearGoogleAuthLogs = () => {
  const logs = [
    'google_auth_start',
    'google_auth_debug',
    'google_auth_response',
    'google_auth_redirect_url',
    'google_auth_error',
    'google_callback_debug'
  ];

  logs.forEach(key => localStorage.removeItem(key));
  console.log('✅ Google Auth debug logs cleared');
};

// Make functions available globally for console debugging (silently)
if (typeof window !== 'undefined') {
  window.checkGoogleAuthLogs = checkGoogleAuthLogs;
  window.clearGoogleAuthLogs = clearGoogleAuthLogs;
  // Debug tools available: checkGoogleAuthLogs(), clearGoogleAuthLogs()
}
