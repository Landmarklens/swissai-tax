import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Divider,
  IconButton,
  Paper,
  LinearProgress
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Icons
import HomeIcon from '@mui/icons-material/Home';
import PeopleIcon from '@mui/icons-material/People';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EmailIcon from '@mui/icons-material/Email';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AssignmentIcon from '@mui/icons-material/Assignment';
import NotificationsIcon from '@mui/icons-material/Notifications';

// Redux
import { fetchProperties, selectProperties } from '../../../../store/slices/propertiesSlice';
import { fetchLeads } from '../../../../store/slices/tenantSelectionSlice';
import { getViewings } from '../../../../store/slices/viewingSlice';

// Components
const StatCard = ({ title, value, icon, color = 'primary', subtitle, trend }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography color="text.secondary" gutterBottom variant="body2">
            {title}
          </Typography>
          <Typography variant="h4" component="div">
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {subtitle}
            </Typography>
          )}
          {trend && (
            <Chip
              label={trend}
              size="small"
              color={trend.includes('+') ? 'success' : 'default'}
              sx={{ mt: 1 }}
            />
          )}
        </Box>
        <Avatar sx={{ 
          bgcolor: color === 'primary' ? '#AEC2FF' : 
                   color === 'success' ? '#65BA7420' : 
                   color === 'warning' ? '#AA99EC20' : 
                   `${color}.light`,
          color: color === 'primary' ? '#3E63DD' : 
                 color === 'success' ? '#65BA74' : 
                 color === 'warning' ? '#AA99EC' : 
                 `${color}.main` 
        }}>
          {icon}
        </Avatar>
      </Box>
    </CardContent>
  </Card>
);

