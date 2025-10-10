import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { CheckCircle, Error, Warning } from '@mui/icons-material';

const ServiceStatus = ({ service, uptime }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'operational':
        return <CheckCircle sx={{ color: '#10b981', fontSize: 24 }} />;
      case 'degraded':
        return <Warning sx={{ color: '#f59e0b', fontSize: 24 }} />;
      case 'down':
        return <Error sx={{ color: '#ef4444', fontSize: 24 }} />;
      default:
        return null;
    }
  };

  const getUptimeColor = (percentage) => {
    if (percentage >= 99.9) return '#10b981';
    if (percentage >= 99.0) return '#f59e0b';
    return '#ef4444';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'operational':
        return 'success';
      case 'degraded':
        return 'warning';
      case 'down':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 1,
        '&:hover': {
          backgroundColor: 'action.hover',
        },
      }}
    >
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box display="flex" alignItems="center" gap={2} flex={1}>
          {getStatusIcon(service.status)}
          <Box>
            <Typography variant="body1" fontWeight="600">
              {service.name}
            </Typography>
            {service.response_time && (
              <Typography variant="caption" color="text.secondary">
                Response time: {service.response_time}ms
              </Typography>
            )}
          </Box>
        </Box>

        <Box display="flex" alignItems="center" gap={2}>
          <Box textAlign="right" minWidth="120px">
            <Typography
              variant="h6"
              fontWeight="600"
              sx={{ color: getUptimeColor(uptime?.percentage || 100) }}
            >
              {uptime?.percentage?.toFixed(2) || '100.00'}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {uptime?.period || '90 days'} uptime
            </Typography>
          </Box>

          <Chip
            label={service.status}
            color={getStatusColor(service.status)}
            size="small"
            sx={{ minWidth: 100, textTransform: 'capitalize' }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default ServiceStatus;
