/**
 * Analytics Integration with Cookie Consent
 * Manages Google Analytics based on user's cookie consent preferences
 */

import { isCategoryAllowed, CookieCategories } from './cookieConsentManager';

/**
 * Initialize or disable Google Analytics based on consent
 */
export const initializeAnalytics = () => {
  const analyticsAllowed = isCategoryAllowed(CookieCategories.ANALYTICS);

  if (typeof window.gtag === 'function') {
    if (analyticsAllowed) {
      // Enable Google Analytics
      window.gtag('consent', 'update', {
        analytics_storage: 'granted',
        ad_storage: 'denied', // We don't use ads
      });
    } else {
      // Disable Google Analytics
      window.gtag('consent', 'update', {
        analytics_storage: 'denied',
        ad_storage: 'denied',
      });
    }
  }
};

/**
 * Track a page view (only if consent given)
 * @param {string} path - Page path
 */
export const trackPageView = (path) => {
  if (!isCategoryAllowed(CookieCategories.ANALYTICS)) {
    return;
  }

  if (typeof window.gtag === 'function') {
    window.gtag('event', 'page_view', {
      page_path: path,
    });
  }
};

/**
 * Track a custom event (only if consent given)
 * @param {string} action - Event action
 * @param {string} category - Event category
 * @param {string} label - Event label
 * @param {number} value - Event value
 */
export const trackEvent = (action, category, label = null, value = null) => {
  if (!isCategoryAllowed(CookieCategories.ANALYTICS)) {
    return;
  }

  if (typeof window.gtag === 'function') {
    const eventParams = {
      event_category: category,
    };

    if (label) eventParams.event_label = label;
    if (value !== null) eventParams.value = value;

    window.gtag('event', action, eventParams);
  }
};

/**
 * Disable all analytics tracking and clear analytics cookies
 */
export const disableAnalytics = () => {

  // Update gtag consent
  if (typeof window.gtag === 'function') {
    window.gtag('consent', 'update', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
    });
  }

  // Clear Google Analytics cookies
  const gaCookies = ['_ga', '_gat', '_gid'];
  gaCookies.forEach((cookieName) => {
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;
  });
};

/**
 * Check if a specific feature requiring cookies can be used
 * @param {string} category - Cookie category
 * @returns {boolean}
 */
export const canUseFeature = (category) => {
  return isCategoryAllowed(category);
};

/**
 * Listen for cookie consent changes and update analytics accordingly
 */
export const setupConsentListener = () => {
  window.addEventListener('cookieConsentUpdated', (event) => {
    const consent = event.detail;

    if (consent.preferences[CookieCategories.ANALYTICS]) {
      initializeAnalytics();
    } else {
      disableAnalytics();
    }
  });

  window.addEventListener('cookieConsentCleared', () => {
    disableAnalytics();
  });
};
