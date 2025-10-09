import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Stack,
  Chip,
  Button,
  CircularProgress,
  Alert,
  LinearProgress,
  Paper,
  Divider,
  FormControlLabel,
  Switch,
  useTheme,
  alpha,
} from '@mui/material';
import {
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Home as HomeIcon,
  Speed as SpeedIcon,
  Build as BuildIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Cell,
} from 'recharts';
import axios from 'axios';
import useAuth from '../../hooks/useAuth';
import { getApiUrl } from '../../utils/api/getApiUrl';
import { useTranslation } from 'react-i18next';

const PropertyValuation = ({ property, insights }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { token } = useAuth();
  const [valuationData, setValuationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [includeRenovations, setIncludeRenovations] = useState(false);

  const fetchValuation = async () => {
    if (!property) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `${getApiUrl()}/api/ai-analytics/property-valuation`,
        {
          property_id: property.id,
          include_renovations: includeRenovations,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setValuationData(response.data);
    } catch (err) {
      console.error('Error fetching property valuation:', err);
      setError('Failed to load property valuation');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (property) {
      fetchValuation();
    }
  }, [property?.id, includeRenovations]);

  const formatCurrency = (value) => {
    if (!value) return 'CHF --';
    return `CHF ${value.toLocaleString()}`;
  };

  const getInvestmentScoreColor = (score) => {
    if (score >= 8) return theme.palette.success.main;
    if (score >= 6) return theme.palette.info.main;
    if (score >= 4) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  if (!property) {
    return (
      <Alert severity="info">
        Please select a property to view valuation
      </Alert>
    );
  }

  if (loading && !valuationData) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <CircularProgress />
      </Box>
    );
  }

  const data = valuationData || insights?.valuation;

  // Prepare data for radial chart
  const investmentScore = data?.investment_metrics?.investment_score || 0;
  const radialData = [{
    name: 'Investment Score',
    value: investmentScore * 10,
    fill: getInvestmentScoreColor(investmentScore),
  }];

  return (
    <Grid container spacing={3}>
      {/* Valuation Controls */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">
                Property Valuation Analysis
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={includeRenovations}
                    onChange={(e) => setIncludeRenovations(e.target.checked)}
                    color="primary"
                  />
                }
                label={t("filing.include_renovation_potential")}
              />
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {/* Main Valuation Card */}
      <Grid item xs={12} md={6}>
        <Card
          sx={{
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
            height: '100%',
          }}
        >
          <CardContent>
            <Stack spacing={3}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">
                  Estimated Market Value
                </Typography>
                <MoneyIcon color="primary" fontSize="large" />
              </Stack>

              <Box>
                <Typography variant="h3" fontWeight="bold" color="primary">
                  {formatCurrency(data?.valuation?.estimated_value)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Range: {formatCurrency(data?.valuation?.value_range?.min)} - {formatCurrency(data?.valuation?.value_range?.max)}
                </Typography>
              </Box>

              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2">{t('filing.confidence_score')}</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {((data?.valuation?.confidence_score || 0) * 100).toFixed(0)}%
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={(data?.valuation?.confidence_score || 0) * 100}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    '& .MuiLinearProgress-bar': {
                      background: `linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%)`,
                    },
                  }}
                />
              </Stack>

              <Chip
                label={data?.valuation?.methodology || 'AI-Enhanced Analysis'}
                variant="outlined"
                size="small"
              />
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {/* Investment Score */}
      <Grid item xs={12} md={6}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h6">
                Investment Potential
              </Typography>
              
              <Box sx={{ position: 'relative', height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart 
                    cx="50%" 
                    cy="50%" 
                    innerRadius="60%" 
                    outerRadius="90%" 
                    data={radialData}
                    startAngle={180} 
                    endAngle={0}
                  >
                    <PolarAngleAxis
                      type="number"
                      domain={[0, 100]}
                      angleAxisId={0}
                      tick={false}
                    />
                    <RadialBar
                      background
                      dataKey="value"
                      cornerRadius={10}
                      fill={getInvestmentScoreColor(investmentScore)}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
                
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="h3" fontWeight="bold">
                    {investmentScore.toFixed(1)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    out of 10
                  </Typography>
                </Box>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Stack>
                    <Typography variant="h6">
                      {data?.investment_metrics?.gross_rental_yield?.toFixed(1) || '--'}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Gross Yield
                    </Typography>
                  </Stack>
                </Grid>
                <Grid item xs={6}>
                  <Stack>
                    <Typography variant="h6">
                      {data?.investment_metrics?.net_rental_yield?.toFixed(1) || '--'}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Net Yield
                    </Typography>
                  </Stack>
                </Grid>
              </Grid>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {/* Market Comparison */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Market Comparison
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Stack direction="row" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">vs Market Average</Typography>
                  <Chip
                    label={`${data?.market_comparison?.vs_market_average > 0 ? '+' : ''}${data?.market_comparison?.vs_market_average?.toFixed(1)}%`}
                    color={data?.market_comparison?.vs_market_average > 0 ? 'error' : 'success'}
                    size="small"
                  />
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(100, Math.abs(data?.market_comparison?.vs_market_average || 0))}
                  color={data?.market_comparison?.vs_market_average > 0 ? 'error' : 'success'}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>

              <Box>
                <Stack direction="row" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">{t('filing.percentile_rank')}</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {data?.market_comparison?.percentile_rank?.toFixed(0)}%
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={data?.market_comparison?.percentile_rank || 50}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>

              <Divider />

              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">{t('filing.market_position')}</Typography>
                <Chip
                  label={data?.market_comparison?.market_position?.toUpperCase() || 'MID-RANGE'}
                  size="small"
                  color={
                    data?.market_comparison?.market_position === 'budget' ? 'success' :
                    data?.market_comparison?.market_position === 'premium' ? 'warning' :
                    'default'
                  }
                />
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {/* Value Drivers and Detractors */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Value Analysis
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Stack spacing={1}>
                  <Typography variant="subtitle2" color="success.main">
                    Value Drivers
                  </Typography>
                  {data?.ai_insights?.value_drivers?.map((driver, index) => (
                    <Chip
                      key={index}
                      label={driver}
                      size="small"
                      icon={<CheckIcon />}
                      color="success"
                      variant="outlined"
                      sx={{ justifyContent: 'flex-start' }}
                    />
                  ))}
                </Stack>
              </Grid>
              <Grid item xs={6}>
                <Stack spacing={1}>
                  <Typography variant="subtitle2" color="error.main">
                    Value Detractors
                  </Typography>
                  {data?.ai_insights?.value_detractors?.map((detractor, index) => (
                    <Chip
                      key={index}
                      label={detractor}
                      size="small"
                      color="error"
                      variant="outlined"
                      sx={{ justifyContent: 'flex-start' }}
                    />
                  ))}
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Renovation Potential (if enabled) */}
      {includeRenovations && data?.renovation_potential && (
        <Grid item xs={12}>
          <Card
            sx={{
              background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
            }}
          >
            <CardContent>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <BuildIcon color="primary" />
                  <Typography variant="h6">
                    Renovation Potential
                  </Typography>
                </Stack>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Stack>
                      <Typography variant="h5" fontWeight="bold" color="success.main">
                        {formatCurrency(data.renovation_potential.potential_value_increase)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Potential Value Increase
                      </Typography>
                    </Stack>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Stack>
                      <Typography variant="h5" fontWeight="bold">
                        {formatCurrency(data.renovation_potential.recommended_investment)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Recommended Investment
                      </Typography>
                    </Stack>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Stack>
                      <Typography variant="h5" fontWeight="bold">
                        {((data.renovation_potential.current_condition_score || 0) * 10).toFixed(0)}/10
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Current Condition Score
                      </Typography>
                    </Stack>
                  </Grid>
                </Grid>

                <Alert severity="info" icon={<InfoIcon />}>
                  Strategic renovations could increase property value by up to 15% with targeted improvements
                  focusing on kitchen, bathrooms, and energy efficiency.
                </Alert>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      )}

      {/* Data Sources */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Analysis Methodology
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {data?.data_sources?.map((source, index) => (
                <Chip
                  key={index}
                  label={source}
                  size="small"
                  variant="outlined"
                  sx={{ mb: 1 }}
                />
              ))}
            </Stack>
            {data?.valuation_date && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                Valuation Date: {new Date(data.valuation_date).toLocaleDateString()}
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default PropertyValuation;