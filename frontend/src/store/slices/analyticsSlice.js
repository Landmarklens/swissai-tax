import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import authService from '../../services/authService';
import config from '../../config/environments';

const API_URL = config.API_BASE_URL;

const initialState = {
  analytics: {
    data: [],
    isLoading: false,
    error: null
  },
  updateAnalytic: {
    data: null,
    isLoading: false,
    error: null
  }
};

export const getAnalytics = createAsyncThunk('analytics/get-analytics', async (_, thunkAPI) => {
  try {
    const user = authService.getCurrentUser();
    const response = await axios.get(`${API_URL}/property/{property_id}/dashboard`, {
      headers: {
        Authorization: `Bearer ${user.access_token}`
      }
    });
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response.data);
  }
});

export const updateAnalytics = createAsyncThunk(
  'analytics/update-analytics',
  async ({ property_id, body }, thunkAPI) => {
    try {
      const user = authService.getCurrentUser();
      const response = await axios.post(
        `${API_URL}/analytics/update?property_id=${property_id}`,
        body,
        {
          headers: {
            Authorization: `Bearer ${user.access_token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getAnalytics.pending, (state) => {
        state.analytics.isLoading = true;
        state.analytics.error = null;
      })
      .addCase(getAnalytics.fulfilled, (state, action) => {
        state.analytics.isLoading = false;
        state.analytics.data = action.payload;
      })
      .addCase(getAnalytics.rejected, (state, action) => {
        state.analytics.isLoading = false;
        state.analytics.error = action.payload;
      })

      .addCase(updateAnalytics.pending, (state) => {
        state.updateAnalytic.isLoading = true;
        state.updateAnalytic.error = null;
      })
      .addCase(updateAnalytics.fulfilled, (state, action) => {
        state.updateAnalytic.isLoading = false;
        state.updateAnalytic.data = action.payload;
      })
      .addCase(updateAnalytics.rejected, (state, action) => {
        state.updateAnalytic.isLoading = false;
        state.updateAnalytic.error = action.payload;
      });
  }
});

export const trackPropertyView = createAsyncThunk(
  'analytics/track-property-view',
  async ({ property_id, event_type = 'view' }, thunkAPI) => {
    try {
      const user = authService.getCurrentUser();
      const response = await axios.post(
        `${API_URL}/analytics/property_view`,
        { property_id, event_type },
        {
          headers: {
            Authorization: `Bearer ${user.access_token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);

export const getPropertyViewAnalytics = createAsyncThunk(
  'analytics/get-property-views',
  async (_, thunkAPI) => {
    try {
      const user = authService.getCurrentUser();
      const response = await axios.get(`${API_URL}/analytics/property_view`, {
        headers: {
          Authorization: `Bearer ${user.access_token}`
        }
      });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);

export const selectAnalytics = (state) => state.analytics;

export default analyticsSlice.reducer;
