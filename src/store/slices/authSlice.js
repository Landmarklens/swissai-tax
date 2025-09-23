// authSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import { postData } from '../../api/apiClient';
import { removeLocalData, setLocalData } from '../../utils';

const initialState = {
  isAuthenticated: false,
  user: null,
  isLoading: false,
  isSuccess: false,
  error: null
};

export const login = createAsyncThunk('login', async (params, thunkApi) => {
  try {
    const response = await postData('user/login', params);

    // Throw Err
    if (response?.status && response.status !== 200) {
      throw response;
    }
    // Storing data locally
    setLocalData('userData', response.data);
    return response;
  } catch (err) {
    return thunkApi.rejectWithValue(err?.error || 'Something went wrong');
  }
});

export const logout = createAsyncThunk('logout', async (_, thunkApi) => {
  try {
    removeLocalData('userData');
    return {};
  } catch (error) {
    return thunkApi.rejectWithValue(error.message || 'Logout failed');
  }
});

export const signup = createAsyncThunk('signup', async (_, thunkApi) => {
  try {
  } catch (error) {
    return thunkApi.rejectWithValue(error.message || 'Signup failed');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    initializeAuthFromStorage: (state) => {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      if (userData && userData.access_token) {
        state.isAuthenticated = true;
        state.user = userData;
        state.isSuccess = true;
      }
    },
    updateUserProfile: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        // Update local storage as well
        const currentUserData = JSON.parse(localStorage.getItem('userData') || '{}');
        const updatedUserData = { ...currentUserData, ...action.payload };
        setLocalData('userData', updatedUserData);
      }
    }
  },
  extraReducers: (builder) => {
    // Handle login cases
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isSuccess = true;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.error = action.payload;
      });

    // Handle logout cases
    builder
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.isSuccess = false;
        state.user = {};
      })
      .addCase(logout.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error?.message || 'Logout failed';
      });

    //Handle SignUp Cases
    builder
      .addCase(signup.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(signup.fulfilled, (state) => {
        state.isLoading = false;
        state.isSuccess = false;
        state.user = {};
      })
      .addCase(signup.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || action.error?.message || 'Signup failed';
      });
  }
});

export const { updateUserProfile, initializeAuthFromStorage } = authSlice.actions;
export const selectAuth = (state) => state.auth;
export default authSlice.reducer;
