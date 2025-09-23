import { configureStore } from '@reduxjs/toolkit';
import axios from 'axios';
import propertiesReducer, {
  fetchProperties,
  getPropertyDashboard,
  createProperty,
  getPropertyImages,
  addPropertyImage,
  getProperty,
  updateProperty,
  deleteProperty,
  selectProperties
} from './propertiesSlice';
import authService from '../../services/authService';
import config from '../../config/environments';

jest.mock('axios');
jest.mock('../../services/authService');

const API_URL = process.env.REACT_APP_API_URL || config.API_BASE_URL || 'https://api.homeai.ch';

describe('propertiesSlice', () => {
  let store;
  const mockUser = { access_token: 'test-token' };

  beforeEach(() => {
    store = configureStore({
      reducer: {
        properties: propertiesReducer
      }
    });
    jest.clearAllMocks();
    authService.getCurrentUser.mockReturnValue(mockUser);
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState().properties;
      expect(state).toEqual({
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
        updatePropertyStatus: {
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
        }
      });
    });
  });

  describe('fetchProperties action', () => {
    it('should handle fetchProperties.pending', () => {
      store.dispatch(fetchProperties.pending());
      const state = store.getState().properties;
      expect(state.properties.isLoading).toBe(true);
      expect(state.properties.error).toBe(null);
    });

    it('should handle fetchProperties.fulfilled', async () => {
      const mockProperties = [
        { id: 1, name: 'Property 1' },
        { id: 2, name: 'Property 2' }
      ];
      axios.get.mockResolvedValue({ data: mockProperties });

      await store.dispatch(fetchProperties());

      expect(axios.get).toHaveBeenCalledWith(`${API_URL}/api/property`, {
        headers: { Authorization: 'Bearer test-token' },
        timeout: 10000
      });

      const state = store.getState().properties;
      expect(state.properties.isLoading).toBe(false);
      expect(state.properties.data).toEqual(mockProperties);
    });

    it('should handle fetchProperties.rejected with server error', async () => {
      const mockError = { message: 'Failed to fetch properties' };
      axios.get.mockRejectedValue({ 
        response: { 
          data: mockError,
          status: 500 
        } 
      });

      await store.dispatch(fetchProperties());

      const state = store.getState().properties;
      expect(state.properties.isLoading).toBe(false);
      expect(state.properties.error).toEqual('Failed to fetch properties');
    });

    it('should handle fetchProperties.rejected with 404 (no properties)', async () => {
      axios.get.mockRejectedValue({ 
        response: { 
          status: 404,
          data: { message: 'No properties found' }
        } 
      });

      await store.dispatch(fetchProperties());

      const state = store.getState().properties;
      expect(state.properties.isLoading).toBe(false);
      expect(state.properties.data).toEqual([]);
      expect(state.properties.error).toBe(null);
    });
  });

  describe('createProperty action', () => {
    it('should handle createProperty.pending', () => {
      store.dispatch(createProperty.pending());
      const state = store.getState().properties;
      expect(state.createProperty.isLoading).toBe(true);
      expect(state.createProperty.error).toBe(null);
    });

    it('should handle createProperty.fulfilled', async () => {
      const newProperty = { id: 3, name: 'New Property' };
      const propertyData = { name: 'New Property', address: '123 Main St' };
      axios.post.mockResolvedValue({ data: newProperty });

      await store.dispatch(createProperty(propertyData));

      expect(axios.post).toHaveBeenCalledWith(
        `${API_URL}/api/property/`,
        propertyData,
        { headers: { Authorization: 'Bearer test-token' } }
      );

      const state = store.getState().properties;
      expect(state.createProperty.isLoading).toBe(false);
      expect(state.createProperty.data).toEqual(newProperty);
    });

    it('should handle createProperty.rejected', async () => {
      const mockError = { message: 'Failed to create property' };
      axios.post.mockRejectedValue({ response: { data: mockError } });

      await store.dispatch(createProperty({ name: 'Test' }));

      const state = store.getState().properties;
      expect(state.createProperty.isLoading).toBe(false);
      expect(state.createProperty.error).toEqual(mockError);
    });
  });

  describe('getProperty action', () => {
    it('should handle getProperty.pending', () => {
      store.dispatch(getProperty.pending());
      const state = store.getState().properties;
      expect(state.currentProperty.isLoading).toBe(true);
      expect(state.currentProperty.error).toBe(null);
    });

    it('should handle getProperty.fulfilled', async () => {
      const property = { id: 1, name: 'Test Property' };
      axios.get.mockResolvedValue({ data: property });

      await store.dispatch(getProperty(1));

      expect(axios.get).toHaveBeenCalledWith(
        `${API_URL}/api/property/1`,
        { headers: { Authorization: 'Bearer test-token' } }
      );

      const state = store.getState().properties;
      expect(state.currentProperty.isLoading).toBe(false);
      expect(state.currentProperty.data).toEqual(property);
    });

    it('should handle getProperty.rejected', async () => {
      const mockError = { message: 'Property not found' };
      axios.get.mockRejectedValue({ response: { data: mockError } });

      await store.dispatch(getProperty(999));

      const state = store.getState().properties;
      expect(state.currentProperty.isLoading).toBe(false);
      expect(state.currentProperty.error).toEqual(mockError);
    });
  });

  describe('updateProperty action', () => {
    it('should handle updateProperty.pending', () => {
      store.dispatch(updateProperty.pending());
      const state = store.getState().properties;
      expect(state.updateProperty.isLoading).toBe(true);
      expect(state.updateProperty.error).toBe(null);
    });

    it('should handle updateProperty.fulfilled', async () => {
      const updatedProperty = { id: 1, name: 'Updated Property' };
      const updateData = { id: 1, body: { name: 'Updated Property' } };
      axios.put.mockResolvedValue({ data: updatedProperty });

      await store.dispatch(updateProperty(updateData));

      expect(axios.put).toHaveBeenCalledWith(
        `${API_URL}/api/property/1`,
        updateData.body,
        { headers: { Authorization: 'Bearer test-token' } }
      );

      const state = store.getState().properties;
      expect(state.updateProperty.isLoading).toBe(false);
      expect(state.updateProperty.data).toEqual(updatedProperty);
    });

    it('should handle updateProperty.rejected', async () => {
      const mockError = { message: 'Failed to update property' };
      axios.put.mockRejectedValue({ response: { data: mockError } });

      await store.dispatch(updateProperty({ id: 1, body: {} }));

      const state = store.getState().properties;
      expect(state.updateProperty.isLoading).toBe(false);
      expect(state.updateProperty.error).toEqual(mockError);
    });
  });

  describe('deleteProperty action', () => {
    it('should handle deleteProperty.pending', () => {
      store.dispatch(deleteProperty.pending());
      const state = store.getState().properties;
      expect(state.deleteProperty.isLoading).toBe(true);
      expect(state.deleteProperty.error).toBe(null);
    });

    it('should handle deleteProperty.fulfilled', async () => {
      const response = { message: 'Property deleted successfully' };
      axios.delete.mockResolvedValue({ data: response });

      await store.dispatch(deleteProperty(1));

      expect(axios.delete).toHaveBeenCalledWith(
        `${API_URL}/api/property/1`,
        { headers: { Authorization: 'Bearer test-token' } }
      );

      const state = store.getState().properties;
      expect(state.deleteProperty.isLoading).toBe(false);
      expect(state.deleteProperty.data).toEqual(response);
    });

    it('should handle deleteProperty.rejected', async () => {
      const mockError = { message: 'Failed to delete property' };
      axios.delete.mockRejectedValue({ response: { data: mockError } });

      await store.dispatch(deleteProperty(1));

      const state = store.getState().properties;
      expect(state.deleteProperty.isLoading).toBe(false);
      expect(state.deleteProperty.error).toEqual(mockError);
    });
  });

  describe('getPropertyImages action', () => {
    it('should handle getPropertyImages.pending', () => {
      store.dispatch(getPropertyImages.pending());
      const state = store.getState().properties;
      expect(state.propertyImages.isLoading).toBe(true);
      expect(state.propertyImages.error).toBe(null);
    });

    it('should handle getPropertyImages.fulfilled', async () => {
      const images = [{ id: 1, url: 'image1.jpg' }, { id: 2, url: 'image2.jpg' }];
      axios.get.mockResolvedValue({ data: images });

      await store.dispatch(getPropertyImages(1));

      expect(axios.get).toHaveBeenCalledWith(
        `${API_URL}/api/property/1/images`,
        { headers: { Authorization: 'Bearer test-token' } }
      );

      const state = store.getState().properties;
      expect(state.propertyImages.isLoading).toBe(false);
      expect(state.propertyImages.data).toEqual(images);
    });

    it('should handle getPropertyImages.rejected', async () => {
      const mockError = { message: 'Failed to fetch images' };
      axios.get.mockRejectedValue({ response: { data: mockError } });

      await store.dispatch(getPropertyImages(1));

      const state = store.getState().properties;
      expect(state.propertyImages.isLoading).toBe(false);
      expect(state.propertyImages.error).toEqual(mockError);
    });
  });

  describe('addPropertyImage action', () => {
    it('should handle addPropertyImage.pending', () => {
      store.dispatch(addPropertyImage.pending());
      const state = store.getState().properties;
      expect(state.addPropertyImage.isLoading).toBe(true);
      expect(state.addPropertyImage.error).toBe(null);
    });

    it('should handle addPropertyImage.fulfilled', async () => {
      const newImage = { id: 3, url: 'new-image.jpg' };
      const formData = new FormData();
      const imageData = { propertyId: 1, is_primary: true, file: formData };
      
      axios.post.mockResolvedValue({ data: newImage });

      await store.dispatch(addPropertyImage(imageData));

      expect(axios.post).toHaveBeenCalledWith(
        `${API_URL}/api/property/images/?property_id=1&is_primary=true`,
        formData,
        { headers: { Authorization: 'Bearer test-token' } }
      );

      const state = store.getState().properties;
      expect(state.addPropertyImage.isLoading).toBe(false);
      expect(state.addPropertyImage.data).toEqual(newImage);
    });

    it('should handle addPropertyImage.rejected', async () => {
      const mockError = { message: 'Failed to add image' };
      axios.post.mockRejectedValue({ response: { data: mockError } });

      await store.dispatch(addPropertyImage({ propertyId: 1, file: new FormData() }));

      const state = store.getState().properties;
      expect(state.addPropertyImage.isLoading).toBe(false);
      expect(state.addPropertyImage.error).toEqual(mockError);
    });
  });

  describe('getPropertyDashboard action', () => {
    it('should handle getPropertyDashboard.pending', () => {
      store.dispatch(getPropertyDashboard.pending());
      const state = store.getState().properties;
      expect(state.propertyDashboard.isLoading).toBe(true);
      expect(state.propertyDashboard.error).toBe(null);
    });

    it('should handle getPropertyDashboard.fulfilled', async () => {
      const dashboardData = { views: 100, inquiries: 20 };
      axios.get.mockResolvedValue({ data: dashboardData });

      await store.dispatch(getPropertyDashboard(1));

      expect(axios.get).toHaveBeenCalledWith(
        `${API_URL}/api/property/1/dashboard`,
        { headers: { Authorization: 'Bearer test-token' } }
      );

      const state = store.getState().properties;
      expect(state.propertyDashboard.isLoading).toBe(false);
      expect(state.propertyDashboard.data).toEqual(dashboardData);
    });

    it('should handle getPropertyDashboard.rejected', async () => {
      const mockError = { message: 'Failed to fetch dashboard' };
      axios.get.mockRejectedValue({ response: { data: mockError } });

      await store.dispatch(getPropertyDashboard(1));

      const state = store.getState().properties;
      expect(state.propertyDashboard.isLoading).toBe(false);
      expect(state.propertyDashboard.error).toEqual(mockError);
    });
  });

  describe('selectProperties selector', () => {
    it('should select properties state', () => {
      const mockState = {
        properties: {
          properties: { data: [], isLoading: false, error: null }
        }
      };

      const result = selectProperties(mockState);
      expect(result).toEqual(mockState.properties);
    });
  });
});