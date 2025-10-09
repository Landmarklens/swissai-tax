/**
 * Filing Service
 * Handles tax filing submission and management for SwissAI Tax
 */

import { filingAPI } from './api';
import { useTranslation } from 'react-i18next';

const filingService = {
  /**
   * Submit a tax filing
   * @param {Object} data - Filing data (session_id, tax_year, submission_method)
   * @returns {Promise} Filing submission result
   */
  submitFiling: async (data) => {
    try {
      const response = await filingAPI.submitFiling(data);
      return {
        success: true,
        data: response.data,
        message: 'Filing submitted successfully',
        confirmationNumber: response.data.confirmation_number
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to submit filing'
      };
    }
  },

  /**
   * Get filing details
   * @param {string} filingId - Filing UUID
   * @returns {Promise} Filing details
   */
  getFiling: async (filingId) => {
    try {
      const response = await filingAPI.getFiling(filingId);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch filing details'
      };
    }
  },

  /**
   * Get filing review data before submission
   * @param {string} filingId - Filing UUID
   * @returns {Promise} Review data
   */
  reviewFiling: async (filingId) => {
    try {
      const response = await filingAPI.reviewFiling(filingId);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch filing review data'
      };
    }
  },

  /**
   * Format filing status for display
   * @param {string} status - Filing status
   * @returns {Object} Formatted status
   */
  formatFilingStatus: (status) => {
    const statusMap = {
      draft: { label: 'Draft', color: 'gray', icon: 'draft' },
      review: { label: 'Under Review', color: 'blue', icon: 'review' },
      submitted: { label: 'Submitted', color: 'yellow', icon: 'pending' },
      accepted: { label: 'Accepted', color: 'green', icon: 'check' },
      rejected: { label: 'Rejected', color: 'red', icon: 'error' }
    };

    return statusMap[status] || { label: status, color: 'gray', icon: 'info' };
  }
};

export default filingService;
