import React, { useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  useTheme,
  Chip,
  Stack
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Remove as TrendingFlat,
  Home,
  Apartment,
  House,
  Villa,
  LocationCity
} from '@mui/icons-material';

const MarketVisualizationCharts = ({ marketData, properties = [] }) => {
  const theme = useTheme();

  // Color palette for charts
  const colors = {
    primary: theme.palette.primary.main,
    secondary: theme.palette.secondary.main,
    success: theme.palette.success.main,
    warning: theme.palette.warning.main,
    error: theme.palette.error.main,
    info: theme.palette.info.main,
    gradient1: ['#667eea', '#764ba2'],
    gradient2: ['#f093fb', '#f5576c'],
    gradient3: ['#4facfe', '#00f2fe'],
    gradient4: ['#43e97b', '#38f9d7']
  };

  // Process data for visualizations
  const chartData = useMemo(() => {
    if (!marketData) return {};

    // Price distribution by property type
    const priceByType = {};
    const typeCount = {};
    const bedroomDistribution = {};
    const cantonDistribution = {};
    const priceRanges = {
      '0-1000': 0,
      '1000-2000': 0,
      '2000-3000': 0,
      '3000-4000': 0,
      '4000-5000': 0,
      '5000+': 0
    };

    // Process properties data
    properties.forEach(prop => {
      // Price by type
      const type = prop.property_type || 'Unknown';
      if (!priceByType[type]) {
        priceByType[type] = [];
        typeCount[type] = 0;
      }
      priceByType[type].push(prop.price_chf);
      typeCount[type]++;

      // Bedroom distribution
      const bedrooms = prop.bedrooms || 'Studio';
      bedroomDistribution[bedrooms] = (bedroomDistribution[bedrooms] || 0) + 1;

      // Canton distribution
      const canton = prop.canton || 'Unknown';
      cantonDistribution[canton] = (cantonDistribution[canton] || 0) + 1;

      // Price ranges
      const price = prop.price_chf;
      if (price < 1000) priceRanges['0-1000']++;
      else if (price < 2000) priceRanges['1000-2000']++;
      else if (price < 3000) priceRanges['2000-3000']++;
      else if (price < 4000) priceRanges['3000-4000']++;
      else if (price < 5000) priceRanges['4000-5000']++;
      else priceRanges['5000+']++;
    });

    // Calculate averages
    const avgPriceByType = Object.entries(priceByType).map(([type, prices]) => ({
      type,
      avgPrice: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
      count: typeCount[type]
    }));

    // Format bedroom distribution
    const bedroomData = Object.entries(bedroomDistribution)
      .sort((a, b) => {
        if (a[0] === 'Studio') return -1;
        if (b[0] === 'Studio') return 1;
        return Number(a[0]) - Number(b[0]);
      })
      .map(([bedrooms, count]) => ({
        bedrooms: bedrooms === 'Studio' ? 'Studio' : `${bedrooms} BR`,
        count,
        percentage: Math.round((count / properties.length) * 100)
      }));

    // Format canton data
    const cantonData = Object.entries(cantonDistribution)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10) // Top 10 cantons
      .map(([canton, count]) => ({
        canton,
        count,
        percentage: Math.round((count / properties.length) * 100)
      }));

    // Format price range data
    const priceRangeData = Object.entries(priceRanges).map(([range, count]) => ({
      range,
      count,
      percentage: Math.round((count / properties.length) * 100)
    }));

    // Time series data (if available from marketData)
    const timeSeriesData = marketData.price_trends?.map(trend => ({
      date: new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      price: trend.average_price,
      volume: trend.listing_count
    })) || [];

    // Market metrics for radar chart
    const radarData = [
      {
        metric: 'Price Level',
        value: marketData.market_summary?.price_index || 50,
        fullMark: 100
      },
      {
        metric: 'Demand',
        value: marketData.market_summary?.demand_index || 50,
        fullMark: 100
      },
      {
        metric: 'Supply',
        value: marketData.market_summary?.supply_index || 50,
        fullMark: 100
      },
      {
        metric: 'Competition',
        value: marketData.market_summary?.competition_index || 50,
        fullMark: 100
      },
      {
        metric: 'Growth',
        value: marketData.market_summary?.growth_index || 50,
        fullMark: 100
      }
    ];

    return {
      avgPriceByType,
      bedroomData,
      cantonData,
      priceRangeData,
      timeSeriesData,
      radarData
    };
  }, [marketData, properties]);

  const formatCurrency = (value) => `CHF ${value.toLocaleString()}`;
  const formatPercentage = (value) => `${value}%`;

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 1.5 }}>
          <Typography variant="body2" fontWeight="bold">
            {label}
          </Typography>
          {payload.map((entry, index) => (
            <Typography key={index} variant="body2" color={entry.color}>
              {entry.name}: {entry.name.includes('Price') ? formatCurrency(entry.value) : entry.value}
            </Typography>
          ))}
        </Paper>
      );
    }
    return null;
  };

  const PropertyTypeIcon = ({ type }) => {
    switch (type?.toLowerCase()) {
      case 'apartment': return <Apartment />;
      case 'house': return <House />;
      case 'villa': return <Villa />;
      case 'studio': return <LocationCity />;
      default: return <Home />;
    }
  };

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Average Price by Property Type */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Average Price by Property Type
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.avgPriceByType}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis dataKey="type" />
                  <YAxis tickFormatter={formatCurrency} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="avgPrice" fill={colors.primary} radius={[8, 8, 0, 0]}>
                    {chartData.avgPriceByType?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors.gradient1[index % 2]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Bedroom Distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Properties by Bedroom Count
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData.bedroomData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.bedrooms}: ${entry.percentage}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {chartData.bedroomData?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={[colors.primary, colors.secondary, colors.success, colors.warning, colors.info][index % 5]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Price Range Distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Price Range Distribution (CHF/month)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData.priceRangeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke={colors.primary}
                    fill={`url(#colorGradient)`}
                    strokeWidth={2}
                  />
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={colors.primary} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={colors.primary} stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Cantons */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Locations by Canton
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.cantonData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis type="number" />
                  <YAxis dataKey="canton" type="category" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill={colors.secondary} radius={[0, 8, 8, 0]}>
                    {chartData.cantonData?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors.gradient3[index % 2]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Price Trends Over Time */}
        {chartData.timeSeriesData?.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Market Price Trends
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData.timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" tickFormatter={formatCurrency} />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="price" 
                      stroke={colors.primary}
                      strokeWidth={3}
                      dot={{ fill: colors.primary, r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Average Price"
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="volume" 
                      stroke={colors.secondary}
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: colors.secondary, r: 3 }}
                      name="Listing Volume"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Market Performance Radar */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Market Performance Indicators
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={chartData.radarData}>
                  <PolarGrid stroke={theme.palette.divider} />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar 
                    name="Current Market" 
                    dataKey="value" 
                    stroke={colors.primary}
                    fill={colors.primary}
                    fillOpacity={0.6}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Market Summary Stats */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Market Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box textAlign="center" p={2}>
                    <Typography variant="h4" color="primary">
                      {properties.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Properties
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box textAlign="center" p={2}>
                    <Typography variant="h4" color="secondary">
                      CHF {Math.round(
                        properties.reduce((sum, p) => sum + (p.price_chf || 0), 0) / properties.length
                      ).toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Average Price
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box textAlign="center" p={2}>
                    <Typography variant="h4" color="success.main">
                      {chartData.avgPriceByType?.length || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Property Types
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box textAlign="center" p={2}>
                    <Typography variant="h4" color="warning.main">
                      {chartData.cantonData?.length || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Cantons
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MarketVisualizationCharts;