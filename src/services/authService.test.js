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
      const mockResponse = { data: { authorization_url: 'https://google.com/auth' } };
      axios.get.mockResolvedValue(mockResponse);

      const result = await authService.initiateGoogleLogin('tenant');

      // The redirect_url is dynamically calculated based on window.location
      // So we just check that the call was made with the correct user_type
      expect(axios.get).toHaveBeenCalledWith(`${API_URL}/api/auth/login/google`,
        expect.objectContaining({
          params: expect.objectContaining({
            user_type: 'tenant',
            redirect_url: expect.any(String) // Accept any redirect URL since it's dynamically calculated
          })
        })
      );
      expect(result).toEqual({ authorization_url: 'https://google.com/auth' });
    });

    it('should use environment variable for redirect URL when set', async () => {
      const originalEnv = process.env.REACT_APP_GOOGLE_REDIRECT_URL;
      const originalLocation = window.location;

      // Set environment variable
      process.env.REACT_APP_GOOGLE_REDIRECT_URL = 'https://swissai.tax/en/google-redirect';

      // Mock window.location to NOT be localhost
      delete window.location;
      window.location = {
        hostname: 'swissai.tax',
        origin: 'https://swissai.tax',
        pathname: '/en/home',
        href: 'https://swissai.tax/en/home'
      };

      const mockResponse = { data: { authorization_url: 'https://google.com/auth' } };
      axios.get.mockResolvedValue(mockResponse);

      await authService.initiateGoogleLogin('tenant');

      expect(axios.get).toHaveBeenCalledWith(`${API_URL}/api/auth/login/google`,
        expect.objectContaining({
          params: expect.objectContaining({
            redirect_url: 'https://swissai.tax/en/google-redirect'
          })
        })
      );

      // Restore original values
      process.env.REACT_APP_GOOGLE_REDIRECT_URL = originalEnv;
      window.location = originalLocation;
    });

    it('should construct redirect URL for localhost', async () => {
      const originalHostname = window.location.hostname;
      const originalPathname = window.location.pathname;

      // Mock localhost
      delete window.location;
      window.location = {
        hostname: 'localhost',
        origin: 'http://localhost:3000',
        pathname: '/en/home'
      };

      const mockResponse = { data: { authorization_url: 'https://google.com/auth' } };
      axios.get.mockResolvedValue(mockResponse);

      await authService.initiateGoogleLogin('tenant');

      expect(axios.get).toHaveBeenCalledWith(`${API_URL}/api/auth/login/google`,
        expect.objectContaining({
          params: expect.objectContaining({
            redirect_url: 'http://localhost:3000/en/google-redirect'
          })
        })
      );

      // Restore
      window.location.hostname = originalHostname;
      window.location.pathname = originalPathname;
    });

    it('should handle error in initiateGoogleLogin', async () => {
      const error = { response: { data: { message: 'Error' } } };
      axios.get.mockRejectedValue(error);

      await expect(authService.initiateGoogleLogin('tenant')).rejects.toEqual({ message: 'Error' });
    });

    it('should log error when authorization_url is missing', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      const mockResponse = { data: {} }; // Missing authorization_url
      axios.get.mockResolvedValue(mockResponse);

      await authService.initiateGoogleLogin('tenant');

      expect(consoleError).toHaveBeenCalledWith(
        '[AuthService] Invalid response - missing authorization_url'
      );
      expect(consoleError).toHaveBeenCalledWith(
        '[AuthService] Full response:',
        mockResponse
      );

      consoleError.mockRestore();
    });
  });

  describe('handleGoogleLoginCallback', () => {
    it('should handle Google login callback and store user', async () => {
      const mockResponse = {
        data: {
          id: 1,
          email: 'test@example.com',
          access_token: 'token123'
        }
      };
      axios.get.mockResolvedValue(mockResponse);

      const result = await authService.handleGoogleLoginCallback();

      expect(axios.get).toHaveBeenCalledWith(`${API_URL}/api/auth/login/google/callback`);
      // access_token is NOT stored in localStorage (cookie-based auth)
      const expectedStored = { id: 1, email: 'test@example.com' };
      expect(localStorage.getItem('user')).toEqual(JSON.stringify(expectedStored));
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('googleSignIn', () => {
    it('should sign in with Google and store user', async () => {
      const mockResponse = {
        data: {
          id: 1,
          email: 'test@example.com',
          access_token: 'token123'
        }
      };
      axios.post.mockResolvedValue(mockResponse);

      const result = await authService.googleSignIn('idToken123');

      expect(axios.post).toHaveBeenCalledWith(`${API_URL}/api/auth/google`, { idToken: 'idToken123' });
      // access_token is NOT stored in localStorage (cookie-based auth)
      const expectedStored = { id: 1, email: 'test@example.com' };
      expect(localStorage.getItem('user')).toEqual(JSON.stringify(expectedStored));
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('login', () => {
    it('should login with email and password', async () => {
      const mockResponse = {
        data: {
          success: true,
          user: { id: 1, email: 'test@example.com' }
        }
      };
      axios.post.mockResolvedValue(mockResponse);

      const result = await authService.login('test@example.com', 'password123');

      expect(axios.post).toHaveBeenCalledWith(
        `${API_URL}/api/auth/login?use_cookie=true`,
        { email: 'test@example.com', password: 'password123' },
        { withCredentials: true }
      );
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
      const mockResponse = { data: { id: 1, email: 'test@example.com' } };
      axios.post.mockResolvedValue(mockResponse);

      const result = await authService.register(userData);

      expect(axios.post).toHaveBeenCalledWith(`${API_URL}/api/auth/register`, userData);
      expect(result).toEqual({ id: 1, email: 'test@example.com' });
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
    it('should call logout endpoint and clear localStorage', async () => {
      axios.post.mockResolvedValue({ data: { success: true } });
      localStorage.setItem('user', JSON.stringify({ id: 1 }));
      localStorage.setItem('otherData', 'test');

      await authService.logout();

      expect(axios.post).toHaveBeenCalledWith(`${API_URL}/api/auth/logout`, {}, { withCredentials: true });
      expect(localStorage.getItem('user')).toBeNull();
      expect(localStorage.getItem('otherData')).toBeNull();
    });

    it('should preserve cookie consent and language preferences when logging out', async () => {
      axios.post.mockResolvedValue({ data: { success: true } });
      localStorage.setItem('user', JSON.stringify({ id: 1, email: 'test@example.com' }));
      localStorage.setItem('swissai_cookie_consent', JSON.stringify({
        version: '1.0',
        preferences: { analytics: true, preferences: true }
      }));
      localStorage.setItem('i18nextLng', 'de');
      localStorage.setItem('authToken', 'token123');
      localStorage.setItem('otherData', 'should be cleared');

      await authService.logout();

      // Auth-related items should be cleared
      expect(localStorage.getItem('user')).toBeNull();
      expect(localStorage.getItem('authToken')).toBeNull();
      expect(localStorage.getItem('otherData')).toBeNull();

      // User preferences should be preserved
      expect(localStorage.getItem('swissai_cookie_consent')).toBeTruthy();
      expect(JSON.parse(localStorage.getItem('swissai_cookie_consent'))).toEqual({
        version: '1.0',
        preferences: { analytics: true, preferences: true }
      });
      expect(localStorage.getItem('i18nextLng')).toBe('de');
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
    it('should return true if user has email', () => {
      localStorage.setItem('user', JSON.stringify({ email: 'test@example.com' }));

      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should return false if no user', () => {
      expect(authService.isAuthenticated()).toBe(false);
    });

    it('should return false if user has no email', () => {
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
      const currentUser = {
        id: 1,
        email: 'test@example.com',
        access_token: createValidToken(),
        refresh_token: 'refresh_token'
      };
      // Store without access_token (as setCurrentUser would do)
      const { access_token, refresh_token, ...userData } = currentUser;
      localStorage.setItem('user', JSON.stringify({ ...userData, refresh_token }));

      const mockResponse = { data: { access_token: 'new_token' } };
      axios.post.mockResolvedValue(mockResponse);

      const result = await authService.refreshToken();

      expect(axios.post).toHaveBeenCalledWith(`${API_URL}/api/auth/refresh-token`, {
        refresh_token: 'refresh_token'
      });

      // access_token is NOT stored in localStorage (cookie-based auth)
      const updatedUser = JSON.parse(localStorage.getItem('user'));
      expect(updatedUser.access_token).toBeUndefined();
      expect(result).toEqual({ access_token: 'new_token' });
    });
  });

  describe('requestResetPassword', () => {
    it('should request password reset', async () => {
      const mockResponse = { data: { message: 'Reset link sent' }, status: 200 };
      axios.post.mockResolvedValue(mockResponse);

      const result = await authService.requestResetPassword('test@example.com');

      expect(axios.post).toHaveBeenCalledWith(`${API_URL}/api/auth/reset-password/request`, {
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

      expect(axios.post).toHaveBeenCalledWith(`${API_URL}/api/auth/reset-password/verify`, {
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

      expect(axios.post).toHaveBeenCalledWith(`${API_URL}/api/auth/reset-password/confirm`, {
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

  describe('checkAuth', () => {
    it('should verify authentication status with backend', async () => {
      const mockResponse = { data: { id: 1, email: 'test@example.com' } };
      axios.get.mockResolvedValue(mockResponse);

      const result = await authService.checkAuth();

      expect(axios.get).toHaveBeenCalledWith(`${API_URL}/api/user/me`, { withCredentials: true });
      expect(result).toBe(true);
      expect(authService.getCurrentUser()).toEqual({ id: 1, email: 'test@example.com' });
    });

    it('should return false on error', async () => {
      axios.get.mockRejectedValue(new Error('Unauthorized'));

      const result = await authService.checkAuth();

      expect(result).toBe(false);
      expect(authService.getCurrentUser()).toBeNull();
    });
  });
});