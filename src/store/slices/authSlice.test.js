import { configureStore } from '@reduxjs/toolkit';
import authService from '../../services/authService';

// Mock authService before importing authSlice (important for initial state)
jest.mock('../../services/authService', () => ({
  isAuthenticated: jest.fn(() => false),
  getCurrentUser: jest.fn(() => null),
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn()
}));

import authReducer, { login, logout, signup } from './authSlice';

describe('authSlice', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        auth: authReducer
      }
    });
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState().auth;
      expect(state).toEqual({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        isSuccess: false,
        error: null
      });
    });
  });

  describe('login action', () => {
    it('should handle login.fulfilled', async () => {
      const mockResponse = {
        success: true,
        user: { id: 1, email: 'test@example.com' }
      };
      authService.login.mockResolvedValue(mockResponse);

      await store.dispatch(login({ email: 'test@example.com', password: 'password' }));

      const state = store.getState().auth;
      expect(state.isLoading).toBe(false);
      expect(state.user).toEqual(mockResponse.user);
      expect(state.isSuccess).toBe(true);
      expect(state.isAuthenticated).toBe(true);
      expect(state.error).toBe(null);
    });

    it('should handle login.rejected', async () => {
      authService.login.mockRejectedValue(new Error('Invalid credentials'));

      await store.dispatch(login({ email: 'test@example.com', password: 'wrong' }));

      const state = store.getState().auth;
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Invalid credentials');
    });
  });

  describe('logout action', () => {
    it('should handle logout.fulfilled', async () => {
      // Set initial authenticated state
      const mockResponse = {
        success: true,
        user: { id: 1, email: 'test@example.com' }
      };
      authService.login.mockResolvedValue(mockResponse);
      await store.dispatch(login({ email: 'test@example.com', password: 'password' }));

      // Mock logout
      authService.logout.mockResolvedValue();
      await store.dispatch(logout());

      const state = store.getState().auth;
      expect(state.isLoading).toBe(false);
      expect(state.isAuthenticated).toBe(false);
      expect(state.isSuccess).toBe(false);
      expect(state.user).toBe(null);
    });

    it('should handle logout.rejected', async () => {
      // Mock logout to throw an error
      authService.logout.mockImplementation(() => {
        throw new Error('Logout failed');
      });

      await store.dispatch(logout());

      const state = store.getState().auth;
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Logout failed');
    });
  });

  describe('signup action', () => {
    it('should handle signup.fulfilled', async () => {
      const mockResponse = {
        id: 1,
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe'
      };
      authService.register.mockResolvedValue(mockResponse);

      await store.dispatch(signup({
        email: 'test@example.com',
        password: 'password123',
        first_name: 'John',
        last_name: 'Doe'
      }));

      const state = store.getState().auth;
      expect(state.isLoading).toBe(false);
      expect(state.isSuccess).toBe(true);
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockResponse);
    });

    it('should handle signup.rejected', async () => {
      authService.register.mockRejectedValue(new Error('Registration failed'));

      await store.dispatch(signup({
        email: 'test@example.com',
        password: 'password123'
      }));

      const state = store.getState().auth;
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Registration failed');
    });
  });
});