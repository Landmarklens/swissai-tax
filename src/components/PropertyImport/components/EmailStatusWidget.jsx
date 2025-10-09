import React, { useState, useEffect } from 'react';
import {
  Paper,
  Box,
  Typography,
  Chip,
  Button,
  Grid,
  IconButton,
  Collapse,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Email as EmailIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  ContentCopy as CopyIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Refresh as RefreshIcon,
  Send as SendIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useEmailMonitoring } from '../hooks/useEmailMonitoring';
import { useTranslation } from 'react-i18next';

const EmailStatusWidget = ({ property, emailConfig }) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const {
    startMonitoring,
    stopMonitoring,
    monitoringStatus,
    testResult
  } = useEmailMonitoring(property?.id);

  // Fetch email statistics
  useEffect(() => {
    if (property?.id) {
      fetchEmailStatistics();
    }
  }, [property?.id]);

  const fetchEmailStatistics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/properties/${property.id}/email-statistics`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setStatistics(data);
    } catch (error) {
      console.error('Failed to fetch email statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyEmail = () => {
    if (emailConfig?.managedEmail) {
      navigator.clipboard.writeText(emailConfig.managedEmail);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTestConnection = () => {
    const testSubject = `TEST-PROPERTY-${property.id}-${Date.now()}`;
    const mailto = `mailto:${emailConfig.managedEmail}?subject=${encodeURIComponent(testSubject)}`;
    window.open(mailto);
    
    setTimeout(() => {
      startMonitoring({
        propertyId: property.id,
        managedEmail: emailConfig.managedEmail,
        verificationCode: testSubject
      });
    }, 3000);
  };

  const getStatusColor = () => {
    if (!emailConfig) return 'grey';
    if (emailConfig.testStatus === 'success' || statistics?.lastReceived) return 'success';
    if (emailConfig.testStatus === 'timeout') return 'warning';
    if (emailConfig.testStatus === 'failed') return 'error';
    return 'info';
  };

  const getStatusIcon = () => {
    const color = getStatusColor();
    switch (color) {
      case 'success':
        return <CheckIcon color="success" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'error':
        return <ErrorIcon color="error" />;
      default:
        return <EmailIcon color="info" />;
    }
  };

  const getStatusText = () => {
    if (monitoringStatus === 'monitoring') return 'Testing connection...';
    if (!emailConfig) return 'Not configured';
    if (emailConfig.testStatus === 'success' || statistics?.lastReceived) return 'Active and receiving';
    if (emailConfig.testStatus === 'timeout') return 'Verification pending';
    if (emailConfig.testStatus === 'failed') return 'Connection failed';
    return 'Not tested';
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  if (!property || !emailConfig) {
    return null;
  }

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {getStatusIcon()}
          <Box>
            <Typography variant="subtitle1" fontWeight="bold">
              Email Forwarding Overview
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Property: {property.title || property.address}
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            label={getStatusText()}
            color={getStatusColor()}
            size="small"
            icon={monitoringStatus === 'monitoring' ? <CircularProgress size={16} /> : undefined}
          />
          <IconButton onClick={() => setExpanded(!expanded)} size="small">
            {expanded ? <CollapseIcon /> : <ExpandIcon />}
          </IconButton>
        </Box>
      </Box>

      <Collapse in={expanded}>
        <Divider sx={{ my: 2 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Managed Email Address
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontFamily: 'monospace',
                    bgcolor: 'grey.100',
                    p: 1,
                    borderRadius: 1,
                    flex: 1
                  }}
                >
                  {emailConfig.managedEmail}
                </Typography>
                <IconButton size="small" onClick={handleCopyEmail}>
                  {copied ? <CheckIcon color="success" /> : <CopyIcon />}
                </IconButton>
              </Box>
            </Box>
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Personal Forwarding
              </Typography>
              <Typography variant="body2">
                {emailConfig.forwardToPersonal 
                  ? `Enabled → ${emailConfig.personalEmail}`
                  : 'Disabled'}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : statistics ? (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Statistics
                </Typography>
                <List dense>
                  <ListItem disableGutters>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <ScheduleIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Last received"
                      secondary={formatTimeAgo(statistics.lastReceived)}
                    />
                  </ListItem>
                  <ListItem disableGutters>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <EmailIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Total applications"
                      secondary={statistics.totalApplications || 0}
                    />
                  </ListItem>
                  <ListItem disableGutters>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <TrendingIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="This week"
                      secondary={`${statistics.thisWeek || 0} applications`}
                    />
                  </ListItem>
                </List>
              </Box>
            ) : (
              <Alert severity="info" variant="outlined">
                No statistics available yet
              </Alert>
            )}
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={monitoringStatus === 'monitoring' ? <CircularProgress size={16} /> : <SendIcon />}
            onClick={handleTestConnection}
            disabled={monitoringStatus === 'monitoring'}
          >
            {monitoringStatus === 'monitoring' ? 'Testing...' : 'Test Connection'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchEmailStatistics}
          >
            Refresh Stats
          </Button>
          <Button
            variant="text"
            startIcon={<InfoIcon />}
            onClick={() => window.open('/help/email-forwarding', '_blank')}
          >
            View Instructions
          </Button>
        </Box>
        
        {monitoringStatus === 'monitoring' && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Monitoring for test email... Please send a test email to {emailConfig.managedEmail}
          </Alert>
        )}
        
        {testResult?.success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            Test email received successfully at {formatTimeAgo(testResult.receivedAt)}!
          </Alert>
        )}
        
        {monitoringStatus === 'timeout' && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Test email not received within the timeout period. It may still arrive - check back later.
          </Alert>
        )}
      </Collapse>
    </Paper>
  );
};

export default EmailStatusWidget;