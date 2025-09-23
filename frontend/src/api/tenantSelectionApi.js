import axios from 'axios';
import config from '../config/environments';
import logger from '../services/enhancedLoggingService';

// Create axios instance with interceptors
const createApiClient = () => {
  // Guard against test environment where axios might not create properly
  if (typeof axios === 'undefined' || !axios.create) {
    
    return {
      get: () => Promise.reject(new Error('API not initialized')),
      post: () => Promise.reject(new Error('API not initialized')),
      put: () => Promise.reject(new Error('API not initialized')),
      delete: () => Promise.reject(new Error('API not initialized'))
    };
  }
  
  const client = axios.create({
    baseURL: config.API_BASE_URL,
    timeout: config.tenantSelectionConfig?.limits?.apiRequestTimeout || 30000,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Request interceptor for auth and timing
  if (client.interceptors) {
    client.interceptors.request.use(
      (config) => {
        // Add timing metadata
        config.metadata = { startTime: Date.now() };

        // Use the same authentication method as other services
        try {
          // Check both 'userData' (used by authSlice) and 'user' for backwards compatibility
          const userData = JSON.parse(localStorage.getItem('userData') || localStorage.getItem('user') || '{}');
          if (userData && userData.access_token) {
            config.headers.Authorization = `Bearer ${userData.access_token}`;
          }
        } catch (error) {
          logger.warn('AUTH', 'Failed to parse user from localStorage', {
            error: error.message
          });
          
        }

        // Log outgoing request
        logger.debug('API_REQUEST', `${config.method?.toUpperCase()} ${config.url}`, {
          params: config.params,
          data: config.data,
          headers: config.headers
        });

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling and timing
    client.interceptors.response.use(
      (response) => {
        // Calculate request duration
        const duration = Date.now() - response.config.metadata?.startTime;

        // Log response with logger service
        logger.logApiCall(
          response.config.method?.toUpperCase(),
          response.config.url,
          response.config.data,
          {
            status: response.status,
            data: response.data
          },
          duration
        );

        // Log response timing
        logger.debug('API_RESPONSE', `${response.config.method?.toUpperCase()} ${response.config.url}`, {
          status: response.status,
          duration: `${duration}ms`,
          size: JSON.stringify(response.data).length
        });

        // Warn on slow responses
        if (duration > 2000) {
          logger.logPerformance(`API ${response.config.url}`, duration, {
            method: response.config.method?.toUpperCase(),
            status: response.status
          });
        }

        return response;
      },
      (error) => {
        // Calculate request duration even for errors
        if (error.config?.metadata?.startTime) {
          const duration = Date.now() - error.config.metadata.startTime;

          // Log error with logger service
          logger.logApiCall(
            error.config.method?.toUpperCase(),
            error.config.url,
            error.config.data,
            {
              status: error.response?.status || 'error',
              error: error.message
            },
            duration
          );

          logger.error('API_ERROR', `${error.config.method?.toUpperCase()} ${error.config.url}`, {
            status: error.response?.status,
            duration: `${duration}ms`,
            error: error.message,
            response: error.response?.data
          });
        }

        if (error.response?.status === 401) {
          logger.critical('AUTH', 'Unauthorized access - redirecting to login', {
            url: error.config?.url
          });
          // Handle unauthorized - clear user data and redirect to login
          localStorage.removeItem('user');
          localStorage.removeItem('userData');
          window.location.href = '/';
        }
        return Promise.reject(error);
      }
    );
  }
  
  return client;
};

const apiClient = createApiClient();

// Verify apiClient was created successfully
if (!apiClient) {
  
}

// Tenant Selection API Service - Matching HomeAiBE backend endpoints
export const tenantSelectionAPI = {
  // Configuration endpoints (from tenant_selection.py)
  setupTenantSelection: async (setupData) => {
    return apiClient.post('/api/tenant-selection/setup', setupData);
  },

  getConfig: async (propertyId) => {
    return apiClient.get(`/api/tenant-selection/config/${propertyId}`);
  },
  
  updateAIInstructions: async (propertyId, aiData) => {
    return apiClient.patch(`/api/tenant-selection/config/${propertyId}/ai-instructions`, aiData);
  },

  // Leads/Applications endpoints
  getLeads: async (filters = {}, options = {}) => {
    const params = new URLSearchParams();
    
    if (filters.propertyId) params.append('property_id', filters.propertyId);
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.sourcePortal && filters.sourcePortal !== 'all') params.append('source_portal', filters.sourcePortal);
    if (filters.minScore) params.append('min_score', filters.minScore);
    if (filters.maxScore) params.append('max_score', filters.maxScore);
    if (filters.startDate) params.append('start_date', filters.startDate);
    if (filters.endDate) params.append('end_date', filters.endDate);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);
    
    const timeout = options.timeout || 10000; // Default 10 second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const startTime = performance.now();
      const response = await apiClient.get(
        `/api/tenant-selection/leads?${params.toString()}`,
        { signal: controller.signal }
      );
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      return response;
    } catch (error) {
      if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
        const timeoutError = new Error(`Request timeout after ${timeout/1000} seconds. The server is taking too long to respond.`);
        timeoutError.isTimeout = true;
        throw timeoutError;
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  },

  getLeadDetails: async (leadId) => {
    return apiClient.get(`/api/tenant-selection/leads/${leadId}`);
  },

  updateLead: async (leadId, data) => {
    return apiClient.patch(`/api/tenant-selection/leads/${leadId}`, data);
  },

  // Decision endpoints
  makeDecision: async (leadId, decisionData) => {
    return apiClient.post(`/api/tenant-selection/leads/${leadId}/decide`, decisionData);
  },

  bulkReject: async (propertyId, leadIds) => {
    return apiClient.post(`/api/tenant-selection/${propertyId}/bulk-reject`, { lead_ids: leadIds });
  },

  revealIdentity: async (leadId) => {
    return apiClient.post('/api/tenant-selection/reveal-identity', { lead_id: leadId });
  },

  // Viewing endpoints
  scheduleViewing: async (viewingData) => {
    return apiClient.post('/api/tenant-selection/viewing-schedule', viewingData);
  },

  getViewingSlots: async (propertyId) => {
    return apiClient.get(`/api/tenant-selection/${propertyId}/viewing-slots`);
  },

  allocateViewings: async (propertyId, data) => {
    return apiClient.post(`/api/tenant-selection/${propertyId}/allocate-viewings`, data);
  },

  // Email & Communication endpoints
  sendEmail: async (emailData) => {
    return apiClient.post('/api/tenant-selection/send-email', emailData);
  },

  getEmailTemplates: async () => {
    return apiClient.get('/api/tenant-selection/templates');
  },

  // Communication logs endpoints
  getCommunicationLogs: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.propertyId) queryParams.append('property_id', params.propertyId);
    if (params.leadId) queryParams.append('lead_id', params.leadId);
    if (params.status) queryParams.append('status', params.status);
    if (params.limit) queryParams.append('limit', params.limit);
    
    return apiClient.get(`/api/communications/logs?${queryParams.toString()}`);
  },
  
  // Get property messages (simpler endpoint that fetches from AWS RDS)
  getPropertyMessages: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.propertyId) queryParams.append('property_id', params.propertyId);
    if (params.limit) queryParams.append('limit', params.limit);
    
    return apiClient.get(`/api/property-messages/?${queryParams.toString()}`);
  },

  createEmailTemplate: async (templateData) => {
    return apiClient.post('/api/tenant-selection/templates', templateData);
  },

  updateEmailTemplate: async (templateId, data) => {
    return apiClient.put(`/api/tenant-selection/templates/${templateId}`, data);
  },

  getEmailStats: async (propertyId) => {
    return apiClient.get(`/api/tenant-selection/${propertyId}/email-stats`);
  },

  // Additional endpoints from backend
  getQualifiedApplicants: async (propertyId) => {
    return apiClient.get(`/api/tenant-selection/${propertyId}/qualified-applicants`);
  },

  submitDossier: async (leadId, dossierData) => {
    return apiClient.post(`/api/tenant-selection/public/apply/${leadId}/submit-dossier`, dossierData);
  },

  getApplicationStatus: async (leadId) => {
    return apiClient.get(`/api/tenant-selection/public/apply/${leadId}/status`);
  },

  getAuditTrail: async (propertyId) => {
    return apiClient.get(`/api/tenant-selection/${propertyId}/audit-trail`);
  },

  exportReport: async (propertyId) => {
    return apiClient.get(`/api/tenant-selection/${propertyId}/export-report`, {
      responseType: 'blob'
    });
  },

  checkListing: async (propertyId) => {
    return apiClient.get(`/api/tenant-selection/${propertyId}/check-listing`);
  },

  scrapeListing: async (data) => {
    return apiClient.post('/api/tenant-selection/scrape-listing', data);
  },

  exportAnalytics: async (propertyId, dateRange) => {
    return apiClient.post(`/api/export/analytics/${propertyId}`, dateRange, {
      responseType: 'blob'
    });
  },
  
  // Enhanced Tenant Applications endpoints
  getPropertyAnalytics: async (propertyId, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.startDate) queryParams.append('start_date', params.startDate);
    if (params.endDate) queryParams.append('end_date', params.endDate);
    return apiClient.get(`/api/tenant-applications/${propertyId}/analytics?${queryParams.toString()}`);
  },
  
  getPropertyInsights: async (propertyId) => {
    return apiClient.get(`/api/tenant-applications/${propertyId}/insights`);
  },
  
  getApplicantComparison: async (propertyId, leadIds) => {
    const leadIdsParam = leadIds.join(',');
    return apiClient.get(`/api/tenant-applications/${propertyId}/comparison?lead_ids=${leadIdsParam}`);
  },

  // AI Insights & Scoring Endpoints
  generateInsights: async (leadId, regenerate = false) => {
    logger.info('AI_INSIGHTS_API', 'Generating insights for lead', {
      leadId,
      regenerate
    });
    
    return apiClient.post(`/api/tenant-selection/leads/${leadId}/generate-insights`, null, {
      params: { regenerate }
    });
  },

  batchGenerateInsights: async (propertyId) => {
    logger.info('AI_INSIGHTS_API', 'Batch generating insights for property', {
      propertyId
    });
    
    return apiClient.post(`/api/tenant-selection/properties/${propertyId}/batch-generate-insights`);
  },

  updateSortingPreferences: async (propertyId, preferences) => {
    
    return apiClient.patch(`/api/tenant-selection/config/${propertyId}/sorting-preferences`, preferences);
  },

  getComparisonMetrics: async (propertyId) => {
    logger.info('COMPARISON_API', 'Fetching comparison metrics', {
      propertyId
    });
    
    return apiClient.get(`/api/tenant-selection/leads/${propertyId}/comparison-metrics`);
  },
  
  performBulkActions: async (propertyId, leadIds, action, params = null) => {
    return apiClient.post(`/api/tenant-applications/${propertyId}/bulk-actions`, {
      lead_ids: leadIds,
      action: action,
      params: params
    });
  },
  
  getApplicationStatistics: async (propertyId) => {
    return apiClient.get(`/api/tenant-applications/${propertyId}/statistics`);
  },
  
  // Performance testing endpoint
  testLeadsPerformance: async (propertyId) => {
    try {
      const startTime = performance.now();
      
      
      const response = await apiClient.get(`/api/tenant-selection/leads/performance-test/${propertyId}`);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      
      
      
      return {
        ...response.data,
        clientDuration: duration
      };
    } catch (error) {
      
      throw error;
    }
  }
};

