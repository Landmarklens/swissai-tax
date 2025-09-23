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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Slider,
  useTheme,
  alpha,
} from '@mui/material';
import {
  CompareArrows as CompareIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  LocationOn as LocationIcon,
  Home as HomeIcon,
  AttachMoney as MoneyIcon,
  Speed as SpeedIcon,
  Star as StarIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts';
import axios from 'axios';
import useAuth from '../../hooks/useAuth';
import { getApiUrl } from '../../utils/api/getApiUrl';

const CompetitiveIntelligence = ({ property, insights }) => {
  const theme = useTheme();
  const { token } = useAuth();
  const [competitiveData, setCompetitiveData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [radiusKm, setRadiusKm] = useState(5);

  const fetchCompetitiveAnalysis = async () => {
    console.log('[CompetitiveIntelligence] Starting fetchCompetitiveAnalysis');
    console.log('[CompetitiveIntelligence] Property:', property);
    console.log('[CompetitiveIntelligence] Radius:', radiusKm);
    
    if (!property) {
      console.warn('[CompetitiveIntelligence] No property provided');
      return;
    }

    setLoading(true);
    setError(null);

    const apiUrl = getApiUrl();
    const endpoint = `${apiUrl}/api/ai-analytics/competitive-analysis`;
    console.log('[CompetitiveIntelligence] API Endpoint:', endpoint);
    console.log('[CompetitiveIntelligence] Request payload:', {
      property_id: property.id,
      radius_km: radiusKm,
    });

    try {
      const response = await axios.post(
        endpoint,
        {
          property_id: property.id,
          radius_km: radiusKm,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        }
      );
      console.log('[CompetitiveIntelligence] Response received:', response.data);
      setCompetitiveData(response.data);
    } catch (err) {
      console.error('[CompetitiveIntelligence] Error fetching competitive analysis:', err);
      console.error('[CompetitiveIntelligence] Error response:', err.response);
      console.error('[CompetitiveIntelligence] Error status:', err.response?.status);
      console.error('[CompetitiveIntelligence] Error data:', err.response?.data);
      setError('Failed to load competitive analysis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (property) {
      fetchCompetitiveAnalysis();
    }
  }, [property?.id, radiusKm]);

  const getPositionColor = (position) => {
    switch (position) {
      case 'budget':
        return theme.palette.success.main;
      case 'premium':
        return theme.palette.warning.main;
      case 'mid-range':
        return theme.palette.info.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const getCompetitivenessColor = (score) => {
    if (score >= 0.8) return theme.palette.success.main;
    if (score >= 0.6) return theme.palette.info.main;
    if (score >= 0.4) return theme.palette.warning.main;
    return theme.palette.error.main;
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
              {entry.name}: {entry.value}
            </Typography>
          ))}
        </Paper>
      );
    }
    return null;
  };

  if (!property) {
    return (
      <Alert severity="info">
        Please select a property to view competitive analysis
      </Alert>
    );
  }

  if (loading && !competitiveData) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" action={
        <Button color="inherit" size="small" onClick={fetchCompetitiveAnalysis}>
          Retry
        </Button>
      }>
        {error}
      </Alert>
    );
  }

  const data = competitiveData || insights?.competitive_analysis;

  return (
    <Grid container spacing={3}>
      {/* Search Radius Control */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h6">
                Search Radius
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <LocationIcon color="primary" />
                <Slider
                  value={radiusKm}
                  onChange={(e, newValue) => setRadiusKm(newValue)}
                  min={1}
                  max={20}
                  marks={[
                    { value: 1, label: '1km' },
                    { value: 5, label: '5km' },
                    { value: 10, label: '10km' },
                    { value: 15, label: '15km' },
                    { value: 20, label: '20km' },
                  ]}
                  sx={{
                    '& .MuiSlider-track': {
                      background: `linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%)`,
                    },
                  }}
                />
                <Chip
                  label={`${radiusKm} km`}
                  color="primary"
                  variant="outlined"
                />
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {/* Market Position Summary */}
      <Grid item xs={12} md={4}>
        <Card
          sx={{
            background: `linear-gradient(135deg, ${alpha(getPositionColor(data?.market_position?.price_positioning), 0.1)} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`,
            height: '100%',
          }}
        >
          <CardContent>
            <Stack spacing={3}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">
                  Market Position
                </Typography>
                <CompareIcon color="primary" />
              </Stack>

              <Box>
                <Chip
                  label={data?.market_position?.price_positioning?.toUpperCase() || 'ANALYZING'}
                  color={
                    data?.market_position?.price_positioning === 'budget' ? 'success' :
                    data?.market_position?.price_positioning === 'premium' ? 'warning' :
                    'info'
                  }
                  size="large"
                  sx={{ mb: 2 }}
                />
                
                <Typography variant="h4" fontWeight="bold">
                  {data?.market_position?.competitiveness_score 
                    ? `${(data.market_position.competitiveness_score * 100).toFixed(0)}%`
                    : '--'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Competitiveness Score
                </Typography>
              </Box>

              <Box>
                <Stack direction="row" alignItems="center" spacing={1}>
                  {data?.market_position?.price_vs_average_percent > 0 ? (
                    <TrendingUpIcon color="error" />
                  ) : (
                    <TrendingDownIcon color="success" />
                  )}
                  <Typography variant="h6">
                    {data?.market_position?.price_vs_average_percent > 0 ? '+' : ''}
                    {data?.market_position?.price_vs_average_percent?.toFixed(1)}%
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  vs. Market Average
                </Typography>
              </Box>

              <LinearProgress
                variant="determinate"
                value={data?.market_position?.percentile_rank || 50}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  '& .MuiLinearProgress-bar': {
                    background: `linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%)`,
                  },
                }}
              />
              <Typography variant="caption" color="text.secondary">
                Percentile Rank: {data?.market_position?.percentile_rank?.toFixed(0)}%
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {/* Competitive Scatter Plot */}
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Market Positioning Map
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.2)} />
                <XAxis 
                  dataKey="price" 
                  name="Price" 
                  unit=" CHF"
                  domain={['dataMin - 100', 'dataMax + 100']}
                />
                <YAxis 
                  dataKey="size" 
                  name="Size" 
                  unit=" m²"
                />
                <ZAxis 
                  dataKey="bedrooms" 
                  range={[50, 400]} 
                  name="Bedrooms"
                />
                <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                <Scatter
                  name="Competitors"
                  data={data?.competitor_analysis?.top_competitors || []}
                  fill={alpha(theme.palette.primary.main, 0.6)}
                />
                <Scatter
                  name="Your Property"
                  data={[{
                    price: property?.price_chf,
                    size: property?.square_meters,
                    bedrooms: property?.bedrooms,
                  }]}
                  fill={theme.palette.error.main}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Top Competitors Table */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Top Competitors Analysis
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Property</TableCell>
                    <TableCell align="right">Price (CHF)</TableCell>
                    <TableCell align="center">Bedrooms</TableCell>
                    <TableCell align="center">Size (m²)</TableCell>
                    <TableCell align="center">Distance</TableCell>
                    <TableCell align="center">Price/m²</TableCell>
                    <TableCell align="center">Comparison</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow
                    sx={{
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                      '& td': { fontWeight: 'bold' },
                    }}
                  >
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <StarIcon color="primary" fontSize="small" />
                        <Typography>Your Property</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      {property?.price_chf?.toLocaleString()}
                    </TableCell>
                    <TableCell align="center">{property?.bedrooms}</TableCell>
                    <TableCell align="center">{property?.square_meters}</TableCell>
                    <TableCell align="center">-</TableCell>
                    <TableCell align="center">
                      {property?.square_meters 
                        ? (property.price_chf / property.square_meters).toFixed(0)
                        : '-'}
                    </TableCell>
                    <TableCell align="center">
                      <Chip label="Reference" size="small" color="primary" />
                    </TableCell>
                  </TableRow>
                  
                  {data?.competitor_analysis?.top_competitors?.map((comp, index) => (
                    <TableRow key={comp.id || index}>
                      <TableCell>{comp.title || `Competitor ${index + 1}`}</TableCell>
                      <TableCell align="right">
                        {comp.price?.toLocaleString()}
                      </TableCell>
                      <TableCell align="center">{comp.bedrooms}</TableCell>
                      <TableCell align="center">{comp.size}</TableCell>
                      <TableCell align="center">
                        {comp.distance_km ? `${comp.distance_km.toFixed(1)} km` : '-'}
                      </TableCell>
                      <TableCell align="center">
                        {comp.size ? (comp.price / comp.size).toFixed(0) : '-'}
                      </TableCell>
                      <TableCell align="center">
                        {comp.price < property?.price_chf ? (
                          <Chip
                            label={`-${((1 - comp.price / property.price_chf) * 100).toFixed(0)}%`}
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                        ) : (
                          <Chip
                            label={`+${((comp.price / property?.price_chf - 1) * 100).toFixed(0)}%`}
                            size="small"
                            color="error"
                            variant="outlined"
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* AI Insights and Recommendations */}
      <Grid item xs={12}>
        <Grid container spacing={2}>
          {/* Unique Selling Points */}
          {data?.ai_insights?.unique_selling_points && (
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CheckIcon color="success" />
                      <Typography variant="h6">
                        Unique Selling Points
                      </Typography>
                    </Stack>
                    <Stack spacing={1}>
                      {data.ai_insights.unique_selling_points.map((usp, index) => (
                        <Alert
                          key={index}
                          severity="success"
                          icon={<CheckIcon />}
                          sx={{
                            '& .MuiAlert-icon': { fontSize: 20 },
                          }}
                        >
                          {usp}
                        </Alert>
                      ))}
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Strategic Recommendations */}
          {data?.ai_insights?.recommendations && (
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <InfoIcon color="info" />
                      <Typography variant="h6">
                        Strategic Recommendations
                      </Typography>
                    </Stack>
                    <Stack spacing={1}>
                      {data.ai_insights.recommendations.map((rec, index) => (
                        <Alert
                          key={index}
                          severity="info"
                          icon={<InfoIcon />}
                        >
                          {rec}
                        </Alert>
                      ))}
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </Grid>

      {/* Market Opportunities */}
      {data?.market_opportunities && (
        <Grid item xs={12}>
          <Card
            sx={{
              background: data.market_opportunities.underpriced
                ? `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`
                : data.market_opportunities.overpriced
                ? `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`
                : theme.palette.background.paper,
            }}
          >
            <CardContent>
              <Stack spacing={2}>
                <Typography variant="h6">
                  Market Opportunities
                </Typography>
                
                {data.market_opportunities.underpriced && (
                  <Alert severity="success">
                    Property is underpriced by market standards. Consider increasing price to optimal range:
                    CHF {data.market_opportunities.optimal_price_range.min.toLocaleString()} - 
                    CHF {data.market_opportunities.optimal_price_range.max.toLocaleString()}
                  </Alert>
                )}
                
                {data.market_opportunities.overpriced && (
                  <Alert severity="warning">
                    Property is overpriced compared to market. Consider adjusting to optimal range:
                    CHF {data.market_opportunities.optimal_price_range.min.toLocaleString()} - 
                    CHF {data.market_opportunities.optimal_price_range.max.toLocaleString()}
                  </Alert>
                )}
                
                <Typography variant="subtitle2" fontWeight="bold">
                  Quick Wins:
                </Typography>
                <Grid container spacing={1}>
                  {data.market_opportunities.quick_wins?.map((win, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                      <Chip
                        label={win}
                        variant="outlined"
                        sx={{ width: '100%' }}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  );
};

export default CompetitiveIntelligence;