import axios from 'axios';
import authService from '../services/authService';
import { toast } from 'react-toastify';
import { markErrorAsProcessed } from '../utils/errorUtils';
import { getApiUrl } from '../utils/api/getApiUrl';

// Set base URL
axios.defaults.baseURL = getApiUrl();

// Request interceptor
axios.interceptors.request.use(
  (config) => {
    // Cookie-based auth: Include credentials for all requests
    // This ensures httpOnly cookies are sent with requests
    config.withCredentials = true;

    // DEBUG: Log request details

    // Note: We use cookie-based authentication, so we don't need
    // to add Authorization headers. The JWT is in an httpOnly cookie.
    // Legacy token-based auth (if any) would need Authorization header,
    // but for cookie-based auth this would conflict.

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axios.interceptors.response.use(
  (response) => {
    // DEBUG: Log response
    return response;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      // Skip showing error toast for certain endpoints that handle their own errors
      const skipToastUrls = [
        '/auth/register',
        '/auth/login',
        '/auth/reset-password'
      ];

      const shouldSkipToast = skipToastUrls.some(url => error.config?.url?.includes(url));

      // Handle different status codes
      switch (status) {
        case 400:
          // Bad Request - often handled by the component itself
          if (!shouldSkipToast) {
            const errorMessage = data.error || data.detail || data.message || 'Bad request';
            toast.error(errorMessage);
          }
          break;

        case 401:
          // Unauthorized - redirect to homepage where user can login
          authService.logout();
          window.location.href = '/';
          toast.error('Session expired. Please login again.');
          break;

        case 403:
          // Forbidden - Check for inactive user
          if (data.detail === "User account is inactive") {
            // Clear stored authentication
            authService.logout();
            // Redirect to homepage where user can login
            window.location.href = '/';
            // Show message
            toast.error("Your account has been deactivated. Please contact support.");
          } else {
            toast.error("You don't have permission to access this resource");
          }
          break;

        case 404:
          // Not found
          toast.error('The requested resource was not found');
          break;

        case 422:
          // Validation error
          if (data.error) {
            toast.error(data.error);
          } else if (data.detail) {
            // Handle array of validation errors
            if (Array.isArray(data.detail)) {
              data.detail.forEach(err => {
                toast.error(err.msg || 'Validation error');
              });
            } else {
              toast.error(data.detail);
            }
          }
          break;

        case 429:
          // Rate limit exceeded - Check the endpoint
          const url = error.config?.url || '';
          let rateLimitMessage = 'Too many requests. Please slow down.';

          // Customize message based on endpoint
          if (url.includes('/auth/login')) {
            rateLimitMessage = 'Too many login attempts. Please wait 1 minute and try again.';
          } else if (url.includes('/auth/register')) {
            rateLimitMessage = 'Too many registration attempts. Please wait a few minutes and try again.';
          } else if (url.includes('/auth/reset-password/request')) {
            rateLimitMessage = 'Too many password reset requests. Please wait 1 hour and try again.';
          } else if (url.includes('/auth/reset-password/verify')) {
            rateLimitMessage = 'Too many verification attempts. Please try again later.';
          } else if (url.includes('/auth/reset-password/confirm')) {
            rateLimitMessage = 'Too many password reset attempts. Please try again later.';
          }

          // Only show if not already handled by component
          if (!shouldSkipToast) {
            toast.error(rateLimitMessage);
          }
          break;

        case 500:
        case 502:
        case 503:
          // Server error
          toast.error('Server error. Please try again later.');
          break;

        default:
          // Generic error handling
          const errorMessage = data.error || data.detail || data.message || 'Something went wrong';
          toast.error(errorMessage);
      }
    } else if (error.request) {
      // Request made but no response
      toast.error('No response from server. Please check your connection.');
    } else {
      // Request setup error
      toast.error('Request failed. Please try again.');
    }

    // Mark error as processed by interceptor
    markErrorAsProcessed(error);
    return Promise.reject(error);
  }
);

// File upload validation helper
export const validateFileUpload = (file, options = {}) => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    isVideo = false
  } = options;

  // If video, update defaults
  const finalMaxSize = isVideo ? 100 * 1024 * 1024 : maxSize; // 100MB for video
  const finalAllowedTypes = isVideo
    ? ['video/mp4', 'video/x-msvideo', 'video/quicktime', 'video/webm']
    : allowedTypes;

  // Validate file size
  if (file.size > finalMaxSize) {
    const sizeMB = finalMaxSize / (1024 * 1024);
    return {
      valid: false,
      error: `File size must be less than ${sizeMB}MB`
    };
  }

  // Validate file type
  if (!finalAllowedTypes.includes(file.type)) {
    const typeNames = isVideo
      ? 'MP4, AVI, MOV, or WebM'
      : 'JPEG, PNG, GIF, or WebP';
    return {
      valid: false,
      error: `Only ${typeNames} files are allowed`
    };
  }

  return { valid: true };
};

export default axios;
