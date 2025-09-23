import { configureStore } from '@reduxjs/toolkit';
import tenantSelectionReducer, {
  // Actions
  setSelectedProperty,
  setSelectedLead,
  setFilters,
  setSorting,
  setView,
  toggleBulkSelection,
  clearBulkSelection,
  selectAllVisibleLeads,
  leadReceived,
  leadUpdated,
  decisionMade,
  clearTenantSelectionData,
  
  // Thunks
  fetchTenantConfig,
  createTenantConfig,
  updateTenantConfig,
  fetchLeads,
  fetchLeadDetails,
  updateLeadStatus,
  makeDecision,
  
  // Selectors
  selectAllConfigs,
  selectConfigById,
  selectAllLeads,
  selectLeadById,
  selectFilteredLeads,
  selectTenantSelectionStats,
  selectTenantSelectionUI
} from '../tenantSelectionSlice';

// Helper to create test store
const createTestStore = (preloadedState) => {
  return configureStore({
    reducer: {
      tenantSelection: tenantSelectionReducer
    },
    preloadedState: {
      tenantSelection: preloadedState
    }
  });
};

// Mock API - handle both named and default export
jest.mock('../../../api/tenantSelectionApi', () => {
  const mockAPI = {
    getConfig: jest.fn(),
    createConfig: jest.fn(),
    updateConfig: jest.fn(),
    getLeads: jest.fn(),
    getLeadDetails: jest.fn(),
    updateLeadStatus: jest.fn(),
    makeDecision: jest.fn(),
    scheduleViewing: jest.fn(),
    bulkInviteToViewing: jest.fn()
  };
  
  return {
    __esModule: true,
    default: mockAPI,
    tenantSelectionAPI: mockAPI
  };
});

