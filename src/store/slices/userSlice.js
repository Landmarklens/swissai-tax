import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import authService from '../../services/authService';
import config from '../../config/environments';
import { useTranslation } from 'react-i18next';
const API_URL = config.API_BASE_URL;

const initialState = {
  uploadDocument: {
    data: null,
    isLoading: false,
    error: null
  },
  userDocuments: {
    data: [],
    isLoading: false,
    error: null
  }
};


export const uploadUserDocument = createAsyncThunk(
  'user/upload-document',
  async ({ userId, documentData }, thunkAPI) => {
    try {
      const user = authService.getCurrentUser();
      const response = await axios.post(
        `${API_URL}/users/${userId}/documents`,
        documentData,
        {
          headers: {
            Authorization: `Bearer ${user.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getUserDocuments = createAsyncThunk(
  'user/get-documents',
  async (userId, thunkAPI) => {
    try {
      const user = authService.getCurrentUser();
      const response = await axios.get(`${API_URL}/api/user/${userId}/documents`, {
        headers: {
          Authorization: `Bearer ${user.access_token}`
        }
      });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearUploadError: (state) => {
      state.uploadDocument.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Upload document cases
      .addCase(uploadUserDocument.pending, (state) => {
        state.uploadDocument.isLoading = true;
        state.uploadDocument.error = null;
      })
      .addCase(uploadUserDocument.fulfilled, (state, action) => {
        state.uploadDocument.isLoading = false;
        state.uploadDocument.data = action.payload;
        // Add the new document to the list
        state.userDocuments.data.push(action.payload);
      })
      .addCase(uploadUserDocument.rejected, (state, action) => {
        state.uploadDocument.isLoading = false;
        state.uploadDocument.error = action.payload;
      })

      // Get documents cases
      .addCase(getUserDocuments.pending, (state) => {
        state.userDocuments.isLoading = true;
        state.userDocuments.error = null;
      })
      .addCase(getUserDocuments.fulfilled, (state, action) => {
        state.userDocuments.isLoading = false;
        state.userDocuments.data = action.payload;
      })
      .addCase(getUserDocuments.rejected, (state, action) => {
        state.userDocuments.isLoading = false;
        state.userDocuments.error = action.payload;
      });
  }
});

export const { clearUploadError } = userSlice.actions;
export const selectUserDocuments = (state) => state.user.userDocuments;
export const selectUploadDocument = (state) => state.user.uploadDocument;

export default userSlice.reducer;