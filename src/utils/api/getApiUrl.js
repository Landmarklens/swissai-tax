import config from '../../config/environments';

/**
 * Get the proper API base URL for the current environment
 * @returns {string} The API base URL
 */
export function getApiUrl() {
  // Always use production API URL
  // Override with environment variable if set
  return process.env.REACT_APP_API_URL || config.API_BASE_URL || 'https://api.homeai.ch';
}

/**
 * Get the API URL for a specific endpoint
 * @param {string} endpoint - The API endpoint (should start with /)
 * @returns {string} The full API URL with endpoint
 */
export function getApiEndpoint(endpoint) {
  const baseUrl = getApiUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
}