// authSlice.js - SwissAI Tax Authentication

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../../services/authService';

const initialState = {
  isAuthenticated: authService.isAuthenticated(),
  user: authService.getCurrentUser(),
  isLoading: false,
  isSuccess: false,
  error: null
};

export const login = createAsyncThunk('auth/login', async (params, thunkApi) => {
  try {
    const response = await authService.login(params.email, params.password);
    return response;
  } catch (err) {
    return thunkApi.rejectWithValue(err?.message || 'Login failed');
  }
});

export const logout = createAsyncThunk('auth/logout', async (_, thunkApi) => {
  try {
    authService.logout();
    return {};
  } catch (error) {
    return thunkApi.rejectWithValue(error.message || 'Logout failed');
  }
});

export const signup = createAsyncThunk('auth/signup', async (params, thunkApi) => {
  try {
    const response = await authService.register(params);
    return response;
  } catch (error) {
    return thunkApi.rejectWithValue(error.message || 'Signup failed');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    resetAuth: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.error = null;
    },
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.isAuthenticated = true;
        state.user = action.payload.user || action.payload;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isSuccess = false;
        state.error = action.payload;
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.isSuccess = false;
        state.error = null;
      })
      // Signup
      .addCase(signup.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signup.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.isAuthenticated = true;
        state.user = action.payload.user || action.payload;
      })
      .addCase(signup.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

export const { resetAuth, setUser, clearUser } = authSlice.actions;
export default authSlice.reducer;
