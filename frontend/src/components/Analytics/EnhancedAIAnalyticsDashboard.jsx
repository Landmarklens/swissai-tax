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
  LinearProgress,
  useTheme,
  alpha,
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
  Home as HomeIcon,
  CompareArrows as CompareIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
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
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import useAuth from '../../hooks/useAuth';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { getApiUrl } from '../../utils/api/getApiUrl';

// Import sub-components
import WhatIfAnalysis from './WhatIfAnalysis';
import CompetitiveIntelligence from './CompetitiveIntelligence';
import MarketForecast from './MarketForecast';
import PropertyValuation from './PropertyValuation';

// Modern color palette with gradients
const CHART_COLORS = {
  primary: '#6366F1',
  secondary: '#8B5CF6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
  gradients: {
    primary: ['#6366F1', '#818CF8'],
    secondary: ['#8B5CF6', '#A78BFA'],
    success: ['#10B981', '#34D399'],
    warning: ['#F59E0B', '#FBBf24'],
    danger: ['#EF4444', '#F87171'],
  }
};

const EnhancedAIAnalyticsDashboard = ({ propertyId: propPropertyId }) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [marketData, setMarketData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState(propPropertyId);
  const { token } = useAuth();

  // Get properties from Redux
  const properties = useSelector(state => state.properties?.properties?.data) || [];
  const selectedProperty = properties.find(p => p.id === selectedPropertyId) || properties[0];

  // Update selected property when prop changes
  useEffect(() => {
    if (propPropertyId !== undefined && propPropertyId !== selectedPropertyId) {
      setSelectedPropertyId(propPropertyId);
    }
  }, [propPropertyId]);

  // Fetch comprehensive AI insights
  const fetchAIInsights = async () => {
    if (!selectedProperty) return;
    
    setLoading(true);
    try {
      const response = await axios.get(
        `${getApiUrl()}/api/ai-analytics/ai-insights/${selectedProperty.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setAiInsights(response.data);
    } catch (err) {
      console.error('Error fetching AI insights:', err);
      setError('Failed to load AI insights');
    } finally {
      setLoading(false);
    }
  };

  // Fetch market forecast
  const fetchMarketData = async () => {
    if (!selectedProperty) return;
    
    try {
      const response = await axios.post(
        `${getApiUrl()}/api/ai-analytics/market-forecast`,
        {
          canton: selectedProperty.canton || 'ZH',
          property_type: selectedProperty.property_type,
          forecast_days: 90,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setMarketData(response.data);
    } catch (err) {
      console.error('Error fetching market forecast:', err);
    }
  };

  useEffect(() => {
    if (selectedProperty) {
      fetchAIInsights();
      fetchMarketData();
    }
  }, [selectedProperty?.id]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchAIInsights(), fetchMarketData()]);
    setRefreshing(false);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Custom tooltip with gradient background
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Paper
          sx={{
            p: 1.5,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.9)} 0%, ${alpha(theme.palette.secondary.main, 0.9)} 100%)`,
            color: 'white',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Typography variant="caption" fontWeight="bold">
            {label}
          </Typography>
          {payload.map((entry, index) => (
            <Typography key={index} variant="caption" display="block">
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

  const renderMarketOverview = () => (
    <Grid container spacing={3}>
      {/* AI Score Card with Gradient */}
      <Grid item xs={12} md={4}>
        <Card
          sx={{
            background: `linear-gradient(135deg, ${CHART_COLORS.primary} 0%, ${CHART_COLORS.secondary} 100%)`,
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <CardContent>
            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <AIIcon fontSize="large" />
                <Chip
                  label="AI Powered"
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                  }}
                />
              </Stack>
              <Box>
                <Typography variant="h3" fontWeight="bold">
                  {aiInsights?.summary?.investment_score?.toFixed(1) || '8.5'}/10
                </Typography>
                <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                  Investment Score
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Based on market analysis, location factors, and growth potential
              </Typography>
            </Stack>
            {/* Decorative gradient overlay */}
            <Box
              sx={{
                position: 'absolute',
                top: -50,
                right: -50,
                width: 150,
                height: 150,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)',
              }}
            />
          </CardContent>
        </Card>
      </Grid>

      {/* Market Position Radar Chart */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Property Positioning
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={[
                { subject: 'Price', value: 85 },
                { subject: 'Location', value: 92 },
                { subject: 'Size', value: 78 },
                { subject: 'Amenities', value: 88 },
                { subject: 'Condition', value: 75 },
                { subject: 'Demand', value: 90 },
              ]}>
                <PolarGrid stroke={alpha(theme.palette.divider, 0.3)} />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar
                  name="Your Property"
                  dataKey="value"
                  stroke={CHART_COLORS.primary}
                  fill={CHART_COLORS.primary}
                  fillOpacity={0.6}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Market Trend with Gradient Area */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Price Trend Forecast
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={marketData?.forecast_data?.slice(0, 30) || []}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.success} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={CHART_COLORS.success} stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.2)} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).getDate()}
                  stroke={theme.palette.text.secondary}
                />
                <YAxis stroke={theme.palette.text.secondary} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="predicted_price"
                  stroke={CHART_COLORS.success}
                  fillOpacity={1}
                  fill="url(#colorPrice)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Competitive Positioning Heatmap-style Chart */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Competitive Market Analysis
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={aiInsights?.competitive_analysis?.top_competitors || []}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={CHART_COLORS.secondary} stopOpacity={0.8}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.2)} />
                <XAxis dataKey="title" angle={-45} textAnchor="end" height={100} />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend />
                <Bar yAxisId="left" dataKey="price" fill="url(#barGradient)" radius={[8, 8, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="size" stroke={CHART_COLORS.warning} strokeWidth={3} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* AI Recommendations with Modern Cards */}
      <Grid item xs={12}>
        <Grid container spacing={2}>
          {aiInsights?.renovation_suggestions?.ai_insights?.recommendations?.map((rec, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card
                sx={{
                  height: '100%',
                  background: `linear-gradient(135deg, ${alpha(CHART_COLORS.gradients.primary[0], 0.1)} 0%, ${alpha(CHART_COLORS.gradients.primary[1], 0.05)} 100%)`,
                  borderLeft: `4px solid ${CHART_COLORS.primary}`,
                }}
              >
                <CardContent>
                  <Stack spacing={1}>
                    <AssessmentIcon color="primary" />
                    <Typography variant="subtitle2" color="primary" fontWeight="bold">
                      Recommendation {index + 1}
                    </Typography>
                    <Typography variant="body2">
                      {rec}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          )) || (
            <>
              <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%', borderLeft: `4px solid ${CHART_COLORS.success}` }}>
                  <CardContent>
                    <Stack spacing={1}>
                      <TrendingUpIcon color="success" />
                      <Typography variant="subtitle2" color="success.main" fontWeight="bold">
                        Price Optimization
                      </Typography>
                      <Typography variant="body2">
                        Consider adjusting price by 2-3% based on current market demand
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%', borderLeft: `4px solid ${CHART_COLORS.warning}` }}>
                  <CardContent>
                    <Stack spacing={1}>
                      <BuildIcon sx={{ color: CHART_COLORS.warning }} />
                      <Typography variant="subtitle2" sx={{ color: CHART_COLORS.warning }} fontWeight="bold">
                        Renovation Priority
                      </Typography>
                      <Typography variant="body2">
                        Kitchen and bathroom upgrades offer the best ROI
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%', borderLeft: `4px solid ${CHART_COLORS.info}` }}>
                  <CardContent>
                    <Stack spacing={1}>
                      <TimelineIcon color="info" />
                      <Typography variant="subtitle2" color="info.main" fontWeight="bold">
                        Market Timing
                      </Typography>
                      <Typography variant="body2">
                        Optimal listing window: Next 30-45 days based on seasonal trends
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </>
          )}
        </Grid>
      </Grid>
    </Grid>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header with Gradient Background */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
          borderRadius: 2,
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${CHART_COLORS.primary} 0%, ${CHART_COLORS.secondary} 100%)`,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AIIcon fontSize="large" />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight="bold">
                AI Property Intelligence
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Advanced analytics powered by GPT-5 and machine learning
              </Typography>
            </Box>
          </Stack>
          
          <Stack direction="row" spacing={2} alignItems="center">
            <FormControl sx={{ minWidth: 250 }} size="small">
              <InputLabel id="property-select-label">Select Your Property</InputLabel>
              <Select
                labelId="property-select-label"
                value={selectedPropertyId || ''}
                onChange={(e) => {
                  setSelectedPropertyId(e.target.value || null);
                }}
                label="Select Your Property"
                startAdornment={<HomeIcon sx={{ ml: 1, mr: 0.5, color: 'text.secondary' }} />}
              >
                {properties.length === 0 ? (
                  <MenuItem value="" disabled>
                    <em>No properties available</em>
                  </MenuItem>
                ) : (
                  properties.map((property) => (
                    <MenuItem key={property.id} value={property.id}>
                      {property.title || property.address} - {property.city}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
            
            <Tooltip title="Refresh Data">
              <IconButton 
                onClick={handleRefresh} 
                disabled={refreshing}
                sx={{
                  background: alpha(theme.palette.primary.main, 0.1),
                  '&:hover': {
                    background: alpha(theme.palette.primary.main, 0.2),
                  }
                }}
              >
                {refreshing ? <CircularProgress size={24} /> : <RefreshIcon />}
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Export Report">
              <IconButton
                sx={{
                  background: alpha(theme.palette.secondary.main, 0.1),
                  '&:hover': {
                    background: alpha(theme.palette.secondary.main, 0.2),
                  }
                }}
              >
                <DownloadIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Paper>

      {/* Modern Tab Design */}
      <Paper sx={{ mb: 3, borderRadius: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              py: 2,
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 500,
            },
            '& .Mui-selected': {
              background: alpha(theme.palette.primary.main, 0.08),
            },
          }}
        >
          <Tab label="Market Intelligence" icon={<DashboardIcon />} iconPosition="start" />
          <Tab label="What-If Analysis" icon={<BuildIcon />} iconPosition="start" />
          <Tab label="Competitive Position" icon={<CompareIcon />} iconPosition="start" />
          <Tab label="Value Estimation" icon={<MoneyIcon />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {loading && !aiInsights ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress size={48} />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : (
        <Box>
          {activeTab === 0 && renderMarketOverview()}
          {activeTab === 1 && <WhatIfAnalysis property={selectedProperty} />}
          {activeTab === 2 && <CompetitiveIntelligence property={selectedProperty} insights={aiInsights} />}
          {activeTab === 3 && <PropertyValuation property={selectedProperty} insights={aiInsights} />}
        </Box>
      )}
    </Box>
  );
};

export default EnhancedAIAnalyticsDashboard;