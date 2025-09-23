import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  LinearProgress,
  Chip,
  Grid,
  Alert,
  Slider,
  Stack,
  Divider,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Tooltip
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Psychology as PsychologyIcon,
  LocationOn as LocationOnIcon,
  Home as HomeIcon,
  AttachMoney as AttachMoneyIcon,
  BarChart as BarChartIcon,
  InfoOutlined as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  CameraAlt as CameraIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';

const AIRentPredictor = ({ property, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [confidence, setConfidence] = useState(92);

  // Mock AI prediction data
  const mockPrediction = {
    minRent: 2850,
    maxRent: 3150,
    recommendedRent: 2980,
    currentRent: property?.price_chf || 2500,
    confidence: 92,
    basedOnProperties: 487,
    factors: [
      { 
        name: 'Location Score', 
        score: 9.2, 
        impact: 350, 
        icon: <LocationOnIcon />,
        details: 'Prime location near public transport and schools'
      },
      { 
        name: 'Property Condition', 
        score: 7.8, 
        impact: 200, 
        icon: <HomeIcon />,
        details: 'Well-maintained, minor updates recommended'
      },
      { 
        name: 'Amenities', 
        score: 8.5, 
        impact: 280, 
        icon: <CheckCircleIcon />,
        details: 'Balcony, parking, storage included'
      },
      { 
        name: 'Market Demand', 
        score: 9.0, 
        impact: 150, 
        icon: <TrendingUpIcon />,
        details: 'High demand area with low vacancy rates'
      }
    ],
    comparables: [
      { address: 'Bahnhofstrasse 45', rent: 3100, similarity: 94 },
      { address: 'Seestrasse 12', rent: 2950, similarity: 91 },
      { address: 'Kirchweg 8', rent: 2900, similarity: 89 }
    ],
    dataPoints: {
      images: 12,
      description: true,
      marketData: true,
      historicalData: true
    }
  };

  const handlePredict = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setPrediction(mockPrediction);
      setLoading(false);
    }, 2000);
  };

  const getRentDifference = () => {
    if (!prediction) return 0;
    return prediction.recommendedRent - prediction.currentRent;
  };

  const getRentDifferencePercent = () => {
    if (!prediction) return 0;
    return ((getRentDifference() / prediction.currentRent) * 100).toFixed(1);
  };

  return (
    <Card elevation={2}>
      <CardContent>
        {/* Header */}
        <Box display="flex" alignItems="center" mb={3}>
          <PsychologyIcon sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
          <Box flex={1}>
            <Typography variant="h5" fontWeight="600">
              AI Rent Prediction
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Machine learning analysis of your property's optimal rent
            </Typography>
          </Box>
        </Box>

        {/* Current Property Info */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Analyzing Property
          </Typography>
          <Typography variant="h6">
            {property?.title || '3BR Apartment, Zurich'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Current rent: CHF {property?.price_chf || '2,500'}/month
          </Typography>
        </Paper>

        {/* Prediction Results */}
        {!prediction ? (
          <Box textAlign="center" py={4}>
            {loading ? (
              <>
                <LinearProgress sx={{ mb: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  Analyzing property data, images, and market trends...
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="body1" color="text.secondary" mb={2}>
                  Get AI-powered rent recommendations based on:
                </Typography>
                <Grid container spacing={1} justifyContent="center" mb={3}>
                  <Grid item>
                    <Chip icon={<CameraIcon />} label="Property Images" size="small" />
                  </Grid>
                  <Grid item>
                    <Chip icon={<DescriptionIcon />} label="Description Analysis" size="small" />
                  </Grid>
                  <Grid item>
                    <Chip icon={<BarChartIcon />} label="Market Data" size="small" />
                  </Grid>
                </Grid>
                <Button
                  variant="contained"
                  onClick={handlePredict}
                  startIcon={<PsychologyIcon />}
                  size="large"
                >
                  Get AI Prediction
                </Button>
              </>
            )}
          </Box>
        ) : (
          <>
            {/* Rent Range Visualization */}
            <Box mb={3}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                AI Predicted Rent Range
              </Typography>
              <Box sx={{ px: 2, mb: 1 }}>
                <Slider
                  value={[prediction.minRent, prediction.maxRent]}
                  min={prediction.currentRent - 500}
                  max={prediction.currentRent + 1000}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => `CHF ${value}`}
                  marks={[
                    { value: prediction.currentRent, label: 'Current' },
                    { value: prediction.recommendedRent, label: 'Recommended' }
                  ]}
                  disabled
                  sx={{
                    '& .MuiSlider-thumb': {
                      display: 'none'
                    },
                    '& .MuiSlider-track': {
                      height: 8
                    }
                  }}
                />
              </Box>
              <Box display="flex" justifyContent="space-between" mb={2}>
                <Typography variant="caption">
                  CHF {prediction.minRent}
                </Typography>
                <Typography variant="caption">
                  CHF {prediction.maxRent}
                </Typography>
              </Box>
            </Box>

            {/* Confidence Score */}
            <Box mb={3}>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="subtitle2">
                  Prediction Confidence
                </Typography>
                <Typography variant="subtitle2" color="primary">
                  {prediction.confidence}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={prediction.confidence} 
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                Based on {prediction.basedOnProperties} similar properties
              </Typography>
            </Box>

            {/* Recommended Rent */}
            <Paper 
              sx={{ 
                p: 3, 
                mb: 3, 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white'
              }}
            >
              <Typography variant="subtitle2" sx={{ opacity: 0.9 }} gutterBottom>
                AI Recommended Rent
              </Typography>
              <Typography variant="h3" fontWeight="bold" gutterBottom>
                CHF {prediction.recommendedRent}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                per month
              </Typography>
              
              {getRentDifference() > 0 && (
                <Alert 
                  severity="success" 
                  sx={{ mt: 2, bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }}
                  icon={<TrendingUpIcon sx={{ color: 'white' }} />}
                >
                  Potential increase of CHF {getRentDifference()} ({getRentDifferencePercent()}%)
                </Alert>
              )}
            </Paper>

            {/* Key Factors */}
            <Box mb={3}>
              <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                Key Pricing Factors
              </Typography>
              <List dense>
                {prediction.factors.map((factor, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {factor.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                          <Typography variant="body2">
                            {factor.name}
                          </Typography>
                          <Chip 
                            label={`+CHF ${factor.impact}`} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={factor.score * 10} 
                            sx={{ height: 4, borderRadius: 2, my: 0.5 }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {factor.details}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>

            {/* Comparable Properties */}
            <Box>
              <Button
                fullWidth
                onClick={() => setExpanded(!expanded)}
                endIcon={<ExpandMoreIcon sx={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }} />}
                sx={{ justifyContent: 'space-between', mb: 1 }}
              >
                View Comparable Properties
              </Button>
              <Collapse in={expanded}>
                <List dense>
                  {prediction.comparables.map((comp, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemText
                        primary={comp.address}
                        secondary={`CHF ${comp.rent}/month • ${comp.similarity}% similar`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Action Buttons */}
            <Stack spacing={2}>
              <Button 
                variant="contained" 
                fullWidth
                onClick={() => onUpdate?.(prediction.recommendedRent)}
              >
                Apply Recommended Rent
              </Button>
              <Button 
                variant="outlined" 
                fullWidth
              >
                See Detailed Analysis
              </Button>
            </Stack>

            {/* Data Sources */}
            <Box mt={3} p={2} bgcolor="grey.50" borderRadius={1}>
              <Typography variant="caption" color="text.secondary">
                Analysis based on: {prediction.dataPoints.images} property images • 
                Description analysis • {prediction.basedOnProperties} market comparables • 
                Historical trends
              </Typography>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AIRentPredictor;