/**
 * Subscription Service
 * Handles subscription management for SwissAI Tax
 */

import { api } from './api';

const subscriptionService = {
  /**
   * Create a SetupIntent for collecting payment method
   * @param {string} planType - 'annual_flex' or '5_year_lock'
   * @returns {Promise} SetupIntent client secret
   */
  createSetupIntent: async (planType) => {
    try {
      const response = await api.post('/api/subscription/setup-intent', {
        plan_type: planType
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to create setup intent'
      };
    }
  },

  /**
   * Create a new subscription
   * @param {string} planType - 'annual_flex' or '5_year_lock'
   * @param {string} paymentMethodId - Stripe payment method ID (optional)
   * @returns {Promise} Subscription details
   */
  createSubscription: async (planType, paymentMethodId = null) => {
    try {
      const response = await api.post('/api/subscription/create', {
        plan_type: planType,
        payment_method_id: paymentMethodId
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to create subscription'
      };
    }
  },

  /**
   * Create a free subscription (no Stripe required)
   * @returns {Promise} Subscription details
   */
  createFreeSubscription: async () => {
    try {
      const response = await api.post('/api/subscription/create', {
        plan_type: 'free',
        payment_method_id: null
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to create free subscription');
    }
  },

  /**
   * Get current user subscription
   * @returns {Promise} Current subscription or null
   */
  getCurrentSubscription: async () => {
    try {
      const response = await api.get('/api/subscription/current');
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
   * @param {string} reason - Cancellation reason
   * @returns {Promise} Updated subscription
   */
  cancelSubscription: async (reason = null) => {
    try {
      const response = await api.post('/api/subscription/cancel', { reason });
      return {
        success: true,
        data: response.data,
        message: 'Subscription canceled successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to cancel subscription'
      };
    }
  },

  /**
   * Switch subscription plan
   * @param {string} newPlanType - 'annual_flex' or '5_year_lock'
   * @param {string} reason - Reason for switching
   * @returns {Promise} Updated subscription
   */
  switchPlan: async (newPlanType, reason = null) => {
    try {
      const response = await api.post('/api/subscription/switch', {
        new_plan_type: newPlanType,
        reason
      });
      return {
        success: true,
        data: response.data,
        message: 'Plan switched successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to switch plan'
      };
    }
  },

  /**
   * Request to pause subscription
   * @param {string} reason - Reason for pausing
   * @param {Date} resumeDate - When to resume (optional)
   * @returns {Promise} Updated subscription
   */
  pauseSubscription: async (reason, resumeDate = null) => {
    try {
      const response = await api.post('/api/subscription/pause', {
        reason,
        resume_date: resumeDate ? resumeDate.toISOString() : null
      });
      return {
        success: true,
        data: response.data,
        message: 'Pause request submitted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to request pause'
      };
    }
  },

  /**
   * Get billing history (invoices)
   * @param {number} limit - Maximum number of invoices to fetch
   * @returns {Promise} List of invoices
   */
  getInvoices: async (limit = 50) => {
    try {
      const response = await api.get('/api/subscription/invoices', {
        params: { limit }
      });
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
  },

  /**
   * Get plan details
   * @param {string} planType - 'annual_flex' or '5_year_lock'
   * @returns {Object} Plan details
   */
  getPlanDetails: (planType) => {
    const plans = {
      annual_flex: {
        name: 'Annual Flex',
        price: 129,
        commitment: 1,
        description: 'Cancel anytime, pay annually',
        features: [
          'All tax filing features',
          'Document management',
          'Tax optimization insights',
          'Cancel anytime'
        ]
      },
      '5_year_lock': {
        name: '5-Year Price Lock',
        price: 89,
        commitment: 5,
        description: 'Lock in lowest price for 5 years',
        features: [
          'All tax filing features',
          'Document management',
          'Tax optimization insights',
          'Price locked for 5 years',
          'Save CHF 200/year'
        ]
      }
    };

    return plans[planType] || null;
  },

  /**
   * Calculate savings for 5-year plan
   * @returns {Object} Savings breakdown
   */
  calculateSavings: () => {
    const annualFlexPrice = 129;
    const fiveYearLockPrice = 89;
    const savingsPerYear = annualFlexPrice - fiveYearLockPrice;
    const totalSavings = savingsPerYear * 5;

    return {
      savingsPerYear,
      totalSavings,
      percentSavings: Math.round((savingsPerYear / annualFlexPrice) * 100)
    };
  },

  /**
   * Get Stripe publishable key
   * @returns {string} Stripe publishable key
   */
  getStripePublishableKey: () => {
    return process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
  }
};

export default subscriptionService;
