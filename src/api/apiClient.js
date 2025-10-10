/**
 * Legacy API Client
 * This module provides backward compatibility for old slice files.
 * New code should use src/services/api.js instead.
 */
import { api } from '../services/api';

/**
 * Generic GET request
 * @param {string} endpoint - API endpoint
 * @returns {Promise<any>} Response data
 */
export const getData = async (endpoint) => {
  try {
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * GET request with query parameters
 * @param {string} endpoint - API endpoint
 * @param {object} params - Query parameters
 * @returns {Promise<any>} Response data
 */
export const getDataWithQuery = async (endpoint, params = {}) => {
  try {
    const response = await api.get(endpoint, { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Generic POST request
 * @param {string} endpoint - API endpoint
 * @param {object} data - Request body
 * @returns {Promise<any>} Response data
 */
export const postData = async (endpoint, data) => {
  try {
    const response = await api.post(endpoint, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Generic PUT request
 * @param {string} endpoint - API endpoint
 * @param {object} data - Request body
 * @returns {Promise<any>} Response data
 */
export const putData = async (endpoint, data) => {
  try {
    const response = await api.put(endpoint, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Generic DELETE request
 * @param {string} endpoint - API endpoint
 * @returns {Promise<any>} Response data
 */
export const deleteData = async (endpoint) => {
  try {
    const response = await api.delete(endpoint);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export default {
  getData,
  getDataWithQuery,
  postData,
  putData,
  deleteData,
};
