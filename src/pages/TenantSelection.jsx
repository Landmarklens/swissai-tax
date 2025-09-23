import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Grid,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Tabs,
  Tab,
  Paper,
  Chip,
  IconButton,
  Badge,
  Alert,
  Snackbar,
  CircularProgress,
  Fab,
  Tooltip,
  Dialog
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Schedule as ScheduleIcon,
  Email as EmailIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';

// Import components
import ApplicationsDashboard from '../components/sections/OwnerAccount/TenantSelection/ApplicationsDashboard';
import ApplicationCard from '../components/sections/OwnerAccount/TenantSelection/ApplicationCard';
import ApplicationsTable from '../components/sections/OwnerAccount/TenantSelection/ApplicationsTable';
import FilterPanel from '../components/sections/OwnerAccount/TenantSelection/FilterPanel';
import ApplicationDetailModal from '../components/sections/OwnerAccount/TenantSelection/ApplicationDetailModal';
import DecisionModal from '../components/sections/OwnerAccount/TenantSelection/DecisionModal';
import ViewingScheduler from '../components/sections/OwnerAccount/TenantSelection/ViewingScheduler';
import EmailComposer from '../components/sections/OwnerAccount/TenantSelection/EmailComposer';
import TenantSelectionSetup from '../components/sections/OwnerAccount/TenantSelection/TenantSelectionSetup';

// Import Redux actions
import {
  fetchLeads,
  updateLead,
  makeDecision,
  bulkReject,
  selectLeads,
  clearSelection,
  setFilters,
  exportApplications
} from '../store/slices/tenantSelectionSlice';

// Import API
import { tenantSelectionAPI, TenantSelectionRealtime } from '../api/tenantSelectionApi';

