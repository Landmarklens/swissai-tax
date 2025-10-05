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
  resumeSession: (sessionId) => api.get(`/api/interview/resume/${sessionId}`),
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
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  getProfile: () => api.get('/api/user/profile'),
  updateProfile: (data) => api.put('/api/user/profile', data),
  changePassword: (data) => api.put('/api/user/profile/password', data),
  updateAvatar: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.put('/api/user/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getMe: () => api.get('/api/user/me'),
  listUsers: () => api.get('/api/user/list'),
};

// Dashboard API endpoints
export const dashboardAPI = {
  getDashboard: () => api.get('/api/dashboard/'),
};

// Profile API endpoints
export const profileAPI = {
  getProfile: () => api.get('/api/profile/'),
  updatePersonalInfo: (data) => api.put('/api/profile/personal', data),
  updateTaxProfile: (data) => api.put('/api/profile/tax', data),
  updateSecurity: (data) => api.put('/api/profile/security', data),
};

// Settings API endpoints
export const settingsAPI = {
  getSettings: () => api.get('/api/settings/'),
  updatePreferences: (data) => api.put('/api/settings/preferences', data),
  updateNotifications: (data) => api.put('/api/settings/notifications', data),
  updateDocumentSettings: (data) => api.put('/api/settings/documents', data),
};

// Filing API endpoints
export const filingAPI = {
  submitFiling: (data) => api.post('/api/filing/submit', data),
  getFiling: (filingId) => api.get(`/api/filing/${filingId}`),
  reviewFiling: (filingId) => api.get(`/api/filing/${filingId}/review`),
};

// Payment API endpoints
export const paymentAPI = {
  createPaymentIntent: (data) => api.post('/api/payment/create-intent', data),
  handleWebhook: (data) => api.post('/api/payment/webhook', data),
};

// Auth API endpoints (complementary to authService)
export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  googleLogin: (userType, language, redirectUrl) =>
    api.get('/api/auth/login/google', {
      params: { user_type: userType, language, redirect_url: redirectUrl }
    }),
  requestPasswordReset: (email) => api.post('/api/auth/reset-password/request', { email }),
  verifyPasswordReset: (token) => api.post('/api/auth/reset-password/verify', { token }),
  confirmPasswordReset: (token, newPassword) =>
    api.post('/api/auth/reset-password/confirm', { token, new_password: newPassword }),
};

export { api };