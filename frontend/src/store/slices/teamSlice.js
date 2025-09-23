import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getData } from '../../api/apiClient';
import { getTeamRoute } from '../../routes/apiRoutes';
const initialState = {
  isLoading: false,
  isSuccess: false,
  error: null
};
export const team = createAsyncThunk('team', async (params = {}, thunkApi) => {
  try {
    const response = await getData(getTeamRoute, params);

    // Throw Err
    if (response?.status && response.status !== 200) {
      throw response;
    }
    return response;
  } catch (err) {
    return thunkApi.rejectWithValue(err?.error || 'Something went wrong');
  }
});

const teamSlice = createSlice({
  name: 'team',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(team.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(team.fulfilled, (state, action) => {
        state.isSuccess = true;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(team.rejected, (state, action) => {
        state.isLoading = false;
        state.isSuccess = false;
        state.error = action.payload;
      });
  }
});
export const selectTeam = (state) => state.team;
export default teamSlice.reducer;
