/**
 * Tax Optimization Panel Component
 *
 * Displays AI-powered tax optimization recommendations
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  TrendingUp as SaveIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { getApiUrl } from '../../utils/api/getApiUrl';
import { useTranslation } from 'react-i18next';

const API_BASE_URL = getApiUrl();

const PRIORITY_COLORS = {
  'high': 'error',
  'medium': 'warning',
  'low': 'info'
};

const DIFFICULTY_ICONS = {
  'easy': '✅',
  'moderate': '⚠️',
  'complex': '🔴'
};

const OptimizationPanel = ({ open, onClose, filingId }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [totalSavings, setTotalSavings] = useState(0);
  const [currentTax, setCurrentTax] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && filingId) {
      loadOptimizations();
    }
  }, [open, filingId]);

  const loadOptimizations = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(
        `${API_BASE_URL}/api/tax-optimization/recommendations/${filingId}`,
        {
          params: { ai_provider: 'anthropic' },
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      setRecommendations(response.data.recommendations || []);
      setTotalSavings(response.data.total_potential_savings || 0);
      setCurrentTax(response.data.current_tax || 0);

    } catch (err) {
      console.error('Error loading optimizations:', err);
      setError(err.response?.data?.detail || 'Failed to load tax optimization recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h5">{t('filing.tax_optimization_recommendations')}</Typography>
          {!loading && recommendations.length > 0 && (
            <Chip
              icon={<SaveIcon />}
              label={`Save CHF ${totalSavings.toLocaleString('de-CH', { minimumFractionDigits: 0 })}`}
              color="success"
              size="medium"
            />
          )}
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : recommendations.length === 0 ? (
          <Alert severity="info">
            No optimization recommendations available at this time.
          </Alert>
        ) : (
          <>
            {/* Summary Card */}
            <Card sx={{ mb: 3, bgcolor: 'success.light' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="subtitle2" color="success.dark">
                      Current Tax Burden
                    </Typography>
                    <Typography variant="h5" color="success.dark">
                      CHF {currentTax.toLocaleString('de-CH', { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                  <Box textAlign="right">
                    <Typography variant="subtitle2" color="success.dark">
                      Potential Savings
                    </Typography>
                    <Typography variant="h5" color="success.dark" fontWeight="bold">
                      CHF {totalSavings.toLocaleString('de-CH', { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Recommendations List */}
            {recommendations.map((rec, index) => (
              <Accordion key={index} defaultExpanded={index === 0}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box display="flex" alignItems="center" width="100%" gap={2}>
                    <Typography sx={{ fontSize: '1.5rem' }}>
                      {DIFFICULTY_ICONS[rec.implementation_difficulty] || '📋'}
                    </Typography>
                    <Box flexGrow={1}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {rec.title}
                      </Typography>
                      <Box display="flex" gap={1} mt={0.5}>
                        <Chip
                          label={rec.priority}
                          color={PRIORITY_COLORS[rec.priority] || 'default'}
                          size="small"
                        />
                        <Chip
                          label={rec.implementation_difficulty}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={rec.time_horizon}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                    <Box textAlign="right">
                      <Typography variant="h6" color="success.main">
                        CHF {(rec.estimated_savings || 0).toLocaleString('de-CH', {
                          minimumFractionDigits: 0
                        })}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        annually
                      </Typography>
                    </Box>
                  </Box>
                </AccordionSummary>

                <AccordionDetails>
                  {/* Description */}
                  <Typography variant="body2" paragraph>
                    {rec.description}
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  {/* Action Steps */}
                  {rec.action_steps && rec.action_steps.length > 0 && (
                    <Box mb={2}>
                      <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        <CheckIcon fontSize="small" sx={{ mr: 1 }} color="success" />
                        Action Steps:
                      </Typography>
                      <List dense>
                        {rec.action_steps.map((step, idx) => (
                          <ListItem key={idx} sx={{ pl: 4 }}>
                            <ListItemText
                              primary={`${idx + 1}. ${step}`}
                              primaryTypographyProps={{ variant: 'body2' }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}

                  {/* Legal References */}
                  {rec.legal_references && rec.legal_references.length > 0 && (
                    <Box mb={2}>
                      <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        <InfoIcon fontSize="small" sx={{ mr: 1 }} color="info" />
                        Legal References:
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={1} pl={4}>
                        {rec.legal_references.map((ref, idx) => (
                          <Chip key={idx} label={ref} size="small" variant="outlined" />
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* Risks & Considerations */}
                  {rec.risks_considerations && rec.risks_considerations.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        <WarningIcon fontSize="small" sx={{ mr: 1 }} color="warning" />
                        Important Considerations:
                      </Typography>
                      <List dense>
                        {rec.risks_considerations.map((risk, idx) => (
                          <ListItem key={idx} sx={{ pl: 4 }}>
                            <ListItemText
                              primary={risk}
                              primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}

                  {/* Savings Confidence */}
                  {rec.savings_confidence && (
                    <Box mt={2} p={1.5} sx={{ bgcolor: 'background.default', borderRadius: 1 }}>
                      <Typography variant="caption" color="textSecondary">
                        Savings estimate confidence: {(rec.savings_confidence * 100).toFixed(0)}%
                      </Typography>
                    </Box>
                  )}
                </AccordionDetails>
              </Accordion>
            ))}

            {/* Disclaimer */}
            <Alert severity="info" sx={{ mt: 3 }}>
              <Typography variant="body2">
                <strong>{t('filing.disclaimer')}</strong> These are AI-generated recommendations based on your tax situation.
                All strategies are legal under Swiss tax law. However, we recommend consulting with a tax
                professional before implementing any significant tax strategies.
              </Typography>
            </Alert>
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>{t('filing.close')}</Button>
        {!loading && recommendations.length > 0 && (
          <Button variant="contained" onClick={handleClose}>
            Implement Recommendations
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default OptimizationPanel;
