import React from 'react';
import PropTypes from 'prop-types';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  LinearProgress,
  Chip,
  Avatar,
  Divider,
  Paper
} from '@mui/material';
import {
  FunnelChart,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line
} from 'recharts';
import GroupIcon from '@mui/icons-material/Group';
import AssignmentIcon from '@mui/icons-material/Assignment';
import EventIcon from '@mui/icons-material/Event';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PeopleIcon from '@mui/icons-material/People';
import SourceIcon from '@mui/icons-material/Source';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const TenantSelectionFunnel = ({ data, loading }) => {
  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Tenant Selection Analytics
          </Typography>
          <LinearProgress />
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.funnel) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Tenant Selection Analytics
          </Typography>
          <Typography color="text.secondary">
            No tenant selection data available
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const { funnel, source_distribution, status_distribution, leads_by_day, period } = data;

  // Prepare funnel visualization data
  const funnelSteps = [
    { name: 'Leads', value: funnel.total_leads, color: '#1976d2', icon: <GroupIcon /> },
    { name: 'Dossier', value: funnel.dossier_submitted, color: '#388e3c', icon: <AssignmentIcon /> },
    { name: 'Viewing', value: funnel.viewing_scheduled, color: '#f57c00', icon: <EventIcon /> },
    { name: 'Qualified', value: funnel.qualified, color: '#7b1fa2', icon: <CheckCircleIcon /> },
    { name: 'Selected', value: funnel.selected, color: '#d32f2f', icon: <PeopleIcon /> }
  ];

  // Prepare source distribution for pie chart
  const sourceData = Object.entries(source_distribution || {}).map(([source, count]) => ({
    name: source.charAt(0).toUpperCase() + source.slice(1),
    value: count,
    percentage: funnel.total_leads > 0 ? ((count / funnel.total_leads) * 100).toFixed(1) : '0'
  }));

  // Prepare daily leads data for line chart
  const dailyLeadsData = Object.entries(leads_by_day || {})
    .sort(([a], [b]) => new Date(a) - new Date(b))
    .slice(-14) // Last 14 days
    .map(([date, count]) => ({
      date: new Date(date).toLocaleDateString('de-CH', { month: 'short', day: 'numeric' }),
      leads: count
    }));

  const getConversionRate = (current, previous) => {
    if (!previous) return 0;
    return ((current / previous) * 100).toFixed(1);
  };

  const FunnelStep = ({ step, index, totalSteps }) => {
    const percentage = funnel.total_leads > 0 ? ((step.value / funnel.total_leads) * 100) : 0;
    const isLast = index === totalSteps - 1;
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Avatar sx={{ bgcolor: step.color, mr: 2 }}>
          {step.icon}
        </Avatar>
        <Box sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6" sx={{ mr: 2 }}>
              {step.value}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
              {step.name}
            </Typography>
            <Chip 
              label={`${percentage.toFixed(1)}%`}
              size="small"
              color={percentage > 20 ? 'success' : percentage > 10 ? 'warning' : 'default'}
              sx={{ ml: 'auto' }}
            />
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={percentage} 
            sx={{ 
              height: 8,
              borderRadius: 4,
              '& .MuiLinearProgress-bar': {
                backgroundColor: step.color
              }
            }}
          />
        </Box>
      </Box>
    );
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <GroupIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">
            Tenant Selection Analytics
          </Typography>
          <Chip 
            label={period}
            color="primary"
            variant="outlined"
            size="small"
            sx={{ ml: 'auto' }}
          />
        </Box>

        <Grid container spacing={3}>
          {/* Conversion Rates Summary */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={2.4}>
                  <Box textAlign="center">
                    <Typography variant="h5" color="primary">
                      {funnel.conversion_rates.dossier_rate}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Dossier Rate
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={2.4}>
                  <Box textAlign="center">
                    <Typography variant="h5" color="success.main">
                      {funnel.conversion_rates.viewing_schedule_rate}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Viewing Rate
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={2.4}>
                  <Box textAlign="center">
                    <Typography variant="h5" color="warning.main">
                      {funnel.conversion_rates.viewing_attendance_rate}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Attendance
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={2.4}>
                  <Box textAlign="center">
                    <Typography variant="h5" color="info.main">
                      {funnel.conversion_rates.qualification_rate}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Qualification
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={2.4}>
                  <Box textAlign="center">
                    <Typography variant="h5" color="error.main">
                      {funnel.conversion_rates.selection_rate}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Selection Rate
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Funnel Visualization */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Conversion Funnel
            </Typography>
            <Box sx={{ py: 2 }}>
              {funnelSteps.map((step, index) => (
                <FunnelStep 
                  key={step.name} 
                  step={step} 
                  index={index} 
                  totalSteps={funnelSteps.length} 
                />
              ))}
            </Box>
          </Grid>

          {/* Lead Sources */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Lead Sources
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} (${percentage}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, 'Leads']} />
              </PieChart>
            </ResponsiveContainer>
          </Grid>

          {/* Daily Leads Trend */}
          {dailyLeadsData.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Lead Trends (Last 14 Days)
              </Typography>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={dailyLeadsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="leads" 
                    stroke="#1976d2" 
                    strokeWidth={2}
                    dot={{ fill: '#1976d2', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Grid>
          )}

          {/* Status Distribution */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Current Lead Status Distribution
            </Typography>
            <Grid container spacing={1}>
              {Object.entries(status_distribution || {}).map(([status, count]) => {
                const percentage = funnel.total_leads > 0 ? ((count / funnel.total_leads) * 100).toFixed(1) : '0';
                const statusColors = {
                  viewing_requested: 'primary',
                  viewing_scheduled: 'success',
                  viewing_attended: 'info',
                  dossier_submitted: 'warning',
                  qualified: 'secondary',
                  selected: 'error'
                };
                
                return (
                  <Grid item key={status}>
                    <Chip
                      label={`${status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} (${count} - ${percentage}%)`}
                      color={statusColors[status] || 'default'}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                );
              })}
            </Grid>
          </Grid>
        </Grid>

        {funnel.total_leads === 0 && (
          <Box textAlign="center" py={4}>
            <Typography color="text.secondary">
              No leads data available for the selected period.
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

TenantSelectionFunnel.propTypes = {
  data: PropTypes.shape({
    funnel: PropTypes.object,
    source_distribution: PropTypes.object,
    status_distribution: PropTypes.object,
    leads_by_day: PropTypes.object,
    period: PropTypes.string
  }),
  loading: PropTypes.bool
};

export default React.memo(TenantSelectionFunnel);