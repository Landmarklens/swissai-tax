import { createSlice, createAsyncThunk, createEntityAdapter, createSelector } from '@reduxjs/toolkit';
import tenantSelectionAPI from '../../api/tenantSelectionApi';
import axios from 'axios';

// Entity adapters for normalized state
const configsAdapter = createEntityAdapter({
  selectId: (config) => config.property_id
});

const leadsAdapter = createEntityAdapter({
  selectId: (lead) => lead.id,
  sortComparer: (a, b) => b.score - a.score // Sort by score descending
});

const decisionsAdapter = createEntityAdapter({
  selectId: (decision) => decision.lead_id
});

// Async thunks with error handling
export const fetchTenantConfig = createAsyncThunk(
  'tenantSelection/fetchConfig',
  async (propertyId, { rejectWithValue }) => {
    try {
      const response = await tenantSelectionAPI.getConfig(propertyId);
      return response.data;
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.detail || error.message || 'Failed to fetch configuration',
        status: error.response?.status || 500
      });
    }
  }
);

export const createTenantConfig = createAsyncThunk(
  'tenantSelection/createConfig',
  async (configData, { rejectWithValue }) => {
    try {
      const response = await tenantSelectionAPI.setupTenantSelection(configData);
      return response.data;
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.detail || error.message || 'Failed to create configuration',
        status: error.response?.status || 500
      });
    }
  }
);

// New async thunks for enhanced features
// Create property for manual entry
export const createProperty = createAsyncThunk(
  'tenantSelection/createProperty',
  async (propertyData, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/property/', propertyData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.detail || error.message || 'Failed to create property',
        status: error.response?.status || 500
      });
    }
  }
);

export const importPropertyFromURL = createAsyncThunk(
  'tenantSelection/importPropertyFromURL',
  async ({ url, portal = 'auto' }, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/tenant-selection/import-property', null, {
        params: { url }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.detail || 'Failed to import property',
        status: error.response?.status || 500
      });
    }
  }
);

export const processDocuments = createAsyncThunk(
  'tenantSelection/processDocuments',
  async ({ leadId, documentUrls }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      documentUrls.forEach(url => formData.append('document_urls', url));
      
      const response = await axios.post(
        `/api/tenant-selection/process-documents/${leadId}`,
        formData
      );
      return { leadId, result: response.data };
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.detail || 'Failed to process documents',
        status: error.response?.status || 500
      });
    }
  }
);

