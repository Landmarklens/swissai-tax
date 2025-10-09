/**
 * Payment Service
 * Handles payment and subscription management for SwissAI Tax
 */

import { paymentAPI } from './api';
import { useTranslation } from 'react-i18next';

const paymentService = {
  /**
   * Create a Stripe payment intent
   * @param {Object} data - Payment data (plan_type, filing_id)
   * @returns {Promise} Payment intent result
   */
  createPaymentIntent: async (data) => {
    try {
      const response = await paymentAPI.createPaymentIntent(data);
      return {
        success: true,
        data: response.data,
        clientSecret: response.data.client_secret,
        paymentIntentId: response.data.payment_intent_id,
        amount: response.data.amount_chf
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to create payment intent'
      };
    }
  },

  /**
   * Get plan pricing information
   * @returns {Object} Plan pricing
   */
  getPlanPricing: () => {
    return {
      basic: {
        name: 'Basic',
        price: 0,
        currency: 'CHF',
        features: [
          'Single tax return',
          'Basic deductions',
          'Email support'
        ]
      },
      standard: {
        name: 'Standard',
        price: 39,
        currency: 'CHF',
        features: [
          'Multiple tax returns',
          'All deductions',
          'Priority email support',
          'Document upload & OCR'
        ],
        popular: true
      },
      premium: {
        name: 'Premium',
        price: 99,
        currency: 'CHF',
        features: [
          'Unlimited tax returns',
          'All deductions & optimizations',
          'Phone & email support',
          'Document upload & OCR',
          'Tax expert review',
          'Audit protection'
        ]
      }
    };
  },

  /**
   * Format currency for display
   * @param {number} amount - Amount in CHF
   * @param {string} locale - Locale (default: 'de-CH')
   * @returns {string} Formatted currency
   */
  formatCurrency: (amount, locale = 'de-CH') => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'CHF'
    }).format(amount);
  },

  /**
   * Validate payment data
   * @param {Object} data - Payment data
   * @returns {Object} Validation result
   */
  validatePaymentData: (data) => {
    const errors = {};

    if (!data.plan_type) {
      errors.plan_type = 'Plan type is required';
    }

    if (!['basic', 'standard', 'premium'].includes(data.plan_type)) {
      errors.plan_type = 'Invalid plan type';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
};

export default paymentService;
