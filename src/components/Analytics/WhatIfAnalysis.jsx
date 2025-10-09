import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Slider,
  Button,
  Chip,
  Stack,
  Alert,
  CircularProgress,
  Divider,
  FormControlLabel,
  Checkbox,
  Paper,
  LinearProgress,
  Tooltip,
  IconButton,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Build as BuildIcon,
  Kitchen as KitchenIcon,
  Bathtub as BathroomIcon,
  Window as WindowIcon,
  WbSunny as SolarIcon,
  Home,
  Home as SmartHomeIcon,
  Thermostat as HeatingIcon,
  Landscape as LandscapeIcon,
  Roofing as RoofingIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  Calculate as CalculateIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  Area,
} from 'recharts';
import axios from 'axios';
import useAuth from '../../hooks/useAuth';
import { getApiUrl } from '../../utils/api/getApiUrl';
import { useTranslation } from 'react-i18next';

const renovationOptions = [
  { id: 'kitchen', name: 'Kitchen Renovation', icon: <KitchenIcon />, color: '#6366F1' },
  { id: 'bathroom', name: 'Bathroom Upgrade', icon: <BathroomIcon />, color: '#8B5CF6' },
  { id: 'flooring', name: 'New Flooring', icon: <RoofingIcon />, color: '#EC4899' },
  { id: 'windows', name: 'Window Replacement', icon: <WindowIcon />, color: '#3B82F6' },
  { id: 'solar', name: 'Solar Panels', icon: <SolarIcon />, color: '#F59E0B' },
  { id: 'smart_home', name: 'Smart Home', icon: <SmartHomeIcon />, color: '#10B981' },
  { id: 'insulation', name: 'Insulation', icon: <HeatingIcon />, color: '#EF4444' },
  { id: 'heating', name: 'Heating System', icon: <HeatingIcon />, color: '#F97316' },
  { id: 'exterior', name: 'Exterior Renovation', icon: <Home />, color: '#8B5CF6' },
  { id: 'landscaping', name: 'Landscaping', icon: <LandscapeIcon />, color: '#22C55E' },
];

