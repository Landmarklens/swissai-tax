import { configureStore } from '@reduxjs/toolkit';
import profileReducer, { profile, selectProfile } from './profileSlice';
import { getDataWithQuery } from '../../api/apiClient';

jest.mock('../../api/apiClient');

describe('profileSlice', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        profile: profileReducer
      }
    });
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState().profile;
      expect(state).toEqual({
        isLoading: false,
        isSuccess: false,
        error: null
      });
    });
  });

  describe('profile action', () => {
    it('should handle profile.pending', () => {
      store.dispatch(profile.pending());
      const state = store.getState().profile;
      expect(state.isLoading).toBe(true);
      expect(state.error).toBe(null);
    });

    it('should handle profile.fulfilled', async () => {
      const mockResponse = {
        status: 200,
        data: { id: 1, name: 'Test User', email: 'test@example.com' }
      };
      getDataWithQuery.mockResolvedValue(mockResponse);

      await store.dispatch(profile({ includeDetails: true }));

      expect(getDataWithQuery).toHaveBeenCalledWith('user/me', { includeDetails: true });

      const state = store.getState().profile;
      expect(state.isLoading).toBe(false);
      expect(state.isSuccess).toBe(true);
      expect(state.error).toBe(null);
    });

    it('should handle profile.rejected with error message', async () => {
      const mockError = { status: 401, error: 'Unauthorized' };
      getDataWithQuery.mockResolvedValue(mockError);

      await store.dispatch(profile({}));

      const state = store.getState().profile;
      expect(state.isLoading).toBe(false);
      expect(state.isSuccess).toBe(false);
      expect(state.error).toBe('Unauthorized');
    });

    it('should handle profile.rejected with default error', async () => {
      getDataWithQuery.mockRejectedValue(new Error('Network error'));

      await store.dispatch(profile({}));

      const state = store.getState().profile;
      expect(state.isLoading).toBe(false);
      expect(state.isSuccess).toBe(false);
      expect(state.error).toBe('Something went wrong');
    });
  });

  describe('selectProfile selector', () => {
    it('should select profile state', () => {
      const mockState = {
        profile: {
          isLoading: false,
          isSuccess: true,
          error: null
        }
      };

      const result = selectProfile(mockState);
      expect(result).toEqual(mockState.profile);
    });
  });
});