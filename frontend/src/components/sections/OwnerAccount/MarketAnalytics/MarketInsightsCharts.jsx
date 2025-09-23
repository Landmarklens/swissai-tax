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
  Stack,
  Tooltip,
  IconButton,
  Alert,
  LinearProgress,
  Divider
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
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area,
  RadialBarChart,
  RadialBar
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Remove as TrendingFlat,
  Info as InfoIcon,
  AttachMoney,
  Speed,
  CompareArrows,
  Timer,
  House,
  Warning
} from '@mui/icons-material';

const MarketInsightsCharts = ({ marketData, selectedProperty, dealType = 'rent' }) => {
  const theme = useTheme();
  
  // Determine if this is a sale or rental
  const isSale = dealType === 'buy' || dealType === 'sale';
  const priceLabel = isSale ? 'Sale Price' : 'Monthly Rent';
  const currencyPrefix = 'CHF';

  // Neutral color palette
  const colors = {
    primary: '#6B7280', // Neutral gray
    secondary: '#9CA3AF', // Light gray
    good: '#10B981', // Soft green
    warning: '#F59E0B', // Soft amber
    bad: '#EF4444', // Soft red
    neutral: theme.palette.grey[500],
    chartColors: ['#6B7280', '#9CA3AF', '#D1D5DB', '#E5E7EB', '#F3F4F6', '#F9FAFB'],
    barChart: '#8B92A3' // Muted blue-gray for bars
  };

  // Process market data for insights
  const insights = useMemo(() => {
    if (!marketData?.market_analytics) return null;

    const analytics = marketData.market_analytics;
    const propertyType = selectedProperty?.property_type || 'Apartment';
    const bedrooms = selectedProperty?.bedrooms || 2;
    const currentPrice = selectedProperty?.price_chf || 0;
    
    // Validate and adjust prices for rental properties
    // If average price is above 10,000 for rentals, it's likely annual or sale price
    let adjustedAvgPrice = analytics.average_price;
    let adjustedMedianPrice = analytics.median_price;
    
    if (!isSale && adjustedAvgPrice > 10000) {
      // Likely annual rent or sale price mistakenly shown for rental
      // Divide by 12 if it looks like annual rent
      adjustedAvgPrice = Math.round(adjustedAvgPrice / 12);
      adjustedMedianPrice = Math.round(adjustedMedianPrice / 12);
    }

    // Calculate price position
    const pricePosition = currentPrice > 0 && adjustedAvgPrice > 0
      ? ((currentPrice - adjustedAvgPrice) / adjustedAvgPrice * 100).toFixed(1)
      : 0;

    // Supply analysis - mock data structure (would come from SQL query)
    const supplyData = {
      total: analytics.total_properties || 0,
      similar: Math.floor((analytics.total_properties || 0) * 0.3), // Properties with same bedrooms
      newThisWeek: Math.floor((analytics.total_properties || 0) * 0.15),
      avgDaysOnMarket: 28
    };

    // Price distribution for competitiveness
    const priceDistribution = [
      { range: 'Below Market (-10%)', count: 15, percentage: 20 },
      { range: 'At Market (±10%)', count: 45, percentage: 60 },
      { range: 'Above Market (+10%)', count: 15, percentage: 20 }
    ];

    // Market velocity
    const marketVelocity = [
      { age: 'New (< 1 week)', count: 12, avgPrice: adjustedAvgPrice * 1.05 },
      { age: 'Fresh (< 1 month)', count: 25, avgPrice: adjustedAvgPrice },
      { age: 'Stale (1-3 months)', count: 8, avgPrice: adjustedAvgPrice * 0.95 },
      { age: 'Very Stale (> 3 months)', count: 3, avgPrice: adjustedAvgPrice * 0.9 }
    ];

    return {
      pricePosition,
      supplyData,
      priceDistribution,
      marketVelocity,
      avgPrice: adjustedAvgPrice,
      medianPrice: adjustedMedianPrice,
      priceRange: analytics.price_range
    };
  }, [marketData, selectedProperty]);

  if (!insights) {
    return (
      <Alert severity="info">
        No market data available. Select a property to see insights.
      </Alert>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 1, backgroundColor: 'rgba(255,255,255,0.95)' }}>
          <Typography variant="caption" fontWeight="bold">
            {label}
          </Typography>
          {payload.map((entry, index) => (
            <Typography key={index} variant="caption" display="block" color={entry.color}>
              {entry.name}: {typeof entry.value === 'number' 
                ? entry.value.toLocaleString() 
                : entry.value}
            </Typography>
          ))}
        </Paper>
      );
    }
    return null;
  };

  return (
    <Grid container spacing={3}>

      {/* Supply & Competition - Half width to go side by side with Optimal Pricing */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold">
                Supply & Competition
              </Typography>
              <Tooltip title="Shows current supply levels and competition in your area">
                <IconButton size="small">
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>

            <Grid container spacing={2} mb={2}>
              <Grid item xs={6}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: theme.palette.grey[50] }}>
                  <Typography variant="h4" sx={{ color: '#3E63DD', fontWeight: 'bold' }}>
                    {insights.supplyData.total}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#374151', fontWeight: 600 }}>
                    Total Active {isSale ? 'For Sale' : 'For Rent'}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: theme.palette.grey[50] }}>
                  <Typography variant="h4" sx={{ color: '#10B981', fontWeight: 'bold' }}>
                    {insights.supplyData.similar}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#374151', fontWeight: 600 }}>
                    Direct Competitors
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* Competition Level Gauge */}
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Competition Level
              </Typography>
              <Stack direction="row" spacing={1}>
                {['Low', 'Medium', 'High'].map((level, index) => (
                  <Box
                    key={level}
                    sx={{
                      flex: 1,
                      height: 40,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: insights.supplyData.similar < 5 && index === 0 ? colors.good :
                              insights.supplyData.similar < 15 && index === 1 ? colors.warning :
                              insights.supplyData.similar >= 15 && index === 2 ? colors.bad :
                              theme.palette.grey[200],
                      color: insights.supplyData.similar < 5 && index === 0 ? 'white' :
                            insights.supplyData.similar < 15 && index === 1 ? 'white' :
                            insights.supplyData.similar >= 15 && index === 2 ? 'white' :
                            theme.palette.text.disabled,
                      borderRadius: 1
                    }}
                  >
                    <Typography variant="caption" fontWeight="bold">
                      {level}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>

            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">New This Week:</Typography>
                <Chip 
                  label={`${insights.supplyData.newThisWeek} ${isSale ? 'listings' : 'rentals'}`}
                  size="small"
                  color={insights.supplyData.newThisWeek > 10 ? 'warning' : 'default'}
                />
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Avg. Days on Market:</Typography>
                <Chip 
                  label={`${insights.supplyData.avgDaysOnMarket} days`}
                  size="small"
                  color={insights.supplyData.avgDaysOnMarket > 30 ? 'error' : 'success'}
                />
              </Stack>
            </Stack>

            <Alert severity="info" icon={<InfoIcon />} sx={{ mt: 2 }}>
              <Typography variant="caption">
                <strong>How to interpret:</strong> {insights.supplyData.similar < 5 
                  ? `Low competition - you can ${isSale ? 'ask' : 'charge'} slightly above market.` 
                  : insights.supplyData.similar < 15
                  ? `Moderate competition - ${isSale ? 'price' : 'set rent'} competitively to stand out.`
                  : `High competition - consider ${isSale ? 'pricing' : 'setting rent'} below market or highlighting unique features.`}
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      </Grid>


      {/* Optimal Pricing Range - Half width to go side by side with Supply & Competition */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold">
                Optimal Pricing Range
              </Typography>
              <Tooltip title={`Recommended ${priceLabel.toLowerCase()} range based on market data`}>
                <IconButton size="small">
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>

            <Box sx={{ position: 'relative', height: 120, mb: 3 }}>
              {/* Calculate dynamic range based on actual prices */}
              {(() => {
                const quickPrice = (insights.avgPrice || 0) * 0.92;
                const marketPrice = insights.avgPrice || 0;
                const premiumPrice = (insights.avgPrice || 0) * 1.08;
                const currentPrice = selectedProperty?.price_chf || marketPrice;
                
                // Calculate min and max for scale with some padding
                const allPrices = [quickPrice, marketPrice, premiumPrice, currentPrice];
                const minPrice = Math.min(...allPrices) * 0.95;
                const maxPrice = Math.max(...allPrices) * 1.05;
                const priceRange = maxPrice - minPrice;
                
                // Calculate positions on scale (0-100%)
                const quickPos = ((quickPrice - minPrice) / priceRange) * 100;
                const marketPos = ((marketPrice - minPrice) / priceRange) * 100;
                const premiumPos = ((premiumPrice - minPrice) / priceRange) * 100;
                const currentPos = ((currentPrice - minPrice) / priceRange) * 100;
                
                return (
                  <>
                    {/* Price range visualization */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 40,
                        left: 0,
                        right: 0,
                        height: 40,
                        borderRadius: 20,
                        background: `linear-gradient(90deg, 
                          ${colors.bad} 0%, 
                          ${colors.bad} ${quickPos - 5}%, 
                          ${colors.warning} ${quickPos}%, 
                          ${colors.good} ${marketPos - 10}%, 
                          ${colors.good} ${marketPos + 10}%, 
                          ${colors.warning} ${premiumPos}%, 
                          ${colors.bad} ${premiumPos + 5}%, 
                          ${colors.bad} 100%)`
                      }}
                    />
                    
                    {/* Markers */}
                    <Box sx={{ position: 'absolute', top: 90, left: 0, right: 0 }}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="caption">
                          {currencyPrefix} {Math.round(minPrice).toLocaleString()}
                        </Typography>
                        <Typography variant="caption" fontWeight="bold">
                          {currencyPrefix} {Math.round(marketPrice).toLocaleString()}
                        </Typography>
                        <Typography variant="caption">
                          {currencyPrefix} {Math.round(maxPrice).toLocaleString()}
                        </Typography>
                      </Stack>
                    </Box>

                    {/* Current price indicator */}
                    {selectedProperty?.price_chf && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 30,
                          left: `${currentPos}%`,
                          transform: 'translateX(-50%)'
                        }}
                      >
                        <Box
                          sx={{
                            width: 0,
                            height: 0,
                            borderLeft: '10px solid transparent',
                            borderRight: '10px solid transparent',
                            borderTop: `10px solid ${theme.palette.primary.main}`
                          }}
                        />
                        <Typography variant="caption" sx={{ position: 'absolute', top: -25, left: -30, width: 60, textAlign: 'center' }}>
                          Your {isSale ? 'Price' : 'Rent'}
                        </Typography>
                      </Box>
                    )}
                  </>
                );
              })()}
            </Box>

            <Divider sx={{ my: 2 }} />

            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">{isSale ? 'Quick Sale' : 'Quick Rent'} ({isSale ? '30 days' : '2 weeks'}):</Typography>
                <Typography variant="body2" fontWeight="bold" color="primary">
                  {currencyPrefix} {((insights.avgPrice || 0) * 0.92).toLocaleString()}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Market Rate ({isSale ? '60-90 days' : '3-4 weeks'}):</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {currencyPrefix} {(insights.avgPrice || 0).toLocaleString()}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Premium ({isSale ? '90+ days' : '4-6 weeks'}):</Typography>
                <Typography variant="body2" fontWeight="bold" color="text.secondary">
                  {currencyPrefix} {((insights.avgPrice || 0) * 1.08).toLocaleString()}
                </Typography>
              </Stack>
            </Stack>

            <Alert severity="info" icon={<InfoIcon />} sx={{ mt: 2 }}>
              <Typography variant="caption">
                <strong>How to interpret:</strong> {isSale ? 'Price' : 'Set rent'} 8% below market for quick {isSale ? 'sale' : 'rental'}, 
                or up to 8% above if your property has premium features. 
                The sweet spot is within ±5% of market average.
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      </Grid>

      {/* Market Velocity Section */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold">
                Market Velocity
              </Typography>
              <Tooltip title="Shows how fast properties are moving in the market">
                <IconButton size="small">
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, bgcolor: theme.palette.grey[50] }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Speed color="primary" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Avg. Days on Market
                      </Typography>
                      <Typography variant="h6">
                        {insights.supplyData.avgDaysOnMarket} days
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>

              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, bgcolor: theme.palette.grey[50] }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Timer color="primary" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {isSale ? 'Quick Sale' : 'Quick Rent'} Timeframe
                      </Typography>
                      <Typography variant="h6">
                        {isSale ? '< 30 days' : '< 2 weeks'}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>

              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, bgcolor: theme.palette.grey[50] }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <House color="primary" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Market Activity
                      </Typography>
                      <Typography variant="h6">
                        {insights.supplyData.similar > 10 ? 'High' : insights.supplyData.similar > 5 ? 'Moderate' : 'Low'}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default MarketInsightsCharts;