import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getData } from '../../api/apiClient';
import { stepperRoute } from '../../routes/apiRoutes';
import { useTranslation } from 'react-i18next';
const initialState = {
  isLoading: false,
  isSuccess: false,
  error: null
};
export const stepper = createAsyncThunk('stepper', async (params = {}, thunkApi) => {
  try {
    const response = await getData(stepperRoute, params);

    // Throw Err
    if (response?.status && response.status !== 200) {
      throw response;
    }
    return response;
  } catch (err) {
    return thunkApi.rejectWithValue(err?.error || 'Something went wrong');
  }
});

const stepperSlice = createSlice({
  name: 'stepper',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(stepper.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(stepper.fulfilled, (state, action) => {
        state.isSuccess = true;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(stepper.rejected, (state, action) => {
        state.isLoading = false;
        state.isSuccess = false;
        state.error = action.payload;
      });
  }
});
export const selectStepper = (state) => state.stepper;
export default stepperSlice.reducer;
