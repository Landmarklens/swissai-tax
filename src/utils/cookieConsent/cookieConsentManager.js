/**
 * Cookie Consent Manager
 * Handles storing and retrieving user cookie consent preferences
 */

const CONSENT_STORAGE_KEY = 'swissai_cookie_consent';
const CONSENT_VERSION = '1.0'; // Increment when cookie policy changes

export const CookieCategories = {
  ESSENTIAL: 'essential',
  ANALYTICS: 'analytics',
  PREFERENCES: 'preferences',
};

/**
 * Get current cookie consent status
 * @returns {Object|null} Consent object or null if not set
 */
export const getCookieConsent = () => {
  try {
    const consentData = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!consentData) return null;

    const consent = JSON.parse(consentData);

    // Check if consent version matches
    if (consent.version !== CONSENT_VERSION) {
      return null; // Force re-consent if policy changed
    }

    return consent;
  } catch (error) {
    console.error('Error reading cookie consent:', error);
    return null;
  }
};

/**
 * Save cookie consent preferences
 * @param {Object} preferences - Cookie category preferences
 */
export const setCookieConsent = (preferences) => {
  try {
    const consent = {
      version: CONSENT_VERSION,
      timestamp: new Date().toISOString(),
      preferences: {
        [CookieCategories.ESSENTIAL]: true, // Always true
        [CookieCategories.ANALYTICS]: preferences.analytics || false,
        [CookieCategories.PREFERENCES]: preferences.preferences || false,
      },
    };

    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consent));

    // Dispatch custom event for other parts of the app to listen to
    window.dispatchEvent(new CustomEvent('cookieConsentUpdated', { detail: consent }));

    return consent;
  } catch (error) {
    console.error('Error saving cookie consent:', error);
    return null;
  }
};

/**
 * Check if user has given consent
 * @returns {boolean}
 */
export const hasConsent = () => {
  return getCookieConsent() !== null;
};

/**
 * Check if specific category is allowed
 * @param {string} category - Cookie category
 * @returns {boolean}
 */
export const isCategoryAllowed = (category) => {
  const consent = getCookieConsent();
  if (!consent) return false;

  // Essential cookies are always allowed
  if (category === CookieCategories.ESSENTIAL) return true;

  return consent.preferences[category] === true;
};

/**
 * Clear cookie consent (for testing or policy updates)
 */
export const clearCookieConsent = () => {
  try {
    localStorage.removeItem(CONSENT_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('cookieConsentCleared'));
  } catch (error) {
    console.error('Error clearing cookie consent:', error);
  }
};

/**
 * Accept all cookies
 */
export const acceptAllCookies = () => {
  return setCookieConsent({
    analytics: true,
    preferences: true,
  });
};

/**
 * Reject non-essential cookies
 */
export const rejectNonEssentialCookies = () => {
  return setCookieConsent({
    analytics: false,
    preferences: false,
  });
};
