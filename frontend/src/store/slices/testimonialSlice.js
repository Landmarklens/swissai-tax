import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getData } from '../../api/apiClient';
import { getTestimonilsRoute } from '../../routes/apiRoutes';
const initialState = {
  isLoading: false,
  isSuccess: false,
  error: null
};
export const testimonials = createAsyncThunk('testimonials', async (params = {}, thunkApi) => {
  try {
    const response = await getData(getTestimonilsRoute, params);

    // Throw Err
    if (response?.status && response.status !== 200) {
      throw response;
    }
    return response;
  } catch (err) {
    return thunkApi.rejectWithValue(err?.error || 'Something went wrong');
  }
});

const testimonialSlice = createSlice({
  name: 'testimonials',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(testimonials.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(testimonials.fulfilled, (state, action) => {
        state.isSuccess = true;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(testimonials.rejected, (state, action) => {
        state.isLoading = false;
        state.isSuccess = false;
        state.error = action.payload;
      });
  }
});
export const selectTestimonials = (state) => state.counter;
export default testimonialSlice.reducer;
