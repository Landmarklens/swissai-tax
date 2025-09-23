import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  IconButton,
  Chip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  Alert,
  Badge,
  Tooltip,
  Slider,
  Paper
} from '@mui/material';
import {
  GridView as GridViewIcon,
  TableRows as TableIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  CheckCircle as AcceptIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  Schedule as ScheduleIcon,
  Email as EmailIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { getApiUrl } from '../../../../utils/api/getApiUrl';
import { getSafeUser } from '../../../../utils/localStorage/safeJSONParse';
import {
  fetchLeads,
  setFilters,
  setView,
  selectFilteredLeads,
  selectTenantSelectionStats,
  selectTenantSelectionUI,
  selectTenantSelectionLoading,
  selectTenantSelectionErrors,
  toggleBulkSelection,
  clearBulkSelection,
  handleRealtimeUpdate
} from '../../../../store/slices/tenantSelectionSlice';
import { TenantSelectionRealtime } from '../../../../api/tenantSelectionApi';
import ApplicationCard from './ApplicationCard';
import AnonymizedApplicationCard from './AnonymizedApplicationCard';
import ApplicationsTable from './ApplicationsTable';
import ApplicationDetailModal from './ApplicationDetailModal';
import BulkActionsBar from './BulkActionsBar';
import FilterPanel from './FilterPanel';
import StatsCards from './StatsCards';

const ApplicationsDashboard = ({ propertyId }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  
  // Redux state
  const leads = useSelector(selectFilteredLeads);
  const stats = useSelector(selectTenantSelectionStats);
  const ui = useSelector(selectTenantSelectionUI);
  const loading = useSelector(selectTenantSelectionLoading);
  const errors = useSelector(selectTenantSelectionErrors);
  
  // Local state
  const [selectedLead, setSelectedLead] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Load leads on mount and property change
  useEffect(() => {
    if (propertyId) {
      dispatch(setFilters({ propertyId }));
      dispatch(fetchLeads({ propertyId }));
    }
  }, [dispatch, propertyId]);
  
  // Set up real-time updates (disabled until backend implements SSE)
  useEffect(() => {
    // SSE/Real-time updates are currently not implemented in the backend
    // This effect is disabled to prevent connection errors
    // When backend implements the endpoints, uncomment the code below:
    
    /*
    if (!propertyId) return;
    
    const realtime = new TenantSelectionRealtime(
      (data) => {
        // Handle real-time updates
        console.log('Real-time update received:', data);
        dispatch(handleRealtimeUpdate(data));
      },
      (error) => {
        console.error('Real-time connection error:', error);
      }
    );
    
    // Connect to real-time updates for this property
    realtime.connect(propertyId);
    
    // Cleanup on unmount
    return () => {
      realtime.disconnect();
    };
    */
  }, [dispatch, propertyId]);
  
  // Filter leads by search query
  const filteredLeads = leads.filter(lead => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      lead.name?.toLowerCase().includes(query) ||
      lead.email?.toLowerCase().includes(query) ||
      lead.phone?.includes(query)
    );
  });
  
  const handleViewChange = (event, newView) => {
    if (newView !== null) {
      dispatch(setView(newView));
    }
  };
  
  const handleLeadClick = (lead) => {
    setSelectedLead(lead);
    setDetailModalOpen(true);
  };
  
  const handleAcceptLead = async (lead) => {
    try {
      // Call API to accept/select the tenant
      const response = await fetch(
        `${getApiUrl()}/api/tenant-selection/leads/${lead.id}/accept`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getSafeUser()?.access_token}`
          }
        }
      );
      if (response.ok) {
        dispatch(fetchLeads({ propertyId }));
      }
    } catch (error) {
      console.error('Error accepting lead:', error);
    }
  };
  
  const handleRejectLead = async (lead) => {
    try {
      // Call API to reject the applicant
      const response = await fetch(
        `${getApiUrl()}/api/tenant-selection/leads/${lead.id}/reject`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getSafeUser()?.access_token}`
          }
        }
      );
      if (response.ok) {
        dispatch(fetchLeads({ propertyId }));
      }
    } catch (error) {
      console.error('Error rejecting lead:', error);
    }
  };
  
  const handleRefresh = () => {
    dispatch(fetchLeads({ propertyId }));
  };
  
  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export leads');
  };
  
  const getStatusColor = (status) => {
    const statusColors = {
      'viewing_requested': 'info',
      'viewing_scheduled': 'primary',
      'viewing_attended': 'secondary',
      'dossier_requested': 'warning',
      'dossier_submitted': 'default',
      'qualified': 'success',
      'selected': 'success',
      'rejected': 'error'
    };
    return statusColors[status] || 'default';
  };
  
  const getPortalIcon = (portal) => {
    const icons = {
      'homegate': '🏠',
      'flatfox': '🦊',
      'immoscout24': '🔍',
      'direct': '✉️',
      'forwarded': '↗️'
    };
    return icons[portal] || '📧';
  };
  
  // Handle case when no property is selected
  if (!propertyId) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          {t('No Property Selected')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('Please select a property to view tenant applications')}
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          {t('Tenant Applications')}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading.leads}
          >
            {t('Refresh')}
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
          >
            {t('Export')}
          </Button>
        </Box>
      </Box>
      
      {/* Stats Cards */}
      <StatsCards stats={stats} />
      
      {/* Search and Filters Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder={t('Search by name, email, or phone...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          
          <Grid item xs={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>{t('Status')}</InputLabel>
              <Select
                value={ui.filters.status}
                label={t('Status')}
                onChange={(e) => dispatch(setFilters({ status: e.target.value }))}
              >
                <MenuItem value="all">{t('All Status')}</MenuItem>
                <MenuItem value="viewing_requested">{t('Viewing Requested')}</MenuItem>
                <MenuItem value="viewing_scheduled">{t('Viewing Scheduled')}</MenuItem>
                <MenuItem value="qualified">{t('Qualified')}</MenuItem>
                <MenuItem value="rejected">{t('Rejected')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>{t('Source')}</InputLabel>
              <Select
                value={ui.filters.sourcePortal}
                label={t('Source')}
                onChange={(e) => dispatch(setFilters({ sourcePortal: e.target.value }))}
              >
                <MenuItem value="all">{t('All Sources')}</MenuItem>
                <MenuItem value="homegate">Homegate</MenuItem>
                <MenuItem value="flatfox">Flatfox</MenuItem>
                <MenuItem value="immoscout24">ImmoScout24</MenuItem>
                <MenuItem value="direct">{t('Direct')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={6} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => setFilterPanelOpen(!filterPanelOpen)}
              sx={{ height: '56px' }}
            >
              {t('More Filters')}
            </Button>
          </Grid>
          
          <Grid item xs={6} md={2}>
            <ToggleButtonGroup
              value={ui.view}
              exclusive
              onChange={handleViewChange}
              aria-label="view mode"
              fullWidth
            >
              <ToggleButton value="grid" aria-label="grid view">
                <GridViewIcon />
              </ToggleButton>
              <ToggleButton value="table" aria-label="table view">
                <TableIcon />
              </ToggleButton>
            </ToggleButtonGroup>
          </Grid>
        </Grid>
        
        {/* Advanced Filter Panel */}
        {filterPanelOpen && (
          <FilterPanel
            filters={ui.filters}
            onFilterChange={(newFilters) => dispatch(setFilters(newFilters))}
            onClose={() => setFilterPanelOpen(false)}
          />
        )}
      </Paper>
      
      {/* Bulk Actions Bar */}
      {ui.bulkSelection.length > 0 && (
        <BulkActionsBar
          selectedCount={ui.bulkSelection.length}
          onClear={() => dispatch(clearBulkSelection())}
        />
      )}
      
      {/* Error Alert */}
      {errors.leads && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errors.leads}
        </Alert>
      )}
      
      {/* Loading State */}
      {loading.leads && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}
      
      {/* Applications Grid/Table */}
      {!loading.leads && (
        <>
          {ui.view === 'grid' ? (
            <Grid container spacing={3}>
              {filteredLeads.map((lead, index) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={lead.id}>
                  <AnonymizedApplicationCard
                    lead={lead}
                    index={index}
                    onView={() => handleLeadClick(lead)}
                    onSelect={() => dispatch(toggleBulkSelection(lead.id))}
                    selected={ui.bulkSelection.includes(lead.id)}
                    onAccept={() => handleAcceptLead(lead)}
                    onReject={() => handleRejectLead(lead)}
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <ApplicationsTable
              leads={filteredLeads}
              onLeadClick={handleLeadClick}
              selectedLeads={ui.bulkSelection}
              onSelectLead={(leadId) => dispatch(toggleBulkSelection(leadId))}
            />
          )}
          
          {/* Empty State */}
          {filteredLeads.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {t('No applications found')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchQuery || ui.filters.status !== 'all' 
                  ? t('Try adjusting your filters')
                  : t('Applications will appear here when tenants apply')}
              </Typography>
            </Box>
          )}
        </>
      )}
      
      {/* Application Detail Modal */}
      {selectedLead && (
        <ApplicationDetailModal
          open={detailModalOpen}
          onClose={() => {
            setDetailModalOpen(false);
            setSelectedLead(null);
          }}
          leadId={selectedLead.id}
        />
      )}
    </Box>
  );
};

export default ApplicationsDashboard;