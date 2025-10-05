/**
 * Settings Service
 * Handles user settings management for SwissAI Tax
 */

import { settingsAPI } from './api';

const settingsService = {
  /**
   * Get user settings
   * @returns {Promise} User settings data
   */
  getSettings: async () => {
    try {
      const response = await settingsAPI.getSettings();
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch settings'
      };
    }
  },

  /**
   * Update user preferences (language, theme, auto-save)
   * @param {Object} data - Preferences data
   * @returns {Promise} Updated settings
   */
  updatePreferences: async (data) => {
    try {
      const response = await settingsAPI.updatePreferences(data);
      return {
        success: true,
        data: response.data,
        message: 'Preferences updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to update preferences'
      };
    }
  },

  /**
   * Update notification settings
   * @param {Object} data - Notification preferences
   * @returns {Promise} Updated settings
   */
  updateNotifications: async (data) => {
    try {
      const response = await settingsAPI.updateNotifications(data);
      return {
        success: true,
        data: response.data,
        message: 'Notification settings updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to update notification settings'
      };
    }
  },

  /**
   * Update document retention settings
   * @param {Object} data - Document settings
   * @returns {Promise} Updated settings
   */
  updateDocumentSettings: async (data) => {
    try {
      const response = await settingsAPI.updateDocumentSettings(data);
      return {
        success: true,
        data: response.data,
        message: 'Document settings updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to update document settings'
      };
    }
  }
};

export default settingsService;
