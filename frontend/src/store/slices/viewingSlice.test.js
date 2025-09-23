import { configureStore } from '@reduxjs/toolkit';
import axios from 'axios';
import viewingReducer, {
  requestViewing,
  getViewings,
  updateViewing,
  cancelViewing,
  getTakeItOut,
  updateTakeItOut,
  takeItOut,
  selectViewing
} from './viewingSlice';
import authService from '../../services/authService';

jest.mock('axios');
jest.mock('../../services/authService');

import config from '../../config/environments';
const API_URL = config.API_BASE_URL;

describe('viewingSlice', () => {
  let store;
  const mockUser = { access_token: 'test-token' };

  beforeEach(() => {
    store = configureStore({
      reducer: {
        viewing: viewingReducer
      }
    });
    jest.clearAllMocks();
    authService.getCurrentUser.mockReturnValue(mockUser);
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState().viewing;
      expect(state).toEqual({
        viewings: {
          data: [],
          isLoading: false,
          error: null
        },
        requestViewing: {
          data: null,
          isLoading: false,
          error: null
        },
        updateViewing: {
          data: null,
          isLoading: false,
          error: null
        },
        deleteViewing: {
          data: null,
          isLoading: false,
          error: null
        },
        takeItOut: {
          data: null,
          isLoading: false,
          error: null
        },
        getTakeItOut: {
          data: null,
          isLoading: false,
          error: null
        }
      });
    });
  });

  describe('requestViewing action', () => {
    it('should handle requestViewing.pending', () => {
      store.dispatch(requestViewing.pending());
      const state = store.getState().viewing;
      expect(state.requestViewing.isLoading).toBe(true);
      expect(state.requestViewing.error).toBe(null);
    });

    it('should handle requestViewing.fulfilled', async () => {
      const viewingData = { property_id: 1, date: '2024-01-01', time: '10:00' };
      const mockResponse = { id: 1, ...viewingData, status: 'scheduled' };
      axios.post.mockResolvedValue({ data: mockResponse });

      await store.dispatch(requestViewing(viewingData));

      expect(axios.post).toHaveBeenCalledWith(
        `${API_URL}/viewing/`,
        viewingData,
        { headers: { Authorization: 'Bearer test-token' } }
      );

      const state = store.getState().viewing;
      expect(state.requestViewing.isLoading).toBe(false);
      expect(state.requestViewing.data).toEqual(mockResponse);
    });

    it('should handle requestViewing.rejected', async () => {
      const mockError = { message: 'Invalid viewing data' };
      axios.post.mockRejectedValue({ response: { data: mockError } });

      await store.dispatch(requestViewing({}));

      const state = store.getState().viewing;
      expect(state.requestViewing.isLoading).toBe(false);
      expect(state.requestViewing.error).toEqual(mockError);
    });
  });

  describe('getViewings action', () => {
    it('should handle getViewings.pending', () => {
      store.dispatch(getViewings.pending());
      const state = store.getState().viewing;
      expect(state.viewings.isLoading).toBe(true);
      expect(state.viewings.error).toBe(null);
    });

    it('should handle getViewings.fulfilled with no params', async () => {
      const mockViewings = [
        { id: 1, property_id: 1, date: '2024-01-01' },
        { id: 2, property_id: 2, date: '2024-01-02' }
      ];
      axios.get.mockResolvedValue({ data: mockViewings });

      await store.dispatch(getViewings({}));

      expect(axios.get).toHaveBeenCalledWith(
        `${API_URL}/api/viewing`,
        { headers: { Authorization: 'Bearer test-token' } }
      );

      const state = store.getState().viewing;
      expect(state.viewings.isLoading).toBe(false);
      expect(state.viewings.data).toEqual(mockViewings);
    });

    it('should handle getViewings.fulfilled with userId', async () => {
      const mockViewings = [{ id: 1, user_id: 'user123' }];
      axios.get.mockResolvedValue({ data: mockViewings });

      await store.dispatch(getViewings({ userId: 'user123' }));

      expect(axios.get).toHaveBeenCalledWith(
        `${API_URL}/api/viewing?user_id=user123`,
        { headers: { Authorization: 'Bearer test-token' } }
      );

      const state = store.getState().viewing;
      expect(state.viewings.data).toEqual(mockViewings);
    });

    it('should handle getViewings.fulfilled with propertyId', async () => {
      const mockViewings = [{ id: 1, property_id: 'prop123' }];
      axios.get.mockResolvedValue({ data: mockViewings });

      await store.dispatch(getViewings({ propertyId: 'prop123' }));

      expect(axios.get).toHaveBeenCalledWith(
        `${API_URL}/api/viewing?property_id=prop123`,
        { headers: { Authorization: 'Bearer test-token' } }
      );

      const state = store.getState().viewing;
      expect(state.viewings.data).toEqual(mockViewings);
    });

    it('should handle getViewings.fulfilled with both userId and propertyId', async () => {
      const mockViewings = [{ id: 1, user_id: 'user123', property_id: 'prop123' }];
      axios.get.mockResolvedValue({ data: mockViewings });

      await store.dispatch(getViewings({ userId: 'user123', propertyId: 'prop123' }));

      expect(axios.get).toHaveBeenCalledWith(
        `${API_URL}/api/viewing?user_id=user123&property_id=prop123`,
        { headers: { Authorization: 'Bearer test-token' } }
      );

      const state = store.getState().viewing;
      expect(state.viewings.data).toEqual(mockViewings);
    });
  });

  describe('updateViewing action', () => {
    it('should handle updateViewing.pending', () => {
      store.dispatch(updateViewing.pending());
      const state = store.getState().viewing;
      expect(state.updateViewing.isLoading).toBe(true);
      expect(state.updateViewing.error).toBe(null);
    });

    it('should handle updateViewing.fulfilled', async () => {
      const updateData = { viewingId: 1, body: { date: '2024-01-02', time: '14:00' } };
      const mockResponse = { id: 1, date: '2024-01-02', time: '14:00' };
      axios.put.mockResolvedValue({ data: mockResponse });

      await store.dispatch(updateViewing(updateData));

      expect(axios.put).toHaveBeenCalledWith(
        `${API_URL}/viewing/1`,
        updateData.body,
        { headers: { Authorization: 'Bearer test-token' } }
      );

      const state = store.getState().viewing;
      expect(state.updateViewing.isLoading).toBe(false);
      expect(state.updateViewing.data).toEqual(mockResponse);
    });
  });

  describe('cancelViewing action', () => {
    it('should handle cancelViewing.pending', () => {
      store.dispatch(cancelViewing.pending());
      const state = store.getState().viewing;
      expect(state.deleteViewing.isLoading).toBe(true);
      expect(state.deleteViewing.error).toBe(null);
    });

    it('should handle cancelViewing.fulfilled', async () => {
      const mockResponse = { message: 'Viewing cancelled successfully' };
      axios.delete.mockResolvedValue({ data: mockResponse });

      await store.dispatch(cancelViewing(1));

      expect(axios.delete).toHaveBeenCalledWith(
        `${API_URL}/viewing/1`,
        { headers: { Authorization: 'Bearer test-token' } }
      );

      const state = store.getState().viewing;
      expect(state.deleteViewing.isLoading).toBe(false);
      expect(state.deleteViewing.data).toEqual(mockResponse);
    });
  });

  describe('takeItOut action', () => {
    it('should handle takeItOut.pending', () => {
      store.dispatch(takeItOut.pending());
      const state = store.getState().viewing;
      expect(state.takeItOut.isLoading).toBe(true);
      expect(state.takeItOut.error).toBe(null);
    });

    it('should handle takeItOut.fulfilled', async () => {
      const takeItOutData = { property_id: 1, items: ['key', 'documents'] };
      const mockResponse = { id: 1, ...takeItOutData };
      axios.post.mockResolvedValue({ data: mockResponse });

      await store.dispatch(takeItOut(takeItOutData));

      expect(axios.post).toHaveBeenCalledWith(
        `${API_URL}/take-it-out/`,
        takeItOutData,
        { headers: { Authorization: 'Bearer test-token' } }
      );

      const state = store.getState().viewing;
      expect(state.takeItOut.isLoading).toBe(false);
      expect(state.takeItOut.data).toEqual(mockResponse);
    });
  });

  describe('getTakeItOut action', () => {
    it('should handle getTakeItOut.pending', () => {
      store.dispatch(getTakeItOut.pending());
      const state = store.getState().viewing;
      expect(state.getTakeItOut.isLoading).toBe(true);
      expect(state.getTakeItOut.error).toBe(null);
    });

    it('should handle getTakeItOut.fulfilled', async () => {
      const mockTakeItOuts = [
        { id: 1, property_id: 1, items: ['key'] },
        { id: 2, property_id: 2, items: ['documents'] }
      ];
      axios.get.mockResolvedValue({ data: mockTakeItOuts });

      await store.dispatch(getTakeItOut());

      expect(axios.get).toHaveBeenCalledWith(
        `${API_URL}/take-it-out/`,
        { headers: { Authorization: 'Bearer test-token' } }
      );

      const state = store.getState().viewing;
      expect(state.getTakeItOut.isLoading).toBe(false);
      expect(state.getTakeItOut.data).toEqual(mockTakeItOuts);
    });
  });

  describe('updateTakeItOut action', () => {
    it('should handle updateTakeItOut.fulfilled and update existing data', async () => {
      // Set initial getTakeItOut data
      await store.dispatch(getTakeItOut.fulfilled([
        { id: 1, number: 5 },
        { id: 2, number: 10 }
      ]));

      const updateData = { takeItOutId: 1, body: { number: 7 } };
      const mockResponse = { id: 1, number: 7 };
      axios.put.mockResolvedValue({ data: mockResponse });

      await store.dispatch(updateTakeItOut(updateData));

      expect(axios.put).toHaveBeenCalledWith(
        `${API_URL}/take-it-out/1`,
        updateData.body,
        { headers: { Authorization: 'Bearer test-token' } }
      );

      const state = store.getState().viewing;
      expect(state.getTakeItOut.data[0].number).toBe(7);
      expect(state.getTakeItOut.data[1].number).toBe(10);
      // updateTakeItOut is dynamically added by the reducer
      expect(state.updateTakeItOut).toBeDefined();
      expect(state.updateTakeItOut.isLoading).toBe(false);
      expect(state.updateTakeItOut.data).toEqual({ id: 1, number: 7 });
    });
  });

  describe('selectViewing selector', () => {
    it('should select viewing state', () => {
      const mockState = {
        viewing: {
          viewings: { data: [], isLoading: false, error: null }
        }
      };

      const result = selectViewing(mockState);
      expect(result).toEqual(mockState.viewing);
    });
  });
});