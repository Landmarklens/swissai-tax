import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getData } from '../../api/apiClient';
import { getCounter } from '../../routes/apiRoutes';
const initialState = {
  isLoading: false,
  isSuccess: false,
  error: null
};
export const counter = createAsyncThunk('counter', async (params = {}, thunkApi) => {
  try {
    const response = await getData(getCounter, params);
    if (response?.status && response.status !== 200) {
      throw response;
    }
    return response;
  } catch (err) {
    return thunkApi.rejectWithValue(err?.error || 'Something went wrong');
  }
});

const counterSlice = createSlice({
  name: 'counter',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(counter.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(counter.fulfilled, (state, action) => {
        state.isSuccess = true;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(counter.rejected, (state, action) => {
        state.isLoading = false;
        state.isSuccess = false;
        state.error = action.payload;
      });
  }
});
export const selectCounter = (state) => state.counter;
export default counterSlice.reducer;
