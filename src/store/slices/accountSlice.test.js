import { configureStore } from '@reduxjs/toolkit';
import axios from 'axios';
import accountReducer, {
  fetchUserProfile,
  editUserProfile,
  updateProfileAvatar,
  selectAccount
} from './accountSlice';
import authService from '../../services/authService';

jest.mock('axios');
jest.mock('../../services/authService');

import config from '../../config/environments';
const API_URL = config.API_BASE_URL;

describe('accountSlice', () => {
  let store;
  const mockUser = { id: 1, email: 'test@example.com' };

  beforeEach(() => {
    store = configureStore({
      reducer: {
        account: accountReducer
      }
    });
    jest.clearAllMocks();
    authService.getCurrentUser.mockReturnValue(mockUser);
    authService.setCurrentUser.mockImplementation(() => {});
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState().account;
      expect(state).toEqual({
        isLoading: false,
        isSuccess: false,
        error: null,
        data: null,
        profile: null
      });
    });
  });

  describe('fetchUserProfile action', () => {
    it('should handle fetchUserProfile.pending', () => {
      store.dispatch(fetchUserProfile.pending());
      const state = store.getState().account;
      expect(state.isLoading).toBe(true);
      expect(state.error).toBe(null);
    });

    it('should handle fetchUserProfile.fulfilled', async () => {
      const mockProfile = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        language: 'en'
      };
      axios.get.mockResolvedValue({ data: mockProfile });

      await store.dispatch(fetchUserProfile());

      // Cookie-based auth - no Authorization header
      expect(axios.get).toHaveBeenCalledWith(`${API_URL}/api/user/profile`);

      const state = store.getState().account;
      expect(state.isLoading).toBe(false);
      expect(state.isSuccess).toBe(true);
      expect(state.data).toEqual(mockProfile);
      expect(authService.setCurrentUser).toHaveBeenCalledWith(mockProfile);
    });

    it('should handle fetchUserProfile.rejected', async () => {
      const mockError = { message: 'Profile not found' };
      axios.get.mockRejectedValue({ response: { data: mockError } });

      await store.dispatch(fetchUserProfile());

      const state = store.getState().account;
      expect(state.isLoading).toBe(false);
      expect(state.isSuccess).toBe(false);
      expect(state.error).toEqual(mockError);
    });
  });

  describe('editUserProfile action', () => {
    it('should handle editUserProfile.pending', () => {
      store.dispatch(editUserProfile.pending());
      const state = store.getState().account;
      expect(state.isLoading).toBe(true);
      expect(state.error).toBe(null);
    });

    it('should handle editUserProfile.fulfilled', async () => {
      const userData = { name: 'Jane Doe', email: 'jane@example.com' };
      const mockUpdatedProfile = { id: 1, ...userData };
      axios.put.mockResolvedValue({ data: mockUpdatedProfile });

      await store.dispatch(editUserProfile(userData));

      // Cookie-based auth - no Authorization header
      expect(axios.put).toHaveBeenCalledWith(
        `${API_URL}/api/user/profile`,
        userData
      );

      const state = store.getState().account;
      expect(state.isLoading).toBe(false);
      expect(state.isSuccess).toBe(true);
      expect(state.data).toEqual(mockUpdatedProfile);
    });

    it('should handle editUserProfile.rejected with response data', async () => {
      const mockError = { message: 'Invalid data' };
      axios.put.mockRejectedValue({ response: { data: mockError } });

      await store.dispatch(editUserProfile({ name: 'Test' }));

      const state = store.getState().account;
      expect(state.isLoading).toBe(false);
      expect(state.isSuccess).toBe(false);
      expect(state.error).toEqual(mockError);
    });

    it('should handle editUserProfile.rejected with error message', async () => {
      const error = new Error('Network error');
      axios.put.mockRejectedValue(error);

      await store.dispatch(editUserProfile({ name: 'Test' }));

      const state = store.getState().account;
      expect(state.isLoading).toBe(false);
      expect(state.isSuccess).toBe(false);
      expect(state.error).toBe('Network error');
    });
  });

  describe('updateProfileAvatar action', () => {
    it('should handle updateProfileAvatar.fulfilled', async () => {
      // Set initial profile data
      await store.dispatch(fetchUserProfile.fulfilled({
        id: 1,
        name: 'John Doe',
        avatar_url: 'old-avatar.jpg'
      }));

      const mockFile = new File([''], 'avatar.jpg', { type: 'image/jpeg' });
      const mockResponse = { avatar_url: 'new-avatar.jpg' };
      axios.put.mockResolvedValue({ data: mockResponse });

      await store.dispatch(updateProfileAvatar(mockFile));

      // Cookie-based auth - only Content-Type header for multipart
      expect(axios.put).toHaveBeenCalledWith(
        `${API_URL}/api/user/profile/avatar`,
        expect.any(FormData),
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      const state = store.getState().account;
      expect(state.data.avatar_url).toBe('new-avatar.jpg');
    });

    it('should handle updateProfileAvatar.rejected', async () => {
      const mockFile = new File([''], 'avatar.jpg', { type: 'image/jpeg' });
      const mockError = { message: 'File too large' };
      axios.put.mockRejectedValue({ response: { data: mockError } });

      const result = await store.dispatch(updateProfileAvatar(mockFile));

      expect(result.type).toBe('account/updateProfileAvatar/rejected');
      expect(result.payload).toEqual(mockError);
    });
  });

  describe('selectAccount selector', () => {
    it('should select account state', () => {
      const mockState = {
        account: {
          isLoading: false,
          isSuccess: true,
          error: null,
          data: { id: 1, name: 'Test User' }
        }
      };

      const result = selectAccount(mockState);
      expect(result).toEqual(mockState.account);
    });
  });
});