export const generateAICards = createAsyncThunk(
  'tenantSelection/generateAICards',
  async ({ propertyId, regenerate = false }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/tenant-selection/ai-cards/${propertyId}`, {
        params: { regenerate }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.detail || 'Failed to generate AI cards',
        status: error.response?.status || 500
      });
    }
  }
);

export const autoAllocateViewing = createAsyncThunk(
  'tenantSelection/autoAllocateViewing',
  async ({ leadId, preferences }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`/api/tenant-selection/auto-allocate/${leadId}`, {
        preferences
      });
      return { leadId, slot: response.data };
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.detail || 'Failed to allocate viewing',
        status: error.response?.status || 500
      });
    }
  }
);

export const createViewingSlots = createAsyncThunk(
  'tenantSelection/createViewingSlots',
  async ({ propertyId, slots }, { rejectWithValue }) => {
    console.log('[Redux] createViewingSlots action called');
    console.log('[Redux] propertyId:', propertyId);
    console.log('[Redux] slots:', slots);

    try {
      const url = `/api/tenant-selection/viewing-slots/${propertyId}/bulk-create`;
      const payload = { slots };

      console.log('[Redux] Making API call to:', url);
      console.log('[Redux] Payload:', payload);

      const response = await axios.post(url, payload);

      console.log('[Redux] API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('[Redux] API error:', error);
      console.error('[Redux] Error response:', error.response);
      console.error('[Redux] Error data:', error.response?.data);

      return rejectWithValue({
        message: error.response?.data?.detail || 'Failed to create viewing slots',
        status: error.response?.status || 500
      });
    }
  }
);

export const bulkCreateSlots = createAsyncThunk(
  'tenantSelection/bulkCreateSlots',
  async ({ propertyId, slots }, { rejectWithValue }) => {
    console.log('[Redux] bulkCreateSlots action called');
    console.log('[Redux] propertyId:', propertyId);
    console.log('[Redux] slots:', slots);

    try {
      const url = `/api/tenant-selection/viewing-slots/${propertyId}/bulk-create`;
      const payload = { slots };

      console.log('[Redux] Making API call to:', url);
      console.log('[Redux] Payload:', payload);

      const response = await axios.post(url, payload);

      console.log('[Redux] API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('[Redux] API error:', error);
      console.error('[Redux] Error response:', error.response);
      console.error('[Redux] Error data:', error.response?.data);

      return rejectWithValue({
        message: error.response?.data?.detail || 'Failed to bulk create slots',
        status: error.response?.status || 500
      });
    }
  }
);

export const updateViewingSlot = createAsyncThunk(
  'tenantSelection/updateViewingSlot',
  async ({ slotId, updates }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(
        `/api/tenant-selection/viewing-slots/${slotId}`,
        updates
      );
      return response.data;
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.detail || 'Failed to update slot',
        status: error.response?.status || 500
      });
    }
  }
);

export const deleteViewingSlot = createAsyncThunk(
  'tenantSelection/deleteViewingSlot',
  async ({ slotId }, { rejectWithValue }) => {
    try {
      await axios.delete(`/api/tenant-selection/viewing-slots/${slotId}`);
      return { slotId };
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.detail || 'Failed to delete slot',
        status: error.response?.status || 500
      });
    }
  }
);

export const selectTenant = createAsyncThunk(
  'tenantSelection/selectTenant',
  async ({ propertyId, leadId, reason }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`/api/tenant-selection/select-tenant`, {
        property_id: propertyId,
        lead_id: leadId,
        reason
      });
      return response.data;
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.detail || 'Failed to select tenant',
        status: error.response?.status || 500
      });
    }
  }
);

export const rejectTenant = createAsyncThunk(
  'tenantSelection/rejectTenant',
  async ({ propertyId, leadId, reason }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`/api/tenant-selection/reject-tenant`, {
        property_id: propertyId,
        lead_id: leadId,
        reason
      });
      return response.data;
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.detail || 'Failed to reject tenant',
        status: error.response?.status || 500
      });
    }
  }
);

export const updateCriteria = createAsyncThunk(
  'tenantSelection/updateCriteria',
  async ({ propertyId, criteria }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(
        `/api/tenant-selection/config/${propertyId}/criteria`,
        criteria
      );
      return response.data;
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.detail || 'Failed to update criteria',
        status: error.response?.status || 500
      });
    }
  }
);

export const saveCriteriaTemplate = createAsyncThunk(
  'tenantSelection/saveCriteriaTemplate',
  async ({ name, criteria }, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/tenant-selection/criteria-templates', {
        name,
        criteria
      });
      return response.data;
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.detail || 'Failed to save template',
        status: error.response?.status || 500
      });
    }
  }
);

export const getDocumentExtraction = createAsyncThunk(
  'tenantSelection/getDocumentExtraction',
  async ({ documentId }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/tenant-selection/documents/${documentId}/extraction`);
      return { documentId, extraction: response.data };
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.detail || 'Failed to get extraction',
        status: error.response?.status || 500
      });
    }
  }
);

export const updateTenantConfig = createAsyncThunk(
  'tenantSelection/updateConfig',
  async ({ configId, data }, { rejectWithValue }) => {
    try {
      const response = await tenantSelectionAPI.updateConfig(configId, data);
      return response.data;
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.detail || error.message || 'Failed to update configuration',
        status: error.response?.status || 500
      });
    }
  }
);

