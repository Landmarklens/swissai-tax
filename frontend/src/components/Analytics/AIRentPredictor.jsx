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
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Stack,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Home as HomeIcon,
  AttachMoney as MoneyIcon,
  Analytics as AnalyticsIcon,
  Psychology as AIIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const AIRentPredictor = ({ propertyId }) => {
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  const fetchPrediction = async () => {
    if (!propertyId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/ai-analytics/predict-rent`,
        {
          property_id: propertyId,
          use_ai_adjustment: true,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      setPrediction(response.data);
    } catch (err) {
      console.error('Error fetching rent prediction:', err);
      setError(err.response?.data?.detail || 'Failed to predict rent');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (propertyId) {
      fetchPrediction();
    }
  }, [propertyId]);

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'warning';
    return 'error';
  };

  const getConfidenceLabel = (confidence) => {
    if (confidence >= 0.8) return 'High Confidence';
    if (confidence >= 0.6) return 'Medium Confidence';
    return 'Low Confidence';
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="center" py={4}>
            <CircularProgress />
            <Typography ml={2}>Analyzing property with AI...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error" action={
            <Button color="inherit" size="small" onClick={fetchPrediction}>
              Retry
            </Button>
          }>
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!prediction) {
    return (
      <Card>
        <CardContent>
          <Typography color="textSecondary" align="center">
            Select a property to see AI-powered rent prediction
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box mb={3}>
          <Stack direction="row" alignItems="center" spacing={1} mb={2}>
            <AIIcon color="primary" />
            <Typography variant="h5" fontWeight="bold">
              AI Rent Prediction
            </Typography>
          </Stack>
          
          {prediction.property_details && (
            <Typography variant="body2" color="textSecondary" gutterBottom>
              {prediction.property_details.title}
            </Typography>
          )}
        </Box>

        <Grid container spacing={3}>
          {/* Predicted Price */}
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: 2,
                p: 3,
                color: 'white',
                textAlign: 'center',
              }}
            >
              <MoneyIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h3" fontWeight="bold">
                CHF {prediction.predicted_price?.toLocaleString()}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 1 }}>
                Predicted Monthly Rent
              </Typography>
            </Box>
          </Grid>

          {/* Confidence Score */}
          <Grid item xs={12} md={4}>
            <Box textAlign="center">
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Prediction Confidence
              </Typography>
              <Box position="relative" display="inline-flex">
                <CircularProgress
                  variant="determinate"
                  value={prediction.confidence * 100}
                  size={120}
                  thickness={4}
                  sx={{
                    color: theme => theme.palette[getConfidenceColor(prediction.confidence)].main
                  }}
                />
                <Box
                  sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="h4" fontWeight="bold">
                    {Math.round(prediction.confidence * 100)}%
                  </Typography>
                </Box>
              </Box>
              <Chip
                label={getConfidenceLabel(prediction.confidence)}
                color={getConfidenceColor(prediction.confidence)}
                size="small"
                sx={{ mt: 1 }}
              />
            </Box>
          </Grid>

          {/* Price Range */}
          <Grid item xs={12} md={4}>
            <Box>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Expected Price Range
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Stack direction="row" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">
                    Min: CHF {prediction.price_range?.min?.toLocaleString()}
                  </Typography>
                  <Typography variant="body2">
                    Max: CHF {prediction.price_range?.max?.toLocaleString()}
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={
                    ((prediction.predicted_price - prediction.price_range?.min) /
                      (prediction.price_range?.max - prediction.price_range?.min)) * 100
                  }
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Key Factors */}
        {prediction.factors && prediction.factors.length > 0 && (
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              Key Pricing Factors
            </Typography>
            <Grid container spacing={2}>
              {prediction.factors.map((factor, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <Card variant="outlined">
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {factor.name}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {factor.value}
                          </Typography>
                        </Box>
                        <Chip
                          label={`${factor.impact >= 0 ? '+' : ''}${(factor.impact * 100).toFixed(0)}%`}
                          color={factor.impact >= 0 ? 'success' : 'error'}
                          size="small"
                        />
                      </Stack>
                      <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
                        {factor.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Similar Properties */}
        {prediction.similar_properties && prediction.similar_properties.length > 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Similar Properties Used for Prediction
            </Typography>
            <List>
              {prediction.similar_properties.slice(0, 5).map((prop, index) => (
                <React.Fragment key={prop.id}>
                  <ListItem>
                    <ListItemText
                      primary={
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" noWrap sx={{ maxWidth: '60%' }}>
                            {prop.title}
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            CHF {prop.price?.toLocaleString()}
                          </Typography>
                        </Stack>
                      }
                      secondary={
                        <Stack direction="row" spacing={2} mt={0.5}>
                          <Typography variant="caption" color="textSecondary">
                            {prop.city}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {prop.bedrooms} bedrooms
                          </Typography>
                          <Chip
                            label={`${(prop.similarity * 100).toFixed(0)}% match`}
                            size="small"
                            variant="outlined"
                          />
                        </Stack>
                      }
                    />
                  </ListItem>
                  {index < prediction.similar_properties.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Box>
        )}

        {/* Methodology */}
        <Box mt={3} p={2} bgcolor="grey.50" borderRadius={1}>
          <Stack direction="row" spacing={1} alignItems="center">
            <AnalyticsIcon fontSize="small" color="action" />
            <Typography variant="caption" color="textSecondary">
              <strong>Methodology:</strong> {prediction.methodology}
            </Typography>
          </Stack>
          {prediction.adjustment_reason && (
            <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block' }}>
              <strong>Adjustment:</strong> {prediction.adjustment_reason}
            </Typography>
          )}
        </Box>

        {/* Refresh Button */}
        <Box mt={3} textAlign="center">
          <Button
            variant="outlined"
            startIcon={<AIIcon />}
            onClick={fetchPrediction}
            disabled={loading}
          >
            Recalculate Prediction
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default AIRentPredictor;