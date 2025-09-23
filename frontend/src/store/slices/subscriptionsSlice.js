import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import authService from '../../services/authService';
import config from '../../config/environments';
const API_URL = process.env.REACT_APP_API_URL || config.API_BASE_URL || 'https://api.homeai.ch';

const initialState = {
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
};


const computeTrialStatus = (subscription) => {
  if (!subscription || subscription.plan === 'free' || !subscription.has_used_trial) {
    return { isTrialActive: false, trialDaysRemaining: 0 };
  }

  const now = new Date();
  const canceledAt = subscription.canceled_at ? new Date(subscription.canceled_at) : null;
  const isTrialActive =
    subscription.status === 'trialing' &&
    subscription.plan === 'comprehensive' &&
    canceledAt &&
    now < canceledAt;

  if (!isTrialActive) {
    return { isTrialActive: false, trialDaysRemaining: 0 };
  }

  const timeDiff = canceledAt - now;
  const daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));

  return { isTrialActive: true, trialDaysRemaining: daysRemaining };
};

export const getPlans = createAsyncThunk('subscriptions/plans', async (_, thunkAPI) => {
  try {
    const response = await axios.get(`${API_URL}/api/subscriptions/plans`);

    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.detail || 'Failed to fetch plans');
  }
});

export const getSubscription = createAsyncThunk(
  'subscriptions/get-subscription',
  async (_, thunkAPI) => {
    try {
      const user = authService.getCurrentUser();
      console.log('[SubscriptionsSlice] Fetching subscription from:', `${API_URL}/api/subscriptions`);
      const response = await axios.get(`${API_URL}/api/subscriptions`, {
        headers: { Authorization: `Bearer ${user.access_token}` }
      });

      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.detail || 'Failed to fetch subscription'
      );
    }
  }
);

export const createSubscription = createAsyncThunk(
  'subscriptions/create-subscription',
  async (_, thunkAPI) => {
    try {
      const user = await authService.getCurrentUser();

      const response = await axios.post(
        `${API_URL}/api/subscriptions/activate-trial`,
        {},
        {
          headers: { Authorization: `Bearer ${user.access_token}` }
        }
      );

      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.detail || 'Failed to create subscription'
      );
    }
  }
);

export const upgradeSubscription = createAsyncThunk(
  'subscriptions/upgrade-subscription',
  async ({ plan }, thunkAPI) => {
    try {
      const user = authService.getCurrentUser();

      // Option 1: Create a new subscription (this will upgrade the existing one)
      const response = await axios.post(
        `${API_URL}/api/subscriptions/`,
        { plan },
        {
          headers: { Authorization: `Bearer ${user.access_token}` }
        }
      );
      if (response.data.checkout_url) {
        window.location.href = response.data.checkout_url;
      }
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.detail || 'Failed to upgrade subscription'
      );
    }
  }
);

export const cancelSubscription = createAsyncThunk(
  'subscriptions/cancel-subscription',
  async (_, thunkAPI) => {
    try {
      const user = authService.getCurrentUser();

      const response = await axios.post(
        `${API_URL}/api/subscriptions/cancel`,
        {},
        {
          headers: { Authorization: `Bearer ${user.access_token}` }
        }
      );
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.detail || 'Failed to cancel subscription'
      );
    }
  }
);

export const toggleAutoRenewal = createAsyncThunk(
  'subscriptions/toggle-auto-renewal',
  async (_, thunkAPI) => {
    try {
      const user = authService.getCurrentUser();
      const response = await axios.post(`${API_URL}/api/subscriptions/toggle-auto-renewal`, null, {
        headers: { Authorization: `Bearer ${user.access_token}` }
      });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.detail || 'Failed to toggle auto-renewal'
      );
    }
  }
);

export const getBillingHistory = createAsyncThunk(
  'subscriptions/get-billing-history',
  async (_, thunkAPI) => {
    try {
      const user = authService.getCurrentUser();
      const response = await axios.get(`${API_URL}/api/subscriptions/billing/history`, {
        headers: { Authorization: `Bearer ${user.access_token}` }
      });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.detail || 'Failed to fetch billing history'
      );
    }
  }
);

