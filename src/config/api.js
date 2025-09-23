import config from './environments';

// Use the properly configured API base URL from environments.js
export const API_BASE_URL = config.API_BASE_URL;

export const API_ENDPOINTS = {
  USER_COUNTER: '/api/user-counter/',
  // Add other endpoints here as needed
};