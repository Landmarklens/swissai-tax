/**
 * Unit tests for referralService
 */

import referralService from './referralService';
import { api } from './api';

jest.mock('./api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn()
  }
}));

describe('referralService', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock navigator.clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn(),
      },
    });

    // Mock window.location
    delete window.location;
    window.location = { origin: 'https://swissaitax.com' };
  });

  describe('getMyReferralCode', () => {
    it('should fetch user referral code successfully', async () => {
      const mockResponse = {
        data: {
          code: 'TESTCODE123',
          created_at: '2025-01-15T10:00:00Z'
        }
      };
      api.get.mockResolvedValue(mockResponse);

      const result = await referralService.getMyReferralCode();

      expect(api.get).toHaveBeenCalledWith('/api/referrals/my-code');
      expect(result).toEqual({
        success: true,
        data: mockResponse.data
      });
    });

    it('should handle error when fetching referral code', async () => {
      const error = {
        response: {
          data: { detail: 'No referral code found' }
        }
      };
      api.get.mockRejectedValue(error);

      const result = await referralService.getMyReferralCode();

      expect(result).toEqual({
        success: false,
        error: 'No referral code found'
      });
    });

    it('should handle network error', async () => {
      const error = new Error('Network error');
      api.get.mockRejectedValue(error);

      const result = await referralService.getMyReferralCode();

      expect(result).toEqual({
        success: false,
        error: 'Failed to fetch referral code'
      });
    });
  });

  describe('getMyReferralStats', () => {
    it('should fetch user referral stats successfully', async () => {
      const mockResponse = {
        data: {
          total_referrals: 5,
          successful_conversions: 3,
          total_earned_chf: 30,
          available_credit_chf: 15
        }
      };
      api.get.mockResolvedValue(mockResponse);

      const result = await referralService.getMyReferralStats();

      expect(api.get).toHaveBeenCalledWith('/api/referrals/my-stats');
      expect(result).toEqual({
        success: true,
        data: mockResponse.data
      });
    });

    it('should handle error when fetching stats', async () => {
      const error = {
        response: {
          data: { detail: 'Stats unavailable' }
        }
      };
      api.get.mockRejectedValue(error);

      const result = await referralService.getMyReferralStats();

      expect(result).toEqual({
        success: false,
        error: 'Stats unavailable'
      });
    });
  });

  describe('getMyCredits', () => {
    it('should fetch user credits successfully', async () => {
      const mockResponse = {
        data: {
          credits: [
            {
              id: 1,
              credit_type: 'referral_reward',
              amount_chf: 10,
              created_at: '2025-01-15T10:00:00Z',
              description: 'Reward for referring user@example.com'
            }
          ],
          total_balance: 10
        }
      };
      api.get.mockResolvedValue(mockResponse);

      const result = await referralService.getMyCredits();

      expect(api.get).toHaveBeenCalledWith('/api/referrals/my-credits');
      expect(result).toEqual({
        success: true,
        data: mockResponse.data
      });
    });

    it('should handle error when fetching credits', async () => {
      const error = {
        response: {
          data: { detail: 'Credits unavailable' }
        }
      };
      api.get.mockRejectedValue(error);

      const result = await referralService.getMyCredits();

      expect(result).toEqual({
        success: false,
        error: 'Credits unavailable'
      });
    });
  });

  describe('validateDiscountCode', () => {
    it('should validate a valid discount code', async () => {
      const mockResponse = {
        data: {
          is_valid: true,
          code: 'TESTCODE',
          discount_type: 'percentage',
          discount_value: 10,
          final_price_chf: 116.10,
          original_price_chf: 129,
          savings_chf: 12.90
        }
      };
      api.post.mockResolvedValue(mockResponse);

      const result = await referralService.validateDiscountCode('TESTCODE', 'annual_flex');

      expect(api.post).toHaveBeenCalledWith('/api/referrals/validate-code', {
        code: 'TESTCODE',
        plan_type: 'annual_flex'
      });
      expect(result).toEqual({
        success: true,
        data: mockResponse.data
      });
    });

    it('should handle invalid discount code', async () => {
      const mockResponse = {
        data: {
          is_valid: false,
          error_message: 'Code not found'
        }
      };
      api.post.mockResolvedValue(mockResponse);

      const result = await referralService.validateDiscountCode('INVALID', 'annual_flex');

      expect(result).toEqual({
        success: true,
        data: mockResponse.data
      });
    });

    it('should handle validation error', async () => {
      const error = {
        response: {
          data: { detail: 'Validation failed' }
        }
      };
      api.post.mockRejectedValue(error);

      const result = await referralService.validateDiscountCode('TEST', 'annual_flex');

      expect(result).toEqual({
        success: false,
        error: 'Validation failed'
      });
    });
  });

  describe('createPromotionalCode', () => {
    it('should create promotional code successfully', async () => {
      const codeData = {
        code: 'PROMO2025',
        discount_type: 'percentage',
        discount_value: 15,
        applicable_plans: ['annual_flex'],
        valid_until: '2025-12-31T23:59:59Z'
      };
      const mockResponse = {
        data: {
          id: 1,
          ...codeData,
          created_at: '2025-01-15T10:00:00Z'
        }
      };
      api.post.mockResolvedValue(mockResponse);

      const result = await referralService.createPromotionalCode(codeData);

      expect(api.post).toHaveBeenCalledWith('/api/referrals/admin/create-code', codeData);
      expect(result).toEqual({
        success: true,
        data: mockResponse.data
      });
    });

    it('should handle duplicate code error', async () => {
      const error = {
        response: {
          data: { detail: 'Code already exists' }
        }
      };
      api.post.mockRejectedValue(error);

      const result = await referralService.createPromotionalCode({ code: 'DUPLICATE' });

      expect(result).toEqual({
        success: false,
        error: 'Code already exists'
      });
    });
  });

  describe('copyToClipboard', () => {
    it('should copy text to clipboard successfully', async () => {
      // Mock window.isSecureContext
      Object.defineProperty(window, 'isSecureContext', {
        writable: true,
        value: true
      });

      navigator.clipboard.writeText.mockResolvedValue();

      const result = await referralService.copyToClipboard('TESTCODE');

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('TESTCODE');
      expect(result).toBe(true);
    });

    it('should handle clipboard error and return false', async () => {
      Object.defineProperty(window, 'isSecureContext', {
        writable: true,
        value: true
      });

      navigator.clipboard.writeText.mockRejectedValue(new Error('Clipboard error'));

      const result = await referralService.copyToClipboard('TESTCODE');

      expect(result).toBe(false);
    });

    it('should handle missing clipboard API and return false', async () => {
      Object.defineProperty(window, 'isSecureContext', {
        writable: true,
        value: false
      });

      const result = await referralService.copyToClipboard('TESTCODE');

      // Should return false because fallback (document.execCommand) is not available in test environment
      expect(result).toBe(false);
    });
  });

  describe('generateReferralLink', () => {
    it('should generate referral link with code', () => {
      const link = referralService.generateReferralLink('TESTCODE123');

      expect(link).toBe('https://swissaitax.com/plan?ref=TESTCODE123');
    });

    it('should handle empty code', () => {
      const link = referralService.generateReferralLink('');

      expect(link).toBe('https://swissaitax.com/plan?ref=');
    });
  });

  describe('formatCurrency', () => {
    it('should format CHF currency correctly', () => {
      const formatted = referralService.formatCurrency(129.99);

      // Should contain CHF and the amount
      expect(formatted).toContain('CHF');
      expect(formatted).toContain('129');
    });

    it('should format CHF with no decimals', () => {
      const formatted = referralService.formatCurrency(129);

      expect(formatted).toContain('CHF');
      expect(formatted).toContain('129');
    });

    it('should format USD currency', () => {
      const formatted = referralService.formatCurrency(99.99, 'USD');

      // Should contain the currency symbol or code and amount
      expect(formatted).toContain('99');
    });

    it('should handle zero amount', () => {
      const formatted = referralService.formatCurrency(0);

      expect(formatted).toContain('CHF');
      expect(formatted).toContain('0');
    });

    it('should handle negative amount', () => {
      const formatted = referralService.formatCurrency(-10.50);

      expect(formatted).toContain('10');
    });

    it('should return a string', () => {
      const formatted = referralService.formatCurrency(100);
      expect(typeof formatted).toBe('string');
    });
  });

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const formatted = referralService.formatDate('2025-01-15T10:30:00Z');

      // Format is "15 Jan 2025" based on en-GB locale
      expect(formatted).toContain('2025');
      expect(formatted).toContain('Jan');
      expect(typeof formatted).toBe('string');
    });

    it('should handle null date', () => {
      const formatted = referralService.formatDate(null);

      expect(formatted).toBe('N/A');
    });

    it('should handle undefined date', () => {
      const formatted = referralService.formatDate(undefined);

      expect(formatted).toBe('N/A');
    });

    it('should handle invalid date string', () => {
      const formatted = referralService.formatDate('invalid-date');

      expect(formatted).toBe('Invalid Date');
    });

    it('should format different dates correctly', () => {
      const formatted = referralService.formatDate('2024-12-25T00:00:00Z');

      expect(formatted).toContain('2024');
      expect(formatted).toContain('Dec');
    });
  });

  describe('calculateDiscount', () => {
    it('should calculate discount with valid discount info', () => {
      const discountInfo = {
        is_valid: true,
        discount_amount_chf: 12.90,
        final_price_chf: 116.10
      };

      const result = referralService.calculateDiscount(129, discountInfo);

      expect(result).toEqual({
        discountAmount: 12.90,
        finalPrice: 116.10,
        discountPercent: 10
      });
    });

    it('should calculate discount with fixed amount', () => {
      const discountInfo = {
        is_valid: true,
        discount_amount_chf: 20,
        final_price_chf: 109
      };

      const result = referralService.calculateDiscount(129, discountInfo);

      expect(result).toEqual({
        discountAmount: 20,
        finalPrice: 109,
        discountPercent: 16
      });
    });

    it('should handle null discount info', () => {
      const result = referralService.calculateDiscount(129, null);

      expect(result).toEqual({
        discountAmount: 0,
        finalPrice: 129,
        discountPercent: 0
      });
    });

    it('should handle missing discount info', () => {
      const result = referralService.calculateDiscount(129);

      expect(result).toEqual({
        discountAmount: 0,
        finalPrice: 129,
        discountPercent: 0
      });
    });

    it('should handle invalid discount info', () => {
      const discountInfo = {
        is_valid: false,
        discount_amount_chf: 10,
        final_price_chf: 119
      };

      const result = referralService.calculateDiscount(129, discountInfo);

      expect(result).toEqual({
        discountAmount: 0,
        finalPrice: 129,
        discountPercent: 0
      });
    });

    it('should handle zero original price', () => {
      const discountInfo = {
        is_valid: true,
        discount_amount_chf: 0,
        final_price_chf: 0
      };

      const result = referralService.calculateDiscount(0, discountInfo);

      expect(result).toEqual({
        discountAmount: 0,
        finalPrice: 0,
        discountPercent: 0
      });
    });
  });
});
