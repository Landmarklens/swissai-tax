/**
 * Profile Service
 * Handles user profile management for SwissAI Tax
 */

import { profileAPI } from './api';
import { useTranslation } from 'react-i18next';

const profileService = {
  /**
   * Get user profile
   * @returns {Promise} User profile data
   */
  getProfile: async () => {
    try {
      const response = await profileAPI.getProfile();
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch profile'
      };
    }
  },

  /**
   * Update personal information
   * @param {Object} data - Personal info data
   * @returns {Promise} Updated profile
   */
  updatePersonalInfo: async (data) => {
    try {
      const response = await profileAPI.updatePersonalInfo(data);
      return {
        success: true,
        data: response.data,
        message: 'Personal information updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to update personal information'
      };
    }
  },

  /**
   * Update tax profile (canton, municipality, etc.)
   * @param {Object} data - Tax profile data
   * @returns {Promise} Updated profile
   */
  updateTaxProfile: async (data) => {
    try {
      const response = await profileAPI.updateTaxProfile(data);
      return {
        success: true,
        data: response.data,
        message: 'Tax profile updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to update tax profile'
      };
    }
  },

  /**
   * Update security settings (password)
   * @param {Object} data - Security data (current_password, new_password)
   * @returns {Promise} Success status
   */
  updateSecurity: async (data) => {
    try {
      const response = await profileAPI.updateSecurity(data);
      return {
        success: true,
        data: response.data,
        message: 'Security settings updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to update security settings'
      };
    }
  }
};

export default profileService;
