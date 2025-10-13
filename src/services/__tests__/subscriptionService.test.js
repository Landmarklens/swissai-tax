/**
 * Tests for Subscription Service
 * Tests all subscription service methods and API interactions
 */
import subscriptionService from '../subscriptionService';
import { api } from '../api';

// Mock api service
jest.mock('../api');

describe('Subscription Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentSubscription', () => {
    it('should fetch current subscription successfully', async () => {
      const mockSubscription = {
        id: 'sub_123',
        plan_type: 'basic',
        status: 'active',
        price_chf: 49.00
      };

      api.get.mockResolvedValue({ data: mockSubscription });

      const result = await subscriptionService.getCurrentSubscription();

      expect(api.get).toHaveBeenCalledWith('/api/subscription/current');
      expect(result).toEqual({ success: true, data: mockSubscription });
    });

    it('should handle null subscription (no subscription)', async () => {
      api.get.mockResolvedValue({ data: null });

      const result = await subscriptionService.getCurrentSubscription();

      expect(result).toEqual({ success: true, data: null });
    });

    it('should handle API error', async () => {
      const mockError = {
        response: {
          data: {
            detail: 'Unauthorized'
          }
        }
      };

      api.get.mockRejectedValue(mockError);

      const result = await subscriptionService.getCurrentSubscription();

      expect(result).toEqual({ success: false, error: 'Unauthorized' });
    });
  });

  describe('createSetupIntent', () => {
    it('should create setup intent successfully', async () => {
      const mockResponse = {
        client_secret: 'seti_123_secret',
        setup_intent_id: 'seti_123'
      };

      api.post.mockResolvedValue({ data: mockResponse });

      const result = await subscriptionService.createSetupIntent('basic');

      expect(api.post).toHaveBeenCalledWith('/api/subscription/setup-intent', {
        plan_type: 'basic'
      });
      expect(result).toEqual({ success: true, data: mockResponse });
    });

    it('should handle setup intent creation error', async () => {
      const mockError = {
        response: {
          data: {
            detail: 'Invalid plan type'
          }
        }
      };

      api.post.mockRejectedValue(mockError);

      const result = await subscriptionService.createSetupIntent('invalid_plan');

      expect(result).toEqual({ success: false, error: 'Invalid plan type' });
    });

    it('should handle error without detail', async () => {
      api.post.mockRejectedValue(new Error('Network error'));

      const result = await subscriptionService.createSetupIntent('basic');

      expect(result).toEqual({ success: false, error: 'Failed to create setup intent' });
    });
  });

  describe('createSubscription', () => {
    it('should create subscription with payment method', async () => {
      const mockSubscription = {
        id: 'sub_123',
        plan_type: 'pro',
        status: 'trialing',
        trial_end: '2025-11-10'
      };

      api.post.mockResolvedValue({ data: mockSubscription });

      const result = await subscriptionService.createSubscription('pro', 'pm_123');

      expect(api.post).toHaveBeenCalledWith('/api/subscription/create', {
        plan_type: 'pro',
        payment_method_id: 'pm_123'
      });
      expect(result).toEqual({ success: true, data: mockSubscription });
    });

    it('should create subscription without payment method', async () => {
      const mockSubscription = {
        id: 'sub_123',
        plan_type: 'basic',
        status: 'trialing'
      };

      api.post.mockResolvedValue({ data: mockSubscription });

      const result = await subscriptionService.createSubscription('basic');

      expect(api.post).toHaveBeenCalledWith('/api/subscription/create', {
        plan_type: 'basic',
        payment_method_id: null
      });
      expect(result).toEqual({ success: true, data: mockSubscription });
    });

    it('should handle subscription creation error', async () => {
      const mockError = {
        response: {
          data: {
            detail: 'User already has an active subscription'
          }
        }
      };

      api.post.mockRejectedValue(mockError);

      const result = await subscriptionService.createSubscription('basic', 'pm_123');

      expect(result).toEqual({ success: false, error: 'User already has an active subscription' });
    });
  });

  describe('createFreeSubscription', () => {
    it('should create free subscription successfully', async () => {
      const mockSubscription = {
        id: 'sub_free',
        plan_type: 'free',
        status: 'active',
        price_chf: 0.00
      };

      api.post.mockResolvedValue({ data: mockSubscription });

      const result = await subscriptionService.createFreeSubscription();

      expect(api.post).toHaveBeenCalledWith('/api/subscription/create', {
        plan_type: 'free',
        payment_method_id: null
      });
      expect(result).toEqual(mockSubscription);
    });

    it('should handle free subscription error', async () => {
      const mockError = {
        response: {
          data: {
            detail: 'Free subscription not allowed'
          }
        }
      };

      api.post.mockRejectedValue(mockError);

      await expect(subscriptionService.createFreeSubscription()).rejects.toThrow(
        'Free subscription not allowed'
      );
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel subscription with reason', async () => {
      const mockResponse = {
        id: 'sub_123',
        status: 'canceled',
        cancel_at_period_end: true
      };

      api.post.mockResolvedValue({ data: mockResponse });

      const result = await subscriptionService.cancelSubscription('Too expensive');

      expect(api.post).toHaveBeenCalledWith('/api/subscription/cancel', { reason: 'Too expensive' });
      expect(result).toEqual({ success: true, data: mockResponse, message: 'Subscription canceled successfully' });
    });

    it('should cancel subscription without reason', async () => {
      const mockResponse = {
        id: 'sub_123',
        status: 'canceled'
      };

      api.post.mockResolvedValue({ data: mockResponse });

      const result = await subscriptionService.cancelSubscription();

      expect(api.post).toHaveBeenCalledWith('/api/subscription/cancel', { reason: null });
      expect(result).toEqual({ success: true, data: mockResponse, message: 'Subscription canceled successfully' });
    });

    it('should handle cancellation error', async () => {
      const mockError = {
        response: {
          data: {
            detail: 'Cannot cancel 5-year plan after trial'
          }
        }
      };

      api.post.mockRejectedValue(mockError);

      const result = await subscriptionService.cancelSubscription('Test');

      expect(result).toEqual({ success: false, error: 'Cannot cancel 5-year plan after trial' });
    });
  });

  describe('switchPlan', () => {
    it('should switch plan successfully', async () => {
      const mockResponse = {
        id: 'sub_123',
        plan_type: 'premium',
        status: 'trialing'
      };

      api.post.mockResolvedValue({ data: mockResponse });

      const result = await subscriptionService.switchPlan('premium', 'Need more features');

      expect(api.post).toHaveBeenCalledWith('/api/subscription/switch', {
        new_plan_type: 'premium',
        reason: 'Need more features'
      });
      expect(result).toEqual({ success: true, data: mockResponse, message: 'Plan switched successfully' });
    });

    it('should switch plan without reason', async () => {
      const mockResponse = {
        id: 'sub_123',
        plan_type: 'basic'
      };

      api.post.mockResolvedValue({ data: mockResponse });

      const result = await subscriptionService.switchPlan('basic');

      expect(api.post).toHaveBeenCalledWith('/api/subscription/switch', {
        new_plan_type: 'basic',
        reason: null
      });
      expect(result).toEqual({ success: true, data: mockResponse, message: 'Plan switched successfully' });
    });

    it('should handle switch plan error', async () => {
      const mockError = {
        response: {
          data: {
            detail: 'Plan switching only allowed during trial'
          }
        }
      };

      api.post.mockRejectedValue(mockError);

      const result = await subscriptionService.switchPlan('pro');

      expect(result).toEqual({ success: false, error: 'Plan switching only allowed during trial' });
    });
  });

  describe('pauseSubscription', () => {
    it('should pause subscription with resume date', async () => {
      const mockResponse = {
        id: 'sub_123',
        pause_requested: true,
        pause_reason: 'Financial difficulty'
      };

      const resumeDate = new Date('2026-01-01');
      api.post.mockResolvedValue({ data: mockResponse });

      const result = await subscriptionService.pauseSubscription(
        'Financial difficulty',
        resumeDate
      );

      expect(api.post).toHaveBeenCalledWith('/api/subscription/pause', {
        reason: 'Financial difficulty',
        resume_date: resumeDate.toISOString()
      });
      expect(result).toEqual({ success: true, data: mockResponse, message: 'Pause request submitted successfully' });
    });

    it('should pause subscription without resume date', async () => {
      const mockResponse = {
        id: 'sub_123',
        pause_requested: true
      };

      api.post.mockResolvedValue({ data: mockResponse });

      const result = await subscriptionService.pauseSubscription('Taking a break');

      expect(api.post).toHaveBeenCalledWith('/api/subscription/pause', {
        reason: 'Taking a break',
        resume_date: null
      });
      expect(result).toEqual({ success: true, data: mockResponse, message: 'Pause request submitted successfully' });
    });

    it('should handle pause error', async () => {
      const mockError = {
        response: {
          data: {
            detail: 'No active subscription to pause'
          }
        }
      };

      api.post.mockRejectedValue(mockError);

      const result = await subscriptionService.pauseSubscription('Test');

      expect(result).toEqual({ success: false, error: 'No active subscription to pause' });
    });
  });

  describe('getInvoices', () => {
    it('should fetch invoices successfully', async () => {
      const mockInvoices = [
        { id: 'in_1', amount_paid: 4900, status: 'paid' },
        { id: 'in_2', amount_paid: 4900, status: 'paid' }
      ];

      api.get.mockResolvedValue({ data: mockInvoices });

      const result = await subscriptionService.getInvoices();

      expect(api.get).toHaveBeenCalledWith('/api/subscription/invoices', { params: { limit: 50 } });
      expect(result).toEqual({ success: true, data: mockInvoices });
    });

    it('should return empty array when no invoices', async () => {
      api.get.mockResolvedValue({ data: [] });

      const result = await subscriptionService.getInvoices();

      expect(result).toEqual({ success: true, data: [] });
    });

    it('should handle invoices fetch error', async () => {
      const mockError = {
        response: {
          data: {
            detail: 'No Stripe customer ID'
          }
        }
      };

      api.get.mockRejectedValue(mockError);

      const result = await subscriptionService.getInvoices();

      expect(result).toEqual({ success: false, error: 'No Stripe customer ID' });
    });
  });

  describe('getPlanDetails', () => {
    it('should return annual_flex plan details', () => {
      const result = subscriptionService.getPlanDetails('annual_flex');

      expect(result).toEqual({
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
      });
    });

    it('should return 5_year_lock plan details', () => {
      const result = subscriptionService.getPlanDetails('5_year_lock');

      expect(result).toEqual({
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
      });
    });

    it('should return null for invalid plan type', () => {
      const result = subscriptionService.getPlanDetails('invalid_plan');

      expect(result).toBeNull();
    });
  });

  describe('calculateSavings', () => {
    it('should calculate savings for 5-year plan correctly', () => {
      const result = subscriptionService.calculateSavings();

      expect(result).toEqual({
        savingsPerYear: 40,
        totalSavings: 200,
        percentSavings: 31
      });
    });
  });

  describe('getStripePublishableKey', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should return publishable key from environment', () => {
      process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY = 'pk_test_123';

      const result = subscriptionService.getStripePublishableKey();

      expect(result).toBe('pk_test_123');
    });

    it('should return undefined if key not set', () => {
      delete process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;

      const result = subscriptionService.getStripePublishableKey();

      expect(result).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      api.get.mockRejectedValue(new Error('Network error'));

      const result = await subscriptionService.getCurrentSubscription();

      expect(result).toEqual({ success: false, error: 'Failed to fetch subscription' });
    });

    it('should handle 500 server errors', async () => {
      const mockError = {
        response: {
          status: 500,
          data: {
            detail: 'Internal server error'
          }
        }
      };

      api.get.mockRejectedValue(mockError);

      const result = await subscriptionService.getCurrentSubscription();

      expect(result).toEqual({ success: false, error: 'Internal server error' });
    });

    it('should handle 401 unauthorized errors', async () => {
      const mockError = {
        response: {
          status: 401,
          data: {
            detail: 'Unauthorized'
          }
        }
      };

      api.post.mockRejectedValue(mockError);

      const result = await subscriptionService.createSubscription('basic', 'pm_123');

      expect(result).toEqual({ success: false, error: 'Unauthorized' });
    });
  });
});