export const fetchLeads = createAsyncThunk(
  'tenantSelection/fetchLeads',
  async (filters = {}, { rejectWithValue, getState }) => {
    try {
      // Get sorting preferences from filters
      const { sort_by, sort_direction } = filters;

      // Reset pagination for new fetch
      const response = await tenantSelectionAPI.getLeads({
        ...filters,
        limit: 50, // Increased for better performance
        offset: 0,
        sort_by,
        sort_direction
      }, {
        timeout: 15000 // 15 second timeout
      });
      
      // Return structured data with metadata separate from leads array
      return {
        leads: response.data.leads || response.data || [],
        total: response.data.total || 0,
        metadata: {
          isInitialLoad: true,
          filters,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      // Check if it's a timeout error
      if (error.isTimeout) {
        return rejectWithValue({
          message: 'The server is taking too long to respond. This could be due to:\n• High server load\n• Database performance issues\n• Network connectivity problems\n\nPlease try again or contact support if the issue persists.',
          status: 408,
          isTimeout: true
        });
      }
      
      return rejectWithValue({
        message: error.response?.data?.detail || error.message || 'Failed to fetch leads',
        status: error.response?.status || 500
      });
    }
  }
);

export const fetchMoreLeads = createAsyncThunk(
  'tenantSelection/fetchMoreLeads',
  async (filters = {}, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const { offset, limit } = state.tenantSelection.ui.pagination;
      
      const response = await tenantSelectionAPI.getLeads({
        ...filters,
        limit,
        offset
      });
      
      // Return structured data with metadata separate from leads array
      return {
        leads: response.data.leads || response.data || [],
        total: response.data.total || 0,
        metadata: {
          isLoadMore: true,
          filters,
          offset,
          limit,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.detail || error.message || 'Failed to fetch more leads',
        status: error.response?.status || 500
      });
    }
  }
);

export const fetchLeadDetails = createAsyncThunk(
  'tenantSelection/fetchLeadDetails',
  async (leadId, { rejectWithValue }) => {
    try {
      const response = await tenantSelectionAPI.getLeadDetails(leadId);
      return response.data;
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.detail || error.message || 'Failed to fetch lead details',
        status: error.response?.status || 500
      });
    }
  }
);

export const updateLeadStatus = createAsyncThunk(
  'tenantSelection/updateLeadStatus',
  async ({ leadId, status, notes }, { rejectWithValue }) => {
    try {
      const response = await tenantSelectionAPI.updateLead(leadId, { status, notes });
      return response.data;
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.detail || error.message || 'Failed to update lead status',
        status: error.response?.status || 500
      });
    }
  }
);

export const makeDecision = createAsyncThunk(
  'tenantSelection/makeDecision',
  async ({ leadId, decision, reasoning }, { rejectWithValue }) => {
    try {
      const response = await tenantSelectionAPI.makeDecision(leadId, { decision, reason: reasoning });
      return response.data;
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.detail || error.message || 'Failed to make decision',
        status: error.response?.status || 500
      });
    }
  }
);

export const scheduleViewing = createAsyncThunk(
  'tenantSelection/scheduleViewing',
  async (viewingData, { rejectWithValue }) => {
    try {
      const response = await tenantSelectionAPI.scheduleViewing(viewingData);
      return response.data;
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.detail || error.message || 'Failed to schedule viewing',
        status: error.response?.status || 500
      });
    }
  }
);

export const bulkInviteToViewing = createAsyncThunk(
  'tenantSelection/bulkInvite',
  async ({ propertyId, leadIds, viewingDetails }, { rejectWithValue }) => {
    try {
      const response = await tenantSelectionAPI.allocateViewings(propertyId, { lead_ids: leadIds, ...viewingDetails });
      return response.data;
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.detail || error.message || 'Failed to send bulk invitations',
        status: error.response?.status || 500
      });
    }
  }
);

// Additional thunks for tenant selection
export const bulkReject = createAsyncThunk(
  'tenantSelection/bulkReject',
  async ({ propertyId, leadIds }, { rejectWithValue }) => {
    try {
      const response = await tenantSelectionAPI.bulkReject(propertyId, leadIds);
      return response.data;
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.detail || error.message || 'Failed to bulk reject',
        status: error.response?.status || 500
      });
    }
  }
);

export const selectLeads = (leadIds) => (dispatch) => {
  leadIds.forEach(id => dispatch(toggleBulkSelection(id)));
};

export const clearSelection = () => (dispatch) => {
  dispatch(clearBulkSelection());
};

