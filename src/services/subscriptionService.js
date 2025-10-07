/**
 * Subscription Service
 * Handles subscription management for SwissAI Tax
 */

import { subscriptionAPI } from './api';

const subscriptionService = {
  /**
   * Get current user subscription
   * @returns {Promise} Current subscription or null
   */
  getCurrentSubscription: async () => {
    try {
      const response = await subscriptionAPI.getCurrentSubscription();
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch subscription'
      };
    }
  },

  /**
   * Cancel subscription
   * @param {boolean} immediately - Cancel immediately or at period end
   * @returns {Promise} Updated subscription
   */
  cancelSubscription: async (immediately = false) => {
    try {
      const response = await subscriptionAPI.cancelSubscription({ immediately });
      return {
        success: true,
        data: response.data,
        message: immediately
          ? 'Subscription canceled immediately'
          : 'Subscription will be canceled at the end of the billing period'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to cancel subscription'
      };
    }
  },

  /**
   * Get billing history (invoices)
   * @returns {Promise} List of invoices
   */
  getInvoices: async () => {
    try {
      const response = await subscriptionAPI.getInvoices();
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch invoices'
      };
    }
  },

  /**
   * Format date for display
   * @param {string} dateString - ISO date string
   * @param {string} locale - Locale (default: 'en-GB')
   * @returns {string} Formatted date
   */
  formatDate: (dateString, locale = 'en-GB') => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString(locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  },

  /**
   * Get payment method display text
   * @param {Object} subscription - Subscription object
   * @returns {string} Payment method text
   */
  getPaymentMethodText: (subscription) => {
    if (!subscription) return 'No payment method';

    // This would come from Stripe payment method data
    return 'Card on file';
  }
};

export default subscriptionService;
