import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import whatIfDebugger from '../../../../utils/whatIfDebugger';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Tab,
  Tabs,
  IconButton,
  Tooltip,
  Divider,
  LinearProgress,
  Container,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  TextField,
  useTheme,
  alpha,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ToggleButton,
  ToggleButtonGroup,
  Rating,
  Dialog,
  DialogContent,
  DialogTitle,
  Fade
} from '@mui/material';
import {
  TrendingUp,
  Home,
  Assessment,
  Compare,
  Build,
  AttachMoney,
  Analytics,
  Lightbulb,
  InfoOutlined,
  PlayArrow,
  Refresh,
  CheckCircle,
  Schedule,
  AutoGraph,
  Insights,
  Kitchen,
  Bathroom,
  Bolt,
  Park,
  Roofing,
  Window,
  WbSunny,
  Thermostat,
  Landscape,
  Calculate,
  TrendingDown,
  Remove,
  ArrowUpward,
  ArrowDownward,
  Warning,
  EmojiEvents,
  LocationOn,
  Edit,
  Dashboard
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { useComprehensiveAnalytics } from '../../../../hooks/useAnalytics';
import MarketVisualizationCharts from './MarketVisualizationCharts';
import MarketInsightsCharts from './MarketInsightsCharts';
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
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar,
  ComposedChart
} from 'recharts';

// Styled Components
const StyledTabs = styled(Tabs)(({ theme }) => ({
  borderBottom: `1px solid ${theme.palette.divider}`,
  '& .MuiTab-root': {
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '1rem',
    marginRight: theme.spacing(4),
    minWidth: 'auto',
    padding: theme.spacing(2, 0),
    '&.Mui-selected': {
      color: theme.palette.primary.main,
    },
  },
}));

const RenovationCard = styled(Paper)(({ theme, selected, color }) => ({
  padding: theme.spacing(2),
  cursor: 'pointer',
  border: `2px solid ${selected ? color : 'transparent'}`,
  background: selected ? alpha(color, 0.1) : 'transparent',
  transition: 'all 0.3s',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  },
}));

const ValueCard = styled(Card)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
  color: 'white',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    right: 0,
    width: '200px',
    height: '200px',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '50%',
    transform: 'translate(50px, -50px)',
  }
}));

const renovationOptions = [
  { id: 'kitchen', name: 'Kitchen Renovation', icon: <Kitchen />, color: '#6366F1', costRange: [15000, 35000], quality: 'standard' },
  { id: 'bathroom', name: 'Bathroom Upgrade', icon: <Bathroom />, color: '#8B5CF6', costRange: [10000, 25000], quality: 'standard' },
  { id: 'flooring', name: 'New Flooring', icon: <Roofing />, color: '#EC4899', costRange: [5000, 15000], quality: 'standard' },
  { id: 'windows', name: 'Window Replacement', icon: <Window />, color: '#3B82F6', costRange: [8000, 20000], quality: 'standard' },
  { id: 'solar', name: 'Solar Panels', icon: <WbSunny />, color: '#F59E0B', costRange: [20000, 40000], quality: 'standard' },
  { id: 'insulation', name: 'Insulation', icon: <Thermostat />, color: '#EF4444', costRange: [5000, 12000], quality: 'standard' },
  { id: 'heating', name: 'Heating System', icon: <Bolt />, color: '#F97316', costRange: [10000, 25000], quality: 'standard' },
  { id: 'landscaping', name: 'Landscaping', icon: <Landscape />, color: '#22C55E', costRange: [3000, 10000], quality: 'standard' },
];