const QuickActionsWidget = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const actions = [
    {
      title: t('Add Property'),
      icon: <AddIcon />,
      onClick: () => navigate('/owner-account?section=listing&action=create'),
      color: 'primary'
    },
    {
      title: t('View Applications'),
      icon: <PeopleIcon />,
      onClick: () => navigate('/owner-account?section=tenant-applications'),
      color: 'info'
    },
    {
      title: t('Schedule Viewings'),
      icon: <CalendarTodayIcon />,
      onClick: () => navigate('/owner-account?section=tenant-applications&tab=viewings'),
      color: 'success'
    },
    {
      title: t('View Analytics'),
      icon: <TrendingUpIcon />,
      onClick: () => navigate('/owner-account?section=analytics'),
      color: 'warning'
    }
  ];

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {t('Quick Actions')}
        </Typography>
        <Grid container spacing={2}>
          {actions.map((action, index) => (
            <Grid item xs={6} key={index}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={action.icon}
                onClick={action.onClick}
                sx={{
                  py: 2,
                  flexDirection: 'column',
                  bgcolor: action.color === 'primary' ? '#E0E7FD' : 
                           action.color === 'success' ? '#65BA7420' : 
                           action.color === 'warning' ? '#AA99EC20' : 
                           '#F0F4FF',
                  borderColor: action.color === 'primary' ? '#AEC2FF' : 
                               action.color === 'success' ? '#65BA74' : 
                               action.color === 'warning' ? '#AA99EC' : 
                               '#8DA4EF',
                  '&:hover': {
                    bgcolor: action.color === 'primary' ? '#AEC2FF20' : 
                             action.color === 'success' ? '#65BA7430' : 
                             action.color === 'warning' ? '#AA99EC30' : 
                             '#8DA4EF20',
                    borderColor: action.color === 'primary' ? '#3E63DD' : 
                                 action.color === 'success' ? '#65BA74' : 
                                 action.color === 'warning' ? '#AA99EC' : 
                                 '#3E63DD'
                  },
                  '& .MuiButton-startIcon': {
                    margin: 0,
                    mb: 1,
                    color: action.color === 'primary' ? '#3E63DD' : 
                           action.color === 'success' ? '#65BA74' : 
                           action.color === 'warning' ? '#AA99EC' : 
                           '#8DA4EF'
                  }
                }}
              >
                <Typography variant="caption">
                  {action.title}
                </Typography>
              </Button>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

const PropertiesOverviewWidget = ({ properties }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // Helper function to get user-friendly status label
  const getStatusLabel = (status) => {
    const statusMap = {
      'ad_active': t('Active'),
      'selection_in_progress': t('Selecting Tenants'),
      'pending_viewing': t('Viewings Scheduled'),
      'non_active': t('Draft'),
      'rented': t('Rented')
    };
    return statusMap[status] || status || t('Draft');
  };
  
  // Helper function to get status color
  const getStatusColor = (status) => {
    switch(status) {
      case 'ad_active':
      case 'selection_in_progress':
        return 'success';
      case 'pending_viewing':
        return 'warning';
      case 'rented':
        return 'info';
      case 'non_active':
      default:
        return 'default';
    }
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">{t('Your Properties')}</Typography>
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={() => navigate('/owner-account?section=listing&action=create')}
          >
            {t('Add Property')}
          </Button>
        </Box>

        {properties && properties.length > 0 ? (
          <Grid container spacing={2}>
            {properties.slice(0, 3).map((property) => (
              <Grid item xs={12} md={4} key={property.id}>
                <Paper sx={{ p: 2, bgcolor: '#F0F4FF', border: '1px solid #E0E7FD' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <HomeIcon sx={{ mr: 1, color: '#3E63DD' }} />
                    <Typography variant="subtitle1" noWrap>
                      {property.title || `Property ${property.id}`}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {property.address}, {property.city}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                    <Chip
                      label={getStatusLabel(property.status)}
                      size="small"
                      color={getStatusColor(property.status)}
                    />
                    <Button
                      size="small"
                      onClick={() => navigate(`/owner-account?section=listing&property=${property.id}`)}
                    >
                      {t('Manage')}
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            ))}
            {properties.length > 3 && (
              <Grid item xs={12}>
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/owner-account?section=listing')}
                    endIcon={<ArrowForwardIcon />}
                  >
                    {t('See all')} {properties.length} {t('properties')}
                  </Button>
                </Box>
              </Grid>
            )}
          </Grid>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <HomeIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography color="text.secondary" gutterBottom>
              {t('No properties yet')}
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/owner-account?section=listing&action=create')}
              sx={{ mt: 2 }}
            >
              {t('Add Your First Property')}
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

const NotificationsWidget = ({ applications, viewings, properties }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // Helper functions for time formatting - defined before use
  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} ${days === 1 ? t('day') : t('days')} ${t('ago')}`;
    if (hours > 0) return `${hours} ${hours === 1 ? t('hour') : t('hours')} ${t('ago')}`;
    if (minutes > 0) return `${minutes} ${minutes === 1 ? t('minute') : t('minutes')} ${t('ago')}`;
    return t('Just now');
  };
  
  const getTimeUntil = (date) => {
    const hours = Math.floor((date - new Date()) / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 1) return `${t('in')} ${days} ${t('days')}`;
    if (days === 1) return t('tomorrow');
    if (hours > 0) return `${t('in')} ${hours} ${t('hours')}`;
    return t('soon');
  };
  
  // Generate real notifications from data
  const notifications = React.useMemo(() => {
    const notifs = [];
    
    // Recent applications
    if (applications && applications.length > 0) {
      const recentApps = applications
        .filter(app => {
          const appDate = new Date(app.created_at);
          const daysSince = (new Date() - appDate) / (1000 * 60 * 60 * 24);
          return daysSince <= 7; // Last 7 days
        })
        .slice(0, 2);
      
      recentApps.forEach(app => {
        const property = properties?.find(p => p.id === app.property_id);
        const propertyName = property?.title || `Property ${app.property_id}`;
        const timeAgo = getTimeAgo(new Date(app.created_at));
        
        notifs.push({
          type: 'info',
          message: `${t('New application from')} ${app.name || 'Unknown'} ${t('for')} ${propertyName}`,
          time: timeAgo,
          action: () => navigate('/owner-account/tenant-applications')
        });
      });
    }
    
    // Upcoming viewings
    if (viewings && viewings.length > 0) {
      const upcomingViewings = viewings
        .filter(v => {
          const viewingDate = new Date(v.scheduled_date);
          return v.status === 'scheduled' && viewingDate >= new Date();
        })
        .slice(0, 1);
      
      upcomingViewings.forEach(viewing => {
        const viewingDate = new Date(viewing.scheduled_date);
        const timeUntil = getTimeUntil(viewingDate);
        
        notifs.push({
          type: 'success',
          message: `${t('Viewing scheduled')} ${timeUntil}`,
          time: getTimeAgo(new Date(viewing.created_at)),
          action: () => navigate('/owner-account/tenant-applications?tab=viewings')
        });
      });
    }
    
    // Pending applications reminder
    const pendingCount = applications?.filter(a => 
      a.status === 'pending' || a.status === 'viewing_requested'
    ).length || 0;
    
    if (pendingCount > 3) {
      notifs.push({
        type: 'warning',
        message: `${pendingCount} ${t('applications awaiting your review')}`,
        time: t('Action needed'),
        action: () => navigate('/owner-account/tenant-applications')
      });
    }
    
    // If no notifications, show helpful tips
    if (notifs.length === 0) {
      if (!properties || properties.length === 0) {
        notifs.push({
          type: 'info',
          message: t('Add your first property to start receiving applications'),
          time: t('Get started'),
          action: () => navigate('/owner-account/listing')
        });
      } else if (properties.filter(p => p.status === 'ad_active' || p.status === 'selection_in_progress').length === 0) {
        notifs.push({
          type: 'info',
          message: t('Activate your property listing to receive applications'),
          time: t('Tip'),
          action: () => navigate('/owner-account/listing')
        });
      } else {
        notifs.push({
          type: 'info',
          message: t('Your properties are active and ready for applications'),
          time: t('All good'),
          action: null
        });
      }
    }
    
    return notifs.slice(0, 3); // Show max 3 notifications
  }, [applications, viewings, properties, t, navigate, getTimeAgo, getTimeUntil]);

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">{t('Notifications')}</Typography>
          <IconButton size="small">
            <NotificationsIcon />
          </IconButton>
        </Box>
        <List>
          {notifications.map((notification, index) => (
            <ListItem 
              key={index} 
              sx={{ 
                px: 0,
                cursor: notification.action ? 'pointer' : 'default',
                '&:hover': notification.action ? {
                  bgcolor: 'action.hover',
                  borderRadius: 1
                } : {}
              }}
              onClick={notification.action}
            >
              <ListItemAvatar>
                <Avatar sx={{ 
                  bgcolor: notification.type === 'success' ? '#65BA7420' :
                          notification.type === 'warning' ? '#AA99EC20' :
                          '#E0E7FD',
                  color: notification.type === 'success' ? '#65BA74' :
                         notification.type === 'warning' ? '#AA99EC' :
                         '#3E63DD'
                }}>
                  {notification.type === 'success' ? <CheckCircleIcon /> :
                   notification.type === 'warning' ? <PendingIcon /> :
                   <NotificationsIcon />}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={notification.message}
                secondary={notification.time}
                primaryTypographyProps={{
                  variant: 'body2',
                  sx: { fontWeight: 500 }
                }}
                secondaryTypographyProps={{
                  variant: 'caption'
                }}
              />
              {notification.action && (
                <ArrowForwardIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
              )}
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Redux state
  const { properties } = useSelector(selectProperties);
  const tenantSelection = useSelector(state => state.tenantSelection || {});
  const viewings = useSelector(state => state.viewing || {});
  
  // Convert normalized Redux state to array for applications
  const applicationsArray = React.useMemo(() => {
    if (Array.isArray(tenantSelection.leads)) {
      return tenantSelection.leads;
    } else if (tenantSelection.leads?.ids && tenantSelection.leads?.entities) {
      return tenantSelection.leads.ids.map(id => tenantSelection.leads.entities[id]).filter(Boolean);
    }
    return [];
  }, [tenantSelection.leads]);
  
  // Local state for metrics
  const [metrics, setMetrics] = useState({
    totalProperties: 0,
    activeListings: 0,
    totalApplications: 0,
    pendingApplications: 0,
    scheduledViewings: 0,
    thisMonthApplications: 0,
    occupancyRate: 0,
    averageScore: 0,
    responseRate: 0,
    respondedApplications: 0
  });
  
  // Error states
  const [errors, setErrors] = useState({
    properties: null,
    applications: null,
    viewings: null
  });

  // Fetch data on mount with error handling - parallel execution for better performance
  useEffect(() => {
    // Check if data is already loading or loaded to prevent duplicate calls
    const shouldFetchProperties = !properties.isLoading && (!properties.data || properties.data.length === 0);
    const shouldFetchLeads = !tenantSelection.isLoading;
    
    const fetchData = async () => {
      console.log('[Dashboard] fetchData started');
      console.log('[Dashboard] shouldFetchProperties:', shouldFetchProperties);
      console.log('[Dashboard] shouldFetchLeads:', shouldFetchLeads);
      console.log('[Dashboard] properties.isLoading:', properties.isLoading);
      console.log('[Dashboard] properties.data:', properties.data);
      
      const promises = [];
      
      // Only fetch if not already loading/loaded
      if (shouldFetchProperties) {
        console.log('[Dashboard] Dispatching fetchProperties...');
        promises.push(
          dispatch(fetchProperties()).unwrap()
            .then(result => {
              console.log('[Dashboard] fetchProperties SUCCESS:', result);
              return result;
            })
            .catch(error => {
              console.error('[Dashboard] fetchProperties FAILED:', error);
              setErrors(prev => ({ ...prev, properties: 'Failed to load properties' }));
              return null;
            })
        );
      } else {
        console.log('[Dashboard] Skipping properties fetch - already loaded/loading');
      }
      
      if (shouldFetchLeads) {
        console.log('[Dashboard] Dispatching fetchLeads...');
        promises.push(
          dispatch(fetchLeads()).unwrap()
            .then(result => {
              console.log('[Dashboard] fetchLeads SUCCESS:', result);
              return result;
            })
            .catch(error => {
              console.error('[Dashboard] fetchLeads FAILED:', error);
              setErrors(prev => ({ ...prev, applications: 'Failed to load applications' }));
              return null;
            })
        );
      } else {
        console.log('[Dashboard] Skipping leads fetch - already loaded/loading');
      }
      
      // Always try to fetch viewings
      console.log('[Dashboard] Dispatching getViewings...');
      promises.push(
        dispatch(getViewings({})).unwrap()
          .then(result => {
            console.log('[Dashboard] getViewings SUCCESS:', result);
            return result;
          })
          .catch(error => {
            console.error('[Dashboard] getViewings FAILED:', error);
            // Don't show error for viewings as it's not critical
            return null;
          })
      );
      
      if (promises.length > 0) {
        console.log('[Dashboard] Waiting for', promises.length, 'promises...');
        const results = await Promise.allSettled(promises);
        console.log('[Dashboard] All promises settled:', results);
      } else {
        console.log('[Dashboard] No promises to wait for');
      }
    };
    
    fetchData();
  }, [dispatch]);

  // Calculate metrics when data changes
  useEffect(() => {
    const propertiesData = properties.data || [];
    const applicationsData = applicationsArray;
    // Handle both array and object with data property
    const viewingsData = Array.isArray(viewings) ? viewings : (viewings.data || []);
    
    const now = new Date();
    const thisMonth = now.getMonth();
    
    // Calculate response rate based on applications with responses
    const respondedCount = applicationsData.filter(a => 
      a.status === 'accepted' || 
      a.status === 'rejected' || 
      a.status === 'viewing_scheduled' ||
      a.status === 'viewing_completed'
    ).length;
    
    const responseRate = applicationsData.length > 0
      ? Math.round((respondedCount / applicationsData.length) * 100)
      : 0;
    
    setMetrics({
      totalProperties: propertiesData.length,
      activeListings: propertiesData.filter(p => 
        p.status === 'ad_active' || 
        p.status === 'selection_in_progress' ||
        p.status === 'pending_viewing'
      ).length,
      totalApplications: applicationsData.length,
      pendingApplications: applicationsData.filter(a => 
        a.status === 'pending' || a.status === 'viewing_requested'
      ).length,
      scheduledViewings: viewingsData.filter(v => {
        const viewingDate = new Date(v.scheduled_date);
        return (v.status === 'scheduled' || v.status === 'confirmed') &&
               viewingDate >= now &&
               !isNaN(viewingDate.getTime());
      }).length,
      thisMonthApplications: applicationsData.filter(a => 
        new Date(a.created_at).getMonth() === thisMonth
      ).length,
      occupancyRate: propertiesData.length > 0 
        ? Math.round((propertiesData.filter(p => p.is_occupied).length / propertiesData.length) * 100)
        : 0,
      averageScore: applicationsData.length > 0
        ? Math.round(applicationsData.reduce((acc, a) => acc + (a.soft_score || 0), 0) / applicationsData.length)
        : 0,
      responseRate: responseRate,
      respondedApplications: respondedCount
    });
  }, [properties.data, applicationsArray, viewings.data]);

  // Add timeout to prevent infinite loading
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  
  useEffect(() => {
    console.log('[Dashboard] Rendering check - properties.isLoading:', properties.isLoading);
    console.log('[Dashboard] Properties state:', {
      isLoading: properties.isLoading,
      hasData: !!properties.data,
      dataLength: properties.data?.length,
      error: properties.error
    });
    
    const timer = setTimeout(() => {
      if (properties.isLoading) {
        console.error('[Dashboard] Loading timeout - showing dashboard anyway');
        console.log('[Dashboard] Final properties state at timeout:', properties);
        setLoadingTimeout(true);
      }
    }, 5000); // 5 second timeout
    
    return () => clearTimeout(timer);
  }, [properties.isLoading, properties]);
  
  if (properties.isLoading && !loadingTimeout) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 500 }}>
        {t('Dashboard')}
      </Typography>
      
      {/* Error Alerts */}
      {(errors.properties || errors.applications || errors.viewings) && (
        <Box sx={{ mb: 3 }}>
          {errors.properties && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errors.properties}
            </Alert>
          )}
          {errors.applications && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {errors.applications}
            </Alert>
          )}
          {errors.viewings && (
            <Alert severity="info" sx={{ mb: 2 }}>
              {errors.viewings}
            </Alert>
          )}
        </Box>
      )}

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title={t('Active Properties')}
            value={metrics.activeListings}
            subtitle={`${metrics.totalProperties} ${t('total')}`}
            icon={<HomeIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title={t('Total Applications')}
            value={metrics.totalApplications}
            subtitle={`${metrics.thisMonthApplications} ${t('this month')}`}
            icon={<PeopleIcon />}
            color="success"
            trend={metrics.thisMonthApplications > 0 ? `+${metrics.thisMonthApplications}` : '0'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title={t('Scheduled Viewings')}
            value={metrics.scheduledViewings}
            subtitle={t('Upcoming')}
            icon={<CalendarTodayIcon />}
            color="info"
          />
        </Grid>
      </Grid>

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Notifications - Moved to top left */}
        <Grid item xs={12} md={8}>
          <NotificationsWidget
            applications={applicationsArray}
            viewings={Array.isArray(viewings) ? viewings : (viewings.data || [])}
            properties={properties.data}
          />
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <QuickActionsWidget />
        </Grid>

        {/* Properties Overview */}
        <Grid item xs={12}>
          <PropertiesOverviewWidget properties={properties.data} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;