// Analytics Dashboard placeholder (to be implemented)
const AnalyticsDashboard = ({ propertyId }) => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h6">Analytics Dashboard - Coming Soon</Typography>
  </Box>
);

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tenant-selection-tabpanel-${index}`}
      aria-labelledby={`tenant-selection-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const TenantSelection = () => {
  const dispatch = useDispatch();
  const [tabValue, setTabValue] = useState(0);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'
  const [showFilters, setShowFilters] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [realtime, setRealtime] = useState(null);
  const [propertyId, setPropertyId] = useState(null);

  // Redux state
  const {
    leads,
    loading,
    error,
    filters,
    selectedLeads,
    totalCount,
    statistics
  } = useSelector((state) => state.tenantSelection);
  
  const { user } = useSelector((state) => state.auth);
  const { properties } = useSelector((state) => state.properties);

  // Initialize real-time connection
  useEffect(() => {
    if (propertyId && !realtime) {
      const rt = new TenantSelectionRealtime(
        (message) => handleRealtimeMessage(message),
        (error) => console.error('Realtime error:', error)
      );
      rt.connect(propertyId);
      setRealtime(rt);
      
      return () => {
        rt.disconnect();
      };
    }
  }, [propertyId]);

  // Load initial data
  useEffect(() => {
    if (propertyId) {
      loadApplications();
      checkConfiguration();
    }
  }, [propertyId, filters]);

  // Set first property as default
  useEffect(() => {
    if (properties && properties.length > 0 && !propertyId) {
      setPropertyId(properties[0].id);
    }
  }, [properties]);

  const loadApplications = async () => {
    dispatch(fetchLeads({ propertyId, ...filters }));
  };

  const checkConfiguration = async () => {
    try {
      const response = await tenantSelectionAPI.getConfig(propertyId);
      if (!response.data) {
        setShowSetup(true);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setShowSetup(true);
      }
    }
  };

  const handleRealtimeMessage = (message) => {
    switch (message.type) {
      case 'lead_received':
        showSnackbar('New application received!', 'info');
        loadApplications();
        break;
      case 'decision_made':
        showSnackbar('Decision updated', 'success');
        loadApplications();
        break;
      default:
        break;
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleViewApplication = (application) => {
    setSelectedApplication(application);
    setShowDetailModal(true);
  };

  const handleMakeDecision = (application) => {
    setSelectedApplication(application);
    setShowDecisionModal(true);
  };

  const handleScheduleViewing = (application) => {
    setSelectedApplication(application);
    setShowScheduler(true);
  };

  const handleSendEmail = (application) => {
    setSelectedApplication(application);
    setShowEmailComposer(true);
  };

  const handleBulkReject = () => {
    if (selectedLeads.length === 0) {
      showSnackbar('Please select applications to reject', 'warning');
      return;
    }
    
    dispatch(bulkReject({ propertyId, leadIds: selectedLeads }))
      .then(() => {
        showSnackbar(`${selectedLeads.length} applications rejected`, 'success');
        dispatch(clearSelection());
        loadApplications();
      })
      .catch(() => {
        showSnackbar('Failed to reject applications', 'error');
      });
  };

  const handleExport = async (format = 'csv') => {
    try {
      await dispatch(exportApplications({ propertyId, format }));
      showSnackbar('Export started, check your email', 'success');
    } catch (error) {
      showSnackbar('Export failed', 'error');
    }
  };

  const handleRefresh = () => {
    loadApplications();
    showSnackbar('Applications refreshed', 'info');
  };

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const getStatistics = () => {
    return {
      total: leads.length,
      pending: leads.filter(l => l.lead_status === 'viewing_requested').length,
      scheduled: leads.filter(l => l.lead_status === 'viewing_scheduled').length,
      attended: leads.filter(l => l.lead_status === 'viewing_attended').length,
      selected: leads.filter(l => l.lead_status === 'selected').length,
      rejected: leads.filter(l => l.lead_status === 'rejected').length
    };
  };

  const stats = getStatistics();

  if (!propertyId && properties?.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="info">
          <Typography variant="h6">No Properties Found</Typography>
          <Typography variant="body2">
            Please create a property first to use the tenant selection feature.
          </Typography>
          <Button 
            variant="contained" 
            sx={{ mt: 2 }}
            onClick={() => window.location.href = '/owner/properties/add'}
          >
            Create Property
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="h4" gutterBottom>
              Tenant Selection
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage applications for your properties
            </Typography>
          </Grid>
          <Grid item xs={12} md={6} sx={{ textAlign: 'right' }}>
            <Button
              variant="outlined"
              startIcon={<SettingsIcon />}
              onClick={() => setShowSetup(true)}
              sx={{ mr: 1 }}
            >
              Setup
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => handleExport('csv')}
              sx={{ mr: 1 }}
            >
              Export
            </Button>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
            >
              Refresh
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total
              </Typography>
              <Typography variant="h4">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pending
              </Typography>
              <Typography variant="h4" color="warning.main">
                {stats.pending}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Scheduled
              </Typography>
              <Typography variant="h4" color="info.main">
                {stats.scheduled}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Attended
              </Typography>
              <Typography variant="h4" color="primary.main">
                {stats.attended}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Selected
              </Typography>
              <Typography variant="h4" color="success.main">
                {stats.selected}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Rejected
              </Typography>
              <Typography variant="h4" color="error.main">
                {stats.rejected}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth">
          <Tab icon={<DashboardIcon />} label="Dashboard" />
          <Tab icon={<PeopleIcon />} label="Applications" />
          <Tab icon={<ScheduleIcon />} label="Viewings" />
          <Tab icon={<EmailIcon />} label="Communications" />
          <Tab icon={<AnalyticsIcon />} label="Analytics" />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        <ApplicationsDashboard
          propertyId={propertyId}
          applications={leads}
          onViewApplication={handleViewApplication}
          onMakeDecision={handleMakeDecision}
          onScheduleViewing={handleScheduleViewing}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {/* Applications List */}
        <Box sx={{ mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs>
              <Button
                startIcon={<FilterIcon />}
                onClick={() => setShowFilters(!showFilters)}
              >
                Filters {Object.keys(filters).length > 0 && `(${Object.keys(filters).length})`}
              </Button>
            </Grid>
            <Grid item>
              <Button
                variant={viewMode === 'cards' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('cards')}
                sx={{ mr: 1 }}
              >
                Cards
              </Button>
              <Button
                variant={viewMode === 'table' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('table')}
              >
                Table
              </Button>
            </Grid>
          </Grid>
        </Box>

        {showFilters && (
          <FilterPanel
            filters={filters}
            onFilterChange={(newFilters) => dispatch(setFilters(newFilters))}
            onClose={() => setShowFilters(false)}
          />
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : leads.length === 0 ? (
          <Alert severity="info">
            No applications found. Share your managed email with property portals to receive applications.
          </Alert>
        ) : viewMode === 'cards' ? (
          <Grid container spacing={3}>
            {leads.map((application) => (
              <Grid item xs={12} md={6} lg={4} key={application.id}>
                <ApplicationCard
                  application={application}
                  onViewDetails={handleViewApplication}
                  onMakeDecision={handleMakeDecision}
                  onScheduleViewing={handleScheduleViewing}
                  onSendMessage={handleSendEmail}
                  onSelect={(id) => dispatch(selectLeads([id]))}
                  isSelected={selectedLeads.includes(application.id)}
                />
              </Grid>
            ))}
          </Grid>
        ) : (
          <ApplicationsTable
            applications={leads}
            onViewDetails={handleViewApplication}
            onMakeDecision={handleMakeDecision}
            onScheduleViewing={handleScheduleViewing}
            onSendMessage={handleSendEmail}
            onSelectAll={(ids) => dispatch(selectLeads(ids))}
            selectedIds={selectedLeads}
          />
        )}

        {selectedLeads.length > 0 && (
          <Paper
            sx={{
              position: 'fixed',
              bottom: 20,
              right: 20,
              p: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}
            elevation={4}
          >
            <Typography variant="body2">
              {selectedLeads.length} selected
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={() => dispatch(clearSelection())}
            >
              Clear
            </Button>
            <Button
              variant="contained"
              color="error"
              size="small"
              startIcon={<CancelIcon />}
              onClick={handleBulkReject}
            >
              Reject Selected
            </Button>
          </Paper>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <ViewingScheduler
          propertyId={propertyId}
          applications={leads.filter(l => l.lead_status === 'viewing_scheduled')}
          onScheduleUpdate={loadApplications}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <EmailComposer
          propertyId={propertyId}
          applications={leads}
          onEmailSent={(leadId) => {
            showSnackbar('Email sent successfully', 'success');
            loadApplications();
          }}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
        <AnalyticsDashboard
          propertyId={propertyId}
          applications={leads}
          statistics={statistics}
        />
      </TabPanel>

      {/* Modals */}
      {showDetailModal && selectedApplication && (
        <ApplicationDetailModal
          open={showDetailModal}
          application={selectedApplication}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedApplication(null);
          }}
          onMakeDecision={handleMakeDecision}
          onScheduleViewing={handleScheduleViewing}
          onSendEmail={handleSendEmail}
        />
      )}

      {showDecisionModal && selectedApplication && (
        <DecisionModal
          open={showDecisionModal}
          application={selectedApplication}
          onClose={() => {
            setShowDecisionModal(false);
            setSelectedApplication(null);
          }}
          onDecisionMade={(decision) => {
            dispatch(makeDecision({
              leadId: selectedApplication.id,
              decision
            })).then(() => {
              showSnackbar('Decision recorded', 'success');
              loadApplications();
              setShowDecisionModal(false);
              setSelectedApplication(null);
            });
          }}
        />
      )}

      {showSetup && (
        <Dialog
          open={showSetup}
          onClose={() => setShowSetup(false)}
          maxWidth="md"
          fullWidth
        >
          <TenantSelectionSetup
            propertyId={propertyId}
            onClose={() => setShowSetup(false)}
            onSetupComplete={() => {
              showSnackbar('Configuration saved', 'success');
              setShowSetup(false);
              loadApplications();
            }}
          />
        </Dialog>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Floating Action Button for Quick Actions */}
      <Tooltip title="Schedule Viewing">
        <Fab
          color="primary"
          aria-label="schedule"
          sx={{ position: 'fixed', bottom: 80, right: 20 }}
          onClick={() => setShowScheduler(true)}
        >
          <ScheduleIcon />
        </Fab>
      </Tooltip>
    </Container>
  );
};

export default TenantSelection;