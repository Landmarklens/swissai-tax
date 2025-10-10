import React, { useState, useEffect } from 'react';
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

import ServiceStatus from './ServiceStatus';
import IncidentTimeline from './IncidentTimeline';
import UptimeChart from './UptimeChart';

const StatusPage = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [overallStatus, setOverallStatus] = useState('operational');
  const [services, setServices] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [uptime, setUptime] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchStatusData();
    // Refresh every 60 seconds
    const interval = setInterval(fetchStatusData, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatusData = async () => {
    try {
      // Fetch current status
      const statusResponse = await axios.get('/api/status/current');
      setServices(statusResponse.data.services);
      setOverallStatus(statusResponse.data.overall_status);
      setLastUpdated(new Date(statusResponse.data.last_updated));

      // Fetch incidents
      const incidentsResponse = await axios.get('/api/status/incidents');
      setIncidents(incidentsResponse.data);

      // Fetch uptime data
      const uptimeResponse = await axios.get('/api/status/uptime?days=90');
      setUptime(uptimeResponse.data);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching status data:', error);
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
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <LinearProgress />
      </Container>
    );
  }

  const activeIncidents = incidents.filter(i => i.status !== 'resolved');

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      {/* Header */}
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Typography variant="h3" fontWeight="600" gutterBottom>
          {t('status.pageTitle', 'SwissAI Tax System Status')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('status.pageDescription', 'Real-time status and uptime information for all services')}
        </Typography>
      </Box>

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
            <Typography variant="body2" color="text.secondary">
              {t('status.lastUpdated', 'Last updated')}: {lastUpdated?.toLocaleString()}
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
  );
};

export default StatusPage;
