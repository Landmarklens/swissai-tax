import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  IconButton,
  Tooltip,
  Paper,
  Select,
  MenuItem,
  FormControl
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  People as PeopleIcon,
  CheckCircle as AcceptedIcon,
  Cancel as RejectedIcon,
  Schedule as PendingIcon,
  Home as PropertyIcon,
  Speed as SpeedIcon,
  Assessment as AssessmentIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts';

// Mock data - replace with actual API data
const mockMetrics = {
  overview: {
    totalApplications: 245,
    totalApplicationsChange: 12,
    acceptanceRate: 18.5,
    acceptanceRateChange: 2.3,
    averageScore: 72.4,
    averageScoreChange: -1.2,
    averageTimeToDecision: 3.2, // days
    timeToDecisionChange: -0.5,
    viewingConversion: 65,
    viewingConversionChange: 5,
    occupancyRate: 94,
    occupancyRateChange: 0
  },
  applicationTrend: [
    { date: '2024-01-01', applications: 8, accepted: 2, rejected: 4 },
    { date: '2024-01-08', applications: 12, accepted: 3, rejected: 5 },
    { date: '2024-01-15', applications: 15, accepted: 4, rejected: 6 },
    { date: '2024-01-22', applications: 10, accepted: 2, rejected: 5 },
    { date: '2024-01-29', applications: 18, accepted: 5, rejected: 7 },
    { date: '2024-02-05', applications: 22, accepted: 6, rejected: 8 },
    { date: '2024-02-12', applications: 20, accepted: 4, rejected: 9 }
  ],
  scoreDistribution: [
    { range: '0-20', count: 5 },
    { range: '21-40', count: 15 },
    { range: '41-60', count: 35 },
    { range: '61-80', count: 65 },
    { range: '81-100', count: 25 }
  ],
  sourceBreakdown: [
    { name: 'Homegate', value: 35, color: '#FF6384' },
    { name: 'Flatfox', value: 28, color: '#36A2EB' },
    { name: 'ImmoScout24', value: 22, color: '#FFCE56' },
    { name: 'Direct', value: 10, color: '#4BC0C0' },
    { name: 'Other', value: 5, color: '#9966FF' }
  ]
};

const MetricsOverview = ({ propertyId }) => {
  const { t } = useTranslation();
  const [timeRange, setTimeRange] = useState('30d');
  const [metrics, setMetrics] = useState(mockMetrics);

  const formatChange = (value) => {
    if (value === 0) return null;
    const isPositive = value > 0;
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {isPositive ? (
          <TrendingUpIcon fontSize="small" color="success" />
        ) : (
          <TrendingDownIcon fontSize="small" color="error" />
        )}
        <Typography variant="caption" color={isPositive ? 'success.main' : 'error.main'}>
          {isPositive ? '+' : ''}{value}%
        </Typography>
      </Box>
    );
  };

  const MetricCard = ({ title, value, change, icon, format = 'number', color = 'primary' }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ 
            p: 1, 
            borderRadius: 2, 
            bgcolor: `${color}.light`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {icon}
          </Box>
          {formatChange(change)}
        </Box>
        
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          {format === 'percent' ? `${value}%` : 
           format === 'days' ? `${value} ${t('days')}` : 
           value.toLocaleString()}
        </Typography>
        
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" fontWeight="bold">
          {t('Tenant Selection Analytics')}
        </Typography>
        <FormControl size="small">
          <Select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <MenuItem value="7d">{t('Last 7 days')}</MenuItem>
            <MenuItem value="30d">{t('Last 30 days')}</MenuItem>
            <MenuItem value="90d">{t('Last 90 days')}</MenuItem>
            <MenuItem value="1y">{t('Last year')}</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <MetricCard
            title={t('Total Applications')}
            value={metrics.overview.totalApplications}
            change={metrics.overview.totalApplicationsChange}
            icon={<PeopleIcon sx={{ color: 'primary.main' }} />}
            color="primary"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <MetricCard
            title={t('Acceptance Rate')}
            value={metrics.overview.acceptanceRate}
            change={metrics.overview.acceptanceRateChange}
            icon={<AcceptedIcon sx={{ color: 'success.main' }} />}
            format="percent"
            color="success"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <MetricCard
            title={t('Average Score')}
            value={metrics.overview.averageScore}
            change={metrics.overview.averageScoreChange}
            icon={<AssessmentIcon sx={{ color: 'info.main' }} />}
            color="info"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <MetricCard
            title={t('Time to Decision')}
            value={metrics.overview.averageTimeToDecision}
            change={metrics.overview.timeToDecisionChange}
            icon={<SpeedIcon sx={{ color: 'warning.main' }} />}
            format="days"
            color="warning"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <MetricCard
            title={t('Viewing Conversion')}
            value={metrics.overview.viewingConversion}
            change={metrics.overview.viewingConversionChange}
            icon={<PropertyIcon sx={{ color: 'secondary.main' }} />}
            format="percent"
            color="secondary"
          />
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3}>
        {/* Application Trend */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t('Application Trend')}
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={metrics.applicationTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="applications"
                  stackId="1"
                  stroke="#8884d8"
                  fill="#8884d8"
                  name={t('Applications')}
                />
                <Area
                  type="monotone"
                  dataKey="accepted"
                  stackId="2"
                  stroke="#82ca9d"
                  fill="#82ca9d"
                  name={t('Accepted')}
                />
                <Area
                  type="monotone"
                  dataKey="rejected"
                  stackId="2"
                  stroke="#ff8484"
                  fill="#ff8484"
                  name={t('Rejected')}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Source Breakdown */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t('Application Sources')}
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={metrics.sourceBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {metrics.sourceBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Score Distribution */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t('Score Distribution')}
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={metrics.scoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <RechartsTooltip />
                <Bar dataKey="count" fill="#8884d8" name={t('Applicants')} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Insights */}
      <Paper sx={{ p: 3, mt: 3, bgcolor: 'info.light' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <InfoIcon color="info" />
          <Typography variant="h6">
            {t('Key Insights')}
          </Typography>
        </Box>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Typography variant="body2">
              • {t('Applications increased by {{percent}}% this month', { percent: 12 })}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2">
              • {t('Homegate generates the highest quality leads')}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2">
              • {t('Decision time improved by {{days}} days', { days: 0.5 })}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default MetricsOverview;