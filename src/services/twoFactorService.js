import axios from 'axios';
import config from '../config/environments';

const API_URL = process.env.REACT_APP_API_BASE_URL || config.API_BASE_URL || 'https://api.swissai.tax';

/**
 * Two-Factor Authentication Service
 * Handles all 2FA-related API calls
 */
const twoFactorService = {
  /**
   * Initialize 2FA setup - get QR code, secret, and backup codes
   * @returns {Promise<Object>} { secret, qr_code, backup_codes }
   */
  initializeSetup: async () => {
    try {
      const response = await axios.post(
        `${API_URL}/api/2fa/setup/init`,
        {},
        { withCredentials: true }
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error('[2FA] Setup initialization failed:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to initialize 2FA setup'
      };
    }
  },

  /**
   * Verify TOTP code and enable 2FA
   * @param {string} code - 6-digit TOTP code
   * @param {string} secret - TOTP secret from initialization
   * @param {Array<string>} backupCodes - Backup codes from initialization
   * @returns {Promise<Object>} Success or error response
   */
  verifyAndEnable: async (code, secret, backupCodes) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/2fa/setup/verify`,
        { code },
        {
          withCredentials: true,
          params: {
            secret: secret,
            backup_codes: JSON.stringify(backupCodes)
          }
        }
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error('[2FA] Verification failed:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to verify 2FA code'
      };
    }
  },

  /**
   * Verify 2FA code during login
   * @param {string} tempToken - Temporary token from login
   * @param {string} code - 6-digit TOTP or 8-character backup code
   * @returns {Promise<Object>} Full authentication response with user data
   */
  verifyLogin: async (tempToken, code) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/auth/login/verify-2fa?use_cookie=true`,
        {
          temp_token: tempToken,
          code: code
        },
        { withCredentials: true }
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error('[2FA] Login verification failed:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Invalid verification code'
      };
    }
  },

  /**
   * Disable 2FA for current user
   * @param {string} password - User's password for confirmation
   * @returns {Promise<Object>} Success or error response
   */
  disable: async (password) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/2fa/disable`,
        { password },
        { withCredentials: true }
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error('[2FA] Disable failed:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to disable 2FA'
      };
    }
  },

  /**
   * Regenerate backup codes
   * @param {string} password - User's password for confirmation
   * @returns {Promise<Object>} { success, data: { backup_codes: [...] } }
   */
  regenerateBackupCodes: async (password) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/2fa/backup-codes/regenerate`,
        { password },
        { withCredentials: true }
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error('[2FA] Backup code regeneration failed:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to regenerate backup codes'
      };
    }
  },

  /**
   * Get current 2FA status
   * @returns {Promise<Object>} { enabled, verified_at, backup_codes_remaining }
   */
  getStatus: async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/2fa/status`,
        { withCredentials: true }
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error('[2FA] Status check failed:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to get 2FA status'
      };
    }
  },

  /**
   * Download backup codes as text file
   * @param {Array<string>} backupCodes - Array of backup codes
   */
  downloadBackupCodes: (backupCodes) => {
    const content = [
      'SwissAI Tax - Two-Factor Authentication Backup Codes',
      '=' .repeat(55),
      '',
      'IMPORTANT: Store these codes in a safe place.',
      'Each code can only be used once.',
      '',
      'Backup Codes:',
      '-------------',
      ...backupCodes.map((code, index) => `${index + 1}. ${code}`),
      '',
      `Generated: ${new Date().toLocaleString()}`,
      '',
      'Keep these codes safe and secure!',
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `swissai-tax-backup-codes-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /**
   * Copy backup codes to clipboard
   * @param {Array<string>} backupCodes - Array of backup codes
   * @returns {Promise<boolean>} True if copied successfully
   */
  copyBackupCodes: async (backupCodes) => {
    try {
      const text = backupCodes.join('\n');
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('[2FA] Failed to copy backup codes:', error);
      return false;
    }
  }
};

export default twoFactorService;
