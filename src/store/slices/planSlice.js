import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getData } from '../../api/apiClient';
import { getPlanRoute } from '../../routes/apiRoutes';
import { useTranslation } from 'react-i18next';
const initialState = {
  isLoading: false,
  isSuccess: false,
  error: null
};
export const plans = createAsyncThunk('plan', async (params = {}, thunkApi) => {
  try {
    const response = await getData(getPlanRoute, params);

    // Throw Err
    if (response?.status && response.status !== 200) {
      throw response;
    }
    return response;
  } catch (err) {
    return thunkApi.rejectWithValue(err?.error || 'Something went wrong');
  }
});

const planSlice = createSlice({
  name: 'plan',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(plans.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(plans.fulfilled, (state, action) => {
        state.isSuccess = true;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(plans.rejected, (state, action) => {
        state.isLoading = false;
        state.isSuccess = false;
        state.error = action.payload;
      });
  }
});
export const selectPlan = (state) => state.counter;
export default planSlice.reducer;