// WebSocket/SSE connection for real-time updates
export class TenantSelectionRealtime {
  constructor(onMessage, onError, options = {}) {
    this.eventSource = null;
    this.onMessage = onMessage;
    this.onError = onError;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 3; // Reduced to prevent excessive retries
    this.reconnectDelay = options.reconnectDelay || 1000;
    this.sessionToken = null; // Store session token for reconnects
    this.propertyId = null; // Store property ID for reconnects
    this.permanentlyFailed = false; // Track if connection permanently failed
  }

  async connect(propertyId) {
    this.propertyId = propertyId; // Store for reconnects
    
    // Check if connection has permanently failed
    if (this.permanentlyFailed) {
      
      return;
    }
    
    // Check if we've exceeded max reconnection attempts
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      
      this.permanentlyFailed = true;
      this.onError?.({ type: 'connection_failed', permanent: true });
      return;
    }
    
    try {
      // Get SSE session token first (more secure than passing JWT in URL)
      const response = await apiClient.post(`/api/tenant-selection/sse-session?property_id=${propertyId}`);
      const { session_token } = response.data;
      this.sessionToken = session_token; // Store for potential debugging
      
      // Use session token in URL (short-lived, property-specific)
      const url = `${config.SSE_URL || config.API_BASE_URL}/api/tenant-selection/stream/${propertyId}?session=${session_token}`;
      
      this.eventSource = new EventSource(url);
    } catch (error) {
      
      
      // If it's a 422 error, the endpoint likely doesn't exist or isn't configured
      if (error.response?.status === 422 || error.response?.status === 404) {
        
        this.permanentlyFailed = true;
        this.onError?.({ type: 'endpoint_unavailable', permanent: true });
        return; // Don't try fallback or reconnect for these errors
      }
      
      // Fallback to legacy token method if session creation fails
      try {
        const userData = JSON.parse(localStorage.getItem('userData') || localStorage.getItem('user') || '{}');
        const token = userData && userData.access_token ? userData.access_token : null;
        if (token) {
          const url = `${config.SSE_URL || config.API_BASE_URL}/api/tenant-selection/stream/${propertyId}?token=${token}`;
          this.eventSource = new EventSource(url);
        } else {
          
          this.permanentlyFailed = true;
          this.onError?.({ type: 'auth_failed', permanent: true });
          return; // Don't attempt reconnection without auth
        }
      } catch (parseError) {
        
        this.permanentlyFailed = true;
        this.onError?.({ type: 'auth_failed', permanent: true });
        return; // Don't attempt reconnection without auth
      }
    }
    
    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.onMessage(data);
        this.reconnectAttempts = 0; // Reset on successful message
      } catch (error) {
        
      }
    };
    
    this.eventSource.onerror = (error) => {
      
      this.onError?.(error);
      
      // Don't attempt reconnection if permanently failed
      if (this.permanentlyFailed) {
        
        return;
      }
      
      // Auto-reconnect with proper exponential backoff and jitter
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++; // Increment BEFORE calculating delay
        
        // Calculate delay with exponential backoff
        const baseDelay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
        
        // Add jitter (0-1000ms) to prevent thundering herd
        const jitter = Math.random() * 1000;
        
        // Cap maximum delay at 30 seconds
        const delay = Math.min(baseDelay + jitter, 30000);
        
        
        
        setTimeout(() => {
          this.reconnect(this.propertyId);
        }, delay);
      } else {
        
        this.permanentlyFailed = true;
        // Notify the app that connection failed permanently
        this.onError?.({ type: 'connection_failed', permanent: true });
      }
    };
    
    // Listen for specific event types using bound methods for proper cleanup
    this.eventSource.addEventListener('lead_received', this.handleLeadReceived);
    this.eventSource.addEventListener('decision_made', this.handleDecisionMade);
    this.eventSource.addEventListener('status_updated', this.handleStatusUpdated);
  }

  async reconnect(propertyId) {
    // Don't reconnect if connection has permanently failed
    if (this.permanentlyFailed) {
      
      return;
    }
    
    // Don't reconnect if we've already exceeded max attempts
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      
      this.permanentlyFailed = true;
      return;
    }
    
    this.disconnect();
    // Small delay before reconnecting to avoid rapid reconnection
    await new Promise(resolve => setTimeout(resolve, 100));
    await this.connect(propertyId);
  }

  disconnect() {
    if (this.eventSource) {
      // Remove all event listeners before closing
      this.eventSource.onmessage = null;
      this.eventSource.onerror = null;
      
      // Remove custom event listeners
      this.eventSource.removeEventListener('lead_received', this.handleLeadReceived);
      this.eventSource.removeEventListener('decision_made', this.handleDecisionMade);
      this.eventSource.removeEventListener('status_updated', this.handleStatusUpdated);
      
      // Close the connection
      this.eventSource.close();
      this.eventSource = null;
      
      // Reset reconnection attempts
      this.reconnectAttempts = 0;
    }
  }
  
  handleLeadReceived = (event) => {
    const data = JSON.parse(event.data);
    this.onMessage({ type: 'lead_received', data });
  }
  
  handleDecisionMade = (event) => {
    const data = JSON.parse(event.data);
    this.onMessage({ type: 'decision_made', data });
  }
  
  handleStatusUpdated = (event) => {
    const data = JSON.parse(event.data);
    this.onMessage({ type: 'status_updated', data });
  }
}

