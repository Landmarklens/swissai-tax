import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import logger from '../../../../services/enhancedLoggingService';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  Alert,
  AlertTitle,
  Badge,
  IconButton,
  Tooltip,
  Paper,
  TextField,
  InputAdornment,
  Stack,
  Divider,
  Collapse,
  LinearProgress,
  Avatar
} from '@mui/material';
import {
  GridView as GridViewIcon,
  TableRows as TableIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CheckCircleIcon,
  Home as HomeIcon,
  Email as EmailIcon,
  ChatBubbleOutline as ChatIcon,
  InsightsOutlined as InsightsIcon,
  EventNote as ViewingIcon,
  Description as DocumentsIcon,
  ThumbUp as SelectIcon,
  Cancel as XIcon,
  LocationOn as LocationIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Group as GroupIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { fetchProperties, selectProperties } from '../../../../store/slices/propertiesSlice';
import { fetchLeads, setFilters } from '../../../../store/slices/tenantSelectionSlice';
import { tenantSelectionAPI } from '../../../../api/tenantSelectionApi';
import EnhancedApplicationCard from '../TenantSelection/EnhancedApplicationCard';
import ApplicationDetailModal from '../TenantSelection/ApplicationDetailModal';
import DecisionFlowModal from '../TenantSelection/DecisionFlowModal';
import ApplicationsTableView from '../TenantSelection/ApplicationsTableView';
import DocumentsModal from '../TenantSelection/DocumentsModal';

const TenantApplicationsEnhanced = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Log component mount
  useEffect(() => {
    logger.logComponentMount('TenantApplicationsEnhanced', {
      path: location.pathname,
      search: location.search
    });

    return () => {
      logger.logComponentUnmount('TenantApplicationsEnhanced');
    };
  }, []);
  
  // Redux state - Use separate selectors to avoid memoization warnings
  const propertiesState = useSelector(selectProperties);
  const properties = propertiesState?.properties?.data || [];
  const leads = useSelector(state => state.tenantSelection.leads);
  const loading = useSelector(state => state.tenantSelection.loading?.leads || false);
  const error = useSelector(state => state.tenantSelection.errors?.leads || null);
  const filters = useSelector(state => state.tenantSelection.filters);
  const user = useSelector(state => state.auth.user);
  
  // Local state
  const [selectedProperty, setSelectedProperty] = useState('all');
  const [propertyCriteria, setPropertyCriteria] = useState(null);
  // const [showCriteria, setShowCriteria] = useState(false); // Removed as per requirement
  const [showInsights, setShowInsights] = useState(true); // Show insights by default
  const [viewMode, setViewMode] = useState('cards');
  const [sortBy, setSortBy] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [documentsModalApplication, setDocumentsModalApplication] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [insightsGenerated, setInsightsGenerated] = useState(false);
  const [visibleCards, setVisibleCards] = useState(20);
  const [propertyViewings, setPropertyViewings] = useState([]);
  const [viewingsLoading, setViewingsLoading] = useState(false);
  const loadMoreRef = useRef(null);
  const scrollContainerRef = useRef(null);
  
  // Load properties on mount only if not already loaded
  useEffect(() => {
    if (!properties || properties.length === 0) {
      logger.info('DATA_FETCH', 'Fetching properties', {
        currentCount: properties?.length || 0
      });
      dispatch(fetchProperties());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Set default property only once when properties are loaded
  useEffect(() => {
    if (properties && properties.length > 0) {
      logger.debug('PROPERTY_SELECTION', 'Setting property from URL if available', {
        propertiesCount: properties.length
      });
      // Use the property from URL params if available
      const urlParams = new URLSearchParams(window.location.search);
      const propertyFromUrl = urlParams.get('property');
      if (propertyFromUrl) {
        // Convert to number to match property IDs
        const propertyId = parseInt(propertyFromUrl);
        // Check if property exists in the list
        const propertyExists = properties.some(p => p.id === propertyId);
        if (propertyExists) {
          setSelectedProperty(propertyId);
        } else {
          logger.warn('PROPERTY_SELECTION', 'Property from URL not found', {
            requestedId: propertyId,
            availableIds: properties.map(p => p.id)
          });
        }
      } else if (selectedProperty === 'all') {
        // Keep 'all' as default if no property in URL
        setSelectedProperty('all');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.length, location.search]); // React to URL changes
  
  // Load property config and apply sorting preferences when property changes
  useEffect(() => {
    if (selectedProperty && selectedProperty !== 'all') {
      // Reset initialization flag when property changes
      setIsInitialized(false);

      // Load config but don't block on it
      loadPropertyConfig(selectedProperty).then(config => {
        // Apply default sorting from config
        if (config?.sorting_preferences && !sortBy) {
          const { primary_sort, direction } = config.sorting_preferences;
          setSortBy(`${primary_sort}_${direction}`);
        }
      }).catch(err => {
        console.error('Config load failed, continuing without criteria:', err);
      });
    } else if (selectedProperty === 'all') {
      // Reset config when showing all properties
      setPropertyCriteria(null);
      setIsInitialized(false);
      if (!sortBy) {
        setSortBy('created_at_desc');
      }
    }
  }, [selectedProperty]);
  
  // Load applications when property changes (not filter changes to avoid too many requests)
  useEffect(() => {
    // Skip if already initialized for this property
    if (isInitialized) {
      return;
    }

    console.log('TenantApplicationsEnhanced: Load effect triggered', {
      selectedProperty,
      loading,
      loadingTimeout,
      isInitialized
    });

    const fetchTimeoutId = setTimeout(async () => {
      console.log('TenantApplicationsEnhanced: Fetching leads for property', selectedProperty);

      try {
        const result = await dispatch(fetchLeads({
          propertyId: selectedProperty === 'all' ? undefined : selectedProperty,
          status: filterStatus !== 'all' ? filterStatus : undefined
        })).unwrap();
        console.log('TenantApplicationsEnhanced: Leads fetched successfully', result);
        setIsInitialized(true);
      } catch (error) {
        console.error('TenantApplicationsEnhanced: Error fetching leads:', error);

        // Handle timeout specifically
        if (error?.isTimeout || error?.status === 408) {
          setLoadingTimeout(true);
          console.error('Request timeout - server took too long to respond');
        } else if (error?.status === 404) {
          console.log('No leads found for this property');
          setIsInitialized(true); // Still mark as initialized even if no leads
        } else if (error?.status === 401) {
          console.error('Authentication error - please log in again');
        } else {
          console.error('Failed to load applications:', error.message);
        }
      }
    }, 100);

    return () => clearTimeout(fetchTimeoutId);
  }, [selectedProperty]); // Only depend on selectedProperty to avoid loops
  
  // Handle filter changes separately with a longer debounce
  useEffect(() => {
    if (isInitialized && !loading) {
      const timeoutId = setTimeout(async () => {
        console.log('TenantApplicationsEnhanced: Applying filter', filterStatus);
        try {
          await dispatch(fetchLeads({
            propertyId: selectedProperty === 'all' ? undefined : selectedProperty,
            status: filterStatus !== 'all' ? filterStatus : undefined
          })).unwrap();
        } catch (error) {
          console.error('TenantApplicationsEnhanced: Error applying filter:', error);
        }
      }, 800); // Longer delay for filter changes

      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

  // Fetch viewing slots when property changes
  useEffect(() => {
    if (selectedProperty && selectedProperty !== 'all') {
      fetchPropertyViewings(selectedProperty);
    } else {
      setPropertyViewings([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProperty]);
  
  // Fetch viewings for selected property
  const fetchPropertyViewings = async (propertyId) => {
    if (!propertyId || propertyId === 'all') {
      setPropertyViewings([]);
      return;
    }

    setViewingsLoading(true);
    try {
      const response = await tenantSelectionAPI.getViewingSlots(propertyId);

      // Try different possible response structures
      let viewingData = [];

      if (response.data) {
        if (response.data.slots) {
          viewingData = response.data.slots;
        } else if (response.data.viewing_slots) {
          viewingData = response.data.viewing_slots;
        } else if (Array.isArray(response.data)) {
          viewingData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          viewingData = response.data.data;
        }
      }

      setPropertyViewings(viewingData);
    } catch (error) {
      console.error('Failed to fetch viewing slots:', error);
      setPropertyViewings([]);
    } finally {
      setViewingsLoading(false);
    }
  };

  const loadPropertyConfig = async (propertyId) => {
    try {
      console.log('TenantApplicationsEnhanced: Loading config for property', propertyId);
      const response = await tenantSelectionAPI.getConfig(propertyId);
      console.log('TenantApplicationsEnhanced: Config loaded', response.data);
      // Validate and clean the criteria data
      if (response?.data) {
        const cleanedData = {
          ...response.data,
          hard_criteria: response.data.hard_criteria || {},
          soft_criteria: response.data.soft_criteria || {},
          sorting_preferences: response.data.sorting_preferences || {
            primary_sort: 'soft_score',
            direction: 'desc'
          }
        };
        setPropertyCriteria(cleanedData);
        return cleanedData;
      } else {
        setPropertyCriteria(null);
        return null;
      }
    } catch (error) {
      console.error('Failed to load property config:', error);

      // If config doesn't exist (404) or method not allowed (405), try to create a default one
      if (error?.response?.status === 404 || error?.response?.status === 405) {
        console.log('Config not found, creating default config for property', propertyId);
        try {
          // Create a basic config for the property
          const setupData = {
            property_id: propertyId,
            hard_criteria: {
              min_income_ratio: 3.0,
              max_occupants: 4,
              pets_allowed: true,
              smoking_allowed: false
            },
            soft_criteria: {},
            ai_instructions: "Help evaluate tenant applications professionally.",
            max_viewing_invites: 20,
            auto_send_viewing_invites: false
          };

          const setupResponse = await tenantSelectionAPI.setupTenantSelection(setupData);
          console.log('Default config created:', setupResponse.data);
          setPropertyCriteria(setupResponse.data);
          return setupResponse.data;
        } catch (setupError) {
          console.error('Failed to create default config:', setupError);
        }
      }

      // Don't let config failure block the entire page
      setPropertyCriteria(null);
      return null;
    }
  };
  
  const loadApplications = useCallback((propertyId, status = filterStatus) => {
    logger.info('DATA_FETCH', 'Loading applications', {
      propertyId,
      status,
      filterStatus
    });
    dispatch(fetchLeads({
      propertyId: propertyId === 'all' ? undefined : propertyId,
      status: status !== 'all' ? status : undefined
    }));
  }, [dispatch, filterStatus]);
  
  const handleRefresh = async () => {
    logger.logUserAction('refresh_applications', 'TenantApplicationsEnhanced', {
      selectedProperty,
      filterStatus
    });

    setRefreshing(true);
    setLoadingTimeout(false); // Clear timeout state

    // Refresh applications
    await loadApplications(selectedProperty, filterStatus);

    // Generate AI insights if not done yet
    if (!insightsGenerated && selectedProperty) {
      try {
        logger.info('AI_INSIGHTS', 'Generating batch insights', {
          propertyId: selectedProperty
        });
        await tenantSelectionAPI.batchGenerateInsights(selectedProperty);
        setInsightsGenerated(true);
        logger.info('AI_INSIGHTS', 'Batch insights generated successfully');
      } catch (error) {
        logger.error('AI_INSIGHTS', 'Failed to generate insights', {
          error: error.message,
          propertyId: selectedProperty
        });
        console.error('Failed to generate insights:', error);
      }
    }


    setTimeout(() => setRefreshing(false), 1000);
  };
  
  const handleExport = async () => {
    logger.logUserAction('export_report', 'TenantApplicationsEnhanced', {
      selectedProperty,
      applicationCount: processedApplications.length
    });

    try {
      const response = await tenantSelectionAPI.exportReport(selectedProperty);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `applications_${selectedProperty}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      logger.info('EXPORT', 'Report exported successfully', {
        propertyId: selectedProperty
      });
    } catch (error) {
      logger.error('EXPORT', 'Export failed', {
        error: error.message,
        propertyId: selectedProperty
      });
      console.error('Export failed:', error);
    }
  };
  
  // Navigate to messages page with lead context
  const handleViewMessages = (leadId) => {
    logger.logNavigation('tenant_applications', 'communication', {
      leadId,
      propertyId: selectedProperty
    });
    navigate(`/owner-account/communication?lead=${leadId}`);
  };
  
  // Filter and sort applications
  const processedApplications = useMemo(() => {
    // Handle both array and entity adapter formats
    let leadsArray = [];
    if (Array.isArray(leads)) {
      leadsArray = [...leads];
    } else if (leads?.ids && leads?.entities) {
      leadsArray = leads.ids.map(id => leads.entities[id]).filter(Boolean);
    }

    // Add mock test data with documents for demonstration
    const mockTestLead = {
      id: 'test-lead-456',
      property_id: selectedProperty === 'all' ? 'test-prop-123' : selectedProperty,
      anonymized_id: 'TEST_USER_001',
      name: 'Michael Weber',
      email: 'test@example.com',
      lead_status: 'dossier_submitted',
      created_at: new Date().toISOString(),
      soft_score: 95,
      match_percentage: 98,
      ai_extracted_data: {
        name: 'Michael Weber',
        income: 120000,
        employment_status: 'Permanent',
        household_size: 2
      },
      dossier_data: {
        applicant_name: 'Michael Weber',
        monthly_income: 10000,
        documents_provided: [
          {
            id: '1a2b3c4d',
            type: 'identity',
            name: 'passport.pdf',
            url: 'https://homeai-tenant-documents.s3.us-east-1.amazonaws.com/tenant-selection/test-prop-123/test-lead-456/passport.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAWPPO6EKRQBIA4IRM%2F20250917%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20250917T195744Z&X-Amz-Expires=86400&X-Amz-SignedHeaders=host&X-Amz-Signature=3b54d3b9c303cb32120cb4cc76f34ed4c09ea8809eeccaeb8cc46b2039ac2576',
            size: 2177,
            uploaded_at: new Date().toISOString(),
            status: 'verified'
          },
          {
            id: '2b3c4d5e',
            type: 'income',
            name: 'salary_certificate.pdf',
            url: 'https://homeai-tenant-documents.s3.us-east-1.amazonaws.com/tenant-selection/test-prop-123/test-lead-456/salary_certificate.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAWPPO6EKRQBIA4IRM%2F20250917%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20250917T195745Z&X-Amz-Expires=86400&X-Amz-SignedHeaders=host&X-Amz-Signature=c6e393ffc4db8f53d14e7b8bd151c40ca2f2d86ff366fe49a31f719cdfd76edb',
            size: 2141,
            uploaded_at: new Date().toISOString(),
            status: 'verified'
          },
          {
            id: '3c4d5e6f',
            type: 'income',
            name: 'employment_contract.pdf',
            url: 'https://homeai-tenant-documents.s3.us-east-1.amazonaws.com/tenant-selection/test-prop-123/test-lead-456/employment_contract.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAWPPO6EKRQBIA4IRM%2F20250917%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20250917T195746Z&X-Amz-Expires=86400&X-Amz-SignedHeaders=host&X-Amz-Signature=0a557785f59a157c340d4bcc835c9fbc42b30f92d513fe5d1f80e8ba107069e9',
            size: 2203,
            uploaded_at: new Date().toISOString(),
            status: 'verified'
          },
          {
            id: '4d5e6f7g',
            type: 'reference',
            name: 'landlord_reference.pdf',
            url: 'https://homeai-tenant-documents.s3.us-east-1.amazonaws.com/tenant-selection/test-prop-123/test-lead-456/landlord_reference.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAWPPO6EKRQBIA4IRM%2F20250917%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20250917T195747Z&X-Amz-Expires=86400&X-Amz-SignedHeaders=host&X-Amz-Signature=7478631fe019f81873dbd2b441c71aeb266cb8580bdd28336451a53f64cf89ec',
            size: 2300,
            uploaded_at: new Date().toISOString(),
            status: 'verified'
          },
          {
            id: '5e6f7g8h',
            type: 'other',
            name: 'bank_statement.pdf',
            url: 'https://homeai-tenant-documents.s3.us-east-1.amazonaws.com/tenant-selection/test-prop-123/test-lead-456/bank_statement.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAWPPO6EKRQBIA4IRM%2F20250917%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20250917T195748Z&X-Amz-Expires=86400&X-Amz-SignedHeaders=host&X-Amz-Signature=68427e70435ff849c3420a5c69b9631976090c8da1806711c0f352c45b76c81d',
            size: 2497,
            uploaded_at: new Date().toISOString(),
            status: 'verified'
          }
        ],
        submission_date: new Date().toISOString(),
        completion_status: 'complete',
        total_documents: 5,
        verified_documents: 5
      }
    };

    // Always add test lead for demonstration
    let filtered = [...leadsArray];

    // Always add the test lead at the beginning for easy testing
    filtered.unshift(mockTestLead);

    // Apply property filter - IMPORTANT for correct pipeline percentages
    if (selectedProperty && selectedProperty !== 'all') {
      filtered = filtered.filter(app => app.property_id === selectedProperty);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(app =>
        app.anonymized_id?.toLowerCase().includes(query) ||
        app.email?.toLowerCase().includes(query) ||
        app.ai_extracted_data?.summary?.toLowerCase().includes(query) ||
        app.ai_insights?.executive_summary?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(app => app.lead_status === filterStatus);
    }

    // Apply sorting - use property preferences or manual selection
    const sortField = sortBy ||
      (propertyCriteria?.sorting_preferences ?
        `${propertyCriteria.sorting_preferences.primary_sort}_${propertyCriteria.sorting_preferences.direction}` :
        'match_desc');

    filtered.sort((a, b) => {
      switch (sortField) {
        case 'match_desc':
          return (b.match_percentage || b.soft_score || 0) - (a.match_percentage || a.soft_score || 0);
        case 'match_asc':
          return (a.match_percentage || a.soft_score || 0) - (b.match_percentage || b.soft_score || 0);
        case 'score_desc':
        case 'soft_score_desc':
          return (b.soft_score || 0) - (a.soft_score || 0);
        case 'score_asc':
        case 'soft_score_asc':
          return (a.soft_score || 0) - (b.soft_score || 0);
        case 'date_desc':
        case 'created_at_desc':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'date_asc':
        case 'created_at_asc':
          return new Date(a.created_at) - new Date(b.created_at);
        default:
          return 0;
      }
    });

    return filtered;
  }, [leads, searchQuery, filterStatus, sortBy, propertyCriteria, selectedProperty]);
  
  // Calculate statistics
  const stats = useMemo(() => {
    const total = processedApplications.length;
    const pending = processedApplications.filter(a => a.lead_status === 'viewing_requested').length;
    const scheduled = processedApplications.filter(a => a.lead_status === 'viewing_scheduled').length;
    const attended = processedApplications.filter(a => a.lead_status === 'viewing_attended').length;
    const documentsRequested = processedApplications.filter(a => a.lead_status === 'dossier_requested').length;
    const documentsSubmitted = processedApplications.filter(a => a.lead_status === 'dossier_submitted').length;
    const qualified = processedApplications.filter(a => a.lead_status === 'qualified').length;
    const selected = processedApplications.filter(a => a.lead_status === 'selected').length;
    const rejected = processedApplications.filter(a => a.lead_status === 'rejected').length;

    return { total, pending, scheduled, attended, documentsRequested, documentsSubmitted, qualified, selected, rejected };
  }, [processedApplications]);
  
  const handleViewDetails = (application) => {
    logger.logUserAction('view_application_details', 'TenantApplicationsEnhanced', {
      applicationId: application?.id,
      propertyId: selectedProperty,
      status: application?.lead_status
    });
    setSelectedApplication(application);
    setShowDetailModal(true);
  };
  
  const handleMakeDecision = (application) => {
    logger.logUserAction('initiate_decision', 'TenantApplicationsEnhanced', {
      applicationId: application?.id,
      propertyId: selectedProperty,
      currentStatus: application?.lead_status
    });
    setSelectedApplication(application);
    setShowDecisionModal(true);
  };

  const handleViewDocuments = (application) => {
    logger.logUserAction('view_documents', 'TenantApplicationsEnhanced', {
      applicationId: application?.id,
      propertyId: selectedProperty
    });
    setDocumentsModalApplication(application);
    setShowDocumentsModal(true);
  };

  
  // Helper functions for viewing slots
  const getNextViewingDate = () => {
    const viewingScheduled = processedApplications.find(app =>
      app.lead_status === 'viewing_scheduled' && app.property_id === selectedProperty
    );
    if (viewingScheduled?.viewing_slot_id) {
      return new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    }
    return 'No viewings scheduled';
  };

  const getNextViewingTime = () => {
    const viewingScheduled = processedApplications.find(app =>
      app.lead_status === 'viewing_scheduled' && app.property_id === selectedProperty
    );
    if (viewingScheduled?.viewing_slot_id) {
      return '2:00 PM - 3:00 PM';
    }
    return '';
  };

  const getAvailableSlots = () => {
    // Mock data - in real app, this would come from backend
    return 8;
  };

  const getTotalSlots = () => {
    // Mock data - in real app, this would come from backend
    return 12;
  };

  const getScheduledViewingsThisWeek = () => {
    return processedApplications.filter(app =>
      app.lead_status === 'viewing_scheduled' &&
      (selectedProperty === 'all' || app.property_id === selectedProperty)
    ).length;
  };

  const getCriteriaCount = () => {
    try {
      if (!propertyCriteria) return 0;
      
      const hardCriteria = propertyCriteria.hard_criteria || {};
      const softCriteria = propertyCriteria.soft_criteria || {};
      
      const hardCount = Object.keys(hardCriteria).length;
      const softCount = Object.entries(softCriteria)
        .filter(([key, value]) => value !== null && value !== undefined).length;
      
      return hardCount + softCount;
    } catch (error) {
      console.error('Error in getCriteriaCount:', error);
      return 0;
    }
  };
  
  const selectedPropertyData = selectedProperty === 'all'
    ? null
    : properties.find(p => p.id === selectedProperty);
  
  return (
    <Box sx={{ p: 3 }}>
      {/* Header Section */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Property</InputLabel>
                <Select
                  value={selectedProperty}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Keep consistent type for property selection
                    const propertyId = value === 'all' ? 'all' : parseInt(value);
                    setSelectedProperty(propertyId);
                    // Viewings will be fetched automatically by useEffect
                  }}
                  startAdornment={<HomeIcon sx={{ mr: 1, color: 'text.secondary' }} />}
                >
                  <MenuItem value="all">
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body1" fontWeight="bold">All Properties</Typography>
                        <Typography variant="caption" color="text.secondary">
                          View all applications across properties
                        </Typography>
                      </Box>
                      <Badge
                        badgeContent={properties.reduce((sum, p) => sum + (p.applications_count || 0), 0)}
                        color="primary"
                      />
                    </Box>
                  </MenuItem>
                  <Divider />
                  {properties.map(property => (
                    <MenuItem key={property.id} value={property.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body1">{property.title}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {property.street}, {property.city}
                          </Typography>
                        </Box>
                        <Badge badgeContent={property.applications_count || 0} color="primary" />
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              {selectedProperty === 'all' ? (
                <Stack direction="row" spacing={2} alignItems="center">
                  <Chip
                    icon={<HomeIcon />}
                    label={`${properties.length} Properties`}
                    color="primary"
                    variant="filled"
                  />
                  <Chip
                    icon={<CheckCircleIcon />}
                    label={`${processedApplications.length} Total Applications`}
                    color="info"
                    variant="outlined"
                  />
                </Stack>
              ) : selectedPropertyData && (
                <Stack direction="row" spacing={2} alignItems="center">
                  <Chip
                    icon={<CheckCircleIcon />}
                    label={`Active Criteria: ${getCriteriaCount()}`}
                    color="primary"
                    variant="outlined"
                  />
                  <Chip
                    icon={<EmailIcon />}
                    label={`listing-${selectedPropertyData.id}@listings.homeai.ch`}
                    variant="outlined"
                  />
                  <Chip
                    label="AI Active"
                    color="success"
                    variant="outlined"
                  />
                </Stack>
              )}
            </Stack>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                disabled={refreshing}
              >
                Refresh
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleExport}
              >
                Export
              </Button>
            </Box>
          </Grid>
        </Grid>
        
      </Paper>

      {/* Enhanced Viewing Schedule with Edit */}
      {selectedProperty !== 'all' && selectedPropertyData && (
        <Paper
          elevation={0}
          sx={{
            mb: 3,
            p: 3,
            background: 'linear-gradient(135deg, rgba(66, 165, 245, 0.08) 0%, rgba(102, 126, 234, 0.08) 100%)',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight="600">
              Viewing Schedule for {selectedPropertyData.title || selectedPropertyData.street}
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/owner-account/listing?property=${selectedProperty}&mode=viewings`)}
              sx={{ textTransform: 'none' }}
            >
              Edit Viewing Times
            </Button>
          </Box>

          <Grid container spacing={3}>
            {/* Viewing Times */}
            <Grid item xs={12} md={4}>
              <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Scheduled Viewing Times
                </Typography>
                <Stack spacing={1}>
                  {viewingsLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : propertyViewings && propertyViewings.length > 0 ? (
                    propertyViewings.slice(0, 5).map((viewing, index) => {
                      // Handle different date field names
                      const dateValue = viewing.date || viewing.viewing_date || viewing.slot_date;
                      const viewingDate = new Date(dateValue);

                      // Check if date is valid
                      if (isNaN(viewingDate.getTime())) {
                        return null;
                      }

                      const dateStr = viewingDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

                      // Handle different time field names
                      const startTime = viewing.time || viewing.start_time || viewing.slot_time || '2:00 PM';
                      const endTime = viewing.end_time;
                      const timeStr = endTime && endTime !== startTime ? `${startTime} - ${endTime}` : startTime;

                      // Handle booking status fields - default to 0 if not present
                      const booked = viewing.booked_count || viewing.booked_slots || viewing.bookings?.length || 0;
                      const total = viewing.max_attendees || viewing.total_slots || viewing.capacity || 5;
                      const isFull = booked >= total;

                      return (
                        <Box key={viewing.id || index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {dateStr}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {timeStr}
                            </Typography>
                          </Box>
                          <Chip
                            label={`${booked}/${total} ${isFull ? 'full' : 'booked'}`}
                            size="small"
                            color={isFull ? "error" : booked > total/2 ? "primary" : "success"}
                            variant={isFull ? "filled" : "outlined"}
                          />
                        </Box>
                      );
                    }).filter(Boolean)  // Remove any null entries
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                      No viewing times scheduled yet
                    </Typography>
                  )}
                </Stack>
              </Box>
            </Grid>

            {/* Viewing Statistics */}
            <Grid item xs={12} md={4}>
              <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Viewing Statistics
                </Typography>
                {(() => {
                  const totalSlots = propertyViewings.reduce((sum, v) => sum + (v.max_attendees || v.total_slots || v.capacity || 5), 0);
                  const bookedSlots = propertyViewings.reduce((sum, v) => sum + (v.booked_count || v.booked_slots || v.bookings?.length || 0), 0);
                  const attendedSlots = propertyViewings.reduce((sum, v) => {
                    const booked = v.booked_count || v.booked_slots || v.bookings?.length || 0;
                    return sum + (v.attended_slots || v.attended_count || Math.floor(booked * 0.8));
                  }, 0);
                  const bookedPercent = totalSlots > 0 ? (bookedSlots / totalSlots) * 100 : 0;
                  const attendedPercent = bookedSlots > 0 ? (attendedSlots / bookedSlots) * 100 : 0;

                  return (
                    <Stack spacing={2}>
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2">Total Slots</Typography>
                          <Typography variant="body2" fontWeight={600}>{totalSlots > 0 ? totalSlots : '0'}</Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={100}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2">Booked</Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {totalSlots > 0 ? `${bookedSlots}/${totalSlots}` : '0/0'}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={bookedPercent}
                          color="primary"
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2">Attended</Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {bookedSlots > 0 ? `${attendedSlots}/${bookedSlots}` : '0/0'}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={attendedPercent}
                          color="success"
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                    </Stack>
                  );
                })()}
              </Box>
            </Grid>

            {/* Quick Actions */}
            <Grid item xs={12} md={4}>
              <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Quick Actions
                </Typography>
                <Stack spacing={1}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => navigate(`/owner-account/manage-properties?property=${selectedProperty}&action=add-viewing`)}
                    sx={{ textTransform: 'none', justifyContent: 'flex-start' }}
                  >
                    Add Viewing Slot
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<GroupIcon />}
                    onClick={() => navigate(`/owner-account/viewing-management?property=${selectedProperty}`)}
                    sx={{ textTransform: 'none', justifyContent: 'flex-start' }}
                  >
                    Manage Attendees
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<NotificationsIcon />}
                    onClick={() => {}}
                    sx={{ textTransform: 'none', justifyContent: 'flex-start' }}
                  >
                    Send Reminders
                  </Button>
                </Stack>
              </Box>
            </Grid>
          </Grid>

          {/* Upcoming Viewings List */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Upcoming Viewing Attendees
            </Typography>
            <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 1 }}>
              {processedApplications
                .filter(app => app.lead_status === 'viewing_scheduled' && app.property_id === selectedProperty)
                .slice(0, 5)
                .map((app, idx) => (
                  <Chip
                    key={app.id}
                    avatar={<Avatar>{(idx + 1).toString()}</Avatar>}
                    label={app.anonymized_id || `Applicant #${idx + 1}`}
                    variant="outlined"
                    onClick={() => handleViewDetails(app)}
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
              {processedApplications.filter(app => app.lead_status === 'viewing_scheduled' && app.property_id === selectedProperty).length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No viewings scheduled yet
                </Typography>
              )}
            </Stack>
          </Box>
        </Paper>
      )}

      {/* Enhanced Application Pipeline */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          p: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 2
        }}
      >
        <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
          Application Pipeline
        </Typography>
        <Box sx={{ position: 'relative' }}>
          {/* Pipeline Flow */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: '50%',
                left: '5%',
                right: '5%',
                height: 2,
                bgcolor: 'rgba(255,255,255,0.3)',
                transform: 'translateY(-50%)',
                zIndex: 0
              }
            }}
          >
            {[
              { label: 'Viewing Requested', value: stats.pending, icon: EmailIcon, color: '#4fc3f7' },
              { label: 'Viewing Scheduled', value: stats.scheduled, icon: ViewingIcon, color: '#29b6f6' },
              { label: 'Viewing Attended', value: stats.attended, icon: CheckCircleIcon, color: '#42a5f5' },
              { label: 'Dossier Requested', value: stats.documentsRequested, icon: DocumentsIcon, color: '#5c6bc0' },
              { label: 'Dossier Submitted', value: stats.documentsSubmitted, icon: DocumentsIcon, color: '#7e57c2' },
              { label: 'Qualified', value: stats.qualified, icon: CheckCircleIcon, color: '#66bb6a' },
              { label: 'Selected', value: stats.selected, icon: SelectIcon, color: '#4caf50' }
            ].map((stage, index, array) => {
              // Calculate percentage conversion from previous stage
              let percentage = null;
              if (index > 0 && array[index - 1].value > 0) {
                percentage = Math.round((stage.value / array[index - 1].value) * 100);
              } else if (index === 0 && stats.total > 0) {
                // For first stage, show percentage of total applications
                percentage = Math.round((stage.value / stats.total) * 100);
              }
              const Icon = stage.icon;
              return (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    position: 'relative',
                    zIndex: 1,
                    flex: 1
                  }}
                >
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      bgcolor: 'white',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                      mb: 1
                    }}
                  >
                    <Icon sx={{ color: stage.color, fontSize: 24, mb: 0.5 }} />
                    <Typography variant="h6" fontWeight="bold">
                      {stage.value}
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: 'white', fontWeight: 500 }}>
                    {stage.label}
                  </Typography>
                  {index < array.length - 1 && percentage !== null && (
                    <Typography
                      variant="caption"
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        right: '-25%',
                        transform: 'translateY(-50%)',
                        bgcolor: 'rgba(255,255,255,0.9)',
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        fontWeight: 'bold',
                        color: percentage >= 50 ? 'success.main' : percentage >= 25 ? 'warning.main' : 'error.main'
                      }}
                    >
                      {percentage}%
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Box>

          {/* Rejected Count */}
          {stats.rejected > 0 && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Chip
                icon={<XIcon />}
                label={`${stats.rejected} Rejected`}
                color="error"
                sx={{ bgcolor: 'white' }}
              />
            </Box>
          )}
        </Box>
      </Paper>
      
      {/* Filters and Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              placeholder="Search applications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          
          <Grid item xs={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="viewing_requested">New</MenuItem>
                <MenuItem value="viewing_scheduled">Scheduled</MenuItem>
                <MenuItem value="viewing_attended">Viewed</MenuItem>
                <MenuItem value="dossier_submitted">Docs Complete</MenuItem>
                <MenuItem value="qualified">Qualified</MenuItem>
                <MenuItem value="selected">Selected</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy ||
                  (propertyCriteria?.sorting_preferences ?
                    `${propertyCriteria.sorting_preferences.primary_sort}_${propertyCriteria.sorting_preferences.direction}` :
                    'match_desc')}
                onChange={async (e) => {
                  setSortBy(e.target.value);
                  // Save sorting preference
                  if (selectedProperty && propertyCriteria) {
                    const [field, direction] = e.target.value.split('_');
                    try {
                      await tenantSelectionAPI.updateSortingPreferences(selectedProperty, {
                        ...propertyCriteria.sorting_preferences,
                        primary_sort: field,
                        direction: direction
                      });
                    } catch (error) {
                      console.error('Failed to save sorting preference:', error);
                    }
                  }
                }}
                label="Sort By"
              >
                <MenuItem value="match_desc">Best Match First</MenuItem>
                <MenuItem value="match_asc">Lowest Match First</MenuItem>
                <MenuItem value="score_desc">Score: High to Low</MenuItem>
                <MenuItem value="score_asc">Score: Low to High</MenuItem>
                <MenuItem value="soft_score_desc">Soft Score: High to Low</MenuItem>
                <MenuItem value="soft_score_asc">Soft Score: Low to High</MenuItem>
                <MenuItem value="date_desc">Newest First</MenuItem>
                <MenuItem value="date_asc">Oldest First</MenuItem>
                <MenuItem value="created_at_desc">Created: Newest First</MenuItem>
                <MenuItem value="created_at_asc">Created: Oldest First</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, newMode) => newMode && setViewMode(newMode)}
              fullWidth
            >
              <ToggleButton value="cards">
                <GridViewIcon />
              </ToggleButton>
              <ToggleButton value="table">
                <TableIcon />
              </ToggleButton>
            </ToggleButtonGroup>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Quick Insights Panel - Removed per user request */}
      
      {/* Applications Display */}
      {loading && !loadingTimeout ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
          <CircularProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Loading applications...
          </Typography>
        </Box>
      ) : loadingTimeout ? (
        <Alert 
          severity="warning" 
          action={
            <Stack direction="row" spacing={1}>
              <Button color="inherit" size="small" onClick={handleRefresh}>
                Retry
              </Button>
              <Button 
                color="inherit" 
                size="small" 
                onClick={() => window.open(`/api/tenant-selection/leads/performance-test/${selectedProperty}`, '_blank')}
              >
                Debug
              </Button>
            </Stack>
          }
        >
          <AlertTitle>Request Timeout</AlertTitle>
          The server is taking too long to respond (over 10 seconds). This could be due to:
          <ul style={{ marginTop: 8, marginBottom: 0 }}>
            <li>Database performance issues</li>
            <li>High server load</li>
            <li>Network connectivity problems</li>
          </ul>
          Please try again or contact support if the issue persists.
        </Alert>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : processedApplications.length === 0 ? (
        <Paper sx={{ p: 8, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>No Applications Found</Typography>
          <Typography variant="body2" color="text.secondary">
            {searchQuery || filterStatus !== 'all' 
              ? 'Try adjusting your filters'
              : 'Applications will appear here when tenants apply to your property'}
          </Typography>
        </Paper>
      ) : viewMode === 'table' ? (
        <ApplicationsTableView
          applications={processedApplications}
          onViewDetails={handleViewDetails}
          onMakeDecision={handleMakeDecision}
          onViewDocuments={handleViewDocuments}
          onViewMessages={handleViewMessages}
        />
      ) : (
        <>
          <Grid container spacing={3} ref={scrollContainerRef}>
            {processedApplications.slice(0, visibleCards).map((application, index) => (
              <Grid item xs={12} sm={6} md={4} key={application.id}>
              <EnhancedApplicationCard
                application={application}
                index={index + 1}
                criteria={propertyCriteria}
                propertyId={selectedProperty}
                propertyData={selectedPropertyData}
                onViewDetails={() => handleViewDetails(application)}
                onMakeDecision={() => handleMakeDecision(application)}
                onViewDocuments={() => handleViewDocuments(application)}
                onViewMessages={() => handleViewMessages(application.id)}
                showMessageLink={true}
              />
            </Grid>
          ))}
        </Grid>
        </>
      )}

      {/* Modals */}
      {selectedApplication && (
        <>
          <ApplicationDetailModal
            open={showDetailModal}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedApplication(null);
            }}
            leadId={selectedApplication.id}
            onMakeDecision={() => {
              setShowDetailModal(false);
              setShowDecisionModal(true);
            }}
          />
          
          <DecisionFlowModal
            open={showDecisionModal}
            onClose={() => {
              setShowDecisionModal(false);
              setSelectedApplication(null);
            }}
            application={selectedApplication}
            propertyId={selectedProperty}
            propertyData={selectedPropertyData}
            onComplete={() => {
              setShowDecisionModal(false);
              setSelectedApplication(null);
              handleRefresh();
            }}
          />
        </>
      )}

      {/* Documents Modal */}
      {documentsModalApplication && (
        <DocumentsModal
          open={showDocumentsModal}
          onClose={() => {
            setShowDocumentsModal(false);
            setDocumentsModalApplication(null);
          }}
          application={documentsModalApplication}
          propertyId={selectedProperty}
        />
      )}
    </Box>
  );
};

export default TenantApplicationsEnhanced;