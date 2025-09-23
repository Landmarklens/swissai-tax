import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import authService from '../../services/authService';
import { jsonData } from '../../db';
import config from '../../config/environments';
const API_URL = process.env.REACT_APP_API_URL || config.API_BASE_URL || 'https://api.homeai.ch';

// Track active fetchProperties request to prevent duplicates
let activeFetchPromise = null;

const initialState = {
  properties: {
    data: [],
    isLoading: false,
    error: null,
    lastFetch: null
  },
  createProperty: {
    data: null,
    isLoading: false,
    error: null
  },
  currentProperty: {
    data: null,
    isLoading: false,
    error: null
  },
  updateProperty: {
    data: null,
    isLoading: false,
    error: null
  },
  deleteProperty: {
    data: null,
    isLoading: false,
    error: null
  },
  propertyImages: {
    data: null,
    isLoading: false,
    error: null
  },
  addPropertyImage: {
    data: null,
    isLoading: false,
    error: null
  },
  deletePropertyImage: {
    data: null,
    isLoading: false,
    error: null
  },
  propertyDashboard: {
    data: null,
    isLoading: false,
    error: null
  },
  updatePropertyStatus: {
    data: null,
    isLoading: false,
    error: null
  }
};


// const addPropertiesImage = async (propertyId, dispatch) => {
//   for (const [idx, { image }] of jsonData.blogPosts.entries()) {
//     try {
//       const response = await axios.get(image, {
//         responseType: "arraybuffer", // Important: set responseType to arraybuffer
//       });
//       const formData = new FormData();
//       // Create a Blob from the array buffer
//       const blob = new Blob([response.data], { type: 'image/jpeg' });
//       formData.append("file", blob);

//       await dispatch(
//         addPropertyImage({
//           propertyId,
//           is_primary: idx === 0,
//           file: formData,
//         })
//       );
//     } catch (error) {
//       console.error("Error fetching the image:", error);
//     }
//   }
// };

export const fetchProperties = createAsyncThunk(
  'properties/fetchProperties',
  async (forceRefresh = false, thunkAPI) => {
    const state = thunkAPI.getState();
    const { properties } = state.properties;
    
    // Check if we're already fetching
    if (properties.isLoading && activeFetchPromise && !forceRefresh) {
      return await activeFetchPromise;
    }
    
    // Check if data was recently fetched (within 30 seconds)
    const now = Date.now();
    const thirtySecondsAgo = now - 30000;
    if (!forceRefresh && properties.lastFetch && properties.lastFetch > thirtySecondsAgo && properties.data.length > 0) {
      return properties.data;
    }
    
    // Also skip if we already have data and no force refresh
    if (!forceRefresh && properties.data && properties.data.length > 0 && !properties.isLoading) {
      return properties.data;
    }
    
    // Create the fetch promise
    const fetchPromise = (async () => {
      try {
        const user = authService.getCurrentUser();
        
        const response = await axios.get(`${API_URL}/api/property`, {
          headers: {
            Authorization: `Bearer ${user.access_token}`
          },
          timeout: 10000 // 10 second timeout
        });
        
        // Return empty array if no properties instead of treating as error
        return response.data || [];
      } catch (error) {
        // Handle timeout specifically
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
          const state = thunkAPI.getState();
          const existingData = state.properties?.properties?.data;
          if (existingData && existingData.length > 0) {
            return existingData; // Return existing data on timeout
          }
        }
        
        // Handle different error cases
        if (error.response?.status === 404) {
          // No properties found - this is normal for new users
          return [];
        }
        
        // Throw the error to be handled by rejectWithValue
        throw error;
      } finally {
        // Always clear the active promise
        activeFetchPromise = null;
      }
    })();
    
    // Store the active promise
    activeFetchPromise = fetchPromise;
    
    try {
      return await fetchPromise;
    } catch (error) {
      if (error.response?.status === 401) {
        return thunkAPI.rejectWithValue({ 
          message: 'Please log in to view your properties',
          status: 401
        });
      }
      
      // For other errors, provide meaningful error message
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          error.message || 
                          'Unable to load properties';
      
      return thunkAPI.rejectWithValue({
        message: errorMessage,
        status: error.response?.status || 500
      });
    }
  }
);

