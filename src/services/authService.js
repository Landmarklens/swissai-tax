import axios from 'axios';

import config from '../config/environments';
const API_URL = process.env.REACT_APP_API_BASE_URL || config.API_BASE_URL || 'https://api.swissai.tax';

class AuthService {
  constructor() {
    this.user = null;
  }

  // Set current user - only store non-sensitive data
  setCurrentUser(user) {
    this.user = user;
    if (user) {
      // Remove sensitive token data before storing
      const { access_token, token_type, ...userData } = user;
      localStorage.setItem('user', JSON.stringify(userData));
    } else {
      localStorage.removeItem('user');
    }
  }

  // Check if token is expired (legacy - tokens now in httpOnly cookies)
  isTokenExpired(token) {
    if (!token) return true;

    try {
      const parts = token.split('.');
      if (parts.length !== 3) return true;

      const payload = JSON.parse(atob(parts[1]));
      if (!payload.exp) return false; // No expiry claim

      // Check if expired (with 60 second buffer)
      return payload.exp * 1000 < Date.now() - 60000;
    } catch (error) {
      console.error('Error parsing token:', error);
      return true;
    }
  }
}

const authServiceInstance = new AuthService();

const authService = {
  initiateGoogleLogin: async (userType) => {
    try {
      // Get redirect URL - where the backend should redirect after Google OAuth
      let redirect_url = process.env.REACT_APP_GOOGLE_REDIRECT_URL;

      // If no redirect URL is set, construct one based on current location
      if (!redirect_url || redirect_url.includes('localhost') && !window.location.href.includes('localhost')) {
        // Use the actual current domain for production
        const currentLang = window.location.pathname.split('/')[1] || 'en';
        const baseUrl = window.location.origin;
        redirect_url = `${baseUrl}/${currentLang}/google-redirect`;
      }

      // For local development, ensure we use the correct localhost URL
      if (window.location.hostname === 'localhost') {
        const currentLang = window.location.pathname.split('/')[1] || 'en';
        redirect_url = `http://localhost:3000/${currentLang}/google-redirect`;
      }

      const fullUrl = `${API_URL}/api/auth/login/google`;
      const params = { user_type: userType, redirect_url };

      const response = await axios.get(fullUrl, {
        params
      });

      if (!response.data || !response.data.authorization_url) {
        console.error('[AuthService] Invalid response - missing authorization_url');
        console.error('[AuthService] Full response:', response);
      }

      return response.data;
    } catch (error) {
      console.error('[AuthService] Error in initiateGoogleLogin:', error);
      throw error.response?.data || error;
    }
  },

  handleGoogleLoginCallback: async () => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/login/google/callback`);
      if (response.data.access_token) {
        authServiceInstance.setCurrentUser(response.data);
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Existing Google Sign-In method (you may want to remove or update this)
  googleSignIn: async (idToken) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/google`, { idToken });
      if (response.data.access_token) {
        authServiceInstance.setCurrentUser(response.data);
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Regular email/password login (now uses cookies)
  login: async (email, password) => {
    try {
      // use_cookie=true tells backend to set httpOnly cookie
      const response = await axios.post(`${API_URL}/api/auth/login?use_cookie=true`, {
        email,
        password
      }, {
        withCredentials: true // Ensure cookies are sent/received
      });

      // Backend now returns user data without token
      if (response.data.success && response.data.user) {
        authServiceInstance.setCurrentUser(response.data.user);
      }
      return response.data;
    } catch (error) {
      // Return error object instead of throwing to maintain existing behavior
      return { error: error.response?.data?.detail || error.response?.data?.error || 'Login failed' };
    }
  },

  // User registration
  register: async (userData) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/register`, userData);
      if (response.data) {
        // Registration successful
        // authService.login(userData.email, userData.password);
        return response.data;
      }
      return response.data;
    } catch (error) {
      // Return error object instead of throwing to maintain existing behavior
      return { error: error.response?.data?.detail || error.response?.data?.error || 'Registration failed' };
    }
  },

  createTrialSubscription: async (userData) => {
    try {
      const user = authService.getCurrentUser();
      // User authenticated
      const response = await axios.post(`${API_URL}/api/subscriptions/activate-trial`, null, {
        headers: { Authorization: `Bearer ${user.access_token}` }
      });

      // Trial subscription created

      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Logout (now clears cookie on server)
  logout: async () => {
    try {
      // Call backend to clear cookie
      await axios.post(`${API_URL}/api/auth/logout`, {}, {
        withCredentials: true
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with local cleanup even if server request fails
    } finally {
      // Clear local state
      authServiceInstance.setCurrentUser(null);
      localStorage.clear();
      // Don't redirect here - let the calling code handle navigation
    }
  },

  // Get current user - from localStorage (non-sensitive data only)
  getCurrentUser: () => {
    if (!authServiceInstance.user) {
      try {
        const stored = localStorage.getItem('user');
        authServiceInstance.user = stored ? JSON.parse(stored) : null;
      } catch (error) {
        authServiceInstance.user = null;
      }
    } else {
    }

    return authServiceInstance.user;
  },

  // Check if user is authenticated (cookie-based)
  isAuthenticated: () => {
    const user = authService.getCurrentUser();
    const isAuth = !!user && !!user.email;
    // User data exists in localStorage = authenticated
    // Cookie is checked by backend on each request
    return isAuth;
  },

  // Set current user (exposed for external use)
  setCurrentUser: (user) => {
    return authServiceInstance.setCurrentUser(user);
  },

  // Verify authentication status with backend
  checkAuth: async () => {
    try {
      const response = await axios.get(`${API_URL}/api/user/me`, {
        withCredentials: true
      });
      if (response.data) {
        authServiceInstance.setCurrentUser(response.data);
        return true;
      }
      return false;
    } catch (error) {
      authServiceInstance.setCurrentUser(null);
      return false;
    }
  },

  // Get authentication token
  getToken: () => {
    const user = authService.getCurrentUser();
    return user ? user.access_token : null;
  },

  // Refresh token (if your backend supports it)
  refreshToken: async () => {
    try {
      const user = authService.getCurrentUser();
      if (user && user.refresh_token) {
        const response = await axios.post(`${API_URL}/api/auth/refresh-token`, {
          refresh_token: user.refresh_token
        });
        if (response.data.access_token) {
          user.access_token = response.data.access_token;
          authServiceInstance.setCurrentUser(user);
        }
        return response.data;
      }
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // -------------------------------------------------------------------------//
  // RESET PASSWORD
  requestResetPassword: async (email) => {
    if (!email) {
      return { error: 'Email is required to request a password reset.' };
    }

    try {
      const response = await axios.post(`${API_URL}/api/auth/reset-password/request`, { email });

      if (response.data) {
        // Reset password request sent successfully
        return { ...response.data, status: response.status };
      }
      return response.data;
    } catch (error) {
      // Return error object instead of throwing to maintain consistent error handling
      return { error: error.response?.data?.detail || error.response?.data?.error || 'Failed to request password reset' };
    }
  },

  verifyResetPassword: async (token) => {
    if (!token) {
      return { error: 'Token is required to verify a password reset.' };
    }

    try {
      const response = await axios.post(`${API_URL}/api/auth/reset-password/verify`, { token });

      if (response.data) {
        // Reset password request sent successfully
        return { ...response.data, status: response.status };
      }

      return { ...response.data, status: response.status };
    } catch (error) {
      // Return error object instead of throwing to maintain consistent error handling
      return { error: error.response?.data?.detail || error.response?.data?.error || 'Failed to verify reset token' };
    }
  },

  // Reset authServiceInstance (for testing)
  _resetInstance: () => {
    authServiceInstance.user = null;
  },

  confirmResetPassword: async ({ token, new_password }) => {
    if (!token || !new_password) {
      return { error: 'Token and new password are required to password reset.' };
    }

    try {
      const response = await axios.post(`${API_URL}/api/auth/reset-password/confirm`, {
        token,
        new_password
      });

      if (response.data) {
        // Reset password request sent successfully
        return { ...response.data, status: response.status };
      }
      return { ...response.data, status: response.status };
    } catch (error) {
      // Return error object instead of throwing to maintain consistent error handling
      return { error: error.response?.data?.detail || error.response?.data?.error || 'Failed to reset password' };
    }
  }
};

export default authService;
