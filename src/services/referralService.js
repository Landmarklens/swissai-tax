/**
 * Referral Service
 * Handles referral code management and discount validation
 */

import { api } from './api';

const referralService = {
  /**
   * Get user's personal referral code
   * @returns {Promise} User's referral code
   */
  getMyReferralCode: async () => {
    try {
      const response = await api.get('/api/referrals/my-code');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch referral code'
      };
    }
  },

  /**
   * Get user's referral statistics
   * @returns {Promise} Referral stats including total referrals, rewards, etc.
   */
  getMyReferralStats: async () => {
    try {
      const response = await api.get('/api/referrals/my-stats');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch referral stats'
      };
    }
  },

  /**
   * Get user's account credit history
   * @returns {Promise} List of credit transactions
   */
  getMyCredits: async () => {
    try {
      const response = await api.get('/api/referrals/my-credits');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch account credits'
      };
    }
  },

  /**
   * Validate a discount code
   * @param {string} code - The discount code to validate
   * @param {string} planType - The subscription plan type
   * @returns {Promise} Validation result with discount details
   */
  validateDiscountCode: async (code, planType) => {
    try {
      const response = await api.post('/api/referrals/validate-code', {
        code,
        plan_type: planType
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to validate discount code'
      };
    }
  },

  /**
   * Create a promotional code (admin only)
   * @param {Object} codeData - Code configuration
   * @returns {Promise} Created code details
   */
  createPromotionalCode: async (codeData) => {
    try {
      const response = await api.post('/api/referrals/admin/create-code', codeData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to create promotional code'
      };
    }
  },

  /**
   * Copy text to clipboard
   * @param {string} text - Text to copy
   * @returns {Promise<boolean>} Success status
   */
  copyToClipboard: async (text) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const result = document.execCommand('copy');
        textArea.remove();
        return result;
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  },

  /**
   * Generate shareable referral link
   * @param {string} code - Referral code
   * @returns {string} Full shareable URL
   */
  generateReferralLink: (code) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/plan?ref=${code}`;
  },

  /**
   * Format currency amount
   * @param {number} amount - Amount to format
   * @param {string} currency - Currency code (default CHF)
   * @returns {string} Formatted currency string
   */
  formatCurrency: (amount, currency = 'CHF') => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: currency
    }).format(amount);
  },

  /**
   * Format date for display
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted date
   */
  formatDate: (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  },

  /**
   * Calculate discount amount
   * @param {number} originalPrice - Original price
   * @param {Object} discountInfo - Discount information
   * @returns {Object} Calculated discount details
   */
  calculateDiscount: (originalPrice, discountInfo) => {
    if (!discountInfo || !discountInfo.is_valid) {
      return {
        discountAmount: 0,
        finalPrice: originalPrice,
        discountPercent: 0
      };
    }

    const discountAmount = discountInfo.discount_amount_chf || 0;
    const finalPrice = discountInfo.final_price_chf || originalPrice;
    const discountPercent = originalPrice > 0
      ? Math.round((discountAmount / originalPrice) * 100)
      : 0;

    return {
      discountAmount,
      finalPrice,
      discountPercent
    };
  }
};

export default referralService;
