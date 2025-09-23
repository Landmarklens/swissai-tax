import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Container,
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
  Badge,
  IconButton,
  Tooltip,
  Collapse,
  Paper,
  LinearProgress,
  Divider,
  TextField,
  InputAdornment,
  Stack
} from '@mui/material';
import {
  GridView as GridViewIcon,
  TableRows as TableIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Visibility as VisibilityIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Assignment as DocumentIcon,
  CalendarToday as CalendarIcon,
  Search as SearchIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { fetchProperties } from '../store/slices/propertiesSlice';
import { fetchLeads, setFilters, setView } from '../store/slices/tenantSelectionSlice';
import { tenantSelectionAPI } from '../api/tenantSelectionApi';
import EnhancedApplicationCard from '../components/sections/OwnerAccount/TenantSelection/EnhancedApplicationCard';
import ApplicationDetailModal from '../components/sections/OwnerAccount/TenantSelection/ApplicationDetailModal';
import DecisionFlowModal from '../components/sections/OwnerAccount/TenantSelection/DecisionFlowModal';
import ApplicationsTableView from '../components/sections/OwnerAccount/TenantSelection/ApplicationsTableView';
import ComparisonView from '../components/sections/OwnerAccount/TenantSelection/ComparisonView';
import DocumentsModal from '../components/sections/OwnerAccount/TenantSelection/DocumentsModal';

const TenantApplications = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Redux state
  const properties = useSelector(state => state.properties?.properties?.data) || [];
  const { leads, loading, error, filters } = useSelector(state => state.tenantSelection);
  const user = useSelector(state => state.auth.user);
  
  // Local state
  const [selectedProperty, setSelectedProperty] = useState('');
  const [propertyCriteria, setPropertyCriteria] = useState(null);
  const [showCriteria, setShowCriteria] = useState(false);
  const [viewMode, setViewMode] = useState('cards'); // cards, table, compare
  const [sortBy, setSortBy] = useState('score_desc');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [compareList, setCompareList] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  
  // Load properties on mount
  useEffect(() => {
    dispatch(fetchProperties());
  }, [dispatch]);
  
  // Set default property
  useEffect(() => {
    if (properties.length > 0 && !selectedProperty) {
      setSelectedProperty(properties[0].id);
    }
  }, [properties, selectedProperty]);
  
  // Load property config and leads when property changes
  useEffect(() => {
    if (selectedProperty) {
      loadPropertyConfig(selectedProperty);
      loadApplications(selectedProperty);
    }
  }, [selectedProperty]);
  
  const loadPropertyConfig = async (propertyId) => {
    try {
      const response = await tenantSelectionAPI.getConfig(propertyId);
      setPropertyCriteria(response.data);
    } catch (error) {
      console.error('Failed to load property config:', error);
      setPropertyCriteria(null);
    }
  };
  
  const loadApplications = async (propertyId) => {
    dispatch(fetchLeads({ 
      propertyId,
      status: filterStatus !== 'all' ? filterStatus : undefined
    }));
  };
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadApplications(selectedProperty);
    setRefreshing(false);
  };
  
  const handleExport = async () => {
    try {
      const response = await tenantSelectionAPI.exportApplications(selectedProperty, 'csv');
      // Handle download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `applications_${selectedProperty}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };
  
  // Filter and sort applications
  const processedApplications = useMemo(() => {
    let filtered = [...(leads || [])];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(app => 
        app.anonymized_id?.toLowerCase().includes(query) ||
        app.email?.toLowerCase().includes(query) ||
        app.ai_extracted_data?.summary?.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(app => app.lead_status === filterStatus);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'score_desc':
          return (b.soft_score || 0) - (a.soft_score || 0);
        case 'score_asc':
          return (a.soft_score || 0) - (b.soft_score || 0);
        case 'date_desc':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'date_asc':
          return new Date(a.created_at) - new Date(b.created_at);
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [leads, searchQuery, filterStatus, sortBy]);
  
  // Calculate statistics
  const stats = useMemo(() => {
    const total = processedApplications.length;
    const pending = processedApplications.filter(a => a.lead_status === 'viewing_requested').length;
    const scheduled = processedApplications.filter(a => a.lead_status === 'viewing_scheduled').length;
    const attended = processedApplications.filter(a => a.lead_status === 'viewing_attended').length;
    const documentsSubmitted = processedApplications.filter(a => a.lead_status === 'dossier_submitted').length;
    const qualified = processedApplications.filter(a => a.lead_status === 'qualified').length;
    const selected = processedApplications.filter(a => a.lead_status === 'selected').length;
    const rejected = processedApplications.filter(a => a.lead_status === 'rejected').length;
    
    return { total, pending, scheduled, attended, documentsSubmitted, qualified, selected, rejected };
  }, [processedApplications]);
  
  const handleViewDetails = (application) => {
    setSelectedApplication(application);
    setShowDetailModal(true);
  };
  
  const handleMakeDecision = (application) => {
    setSelectedApplication(application);
    setShowDecisionModal(true);
  };

  const handleViewDocuments = (application) => {
    setSelectedApplication(application);
    setShowDocumentsModal(true);
  };

  const handleCompareToggle = (application) => {
    if (compareList.find(a => a.id === application.id)) {
      setCompareList(compareList.filter(a => a.id !== application.id));
    } else if (compareList.length < 3) {
      setCompareList([...compareList, application]);
    }
  };
  
  const getCriteriaCount = () => {
    if (!propertyCriteria) return 0;
    const hardCount = Object.keys(propertyCriteria.hard_criteria || {}).length;
    const softCount = Object.keys(propertyCriteria.soft_criteria || {}).length;
    return hardCount + softCount;
  };
  
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header Section */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: 'background.default' }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Property</InputLabel>
              <Select
                value={selectedProperty}
                onChange={(e) => setSelectedProperty(e.target.value)}
                startAdornment={<HomeIcon sx={{ mr: 1, color: 'text.secondary' }} />}
              >
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
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={() => setShowCriteria(!showCriteria)}
                endIcon={showCriteria ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              >
                Criteria ({getCriteriaCount()})
              </Button>
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
        
        {/* Criteria Display */}
        <Collapse in={showCriteria}>
          <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>Active Criteria for Selection</Typography>
            <Grid container spacing={1} sx={{ mt: 1 }}>
              {propertyCriteria?.hard_criteria && Object.entries(propertyCriteria.hard_criteria).map(([key, value]) => (
                <Grid item key={key}>
                  <Chip
                    label={`${key}: ${value}`}
                    color="primary"
                    size="small"
                    icon={<CheckCircleIcon />}
                  />
                </Grid>
              ))}
              {propertyCriteria?.soft_criteria && Object.entries(propertyCriteria.soft_criteria).map(([key, value]) => (
                <Grid item key={key}>
                  <Chip
                    label={`${key}: ${value.weight || 'medium'}`}
                    color="default"
                    size="small"
                    variant="outlined"
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        </Collapse>
      </Paper>
      
      {/* Statistics Bar */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3} md={1.5}>
          <Card sx={{ textAlign: 'center' }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="h4">{stats.total}</Typography>
              <Typography variant="caption" color="text.secondary">Total</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3} md={1.5}>
          <Card sx={{ textAlign: 'center', borderLeft: '3px solid', borderColor: 'warning.main' }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="h4" color="warning.main">{stats.pending}</Typography>
              <Typography variant="caption" color="text.secondary">Pending</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3} md={1.5}>
          <Card sx={{ textAlign: 'center', borderLeft: '3px solid', borderColor: 'info.main' }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="h4" color="info.main">{stats.attended}</Typography>
              <Typography variant="caption" color="text.secondary">Viewed</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3} md={1.5}>
          <Card sx={{ textAlign: 'center', borderLeft: '3px solid', borderColor: 'primary.main' }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="h4" color="primary.main">{stats.documentsSubmitted}</Typography>
              <Typography variant="caption" color="text.secondary">Complete</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3} md={1.5}>
          <Card sx={{ textAlign: 'center', borderLeft: '3px solid', borderColor: 'success.main' }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="h4" color="success.main">{stats.qualified}</Typography>
              <Typography variant="caption" color="text.secondary">Qualified</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3} md={1.5}>
          <Card sx={{ textAlign: 'center', borderLeft: '3px solid', borderColor: 'success.dark' }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="h4" color="success.dark">{stats.selected}</Typography>
              <Typography variant="caption" color="text.secondary">Selected</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3} md={1.5}>
          <Card sx={{ textAlign: 'center', borderLeft: '3px solid', borderColor: 'error.main' }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="h4" color="error.main">{stats.rejected}</Typography>
              <Typography variant="caption" color="text.secondary">Rejected</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
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
                <MenuItem value="viewing_requested">Pending</MenuItem>
                <MenuItem value="viewing_scheduled">Scheduled</MenuItem>
                <MenuItem value="viewing_attended">Attended Viewing</MenuItem>
                <MenuItem value="dossier_submitted">Documents Complete</MenuItem>
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
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                label="Sort By"
              >
                <MenuItem value="score_desc">Score (High to Low)</MenuItem>
                <MenuItem value="score_asc">Score (Low to High)</MenuItem>
                <MenuItem value="date_desc">Newest First</MenuItem>
                <MenuItem value="date_asc">Oldest First</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={2}>
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
              <ToggleButton value="compare" disabled={compareList.length < 2}>
                Compare ({compareList.length})
              </ToggleButton>
            </ToggleButtonGroup>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Applications Display */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
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
      ) : viewMode === 'compare' ? (
        <ComparisonView
          applications={compareList}
          criteria={propertyCriteria}
          onRemove={(app) => handleCompareToggle(app)}
          onDecision={handleMakeDecision}
        />
      ) : viewMode === 'table' ? (
        <ApplicationsTableView
          applications={processedApplications}
          onViewDetails={handleViewDetails}
          onMakeDecision={handleMakeDecision}
          onCompareToggle={handleCompareToggle}
          compareList={compareList}
        />
      ) : (
        <Grid container spacing={3}>
          {processedApplications.map((application, index) => (
            <Grid item xs={12} sm={6} md={4} key={application.id}>
              <EnhancedApplicationCard
                application={application}
                index={index + 1}
                criteria={propertyCriteria}
                onViewDetails={() => handleViewDetails(application)}
                onMakeDecision={() => handleMakeDecision(application)}
                onViewDocuments={() => handleViewDocuments(application)}
                onCompareToggle={() => handleCompareToggle(application)}
                isComparing={compareList.find(a => a.id === application.id)}
              />
            </Grid>
          ))}
        </Grid>
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
            application={selectedApplication}
            criteria={propertyCriteria}
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
            onComplete={() => {
              setShowDecisionModal(false);
              setSelectedApplication(null);
              handleRefresh();
            }}
          />

          <DocumentsModal
            open={showDocumentsModal}
            onClose={() => {
              setShowDocumentsModal(false);
              setSelectedApplication(null);
            }}
            application={selectedApplication}
            propertyId={selectedProperty}
          />
        </>
      )}
    </Container>
  );
};

export default TenantApplications;