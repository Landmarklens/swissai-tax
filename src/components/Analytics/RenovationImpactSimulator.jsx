import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Chip,
  FormControl,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  FormLabel,
  Slider,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Build as BuildIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  Timer as TimerIcon,
  Home as HomeIcon,
  Kitchen as KitchenIcon,
  Bathroom as BathroomIcon,
  Weekend as FlooringIcon,
  FormatPaint as PaintingIcon,
  Window as WindowIcon,
  Whatshot as HeatingIcon,
  Roofing as RoofingIcon,
  SolarPower as SolarIcon,
  Wifi as SmartHomeIcon,
  Grass as GardenIcon,
  DirectionsCar as ParkingIcon,
  Info as InfoIcon,
  Calculate as CalculateIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

const renovationIcons = {
  kitchen: <KitchenIcon />,
  bathroom: <BathroomIcon />,
  flooring: <FlooringIcon />,
  painting: <PaintingIcon />,
  windows: <WindowIcon />,
  heating: <HeatingIcon />,
  insulation: <HomeIcon />,
  roof: <RoofingIcon />,
  facade: <HomeIcon />,
  solar: <SolarIcon />,
  smart_home: <SmartHomeIcon />,
  garden: <GardenIcon />,
  parking: <ParkingIcon />,
  complete: <BuildIcon />,
};

