import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getDataWithQuery } from '../../api/apiClient';
const initialState = {
  isLoading: false,
  isSuccess: false,
  error: null
};
export const profile = createAsyncThunk('profile', async (params, thunkApi) => {
  try {
    const response = await getDataWithQuery('user/me', params);
    // Throw Err
    if (response?.status && response.status !== 200) {
      throw response;
    }
    return response;
  } catch (err) {
    return thunkApi.rejectWithValue(err?.error || 'Something went wrong');
  }
});

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(profile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(profile.fulfilled, (state, action) => {
        state.isSuccess = true;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(profile.rejected, (state, action) => {
        state.isLoading = false;
        state.isSuccess = false;
        state.error = action.payload;
      });
  }
});
export const selectProfile = (state) => state.profile;
export default profileSlice.reducer;
