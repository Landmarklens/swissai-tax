import axios from 'axios';
import { tenantSelectionAPI, TenantSelectionRealtime } from '../tenantSelectionApi';

// Mock axios
jest.mock('axios');

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock EventSource for SSE
global.EventSource = jest.fn(() => ({
  addEventListener: jest.fn(),
  close: jest.fn(),
  onmessage: null,
  onerror: null,
  onopen: null,
}));

describe.skip('tenantSelectionAPI', () => {
  let mockAxiosInstance;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('test-token');
    
    // Create mock axios instance
    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    };
    
    axios.create.mockReturnValue(mockAxiosInstance);
  });
  
  describe('Configuration Endpoints', () => {
    test('setupTenantSelection sends correct request', async () => {
      const setupData = {
        property_id: 123,
        max_viewing_invites: 20,
        hard_criteria: { min_income: 100000 },
        soft_criteria: { credit_score: { weight: 30 } },
      };
      
      mockAxiosInstance.post.mockResolvedValue({ data: { id: '123', ...setupData } });
      
      await tenantSelectionAPI.setupTenantSelection(setupData);
      
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/tenant-selection/setup',
        setupData
      );
    });
    
    test('getConfig fetches property configuration', async () => {
      const propertyId = 123;
      const mockConfig = { id: '123', property_id: propertyId, managed_email: 'test@example.com' };
      
      mockAxiosInstance.get.mockResolvedValue({ data: mockConfig });
      
      const result = await tenantSelectionAPI.getConfig(propertyId);
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        `/api/tenant-selection/config/${propertyId}`
      );
      expect(result.data).toEqual(mockConfig);
    });
  });
  
  describe('Leads Endpoints', () => {
    test('getLeads with filters builds correct query string', async () => {
      const filters = {
        propertyId: 123,
        status: 'viewing_scheduled',
        sourcePortal: 'homegate',
        minScore: 60,
        maxScore: 100,
        startDate: '2024-08-01',
        endDate: '2024-08-31',
        limit: 50,
        offset: 0,
      };
      
      mockAxiosInstance.get.mockResolvedValue({ data: [] });
      
      await tenantSelectionAPI.getLeads(filters);
      
      const expectedQuery = 
        'property_id=123&status=viewing_scheduled&source_portal=homegate&' +
        'min_score=60&max_score=100&start_date=2024-08-01&end_date=2024-08-31&' +
        'limit=50&offset=0';
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        `/api/tenant-selection/leads?${expectedQuery}`
      );
    });
    
    test('getLeads without filters sends empty query', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: [] });
      
      await tenantSelectionAPI.getLeads();
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/tenant-selection/leads?'
      );
    });
    
    test('getLeadDetails fetches specific lead', async () => {
      const leadId = 'abc-123';
      const mockLead = { id: leadId, applicant_name: 'John Doe' };
      
      mockAxiosInstance.get.mockResolvedValue({ data: mockLead });
      
      const result = await tenantSelectionAPI.getLeadDetails(leadId);
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        `/api/tenant-selection/leads/${leadId}`
      );
      expect(result.data).toEqual(mockLead);
    });
    
    test('updateLead patches lead data', async () => {
      const leadId = 'abc-123';
      const updateData = { lead_status: 'viewing_attended' };
      
      mockAxiosInstance.patch.mockResolvedValue({ data: { id: leadId, ...updateData } });
      
      await tenantSelectionAPI.updateLead(leadId, updateData);
      
      expect(mockAxiosInstance.patch).toHaveBeenCalledWith(
        `/api/tenant-selection/leads/${leadId}`,
        updateData
      );
    });
  });
  
  describe('Decision Endpoints', () => {
    test('makeDecision posts decision data', async () => {
      const leadId = 'abc-123';
      const decisionData = {
        decision: 'viewing_scheduled',
        viewingDate: '2024-08-25T14:00:00Z',
        reasoning: 'Qualified candidate',
        sendEmail: true,
      };
      
      mockAxiosInstance.post.mockResolvedValue({ data: { success: true } });
      
      await tenantSelectionAPI.makeDecision(leadId, decisionData);
      
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        `/api/tenant-selection/leads/${leadId}/decide`,
        decisionData
      );
    });
    
    test('bulkReject sends multiple lead IDs', async () => {
      const propertyId = 123;
      const leadIds = ['id1', 'id2', 'id3'];
      
      mockAxiosInstance.post.mockResolvedValue({ data: { rejected: 3 } });
      
      await tenantSelectionAPI.bulkReject(propertyId, leadIds);
      
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        `/api/tenant-selection/${propertyId}/bulk-reject`,
        { lead_ids: leadIds }
      );
    });
  });
  
  describe('Email Endpoints', () => {
    test('sendEmail posts email data', async () => {
      const emailData = {
        recipient: 'test@example.com',
        template_key: 'viewing_invitation',
        variables: { applicant_name: 'John Doe' },
      };
      
      mockAxiosInstance.post.mockResolvedValue({ data: { message_id: '123' } });
      
      await tenantSelectionAPI.sendEmail(emailData);
      
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/tenant-selection/send-email',
        emailData
      );
    });
    
    test('getEmailTemplates fetches templates', async () => {
      const mockTemplates = [
        { id: '1', template_key: 'viewing_invitation' },
        { id: '2', template_key: 'application_accepted' },
      ];
      
      mockAxiosInstance.get.mockResolvedValue({ data: mockTemplates });
      
      const result = await tenantSelectionAPI.getEmailTemplates();
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/tenant-selection/templates');
      expect(result.data).toEqual(mockTemplates);
    });
  });
  
  describe('Export Endpoints', () => {
    test('exportReport requests with blob response type', async () => {
      const propertyId = 123;
      const mockBlob = new Blob(['test data'], { type: 'application/pdf' });
      
      mockAxiosInstance.get.mockResolvedValue({ data: mockBlob });
      
      await tenantSelectionAPI.exportReport(propertyId);
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        `/api/tenant-selection/${propertyId}/export-report`,
        { responseType: 'blob' }
      );
    });
  });
  
  describe('Authentication', () => {
    test('adds bearer token to requests when available', async () => {
      localStorageMock.getItem.mockReturnValue('test-bearer-token');
      
      // Recreate axios instance to get new interceptor
      axios.create.mockClear();
      const newMockInstance = {
        get: jest.fn(),
        post: jest.fn(),
        interceptors: {
          request: { use: jest.fn((fn) => fn({ headers: {} })) },
          response: { use: jest.fn() },
        },
      };
      axios.create.mockReturnValue(newMockInstance);
      
      // Re-import to trigger module initialization
      jest.resetModules();
      const { tenantSelectionAPI: newAPI } = require('../tenantSelectionApi');
      
      // Verify interceptor adds token
      const interceptorFn = newMockInstance.interceptors.request.use.mock.calls[0][0];
      const config = interceptorFn({ headers: {} });
      
      expect(config.headers.Authorization).toBe('Bearer test-bearer-token');
    });
    
    test('handles 401 response by removing token and redirecting', async () => {
      // Mock window.location
      delete window.location;
      window.location = { href: '' };
      
      mockAxiosInstance.get.mockRejectedValue({
        response: { status: 401 },
      });
      
      // Setup response interceptor
      const errorInterceptor = mockAxiosInstance.interceptors.response.use.mock.calls[0][1];
      
      try {
        await errorInterceptor({ response: { status: 401 } });
      } catch (error) {
        // Expected to throw
      }
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
      expect(window.location.href).toBe('/');
    });
  });
});

