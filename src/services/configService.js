import { API_BASE_URL } from '../config/api';

class ConfigService {
  constructor() {
    this.cache = {};
    this.pendingRequests = {};
    this.apiKeyPromise = null; // Single promise for API key
  }

  async getGoogleMapsApiKey() {
    // Check cache first
    if (this.cache.googleMapsApiKey) {
      return this.cache.googleMapsApiKey;
    }

    // Use a single promise for all requests
    if (!this.apiKeyPromise) {
      this.apiKeyPromise = this.fetchGoogleMapsApiKey().then(apiKey => {
        this.cache.googleMapsApiKey = apiKey;
        return apiKey;
      }).catch(error => {
        // Reset promise on error so it can be retried
        this.apiKeyPromise = null;
        throw error;
      });
    }

    return this.apiKeyPromise;
  }

  async fetchGoogleMapsApiKey() {
    try {
      // First try to get from backend (AWS Parameter Store)
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/api/config/google-maps-key`, {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.apiKey) {
          return data.apiKey;
        }
      }
    } catch (error) {
      console.warn('Failed to fetch Google Maps API key from backend:', error);
    }

    // Fallback to environment variable if backend fails
    const envKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    if (envKey) {
      return envKey;
    }

    // Last resort - return the hardcoded key (should be removed in production)
    console.warn('Using fallback Google Maps API key. Configure AWS Parameter Store for production.');
    return 'AIzaSyCF7Z8tYc7NetbJpdKogIQIjoQ1sYUQQL0';
  }

  clearCache() {
    this.cache = {};
  }
}

export default new ConfigService();