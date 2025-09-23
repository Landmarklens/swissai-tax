import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Tab,
  Tabs,
  Button,
  CircularProgress,
  Alert,
  Paper,
  IconButton,
  Tooltip,
  Divider,
  Stack,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  TrendingUp as TrendingUpIcon,
  Build as BuildIcon,
  Analytics as AnalyticsIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Psychology as AIIcon,
  Speed as SpeedIcon,
  AttachMoney as MoneyIcon,
  ShowChart as ChartIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

// Import AI components
import AIRentPredictor from './AIRentPredictor';
import RenovationImpactSimulator from './RenovationImpactSimulator';

const AIAnalyticsDashboard = ({ propertyId, cantonFilter, propertyTypeFilter }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [marketTrends, setMarketTrends] = useState(null);
  const [demandForecast, setDemandForecast] = useState(null);
  const [competitiveAnalysis, setCompetitiveAnalysis] = useState(null);
  const [performanceMetrics, setPerformanceMetrics] = useState(null);
  const [dealType, setDealType] = useState('rent');
  const { token } = useAuth();

  // Fetch market trends
  const fetchMarketTrends = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/ai-analytics/market-trends`,
        {
          params: {
            canton: cantonFilter,
            property_type: propertyTypeFilter,
            deal_type: dealType,
            period_days: 90,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setMarketTrends(response.data);
    } catch (err) {
      console.error('Error fetching market trends:', err);
      setError('Failed to load market trends');
    } finally {
      setLoading(false);
    }
  };

  // Fetch demand forecast
  const fetchDemandForecast = async () => {
    if (!cantonFilter) return;
    
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/ai-analytics/demand-forecast`,
        {
          params: {
            canton: cantonFilter,
            property_type: propertyTypeFilter,
            forecast_days: 30,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setDemandForecast(response.data);
    } catch (err) {
      console.error('Error fetching demand forecast:', err);
    }
  };

  // Fetch competitive analysis
  const fetchCompetitiveAnalysis = async () => {
    if (!propertyId) return;
    
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/ai-analytics/competitive-analysis/${propertyId}`,
        {
          params: {
            radius_km: 5,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setCompetitiveAnalysis(response.data);
    } catch (err) {
      console.error('Error fetching competitive analysis:', err);
    }
  };

  useEffect(() => {
    fetchMarketTrends();
    fetchDemandForecast();
    fetchCompetitiveAnalysis();
  }, [cantonFilter, propertyTypeFilter, dealType, propertyId]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleRefresh = () => {
    fetchMarketTrends();
    fetchDemandForecast();
    fetchCompetitiveAnalysis();
  };

  const renderMarketOverview = () => (
    <Grid container spacing={3}>
      {/* Market Summary Cards */}
      <Grid item xs={12}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography color="textSecondary" variant="subtitle2">
                      Market Direction
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      {marketTrends?.summary?.trend_direction || 'N/A'}
                    </Typography>
                    <Chip
                      label={`${marketTrends?.summary?.price_change_percent || 0}%`}
                      color={marketTrends?.summary?.price_change_percent > 0 ? 'success' : 'error'}
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  </Box>
                  <TrendingUpIcon color="primary" fontSize="large" />
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography color="textSecondary" variant="subtitle2">
                      Average Price
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      CHF {marketTrends?.summary?.current_avg_price?.toLocaleString() || 0}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Median: CHF {marketTrends?.summary?.current_median_price?.toLocaleString() || 0}
                    </Typography>
                  </Box>
                  <MoneyIcon color="primary" fontSize="large" />
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography color="textSecondary" variant="subtitle2">
                      Market Activity
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      {marketTrends?.summary?.market_activity || 'N/A'}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {marketTrends?.summary?.total_listings || 0} listings
                    </Typography>
                  </Box>
                  <ChartIcon color="primary" fontSize="large" />
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography color="textSecondary" variant="subtitle2">
                      Demand Level
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      {demandForecast?.current_metrics?.demand_level || 'N/A'}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {demandForecast?.current_metrics?.trend_percent || 0}% trend
                    </Typography>
                  </Box>
                  <SpeedIcon color="primary" fontSize="large" />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Grid>

      {/* Market Trends Chart */}
      {marketTrends?.weekly_trends && (
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Price Trends (Weekly)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={marketTrends.weekly_trends.reverse()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="week" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis />
                  <RechartsTooltip 
                    formatter={(value) => `CHF ${value?.toLocaleString()}`}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="avg_price"
                    stroke="#8884d8"
                    fill="#8884d8"
                    name="Average Price"
                  />
                  <Area
                    type="monotone"
                    dataKey="median_price"
                    stroke="#82ca9d"
                    fill="#82ca9d"
                    name="Median Price"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      )}

      {/* Demand Forecast Chart */}
      {demandForecast?.forecast && (
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Demand Forecast (30 Days)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={demandForecast.forecast.slice(0, 30)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).getDate()}
                  />
                  <YAxis />
                  <RechartsTooltip />
                  <Line
                    type="monotone"
                    dataKey="predicted_listings"
                    stroke="#ff7300"
                    name="Predicted Listings"
                  />
                  <Line
                    type="monotone"
                    dataKey="confidence_interval.upper"
                    stroke="#ccc"
                    strokeDasharray="3 3"
                    name="Upper Bound"
                  />
                  <Line
                    type="monotone"
                    dataKey="confidence_interval.lower"
                    stroke="#ccc"
                    strokeDasharray="3 3"
                    name="Lower Bound"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      )}

      {/* AI Insights */}
      {marketTrends?.ai_insights && (
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                <AIIcon color="primary" />
                <Typography variant="h6">AI Market Insights</Typography>
              </Stack>
              <Alert severity="info" icon={<AIIcon />}>
                {marketTrends.ai_insights}
              </Alert>
            </CardContent>
          </Card>
        </Grid>
      )}

      {/* Demand Forecast Recommendation */}
      {demandForecast?.recommendation && (
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Demand Analysis
              </Typography>
              <Alert severity="success">
                {demandForecast.recommendation}
              </Alert>
              <Box mt={2}>
                <Typography variant="body2" color="textSecondary">
                  Average daily listings: {demandForecast.current_metrics?.avg_daily_listings?.toFixed(1)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Confidence: {(demandForecast.confidence * 100).toFixed(0)}%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  );

  const renderRentPrediction = () => (
    <Box>
      {propertyId ? (
        <AIRentPredictor propertyId={propertyId} />
      ) : (
        <Alert severity="info">
          Select a property to see AI-powered rent predictions
        </Alert>
      )}
    </Box>
  );

  const renderRenovationSimulator = () => (
    <Box>
      {propertyId ? (
        <RenovationImpactSimulator propertyId={propertyId} />
      ) : (
        <Alert severity="info">
          Select a property to simulate renovation impacts
        </Alert>
      )}
    </Box>
  );

  const renderCompetitiveAnalysis = () => (
    <Grid container spacing={3}>
      {competitiveAnalysis ? (
        <>
          {/* Positioning Overview */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Market Positioning
                </Typography>
                <Box mt={2}>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="subtitle2" color="textSecondary">
                        Price Position
                      </Typography>
                      <Chip
                        label={competitiveAnalysis.positioning?.price_positioning || 'N/A'}
                        color={
                          competitiveAnalysis.positioning?.price_positioning === 'budget'
                            ? 'success'
                            : competitiveAnalysis.positioning?.price_positioning === 'premium'
                            ? 'warning'
                            : 'default'
                        }
                      />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="textSecondary">
                        Competitiveness Score
                      </Typography>
                      <Box display="flex" alignItems="center">
                        <Box width="100%" mr={2}>
                          <LinearProgress
                            variant="determinate"
                            value={competitiveAnalysis.positioning?.competitiveness_score * 100 || 0}
                            sx={{ height: 10, borderRadius: 5 }}
                          />
                        </Box>
                        <Typography variant="body2">
                          {(competitiveAnalysis.positioning?.competitiveness_score * 100 || 0).toFixed(0)}%
                        </Typography>
                      </Box>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="textSecondary">
                        Price vs Average
                      </Typography>
                      <Typography variant="h6">
                        {competitiveAnalysis.positioning?.price_vs_average_percent > 0 ? '+' : ''}
                        {competitiveAnalysis.positioning?.price_vs_average_percent?.toFixed(1)}%
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Top Competitors */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Top Competitors
                </Typography>
                <Box mt={2}>
                  {competitiveAnalysis.top_competitors?.map((comp, index) => (
                    <Box key={comp.id} mb={1}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" noWrap sx={{ maxWidth: '60%' }}>
                          {index + 1}. {comp.title}
                        </Typography>
                        <Stack direction="row" spacing={1}>
                          <Chip
                            label={`CHF ${comp.price?.toLocaleString()}`}
                            size="small"
                            variant="outlined"
                          />
                          {comp.distance_km && (
                            <Chip
                              label={`${comp.distance_km} km`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Stack>
                      </Stack>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Recommendations */}
          {competitiveAnalysis.recommendations && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Strategic Recommendations
                  </Typography>
                  <Stack spacing={1} mt={2}>
                    {competitiveAnalysis.recommendations.map((rec, index) => (
                      <Alert severity="info" key={index}>
                        {rec}
                      </Alert>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Unique Selling Points */}
          {competitiveAnalysis.unique_selling_points && competitiveAnalysis.unique_selling_points.length > 0 && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Unique Selling Points
                  </Typography>
                  <Stack direction="row" spacing={1} mt={2} flexWrap="wrap">
                    {competitiveAnalysis.unique_selling_points.map((usp, index) => (
                      <Chip
                        key={index}
                        label={usp}
                        color="primary"
                        sx={{ mb: 1 }}
                      />
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          )}
        </>
      ) : (
        <Grid item xs={12}>
          <Alert severity="info">
            Select a property to see competitive analysis
          </Alert>
        </Grid>
      )}
    </Grid>
  );

  return (
    <Box>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={2} alignItems="center">
            <AIIcon color="primary" fontSize="large" />
            <Box>
              <Typography variant="h5" fontWeight="bold">
                AI Analytics Dashboard
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Powered by machine learning and market intelligence
              </Typography>
            </Box>
          </Stack>
          
          <Stack direction="row" spacing={2}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Deal Type</InputLabel>
              <Select
                value={dealType}
                label="Deal Type"
                onChange={(e) => setDealType(e.target.value)}
              >
                <MenuItem value="rent">Rent</MenuItem>
                <MenuItem value="buy">Buy</MenuItem>
              </Select>
            </FormControl>
            
            <Tooltip title="Refresh Data">
              <IconButton onClick={handleRefresh} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Export Report">
              <IconButton>
                <DownloadIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Market Overview" icon={<DashboardIcon />} iconPosition="start" />
          <Tab label="Rent Prediction" icon={<TrendingUpIcon />} iconPosition="start" />
          <Tab label="Renovation Simulator" icon={<BuildIcon />} iconPosition="start" />
          <Tab label="Competitive Analysis" icon={<AnalyticsIcon />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Box>
          {activeTab === 0 && renderMarketOverview()}
          {activeTab === 1 && renderRentPrediction()}
          {activeTab === 2 && renderRenovationSimulator()}
          {activeTab === 3 && renderCompetitiveAnalysis()}
        </Box>
      )}
    </Box>
  );
};

export default AIAnalyticsDashboard;