export const getPropertyDashboard = createAsyncThunk(
  'properties/get-property-dashboard',
  async (propertyId, thunkAPI) => {
    try {
      const user = authService.getCurrentUser();
      const response = await axios.get(`${API_URL}/api/property/${propertyId}/dashboard`, {
        headers: {
          Authorization: `Bearer ${user.access_token}`
        }
      });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);

export const createProperty = createAsyncThunk(
  'properties/create-property',
  async (body, thunkAPI) => {
    try {
      const user = authService.getCurrentUser();
      const response = await axios.post(`${API_URL}/api/property/`, body, {
        headers: {
          Authorization: `Bearer ${user.access_token}`
        }
      });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);

export const getPropertyImages = createAsyncThunk(
  'properties/get-property-images',
  async (property_id, thunkAPI) => {
    try {
      const user = authService.getCurrentUser();
      const response = await axios.get(`${API_URL}/api/property/${property_id}/images`, {
        headers: {
          Authorization: `Bearer ${user.access_token}`
        }
      });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);

export const addPropertyImage = createAsyncThunk(
  'properties/add-property-image',
  async ({ propertyId, is_primary = false, file }, thunkAPI) => {
    try {
      const user = authService.getCurrentUser();
      const response = await axios.post(
        `${API_URL}/api/property/images/?property_id=${propertyId}&is_primary=${is_primary}`,
        file,
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

export const getProperty = createAsyncThunk('properties/get-property', async (id, thunkAPI) => {
  try {
    const user = authService.getCurrentUser();
    const response = await axios.get(`${API_URL}/api/property/${id}`, {
      headers: {
        Authorization: `Bearer ${user.access_token}`
      }
    });
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response.data);
  }
});

export const updateProperty = createAsyncThunk(
  'properties/update-property',
  async ({ id, body }, thunkAPI) => {
    try {
      const user = authService.getCurrentUser();
      const response = await axios.put(`${API_URL}/api/property/${id}`, body, {
        headers: {
          Authorization: `Bearer ${user.access_token}`
        }
      });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);

export const deleteProperty = createAsyncThunk(
  'properties/delete-property',
  async (id, thunkAPI) => {
    try {
      const user = authService.getCurrentUser();
      const response = await axios.delete(`${API_URL}/api/property/${id}`, {
        headers: {
          Authorization: `Bearer ${user.access_token}`
        }
      });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);

export const deletePropertyImage = createAsyncThunk(
  'properties/delete-property-image',
  async (imageId, thunkAPI) => {
    try {
      const user = authService.getCurrentUser();
      const response = await axios.delete(`${API_URL}/api/property/images/${imageId}`, {
        headers: {
          Authorization: `Bearer ${user.access_token}`
        }
      });
      // Handle the new response format {id: imageId, message: "..."}
      return { 
        id: imageId, 
        message: response.data.message || 'Image deleted successfully' 
      };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updatePropertyStatus = createAsyncThunk(
  'properties/update-property-status',
  async ({ propertyId, status }, thunkAPI) => {
    console.log(`[Redux Thunk] Updating property ${propertyId} to status: ${status}`);
    try {
      const user = authService.getCurrentUser();
      const response = await axios.patch(
        `${API_URL}/api/property/${propertyId}/status?status=${status}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${user.access_token}`
          }
        }
      );
      console.log('[Redux Thunk] API Response:', response.data);
      console.log('[Redux Thunk] Response status field:', response.data.status);
      console.log('[Redux Thunk] Response images:', response.data.primary_image_urls);
      console.log('[Redux Thunk] Response updated_at:', response.data.updated_at);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

const propertiesSlice = createSlice({
  name: 'properties',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProperties.pending, (state) => {
        state.properties.isLoading = true;
        state.properties.error = null;
      })
      .addCase(fetchProperties.fulfilled, (state, action) => {
        state.properties.isLoading = false;
        state.properties.data = Array.isArray(action.payload) ? action.payload : [];
        state.properties.error = null; // Clear any previous errors
        state.properties.lastFetch = Date.now(); // Record fetch time
      })
      .addCase(fetchProperties.rejected, (state, action) => {
        state.properties.isLoading = false;
        
        // Don't set error for 404 (no properties) - this is normal
        if (action.payload?.status === 404) {
          state.properties.data = [];
          state.properties.error = null;
        } else {
          // For other errors, set error state
          state.properties.error = action.payload?.message || 'Failed to load properties';
        }
      })

      .addCase(createProperty.pending, (state) => {
        state.createProperty.isLoading = true;
        state.createProperty.error = null;
      })
      .addCase(createProperty.fulfilled, (state, action) => {
        state.createProperty.isLoading = false;
        state.createProperty.data = action.payload;
      })
      .addCase(createProperty.rejected, (state, action) => {
        state.createProperty.isLoading = false;
        state.createProperty.error = action.payload;
      })

      .addCase(getProperty.pending, (state) => {
        state.currentProperty.isLoading = true;
        state.currentProperty.error = null;
      })
      .addCase(getProperty.fulfilled, (state, action) => {
        state.currentProperty.isLoading = false;
        state.currentProperty.data = action.payload;
      })
      .addCase(getProperty.rejected, (state, action) => {
        state.currentProperty.isLoading = false;
        state.currentProperty.error = action.payload;
      })

      .addCase(updateProperty.pending, (state) => {
        state.updateProperty.isLoading = true;
        state.updateProperty.error = null;
      })
      .addCase(updateProperty.fulfilled, (state, action) => {
        state.updateProperty.isLoading = false;
        state.updateProperty.data = action.payload;
      })
      .addCase(updateProperty.rejected, (state, action) => {
        state.updateProperty.isLoading = false;
        state.updateProperty.error = action.payload;
      })

      .addCase(deleteProperty.pending, (state) => {
        state.deleteProperty.isLoading = true;
        state.deleteProperty.error = null;
      })
      .addCase(deleteProperty.fulfilled, (state, action) => {
        state.deleteProperty.isLoading = false;
        state.deleteProperty.data = action.payload;
      })
      .addCase(deleteProperty.rejected, (state, action) => {
        state.deleteProperty.isLoading = false;
        state.deleteProperty.error = action.payload;
      })

      .addCase(getPropertyImages.pending, (state) => {
        state.propertyImages.isLoading = true;
        state.propertyImages.error = null;
      })
      .addCase(getPropertyImages.fulfilled, (state, action) => {
        state.propertyImages.isLoading = false;
        state.propertyImages.data = action.payload;
      })
      .addCase(getPropertyImages.rejected, (state, action) => {
        state.propertyImages.isLoading = false;
        state.propertyImages.error = action.payload;
      })

      .addCase(addPropertyImage.pending, (state) => {
        state.addPropertyImage.isLoading = true;
        state.addPropertyImage.error = null;
      })
      .addCase(addPropertyImage.fulfilled, (state, action) => {
        state.addPropertyImage.isLoading = false;
        state.addPropertyImage.data = action.payload;
      })
      .addCase(addPropertyImage.rejected, (state, action) => {
        state.addPropertyImage.isLoading = false;
        state.addPropertyImage.error = action.payload;
      })

      .addCase(deletePropertyImage.pending, (state) => {
        state.deletePropertyImage.isLoading = true;
        state.deletePropertyImage.error = null;
      })
      .addCase(deletePropertyImage.fulfilled, (state, action) => {
        state.deletePropertyImage.isLoading = false;
        state.deletePropertyImage.data = action.payload;
      })
      .addCase(deletePropertyImage.rejected, (state, action) => {
        state.deletePropertyImage.isLoading = false;
        state.deletePropertyImage.error = action.payload;
      })
      .addCase(getPropertyDashboard.pending, (state) => {
        state.propertyDashboard = {
          ...state.propertyDashboard,
          isLoading: true,
          error: null
        };
      })
      .addCase(getPropertyDashboard.fulfilled, (state, action) => {
        state.propertyDashboard = {
          ...state.propertyDashboard,
          isLoading: false,
          data: action.payload
        };
      })
      .addCase(getPropertyDashboard.rejected, (state, action) => {
        state.propertyDashboard = {
          ...state.propertyDashboard,
          isLoading: false,
          error: action.payload
        };
      })

      .addCase(updatePropertyStatus.pending, (state) => {
        if (!state.updatePropertyStatus) {
          state.updatePropertyStatus = { isLoading: false, error: null, data: null };
        }
        state.updatePropertyStatus.isLoading = true;
        state.updatePropertyStatus.error = null;
      })
      .addCase(updatePropertyStatus.fulfilled, (state, action) => {
        console.log('\n[Redux Reducer] updatePropertyStatus.fulfilled');
        console.log('[Redux Reducer] Payload:', action.payload);
        console.log('[Redux Reducer] Payload status:', action.payload.status);
        console.log('[Redux Reducer] Payload images:', action.payload.primary_image_urls);

        if (!state.updatePropertyStatus) {
          state.updatePropertyStatus = { isLoading: false, error: null, data: null };
        }
        state.updatePropertyStatus.isLoading = false;
        state.updatePropertyStatus.data = action.payload;

        // Update the property in the properties list with new status
        const updatedProperty = action.payload;
        const propertyIndex = state.properties.data.findIndex(
          property => property.id === updatedProperty.id
        );
        if (propertyIndex !== -1) {
          const oldProperty = state.properties.data[propertyIndex];
          console.log('[Redux Reducer] Old property:', oldProperty);
          console.log('[Redux Reducer] Old status:', oldProperty.status);
          console.log('[Redux Reducer] Old images:', oldProperty.primary_image_urls);

          // Update with the new property data from the backend
          // The backend returns the complete property including primary_image_urls
          // IMPORTANT: Merge order matters - old data first, then new data, then explicit overrides
          const mergedProperty = {
            ...state.properties.data[propertyIndex], // Keep all old data
            ...updatedProperty // Override with new data from backend
          };

          // Only override primary_image_urls if it's undefined in the response
          if (updatedProperty.primary_image_urls === undefined) {
            mergedProperty.primary_image_urls = state.properties.data[propertyIndex].primary_image_urls;
          }

          state.properties.data[propertyIndex] = mergedProperty;
          console.log('[Redux Reducer] Merged property:', mergedProperty);
          console.log('[Redux Reducer] New status:', mergedProperty.status);
          console.log('[Redux Reducer] New images:', mergedProperty.primary_image_urls);
          console.log('[Redux Reducer] Property successfully updated in state\n');
        }
        
        // Update current property if it matches
        if (state.currentProperty.data?.id === updatedProperty.id) {
          state.currentProperty.data = {
            ...state.currentProperty.data,
            ...updatedProperty
          };
        }
      })
      .addCase(updatePropertyStatus.rejected, (state, action) => {
        if (!state.updatePropertyStatus) {
          state.updatePropertyStatus = { isLoading: false, error: null, data: null };
        }
        state.updatePropertyStatus.isLoading = false;
        state.updatePropertyStatus.error = action.payload;
      });
  }
});

export const selectProperties = (state) => state.properties;

export default propertiesSlice.reducer;
