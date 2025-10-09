/**
 * User Service
 * Handles account deletion and data export operations (GDPR compliance)
 */

import { userDataAPI } from './api';
import { useTranslation } from 'react-i18next';

const userService = {
  /**
   * Request account deletion
   * Sends a 6-digit verification code to user's email
   * @returns {Promise} Deletion request response
   */
  requestAccountDeletion: async () => {
    try {
      const response = await userDataAPI.requestDeletion();
      return {
        success: true,
        data: response.data,
        message: 'Verification code sent to your email'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to request account deletion'
      };
    }
  },

  /**
   * Verify account deletion with 6-digit code
   * @param {string} code - 6-digit verification code
   * @returns {Promise} Verification response with scheduled deletion date
   */
  verifyAccountDeletion: async (code) => {
    try {
      const response = await userDataAPI.verifyDeletion(code);
      return {
        success: true,
        data: response.data,
        message: 'Account deletion scheduled successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Invalid verification code'
      };
    }
  },

  /**
   * Cancel account deletion during grace period
   * @param {string} token - Cancellation token from email
   * @returns {Promise} Cancellation response
   */
  cancelAccountDeletion: async (token) => {
    try {
      const response = await userDataAPI.cancelDeletion(token);
      return {
        success: true,
        data: response.data,
        message: 'Account deletion cancelled successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to cancel account deletion'
      };
    }
  },

  /**
   * Get current deletion status
   * @returns {Promise} Deletion status (null if no pending deletion)
   */
  getDeletionStatus: async () => {
    try {
      const response = await userDataAPI.getDeletionStatus();
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      // 404 means no pending deletion - this is normal
      if (error.response?.status === 404) {
        return {
          success: true,
          data: null
        };
      }
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to get deletion status'
      };
    }
  },

  /**
   * Request data export
   * @param {string} format - Export format ('json' or 'csv')
   * @returns {Promise} Export request response
   */
  requestDataExport: async (format = 'json') => {
    try {
      const response = await userDataAPI.requestExport(format);
      return {
        success: true,
        data: response.data,
        message: `Data export requested in ${format.toUpperCase()} format`
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to request data export'
      };
    }
  },

  /**
   * List all data exports for current user
   * @returns {Promise} List of exports
   */
  listDataExports: async () => {
    try {
      const response = await userDataAPI.listExports();
      return {
        success: true,
        data: response.data.exports || []  // Extract exports array from response
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to list data exports',
        data: []  // Return empty array on error
      };
    }
  },

  /**
   * Get a specific export by ID
   * @param {string} exportId - Export ID
   * @returns {Promise} Export details with download URL
   */
  getDataExport: async (exportId) => {
    try {
      const response = await userDataAPI.getExport(exportId);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to get export details'
      };
    }
  }
};

export default userService;