export const createCheckoutUrl = createAsyncThunk(
  'subscriptions/create-checkout-url',
  async ({ plan }, thunkAPI) => {
    const TRIAL_DAYS = 1;
    try {
      const user = authService.getCurrentUser();
      const res = await axios.post(
        `${API_URL}/api/subscriptions/checkout-url?trial_days=${TRIAL_DAYS}`,
        { plan },
        {
          headers: { Authorization: `Bearer ${user.access_token}` }
        }
      );

      if (res.data.checkout_url) {
        window.location.href = res.data.checkout_url;
      }
      return res.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.res?.data?.detail || 'Failed to create checkout url');
    }
  }
);

const subscriptionsSlice = createSlice({
  name: 'subscriptions',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getSubscription.pending, (state) => {
        state.subscription.isLoading = true;
        state.subscription.error = null;
      })
      .addCase(getSubscription.fulfilled, (state, action) => {
        state.subscription.isLoading = false;
        state.subscription.data = action.payload;
        const sub = action.payload[0];
        if (sub?.plan && sub?.plan !== 'free') {
          state.subscription.isActive = true;
        } else {
          state.subscription.isActive = false;
        }
        const trialStatus = computeTrialStatus(sub);
        state.subscription.isTrialActive = trialStatus.isTrialActive;
        state.subscription.trialDaysRemaining = trialStatus.trialDaysRemaining;
        state.subscription.isPastDue = sub?.status === 'past_due';
        state.subscription.autoRenew = !sub?.canceled_at;
        state.subscription.accessUntil = sub?.canceled_at
          ? sub.canceled_at
          : sub?.next_billing_date || null;
      })
      .addCase(getSubscription.rejected, (state, action) => {
        state.subscription.isLoading = false;
        state.subscription.error = action.payload;
      })
      .addCase(createSubscription.pending, (state) => {
        state.createSubscription.isLoading = true;
        state.createSubscription.error = null;
      })
      .addCase(createSubscription.fulfilled, (state, action) => {
        state.createSubscription.isLoading = false;
        state.subscription.data = action.payload;
      })
      .addCase(createSubscription.rejected, (state, action) => {
        state.createSubscription.isLoading = false;
        state.createSubscription.error = action.payload;
      })
      // Handle both updateSubscription and upgradeSubscription the same way
      // .addCase(updateSubscription.pending, (state) => {
      //   state.updateSubscription.isLoading = true;
      //   state.updateSubscription.error = null;
      // })
      // .addCase(updateSubscription.fulfilled, (state, action) => {
      //   state.updateSubscription.isLoading = false;
      //   state.subscription.data = [action.payload];
      //   state.updateSubscription.data = action.payload;
      //   const trialStatus = computeTrialStatus(action.payload);
      //   state.subscription.isTrialActive = trialStatus.isTrialActive;
      //   state.subscription.trialDaysRemaining = trialStatus.trialDaysRemaining;
      //   state.subscription.isPastDue = action.payload.status === 'past_due';
      //   state.subscription.autoRenew = !action.payload.canceled_at;
      //   state.subscription.accessUntil = action.payload.canceled_at
      //     ? action.payload.canceled_at
      //     : action.payload.next_billing_date || null;
      // })
      // .addCase(updateSubscription.rejected, (state, action) => {
      //   state.updateSubscription.isLoading = false;
      //   state.updateSubscription.error = action.payload;
      // })
      // Add handlers for upgradeSubscription
      // .addCase(upgradeSubscription.pending, (state) => {
      //   state.updateSubscription.isLoading = true;
      //   state.updateSubscription.error = null;
      // })
      // .addCase(upgradeSubscription.fulfilled, (state, action) => {
      //   state.updateSubscription.isLoading = false;
      //   state.subscription.data = [action.payload];
      //   state.updateSubscription.data = action.payload;
      //   const trialStatus = computeTrialStatus(action.payload);
      //   state.subscription.isTrialActive = trialStatus.isTrialActive;
      //   state.subscription.trialDaysRemaining = trialStatus.trialDaysRemaining;
      //   state.subscription.isPastDue = action.payload.status === 'past_due';
      //   state.subscription.autoRenew = !action.payload.canceled_at;
      //   state.subscription.accessUntil = action.payload.canceled_at
      //     ? action.payload.canceled_at
      //     : action.payload.next_billing_date || null;
      // })
      // .addCase(upgradeSubscription.rejected, (state, action) => {
      //   state.updateSubscription.isLoading = false;
      //   state.updateSubscription.error = action.payload;
      // })
      .addCase(cancelSubscription.pending, (state) => {
        state.cancelSubscription.isLoading = true;
        state.cancelSubscription.error = null;
      })
      .addCase(cancelSubscription.fulfilled, (state, action) => {
        state.cancelSubscription.isLoading = false;
        state.cancelSubscription.data = action.payload;
        state.subscription.data = [action.payload];
        state.subscription.autoRenew = false;
        state.subscription.isTrialActive = false;
        state.subscription.trialDaysRemaining = 0;
        state.subscription.isPastDue = false;
        state.subscription.accessUntil =
          action.payload.canceled_at || state.subscription.data[0]?.next_billing_date;
      })
      .addCase(cancelSubscription.rejected, (state, action) => {
        state.cancelSubscription.isLoading = false;
        state.cancelSubscription.error = action.payload;
      })
      .addCase(toggleAutoRenewal.pending, (state) => {
        state.subscription.isLoading = true;
        state.subscription.error = null;
      })
      .addCase(toggleAutoRenewal.fulfilled, (state, action) => {
        state.subscription.isLoading = false;
        state.subscription.data = [action.payload];
        state.subscription.autoRenew = !state.subscription.autoRenew; // Toggle locally
        state.subscription.accessUntil = action.payload.canceled_at
          ? action.payload.canceled_at
          : action.payload.next_billing_date || null;
        state.subscription.isPastDue = action.payload.status === 'past_due';
        const trialStatus = computeTrialStatus(action.payload);
        state.subscription.isTrialActive = trialStatus.isTrialActive;
        state.subscription.trialDaysRemaining = trialStatus.trialDaysRemaining;
      })
      .addCase(toggleAutoRenewal.rejected, (state, action) => {
        state.subscription.isLoading = false;
        state.subscription.error = action.payload;
      })
      .addCase(getPlans.pending, (state) => {
        state.plans.isLoading = true;
        state.plans.error = null;
      })
      .addCase(getPlans.fulfilled, (state, action) => {
        state.plans.isLoading = false;
        state.plans.data = action.payload;
      })
      .addCase(getPlans.rejected, (state, action) => {
        state.plans.isLoading = false;
        state.plans.error = action.payload;
      })
      .addCase(getBillingHistory.pending, (state) => {
        state.billingHistory.isLoading = true;
        state.billingHistory.error = null;
      })
      .addCase(getBillingHistory.fulfilled, (state, action) => {
        state.billingHistory.isLoading = false;
        state.billingHistory.data = action.payload;
      })
      .addCase(getBillingHistory.rejected, (state, action) => {
        state.billingHistory.isLoading = false;
        state.billingHistory.error = action.payload;
      });
    // .addCase(createCheckoutUrl.pending, (state) => {
    //   state.checkoutUrl.isLoading = true;
    //   state.checkoutUrl.error = null;
    // })
    // .addCase(createCheckoutUrl.fulfilled, (state, action) => {
    //   state.checkoutUrl.isLoading = false;
    //   state.checkoutUrl.data = action.payload;
    // })
    // .addCase(createCheckoutUrl.rejected, (state, action) => {
    //   state.checkoutUrl.isLoading = false;
    //   state.checkoutUrl.error = action.payload;
    // });
  }
});

export const selectSubscriptions = (state) => state.subscriptions;
export default subscriptionsSlice.reducer;