describe.skip('TenantSelectionRealtime', () => {
  test('creates EventSource connection with property ID', () => {
    localStorageMock.getItem.mockReturnValue('test-token');
    
    const onMessage = jest.fn();
    const onError = jest.fn();
    const realtime = new TenantSelectionRealtime(onMessage, onError);
    
    realtime.connect(123);
    
    expect(EventSource).toHaveBeenCalledWith(
      expect.stringContaining('/tenant-selection/stream/123?token=test-token')
    );
  });
  
  test('handles reconnection on error', () => {
    jest.useFakeTimers();
    
    const onMessage = jest.fn();
    const onError = jest.fn();
    const realtime = new TenantSelectionRealtime(onMessage, onError);
    
    realtime.connect(123);
    
    // Simulate error
    realtime.eventSource.onerror({ type: 'error' });
    
    expect(onError).toHaveBeenCalled();
    expect(realtime.reconnectAttempts).toBe(1);
    
    // Fast-forward timer
    jest.advanceTimersByTime(1000);
    
    // Should attempt reconnection
    expect(EventSource).toHaveBeenCalledTimes(2);
    
    jest.useRealTimers();
  });
  
  test('parses incoming messages', () => {
    const onMessage = jest.fn();
    const onError = jest.fn();
    const realtime = new TenantSelectionRealtime(onMessage, onError);
    
    realtime.connect(123);
    
    const mockEvent = {
      data: JSON.stringify({ type: 'lead_update', lead_id: 'abc-123' }),
    };
    
    realtime.eventSource.onmessage(mockEvent);
    
    expect(onMessage).toHaveBeenCalledWith({
      type: 'lead_update',
      lead_id: 'abc-123',
    });
  });
  
  test('disconnects properly', () => {
    const onMessage = jest.fn();
    const onError = jest.fn();
    const realtime = new TenantSelectionRealtime(onMessage, onError);
    
    realtime.connect(123);
    const closeSpy = jest.spyOn(realtime.eventSource, 'close');
    
    realtime.disconnect();
    
    expect(closeSpy).toHaveBeenCalled();
    expect(realtime.eventSource).toBeNull();
  });
});