const WhatIfAnalysis = ({ property }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { token } = useAuth();
  const [selectedRenovations, setSelectedRenovations] = useState([]);
  const [budget, setBudget] = useState(50000);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRenovationToggle = (renovationId) => {
    setSelectedRenovations(prev => {
      if (prev.includes(renovationId)) {
        return prev.filter(id => id !== renovationId);
      }
      return [...prev, renovationId];
    });
  };

  const performAnalysis = async () => {
    if (!property || selectedRenovations.length === 0) {
      setError('Please select at least one renovation');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Build natural language scenario from selected renovations
      const renovationNames = selectedRenovations.map(id => 
        renovationOptions.find(r => r.id === id)?.name || id
      ).join(', ');
      
      const scenarioText = `What if I perform the following renovations: ${renovationNames} with a budget of CHF ${budget.toLocaleString()}?`;
      
      const response = await axios.post(
        `${getApiUrl()}/api/market-analytics/what-if-analysis-v2`,
        {
          property_id: property.id,
          scenario_text: scenarioText,
          renovation_details: {
            renovations: selectedRenovations,
            budget: budget,
            selected_renovations: selectedRenovations.map(id => {
              const renovation = renovationOptions.find(r => r.id === id);
              return {
                id: id,
                name: renovation?.name,
                estimated_cost: budget / selectedRenovations.length
              };
            })
          },
          include_comparables: true,
          include_ai_analysis: true
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setAnalysis(response.data);
    } catch (err) {
      console.error('Error performing what-if analysis:', err);
      setError('Failed to perform analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Custom gradient tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Paper
          sx={{
            p: 1.5,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.95)} 0%, ${alpha(theme.palette.secondary.main, 0.95)} 100%)`,
            color: 'white',
          }}
        >
          <Typography variant="caption" fontWeight="bold">
            {label}
          </Typography>
          {payload.map((entry, index) => (
            <Typography key={index} variant="caption" display="block">
              {entry.name}: CHF {entry.value?.toLocaleString()}
            </Typography>
          ))}
        </Paper>
      );
    }
    return null;
  };

  const formatCurrency = (value) => {
    return `CHF ${value?.toLocaleString()}`;
  };

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Renovation Selection */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Stack spacing={3}>
                <Typography variant="h6" fontWeight="bold">
                  Select Renovations to Analyze
                </Typography>
                
                <Grid container spacing={2}>
                  {renovationOptions.map((option) => (
                    <Grid item xs={6} sm={4} md={3} key={option.id}>
                      <Paper
                        sx={{
                          p: 2,
                          cursor: 'pointer',
                          border: 2,
                          borderColor: selectedRenovations.includes(option.id) 
                            ? option.color 
                            : 'transparent',
                          background: selectedRenovations.includes(option.id)
                            ? alpha(option.color, 0.1)
                            : 'transparent',
                          transition: 'all 0.3s',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: 2,
                          },
                        }}
                        onClick={() => handleRenovationToggle(option.id)}
                      >
                        <Stack spacing={1} alignItems="center">
                          <Box sx={{ color: option.color }}>
                            {option.icon}
                          </Box>
                          <Typography variant="caption" textAlign="center">
                            {option.name}
                          </Typography>
                        </Stack>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Budget Slider */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6">
                    Budget Allocation
                  </Typography>
                  <Chip
                    icon={<MoneyIcon />}
                    label={formatCurrency(budget)}
                    color="primary"
                    variant="outlined"
                  />
                </Stack>
                
                <Slider
                  value={budget}
                  onChange={(e, newValue) => setBudget(newValue)}
                  min={10000}
                  max={200000}
                  step={5000}
                  marks={[
                    { value: 10000, label: '10K' },
                    { value: 50000, label: '50K' },
                    { value: 100000, label: '100K' },
                    { value: 150000, label: '150K' },
                    { value: 200000, label: '200K' },
                  ]}
                  sx={{
                    '& .MuiSlider-track': {
                      background: `linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%)`,
                    },
                    '& .MuiSlider-thumb': {
                      background: '#6366F1',
                    },
                  }}
                />
                
                <Typography variant="caption" color="text.secondary">
                  Adjust your renovation budget to see impact on property value
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Analysis Button */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack spacing={2} height="100%" justifyContent="center">
                <Button
                  variant="contained"
                  size="large"
                  onClick={performAnalysis}
                  disabled={loading || selectedRenovations.length === 0}
                  startIcon={loading ? <CircularProgress size={20} /> : <CalculateIcon />}
                  sx={{
                    background: `linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)`,
                    py: 2,
                    '&:hover': {
                      background: `linear-gradient(135deg, #5558E3 0%, #7C4FE8 100%)`,
                    },
                  }}
                >
                  {loading ? 'Analyzing...' : 'Run AI Analysis'}
                </Button>
                
                {selectedRenovations.length > 0 && (
                  <Typography variant="caption" color="text.secondary" textAlign="center">
                    {selectedRenovations.length} renovation{selectedRenovations.length > 1 ? 's' : ''} selected
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Error Alert */}
        {error && (
          <Grid item xs={12}>
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </Grid>
        )}

        {/* Analysis Results */}
        {analysis && (
          <>
            {/* Value Impact Summary */}
            <Grid item xs={12}>
              <Card
                sx={{
                  background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.1)} 100%)`,
                }}
              >
                <CardContent>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={3}>
                      <Stack spacing={1}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Current Value
                        </Typography>
                        <Typography variant="h4" fontWeight="bold">
                          {formatCurrency(analysis.current_value)}
                        </Typography>
                      </Stack>
                    </Grid>
                    
                    <Grid item xs={12} md={3}>
                      <Stack spacing={1}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Estimated New Value
                        </Typography>
                        <Typography variant="h4" fontWeight="bold" color="success.main">
                          {formatCurrency(analysis.estimated_new_value)}
                        </Typography>
                        <Chip
                          size="small"
                          label={`+${analysis.value_increase_percentage?.toFixed(1)}%`}
                          color="success"
                        />
                      </Stack>
                    </Grid>
                    
                    <Grid item xs={12} md={3}>
                      <Stack spacing={1}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Total Investment
                        </Typography>
                        <Typography variant="h4" fontWeight="bold">
                          {formatCurrency(analysis.total_cost_estimate?.average)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Range: {formatCurrency(analysis.total_cost_estimate?.min)} - {formatCurrency(analysis.total_cost_estimate?.max)}
                        </Typography>
                      </Stack>
                    </Grid>
                    
                    <Grid item xs={12} md={3}>
                      <Stack spacing={1}>
                        <Typography variant="subtitle2" color="text.secondary">
                          ROI
                        </Typography>
                        <Typography variant="h4" fontWeight="bold" color="primary.main">
                          {analysis.financial_impact?.roi_percentage?.toFixed(1) || 
                           ((analysis.financial_impact?.value_increase / analysis.total_cost_estimate?.average) * 100).toFixed(1)}%
                        </Typography>
                        {analysis.financial_impact?.payback_period_years && (
                          <Typography variant="caption" color="text.secondary">
                            Payback: {analysis.financial_impact.payback_period_years.toFixed(1)} years
                          </Typography>
                        )}
                      </Stack>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Renovation Breakdown Chart */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Renovation Cost Breakdown
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analysis.renovations}>
                      <defs>
                        <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.2)} />
                      <XAxis dataKey="type" />
                      <YAxis tickFormatter={(value) => `${value/1000}K`} />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Bar dataKey={(item) => (item.cost_estimate[0] + item.cost_estimate[1]) / 2} fill="url(#colorBar)" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Appeal Score Impact */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Market Appeal Impact
                  </Typography>
                  <Stack spacing={3}>
                    <Box>
                      <Stack direction="row" justifyContent="space-between" mb={1}>
                        <Typography variant="body2">{t('filing.current_appeal')}</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {(analysis.market_appeal?.current_appeal_score * 100).toFixed(0)}%
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={analysis.market_appeal?.current_appeal_score * 100}
                        sx={{ height: 10, borderRadius: 5 }}
                      />
                    </Box>
                    
                    <Box>
                      <Stack direction="row" justifyContent="space-between" mb={1}>
                        <Typography variant="body2">{t('filing.projected_appeal')}</Typography>
                        <Typography variant="body2" fontWeight="bold" color="success.main">
                          {(analysis.market_appeal?.projected_appeal_score * 100).toFixed(0)}%
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={analysis.market_appeal?.projected_appeal_score * 100}
                        color="success"
                        sx={{ height: 10, borderRadius: 5 }}
                      />
                    </Box>
                    
                    <Alert severity="success" icon={<TrendingUpIcon />}>
                      Market appeal increases by {analysis.market_appeal?.appeal_increase.toFixed(0)}%
                    </Alert>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* AI Recommendations */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Stack spacing={2}>
                    <Typography variant="h6" fontWeight="bold">
                      AI Strategic Recommendations
                    </Typography>
                    
                    {analysis.ai_insights?.recommendations?.map((rec, index) => (
                      <Alert
                        key={index}
                        severity="info"
                        icon={<InfoIcon />}
                        sx={{
                          background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.1)} 100%)`,
                        }}
                      >
                        {rec}
                      </Alert>
                    ))}
                    
                    {analysis.ai_insights?.priority_ranking && (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Renovation Priority Order:
                        </Typography>
                        <Stack direction="row" spacing={1}>
                          {analysis.ai_insights.priority_ranking.map((item, index) => (
                            <Chip
                              key={item}
                              label={`${index + 1}. ${renovationOptions.find(r => r.id === item)?.name || item}`}
                              color={index === 0 ? 'primary' : 'default'}
                              variant={index === 0 ? 'filled' : 'outlined'}
                            />
                          ))}
                        </Stack>
                      </Box>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </>
        )}
      </Grid>
    </Box>
  );
};

export default WhatIfAnalysis;