describe('tenantSelectionSlice', () => {
  const initialState = {
    configs: {
      ids: [],
      entities: {}
    },
    leads: {
      ids: [],
      entities: {}
    },
    decisions: {
      ids: [],
      entities: {}
    },
    // New enhanced features state
    importedProperty: null,
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
      view: 'grid',
      bulkSelection: [],
      pagination: {
        limit: 20,
        offset: 0,
        hasMore: true
      }
    },
    loading: {
      configs: false,
      leads: false,
      decisions: false,
      operations: {}
    },
    errors: {
      configs: null,
      leads: null,
      decisions: null,
      lastError: null
    },
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

  describe('Reducer', () => {
    it.skip('should return the initial state', () => {
      expect(tenantSelectionReducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });

    it('should handle setSelectedProperty', () => {
      const actual = tenantSelectionReducer(initialState, setSelectedProperty(1));
      expect(actual.ui.selectedPropertyId).toEqual(1);
    });

    it('should handle setSelectedLead', () => {
      const actual = tenantSelectionReducer(initialState, setSelectedLead('lead-123'));
      expect(actual.ui.selectedLeadId).toEqual('lead-123');
    });

    it('should handle setFilters', () => {
      const filters = { status: 'qualified', propertyId: 1 };
      const actual = tenantSelectionReducer(initialState, setFilters(filters));
      expect(actual.ui.filters.status).toEqual('qualified');
      expect(actual.ui.filters.propertyId).toEqual(1);
    });

    it('should handle setSorting', () => {
      const sorting = { field: 'created_at', direction: 'asc' };
      const actual = tenantSelectionReducer(initialState, setSorting(sorting));
      expect(actual.ui.sorting).toEqual(sorting);
    });

    it('should handle setView', () => {
      const actual = tenantSelectionReducer(initialState, setView('table'));
      expect(actual.ui.view).toEqual('table');
    });

    it('should handle toggleBulkSelection', () => {
      let state = tenantSelectionReducer(initialState, toggleBulkSelection('lead-1'));
      expect(state.ui.bulkSelection).toContain('lead-1');
      
      state = tenantSelectionReducer(state, toggleBulkSelection('lead-2'));
      expect(state.ui.bulkSelection).toContain('lead-1');
      expect(state.ui.bulkSelection).toContain('lead-2');
      
      // Toggle off
      state = tenantSelectionReducer(state, toggleBulkSelection('lead-1'));
      expect(state.ui.bulkSelection).not.toContain('lead-1');
      expect(state.ui.bulkSelection).toContain('lead-2');
    });

    it('should handle clearBulkSelection', () => {
      const stateWithSelection = {
        ...initialState,
        ui: {
          ...initialState.ui,
          bulkSelection: ['lead-1', 'lead-2']
        }
      };
      const actual = tenantSelectionReducer(stateWithSelection, clearBulkSelection());
      expect(actual.ui.bulkSelection).toEqual([]);
    });

    it('should handle leadReceived', () => {
      const lead = {
        id: 'lead-1',
        name: 'John Doe',
        email: 'john@example.com',
        score: 85,
        status: 'viewing_requested'
      };
      const actual = tenantSelectionReducer(initialState, leadReceived(lead));
      expect(actual.leads.entities['lead-1']).toEqual(lead);
      expect(actual.leads.ids).toContain('lead-1');
      expect(actual.stats.totalApplications).toEqual(1);
      expect(actual.stats.pendingCount).toEqual(1);
    });

    it('should handle leadUpdated', () => {
      const stateWithLead = {
        ...initialState,
        leads: {
          ids: ['lead-1'],
          entities: {
            'lead-1': {
              id: 'lead-1',
              name: 'John Doe',
              status: 'viewing_requested'
            }
          }
        }
      };
      
      const update = {
        id: 'lead-1',
        status: 'qualified'
      };
      
      const actual = tenantSelectionReducer(stateWithLead, leadUpdated(update));
      expect(actual.leads.entities['lead-1'].status).toEqual('qualified');
    });

    it('should handle decisionMade', () => {
      const stateWithLead = {
        ...initialState,
        leads: {
          ids: ['lead-1'],
          entities: {
            'lead-1': {
              id: 'lead-1',
              name: 'John Doe',
              status: 'viewing_requested'
            }
          }
        }
      };
      
      const decision = {
        lead_id: 'lead-1',
        recommendation: 'accept',
        score: 85,
        reasoning: 'Good candidate'
      };
      
      const actual = tenantSelectionReducer(stateWithLead, decisionMade(decision));
      expect(actual.decisions.entities['lead-1']).toEqual(decision);
      expect(actual.leads.entities['lead-1'].status).toEqual('qualified');
    });

    it.skip('should handle clearTenantSelectionData', () => {
      const stateWithData = {
        ...initialState,
        leads: {
          ids: ['lead-1'],
          entities: { 'lead-1': { id: 'lead-1' } }
        },
        configs: {
          ids: [1],
          entities: { 1: { property_id: 1 } }
        },
        importedProperty: { id: 1, name: 'Test Property' },
        aiCards: [{ id: 1, card: 'test' }],
        documentProcessing: { doc1: 'processing' },
        extractedData: { data1: 'extracted' },
        viewingSlots: [{ id: 1, slot: 'test' }],
      };
      
      const actual = tenantSelectionReducer(stateWithData, clearTenantSelectionData());
      expect(actual.leads.ids).toEqual([]);
      expect(actual.configs.ids).toEqual([]);
      // These fields are not cleared by clearTenantSelectionData, only configs, leads, decisions, ui, and stats
      expect(actual.importedProperty).toEqual({ id: 1, name: 'Test Property' });
      expect(actual.aiCards).toEqual([{ id: 1, card: 'test' }]);
      expect(actual.ui).toEqual(initialState.ui);
    });
  });

  describe('Async Thunks', () => {
    let store;
    
    beforeEach(() => {
      store = createTestStore(initialState);
      jest.clearAllMocks();
    });

    it('should handle fetchLeads success', async () => {
      const mockLeads = [
        { id: 'lead-1', name: 'John Doe', score: 85, status: 'pending' },
        { id: 'lead-2', name: 'Jane Smith', score: 92, status: 'qualified' }
      ];
      
      const tenantSelectionAPI = require('../../../api/tenantSelectionApi').default;
      tenantSelectionAPI.getLeads.mockResolvedValue({
        data: { 
          leads: mockLeads,
          total: mockLeads.length
        }
      });

      await store.dispatch(fetchLeads({ propertyId: 1 }));
      
      const state = store.getState().tenantSelection;
      expect(state.loading.leads).toBe(false);
      expect(state.leads.ids).toContain('lead-1');
      expect(state.leads.ids).toContain('lead-2');
      expect(state.leads.entities['lead-1']).toEqual(mockLeads[0]);
    });

    it('should handle fetchLeads failure', async () => {
      const tenantSelectionAPI = require('../../../api/tenantSelectionApi').default;
      tenantSelectionAPI.getLeads.mockRejectedValue(new Error('Network error'));

      await store.dispatch(fetchLeads({ propertyId: 1 }));
      
      const state = store.getState().tenantSelection;
      expect(state.loading.leads).toBe(false);
      expect(state.errors.leads).toBe('Network error');
    });

    it.skip('should handle updateLeadStatus', async () => {
      const updatedLead = {
        id: 'lead-1',
        status: 'qualified'
      };
      
      const { tenantSelectionAPI } = require('../../../api/tenantSelectionApi');
      tenantSelectionAPI.updateLeadStatus.mockResolvedValue({
        data: updatedLead
      });

      // First add a lead to update
      store.dispatch(leadReceived({ id: 'lead-1', name: 'John', status: 'pending' }));

      await store.dispatch(updateLeadStatus({
        leadId: 'lead-1',
        status: 'qualified',
        notes: 'Approved'
      }));
      
      const state = store.getState().tenantSelection;
      expect(state.leads.entities['lead-1'].status).toEqual('qualified');
    });

    it('should handle makeDecision', async () => {
      const response = {
        decision: {
          lead_id: 'lead-1',
          recommendation: 'accept',
          reasoning: 'Good fit'
        },
        lead: {
          id: 'lead-1',
          status: 'qualified'
        }
      };
      
      const tenantSelectionAPI = require('../../../api/tenantSelectionApi').default;
      tenantSelectionAPI.makeDecision.mockResolvedValue({ data: response });

      // First add a lead to make decision on
      store.dispatch(leadReceived({ id: 'lead-1', name: 'John', status: 'pending' }));

      await store.dispatch(makeDecision({
        leadId: 'lead-1',
        decision: 'accept',
        reasoning: 'Good fit'
      }));
      
      const state = store.getState().tenantSelection;
      expect(state.decisions.entities['lead-1']).toBeDefined();
      expect(state.decisions.entities['lead-1'].recommendation).toEqual('accept');
      expect(state.leads.entities['lead-1'].status).toEqual('qualified');
    });
  });

  describe('Selectors', () => {
    const stateWithData = {
      tenantSelection: {
        ...initialState,
        configs: {
          ids: [1],
          entities: {
            1: { property_id: 1, managed_email: 'test@example.com' }
          }
        },
        leads: {
          ids: ['lead-1', 'lead-2', 'lead-3'],
          entities: {
            'lead-1': {
              id: 'lead-1',
              name: 'John Doe',
              property_id: 1,
              score: 85,
              status: 'qualified'
            },
            'lead-2': {
              id: 'lead-2',
              name: 'Jane Smith',
              property_id: 1,
              score: 92,
              status: 'viewing_requested'
            },
            'lead-3': {
              id: 'lead-3',
              name: 'Bob Johnson',
              property_id: 2,
              score: 70,
              status: 'rejected'
            }
          }
        },
        ui: {
          ...initialState.ui,
          filters: {
            ...initialState.ui.filters,
            propertyId: 1,
            status: 'qualified'
          }
        }
      }
    };

    it('should select all configs', () => {
      const configs = selectAllConfigs(stateWithData);
      expect(configs).toHaveLength(1);
      expect(configs[0].property_id).toEqual(1);
    });

    it('should select config by id', () => {
      const config = selectConfigById(stateWithData, 1);
      expect(config.managed_email).toEqual('test@example.com');
    });

    it('should select all leads', () => {
      const leads = selectAllLeads(stateWithData);
      expect(leads).toHaveLength(3);
    });

    it('should select lead by id', () => {
      const lead = selectLeadById(stateWithData, 'lead-1');
      expect(lead.name).toEqual('John Doe');
    });

    it('should select filtered leads', () => {
      const filteredLeads = selectFilteredLeads(stateWithData);
      expect(filteredLeads).toHaveLength(1);
      expect(filteredLeads[0].id).toEqual('lead-1');
      expect(filteredLeads[0].status).toEqual('qualified');
    });

    it('should filter leads by score range', () => {
      const stateWithScoreFilter = {
        ...stateWithData,
        tenantSelection: {
          ...stateWithData.tenantSelection,
          ui: {
            ...stateWithData.tenantSelection.ui,
            filters: {
              ...stateWithData.tenantSelection.ui.filters,
              status: 'all',
              scoreRange: { min: 80, max: 90 }
            }
          }
        }
      };
      
      const filteredLeads = selectFilteredLeads(stateWithScoreFilter);
      expect(filteredLeads).toHaveLength(1);
      expect(filteredLeads[0].score).toEqual(85);
    });

    it('should select tenant selection stats', () => {
      const stats = selectTenantSelectionStats(stateWithData);
      expect(stats.totalApplications).toEqual(0);
      expect(stats.averageScore).toEqual(0);
    });

    it('should select tenant selection UI', () => {
      const ui = selectTenantSelectionUI(stateWithData);
      expect(ui.selectedPropertyId).toEqual(null);
      expect(ui.filters.propertyId).toEqual(1);
      expect(ui.view).toEqual('grid');
    });
  });
});