import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchAllStations = createAsyncThunk(
  'stations/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const apiKey = process.env.REACT_APP_NREL_API_KEY;
      if (!apiKey) {
        throw new Error('NREL API key is not configured');
      }
      const { data: chargingStations } = await axios.get(
        `https://developer.nrel.gov/api/alt-fuel-stations/v1.json?api_key=${apiKey}&state=IL&fuel_type=ELEC`
      );
      return chargingStations.fuel_stations;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  style: {},
  chargingStations: []
};

const mapSlice = createSlice({
  name: 'map',
  initialState,
  reducers: {
    setStyle: (state, action) => {
      state.style = action.payload;
    },
    changeWaterColor: (state, action) => {
      if (state.style && state.style.layers) {
        const layer = state.style.layers.find((layer) => layer.id === 'water');
        if (layer && layer.paint) {
          layer.paint['fill-color'] = action.payload;
        }
      }
    },
    toggleStations: (state, action) => {
      if (state.style && state.style.layers) {
        const layer = state.style.layers.find((layer) => layer.id === 'allStations');
        if (layer && layer.layout) {
          layer.layout.visibility = action.payload;
        }
      }
    },
    changeMarkerSize: (state, action) => {
      if (state.style && state.style.layers) {
        const layer = state.style.layers.find((layer) => layer.id === 'allStations');
        if (layer && layer.paint) {
          layer.paint['circle-radius'] = action.payload;
        }
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllStations.fulfilled, (state, action) => {
        state.chargingStations = action.payload;
      })
      .addCase(fetchAllStations.rejected, (state, action) => {
        // Error handled in the UI component
        state.chargingStations = [];
      });
  }
});

export const { setStyle, changeWaterColor, toggleStations, changeMarkerSize } = mapSlice.actions;
export default mapSlice.reducer;
