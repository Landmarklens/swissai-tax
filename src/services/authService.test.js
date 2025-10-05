import axios from 'axios';
import authService from './authService';
import config from '../config/environments';

jest.mock('axios');

const API_URL = process.env.REACT_APP_API_BASE_URL || config.API_BASE_URL || 'https://api.swissai.tax';

describe('authService', () => {
  // Helper to create a valid JWT token that won't be expired
  const createValidToken = () => {
    // Create a token that expires in 1 hour
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const payload = { exp };
    const encodedPayload = btoa(JSON.stringify(payload));
    return `header.${encodedPayload}.signature`;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    authService._resetInstance();
  });

  describe('initiateGoogleLogin', () => {
    it('should initiate Google login with userType', async () => {
      const mockResponse = { data: { authUrl: 'https://google.com/auth' } };
      axios.get.mockResolvedValue(mockResponse);

      const result = await authService.initiateGoogleLogin('customer');

      // The redirect_url is dynamically calculated based on window.location
      // So we just check that the call was made with the correct user_type
      expect(axios.get).toHaveBeenCalledWith(`${API_URL}/auth/login/google`,
        expect.objectContaining({
          params: expect.objectContaining({
            user_type: 'customer',
            redirect_url: expect.any(String) // Accept any redirect URL since it's dynamically calculated
          })
        })
      );
      expect(result).toEqual({ authUrl: 'https://google.com/auth' });
    });

    it('should handle error in initiateGoogleLogin', async () => {
      const error = { response: { data: { message: 'Error' } } };
      axios.get.mockRejectedValue(error);

      await expect(authService.initiateGoogleLogin('customer')).rejects.toEqual({ message: 'Error' });
    });
  });

  describe('handleGoogleLoginCallback', () => {
    it('should handle Google login callback and store user', async () => {
      const mockResponse = {
        data: {
          access_token: 'token123',
          user: { id: 1, email: 'test@example.com' }
        }
      };
      axios.get.mockResolvedValue(mockResponse);

      const result = await authService.handleGoogleLoginCallback();

      expect(axios.get).toHaveBeenCalledWith(`${API_URL}/auth/login/google/callback`);
      expect(localStorage.getItem('user')).toEqual(JSON.stringify(mockResponse.data));
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('googleSignIn', () => {
    it('should sign in with Google and store user', async () => {
      const mockResponse = {
        data: {
          access_token: 'token123',
          user: { id: 1, email: 'test@example.com' }
        }
      };
      axios.post.mockResolvedValue(mockResponse);

      const result = await authService.googleSignIn('idToken123');

      expect(axios.post).toHaveBeenCalledWith(`${API_URL}/auth/google`, { idToken: 'idToken123' });
      expect(localStorage.getItem('user')).toEqual(JSON.stringify(mockResponse.data));
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('login', () => {
    it('should login with email and password', async () => {
      const mockResponse = {
        data: {
          access_token: 'token123',
          user: { id: 1, email: 'test@example.com' }
        }
      };
      axios.post.mockResolvedValue(mockResponse);

      const result = await authService.login('test@example.com', 'password123');

      expect(axios.post).toHaveBeenCalledWith(`${API_URL}/auth/login`, {
        email: 'test@example.com',
        password: 'password123'
      });
      expect(localStorage.getItem('user')).toEqual(JSON.stringify(mockResponse.data));
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle login error', async () => {
      const error = { response: { data: { detail: 'Invalid credentials' } } };
      axios.post.mockRejectedValue(error);

      const result = await authService.login('test@example.com', 'wrong');
      expect(result).toEqual({ error: 'Invalid credentials' });
    });
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const userData = { email: 'test@example.com', password: 'password123', name: 'Test User' };
      const mockResponse = { data: { message: 'Registration successful' } };
      axios.post.mockResolvedValue(mockResponse);

      const result = await authService.register(userData);

      expect(axios.post).toHaveBeenCalledWith(`${API_URL}/auth/register`, userData);
      expect(result).toEqual({ message: 'Registration successful' });
    });
  });

  describe('createTrialSubscription', () => {
    it('should create trial subscription', async () => {
      const token = createValidToken();
      const mockUser = { access_token: token };
      localStorage.setItem('user', JSON.stringify(mockUser));
      
      const mockResponse = { data: { subscription: { id: 1, type: 'trial' } } };
      axios.post.mockResolvedValue(mockResponse);

      const result = await authService.createTrialSubscription();

      expect(axios.post).toHaveBeenCalledWith(`${API_URL}/api/subscriptions/activate-trial`, null, {
        headers: { Authorization: `Bearer ${token}` }
      });
      expect(result).toEqual({ subscription: { id: 1, type: 'trial' } });
    });
  });

  describe('logout', () => {
    it('should clear localStorage on logout', () => {
      localStorage.setItem('user', JSON.stringify({ id: 1 }));
      localStorage.setItem('otherData', 'test');

      authService.logout();

      expect(localStorage.getItem('user')).toBeNull();
      expect(localStorage.getItem('otherData')).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user from localStorage', () => {
      const user = { id: 1, email: 'test@example.com', access_token: createValidToken() };
      localStorage.setItem('user', JSON.stringify(user));

      const result = authService.getCurrentUser();

      expect(result).toEqual(user);
    });

    it('should return null if no user', () => {
      const result = authService.getCurrentUser();
      expect(result).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true if user has access_token', () => {
      localStorage.setItem('user', JSON.stringify({ access_token: createValidToken() }));

      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should return false if no user', () => {
      expect(authService.isAuthenticated()).toBe(false);
    });

    it('should return false if user has no access_token', () => {
      localStorage.setItem('user', JSON.stringify({ id: 1 }));

      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('getToken', () => {
    it('should return access token', () => {
      const token = createValidToken();
      localStorage.setItem('user', JSON.stringify({ access_token: token }));

      expect(authService.getToken()).toBe(token);
    });

    it('should return null if no user', () => {
      expect(authService.getToken()).toBeNull();
    });
  });

  describe('refreshToken', () => {
    it('should refresh token and update localStorage', async () => {
      const currentUser = { access_token: createValidToken(), refresh_token: 'refresh_token' };
      localStorage.setItem('user', JSON.stringify(currentUser));

      const mockResponse = { data: { access_token: 'new_token' } };
      axios.post.mockResolvedValue(mockResponse);

      const result = await authService.refreshToken();

      expect(axios.post).toHaveBeenCalledWith(`${API_URL}/auth/refresh-token`, {
        refresh_token: 'refresh_token'
      });
      
      const updatedUser = JSON.parse(localStorage.getItem('user'));
      expect(updatedUser.access_token).toBe('new_token');
      expect(result).toEqual({ access_token: 'new_token' });
    });
  });

  describe('requestResetPassword', () => {
    it('should request password reset', async () => {
      const mockResponse = { data: { message: 'Reset link sent' }, status: 200 };
      axios.post.mockResolvedValue(mockResponse);

      const result = await authService.requestResetPassword('test@example.com');

      expect(axios.post).toHaveBeenCalledWith(`${API_URL}/auth/reset-password/request`, {
        email: 'test@example.com'
      });
      expect(result).toEqual({ message: 'Reset link sent', status: 200 });
    });

    it('should return error if no email provided', async () => {
      const result = await authService.requestResetPassword();
      expect(result).toEqual({ error: 'Email is required to request a password reset.' });
    });
  });

  describe('verifyResetPassword', () => {
    it('should verify reset password token', async () => {
      const mockResponse = { data: { valid: true }, status: 200 };
      axios.post.mockResolvedValue(mockResponse);

      const result = await authService.verifyResetPassword('token123');

      expect(axios.post).toHaveBeenCalledWith(`${API_URL}/auth/reset-password/verify`, {
        token: 'token123'
      });
      expect(result).toEqual({ valid: true, status: 200 });
    });

    it('should return error if no token provided', async () => {
      const result = await authService.verifyResetPassword();
      expect(result).toEqual({ error: 'Token is required to verify a password reset.' });
    });
  });

  describe('confirmResetPassword', () => {
    it('should confirm password reset', async () => {
      const mockResponse = { data: { message: 'Password reset successful' }, status: 200 };
      axios.post.mockResolvedValue(mockResponse);

      const result = await authService.confirmResetPassword({
        token: 'token123',
        new_password: 'newPassword123'
      });

      expect(axios.post).toHaveBeenCalledWith(`${API_URL}/auth/reset-password/confirm`, {
        token: 'token123',
        new_password: 'newPassword123'
      });
      expect(result).toEqual({ message: 'Password reset successful', status: 200 });
    });

    it('should return error if no token or password provided', async () => {
      const result = await authService.confirmResetPassword({ token: 'token123' });
      expect(result).toEqual({ error: 'Token and new password are required to password reset.' });
    });
  });
});