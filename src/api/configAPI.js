// Configuration API
// This would normally be implemented on the backend to fetch from AWS Parameter Store

import axios from 'axios';
import config from '../config/environments';

const API_URL = config.API_BASE_URL;

// Mock implementation for development
// In production, the backend should fetch these from AWS Parameter Store
const mockParameterStoreData = {
  '/homeai/aws/region': 'us-east-1',
  '/homeai/aws/access_key_id': process.env.REACT_APP_AWS_ACCESS_KEY_ID || '',
  '/homeai/aws/secret_access_key': process.env.REACT_APP_AWS_SECRET_ACCESS_KEY || '',
  
  '/homeai/ses/from_email': 'noreply@homeai.ch',
  '/homeai/ses/region': 'us-east-1',
  '/homeai/ses/reply_to': 'support@homeai.ch',
  
  '/homeai/s3/bucket_name': 'homeai-templates',
  '/homeai/s3/region': 'us-east-1',
  '/homeai/s3/template_path': 'templates/',
  '/homeai/s3/document_path': 'documents/',
  
  '/homeai/api/base_url': 'https://api.homeai.ch',
  '/homeai/api/timeout': '30000',
  
  '/homeai/features/enable_ses': false,
  '/homeai/features/enable_s3': false,
  '/homeai/features/enable_analytics': true,
  
  '/homeai/security/jwt_expiry': '7d',
  '/homeai/security/session_timeout': '30m',
  '/homeai/security/max_login_attempts': '5'
};

export const fetchConfiguration = async () => {
  try {
    // Try to fetch from backend API
    const response = await axios.get(`${API_URL}/api/config/parameters`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.log('Using mock configuration (Parameter Store API not available)');
    
    // Return mock data for development
    return mockParameterStoreData;
  }
};

// Fetch specific parameter
export const fetchParameter = async (parameterName) => {
  try {
    const response = await axios.get(`${API_URL}/api/config/parameter/${parameterName}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`
      }
    });
    
    return response.data.value;
  } catch (error) {
    console.log(`Using mock value for parameter: ${parameterName}`);
    return mockParameterStoreData[parameterName] || null;
  }
};

// Update parameter (admin only)
export const updateParameter = async (parameterName, value) => {
  try {
    const response = await axios.put(
      `${API_URL}/api/config/parameter/${parameterName}`,
      { value },
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Failed to update parameter:', error);
    throw error;
  }
};

// Batch fetch parameters
export const fetchParameters = async (parameterNames) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/config/parameters/batch`,
      { parameters: parameterNames },
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.log('Using mock values for parameters');
    
    // Return mock data for requested parameters
    const result = {};
    parameterNames.forEach(name => {
      result[name] = mockParameterStoreData[name] || null;
    });
    return result;
  }
};

export default {
  fetchConfiguration,
  fetchParameter,
  fetchParameters,
  updateParameter
};