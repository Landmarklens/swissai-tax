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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Tooltip as MuiTooltip
} from '@mui/material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  Tooltip
} from 'recharts';
import AssessmentIcon from '@mui/icons-material/Assessment';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

const PropertyPerformanceCard = ({ data, loading }) => {
  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Property Performance
          </Typography>
          <LinearProgress />
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.properties) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Property Performance
          </Typography>
          <Typography color="text.secondary">
            No property performance data available
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const { summary = {}, properties = [] } = data;

  // Default values for summary if not provided
  const safeSum = {
    total_properties: 0,
    total_views: 0,
    total_leads: 0,
    total_viewings: 0,
    avg_conversion_rate: 0,
    ...summary
  };

  // Prepare chart data for conversion funnel
  const conversionData = properties.map((prop) => ({
    name: prop.title?.substring(0, 20) + '...' || `Property ${prop.property_id}`,
    views: prop.views || 0,
    leads: prop.leads || 0,
    viewings: prop.scheduled_viewings || 0,
    selections: prop.selected_leads || 0
  }));

  // Color coding for conversion rates
  const getConversionColor = (rate) => {
    if (rate >= 15) return 'success.main';
    if (rate >= 10) return 'warning.main';
    return 'error.main';
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      ad_active: { color: 'success', label: 'Active' },
      non_active: { color: 'default', label: 'Inactive' },
      pending_viewing: { color: 'warning', label: 'Pending Viewing' },
      rented: { color: 'info', label: 'Rented' }
    };
    
    const config = statusConfig[status] || { color: 'default', label: status };
    return <Chip size="small" color={config.color} label={config.label} />;
  };

  const formatCurrency = (value) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <AssessmentIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">
            Property Performance
          </Typography>
          <Box sx={{ ml: 'auto' }}>
            <Chip
              label={`${safeSum.total_properties} Properties`}
              color="primary"
              variant="outlined"
              size="small"
            />
          </Box>
        </Box>

        {/* Summary Metrics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 1 }}>
                <VisibilityIcon />
              </Avatar>
              <Typography variant="h4" color="primary">
                {(safeSum.total_views || 0).toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Views
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Avg. {(safeSum.avg_views_per_property || 0).toFixed(1)}/property
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Avatar sx={{ bgcolor: 'success.main', mx: 'auto', mb: 1 }}>
                <PersonIcon />
              </Avatar>
              <Typography variant="h4" color="success.main">
                {(safeSum.total_leads || 0).toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Leads
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Avg. {(safeSum.avg_leads_per_property || 0).toFixed(1)}/property
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Avatar sx={{ bgcolor: 'warning.main', mx: 'auto', mb: 1 }}>
                <CalendarTodayIcon />
              </Avatar>
              <Typography variant="h4" color="warning.main">
                {(safeSum.total_viewings || 0).toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Viewings
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Avatar sx={{ bgcolor: 'info.main', mx: 'auto', mb: 1 }}>
                <TrendingUpIcon />
              </Avatar>
              <Typography variant="h4" color="info.main">
                {(safeSum.overall_conversion_rate || 0).toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Conversion Rate
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Conversion Funnel Chart */}
        {conversionData.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" gutterBottom>
              Conversion Funnel by Property
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={conversionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    value,
                    name.charAt(0).toUpperCase() + name.slice(1)
                  ]}
                />
                <Area type="monotone" dataKey="views" stackId="1" stroke="#1976d2" fill="#e3f2fd" />
                <Area type="monotone" dataKey="leads" stackId="1" stroke="#388e3c" fill="#e8f5e8" />
                <Area type="monotone" dataKey="viewings" stackId="1" stroke="#f57c00" fill="#fff3e0" />
                <Area type="monotone" dataKey="selections" stackId="1" stroke="#d32f2f" fill="#ffebee" />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        )}

        {/* Property Details Table */}
        <Typography variant="subtitle1" gutterBottom>
          Detailed Performance
        </Typography>
        <TableContainer sx={{ maxHeight: 400 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>Property</strong></TableCell>
                <TableCell align="center"><strong>Status</strong></TableCell>
                <TableCell align="right"><strong>Price</strong></TableCell>
                <TableCell align="right"><strong>Views</strong></TableCell>
                <TableCell align="right"><strong>Leads</strong></TableCell>
                <TableCell align="right"><strong>Viewings</strong></TableCell>
                <TableCell align="right"><strong>Selections</strong></TableCell>
                <TableCell align="center"><strong>Conversion</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {properties.map((property) => (
                <TableRow key={property.property_id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {property.title || `Property ${property.property_id}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {property.city}
                      </Typography>
                    </Box>
                  </TableCell>
                  
                  <TableCell align="center">
                    {getStatusChip(property.status)}
                  </TableCell>
                  
                  <TableCell align="right">
                    <Typography variant="body2">
                      {formatCurrency(property.price_chf)}
                    </Typography>
                  </TableCell>
                  
                  <TableCell align="right">
                    <Typography variant="body2">
                      {property.views.toLocaleString()}
                    </Typography>
                  </TableCell>
                  
                  <TableCell align="right">
                    <Typography variant="body2" color="success.main">
                      {property.leads}
                    </Typography>
                  </TableCell>
                  
                  <TableCell align="right">
                    <Typography variant="body2">
                      {property.scheduled_viewings}
                    </Typography>
                  </TableCell>
                  
                  <TableCell align="right">
                    <Typography variant="body2" color="primary">
                      {property.selected_leads}
                    </Typography>
                  </TableCell>
                  
                  <TableCell align="center">
                    <MuiTooltip title="View → Lead conversion rate">
                      <Chip
                        label={`${(property.conversion_rates?.view_to_lead || 0).toFixed(1)}%`}
                        size="small"
                        sx={{ 
                          color: getConversionColor(property.conversion_rates?.view_to_lead || 0),
                          borderColor: getConversionColor(property.conversion_rates?.view_to_lead || 0)
                        }}
                        variant="outlined"
                      />
                    </MuiTooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {properties.length === 0 && (
          <Box textAlign="center" py={4}>
            <Typography color="text.secondary">
              No properties found. Add properties to see performance data.
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

PropertyPerformanceCard.propTypes = {
  data: PropTypes.shape({
    summary: PropTypes.object,
    properties: PropTypes.array
  }),
  loading: PropTypes.bool
};

export default React.memo(PropertyPerformanceCard);