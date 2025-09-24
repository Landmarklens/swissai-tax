import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://api.swissai.tax',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login on unauthorized
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Interview API endpoints
export const interviewAPI = {
  startSession: (data) => api.post('/api/interview/start', data),
  submitAnswer: (data) => api.post('/api/interview/answer', data),
  getSession: (sessionId) => api.get(`/api/interview/session?sessionId=${sessionId}`),
  getQuestions: (language = 'en') => api.get(`/api/interview/questions?language=${language}`),
};

// Document API endpoints
export const documentAPI = {
  getUploadUrl: (data) => api.post('/api/documents/upload', data),
  listDocuments: (sessionId) => api.get(`/api/documents/list?sessionId=${sessionId}`),
  getDownloadUrl: (documentId) => api.get(`/api/documents/download?documentId=${documentId}`),
  deleteDocument: (documentId) => api.delete(`/api/documents?documentId=${documentId}`),
  processDocument: (documentId) => api.post('/api/documents/process', { documentId }),
  checkProcessingStatus: (documentId) => api.get(`/api/documents/status?documentId=${documentId}`),
};

// Tax Calculation API endpoints
export const calculationAPI = {
  calculateTax: (sessionId) => api.post('/api/calculation/calculate', { sessionId }),
  estimateTax: (data) => api.post('/api/calculation/estimate', data),
  getSummary: (sessionId) => api.get(`/api/calculation/summary?sessionId=${sessionId}`),
};

// User API endpoints
export const userAPI = {
  register: (data) => api.post('/api/users/register', data),
  login: (data) => api.post('/api/users/login', data),
  getProfile: () => api.get('/api/users/profile'),
  updateProfile: (data) => api.put('/api/users/profile', data),
  changePassword: (data) => api.post('/api/users/change-password', data),
};

export { api };