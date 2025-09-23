import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import authService from '../../services/authService';
import config from '../../config/environments';
const API_URL = config.API_BASE_URL;

const initialState = {
  viewings: {
    data: [],
    isLoading: false,
    error: null
  },
  requestViewing: {
    data: null,
    isLoading: false,
    error: null
  },
  updateViewing: {
    data: null,
    isLoading: false,
    error: null
  },
  deleteViewing: {
    data: null,
    isLoading: false,
    error: null
  },
  takeItOut: {
    data: null,
    isLoading: false,
    error: null
  },
  getTakeItOut: {
    data: null,
    isLoading: false,
    error: null
  }
};


export const requestViewing = createAsyncThunk(
  'viewing/request-viewing',
  async (body, thunkAPI) => {
    try {
      const user = authService.getCurrentUser();
      const response = await axios.post(`${API_URL}/viewing/`, body, {
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

export const getViewings = createAsyncThunk(
  'viewing/get-viewings',
  async ({ userId, propertyId } = {}, thunkAPI) => {
    try {
      // Build query parameters properly
      const queryParams = new URLSearchParams();
      if (userId) queryParams.append('user_id', userId);
      if (propertyId) queryParams.append('property_id', propertyId);
      
      const params = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const user = authService.getCurrentUser();
      
      // Use the correct API endpoint
      const response = await axios.get(`${API_URL}/api/viewing${params}`, {
        headers: {
          Authorization: `Bearer ${user.access_token}`
        }
      });
      
      // Return empty array if no data
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch viewings:', error.response?.data || error.message);
      // Return empty array instead of rejecting to prevent dashboard from breaking
      return [];
    }
  }
);

export const updateViewing = createAsyncThunk(
  'viewing/update-viewing',
  async ({ viewingId, body }, thunkAPI) => {
    try {
      const user = authService.getCurrentUser();
      const response = await axios.put(`${API_URL}/viewing/${viewingId}`, body, {
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

export const cancelViewing = createAsyncThunk(
  'viewing/cancel-viewing',
  async (viewingId, thunkAPI) => {
    try {
      const user = authService.getCurrentUser();
      const response = await axios.delete(`${API_URL}/viewing/${viewingId}`, {
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

export const getTakeItOut = createAsyncThunk('viewing/get-take-it-out', async (_, thunkAPI) => {
  try {
    const user = authService.getCurrentUser();
    const response = await axios.get(`${API_URL}/take-it-out/`, {
      headers: {
        Authorization: `Bearer ${user.access_token}`
      }
    });
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response.data);
  }
});

export const updateTakeItOut = createAsyncThunk(
  'viewing/update-take-it-out',
  async ({ takeItOutId, body }, thunkAPI) => {
    try {
      const user = authService.getCurrentUser();
      const response = await axios.put(`${API_URL}/take-it-out/${takeItOutId}`, body, {
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

export const takeItOut = createAsyncThunk('viewing/take-it-out', async (body, thunkAPI) => {
  try {
    const user = authService.getCurrentUser();
    const response = await axios.post(`${API_URL}/take-it-out/`, body, {
      headers: {
        Authorization: `Bearer ${user.access_token}`
      }
    });
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response.data);
  }
});

const viewingSlice = createSlice({
  name: 'viewing',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(requestViewing.pending, (state) => {
        state.requestViewing.isLoading = true;
        state.requestViewing.error = null;
      })
      .addCase(requestViewing.fulfilled, (state, action) => {
        state.requestViewing.isLoading = false;
        state.requestViewing.data = action.payload;
      })
      .addCase(requestViewing.rejected, (state, action) => {
        state.requestViewing.isLoading = false;
        state.requestViewing.error = action.payload;
      })

      .addCase(getViewings.pending, (state) => {
        state.viewings.isLoading = true;
        state.viewings.error = null;
      })
      .addCase(getViewings.fulfilled, (state, action) => {
        state.viewings.isLoading = false;
        state.viewings.data = action.payload;
      })
      .addCase(getViewings.rejected, (state, action) => {
        state.viewings.isLoading = false;
        state.viewings.error = action.payload;
      })

      .addCase(updateViewing.pending, (state) => {
        state.updateViewing.isLoading = true;
        state.updateViewing.error = null;
      })
      .addCase(updateViewing.fulfilled, (state, action) => {
        state.updateViewing.isLoading = false;
        state.updateViewing.data = action.payload;
      })
      .addCase(updateViewing.rejected, (state, action) => {
        state.updateViewing.isLoading = false;
        state.updateViewing.error = action.payload;
      })

      .addCase(cancelViewing.pending, (state) => {
        state.deleteViewing.isLoading = true;
        state.deleteViewing.error = null;
      })
      .addCase(cancelViewing.fulfilled, (state, action) => {
        state.deleteViewing.isLoading = false;
        state.deleteViewing.data = action.payload;
      })
      .addCase(cancelViewing.rejected, (state, action) => {
        state.deleteViewing.isLoading = false;
        state.deleteViewing.error = action.payload;
      })
      .addCase(takeItOut.pending, (state) => {
        state.takeItOut = {
          ...state.takeItOut,
          isLoading: true,
          error: null
        };
      })
      .addCase(takeItOut.fulfilled, (state, action) => {
        state.takeItOut = {
          ...state.takeItOut,
          isLoading: false,
          data: action.payload
        };
      })
      .addCase(takeItOut.rejected, (state, action) => {
        state.takeItOut = {
          ...state.takeItOut,
          isLoading: false,
          error: action.payload
        };
      })
      .addCase(getTakeItOut.pending, (state) => {
        state.getTakeItOut = {
          ...state.getTakeItOut,
          isLoading: true,
          error: null
        };
      })
      .addCase(getTakeItOut.fulfilled, (state, action) => {
        state.getTakeItOut = {
          ...state.getTakeItOut,
          isLoading: false,
          data: action.payload
        };
      })
      .addCase(getTakeItOut.rejected, (state, action) => {
        state.getTakeItOut = {
          ...state.getTakeItOut,
          isLoading: false,
          error: action.payload
        };
      })
      .addCase(updateTakeItOut.pending, (state) => {
        state.updateTakeItOut = {
          ...state.updateTakeItOut,
          isLoading: true,
          error: null
        };
      })
      .addCase(updateTakeItOut.fulfilled, (state, action) => {
        // state.getTakeItOut = {
        //   ...state.updateTakeItOut,
        //   isLoading: false,
        //   data: action.payload,
        // };

        // Update the state that stores takeItOut data
        state.getTakeItOut.data = state.getTakeItOut.data.map((item) => {
          if (item.id === action.payload.id) {
            return { ...item, number: action.payload.number }; // Reflect the updated number
          }
          return item;
        });

        state.updateTakeItOut.isLoading = false;
        state.updateTakeItOut.data = action.payload; // Store updated data
      })
      .addCase(updateTakeItOut.rejected, (state, action) => {
        state.updateTakeItOut = {
          ...state.updateTakeItOut,
          isLoading: false,
          error: action.payload
        };
      });
  }
});

export const selectViewing = (state) => state.viewing;

export default viewingSlice.reducer;
