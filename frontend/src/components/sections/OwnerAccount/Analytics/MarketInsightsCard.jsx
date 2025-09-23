import React from 'react';
import PropTypes from 'prop-types';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Chip,
  LinearProgress,
  Divider
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip
} from 'recharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import HomeIcon from '@mui/icons-material/Home';
import LocationOnIcon from '@mui/icons-material/LocationOn';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];

const MarketInsightsCard = ({ data, loading }) => {
  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Market Insights
          </Typography>
          <LinearProgress />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.error) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Market Insights
          </Typography>
          <Typography color="text.secondary">
            {data?.error || 'No market data available'}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // Safely extract total_properties with default value
  const totalProperties = data.total_properties || 0;

  // Format currency
  const formatCurrency = (value) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Prepare bedroom distribution data for chart
  const bedroomData = Object.entries(data.bedroom_distribution || {}).map(([bedrooms, count]) => ({
    name: bedrooms === '0' ? 'Studio' : `${bedrooms} BR`,
    value: count,
    percentage: totalProperties > 0 ? ((count / totalProperties) * 100).toFixed(1) : '0'
  }));

  // Prepare property type data for pie chart
  const propertyTypeData = Object.entries(data.property_type_distribution || {})
    .slice(0, 6) // Show top 6 types
    .map(([type, count]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: count,
      percentage: totalProperties > 0 ? ((count / totalProperties) * 100).toFixed(1) : '0'
    }));

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TrendingUpIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">
            Market Insights
          </Typography>
          {data.location_info?.postal_code && (
            <Chip
              icon={<LocationOnIcon />}
              label={`${data.location_info.postal_code} (${data.location_info.radius_km}km)`}
              color="primary"
              variant="outlined"
              size="small"
              sx={{ ml: 'auto' }}
            />
          )}
        </Box>

        <Grid container spacing={3}>
          {/* Key Metrics */}
          <Grid item xs={12}>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="primary">
                    {totalProperties}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Properties
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="primary">
                    {formatCurrency(data.average_price)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg. Price
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="primary">
                    {formatCurrency(data.median_price)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Median Price
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="primary">
                    {formatCurrency(data.price_per_sqm_avg)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Price/m²
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Price Range */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Price Range
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" sx={{ minWidth: 60 }}>
                Min:
              </Typography>
              <Typography variant="h6" color="success.main">
                {formatCurrency(data.price_range?.min)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ minWidth: 60 }}>
                Max:
              </Typography>
              <Typography variant="h6" color="error.main">
                {formatCurrency(data.price_range?.max)}
              </Typography>
            </Box>
          </Grid>

          {/* Location Info */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Location Summary
            </Typography>
            {data.location_info?.postal_code ? (
              <Box>
                <Typography variant="body2" gutterBottom>
                  <strong>Area:</strong> {data.location_info.postal_code} ({data.location_info.radius_km}km radius)
                </Typography>
                <Typography variant="body2">
                  <strong>Properties in area:</strong> {data.location_info.properties_in_radius}
                </Typography>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Switzerland-wide data
              </Typography>
            )}
          </Grid>

          {/* Bedroom Distribution Chart */}
          {bedroomData.length > 0 && (
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Bedroom Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={bedroomData} role="img" aria-label="Bar chart showing bedroom distribution across properties">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [value, 'Properties']}
                    labelFormatter={(label) => `${label}: ${bedroomData.find(d => d.name === label)?.percentage}%`}
                  />
                  <Bar dataKey="value" fill="#1976d2" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Grid>
          )}

          {/* Property Type Distribution */}
          {propertyTypeData.length > 0 && (
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Property Type Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart role="img" aria-label="Pie chart showing property type distribution">
                  <Pie
                    data={propertyTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name} (${percentage}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {propertyTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Properties']} />
                </PieChart>
              </ResponsiveContainer>
            </Grid>
          )}

          {/* Canton Distribution */}
          {Object.keys(data.canton_distribution || {}).length > 0 && (
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Top Cantons
              </Typography>
              <Grid container spacing={1}>
                {Object.entries(data.canton_distribution)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 8)
                  .map(([canton, count]) => (
                    <Grid item key={canton}>
                      <Chip
                        label={`${canton} (${count})`}
                        variant="outlined"
                        size="small"
                      />
                    </Grid>
                  ))}
              </Grid>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
};

MarketInsightsCard.propTypes = {
  data: PropTypes.shape({
    total_properties: PropTypes.number,
    average_price: PropTypes.number,
    median_price: PropTypes.number,
    price_per_sqm_avg: PropTypes.number,
    price_range: PropTypes.object,
    bedroom_distribution: PropTypes.object,
    property_type_distribution: PropTypes.object,
    canton_distribution: PropTypes.object,
    location_info: PropTypes.object
  }),
  loading: PropTypes.bool
};

export default React.memo(MarketInsightsCard);