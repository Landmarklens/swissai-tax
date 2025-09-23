import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Rating,
  Slider,
  TextField,
  InputAdornment,
  Stack,
  IconButton,
  Tooltip,
  Alert,
  useTheme,
  alpha
} from '@mui/material';
import {
  Build,
  Kitchen,
  Bathroom,
  Bolt,
  Park,
  AttachMoney,
  TrendingUp,
  Timeline,
  CheckCircle,
  Warning,
  Info,
  Home,
  LocationOn,
  CompareArrows,
  EmojiEvents,
  ThumbUp,
  ThumbDown,
  Lightbulb,
  Assessment,
  ShowChart,
  ArrowUpward,
  ArrowDownward,
  Remove,
  Add,
  Edit
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, RadialBarChart, RadialBar, LineChart, Line, Area, AreaChart } from 'recharts';

// What-If Renovation Analysis Visualization
export const WhatIfAnalysisVisual = ({ data, property }) => {
  const theme = useTheme();
  const [selectedRenovations, setSelectedRenovations] = useState(['kitchen', 'bathroom']);
  const [budget, setBudget] = useState(30000);

  const renovationOptions = [
    { id: 'kitchen', name: 'Kitchen', icon: <Kitchen />, costRange: [15000, 35000], roi: 15 },
    { id: 'bathroom', name: 'Bathroom', icon: <Bathroom />, costRange: [10000, 25000], roi: 12 },
    { id: 'energy', name: 'Energy Efficiency', icon: <Bolt />, costRange: [20000, 40000], roi: 8 },
    { id: 'landscaping', name: 'Landscaping', icon: <Park />, costRange: [5000, 15000], roi: 5 }
  ];

  const handleRenovationToggle = (event, newRenovations) => {
    setSelectedRenovations(newRenovations);
  };

  const calculateTotalCost = () => {
    return selectedRenovations.reduce((total, renId) => {
      const ren = renovationOptions.find(r => r.id === renId);
      return total + (ren ? (ren.costRange[0] + ren.costRange[1]) / 2 : 0);
    }, 0);
  };

  const calculateROI = () => {
    const avgROI = selectedRenovations.reduce((total, renId) => {
      const ren = renovationOptions.find(r => r.id === renId);
      return total + (ren ? ren.roi : 0);
    }, 0) / (selectedRenovations.length || 1);
    return avgROI;
  };

  const estimatedValue = property?.price_chf || 500000;
  const totalCost = calculateTotalCost();
  const roi = calculateROI();
  const newValue = estimatedValue + (totalCost * roi / 100);
  const roiYears = totalCost > 0 ? (totalCost / ((newValue - estimatedValue) / 3)).toFixed(1) : 0;

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Renovation Selector */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Select Renovations to Analyze
              </Typography>
              <ToggleButtonGroup
                value={selectedRenovations}
                onChange={handleRenovationToggle}
                sx={{ flexWrap: 'wrap', gap: 1 }}
              >
                {renovationOptions.map((renovation) => (
                  <ToggleButton 
                    key={renovation.id} 
                    value={renovation.id}
                    sx={{ 
                      borderRadius: 2,
                      px: 2,
                      py: 1,
                      '&.Mui-selected': {
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        borderColor: theme.palette.primary.main
                      }
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1}>
                      {renovation.icon}
                      <Box textAlign="left">
                        <Typography variant="body2">{renovation.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          CHF {renovation.costRange[0].toLocaleString()} - {renovation.costRange[1].toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </CardContent>
          </Card>
        </Grid>

        {/* Budget Slider */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Investment Budget
              </Typography>
              <Box px={2}>
                <Slider
                  value={budget}
                  onChange={(e, v) => setBudget(v)}
                  min={10000}
                  max={100000}
                  step={5000}
                  marks={[
                    { value: 10000, label: '10k' },
                    { value: 50000, label: '50k' },
                    { value: 100000, label: '100k' }
                  ]}
                  valueLabelDisplay="on"
                  valueLabelFormat={(v) => `CHF ${(v/1000).toFixed(0)}k`}
                />
              </Box>
              <Box display="flex" justifyContent="space-between" mt={2}>
                <Chip label={`Budget: CHF ${budget.toLocaleString()}`} color="primary" />
                <Chip label={`Est. Cost: CHF ${totalCost.toLocaleString()}`} 
                      color={totalCost > budget ? "error" : "success"} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* ROI Projection */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Return on Investment
              </Typography>
              <Box display="flex" justifyContent="space-around" alignItems="center">
                <Box textAlign="center">
                  <Typography variant="h3" color="primary">
                    {roi.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Expected ROI
                  </Typography>
                </Box>
                <Divider orientation="vertical" flexItem />
                <Box textAlign="center">
                  <Typography variant="h3" color="secondary">
                    {roiYears}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Years to Break Even
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Value Impact */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Property Value Impact
              </Typography>
              <Box display="flex" alignItems="center" gap={3}>
                <Box flex={1}>
                  <Typography variant="body2" color="text.secondary">Current Value</Typography>
                  <Typography variant="h5">CHF {estimatedValue.toLocaleString()}</Typography>
                </Box>
                <ArrowUpward color="success" fontSize="large" />
                <Box flex={1}>
                  <Typography variant="body2" color="text.secondary">After Renovation</Typography>
                  <Typography variant="h5" color="success.main">
                    CHF {Math.round(newValue).toLocaleString()}
                  </Typography>
                </Box>
                <Box flex={1}>
                  <Chip 
                    label={`+CHF ${Math.round(newValue - estimatedValue).toLocaleString()}`}
                    color="success"
                    size="large"
                    icon={<TrendingUp />}
                  />
                </Box>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={(newValue / estimatedValue - 1) * 100} 
                sx={{ mt: 2, height: 10, borderRadius: 5 }}
                color="success"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Recommendations from AI */}
        {data && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  AI Recommendations
                </Typography>
                <List>
                  {(data.recommendations || [
                    "Kitchen renovation offers the highest ROI for this property",
                    "Consider energy efficiency upgrades for long-term savings",
                    "Bathroom updates can significantly improve rental appeal"
                  ]).map((rec, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <Lightbulb color="primary" />
                      </ListItemIcon>
                      <ListItemText primary={rec} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

// Competitive Analysis Visualization
export const CompetitiveAnalysisVisual = ({ data, property }) => {
  const theme = useTheme();
  
  const competitorData = data?.competitors || [
    { name: 'Your Property', value: property?.price_chf || 2500, color: theme.palette.primary.main },
    { name: 'Avg Competitor', value: 2700, color: theme.palette.secondary.main },
    { name: 'Top Performer', value: 3200, color: theme.palette.success.main },
    { name: 'Budget Option', value: 2100, color: theme.palette.warning.main }
  ];

  const advantages = data?.advantages || [
    "Recently renovated kitchen",
    "Prime location near transport",
    "Parking space included",
    "Pet-friendly policy"
  ];

  const improvements = data?.improvement_suggestions || [
    "Update bathroom fixtures",
    "Improve online listing photos",
    "Highlight unique features",
    "Consider slight price adjustment"
  ];

  const positionScore = data?.competitiveness_score || 75;

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Market Position */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Market Position
              </Typography>
              <Box sx={{ position: 'relative', height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart cx="50%" cy="50%" innerRadius="30%" outerRadius="90%" data={[
                    { name: 'Position', value: positionScore, fill: theme.palette.primary.main }
                  ]}>
                    <RadialBar dataKey="value" cornerRadius={10} fill={theme.palette.primary.main} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center'
                  }}
                >
                  <Typography variant="h3" color="primary">
                    {positionScore}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Competitive Score
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Price Comparison */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Price Comparison
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={competitorData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {competitorData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Competitive Advantages */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Your Advantages
              </Typography>
              <List dense>
                {advantages.map((advantage, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText primary={advantage} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Improvement Suggestions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Improvement Opportunities
              </Typography>
              <List dense>
                {improvements.map((improvement, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <Lightbulb color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={improvement} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Positioning Strategy */}
        <Grid item xs={12}>
          <Card sx={{ background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)` }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recommended Strategy
              </Typography>
              <Typography variant="body1" paragraph>
                {data?.positioning_strategy || "Focus on highlighting your property's unique features and recent renovations. Your competitive pricing combined with premium amenities positions you well in the mid-to-upper market segment."}
              </Typography>
              <Box display="flex" gap={2} flexWrap="wrap">
                <Chip label="Mid-Range Pricing" color="primary" icon={<AttachMoney />} />
                <Chip label="Quality Focus" color="secondary" icon={<EmojiEvents />} />
                <Chip label="Location Advantage" color="success" icon={<LocationOn />} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

// Property Valuation Visualization
export const PropertyValuationVisual = ({ data, property }) => {
  const theme = useTheme();
  
  const currentValue = property?.price_chf || 500000;
  const fairValue = data?.fair_market_value || currentValue * 1.05;
  const minValue = data?.value_range?.min || currentValue * 0.9;
  const maxValue = data?.value_range?.max || currentValue * 1.1;
  
  const confidenceScore = data?.confidence || 85;
  const investmentScore = data?.investment_potential || 7.5;

  const valueDrivers = data?.value_drivers || [
    { factor: 'Location', impact: 85 },
    { factor: 'Size', impact: 75 },
    { factor: 'Condition', impact: 70 },
    { factor: 'Amenities', impact: 65 },
    { factor: 'Market Demand', impact: 80 }
  ];

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Valuation Summary */}
        <Grid item xs={12}>
          <Card sx={{ background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`, color: 'white' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                AI Property Valuation
              </Typography>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={4}>
                  <Box textAlign="center">
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Current Listed Price
                    </Typography>
                    <Typography variant="h4">
                      CHF {currentValue.toLocaleString()}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box textAlign="center">
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Fair Market Value
                    </Typography>
                    <Typography variant="h3">
                      CHF {Math.round(fairValue).toLocaleString()}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box textAlign="center">
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Value Range
                    </Typography>
                    <Typography variant="h5">
                      {Math.round(minValue/1000)}k - {Math.round(maxValue/1000)}k
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Confidence & Investment Score */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Valuation Confidence
              </Typography>
              <Box display="flex" alignItems="center" gap={2}>
                <Box flex={1}>
                  <LinearProgress 
                    variant="determinate" 
                    value={confidenceScore} 
                    sx={{ height: 20, borderRadius: 10 }}
                    color="primary"
                  />
                </Box>
                <Typography variant="h5" color="primary">
                  {confidenceScore}%
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Based on {data?.comparable_properties || 25} comparable properties
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Investment Potential
              </Typography>
              <Box display="flex" alignItems="center" gap={2}>
                <Rating 
                  value={investmentScore / 2} 
                  max={5} 
                  precision={0.5} 
                  size="large"
                  readOnly
                />
                <Typography variant="h5" color="secondary">
                  {investmentScore}/10
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {investmentScore >= 7 ? "Strong investment opportunity" : "Moderate investment potential"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Value Drivers */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Key Value Drivers
              </Typography>
              <Box>
                {valueDrivers.map((driver, index) => (
                  <Box key={index} mb={2}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">{driver.factor}</Typography>
                      <Typography variant="body2" color="primary">
                        {driver.impact}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={driver.impact} 
                      sx={{ height: 8, borderRadius: 4 }}
                      color={driver.impact > 70 ? "success" : "primary"}
                    />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Pricing Strategy */}
        <Grid item xs={12}>
          <Alert severity="info" icon={<Info />}>
            <Typography variant="subtitle1" gutterBottom>
              <strong>Pricing Recommendation</strong>
            </Typography>
            <Typography variant="body2">
              {data?.pricing_strategy || "Your property is fairly priced for the current market. Consider maintaining the current price point while highlighting unique features to attract quality tenants."}
            </Typography>
          </Alert>
        </Grid>
      </Grid>
    </Box>
  );
};

// Market Forecast Visualization
export const MarketForecastVisual = ({ data, property }) => {
  const theme = useTheme();
  
  const forecastData = data?.predictions || [
    { month: 'Jan', predicted: 2500, actual: 2480 },
    { month: 'Feb', predicted: 2550, actual: 2520 },
    { month: 'Mar', predicted: 2600, actual: null },
    { month: 'Apr', predicted: 2650, actual: null },
    { month: 'May', predicted: 2700, actual: null },
    { month: 'Jun', predicted: 2750, actual: null }
  ];

  const trendDirection = data?.trend_direction || 'upward';
  const confidence = data?.confidence || 75;
  const demandLevel = data?.demand_level || 'high';

  const opportunities = data?.opportunities || [
    "Growing demand in your area",
    "Limited new construction",
    "Infrastructure improvements planned"
  ];

  const risks = data?.risks || [
    "Interest rate fluctuations",
    "Seasonal demand variations"
  ];

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Trend Overview */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                30-Day Market Forecast
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={3}>
                  <Box display="flex" alignItems="center" gap={1}>
                    {trendDirection === 'upward' ? (
                      <ArrowUpward color="success" />
                    ) : trendDirection === 'downward' ? (
                      <ArrowDownward color="error" />
                    ) : (
                      <Remove color="warning" />
                    )}
                    <Box>
                      <Typography variant="h6" color={
                        trendDirection === 'upward' ? 'success.main' : 
                        trendDirection === 'downward' ? 'error.main' : 'warning.main'
                      }>
                        {trendDirection.charAt(0).toUpperCase() + trendDirection.slice(1)} Trend
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Price Direction
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Box>
                    <Typography variant="h6" color="primary">
                      {confidence}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Forecast Confidence
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Box>
                    <Chip 
                      label={demandLevel.toUpperCase()} 
                      color={demandLevel === 'high' ? 'success' : demandLevel === 'low' ? 'error' : 'warning'}
                      size="small"
                    />
                    <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                      Demand Level
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Box>
                    <Typography variant="h6" color="secondary">
                      +{data?.price_change_percent || 2.5}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Expected Change
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Forecast Chart */}
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={forecastData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="predicted" 
                    stroke={theme.palette.primary.main}
                    fill={alpha(theme.palette.primary.main, 0.3)}
                    strokeWidth={2}
                    name="Predicted"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="actual" 
                    stroke={theme.palette.success.main}
                    fill={alpha(theme.palette.success.main, 0.3)}
                    strokeWidth={2}
                    name="Actual"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Opportunities */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="success.main">
                Market Opportunities
              </Typography>
              <List dense>
                {opportunities.map((opp, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <TrendingUp color="success" />
                    </ListItemIcon>
                    <ListItemText primary={opp} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Risks */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="warning.main">
                Market Risks
              </Typography>
              <List dense>
                {risks.map((risk, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <Warning color="warning" />
                    </ListItemIcon>
                    <ListItemText primary={risk} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* AI Recommendations */}
        <Grid item xs={12}>
          <Alert severity="success" icon={<Lightbulb />}>
            <Typography variant="subtitle1" gutterBottom>
              <strong>Market Recommendation</strong>
            </Typography>
            <Typography variant="body2">
              {data?.recommendation || "The market shows positive momentum. This is a favorable time to list your property or negotiate lease renewals. Focus on highlighting your property's strengths in marketing materials."}
            </Typography>
          </Alert>
        </Grid>
      </Grid>
    </Box>
  );
};

export default {
  WhatIfAnalysisVisual,
  CompetitiveAnalysisVisual,
  PropertyValuationVisual,
  MarketForecastVisual
};