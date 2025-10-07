/**
 * Custom React hooks for analytics data
 */

import { useState, useEffect, useCallback } from 'react';
import { analyticsAPI } from '../api/analytics';

export const useComprehensiveAnalytics = (filters = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await analyticsAPI.getComprehensiveAnalytics(filters);
      setData(result);
    } catch (err) {
      console.error('[useComprehensiveAnalytics] Error fetching comprehensive analytics:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]); // Use JSON.stringify to properly compare filter objects

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

export const useMarketAnalytics = (filters = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await analyticsAPI.getMarketAnalytics(filters);
      setData(result);
    } catch (err) {
      console.error('Error fetching market analytics:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to fetch market analytics');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

export const usePropertyPerformance = (propertyId = null) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await analyticsAPI.getPropertyPerformanceAnalytics(propertyId);
      setData(result);
    } catch (err) {
      console.error('Error fetching property performance:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to fetch property performance data');
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

export const useTenantSelectionAnalytics = (filters = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await analyticsAPI.getTenantSelectionAnalytics(filters);
      setData(result);
    } catch (err) {
      console.error('Error fetching tenant selection analytics:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to fetch tenant selection analytics');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

export const usePostalCodeSuggestions = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchPostalCodes = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    
    try {
      const result = await analyticsAPI.suggestPostalCodes(query, 10);
      setSuggestions(result.suggestions || []);
    } catch (err) {
      console.error('Error fetching postal code suggestions:', err);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { suggestions, loading, searchPostalCodes };
};