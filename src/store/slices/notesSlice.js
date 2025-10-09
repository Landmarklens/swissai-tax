import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import authService from '../../services/authService';
import { getLocalStorageUser } from './../../utils/localStorage/getLocalStorageUser';

import config from '../../config/environments';
import { useTranslation } from 'react-i18next';
const API_URL = process.env.REACT_APP_API_BASE_URL || config.API_BASE_URL || 'https://api.homeai.ch';

const initialState = {
  notes: {
    data: [],
    isLoading: false,
    error: null
  },
  currentNote: {
    data: null,
    isLoading: false,
    error: null
  },
  addNote: {
    isLoading: false,
    isSuccess: false,
    error: null
  }
};

export const getNote = createAsyncThunk('notes/getNote', async (id, thunkAPI) => {
  try {
    const user = authService.getCurrentUser();
    const response = await axios.get(`${API_URL}/property/${id}/feedbacks`, {
      headers: {
        Authorization: `Bearer ${user.access_token}`
      }
    });
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response.data);
  }
});

export const addNote = createAsyncThunk(
  'notes/addNote',
  async ({ property_id, note }, thunkAPI) => {
    try {
      const user = authService.getCurrentUser();
      const response = await axios.post(
        `${API_URL}/property/feedbacks/`,
        { feedback: note, property_id },
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

const notesSlice = createSlice({
  name: 'notes',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getNote.pending, (state) => {
        state.notes.isLoading = true;
        state.notes.error = null;
      })
      .addCase(getNote.fulfilled, (state, action) => {
        state.notes.isLoading = false;
        state.notes.data = action.payload;
      })
      .addCase(getNote.rejected, (state, action) => {
        state.notes.isLoading = false;
        state.notes.error = action.payload;
      })
      .addCase(addNote.pending, (state) => {
        state.addNote.isLoading = true;
        state.addNote.error = null;
        state.addNote.isSuccess = false;
      })
      .addCase(addNote.fulfilled, (state, action) => {
        const user = getLocalStorageUser();
        state.addNote.isLoading = false;
        state.addNote.isSuccess = true;
        // Ensure state.notes.data is an array
        if (!Array.isArray(state.notes.data)) {
          state.notes.data = [];
        }

        const res = {
          ...action.payload,
          user_name: `${user.data.first_name} ${user.data.last_name}`,
          avatar_url: user.data.avatar_url
        };
        // Add the new note to the notes.data array
        state.notes.data.push(res);
      })
      .addCase(addNote.rejected, (state, action) => {
        state.addNote.isLoading = false;
        state.addNote.isSuccess = false;
        state.addNote.error = action.payload;
      });
  }
});

export const selectNotes = (state) => state.notes;

export default notesSlice.reducer;
