/**
 * Analytics API Service
 * Connects to the comprehensive analytics endpoints
 */

import axios from 'axios';

export const analyticsAPI = {
  // Get comprehensive analytics (main dashboard endpoint)
  getComprehensiveAnalytics: async (params = {}) => {
    console.log('[Analytics API] getComprehensiveAnalytics called with params:', params);
    
    const searchParams = new URLSearchParams();
    
    // Special handling: only include radius_km if postal_code is also present
    const filteredParams = { ...params };
    if (filteredParams.radius_km && !filteredParams.postal_code) {
      console.log('[Analytics API] Removing radius_km since postal_code is not present');
      delete filteredParams.radius_km;
    }
    
    Object.keys(filteredParams).forEach(key => {
      if (filteredParams[key] !== null && filteredParams[key] !== undefined && filteredParams[key] !== '') {
        searchParams.append(key, filteredParams[key]);
      }
    });
    
    const queryString = searchParams.toString();
    const url = `/api/analytics/comprehensive${queryString ? `?${queryString}` : ''}`;
    console.log('[Analytics API] Fetching from URL:', url);
    
    try {
      const response = await axios.get(url);
      console.log('[Analytics API] Response received:', response.data);
      return response.data;
    } catch (error) {
      console.error('[Analytics API] Error fetching comprehensive analytics:', error);
      throw error;
    }
  },

  // Get market analytics with location filtering  
  getMarketAnalytics: async (params = {}) => {
    const searchParams = new URLSearchParams();
    
    // Special handling: only include radius_km if postal_code is also present
    const filteredParams = { ...params };
    if (filteredParams.radius_km && !filteredParams.postal_code) {
      delete filteredParams.radius_km;
    }
    
    Object.keys(filteredParams).forEach(key => {
      if (filteredParams[key] !== null && filteredParams[key] !== undefined && filteredParams[key] !== '') {
        searchParams.append(key, filteredParams[key]);
      }
    });
    
    const queryString = searchParams.toString();
    const response = await axios.get(`/api/analytics/market${queryString ? `?${queryString}` : ''}`);
    return response.data;
  },

  // Get property performance analytics
  getPropertyPerformanceAnalytics: async (propertyId = null) => {
    const params = propertyId ? `?property_id=${propertyId}` : '';
    const response = await axios.get(`/api/analytics/property-performance${params}`);
    return response.data;
  },

  // Get tenant selection analytics
  getTenantSelectionAnalytics: async (params = {}) => {
    const searchParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        searchParams.append(key, params[key]);
      }
    });
    
    const queryString = searchParams.toString();
    const response = await axios.get(`/api/analytics/tenant-selection${queryString ? `?${queryString}` : ''}`);
    return response.data;
  },

  // Get viewing analytics
  getViewingAnalytics: async (propertyId = null) => {
    const params = propertyId ? `?property_id=${propertyId}` : '';
    const response = await axios.get(`/api/analytics/viewing${params}`);
    return response.data;
  },

  // Suggest postal codes
  suggestPostalCodes: async (query, limit = 10) => {
    const response = await axios.get(`/api/analytics/postal-codes/suggest?query=${query}&limit=${limit}`);
    return response.data;
  },

  // Health check
  getHealthStatus: async () => {
    const response = await axios.get('/api/analytics/health');
    return response.data;
  }
};

export default analyticsAPI;