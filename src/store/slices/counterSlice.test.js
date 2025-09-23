import { configureStore } from '@reduxjs/toolkit';
import counterReducer, { counter, selectCounter } from './counterSlice';
import { getData } from '../../api/apiClient';
import { getCounter } from '../../routes/apiRoutes';

jest.mock('../../api/apiClient');

describe('counterSlice', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        counter: counterReducer
      }
    });
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState().counter;
      expect(state).toEqual({
        isLoading: false,
        isSuccess: false,
        error: null
      });
    });
  });

  describe('counter action', () => {
    it('should handle counter.pending', () => {
      store.dispatch(counter.pending());
      const state = store.getState().counter;
      expect(state.isLoading).toBe(true);
      expect(state.error).toBe(null);
    });

    it('should handle counter.fulfilled', async () => {
      const mockResponse = {
        status: 200,
        data: { count: 100 }
      };
      getData.mockResolvedValue(mockResponse);

      await store.dispatch(counter());

      expect(getData).toHaveBeenCalledWith(getCounter, {});

      const state = store.getState().counter;
      expect(state.isLoading).toBe(false);
      expect(state.isSuccess).toBe(true);
      expect(state.error).toBe(null);
    });

    it('should handle counter.fulfilled with params', async () => {
      const mockResponse = {
        status: 200,
        data: { count: 50 }
      };
      getData.mockResolvedValue(mockResponse);

      const params = { type: 'active' };
      await store.dispatch(counter(params));

      expect(getData).toHaveBeenCalledWith(getCounter, params);

      const state = store.getState().counter;
      expect(state.isLoading).toBe(false);
      expect(state.isSuccess).toBe(true);
      expect(state.error).toBe(null);
    });

    it('should handle counter.rejected with error response', async () => {
      const mockError = { status: 400, error: 'Bad request' };
      getData.mockResolvedValue(mockError);

      await store.dispatch(counter());

      const state = store.getState().counter;
      expect(state.isLoading).toBe(false);
      expect(state.isSuccess).toBe(false);
      expect(state.error).toBe('Bad request');
    });

    it('should handle counter.rejected with default error', async () => {
      getData.mockRejectedValue(new Error('Network error'));

      await store.dispatch(counter());

      const state = store.getState().counter;
      expect(state.isLoading).toBe(false);
      expect(state.isSuccess).toBe(false);
      expect(state.error).toBe('Something went wrong');
    });
  });

  describe('selectCounter selector', () => {
    it('should select counter state', () => {
      const mockState = {
        counter: {
          isLoading: false,
          isSuccess: true,
          error: null
        }
      };

      const result = selectCounter(mockState);
      expect(result).toEqual(mockState.counter);
    });
  });
});