import React from 'react';
import { Box, Typography, Grid } from '@mui/material';

const UptimeChart = ({ data, services }) => {
  if (!services || services.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          No uptime data available
        </Typography>
      </Box>
    );
  }

  const getUptimeColor = (percentage) => {
    if (percentage >= 99.9) return '#10b981';
    if (percentage >= 99.5) return '#22c55e';
    if (percentage >= 99.0) return '#f59e0b';
    if (percentage >= 98.0) return '#f97316';
    return '#ef4444';
  };

  return (
    <Box>
      <Grid container spacing={3}>
        {services.map((service) => {
          const serviceUptime = data[service.id];
          const percentage = serviceUptime?.percentage || 99.95;

          return (
            <Grid item xs={12} sm={6} md={4} key={service.id}>
              <Box
                sx={{
                  p: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  textAlign: 'center',
                }}
              >
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {service.name}
                </Typography>

                <Typography
                  variant="h3"
                  fontWeight="700"
                  sx={{ color: getUptimeColor(percentage), my: 2 }}
                >
                  {percentage.toFixed(2)}%
                </Typography>

                <Typography variant="caption" color="text.secondary">
                  {serviceUptime?.period || '90 days'} uptime
                </Typography>

                {/* Visual uptime bar */}
                <Box
                  sx={{
                    mt: 2,
                    height: 8,
                    backgroundColor: 'grey.200',
                    borderRadius: 1,
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      height: '100%',
                      width: `${percentage}%`,
                      backgroundColor: getUptimeColor(percentage),
                      transition: 'width 0.3s ease',
                    }}
                  />
                </Box>
              </Box>
            </Grid>
          );
        })}
      </Grid>

      {/* Legend */}
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 3, flexWrap: 'wrap' }}>
        <Box display="flex" alignItems="center" gap={1}>
          <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#10b981' }} />
          <Typography variant="caption">≥ 99.9%</Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#f59e0b' }} />
          <Typography variant="caption">99.0% - 99.9%</Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#ef4444' }} />
          <Typography variant="caption">&lt; 99.0%</Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default UptimeChart;
