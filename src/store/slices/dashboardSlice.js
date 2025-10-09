import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api';
import { useTranslation } from 'react-i18next';

// Async thunks
export const fetchDashboardData = createAsyncThunk(
  'dashboard/fetchData',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/dashboard');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch dashboard data');
    }
  }
);

export const fetchActiveFilings = createAsyncThunk(
  'dashboard/fetchActiveFilings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/dashboard/active-filings');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch active filings');
    }
  }
);

export const fetchPastFilings = createAsyncThunk(
  'dashboard/fetchPastFilings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/dashboard/past-filings');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch past filings');
    }
  }
);

export const fetchStats = createAsyncThunk(
  'dashboard/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/dashboard/stats');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch stats');
    }
  }
);

export const deleteFiling = createAsyncThunk(
  'dashboard/deleteFiling',
  async (filingId, { rejectWithValue }) => {
    try {
      await api.delete(`/api/filings/${filingId}`);
      return filingId;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to delete filing');
    }
  }
);

const initialState = {
  activeFilings: [],
  pastFilings: [],
  stats: {
    totalFilings: 0,
    totalRefunds: 0,
    averageRefund: 0,
    daysUntilDeadline: 0,
    onTimeFilings: 0
  },
  reminders: [],
  loading: false,
  error: null,
  activeFilingsLoading: false,
  pastFilingsLoading: false,
  statsLoading: false
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    addReminder: (state, action) => {
      state.reminders.push(action.payload);
    },
    removeReminder: (state, action) => {
      state.reminders = state.reminders.filter(
        (reminder) => reminder.id !== action.payload
      );
    },
    updateActiveFiling: (state, action) => {
      const index = state.activeFilings.findIndex(
        (filing) => filing.id === action.payload.id
      );
      if (index !== -1) {
        state.activeFilings[index] = {
          ...state.activeFilings[index],
          ...action.payload
        };
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Dashboard Data
      .addCase(fetchDashboardData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.loading = false;
        state.activeFilings = action.payload.activeFilings || [];
        state.pastFilings = action.payload.pastFilings || [];
        state.stats = action.payload.stats || initialState.stats;
        state.reminders = action.payload.reminders || [];
        state.error = null;
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Active Filings
      .addCase(fetchActiveFilings.pending, (state) => {
        state.activeFilingsLoading = true;
      })
      .addCase(fetchActiveFilings.fulfilled, (state, action) => {
        state.activeFilingsLoading = false;
        state.activeFilings = action.payload;
      })
      .addCase(fetchActiveFilings.rejected, (state, action) => {
        state.activeFilingsLoading = false;
        state.error = action.payload;
      })

      // Fetch Past Filings
      .addCase(fetchPastFilings.pending, (state) => {
        state.pastFilingsLoading = true;
      })
      .addCase(fetchPastFilings.fulfilled, (state, action) => {
        state.pastFilingsLoading = false;
        state.pastFilings = action.payload;
      })
      .addCase(fetchPastFilings.rejected, (state, action) => {
        state.pastFilingsLoading = false;
        state.error = action.payload;
      })

      // Fetch Stats
      .addCase(fetchStats.pending, (state) => {
        state.statsLoading = true;
      })
      .addCase(fetchStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchStats.rejected, (state, action) => {
        state.statsLoading = false;
        state.error = action.payload;
      })

      // Delete Filing
      .addCase(deleteFiling.fulfilled, (state, action) => {
        state.pastFilings = state.pastFilings.filter(
          (filing) => filing.id !== action.payload
        );
        state.activeFilings = state.activeFilings.filter(
          (filing) => filing.id !== action.payload
        );
      })
      .addCase(deleteFiling.rejected, (state, action) => {
        state.error = action.payload;
      });
  }
});

export const { clearError, addReminder, removeReminder, updateActiveFiling } =
  dashboardSlice.actions;

export default dashboardSlice.reducer;
