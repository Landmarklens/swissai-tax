import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  LinearProgress,
  Chip,
  Alert,
  Divider,
  IconButton,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stack,
  Slider,
  Tooltip
} from '@mui/material';
import {
  Construction as ConstructionIcon,
  Kitchen as KitchenIcon,
  Bathroom as BathroomIcon,
  EnergySavings as EnergySavingsIcon,
  Balcony as BalconyIcon,
  SmartHome as SmartHomeIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  Timeline as TimelineIcon,
  InfoOutlined as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Flooring as FlooringIcon,
  Calculate as CalculateIcon
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from 'recharts';

const RenovationImpactSimulator = ({ property, currentRent = 2500 }) => {
  const [selectedRenovations, setSelectedRenovations] = useState([]);
  const [showDetails, setShowDetails] = useState(false);
  const [calculating, setCalculating] = useState(false);

  const renovationOptions = [
    {
      id: 'kitchen',
      name: 'Kitchen Renovation',
      icon: <KitchenIcon />,
      cost: 25000,
      rentIncrease: { min: 180, max: 220 },
      roi: 14,
      description: 'Modern appliances, new cabinets, and countertops',
      popularity: 85,
      tenantAppeal: 95
    },
    {
      id: 'bathroom',
      name: 'Bathroom Upgrade',
      icon: <BathroomIcon />,
      cost: 15000,
      rentIncrease: { min: 120, max: 150 },
      roi: 11,
      description: 'New fixtures, tiles, and modern shower',
      popularity: 78,
      tenantAppeal: 88
    },
    {
      id: 'flooring',
      name: 'New Flooring',
      icon: <FlooringIcon />,
      cost: 12000,
      rentIncrease: { min: 80, max: 100 },
      roi: 13,
      description: 'Premium laminate or hardwood flooring',
      popularity: 72,
      tenantAppeal: 80
    },
    {
      id: 'smart',
      name: 'Smart Home Features',
      icon: <SmartHomeIcon />,
      cost: 8000,
      rentIncrease: { min: 60, max: 80 },
      roi: 10,
      description: 'Smart locks, thermostat, and lighting',
      popularity: 65,
      tenantAppeal: 75
    },
    {
      id: 'energy',
      name: 'Energy Efficiency',
      icon: <EnergySavingsIcon />,
      cost: 18000,
      rentIncrease: { min: 100, max: 130 },
      roi: 16,
      description: 'Solar panels, insulation, efficient windows',
      popularity: 82,
      tenantAppeal: 70
    },
    {
      id: 'balcony',
      name: 'Balcony Addition',
      icon: <BalconyIcon />,
      cost: 35000,
      rentIncrease: { min: 200, max: 250 },
      roi: 15,
      description: 'Add or expand balcony/terrace space',
      popularity: 92,
      tenantAppeal: 98
    }
  ];

  const handleRenovationToggle = (renovationId) => {
    setSelectedRenovations(prev => {
      if (prev.includes(renovationId)) {
        return prev.filter(id => id !== renovationId);
      }
      return [...prev, renovationId];
    });
  };

  const calculateTotalInvestment = () => {
    return selectedRenovations.reduce((total, id) => {
      const renovation = renovationOptions.find(r => r.id === id);
      return total + (renovation?.cost || 0);
    }, 0);
  };

  const calculateRentIncrease = () => {
    return selectedRenovations.reduce((total, id) => {
      const renovation = renovationOptions.find(r => r.id === id);
      if (renovation) {
        return total + (renovation.rentIncrease.min + renovation.rentIncrease.max) / 2;
      }
      return total;
    }, 0);
  };

  const calculateROI = () => {
    const investment = calculateTotalInvestment();
    const monthlyIncrease = calculateRentIncrease();
    if (investment === 0 || monthlyIncrease === 0) return 0;
    return Math.ceil(investment / monthlyIncrease);
  };

  const calculate10YearProfit = () => {
    const monthlyIncrease = calculateRentIncrease();
    const investment = calculateTotalInvestment();
    return (monthlyIncrease * 120) - investment; // 10 years = 120 months
  };

  const getSelectedRenovations = () => {
    return selectedRenovations.map(id => 
      renovationOptions.find(r => r.id === id)
    ).filter(Boolean);
  };

  const simulateImpact = () => {
    setCalculating(true);
    setTimeout(() => {
      setCalculating(false);
      setShowDetails(true);
    }, 1500);
  };

  // Chart data
  const roiChartData = [
    { month: '6m', value: calculateRentIncrease() * 6 },
    { month: '1y', value: calculateRentIncrease() * 12 },
    { month: '2y', value: calculateRentIncrease() * 24 },
    { month: '5y', value: calculateRentIncrease() * 60 },
    { month: '10y', value: calculateRentIncrease() * 120 }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <Card elevation={2}>
      <CardContent>
        {/* Header */}
        <Box display="flex" alignItems="center" mb={3}>
          <ConstructionIcon sx={{ fontSize: 32, color: 'warning.main', mr: 2 }} />
          <Box flex={1}>
            <Typography variant="h5" fontWeight="600">
              Renovation Impact Simulator
            </Typography>
            <Typography variant="body2" color="text.secondary">
              AI-powered ROI calculator for property improvements
            </Typography>
          </Box>
        </Box>

        {/* Current Rent Display */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
          <Typography variant="subtitle2" color="text.secondary">
            Current Monthly Rent
          </Typography>
          <Typography variant="h6">
            CHF {currentRent.toLocaleString()}
          </Typography>
        </Paper>

        {/* Renovation Options */}
        <Box mb={3}>
          <Typography variant="subtitle1" fontWeight="600" gutterBottom>
            Select Renovations to Simulate
          </Typography>
          <Grid container spacing={2}>
            {renovationOptions.map((renovation) => (
              <Grid item xs={12} key={renovation.id}>
                <Paper 
                  sx={{ 
                    p: 2, 
                    cursor: 'pointer',
                    border: selectedRenovations.includes(renovation.id) ? 2 : 1,
                    borderColor: selectedRenovations.includes(renovation.id) ? 'primary.main' : 'divider',
                    bgcolor: selectedRenovations.includes(renovation.id) ? 'primary.50' : 'background.paper',
                    transition: 'all 0.3s'
                  }}
                  onClick={() => handleRenovationToggle(renovation.id)}
                >
                  <Grid container alignItems="center" spacing={2}>
                    <Grid item>
                      <Checkbox
                        checked={selectedRenovations.includes(renovation.id)}
                        color="primary"
                      />
                    </Grid>
                    <Grid item>
                      {renovation.icon}
                    </Grid>
                    <Grid item xs>
                      <Typography variant="body1" fontWeight="500">
                        {renovation.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {renovation.description}
                      </Typography>
                    </Grid>
                    <Grid item>
                      <Stack alignItems="flex-end" spacing={0.5}>
                        <Chip 
                          label={`CHF ${renovation.cost.toLocaleString()}`}
                          size="small"
                          variant="outlined"
                        />
                        <Typography variant="caption" color="success.main" fontWeight="600">
                          +CHF {renovation.rentIncrease.min}-{renovation.rentIncrease.max}/mo
                        </Typography>
                      </Stack>
                    </Grid>
                  </Grid>
                  
                  {/* Popularity indicators */}
                  <Box display="flex" gap={2} mt={1}>
                    <Box flex={1}>
                      <Typography variant="caption" color="text.secondary">
                        Market Appeal
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={renovation.popularity} 
                        sx={{ height: 4, borderRadius: 2 }}
                      />
                    </Box>
                    <Box flex={1}>
                      <Typography variant="caption" color="text.secondary">
                        Tenant Interest
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={renovation.tenantAppeal}
                        color="secondary"
                        sx={{ height: 4, borderRadius: 2 }}
                      />
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Impact Summary */}
        {selectedRenovations.length > 0 && (
          <>
            <Divider sx={{ my: 3 }} />
            
            <Box mb={3}>
              <Typography variant="h6" gutterBottom>
                Investment Analysis
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'error.50' }}>
                    <MoneyIcon sx={{ color: 'error.main', mb: 1 }} />
                    <Typography variant="subtitle2" color="text.secondary">
                      Total Investment
                    </Typography>
                    <Typography variant="h5" color="error.main" fontWeight="bold">
                      CHF {calculateTotalInvestment().toLocaleString()}
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.50' }}>
                    <TrendingUpIcon sx={{ color: 'success.main', mb: 1 }} />
                    <Typography variant="subtitle2" color="text.secondary">
                      New Monthly Rent
                    </Typography>
                    <Typography variant="h5" color="success.main" fontWeight="bold">
                      CHF {(currentRent + calculateRentIncrease()).toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="success.main">
                      +CHF {calculateRentIncrease().toFixed(0)}/month
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>

            {/* ROI Metrics */}
            <Grid container spacing={2} mb={3}>
              <Grid item xs={4}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <TimelineIcon sx={{ color: 'primary.main', mb: 1 }} />
                  <Typography variant="subtitle2" color="text.secondary">
                    ROI Timeline
                  </Typography>
                  <Typography variant="h6" color="primary.main">
                    {calculateROI()} months
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={4}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <CalculateIcon sx={{ color: 'secondary.main', mb: 1 }} />
                  <Typography variant="subtitle2" color="text.secondary">
                    Annual Return
                  </Typography>
                  <Typography variant="h6" color="secondary.main">
                    {((calculateRentIncrease() * 12 / calculateTotalInvestment()) * 100).toFixed(1)}%
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={4}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <MoneyIcon sx={{ color: 'success.main', mb: 1 }} />
                  <Typography variant="subtitle2" color="text.secondary">
                    10-Year Profit
                  </Typography>
                  <Typography variant="h6" color="success.main">
                    CHF {calculate10YearProfit().toLocaleString()}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* ROI Chart */}
            {showDetails && (
              <Box mb={3}>
                <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                  Return on Investment Over Time
                </Typography>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={roiChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <RechartsTooltip formatter={(value) => `CHF ${value.toLocaleString()}`} />
                    <Bar dataKey="value" fill="#1976d2" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            )}

            {/* Action Buttons */}
            <Stack spacing={2}>
              {!showDetails ? (
                <Button
                  variant="contained"
                  fullWidth
                  onClick={simulateImpact}
                  disabled={calculating || selectedRenovations.length === 0}
                  startIcon={<CalculateIcon />}
                >
                  {calculating ? 'Calculating Impact...' : 'Simulate Impact'}
                </Button>
              ) : (
                <>
                  <Button variant="contained" fullWidth>
                    Generate Detailed Report
                  </Button>
                  <Button variant="outlined" fullWidth>
                    Compare Different Scenarios
                  </Button>
                </>
              )}
            </Stack>

            {calculating && (
              <Box mt={2}>
                <LinearProgress />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                  AI analyzing market data and calculating optimal ROI...
                </Typography>
              </Box>
            )}
          </>
        )}

        {/* Tips */}
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>Pro Tip:</strong> Combining kitchen and bathroom renovations typically yields 
            the highest tenant satisfaction and allows for maximum rent increases.
          </Typography>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default RenovationImpactSimulator;