const UnifiedAnalyticsV3 = () => {
  const theme = useTheme();
  const location = useLocation();

  // Get properties from Redux
  const properties = useSelector(state => state.properties?.properties?.data) || [];

  // Extract property ID from URL parameters
  const getPropertyIdFromUrl = () => {
    const searchParams = new URLSearchParams(location.search);
    const propertyParam = searchParams.get('property');
    const propertyId = propertyParam ? parseInt(propertyParam) : null;
    return propertyId;
  };

  // Initialize selectedPropertyId with URL parameter or empty string
  const [selectedPropertyId, setSelectedPropertyId] = useState(() => getPropertyIdFromUrl() || '');

  // Update selected property when URL changes
  useEffect(() => {
    const propertyId = getPropertyIdFromUrl();
    if (propertyId && propertyId !== selectedPropertyId) {
      setSelectedPropertyId(propertyId);
    }
  }, [location.search]);

  const selectedProperty = selectedPropertyId ? properties.find(p => p.id === selectedPropertyId) : null;
  
  // Helper function to determine if property is for sale - memoized for performance
  const isSaleProperty = React.useCallback((property) => {
    if (!property) return false;
    
    // Check multiple fields that might indicate sale vs rent
    const dealType = property.deal_type || property.action || property.type;
    const price = property.price_chf || property.price || 0;
    
    // Check if deal_type indicates sale
    if (dealType) {
      const dealTypeLower = dealType.toLowerCase();
      if (dealTypeLower === 'buy' || dealTypeLower === 'sale' || dealTypeLower === 'sell') {
        return true;
      }
      if (dealTypeLower === 'rent' || dealTypeLower === 'rental' || dealTypeLower === 'let') {
        return false;
      }
    }
    
    // Fallback: if price is > 100,000 CHF, it's likely a sale
    if (price > 100000) {
      return true;
    }
    
    return false;
  }, []);
  
  // Memoize whether selected property is for sale to prevent excessive re-computation
  const isSelectedPropertyForSale = React.useMemo(() => {
    return selectedProperty ? isSaleProperty(selectedProperty) : false;
  }, [selectedProperty, isSaleProperty]);
  
  // Helper function to format property type for display
  const formatPropertyType = (type, plural = false) => {
    if (!type) return plural ? 'Properties' : 'Property';
    const formatted = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
    if (plural) {
      // Handle pluralization
      if (formatted === 'House') return 'Houses';
      if (formatted === 'Property') return 'Properties';
      return formatted + 's';
    }
    return formatted;
  };
  
  // Debug logging for properties and selection
  useEffect(() => {
    // Property selection is handled above
  }, [properties, selectedPropertyId, selectedProperty]);
  
  const [activeTab, setActiveTab] = useState(0); // Start with Market Overview
  const [aiResults, setAiResults] = useState({
    whatIf: null,
    competitive: null,
    valuation: null,
    forecast: null
  });
  const [loadingStates, setLoadingStates] = useState({
    whatIf: false,
    competitive: false,
    valuation: false,
    forecast: false
  });
  const [errors, setErrors] = useState({});

  // What-If Analysis specific states
  const [selectedRenovations, setSelectedRenovations] = useState(['kitchen', 'bathroom']);
  const [budget, setBudget] = useState(50000);
  const [whatIfScenario, setWhatIfScenario] = useState('');
  const [customCosts, setCustomCosts] = useState({});
  const [improvementText, setImprovementText] = useState('');
  const [inputMethod, setInputMethod] = useState('cards'); // 'cards' or 'text'
  const [analysisResults, setAnalysisResults] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [messageIndex, setMessageIndex] = useState(0);
  const [renovationQualities, setRenovationQualities] = useState({});

  // Basic market data (loads automatically)
  const [filters, setFilters] = useState({
    postal_code: '',
    radius_km: 5,
    property_type: 'all',
    deal_type: 'rent',
    days_back: 30
  });

  const { data: marketData, loading: marketLoading, refetch } = useComprehensiveAnalytics(filters);

  useEffect(() => {
    if (selectedProperty) {
      // Check all possible postal code field names
      const postal_code = selectedProperty.zip_code || selectedProperty.postal_code || selectedProperty.zipCode;

      // Only include radius_km if we have a postal code
      const newFilters = {
        property_id: selectedProperty.id,
        property_type: selectedProperty.property_type || 'apartment',
        bedrooms: selectedProperty.bedrooms,
        deal_type: selectedProperty.deal_type || selectedProperty.action || (selectedProperty.price_chf > 100000 ? 'buy' : 'rent'),
        room_tolerance: filters.room_tolerance !== undefined ? filters.room_tolerance : 0
      };

      if (postal_code) {
        newFilters.postal_code = postal_code;
        newFilters.radius_km = filters.radius_km !== undefined ? filters.radius_km : 5;
      }

      setFilters(newFilters);
    }
  }, [selectedProperty?.id]); // Removed filters.room_tolerance and filters.radius_km to prevent infinite loop

  const getAuthToken = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user?.access_token || localStorage.getItem('token');
  };

  const getApiUrl = () => {
    return process.env.REACT_APP_API_URL || 'https://api.homeai.ch';
  };

  // Loading messages for property owners
  const analysisLoadingMessages = [
    {
      title: "Searching Your Neighborhood",
      detail: "Finding similar properties within your immediate area to understand local market conditions..."
    },
    {
      title: "Expanding Search Radius",
      detail: "Looking for comparable properties up to 3km away to ensure comprehensive market analysis..."
    },
    {
      title: "Analyzing Property Features",
      detail: "Comparing property types, bedrooms, and amenities to find the best matches for accurate comparison..."
    },
    {
      title: "Evaluating Each Property",
      detail: "Our AI is analyzing how your planned renovations compare to features in similar properties..."
    },
    {
      title: "Calculating Price Impact",
      detail: "Determining how much your improvements could increase rental income or property value..."
    },
    {
      title: "Assessing Market Confidence",
      detail: "Evaluating the reliability of our estimates based on the quality of comparable properties found..."
    },
    {
      title: "Computing Return on Investment",
      detail: "Calculating how long it will take to recover your renovation costs through increased income..."
    },
    {
      title: "Preparing Your Report",
      detail: "Consolidating all analyses into clear, actionable recommendations for your property..."
    }
  ];

  // Effect to rotate loading messages
  useEffect(() => {
    let interval;
    if (loadingStates.whatIf || loadingStates.competitive || loadingStates.valuation || loadingStates.forecast) {
      interval = setInterval(() => {
        setMessageIndex(prev => (prev + 1) % analysisLoadingMessages.length);
      }, 4000); // Change message every 4 seconds
    }
    return () => clearInterval(interval);
  }, [loadingStates.whatIf, loadingStates.competitive, loadingStates.valuation, loadingStates.forecast]);

  // What-If Analysis Functions
  const handleRenovationToggle = (event, newRenovations) => {
    if (newRenovations !== null) {
      setSelectedRenovations(newRenovations);
    }
  };

  const calculateTotalCost = () => {
    return selectedRenovations.reduce((total, renId) => {
      const ren = renovationOptions.find(r => r.id === renId);
      return total + (ren ? (ren.costRange[0] + ren.costRange[1]) / 2 : 0);
    }, 0);
  };


  const calculateTimeFrame = () => {
    const maxWeeks = Math.max(...selectedRenovations.map(renId => {
      const ren = renovationOptions.find(r => r.id === renId);
      return ren ? ren.timeWeeks : 0;
    }), 0);
    return maxWeeks;
  };

  // AI Analysis API Calls
  const runWhatIfAnalysis = async () => {
    if (!selectedProperty) {
      whatIfDebugger.logValidation('property', null, false, 'No property selected');
      setErrors(prev => ({ ...prev, whatIf: 'Please select a property' }));
      return;
    }

    // Start debugging session
    const analysisId = whatIfDebugger.startAnalysis(selectedProperty.id, {
      inputMethod,
      renovations: selectedRenovations,
      improvementText,
      propertyType: selectedProperty.property_type,
      currentPrice: selectedProperty.price
    });

    // Check input based on method
    if (inputMethod === 'text' && !improvementText.trim()) {
      setErrors(prev => ({ ...prev, whatIf: 'Please describe your improvements' }));
      return;
    }

    if (inputMethod === 'cards' && selectedRenovations.length === 0) {
      setErrors(prev => ({ ...prev, whatIf: 'Please select at least one renovation' }));
      return;
    }

    setLoadingStates(prev => ({ ...prev, whatIf: true }));
    setErrors(prev => ({ ...prev, whatIf: null }));

    const startTime = Date.now();

    try {
      // Determine analysis type based on property
      const analysisType = isSaleProperty(selectedProperty) ? 'sale' : 'rent';

      const requestPayload = {
        property_id: selectedProperty.id,
        improvement_text: inputMethod === 'text' ? improvementText : null,
        renovations: inputMethod === 'cards' ? selectedRenovations : null,
        analysis_type: analysisType,
        quality_level: 'typical', // Can be made configurable later
        process_immediately: true
      };

      // Log request details
      whatIfDebugger.logRequest(
        `${getApiUrl()}/api/ai-analytics/what-if-analysis/async`,
        'POST',
        requestPayload,
        {
          Authorization: `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      );

      // Step 1: Start the async job
      whatIfDebugger.log('info', 'Starting async what-if analysis');
      whatIfDebugger.log('debug', `Request payload: ${JSON.stringify(requestPayload)}`);

      const jobResponse = await axios.post(
        `${getApiUrl()}/api/ai-analytics/what-if-analysis/async`,
        requestPayload,
        {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 seconds timeout for job creation
        }
      );

      const jobId = jobResponse.data.job_id;
      whatIfDebugger.log('info', `Job created successfully: ${jobId}`);
      // Analysis job started: ${jobId}

      // Step 2: Poll for results
      const pollInterval = 2000; // Poll every 2 seconds
      const maxAttempts = 180; // Max 6 minutes of polling (180 * 2s = 360s)
      let attempts = 0;

      const pollForResults = async () => {
        // Starting to poll for results
        whatIfDebugger.log('info', `Starting polling for job ${jobId}`);

        while (attempts < maxAttempts) {
          attempts++;

          try {
            // Check job status
            whatIfDebugger.log('debug', `Poll attempt ${attempts}/${maxAttempts}`);

            const statusResponse = await axios.get(
              `${getApiUrl()}/api/ai-analytics/what-if-analysis/async/${jobId}/status`,
              {
                headers: {
                  Authorization: `Bearer ${getAuthToken()}`
                }
              }
            );

            const status = statusResponse.data.status;
            const progress = statusResponse.data.progress_percentage || 0;
            const progressMessage = statusResponse.data.progress_message || 'Processing...';

            // Log detailed status
            whatIfDebugger.log('debug', `Status: ${status}, Progress: ${progress}%`);

            // Poll ${attempts}: ${status} (${progress}%)

            if (status === 'completed') {
              // Get the results
              const resultResponse = await axios.get(
                `${getApiUrl()}/api/ai-analytics/what-if-analysis/async/${jobId}/result`,
                {
                  headers: {
                    Authorization: `Bearer ${getAuthToken()}`
                  }
                }
              );

              const duration = Date.now() - startTime;

              // Log successful response
              whatIfDebugger.logResponse(200, resultResponse.data, duration);
              whatIfDebugger.logPerformance('Async API Call', duration);

              // What-If Analysis completed successfully

              setAnalysisResults(resultResponse.data);
              setAiResults(prev => ({ ...prev, whatIf: resultResponse.data }));
              return;

            } else if (status === 'failed') {
              throw new Error(statusResponse.data.error_message || 'Analysis failed');

            } else if (status === 'cancelled') {
              throw new Error('Analysis was cancelled');
            }

            // Wait before next poll
            await new Promise(resolve => setTimeout(resolve, pollInterval));

          } catch (pollError) {
            if (pollError.response?.status === 404) {
              throw new Error('Job not found or expired');
            }
            throw pollError;
          }
        }

        // Timeout after max attempts
        throw new Error('Analysis timeout - taking longer than expected. Please try again.');
      };

      await pollForResults();

    } catch (error) {
      const duration = startTime ? Date.now() - startTime : 0;

      // Log error details
      whatIfDebugger.logError(error, {
        propertyId: selectedProperty?.id,
        inputMethod,
        duration
      });

      // What-If Analysis error occurred

      // Handle different error types
      if (error.message?.includes('timeout')) {
        setErrors(prev => ({
          ...prev,
          whatIf: 'Analysis is taking longer than expected. Please try again with fewer renovations or a simpler description.'
        }));
      } else if (error.response?.status === 500) {
        setErrors(prev => ({
          ...prev,
          whatIf: 'The analysis service encountered an error. Please try again in a few moments.'
        }));
      } else {
        setErrors(prev => ({
          ...prev,
          whatIf: error.response?.data?.detail || error.message || 'An unexpected error occurred'
        }));
      }
    } finally {
      setLoadingStates(prev => ({ ...prev, whatIf: false }));

      // End debugging session
      whatIfDebugger.endAnalysis({
        success: !errors.whatIf,
        hasResults: !!analysisResults
      });
    }
  };

  const runCompetitiveAnalysis = async () => {
    if (!selectedProperty) return;
    
    setLoadingStates(prev => ({ ...prev, competitive: true }));
    setErrors(prev => ({ ...prev, competitive: null }));
    
    try {
      const response = await axios.post(
        `${getApiUrl()}/api/ai-analytics/competitive-analysis`,
        {
          property_id: selectedProperty.id,
          radius_km: 5
        },
        {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
            'Content-Type': 'application/json'
          },
          timeout: 180000 // 3 minutes timeout
        }
      );
      setAiResults(prev => ({ ...prev, competitive: response.data }));
    } catch (error) {
      // Competitive Analysis error
      setErrors(prev => ({ ...prev, competitive: error.message }));
    } finally {
      setLoadingStates(prev => ({ ...prev, competitive: false }));
    }
  };

  const runValuationAnalysis = async () => {
    if (!selectedProperty) return;
    
    setLoadingStates(prev => ({ ...prev, valuation: true }));
    setErrors(prev => ({ ...prev, valuation: null }));
    
    try {
      const response = await axios.post(
        `${getApiUrl()}/api/ai-analytics/property-valuation`,
        {
          property_id: selectedProperty.id,
          include_renovations: true
        },
        {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
            'Content-Type': 'application/json'
          },
          timeout: 180000 // 3 minutes timeout
        }
      );
      setAiResults(prev => ({ ...prev, valuation: response.data }));
    } catch (error) {
      // Valuation Analysis error
      setErrors(prev => ({ ...prev, valuation: error.message }));
    } finally {
      setLoadingStates(prev => ({ ...prev, valuation: false }));
    }
  };

  const runMarketForecast = async () => {
    if (!selectedProperty) return;
    
    setLoadingStates(prev => ({ ...prev, forecast: true }));
    setErrors(prev => ({ ...prev, forecast: null }));
    
    try {
      const response = await axios.post(
        `${getApiUrl()}/api/ai-analytics/market-forecast`,
        {
          canton: selectedProperty.canton || 'ZH',
          property_type: selectedProperty.property_type || 'apartment',
          forecast_days: 30
        },
        {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
            'Content-Type': 'application/json'
          },
          timeout: 180000 // 3 minutes timeout
        }
      );
      setAiResults(prev => ({ ...prev, forecast: response.data }));
    } catch (error) {
      // Market Forecast error
      setErrors(prev => ({ ...prev, forecast: error.message }));
    } finally {
      setLoadingStates(prev => ({ ...prev, forecast: false }));
    }
  };

  // Tab change handler
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Custom Tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 1.5 }}>
          <Typography variant="body2" fontWeight="bold">
            {label}
          </Typography>
          {payload.map((entry, index) => (
            <Typography key={index} variant="body2" color={entry.color}>
              {entry.name}: {typeof entry.value === 'number' ? 
                entry.name.includes('CHF') ? `CHF ${entry.value.toLocaleString()}` : entry.value
                : entry.value
              }
            </Typography>
          ))}
        </Paper>
      );
    }
    return null;
  };

  // Render What-If Analysis Tab
  const renderWhatIfAnalysis = () => {
    const totalCost = selectedRenovations.reduce((sum, renId) => {
      const cost = customCosts[renId] || renovationOptions.find(r => r.id === renId)?.costRange[0] || 0;
      return sum + cost;
    }, 0);
    
    const estimatedValue = selectedProperty?.price_chf || 500000;

    return (
      <Box>
        {/* Explanation Text */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            What-If Analysis
          </Typography>
          <Typography variant="body2">
            Explore how property improvements could impact your rental income or property value.
            Our AI analyzes similar properties in your area to provide data-driven estimates based on actual market performance.
          </Typography>
        </Alert>

        <Grid container spacing={3}>

          {/* Renovation Selector */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                {/* Input Method Toggle - Centered */}
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                  <ToggleButtonGroup
                    value={inputMethod}
                    exclusive
                    onChange={(e, value) => value && setInputMethod(value)}
                  >
                    <ToggleButton value="text">
                      <Edit sx={{ mr: 1 }} /> Describe Changes
                    </ToggleButton>
                    <ToggleButton value="cards">
                      <Dashboard sx={{ mr: 1 }} /> Select Options
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>

                {inputMethod === 'text' && (
                  <Box>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      placeholder="Describe your improvements: e.g., 'Modern kitchen with granite counters, renovate master bathroom with walk-in shower, install solar panels on roof'"
                      value={improvementText}
                      onChange={(e) => setImprovementText(e.target.value)}
                      variant="outlined"
                      sx={{ mb: 2 }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      <Button
                        variant="contained"
                        onClick={runWhatIfAnalysis}
                        disabled={loadingStates.whatIf || !selectedProperty || !improvementText.trim()}
                        startIcon={loadingStates.whatIf ? <CircularProgress size={20} /> : <Calculate />}
                        size="large"
                        sx={{
                          backgroundColor: '#8DA4EF',
                          '&:hover': { backgroundColor: '#3E63DD' }
                        }}
                      >
                        {loadingStates.whatIf ? 'Analyzing Impact...' : 'Analyze Impact'}
                      </Button>
                    </Box>
                  </Box>
                )}
                {inputMethod === 'cards' && (
                <Grid container spacing={2} mt={1}>
                  {renovationOptions.map((option) => (
                    <Grid item xs={6} sm={4} md={3} key={option.id}>
                      <RenovationCard
                        selected={selectedRenovations.includes(option.id)}
                        color={option.color}
                        onClick={() => {
                          if (selectedRenovations.includes(option.id)) {
                            setSelectedRenovations(prev => prev.filter(id => id !== option.id));
                          } else {
                            setSelectedRenovations(prev => [...prev, option.id]);
                          }
                        }}
                      >
                        <Stack spacing={1} alignItems="center">
                          <Box sx={{ color: option.color, fontSize: 40 }}>
                            {option.icon}
                          </Box>
                          <Typography variant="body2" fontWeight="bold" textAlign="center">
                            {option.name}
                          </Typography>
                          <TextField
                            type="number"
                            size="small"
                            value={customCosts[option.id] || option.costRange[0]}
                            onChange={(e) => {
                              e.stopPropagation();
                              setCustomCosts(prev => ({...prev, [option.id]: parseInt(e.target.value) || 0}));
                            }}
                            onClick={(e) => e.stopPropagation()}
                            InputProps={{
                              startAdornment: 'CHF ',
                              sx: { fontSize: '0.75rem' }
                            }}
                            sx={{ width: '110px', mt: 1 }}
                            disabled={!selectedRenovations.includes(option.id)}
                          />
                          <FormControl size="small" sx={{ mt: 1, minWidth: 100 }}>
                            <Select
                              value={renovationQualities[option.id] || 'standard'}
                              onChange={(e) => {
                                e.stopPropagation();
                                setRenovationQualities(prev => ({
                                  ...prev,
                                  [option.id]: e.target.value
                                }));
                              }}
                              onClick={(e) => e.stopPropagation()}
                              disabled={!selectedRenovations.includes(option.id)}
                              sx={{ fontSize: '0.75rem' }}
                            >
                              <MenuItem value="standard">Standard</MenuItem>
                              <MenuItem value="premium">Premium</MenuItem>
                            </Select>
                          </FormControl>
                        </Stack>
                      </RenovationCard>
                    </Grid>
                  ))}
                </Grid>
                )}

                {/* Summary Section */}
                {/* Summary Section for Cards Method */}
                {inputMethod === 'cards' && selectedRenovations.length > 0 && (
                  <Box mt={3} p={2} bgcolor="grey.50" borderRadius={1}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={4}>
                        <Typography variant="h5" color="primary">
                          CHF {totalCost.toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Investment
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="h5" color="success.main">
                          {selectedRenovations.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Renovations Selected
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Button
                          variant="contained"
                          onClick={runWhatIfAnalysis}
                          disabled={loadingStates.whatIf || !selectedProperty}
                          startIcon={loadingStates.whatIf ? <CircularProgress size={20} /> : <Calculate />}
                          fullWidth
                        >
                          {loadingStates.whatIf ? 'Analyzing...' : 'Analyze Impact'}
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>
                )}

              </CardContent>
            </Card>
          </Grid>


          {/* AI Analysis Results */}
          {analysisResults && (
            <Grid item xs={12}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    AI Market Analysis Results
                  </Typography>

                  {analysisResults.analysis_type === 'rent' ? (
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Current Monthly Rent
                          </Typography>
                          <Typography variant="h5">
                            CHF {analysisResults.current_price?.toLocaleString() || analysisResults.current_rent?.toLocaleString() || '0'}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 2, bgcolor: 'primary.50' }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Estimated New Rent
                          </Typography>
                          <Typography variant="h5" color="primary">
                            CHF {analysisResults.predicted_new_price?.toLocaleString() || analysisResults.estimated_new_rent?.toLocaleString() || '0'}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 2, bgcolor: 'success.50' }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Monthly Increase
                          </Typography>
                          <Typography variant="h5" color="success.main">
                            +CHF {analysisResults.monthly_increase?.toLocaleString() || analysisResults.price_increase_chf?.toLocaleString() || '0'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Annual: +CHF {analysisResults.annual_increase?.toLocaleString() || (analysisResults.monthly_increase * 12)?.toLocaleString() || '0'}
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  ) : (
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Current Value
                          </Typography>
                          <Typography variant="h5">
                            CHF {analysisResults.current_price?.toLocaleString() || analysisResults.current_value?.toLocaleString() || '0'}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 2, bgcolor: 'success.50' }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Estimated New Value
                          </Typography>
                          <Typography variant="h5" color="success.main">
                            CHF {analysisResults.predicted_new_price?.toLocaleString() || analysisResults.estimated_new_value?.toLocaleString() || '0'}
                          </Typography>
                          <Typography variant="caption">
                            +{analysisResults.price_increase_percent?.toFixed(1) || analysisResults.percent_increase?.toFixed(1) || '0'}% increase
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  )}

                  <Box sx={{ mt: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Based on {analysisResults.properties_analyzed || analysisResults.similar_properties_found || analysisResults.similar_properties_analyzed || 0} similar properties
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={analysisResults.confidence_score || (analysisResults.confidence || 0) * 100}
                      sx={{ mt: 1, mb: 1 }}
                    />
                    <Typography variant="caption">
                      Confidence: {analysisResults.confidence_score?.toFixed(0) || ((analysisResults.confidence || 0) * 100).toFixed(0)}%
                    </Typography>
                  </Box>

                  {analysisResults.improvements_detected && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Detected Improvements:
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        {analysisResults.improvements_detected.map((imp, idx) => (
                          <Chip key={idx} label={imp} size="small" />
                        ))}
                      </Stack>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}


          {/* AI Recommendations */}
          {analysisResults && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    AI-Powered Insights & Recommendations
                  </Typography>

                  {/* Confidence Score */}
                  {(analysisResults.confidence_score || analysisResults.average_confidence) && (
                    <Box sx={{
                      bgcolor: 'grey.50',
                      p: 2,
                      borderRadius: 1,
                      mb: 2
                    }}>
                      <Grid container alignItems="center" spacing={2}>
                        <Grid item xs={12} sm={8}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            Analysis Confidence
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Based on {analysisResults.similar_properties_analyzed || analysisResults.similar_properties_found || 0} similar properties
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h3" color="primary" fontWeight="bold">
                              {(analysisResults.confidence_score || analysisResults.average_confidence || 0).toFixed(0)}%
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={analysisResults.confidence_score || analysisResults.average_confidence || 0}
                              sx={{ height: 8, borderRadius: 1, mt: 1 }}
                            />
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>
                  )}

                  {/* AI Analysis Explanation */}
                  {(analysisResults.consolidated_analysis || analysisResults.analysis || analysisResults.explanation) && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                        Market Analysis
                      </Typography>
                      <Typography variant="body2">
                        {analysisResults.consolidated_analysis || analysisResults.analysis || analysisResults.explanation}
                      </Typography>
                    </Alert>
                  )}

                  <Grid container spacing={3}>
                    {/* Key Insights */}
                    {analysisResults.key_insights && analysisResults.key_insights.length > 0 && (
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                          Key Insights
                        </Typography>
                        <List dense>
                          {analysisResults.key_insights.map((insight, index) => (
                            <ListItem key={index}>
                              <ListItemIcon>
                                <Lightbulb color="primary" />
                              </ListItemIcon>
                              <ListItemText primary={insight} />
                            </ListItem>
                          ))}
                        </List>
                      </Grid>
                    )}

                    {/* ROI Analysis */}
                    <Grid item xs={12} md={analysisResults.key_insights ? 6 : 12}>
                      <Paper sx={{ p: 2, bgcolor: 'success.light', height: '100%' }}>
                        <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                          Return on Investment
                        </Typography>
                        {analysisResults.total_investment && (
                          <Typography variant="body2" gutterBottom>
                            <strong>Total Investment:</strong> CHF {analysisResults.total_investment?.toLocaleString()}
                          </Typography>
                        )}
                        {analysisResults.roi_percentage !== undefined && (
                          <Typography variant="h5" color="success.dark" fontWeight="bold" gutterBottom>
                            {analysisResults.roi_percentage?.toFixed(1)}% ROI
                          </Typography>
                        )}
                        {analysisResults.payback_period_years !== undefined && (
                          <Typography variant="body2">
                            <strong>Payback Period:</strong> {analysisResults.payback_period_years?.toFixed(1)} years
                          </Typography>
                        )}
                        {analysisResults.roi_months !== undefined && analysisResults.analysis_type === 'rent' && (
                          <Typography variant="body2">
                            <strong>Payback Period:</strong> {Math.round(analysisResults.roi_months)} months
                          </Typography>
                        )}
                        {analysisResults.estimated_value_increase_percentage && (
                          <Typography variant="body2">
                            <strong>Value Increase:</strong> +{analysisResults.estimated_value_increase_percentage?.toFixed(1)}%
                          </Typography>
                        )}
                      </Paper>
                    </Grid>

                    {/* Recommendation */}
                    {analysisResults.recommendation && (
                      <Grid item xs={12}>
                        <Alert
                          severity="success"
                          sx={{
                            backgroundColor: '#f0f9ff',
                            border: '1px solid #0ea5e9',
                            '& .MuiAlert-message': {
                              width: '100%'
                            }
                          }}
                        >
                          <Typography variant="subtitle2" fontWeight="bold" gutterBottom color="primary.dark">
                            Recommendation
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: '#1e293b',
                              lineHeight: 1.7,
                              fontWeight: 500
                            }}
                          >
                            {analysisResults.recommendation}
                          </Typography>
                        </Alert>
                      </Grid>
                    )}

                    {/* Price Estimates */}
                    {(analysisResults.estimated_new_rent || analysisResults.estimated_new_value) && (
                      <Grid item xs={12}>
                        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                            After Renovation Estimates
                          </Typography>
                          <Grid container spacing={2}>
                            {analysisResults.current_rent && (
                              <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Current Rent</Typography>
                                <Typography variant="h6">
                                  CHF {analysisResults.current_rent?.toLocaleString()}
                                </Typography>
                              </Grid>
                            )}
                            {analysisResults.estimated_new_rent && (
                              <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Estimated New Rent</Typography>
                                <Typography variant="h6" color="primary">
                                  CHF {analysisResults.estimated_new_rent?.toLocaleString()}
                                </Typography>
                              </Grid>
                            )}
                            {analysisResults.current_value && (
                              <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Current Value</Typography>
                                <Typography variant="h6">
                                  CHF {analysisResults.current_value?.toLocaleString()}
                                </Typography>
                              </Grid>
                            )}
                            {analysisResults.estimated_new_value && (
                              <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Estimated New Value</Typography>
                                <Typography variant="h6" color="primary">
                                  CHF {analysisResults.estimated_new_value?.toLocaleString()}
                                </Typography>
                              </Grid>
                            )}
                          </Grid>
                        </Box>
                      </Grid>
                    )}

                    {/* Estimate Range */}
                    {analysisResults.estimate_range && (
                      <Grid item xs={12}>
                        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                            Estimate Range
                          </Typography>
                          <Typography variant="body2">
                            Min: CHF {analysisResults.estimate_range.min?.toLocaleString()} |
                            Max: CHF {analysisResults.estimate_range.max?.toLocaleString()}
                          </Typography>
                        </Box>
                      </Grid>
                    )}

                    {/* Execution Metadata */}
                    {analysisResults.execution_time_seconds && (
                      <Grid item xs={12}>
                        <Typography variant="caption" color="text.secondary">
                          Analysis completed in {analysisResults.execution_time_seconds.toFixed(1)} seconds
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}

          {errors.whatIf && (
            <Grid item xs={12}>
              <Alert severity="error">{errors.whatIf}</Alert>
            </Grid>
          )}
        </Grid>
      </Box>
    );
  };

  // Render Competitive Analysis Tab
  const renderCompetitiveAnalysis = () => (
    <Box sx={{ py: 8, textAlign: 'center' }}>
      <Paper
        elevation={0}
        sx={{
          p: 6,
          maxWidth: 600,
          mx: 'auto',
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3
        }}
      >
        <Build sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
        <Typography variant="h5" gutterBottom fontWeight={600}>
          Competitive Analysis Coming Soon
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          We're building powerful AI-driven competitive analysis tools to help you understand your property's position in the market.
        </Typography>
        <Chip
          icon={<InfoOutlined />}
          label="Feature Under Construction"
          color="primary"
          variant="outlined"
          sx={{ mb: 2 }}
        />
        <Typography variant="body2" color="text.secondary">
          Expected features: Market share analysis, competitor pricing strategies, and unique selling points identification.
        </Typography>
      </Paper>
    </Box>
  );

  // Render Property Valuation Tab
  const renderPropertyValuation = () => (
    <Box sx={{ py: 8, textAlign: 'center' }}>
      <Paper
        elevation={0}
        sx={{
          p: 6,
          maxWidth: 600,
          mx: 'auto',
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3
        }}
      >
        <AttachMoney sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
        <Typography variant="h5" gutterBottom fontWeight={600}>
          Property Valuation Coming Soon
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Advanced AI valuation models are being developed to provide accurate, real-time property valuations based on comprehensive market data.
        </Typography>
        <Chip
          icon={<InfoOutlined />}
          label="Feature Under Construction"
          color="primary"
          variant="outlined"
          sx={{ mb: 2 }}
        />
        <Typography variant="body2" color="text.secondary">
          Expected features: Automated valuation models, comparable sales analysis, and value trend predictions.
        </Typography>
      </Paper>
    </Box>
  );

  // Render Market Forecast Tab
  const renderMarketForecast = () => (
    <Box sx={{ py: 8, textAlign: 'center' }}>
      <Paper
        elevation={0}
        sx={{
          p: 6,
          maxWidth: 600,
          mx: 'auto',
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3
        }}
      >
        <AutoGraph sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
        <Typography variant="h5" gutterBottom fontWeight={600}>
          Market Forecast Coming Soon
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Predictive analytics powered by machine learning will soon help you anticipate market trends and make informed decisions.
        </Typography>
        <Chip
          icon={<InfoOutlined />}
          label="Feature Under Construction"
          color="primary"
          variant="outlined"
          sx={{ mb: 2 }}
        />
        <Typography variant="body2" color="text.secondary">
          Expected features: 30-day price predictions, seasonal trend analysis, and market volatility indicators.
        </Typography>
      </Paper>
    </Box>
  );

  // Render Market Overview Tab
  const renderMarketOverview = () => {
    // Use the new SQL-based market insights instead of AI
    return (
      <Box>
        {/* Similarity Filter Controls */}
        <Box sx={{ 
          backgroundColor: '#F0F4FF', 
          p: 2, 
          borderRadius: 1, 
          mb: 3,
          border: '1px solid #E5E7EB'
        }}>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            Comparison Filters - Compare with Similar Properties
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Room Tolerance</InputLabel>
                <Select
                  value={filters.room_tolerance || 0}
                  onChange={(e) => setFilters(prev => ({ ...prev, room_tolerance: e.target.value }))}
                  label="Room Tolerance"
                >
                  <MenuItem value={0}>Exact match</MenuItem>
                  <MenuItem value={0.5}>±0.5 rooms</MenuItem>
                  <MenuItem value={1}>±1 room</MenuItem>
                  <MenuItem value={2}>±2 rooms</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Box>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  Search Radius: {filters.radius_km || 5} km
                </Typography>
                <Slider
                  value={filters.radius_km || 5}
                  onChange={(e, value) => setFilters(prev => ({ ...prev, radius_km: value }))}
                  min={1}
                  max={20}
                  step={1}
                  marks={[
                    { value: 1, label: '1km' },
                    { value: 5, label: '5km' },
                    { value: 10, label: '10km' },
                    { value: 20, label: '20km' }
                  ]}
                  valueLabelDisplay="auto"
                  sx={{ color: '#6B7280' }}
                />
              </Box>
            </Grid>
          </Grid>
          
          <Box mt={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="caption" color="text.secondary">
                Comparing with properties: 
              </Typography>
              <Stack direction="row" spacing={1}>
                {selectedProperty?.bedrooms && (
                  <Chip 
                    label={`${selectedProperty.bedrooms}${filters.room_tolerance > 0 ? `±${filters.room_tolerance}` : ''} rooms`}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.75rem' }}
                  />
                )}
                <Chip 
                  label={`Within ${filters.radius_km || 5}km`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.75rem' }}
                />
              </Stack>
              <Button
                size="small"
                variant="contained"
                onClick={() => {
                  // Force update filters to trigger API call
                  setFilters(prev => ({...prev}));
                  refetch();
                }}
                disabled={marketLoading}
                sx={{ 
                  ml: 'auto',
                  backgroundColor: '#8DA4EF',
                  '&:hover': { backgroundColor: '#3E63DD' }
                }}
              >
                Apply Filters
              </Button>
            </Stack>
          </Box>
        </Box>
        
        {/* Market Statistics */}
        {marketLoading ? (
          <LinearProgress variant="indeterminate" />
        ) : marketData ? (
          <>
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={3}>
                <Box textAlign="center">
                  <Typography variant="h4" sx={{ color: '#3E63DD', fontWeight: 'bold' }}>
                    {marketData.market_analytics?.total_properties || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Similar {formatPropertyType(selectedProperty?.property_type, true)} {isSaleProperty(selectedProperty) ? 'For Sale' : 'For Rent'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box textAlign="center">
                  <Typography variant="h4" sx={{ color: '#10B981', fontWeight: 'bold' }}>
                    CHF {(() => {
                      let price = marketData.market_analytics?.average_price || 0;
                      // For rentals, if price is above 10,000, it's likely annual or wrong scale
                      if (!isSaleProperty(selectedProperty) && price > 10000) {
                        price = Math.round(price / 12);
                      }
                      return price.toLocaleString();
                    })()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Average {isSaleProperty(selectedProperty) ? 'Sale Price' : 'Monthly Rent'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box textAlign="center">
                  <Typography variant="h4" sx={{ color: '#8B5CF6', fontWeight: 'bold' }}>
                    CHF {(() => {
                      let price = marketData.market_analytics?.median_price || 0;
                      // For rentals, if price is above 10,000, it's likely annual or wrong scale
                      if (!isSaleProperty(selectedProperty) && price > 10000) {
                        price = Math.round(price / 12);
                      }
                      return price.toLocaleString();
                    })()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Median {isSaleProperty(selectedProperty) ? 'Sale Price' : 'Monthly Rent'}
                  </Typography>
                </Box>
              </Grid>
              {selectedProperty?.bedrooms && (
                <Grid item xs={12} md={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" sx={{ color: '#6B7280' }}>
                      {selectedProperty.bedrooms}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Number of Rooms
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
            
            {/* Property Details Section */}
            <Divider sx={{ my: 3 }} />
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
                Property Information
              </Typography>
              
              <Stack spacing={3}>
                {/* Title */}
                {selectedProperty?.title && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Title:
                    </Typography>
                    <Typography variant="body1" fontWeight="500">
                      {selectedProperty.title}
                    </Typography>
                  </Box>
                )}
                
                {/* Price/Rent */}
                {selectedProperty?.price_chf && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {isSaleProperty(selectedProperty) ? 'Price:' : 'Monthly Rent:'}
                    </Typography>
                    <Typography variant="h6" fontWeight="bold" color="primary">
                      CHF {selectedProperty.price_chf.toLocaleString()}
                    </Typography>
                  </Box>
                )}
                
                {/* Location */}
                {(selectedProperty?.city || selectedProperty?.canton) && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Location:
                    </Typography>
                    <Typography variant="body1" fontWeight="500">
                      {[selectedProperty.street, selectedProperty.city, selectedProperty.canton, selectedProperty.zip_code]
                        .filter(Boolean)
                        .join(', ')}
                    </Typography>
                  </Box>
                )}
                
                {/* Description */}
                {(selectedProperty?.description || selectedProperty?.full_description) && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Description:
                    </Typography>
                    <Box 
                      sx={{ 
                        backgroundColor: '#F9FAFB',
                        p: 2,
                        borderRadius: 1,
                        border: '1px solid #E5E7EB'
                      }}
                    >
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          lineHeight: 1.8,
                          color: '#374151'
                        }}
                      >
                        {selectedProperty.full_description || 
                         selectedProperty.description || 
                         'No description available'}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Stack>
            </Box>

            {/* Charts Section */}
            <Divider sx={{ my: 3 }} />
            <MarketInsightsCharts 
              marketData={marketData} 
              selectedProperty={selectedProperty}
              dealType={isSaleProperty(selectedProperty) ? 'sale' : 'rent'}
            />
          </>
        ) : (
          <Alert severity="info">Select a property to see market data</Alert>
        )}
      </Box>
    );
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box mb={4}>
          <Typography variant="h4" gutterBottom fontWeight="bold">
            <Analytics sx={{ mr: 2, verticalAlign: 'bottom' }} />
            AI-Powered Property Analytics
          </Typography>
        </Box>

        {/* Property Selector with Labels */}
        {properties.length > 0 && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Select Your Property
              </Typography>
              {selectedProperty && (
                <Stack direction="row" spacing={1}>
                  <Chip
                    label={formatPropertyType(selectedProperty?.property_type)}
                    size="small"
                    sx={{
                      borderColor: '#9CA3AF',
                      color: '#6B7280'
                    }}
                    variant="outlined"
                  />
                  <Chip
                    label={isSaleProperty(selectedProperty) ? 'For Sale' : 'For Rent'}
                    size="small"
                    sx={{
                      backgroundColor: isSaleProperty(selectedProperty) ? '#AA99EC20' : '#AEC2FF20',
                      color: isSaleProperty(selectedProperty) ? '#92400E' : '#1E40AF'
                    }}
                  />
                </Stack>
              )}
            </Box>

            {properties.length === 1 ? (
              <Box>
                <Typography variant="body1" fontWeight="500">
                  {selectedProperty?.title || selectedProperty?.street || `Property ${selectedProperty?.id}`}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedProperty?.street && selectedProperty?.street !== selectedProperty?.title && `${selectedProperty.street}, `}
                  {selectedProperty?.zip_code} {selectedProperty?.city} - CHF {selectedProperty?.price_chf?.toLocaleString() || selectedProperty?.price?.toLocaleString() || 'N/A'}
                  {selectedProperty?.deal_type === 'rent' ? '/month' : ''}
                </Typography>
              </Box>
            ) : (
              <FormControl fullWidth>
                <InputLabel id="property-select-label">Choose a property</InputLabel>
                <Select
                  labelId="property-select-label"
                  value={selectedPropertyId || ''}
                  onChange={(e) => {
                    const newPropertyId = e.target.value;
                    setSelectedPropertyId(newPropertyId);
                    // Clear any cached AI results when property changes
                    setAiResults({
                      whatIf: null,
                      competitive: null,
                      valuation: null,
                      forecast: null
                    });
                    setAnalysisResults(null);
                  }}
                  label="Choose a property"
                >
                  <MenuItem value="">
                    <Typography variant="body1" color="text.secondary">
                      Select Property
                    </Typography>
                  </MenuItem>
                  {properties.map((property) => (
                    <MenuItem key={property.id} value={property.id}>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="body1">
                          {property.title || property.street || `Property ${property.id}`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {property.street && property.street !== property.title && `${property.street}, `}
                          {property.zip_code} {property.city} - CHF {property.price_chf?.toLocaleString() || property.price?.toLocaleString() || 'N/A'}{property.deal_type === 'rent' ? '/month' : ''}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Paper>
        )}

        {/* Show message if no properties */}
        {properties.length === 0 && (
          <Alert severity="info" sx={{ mb: 3 }}>
            No properties available. Please add a property to view analytics.
          </Alert>
        )}


        {/* Tabbed AI Analysis */}
        {selectedProperty && (
          <Paper sx={{ p: 0 }}>
            <StyledTabs value={activeTab} onChange={handleTabChange}>
              <Tab label={isSaleProperty(selectedProperty) ? 'Sales Market Insights' : 'Rental Market Insights'} icon={<Assessment />} iconPosition="start" />
              <Tab label="What-If Analysis" icon={<Build />} iconPosition="start" />
              <Tab label="Competitive Analysis" icon={<Compare />} iconPosition="start" />
              <Tab label="Property Valuation" icon={<AttachMoney />} iconPosition="start" />
              <Tab label="Market Forecast" icon={<AutoGraph />} iconPosition="start" />
            </StyledTabs>
            
            <Box sx={{ p: 3 }}>
              {activeTab === 0 && renderMarketOverview()}
              {activeTab === 1 && renderWhatIfAnalysis()}
              {activeTab === 2 && renderCompetitiveAnalysis()}
              {activeTab === 3 && renderPropertyValuation()}
              {activeTab === 4 && renderMarketForecast()}
            </Box>
          </Paper>
        )}

        {!selectedProperty && properties.length > 0 && (
          <Alert severity="info" sx={{ mt: 3 }}>
            Please select a property from the dropdown above to view analytics
          </Alert>
        )}

        {/* Loading Dialog with Rotating Messages */}
        <Dialog
          open={loadingStates.whatIf || loadingStates.competitive || loadingStates.valuation || loadingStates.forecast}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }
          }}
        >
          <DialogTitle sx={{ color: 'white', pb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CircularProgress size={24} sx={{ color: 'white' }} />
              <Typography variant="h6">Analyzing Your Property</Typography>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 2,
                background: 'rgba(255, 255, 255, 0.95)',
                minHeight: 120
              }}
            >
              <Fade in={true} timeout={500} key={messageIndex}>
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ color: '#667eea', fontWeight: 600 }}>
                    {analysisLoadingMessages[messageIndex].title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {analysisLoadingMessages[messageIndex].detail}
                  </Typography>
                </Box>
              </Fade>

              <Box sx={{ mt: 3 }}>
                <LinearProgress
                  variant="indeterminate"
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#667eea',
                      borderRadius: 3
                    }
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  This analysis typically takes 1-2 minutes as we process extensive market data for accuracy
                </Typography>
              </Box>

              {/* Progress Steps */}
              <Box sx={{ mt: 3 }}>
                <Stack direction="row" spacing={1} justifyContent="center">
                  {[...Array(8)].map((_, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: idx === messageIndex ? '#667eea' : '#e0e0e0',
                        transition: 'all 0.3s ease'
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            </Paper>

            {/* Fun Fact Section */}
            <Paper
              elevation={0}
              sx={{
                mt: 2,
                p: 2,
                borderRadius: 2,
                background: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid rgba(102, 126, 234, 0.2)'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Lightbulb sx={{ color: '#f59e0b', fontSize: 20, mt: 0.5 }} />
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Did you know?
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Properties with kitchen renovations typically see 15-20% higher rental income and
                    rent 30% faster than comparable properties without updates.
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </DialogContent>
        </Dialog>
      </Box>
    </Container>
  );
};

export default UnifiedAnalyticsV3;