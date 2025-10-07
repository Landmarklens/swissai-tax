import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../../services/authService';
import axios from 'axios';
import config from '../../config/environments';
// import i18next from "i18next";

const API_URL = config.API_BASE_URL;

const initialState = {
  isLoading: false,
  isSuccess: false,
  error: null,
  data: null
};

export const fetchUserProfile = createAsyncThunk(
  'account/fetchUserProfile',
  async (_, thunkAPI) => {
    try {
      // Use cookie-based authentication instead of header-based
      const response = await axios.get(`${API_URL}/api/user/profile`, {
        withCredentials: true  // Send httpOnly cookie
      });
      // const userLanguage = response.data.language;
      // if (userLanguage) {
      //   i18next.changeLanguage(userLanguage);
      //   localStorage.setItem("i18nextLng", userLanguage);
      // }
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);

export const editUserProfile = createAsyncThunk(
  'account/editUserProfile',
  async (userData, thunkAPI) => {
    try {
      // Use cookie-based authentication instead of header-based
      const response = await axios.put(`${API_URL}/api/user/profile`, userData, {
        withCredentials: true  // Send httpOnly cookie
      });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateProfileAvatar = createAsyncThunk(
  'account/updateProfileAvatar',
  async (file, thunkAPI) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Use cookie-based authentication instead of header-based
      const response = await axios.put(`${API_URL}/api/user/profile/avatar`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        withCredentials: true  // Send httpOnly cookie
      });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);

const accountSlice = createSlice({
  name: 'account',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.data = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.isSuccess = false;
        state.error = action.payload;
      })
      .addCase(editUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(editUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.data = action.payload;
      })
      .addCase(editUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.isSuccess = false;
        state.error = action.payload;
      })

      .addCase(updateProfileAvatar.fulfilled, (state, action) => {
        state.data = { ...state.data, avatar_url: action.payload.avatar_url };
      });
  }
});

export const selectAccount = (state) => state.account;

export default accountSlice.reducer;
