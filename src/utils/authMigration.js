/**
 * Auth Migration Utility
 * Migrates users from localStorage token-based auth to httpOnly cookie auth
 */

import axios from 'axios';
import { useTranslation } from 'react-i18next';

const API_URL = process.env.REACT_APP_API_BASE_URL || 'https://api.swissai.tax';

/**
 * Migrate user from localStorage tokens to httpOnly cookies
 * This should be called once per user during the migration period
 */
export const migrateToCookieAuth = async () => {
  try {
    const userStr = localStorage.getItem('user');
    const oldToken = localStorage.getItem('authToken');

    if (!userStr && !oldToken) {
      // No migration needed
      return { success: true, migrated: false, message: 'No legacy auth found' };
    }

    let token = oldToken;
    let user = null;

    // Try to get token from user object
    if (userStr) {
      try {
        user = JSON.parse(userStr);
        if (user.access_token && !token) {
          token = user.access_token;
        }
      } catch (e) {
        console.error('Failed to parse user', e);
      }
    }

    if (!token) {
      // No token to migrate
      return { success: false, migrated: false, message: 'No token found' };
    }

    // Call migration endpoint with old token
    const response = await axios.post(
      `${API_URL}/api/auth/migrate-to-cookie`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`
        },
        withCredentials: true
      }
    );

    if (response.data.success) {
      // Clean up old token storage
      localStorage.removeItem('authToken');

      // Update user data (remove token)
      if (user) {
        const { access_token, token_type, ...userData } = user;
        localStorage.setItem('user', JSON.stringify(userData));
      }

      return {
        success: true,
        migrated: true,
        message: 'Successfully migrated to cookie auth',
        user: response.data.user
      };
    }

    return { success: false, migrated: false, message: 'Migration failed' };
  } catch (error) {
    console.error('[Migration] Error:', error);

    // If token is invalid/expired, just clean up
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      return {
        success: false,
        migrated: false,
        message: 'Token expired, please login again'
      };
    }

    return {
      success: false,
      migrated: false,
      message: error.message || 'Migration error'
    };
  }
};

/**
 * Check if user needs migration
 */
export const needsMigration = () => {
  const { t } = useTranslation();
  const userStr = localStorage.getItem('user');
  const oldToken = localStorage.getItem('authToken');

  if (oldToken) return true;

  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      // If user object has access_token, needs migration
      return !!user.access_token;
    } catch (e) {
      return false;
    }
  }

  return false;
};

/**
 * Auto-migrate on app load (call this in App.js)
 */
export const autoMigrate = async () => {
  if (needsMigration()) {
    const result = await migrateToCookieAuth();

    if (result.migrated) {
    } else if (result.message === 'Token expired, please login again') {
      // Redirect to login
      window.location.href = '/login';
    }

    return result;
  }

  return { success: true, migrated: false, message: 'No migration needed' };
};

export default {
  migrateToCookieAuth,
  needsMigration,
  autoMigrate
};
