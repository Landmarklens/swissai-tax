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

      await expect(subscriptionService.getCurrentSubscription()).rejects.toThrow();
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
      expect(result).toEqual(mockResponse);
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

      await expect(
        subscriptionService.createSetupIntent('invalid_plan')
      ).rejects.toThrow('Invalid plan type');
    });

    it('should handle error without detail', async () => {
      api.post.mockRejectedValue(new Error('Network error'));

      await expect(
        subscriptionService.createSetupIntent('basic')
      ).rejects.toThrow('Failed to create setup intent');
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
      expect(result).toEqual(mockSubscription);
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
      expect(result).toEqual(mockSubscription);
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

      await expect(
        subscriptionService.createSubscription('basic', 'pm_123')
      ).rejects.toThrow('User already has an active subscription');
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

      expect(api.post).toHaveBeenCalledWith('/api/subscription/cancel', {
        reason: 'Too expensive'
      });
      expect(result).toEqual(mockResponse);
    });

    it('should cancel subscription without reason', async () => {
      const mockResponse = {
        id: 'sub_123',
        status: 'canceled'
      };

      api.post.mockResolvedValue({ data: mockResponse });

      const result = await subscriptionService.cancelSubscription();

      expect(api.post).toHaveBeenCalledWith('/api/subscription/cancel', {
        reason: null
      });
      expect(result).toEqual(mockResponse);
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

      await expect(
        subscriptionService.cancelSubscription('Test')
      ).rejects.toThrow('Cannot cancel 5-year plan after trial');
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
      expect(result).toEqual(mockResponse);
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
      expect(result).toEqual(mockResponse);
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

      await expect(
        subscriptionService.switchPlan('pro')
      ).rejects.toThrow('Plan switching only allowed during trial');
    });
  });

  describe('pauseSubscription', () => {
    it('should pause subscription with resume date', async () => {
      const mockResponse = {
        id: 'sub_123',
        pause_requested: true,
        pause_reason: 'Financial difficulty'
      };

      api.post.mockResolvedValue({ data: mockResponse });

      const result = await subscriptionService.pauseSubscription(
        'Financial difficulty',
        '2026-01-01'
      );

      expect(api.post).toHaveBeenCalledWith('/api/subscription/pause', {
        reason: 'Financial difficulty',
        resume_date: '2026-01-01'
      });
      expect(result).toEqual(mockResponse);
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
      expect(result).toEqual(mockResponse);
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

      await expect(
        subscriptionService.pauseSubscription('Test')
      ).rejects.toThrow('No active subscription to pause');
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

      expect(api.get).toHaveBeenCalledWith('/api/subscription/invoices');
      expect(result).toEqual(mockInvoices);
    });

    it('should return empty array when no invoices', async () => {
      api.get.mockResolvedValue({ data: [] });

      const result = await subscriptionService.getInvoices();

      expect(result).toEqual([]);
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

      await expect(subscriptionService.getInvoices()).rejects.toThrow(
        'No Stripe customer ID'
      );
    });
  });

  describe('getPlanDetails', () => {
    it('should return free plan details', () => {
      const result = subscriptionService.getPlanDetails('free');

      expect(result).toEqual({
        name: 'Free',
        price: 0,
        currency: 'CHF',
        commitment: 0,
        features: ['1 basic tax filing per year', 'Community support']
      });
    });

    it('should return basic plan details', () => {
      const result = subscriptionService.getPlanDetails('basic');

      expect(result).toEqual({
        name: 'Basic',
        price: 49,
        currency: 'CHF',
        commitment: 1,
        features: ['1 complete tax filing', 'Email support', 'Swiss data encryption']
      });
    });

    it('should return pro plan details', () => {
      const result = subscriptionService.getPlanDetails('pro');

      expect(result).toEqual({
        name: 'Pro',
        price: 99,
        currency: 'CHF',
        commitment: 1,
        features: [
          'Everything in Basic',
          'AI optimization',
          'Multi-canton comparison',
          'Priority support'
        ]
      });
    });

    it('should return premium plan details', () => {
      const result = subscriptionService.getPlanDetails('premium');

      expect(result).toEqual({
        name: 'Premium',
        price: 149,
        currency: 'CHF',
        commitment: 1,
        features: [
          'Everything in Pro',
          'Tax expert review',
          'Phone/video consultation',
          'Audit assistance'
        ]
      });
    });

    it('should return null for invalid plan type', () => {
      const result = subscriptionService.getPlanDetails('invalid_plan');

      expect(result).toBeNull();
    });
  });

  describe('calculateSavings', () => {
    it('should calculate savings correctly', () => {
      const result = subscriptionService.calculateSavings('pro', 'premium');

      expect(result).toEqual({
        monthly: 4.17,
        annual: 50,
        percentage: 33.6
      });
    });

    it('should return null for invalid plan types', () => {
      const result = subscriptionService.calculateSavings('invalid', 'premium');

      expect(result).toBeNull();
    });

    it('should handle same plan comparison', () => {
      const result = subscriptionService.calculateSavings('basic', 'basic');

      expect(result).toEqual({
        monthly: 0,
        annual: 0,
        percentage: 0
      });
    });

    it('should handle downgrade (negative savings)', () => {
      const result = subscriptionService.calculateSavings('premium', 'basic');

      expect(result).toEqual({
        monthly: -8.33,
        annual: -100,
        percentage: -67.1
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

    it('should return null if key not set', () => {
      delete process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;

      const result = subscriptionService.getStripePublishableKey();

      expect(result).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      api.get.mockRejectedValue(new Error('Network error'));

      await expect(subscriptionService.getCurrentSubscription()).rejects.toThrow();
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

      await expect(subscriptionService.getCurrentSubscription()).rejects.toThrow();
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

      await expect(
        subscriptionService.createSubscription('basic', 'pm_123')
      ).rejects.toThrow('Unauthorized');
    });
  });
});