// Optimistic update utilities
export const optimisticUpdates = {
  updateLeadStatus: (lead, newStatus) => ({
    ...lead,
    status: newStatus,
    updated_at: new Date().toISOString()
  }),
  
  makeDecision: (lead, decision) => ({
    ...lead,
    status: decision === 'accept' ? 'qualified' : 
            decision === 'reject' ? 'rejected' : 'review_required',
    decision_made: true,
    updated_at: new Date().toISOString()
  }),
  
  scheduleViewing: (lead) => ({
    ...lead,
    status: 'viewing_scheduled',
    has_viewing: true,
    updated_at: new Date().toISOString()
  })
};

// Cache utilities for offline support
export const cacheUtils = {
  saveToCache: (key, data) => {
    try {
      localStorage.setItem(`tenant_selection_${key}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      
    }
  },
  
  getFromCache: (key, maxAge = 5 * 60 * 1000) => { // 5 minutes default
    try {
      const cached = localStorage.getItem(`tenant_selection_${key}`);
      if (!cached) return null;
      
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp > maxAge) {
        localStorage.removeItem(`tenant_selection_${key}`);
        return null;
      }
      
      return data;
    } catch (error) {
      
      return null;
    }
  },
  
  clearCache: () => {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('tenant_selection_')) {
        localStorage.removeItem(key);
      }
    });
  }
};

export default tenantSelectionAPI;