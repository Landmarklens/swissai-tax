import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  LinearProgress,
  Alert,
  Divider,
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Warning,
  Build,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

import Header from '../../components/header/Header';
import Footer from '../../components/footer/Footer';
import SEOHelmet from '../../components/SEO/SEOHelmet';
import ServiceStatus from './ServiceStatus';
import IncidentTimeline from './IncidentTimeline';
import UptimeChart from './UptimeChart';

const StatusPage = () => {
  const { t } = useTranslation();
  const topRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [overallStatus, setOverallStatus] = useState('operational');
  const [services, setServices] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [uptime, setUptime] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [networkError, setNetworkError] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    // Scroll to top element if available
    if (topRef.current) {
      topRef.current.scrollIntoView({ behavior: 'instant', block: 'start' });
    }

    // Fallback to window scroll
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // Initial fetch
    fetchStatusData();

    // Setup polling interval
    const startPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      intervalRef.current = setInterval(() => {
        // Only fetch if online
        if (navigator.onLine) {
          fetchStatusData();
        }
      }, 60000);
    };

    startPolling();

    // Cleanup interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setNetworkError(false);
      // Immediately fetch when coming back online
      fetchStatusData();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setNetworkError(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Also scroll to top after loading completes
  useEffect(() => {
    if (!loading && topRef.current) {
      topRef.current.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
  }, [loading]);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchStatusData = async () => {
    // Don't attempt to fetch if offline
    if (!navigator.onLine) {
      setNetworkError(true);
      return;
    }

    try {
      // Fetch current status
      const statusResponse = await axios.get('/api/status/current', {
        timeout: 10000, // 10 second timeout
      });
      setServices(statusResponse.data.services);
      setOverallStatus(statusResponse.data.overall_status);
      setLastUpdated(new Date(statusResponse.data.last_updated));

      // Fetch incidents
      const incidentsResponse = await axios.get('/api/status/incidents', {
        timeout: 10000,
      });
      setIncidents(incidentsResponse.data);

      // Fetch uptime data
      const uptimeResponse = await axios.get('/api/status/uptime?days=90', {
        timeout: 10000,
      });
      setUptime(uptimeResponse.data);

      setLoading(false);
      setNetworkError(false);
    } catch (error) {
      // Only log non-network errors or if we're online
      if (navigator.onLine && error.code !== 'ERR_NETWORK') {
        console.error('Error fetching status data:', error);
      }

      // Set network error flag if it's a network-related error
      if (error.code === 'ECONNABORTED' ||
          error.code === 'ERR_NETWORK' ||
          error.message?.includes('Network Error') ||
          error.message?.includes('ERR_NAME_NOT_RESOLVED')) {
        setNetworkError(true);
      }

      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'operational':
        return <CheckCircle sx={{ color: '#10b981', fontSize: 40 }} />;
      case 'degraded':
        return <Warning sx={{ color: '#f59e0b', fontSize: 40 }} />;
      case 'down':
        return <Error sx={{ color: '#ef4444', fontSize: 40 }} />;
      case 'maintenance':
        return <Build sx={{ color: '#3b82f6', fontSize: 40 }} />;
      default:
        return <CheckCircle sx={{ color: '#6b7280', fontSize: 40 }} />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'operational':
        return t('status.allSystemsOperational', 'All Systems Operational');
      case 'degraded':
        return t('status.degradedPerformance', 'Degraded Performance');
      case 'down':
        return t('status.serviceOutage', 'Service Outage');
      case 'maintenance':
        return t('status.scheduledMaintenance', 'Scheduled Maintenance');
      default:
        return t('status.unknown', 'Unknown Status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'operational':
        return '#10b981';
      case 'degraded':
        return '#f59e0b';
      case 'down':
        return '#ef4444';
      case 'maintenance':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  if (loading) {
    return (
      <>
        <SEOHelmet
          title={t('status.meta.title', 'System Status - SwissAI Tax')}
          description={t('status.meta.description', 'Real-time status and uptime information for SwissAI Tax services')}
        />
        <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Header />
          <Container maxWidth="lg" sx={{ py: 8, flex: 1 }}>
            <LinearProgress />
          </Container>
          <Footer />
        </Box>
      </>
    );
  }

  const activeIncidents = incidents.filter(i => i.status !== 'resolved');

  // Format current time in Switzerland timezone
  const switzerlandTime = currentTime.toLocaleString('en-US', {
    timeZone: 'Europe/Zurich',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'
  });

  return (
    <>
      <SEOHelmet
        title={t('status.meta.title', 'System Status - SwissAI Tax')}
        description={t('status.meta.description', 'Real-time status and uptime information for SwissAI Tax services')}
      />
      <Box ref={topRef} sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />

        <Box component="main" sx={{ flex: 1 }}>
          <Container maxWidth="lg" sx={{ py: 8 }}>
      {/* Header */}
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Typography variant="h3" fontWeight="600" gutterBottom>
          {t('status.pageTitle', 'SwissAI Tax System Status')}
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          {t('status.pageDescription', 'Real-time status and uptime information for all services')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
          {t('status.asOf', 'Status as of')} {switzerlandTime}
        </Typography>
      </Box>

      {/* Network Error Alert */}
      {networkError && !isOnline && (
        <Alert severity="warning" sx={{ mb: 4 }}>
          <Typography variant="body1" fontWeight="600">
            {t('status.networkOffline', 'You are currently offline')}
          </Typography>
          <Typography variant="body2">
            {t('status.networkOfflineDescription', 'Status updates are paused. They will resume automatically when your connection is restored.')}
          </Typography>
        </Alert>
      )}

      {/* Overall Status Banner */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          mb: 4,
          border: '2px solid',
          borderColor: getStatusColor(overallStatus),
          backgroundColor: `${getStatusColor(overallStatus)}15`,
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          {getStatusIcon(overallStatus)}
          <Box flex={1}>
            <Typography variant="h4" fontWeight="600">
              {getStatusText(overallStatus)}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Active Incidents */}
      {activeIncidents.length > 0 && (
        <Alert severity="warning" sx={{ mb: 4 }}>
          <Typography variant="body1" fontWeight="600">
            {t('status.activeIncidents', 'Active Incidents')}
          </Typography>
          {activeIncidents.map(incident => (
            <Typography key={incident.id} variant="body2" sx={{ mt: 1 }}>
              • {incident.title} - {incident.description}
            </Typography>
          ))}
        </Alert>
      )}

      {/* Services Status */}
      <Paper elevation={0} sx={{ p: 4, mb: 4, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h5" fontWeight="600" gutterBottom>
          {t('status.services', 'Services')}
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Grid container spacing={2}>
          {services.map((service) => (
            <Grid item xs={12} key={service.id}>
              <ServiceStatus
                service={service}
                uptime={uptime[service.id]}
              />
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Uptime Chart */}
      <Paper elevation={0} sx={{ p: 4, mb: 4, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h5" fontWeight="600" gutterBottom>
          {t('status.uptimeHistory', 'Uptime History (90 Days)')}
        </Typography>
        <Divider sx={{ my: 2 }} />
        <UptimeChart data={uptime} services={services} />
      </Paper>

      {/* Incident Timeline */}
      <Paper elevation={0} sx={{ p: 4, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h5" fontWeight="600" gutterBottom>
          {t('status.incidentHistory', 'Incident History')}
        </Typography>
        <Divider sx={{ my: 2 }} />
        <IncidentTimeline incidents={incidents} />
      </Paper>
          </Container>
        </Box>

        <Footer />
      </Box>
    </>
  );
};

export default StatusPage;