const RenovationImpactSimulator = ({ propertyId }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [renovationTypes, setRenovationTypes] = useState([]);
  const [selectedRenovations, setSelectedRenovations] = useState([]);
  const [qualityLevel, setQualityLevel] = useState('typical');
  const [customCosts, setCustomCosts] = useState({});
  const [impact, setImpact] = useState(null);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  // Fetch available renovation types
  useEffect(() => {
    fetchRenovationTypes();
  }, []);

  const fetchRenovationTypes = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/ai-analytics/renovation-types`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setRenovationTypes(response.data.renovation_types);
    } catch (err) {
      console.error('Error fetching renovation types:', err);
    } finally {
      setLoadingTypes(false);
    }
  };

  const calculateImpact = async () => {
    if (!propertyId || selectedRenovations.length === 0) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/ai-analytics/renovation-impact`,
        {
          property_id: propertyId,
          renovation_types: selectedRenovations,
          quality_level: qualityLevel,
          custom_costs: customCosts,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      setImpact(response.data);
    } catch (err) {
      console.error('Error calculating renovation impact:', err);
      setError(err.response?.data?.detail || 'Failed to calculate renovation impact');
    } finally {
      setLoading(false);
    }
  };

  const handleRenovationToggle = (renovationType) => {
    setSelectedRenovations((prev) =>
      prev.includes(renovationType)
        ? prev.filter((r) => r !== renovationType)
        : [...prev, renovationType]
    );
  };

  const handleQualityChange = (event) => {
    setQualityLevel(event.target.value);
  };

  const getROIColor = (years) => {
    if (!years) return 'default';
    if (years <= 5) return 'success';
    if (years <= 10) return 'warning';
    return 'error';
  };

  const getROILabel = (years) => {
    if (!years) return 'N/A';
    if (years <= 5) return 'Excellent ROI';
    if (years <= 10) return 'Good ROI';
    if (years <= 15) return 'Moderate ROI';
    return 'Low ROI';
  };

  if (loadingTypes) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="center" py={4}>
            <CircularProgress size={20} />
            <Typography ml={2}>{t('filing.loading_renovation_options')}</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box mb={3}>
          <Stack direction="row" alignItems="center" spacing={1} mb={2}>
            <BuildIcon color="primary" />
            <Typography variant="h5" fontWeight="bold">
              Renovation Impact Simulator
            </Typography>
          </Stack>
          <Typography variant="body2" color="textSecondary">
            Simulate renovation scenarios and calculate ROI for your property
          </Typography>
        </Box>

        {/* Renovation Selection */}
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            Select Renovations
          </Typography>
          <Grid container spacing={2}>
            {renovationTypes.map((reno) => (
              <Grid item xs={12} sm={6} md={4} key={reno.type}>
                <Paper
                  variant={selectedRenovations.includes(reno.type) ? 'elevation' : 'outlined'}
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    backgroundColor: selectedRenovations.includes(reno.type)
                      ? 'primary.light'
                      : 'transparent',
                    '&:hover': {
                      backgroundColor: selectedRenovations.includes(reno.type)
                        ? 'primary.light'
                        : 'grey.100',
                    },
                  }}
                  onClick={() => handleRenovationToggle(reno.type)}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Checkbox
                      checked={selectedRenovations.includes(reno.type)}
                      color="primary"
                    />
                    {renovationIcons[reno.type] || <BuildIcon />}
                    <Box flex={1}>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {reno.display_name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        CHF {reno.cost_range[qualityLevel]?.toLocaleString()}
                      </Typography>
                      <Chip
                        label={`+${reno.rent_impact_range[qualityLevel]?.toFixed(1)}%`}
                        size="small"
                        color="success"
                        sx={{ ml: 1 }}
                      />
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Quality Level Selection */}
        <Box mb={3}>
          <FormControl component="fieldset">
            <FormLabel component="legend">{t('filing.quality_level')}</FormLabel>
            <RadioGroup
              row
              value={qualityLevel}
              onChange={handleQualityChange}
            >
              <FormControlLabel value="budget" control={<Radio />} label={t("filing.budget")} />
              <FormControlLabel value="typical" control={<Radio />} label={t("filing.typical")} />
              <FormControlLabel value="premium" control={<Radio />} label={t("filing.premium")} />
            </RadioGroup>
          </FormControl>
        </Box>

        {/* Calculate Button */}
        <Box mb={3}>
          <Button
            variant="contained"
            size="large"
            startIcon={<CalculateIcon />}
            onClick={calculateImpact}
            disabled={loading || selectedRenovations.length === 0 || !propertyId}
            fullWidth
          >
            {loading ? 'Calculating Impact...' : 'Calculate Renovation Impact'}
          </Button>
        </Box>

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Impact Results */}
        {impact && (
          <Box>
            <Divider sx={{ mb: 3 }} />
            
            <Typography variant="h6" gutterBottom>
              Renovation Impact Analysis
            </Typography>

            <Grid container spacing={3} mb={3}>
              {/* Current vs New Rent */}
              <Grid item xs={12} md={6}>
                <Paper elevation={2} sx={{ p: 3 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="subtitle2" color="textSecondary">
                        Current Rent
                      </Typography>
                      <Typography variant="h4" fontWeight="bold">
                        CHF {impact.current_rent?.toLocaleString()}
                      </Typography>
                    </Box>
                    <TrendingUpIcon fontSize="large" color="action" />
                    <Box textAlign="right">
                      <Typography variant="subtitle2" color="textSecondary">
                        After Renovation
                      </Typography>
                      <Typography variant="h4" fontWeight="bold" color="primary">
                        CHF {impact.predicted_new_rent?.toLocaleString()}
                      </Typography>
                    </Box>
                  </Stack>
                  <Box mt={2} p={2} bgcolor="success.light" borderRadius={1}>
                    <Typography variant="subtitle2" color="success.dark">
                      Monthly Increase: +CHF {impact.rent_increase?.toLocaleString()}
                    </Typography>
                    <Typography variant="subtitle2" color="success.dark">
                      Annual Income Increase: +CHF {impact.annual_income_increase?.toLocaleString()}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>

              {/* ROI Metrics */}
              <Grid item xs={12} md={6}>
                <Paper elevation={2} sx={{ p: 3 }}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Return on Investment
                  </Typography>
                  <Stack spacing={2}>
                    <Box>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body1">{t('filing.total_investment')}</Typography>
                        <Typography variant="h6" fontWeight="bold">
                          CHF {impact.total_cost?.toLocaleString()}
                        </Typography>
                      </Stack>
                    </Box>
                    <Box>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body1">{t('filing.roi_period')}</Typography>
                        <Chip
                          label={`${impact.roi_years?.toFixed(1) || 'N/A'} years`}
                          color={getROIColor(impact.roi_years)}
                        />
                      </Stack>
                    </Box>
                    <Box>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body1">{t('filing.annual_roi')}</Typography>
                        <Typography variant="h6" fontWeight="bold" color="primary">
                          {impact.roi_percentage?.toFixed(1)}%
                        </Typography>
                      </Stack>
                    </Box>
                    <Chip
                      label={getROILabel(impact.roi_years)}
                      color={getROIColor(impact.roi_years)}
                      sx={{ mt: 1 }}
                    />
                  </Stack>
                </Paper>
              </Grid>
            </Grid>

            {/* Renovation Breakdown */}
            <Box mb={3}>
              <Typography variant="h6" gutterBottom>
                Renovation Breakdown
              </Typography>
              <List>
                {impact.renovations?.map((reno, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      {renovationIcons[reno.type] || <BuildIcon />}
                    </ListItemIcon>
                    <ListItemText
                      primary={reno.type.replace('_', ' ').charAt(0).toUpperCase() + reno.type.slice(1)}
                      secondary={`Quality: ${reno.quality_level}`}
                    />
                    <Stack direction="row" spacing={2}>
                      <Chip
                        label={`CHF ${reno.cost?.toLocaleString()}`}
                        variant="outlined"
                      />
                      <Chip
                        label={`+${reno.rent_impact_percentage?.toFixed(1)}%`}
                        color="success"
                        size="small"
                      />
                    </Stack>
                  </ListItem>
                ))}
              </List>
            </Box>

            {/* Recommendations */}
            {impact.recommendations && impact.recommendations.length > 0 && (
              <Box mb={3}>
                <Typography variant="h6" gutterBottom>
                  AI Recommendations
                </Typography>
                <Stack spacing={1}>
                  {impact.recommendations.map((rec, index) => (
                    <Alert severity="info" key={index} icon={<InfoIcon />}>
                      {rec}
                    </Alert>
                  ))}
                </Stack>
              </Box>
            )}

            {/* Market Analysis */}
            {impact.market_analysis && (
              <Box mb={3} p={2} bgcolor="grey.50" borderRadius={1}>
                <Typography variant="subtitle2" gutterBottom>
                  Market Context
                </Typography>
                {impact.market_analysis.market_average && (
                  <Typography variant="body2" color="textSecondary">
                    Market Average: CHF {impact.market_analysis.market_average?.toLocaleString()}
                  </Typography>
                )}
                {impact.market_analysis.market_ceiling && (
                  <Typography variant="body2" color="textSecondary">
                    Market Ceiling (90th percentile): CHF {impact.market_analysis.market_ceiling?.toLocaleString()}
                  </Typography>
                )}
                {impact.market_analysis.ai_insight && (
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    {impact.market_analysis.ai_insight}
                  </Typography>
                )}
              </Box>
            )}

            {/* Confidence Score */}
            <Box textAlign="center" mt={2}>
              <Typography variant="caption" color="textSecondary">
                Prediction Confidence: {(impact.confidence * 100).toFixed(0)}%
              </Typography>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default RenovationImpactSimulator;