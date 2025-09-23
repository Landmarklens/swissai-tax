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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip
} from 'recharts';
import EventIcon from '@mui/icons-material/Event';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import CancelIcon from '@mui/icons-material/Cancel';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

const COLORS = ['#4caf50', '#ff9800', '#2196f3', '#f44336', '#9c27b0', '#607d8b'];

const ViewingAnalyticsCard = ({ data, loading }) => {
  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Viewing Analytics
          </Typography>
          <LinearProgress />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.message) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Viewing Analytics
          </Typography>
          <Typography color="text.secondary">
            {data?.message || 'No viewing data available'}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const {
    total_slots,
    status_distribution,
    slots_by_property,
    average_capacity_utilization,
    utilization_details
  } = data;

  // Prepare status distribution for pie chart
  const statusData = Object.entries(status_distribution || {}).map(([status, count]) => ({
    name: status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: count,
    percentage: total_slots > 0 ? ((count / total_slots) * 100).toFixed(1) : '0'
  }));

  // Prepare property utilization data for bar chart
  const propertyData = Object.entries(slots_by_property || {}).map(([propertyId, propData]) => ({
    property: propData.property_title.length > 20 
      ? propData.property_title.substring(0, 20) + '...'
      : propData.property_title,
    total: propData.total_slots,
    booked: propData.booked_slots,
    completed: propData.completed_slots,
    utilization: propData.total_slots > 0 
      ? ((propData.booked_slots / propData.total_slots) * 100).toFixed(1)
      : 0
  }));

  const getStatusIcon = (status) => {
    const icons = {
      available: <EventIcon />,
      partially_booked: <PendingIcon />,
      fully_booked: <CheckCircleIcon />,
      completed: <CheckCircleIcon />,
      cancelled: <CancelIcon />
    };
    return icons[status.replace(/\s/g, '_').toLowerCase()] || <EventIcon />;
  };

  const getStatusColor = (status) => {
    const colors = {
      available: 'primary',
      'partially booked': 'warning',
      'fully booked': 'success',
      completed: 'info',
      cancelled: 'error'
    };
    return colors[status.toLowerCase()] || 'default';
  };

  const getUtilizationColor = (utilization) => {
    if (utilization >= 80) return 'success.main';
    if (utilization >= 60) return 'warning.main';
    return 'error.main';
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <EventIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">
            Viewing Analytics
          </Typography>
          <Box sx={{ ml: 'auto' }}>
            <Chip
              label={`${total_slots} Slots`}
              color="primary"
              variant="outlined"
              size="small"
            />
          </Box>
        </Box>

        <Grid container spacing={3}>
          {/* Key Metrics */}
          <Grid item xs={12}>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 1 }}>
                    <EventIcon />
                  </Avatar>
                  <Typography variant="h4" color="primary">
                    {total_slots}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Slots
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <Avatar sx={{ bgcolor: 'success.main', mx: 'auto', mb: 1 }}>
                    <CheckCircleIcon />
                  </Avatar>
                  <Typography variant="h4" color="success.main">
                    {status_distribution?.completed || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completed
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <Avatar sx={{ bgcolor: 'warning.main', mx: 'auto', mb: 1 }}>
                    <PendingIcon />
                  </Avatar>
                  <Typography variant="h4" color="warning.main">
                    {(status_distribution?.partially_booked || 0) + (status_distribution?.fully_booked || 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Booked
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <Avatar sx={{ bgcolor: 'info.main', mx: 'auto', mb: 1 }}>
                    <TrendingUpIcon />
                  </Avatar>
                  <Typography variant="h4" color="info.main">
                    {average_capacity_utilization}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg. Utilization
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Grid>

          {/* Utilization Details */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle1" gutterBottom>
                Capacity Utilization
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Box textAlign="center">
                    <Typography variant="h6" color="success.main">
                      {utilization_details.max}%
                    </Typography>
                    <Typography variant="caption">Peak</Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box textAlign="center">
                    <Typography variant="h6" color="primary.main">
                      {utilization_details.avg}%
                    </Typography>
                    <Typography variant="caption">Average</Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box textAlign="center">
                    <Typography variant="h6" color="error.main">
                      {utilization_details.min}%
                    </Typography>
                    <Typography variant="caption">Minimum</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Status Distribution Pie Chart */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Slot Status Distribution
            </Typography>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name} (${percentage}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value) => [value, 'Slots']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Box textAlign="center" py={4}>
                <Typography color="text.secondary">
                  No status data available
                </Typography>
              </Box>
            )}
          </Grid>

          {/* Property Utilization Chart */}
          {propertyData.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Utilization by Property
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={propertyData} margin={{ bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="property" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={12}
                  />
                  <YAxis />
                  <RechartsTooltip 
                    formatter={(value, name) => [
                      name === 'utilization' ? `${value}%` : value,
                      name.charAt(0).toUpperCase() + name.slice(1)
                    ]}
                  />
                  <Bar dataKey="total" fill="#e3f2fd" name="Total Slots" />
                  <Bar dataKey="booked" fill="#1976d2" name="Booked Slots" />
                  <Bar dataKey="completed" fill="#4caf50" name="Completed" />
                </BarChart>
              </ResponsiveContainer>
            </Grid>
          )}

          {/* Property Details Table */}
          {Object.keys(slots_by_property || {}).length > 0 && (
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Property Breakdown
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Property</strong></TableCell>
                      <TableCell align="right"><strong>Total Slots</strong></TableCell>
                      <TableCell align="right"><strong>Booked</strong></TableCell>
                      <TableCell align="right"><strong>Completed</strong></TableCell>
                      <TableCell align="center"><strong>Utilization</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {propertyData.map((property, index) => (
                      <TableRow key={index} hover>
                        <TableCell>
                          <Typography variant="body2">
                            {property.property}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {property.total}
                        </TableCell>
                        <TableCell align="right">
                          <Typography color="primary">
                            {property.booked}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography color="success.main">
                            {property.completed}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title={`${property.utilization}% capacity utilization`}>
                            <Chip
                              label={`${property.utilization}%`}
                              size="small"
                              sx={{ 
                                color: getUtilizationColor(parseFloat(property.utilization)),
                                borderColor: getUtilizationColor(parseFloat(property.utilization))
                              }}
                              variant="outlined"
                            />
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          )}

          {/* Status Legend */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Status Legend
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {Object.entries(status_distribution || {}).map(([status, count]) => (
                <Chip
                  key={status}
                  icon={getStatusIcon(status)}
                  label={`${status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} (${count})`}
                  color={getStatusColor(status.replace(/_/g, ' '))}
                  variant="outlined"
                  size="small"
                />
              ))}
            </Box>
          </Grid>
        </Grid>

        {total_slots === 0 && (
          <Box textAlign="center" py={4}>
            <Typography color="text.secondary">
              No viewing slots found. Create viewing slots to see analytics.
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

ViewingAnalyticsCard.propTypes = {
  data: PropTypes.shape({
    total_slots: PropTypes.number,
    status_distribution: PropTypes.object,
    slots_by_property: PropTypes.object,
    average_capacity_utilization: PropTypes.number,
    utilization_details: PropTypes.object,
    message: PropTypes.string
  }),
  loading: PropTypes.bool
};

export default React.memo(ViewingAnalyticsCard);