export const exportApplications = createAsyncThunk(
  'tenantSelection/exportApplications',
  async ({ propertyId, format = 'csv' }, { rejectWithValue }) => {
    try {
      const response = await tenantSelectionAPI.exportReport(propertyId);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `applications_${propertyId}_${Date.now()}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return { success: true };
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.detail || error.message || 'Failed to export applications',
        status: error.response?.status || 500
      });
    }
  }
);

export const updateLead = createAsyncThunk(
  'tenantSelection/updateLead',
  async ({ leadId, data }, { rejectWithValue }) => {
    try {
      const response = await tenantSelectionAPI.updateLead(leadId, data);
      return response.data;
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.detail || error.message || 'Failed to update lead',
        status: error.response?.status || 500
      });
    }
  }
);

// Initial state
const initialState = {
  // Normalized entities
  configs: configsAdapter.getInitialState(),
  leads: leadsAdapter.getInitialState(),
  decisions: decisionsAdapter.getInitialState(),
  
  // New enhanced features state
  importedProperty: null,
  emailConfig: null,
  importMethod: 'url',
  importFlow: {
    currentStep: 0,
    propertyData: {},
    emailConfig: {
      managedEmail: '',
      forwardToPersonal: false,
      personalEmail: '',
      testStatus: 'not_tested',
      verificationCode: ''
    }
  },
  aiCards: [],
  documentProcessing: {},
  extractedData: {},
  viewingSlots: [],
  criteria: {
    pets_allowed: null,
    smoking_allowed: null,
    min_income_ratio: 3,
    required_documents: [],
    max_occupants: null,
    employment_types: [],
    custom_criteria: []
  },
  
  // UI state
  ui: {
    selectedPropertyId: null,
    selectedLeadId: null,
    filters: {
      propertyId: null,
      status: 'all',
      dateRange: {
        start: null,
        end: null
      },
      scoreRange: {
        min: 0,
        max: 100
      },
      sourcePortal: 'all'
    },
    sorting: {
      field: 'score',
      direction: 'desc'
    },
    view: 'grid', // 'grid' or 'table'
    bulkSelection: [],
    pagination: {
      offset: 0,
      limit: 20,
      hasMore: true,
      isLoadingMore: false
    }
  },
  
  // Loading states
  loading: {
    configs: false,
    leads: false,
    decisions: false,
    operations: {},
    importingProperty: false,
    generatingCards: false,
    processingDocuments: false
  },
  
  // Error states
  errors: {
    configs: null,
    leads: null,
    decisions: null,
    lastError: null
  },
  
  // Statistics
  stats: {
    totalApplications: 0,
    averageScore: 0,
    qualifiedCount: 0,
    rejectedCount: 0,
    pendingCount: 0,
    viewingsScheduled: 0
  },
  
  // Metadata for debugging and tracking
  metadata: {
    lastFetch: null,
    lastFetchMore: null
  }
};

const tenantSelectionSlice = createSlice({
  name: 'tenantSelection',
  initialState,
  reducers: {
    // UI actions
    setSelectedProperty: (state, action) => {
      state.ui.selectedPropertyId = action.payload;
    },
    setSelectedLead: (state, action) => {
      state.ui.selectedLeadId = action.payload;
    },
    setFilters: (state, action) => {
      state.ui.filters = { ...state.ui.filters, ...action.payload };
    },
    setSorting: (state, action) => {
      state.ui.sorting = action.payload;
    },
    setView: (state, action) => {
      state.ui.view = action.payload;
    },
    toggleBulkSelection: (state, action) => {
      const leadId = action.payload;
      const index = state.ui.bulkSelection.indexOf(leadId);
      if (index > -1) {
        state.ui.bulkSelection.splice(index, 1);
      } else {
        state.ui.bulkSelection.push(leadId);
      }
    },
    clearBulkSelection: (state) => {
      state.ui.bulkSelection = [];
    },
    selectAllVisibleLeads: (state) => {
      state.ui.bulkSelection = leadsAdapter.getSelectors().selectIds(state.leads);
    },
    
    // Property and Email Config actions
    setPropertyData: (state, action) => {
      state.importedProperty = action.payload;
    },
    setEmailConfig: (state, action) => {
      state.emailConfig = action.payload;
    },
    setImportMethod: (state, action) => {
      state.importMethod = action.payload;
    },
    emailVerified: (state, action) => {
      if (state.emailConfig) {
        state.emailConfig.testStatus = 'success';
        state.emailConfig.verifiedAt = action.payload.verifiedAt;
      }
    },
    
    // Real-time updates (from WebSocket/SSE)
    leadReceived: (state, action) => {
      leadsAdapter.upsertOne(state.leads, action.payload);
      state.stats.totalApplications += 1;
      state.stats.pendingCount += 1;
    },
    leadUpdated: (state, action) => {
      leadsAdapter.updateOne(state.leads, {
        id: action.payload.id,
        changes: action.payload
      });
    },
    decisionMade: (state, action) => {
      decisionsAdapter.upsertOne(state.decisions, action.payload);
      // Update lead status based on decision
      const { lead_id, recommendation } = action.payload;
      leadsAdapter.updateOne(state.leads, {
        id: lead_id,
        changes: { 
          status: recommendation === 'accept' ? 'qualified' : 
                  recommendation === 'reject' ? 'rejected' : 'review_required'
        }
      });
    },
    
    // Clear data
    clearTenantSelectionData: (state) => {
      state.configs = configsAdapter.getInitialState();
      state.leads = leadsAdapter.getInitialState();
      state.decisions = decisionsAdapter.getInitialState();
      state.ui = initialState.ui;
      state.stats = initialState.stats;
    }
  },
  extraReducers: (builder) => {
    // Fetch config
    builder
      .addCase(fetchTenantConfig.pending, (state) => {
        state.loading.configs = true;
        state.errors.configs = null;
      })
      .addCase(fetchTenantConfig.fulfilled, (state, action) => {
        state.loading.configs = false;
        configsAdapter.upsertOne(state.configs, action.payload);
      })
      .addCase(fetchTenantConfig.rejected, (state, action) => {
        state.loading.configs = false;
        state.errors.configs = action.payload?.message || action.error.message;
        state.errors.lastError = action.payload?.message || action.error.message;
      });
    
    // Create config
    builder
      .addCase(createTenantConfig.pending, (state) => {
        state.loading.configs = true;
        state.errors.configs = null;
      })
      .addCase(createTenantConfig.fulfilled, (state, action) => {
        state.loading.configs = false;
        configsAdapter.addOne(state.configs, action.payload);
      })
      .addCase(createTenantConfig.rejected, (state, action) => {
        state.loading.configs = false;
        state.errors.configs = action.payload?.message || action.error.message;
        state.errors.lastError = action.payload?.message || action.error.message;
      });
    
    // Update config
    builder
      .addCase(updateTenantConfig.pending, (state, action) => {
        state.loading.operations[`updateConfig_${action.meta.arg.configId}`] = true;
      })
      .addCase(updateTenantConfig.fulfilled, (state, action) => {
        delete state.loading.operations[`updateConfig_${action.meta.arg.configId}`];
        configsAdapter.updateOne(state.configs, {
          id: action.payload.property_id,
          changes: action.payload
        });
      })
      .addCase(updateTenantConfig.rejected, (state, action) => {
        delete state.loading.operations[`updateConfig_${action.meta.arg.configId}`];
        state.errors.configs = action.error.message;
        state.errors.lastError = action.error.message;
      });
    
    // Fetch leads (initial load)
    builder
      .addCase(fetchLeads.pending, (state) => {
        state.loading.leads = true;
        state.errors.leads = null;
        // Reset pagination for new fetch
        state.ui.pagination.offset = 0;
        state.ui.pagination.hasMore = true;
      })
      .addCase(fetchLeads.fulfilled, (state, action) => {
        state.loading.leads = false;
        const { leads, total, metadata } = action.payload;
        
        // Validate leads data before adding to adapter
        if (Array.isArray(leads) && leads.every(lead => lead && typeof lead === 'object' && lead.id)) {
          // Replace all leads for initial load
          leadsAdapter.setAll(state.leads, leads);
        } else {
          console.warn('[TenantSelectionSlice] Invalid leads data received:', leads);
          // Initialize with empty array if data is invalid
          leadsAdapter.setAll(state.leads, []);
        }
        
        // Update pagination (use valid leads array)
        const validLeads = Array.isArray(leads) ? leads : [];
        state.ui.pagination.offset = validLeads.length;
        state.ui.pagination.hasMore = validLeads.length === state.ui.pagination.limit;
        
        // Update statistics
        state.stats.totalApplications = total || validLeads.length;
        state.stats.qualifiedCount = validLeads.filter(l => l.status === 'qualified').length;
        state.stats.rejectedCount = validLeads.filter(l => l.status === 'rejected').length;
        state.stats.pendingCount = validLeads.filter(l => ['viewing_requested', 'dossier_requested'].includes(l.status)).length;
        state.stats.averageScore = validLeads.reduce((sum, l) => sum + (l.score || 0), 0) / (validLeads.length || 1);
        
        // Store metadata for debugging
        state.metadata.lastFetch = metadata;
      })
      .addCase(fetchLeads.rejected, (state, action) => {
        state.loading.leads = false;
        state.errors.leads = action.payload?.message || action.error.message;
        state.errors.lastError = action.payload?.message || action.error.message;
      });
    
    // Fetch more leads (infinite scroll)
    builder
      .addCase(fetchMoreLeads.pending, (state) => {
        state.ui.pagination.isLoadingMore = true;
        state.errors.leads = null;
      })
      .addCase(fetchMoreLeads.fulfilled, (state, action) => {
        state.ui.pagination.isLoadingMore = false;
        const { leads: newLeads, total, metadata } = action.payload;
        
        // Validate new leads data before adding to adapter
        if (Array.isArray(newLeads) && newLeads.every(lead => lead && typeof lead === 'object' && lead.id)) {
          // Add new leads to existing ones
          leadsAdapter.upsertMany(state.leads, newLeads);
        } else {
          console.warn('[TenantSelectionSlice] Invalid new leads data received:', newLeads);
        }
        
        // Update pagination (use valid leads array)
        const validNewLeads = Array.isArray(newLeads) ? newLeads : [];
        state.ui.pagination.offset += validNewLeads.length;
        state.ui.pagination.hasMore = validNewLeads.length === state.ui.pagination.limit;
        
        // Update total count if provided
        if (total) {
          state.stats.totalApplications = total;
        }
        
        // Store metadata for debugging
        state.metadata.lastFetchMore = metadata;
      })
      .addCase(fetchMoreLeads.rejected, (state, action) => {
        state.ui.pagination.isLoadingMore = false;
        state.errors.leads = action.payload?.message || action.error.message;
        state.errors.lastError = action.payload?.message || action.error.message;
      });
    
    // Fetch lead details
    builder
      .addCase(fetchLeadDetails.pending, (state, action) => {
        state.loading.operations[`fetchLead_${action.meta.arg}`] = true;
      })
      .addCase(fetchLeadDetails.fulfilled, (state, action) => {
        delete state.loading.operations[`fetchLead_${action.meta.arg}`];
        // Check if the payload has nested structure or is the lead directly
        const lead = action.payload.lead || action.payload;
        if (lead && lead.id) {
          leadsAdapter.upsertOne(state.leads, lead);
        }
        if (action.payload.decision) {
          decisionsAdapter.upsertOne(state.decisions, action.payload.decision);
        }
      })
      .addCase(fetchLeadDetails.rejected, (state, action) => {
        delete state.loading.operations[`fetchLead_${action.meta.arg}`];
        state.errors.leads = action.error.message;
        state.errors.lastError = action.error.message;
      });
    
    // Update lead status
    builder
      .addCase(updateLeadStatus.pending, (state, action) => {
        state.loading.operations[`updateLead_${action.meta.arg.leadId}`] = true;
      })
      .addCase(updateLeadStatus.fulfilled, (state, action) => {
        delete state.loading.operations[`updateLead_${action.meta.arg.leadId}`];
        leadsAdapter.updateOne(state.leads, {
          id: action.payload.id,
          changes: action.payload
        });
      })
      .addCase(updateLeadStatus.rejected, (state, action) => {
        delete state.loading.operations[`updateLead_${action.meta.arg.leadId}`];
        state.errors.leads = action.error.message;
        state.errors.lastError = action.error.message;
      });
    
    // Make decision
    builder
      .addCase(makeDecision.pending, (state, action) => {
        state.loading.operations[`decision_${action.meta.arg.leadId}`] = true;
      })
      .addCase(makeDecision.fulfilled, (state, action) => {
        delete state.loading.operations[`decision_${action.meta.arg.leadId}`];
        decisionsAdapter.upsertOne(state.decisions, action.payload.decision);
        leadsAdapter.updateOne(state.leads, {
          id: action.payload.lead.id,
          changes: action.payload.lead
        });
      })
      .addCase(makeDecision.rejected, (state, action) => {
        delete state.loading.operations[`decision_${action.meta.arg.leadId}`];
        state.errors.decisions = action.error.message;
        state.errors.lastError = action.error.message;
      })

      // Viewing slots management
      .addCase(createViewingSlots.pending, (state) => {
        console.log('[Reducer] createViewingSlots.pending');
        state.loading.operations.createSlots = true;
      })
      .addCase(createViewingSlots.fulfilled, (state, action) => {
        console.log('[Reducer] createViewingSlots.fulfilled', action.payload);
        state.loading.operations.createSlots = false;
        // Update viewing slots if needed
        if (action.payload && action.payload.created_slots) {
          console.log(`[Reducer] Created ${action.payload.created_slots} viewing slots`);
        }
      })
      .addCase(createViewingSlots.rejected, (state, action) => {
        console.log('[Reducer] createViewingSlots.rejected', action.payload);
        state.loading.operations.createSlots = false;
        state.errors.lastError = action.payload?.message || 'Failed to create viewing slots';
      })

      .addCase(bulkCreateSlots.pending, (state) => {
        state.loading.operations.bulkCreateSlots = true;
      })
      .addCase(bulkCreateSlots.fulfilled, (state, action) => {
        state.loading.operations.bulkCreateSlots = false;
        if (action.payload && action.payload.created_slots) {
          console.log(`Bulk created ${action.payload.created_slots} viewing slots`);
        }
      })
      .addCase(bulkCreateSlots.rejected, (state, action) => {
        state.loading.operations.bulkCreateSlots = false;
        state.errors.lastError = action.payload?.message || 'Failed to bulk create slots';
      });
  }
});

// Export pagination selectors
export const selectPaginationState = (state) => state.tenantSelection.ui.pagination;

// Handle real-time updates
export const handleRealtimeUpdate = (data) => (dispatch) => {
  console.log('Processing real-time update:', data);
  
  if (data.type === 'new_lead') {
    dispatch(leadReceived(data.lead));
  } else if (data.type === 'lead_updated') {
    dispatch(leadUpdated(data.lead));
  } else if (data.type === 'decision_made') {
    dispatch(decisionMade(data.decision));
  }
};

// Export actions
export const {
  setSelectedProperty,
  setSelectedLead,
  setFilters,
  setSorting,
  setView,
  toggleBulkSelection,
  clearBulkSelection,
  selectAllVisibleLeads,
  setPropertyData,
  setEmailConfig,
  setImportMethod,
  emailVerified,
  leadReceived,
  leadUpdated,
  decisionMade,
  clearTenantSelectionData
} = tenantSelectionSlice.actions;

// Selectors
const configSelectors = configsAdapter.getSelectors((state) => state.tenantSelection.configs);
const leadSelectors = leadsAdapter.getSelectors((state) => state.tenantSelection.leads);
const decisionSelectors = decisionsAdapter.getSelectors((state) => state.tenantSelection.decisions);

export const selectAllConfigs = configSelectors.selectAll;
export const selectConfigById = (state, propertyId) => configSelectors.selectById(state, propertyId);
export const selectAllLeads = leadSelectors.selectAll;
export const selectLeadById = (state, leadId) => leadSelectors.selectById(state, leadId);
export const selectAllDecisions = decisionSelectors.selectAll;
export const selectDecisionByLeadId = (state, leadId) => decisionSelectors.selectById(state, leadId);

// Memoized selector for filtered leads
export const selectFilteredLeads = createSelector(
  [selectAllLeads, (state) => state.tenantSelection.ui.filters],
  (allLeads, filters) => {
    return allLeads.filter(lead => {
      if (filters.propertyId && lead.property_id !== filters.propertyId) return false;
      if (filters.status !== 'all' && lead.status !== filters.status) return false;
      if (filters.sourcePortal !== 'all' && lead.source_portal !== filters.sourcePortal) return false;
      if (lead.score < filters.scoreRange.min || lead.score > filters.scoreRange.max) return false;
      
      // Date range filter
      if (filters.dateRange.start || filters.dateRange.end) {
        const leadDate = new Date(lead.created_at);
        if (filters.dateRange.start && leadDate < new Date(filters.dateRange.start)) return false;
        if (filters.dateRange.end && leadDate > new Date(filters.dateRange.end)) return false;
      }
      
      return true;
    });
  }
);

export const selectTenantSelectionStats = (state) => state.tenantSelection.stats;
export const selectTenantSelectionUI = (state) => state.tenantSelection.ui;
export const selectTenantSelectionLoading = (state) => state.tenantSelection.loading;
export const selectTenantSelectionErrors = (state) => state.tenantSelection.errors;

export default tenantSelectionSlice.reducer;