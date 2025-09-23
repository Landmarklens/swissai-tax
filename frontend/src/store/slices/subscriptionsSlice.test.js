import { configureStore } from '@reduxjs/toolkit';
import axios from 'axios';
import subscriptionsReducer, {
  getPlans,
  getSubscription,
  createSubscription,
  upgradeSubscription,
  cancelSubscription,
  toggleAutoRenewal,
  getBillingHistory,
  createCheckoutUrl,
  selectSubscriptions
} from './subscriptionsSlice';
import authService from '../../services/authService';
import config from '../../config/environments';

jest.mock('axios');
jest.mock('../../services/authService');

const API_URL = process.env.REACT_APP_API_URL || config.API_BASE_URL || 'https://api.homeai.ch';

// Mock window.location
Object.defineProperty(window, 'location', {
  value: { href: '' },
  writable: true,
});

describe('subscriptionsSlice', () => {
  let store;
  const mockUser = { access_token: 'test-token' };

  beforeEach(() => {
    store = configureStore({
      reducer: {
        subscriptions: subscriptionsReducer
      }
    });
    jest.clearAllMocks();
    authService.getCurrentUser.mockReturnValue(mockUser);
    window.location.href = '';
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState().subscriptions;
      expect(state).toEqual({
        subscription: {
          data: null,
          isLoading: false,
          error: null,
          isTrialActive: false,
          isActive: false,
          trialDaysRemaining: 0,
          autoRenew: true,
          accessUntil: null,
          isPastDue: false
        },
        createSubscription: {
          data: null,
          isLoading: false,
          error: null
        },
        updateSubscription: {
          data: null,
          isLoading: false,
          error: null
        },
        cancelSubscription: {
          data: null,
          isLoading: false,
          error: null
        },
        plans: {
          data: null,
          isLoading: false,
          error: null
        },
        billingHistory: {
          data: null,
          isLoading: false,
          error: null
        },
        checkoutUrl: {
          data: null,
          isLoading: false,
          error: null
        }
      });
    });
  });

  describe('getPlans action', () => {
    it('should handle getPlans.pending', () => {
      store.dispatch(getPlans.pending());
      const state = store.getState().subscriptions;
      expect(state.plans.isLoading).toBe(true);
      expect(state.plans.error).toBe(null);
    });

    it('should handle getPlans.fulfilled', async () => {
      const mockPlans = [
        { id: 'basic', name: 'Basic', price: 10 },
        { id: 'premium', name: 'Premium', price: 20 }
      ];
      axios.get.mockResolvedValue({ data: mockPlans });

      await store.dispatch(getPlans());

      expect(axios.get).toHaveBeenCalledWith(`${API_URL}/api/subscriptions/plans`);

      const state = store.getState().subscriptions;
      expect(state.plans.isLoading).toBe(false);
      expect(state.plans.data).toEqual(mockPlans);
    });

    it('should handle getPlans.rejected', async () => {
      const mockError = { response: { data: { detail: 'Failed to fetch plans' } } };
      axios.get.mockRejectedValue(mockError);

      await store.dispatch(getPlans());

      const state = store.getState().subscriptions;
      expect(state.plans.isLoading).toBe(false);
      expect(state.plans.error).toBe('Failed to fetch plans');
    });
  });

  describe('getSubscription action', () => {
    it('should handle getSubscription.pending', () => {
      store.dispatch(getSubscription.pending());
      const state = store.getState().subscriptions;
      expect(state.subscription.isLoading).toBe(true);
      expect(state.subscription.error).toBe(null);
    });

    it('should handle getSubscription.fulfilled with active subscription', async () => {
      const mockSubscription = [{
        id: 1,
        plan: 'comprehensive',
        status: 'active',
        has_used_trial: true,
        canceled_at: null,
        next_billing_date: '2024-02-01'
      }];
      axios.get.mockResolvedValue({ data: mockSubscription });

      await store.dispatch(getSubscription());

      expect(axios.get).toHaveBeenCalledWith(`${API_URL}/api/subscriptions`, {
        headers: { Authorization: 'Bearer test-token' }
      });

      const state = store.getState().subscriptions;
      expect(state.subscription.isLoading).toBe(false);
      expect(state.subscription.data).toEqual(mockSubscription);
      expect(state.subscription.isActive).toBe(true);
      expect(state.subscription.isTrialActive).toBe(false);
      expect(state.subscription.autoRenew).toBe(true);
      expect(state.subscription.accessUntil).toBe('2024-02-01');
    });

    it('should handle getSubscription.fulfilled with trial subscription', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      
      const mockSubscription = [{
        id: 1,
        plan: 'comprehensive',
        status: 'trialing',
        has_used_trial: true,
        canceled_at: futureDate.toISOString(),
        next_billing_date: null
      }];
      axios.get.mockResolvedValue({ data: mockSubscription });

      await store.dispatch(getSubscription());

      const state = store.getState().subscriptions;
      expect(state.subscription.isActive).toBe(true);
      expect(state.subscription.isTrialActive).toBe(true);
      expect(state.subscription.trialDaysRemaining).toBeGreaterThan(0);
      expect(state.subscription.autoRenew).toBe(false);
    });

    it('should handle getSubscription.fulfilled with free plan', async () => {
      const mockSubscription = [{
        id: 1,
        plan: 'free',
        status: 'active'
      }];
      axios.get.mockResolvedValue({ data: mockSubscription });

      await store.dispatch(getSubscription());

      const state = store.getState().subscriptions;
      expect(state.subscription.isActive).toBe(false);
      expect(state.subscription.isTrialActive).toBe(false);
    });

    it('should handle getSubscription.rejected', async () => {
      const mockError = { response: { data: { detail: 'Subscription not found' } } };
      axios.get.mockRejectedValue(mockError);

      await store.dispatch(getSubscription());

      const state = store.getState().subscriptions;
      expect(state.subscription.isLoading).toBe(false);
      expect(state.subscription.error).toBe('Subscription not found');
    });
  });

  describe('createSubscription action', () => {
    it('should handle createSubscription.pending', () => {
      store.dispatch(createSubscription.pending());
      const state = store.getState().subscriptions;
      expect(state.createSubscription.isLoading).toBe(true);
      expect(state.createSubscription.error).toBe(null);
    });

    it('should handle createSubscription.fulfilled', async () => {
      const mockSubscription = {
        id: 1,
        plan: 'comprehensive',
        status: 'trialing'
      };
      axios.post.mockResolvedValue({ data: mockSubscription });

      await store.dispatch(createSubscription());

      expect(axios.post).toHaveBeenCalledWith(
        `${API_URL}/api/subscriptions/activate-trial`,
        {},
        { headers: { Authorization: 'Bearer test-token' } }
      );

      const state = store.getState().subscriptions;
      expect(state.createSubscription.isLoading).toBe(false);
      expect(state.subscription.data).toEqual(mockSubscription);
    });

    it('should handle createSubscription.rejected', async () => {
      const mockError = { response: { data: { detail: 'Trial already used' } } };
      axios.post.mockRejectedValue(mockError);

      await store.dispatch(createSubscription());

      const state = store.getState().subscriptions;
      expect(state.createSubscription.isLoading).toBe(false);
      expect(state.createSubscription.error).toBe('Trial already used');
    });
  });

  describe('upgradeSubscription action', () => {
    it('should handle upgradeSubscription and redirect to checkout', async () => {
      const mockResponse = { checkout_url: 'https://checkout.stripe.com/pay/123' };
      axios.post.mockResolvedValue({ data: mockResponse });

      await store.dispatch(upgradeSubscription({ plan: 'premium' }));

      expect(axios.post).toHaveBeenCalledWith(
        `${API_URL}/api/subscriptions/`,
        { plan: 'premium' },
        { headers: { Authorization: 'Bearer test-token' } }
      );

      expect(window.location.href).toBe('https://checkout.stripe.com/pay/123');
    });

    it('should handle upgradeSubscription without checkout URL', async () => {
      const mockResponse = { id: 1, plan: 'premium' };
      axios.post.mockResolvedValue({ data: mockResponse });

      const result = await store.dispatch(upgradeSubscription({ plan: 'premium' }));

      expect(result.payload).toEqual(mockResponse);
      expect(window.location.href).toBe('');
    });
  });

  describe('cancelSubscription action', () => {
    it('should handle cancelSubscription.pending', () => {
      store.dispatch(cancelSubscription.pending());
      const state = store.getState().subscriptions;
      expect(state.cancelSubscription.isLoading).toBe(true);
      expect(state.cancelSubscription.error).toBe(null);
    });

    it('should handle cancelSubscription.fulfilled', async () => {
      const mockResponse = {
        id: 1,
        plan: 'comprehensive',
        canceled_at: '2024-02-01'
      };
      axios.post.mockResolvedValue({ data: mockResponse });

      await store.dispatch(cancelSubscription());

      expect(axios.post).toHaveBeenCalledWith(
        `${API_URL}/api/subscriptions/cancel`,
        {},
        { headers: { Authorization: 'Bearer test-token' } }
      );

      const state = store.getState().subscriptions;
      expect(state.cancelSubscription.isLoading).toBe(false);
      expect(state.cancelSubscription.data).toEqual(mockResponse);
      expect(state.subscription.data).toEqual([mockResponse]);
      expect(state.subscription.autoRenew).toBe(false);
      expect(state.subscription.isTrialActive).toBe(false);
      expect(state.subscription.accessUntil).toBe('2024-02-01');
    });

    it('should handle cancelSubscription.rejected', async () => {
      const mockError = { response: { data: { detail: 'Cannot cancel subscription' } } };
      axios.post.mockRejectedValue(mockError);

      await store.dispatch(cancelSubscription());

      const state = store.getState().subscriptions;
      expect(state.cancelSubscription.isLoading).toBe(false);
      expect(state.cancelSubscription.error).toBe('Cannot cancel subscription');
    });
  });

  describe('toggleAutoRenewal action', () => {
    it('should handle toggleAutoRenewal.pending', () => {
      store.dispatch(toggleAutoRenewal.pending());
      const state = store.getState().subscriptions;
      expect(state.subscription.isLoading).toBe(true);
      expect(state.subscription.error).toBe(null);
    });

    it('should handle toggleAutoRenewal.fulfilled', async () => {
      const mockResponse = {
        id: 1,
        plan: 'comprehensive',
        canceled_at: null,
        next_billing_date: '2024-02-01',
        status: 'active'
      };
      axios.post.mockResolvedValue({ data: mockResponse });

      await store.dispatch(toggleAutoRenewal());

      expect(axios.post).toHaveBeenCalledWith(
        `${API_URL}/api/subscriptions/toggle-auto-renewal`,
        null,
        { headers: { Authorization: 'Bearer test-token' } }
      );

      const state = store.getState().subscriptions;
      expect(state.subscription.isLoading).toBe(false);
      expect(state.subscription.data).toEqual([mockResponse]);
      expect(state.subscription.autoRenew).toBe(false); // Toggled from initial true
      expect(state.subscription.accessUntil).toBe('2024-02-01');
    });

    it('should handle toggleAutoRenewal.rejected', async () => {
      const mockError = { response: { data: { detail: 'Failed to toggle' } } };
      axios.post.mockRejectedValue(mockError);

      await store.dispatch(toggleAutoRenewal());

      const state = store.getState().subscriptions;
      expect(state.subscription.isLoading).toBe(false);
      expect(state.subscription.error).toBe('Failed to toggle');
    });
  });

  describe('getBillingHistory action', () => {
    it('should handle getBillingHistory.pending', () => {
      store.dispatch(getBillingHistory.pending());
      const state = store.getState().subscriptions;
      expect(state.billingHistory.isLoading).toBe(true);
      expect(state.billingHistory.error).toBe(null);
    });

    it('should handle getBillingHistory.fulfilled', async () => {
      const mockHistory = [
        { id: 1, amount: 1000, date: '2024-01-01' },
        { id: 2, amount: 1000, date: '2023-12-01' }
      ];
      axios.get.mockResolvedValue({ data: mockHistory });

      await store.dispatch(getBillingHistory());

      expect(axios.get).toHaveBeenCalledWith(
        `${API_URL}/api/subscriptions/billing/history`,
        { headers: { Authorization: 'Bearer test-token' } }
      );

      const state = store.getState().subscriptions;
      expect(state.billingHistory.isLoading).toBe(false);
      expect(state.billingHistory.data).toEqual(mockHistory);
    });

    it('should handle getBillingHistory.rejected', async () => {
      const mockError = { response: { data: { detail: 'No billing history' } } };
      axios.get.mockRejectedValue(mockError);

      await store.dispatch(getBillingHistory());

      const state = store.getState().subscriptions;
      expect(state.billingHistory.isLoading).toBe(false);
      expect(state.billingHistory.error).toBe('No billing history');
    });
  });

  describe('createCheckoutUrl action', () => {
    it('should create checkout URL and redirect', async () => {
      const mockResponse = { checkout_url: 'https://checkout.stripe.com/pay/456' };
      axios.post.mockResolvedValue({ data: mockResponse });

      await store.dispatch(createCheckoutUrl({ plan: 'basic' }));

      expect(axios.post).toHaveBeenCalledWith(
        `${API_URL}/api/subscriptions/checkout-url?trial_days=1`,
        { plan: 'basic' },
        { headers: { Authorization: 'Bearer test-token' } }
      );

      expect(window.location.href).toBe('https://checkout.stripe.com/pay/456');
    });

    it('should handle createCheckoutUrl error', async () => {
      const mockError = { res: { data: { detail: 'Checkout failed' } } };
      axios.post.mockRejectedValue(mockError);

      const result = await store.dispatch(createCheckoutUrl({ plan: 'basic' }));

      expect(result.payload).toBe('Checkout failed');
    });
  });

  describe('selectSubscriptions selector', () => {
    it('should select subscriptions state', () => {
      const mockState = {
        subscriptions: {
          subscription: { data: null, isLoading: false }
        }
      };

      const result = selectSubscriptions(mockState);
      expect(result).toEqual(mockState.subscriptions);
    });
  });
});