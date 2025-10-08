/**
 * Insights Section Component
 * Displays AI-generated tax insights and recommendations on the Profile page
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  IconButton,
  Alert,
  CircularProgress,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  LightbulbOutlined as InsightIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  TrendingUp as SavingsIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import axios from 'axios';
import { getApiUrl } from '../../../utils/api/getApiUrl';

const API_BASE_URL = getApiUrl();

const InsightsSection = ({ filingId }) => {
  const { t } = useTranslation();

  // State
  const [insights, setInsights] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedInsights, setExpandedInsights] = useState({});
  const [detailDialog, setDetailDialog] = useState({ open: false, insight: null });

  // Load insights on mount or when filingId changes
  useEffect(() => {
    if (filingId) {
      loadInsights();
      loadStatistics();
    }
  }, [filingId]);

  const loadInsights = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`${API_BASE_URL}/api/insights/filing/${filingId}`);

      setInsights(response.data || []);
    } catch (err) {
      console.error('Error loading insights:', err);
      setError(err.response?.data?.detail || 'Failed to load insights');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/insights/statistics/${filingId}`);

      setStatistics(response.data || {});
    } catch (err) {
      console.error('Error loading statistics:', err);
    }
  };

  const handleAcknowledge = async (insightId) => {
    try {
      await axios.post(`${API_BASE_URL}/api/insights/${insightId}/acknowledge`, {});

      // Update local state
      setInsights(insights.map(ins =>
        ins.id === insightId ? { ...ins, is_acknowledged: true } : ins
      ));
    } catch (err) {
      console.error('Error acknowledging insight:', err);
    }
  };

  const handleMarkApplied = async (insightId) => {
    try {
      await axios.post(`${API_BASE_URL}/api/insights/${insightId}/apply`, {});

      // Update local state
      setInsights(insights.map(ins =>
        ins.id === insightId ? { ...ins, is_applied: true, is_acknowledged: true } : ins
      ));
    } catch (err) {
      console.error('Error marking insight as applied:', err);
    }
  };

  const handleGenerateInsights = async () => {
    try {
      setLoading(true);
      await axios.post(
        `${API_BASE_URL}/api/insights/generate/${filingId}`,
        { force_regenerate: true }
      );

      // Reload insights
      await loadInsights();
      await loadStatistics();
    } catch (err) {
      console.error('Error generating insights:', err);
      setError(err.response?.data?.detail || 'Failed to generate insights');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (insightId) => {
    setExpandedInsights({
      ...expandedInsights,
      [insightId]: !expandedInsights[insightId]
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
      default:
        return 'info';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'deduction_opportunity':
        return <SavingsIcon color="success" />;
      case 'compliance_warning':
        return <WarningIcon color="warning" />;
      case 'tax_saving_tip':
        return <InsightIcon color="primary" />;
      case 'missing_document':
        return <InfoIcon color="info" />;
      default:
        return <InsightIcon />;
    }
  };

  if (!filingId) {
    return (
      <Alert severity="info">
        {t('insights.noFiling', 'Select a tax filing to view insights')}
      </Alert>
    );
  }

  if (loading && insights.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>{t('insights.loading', 'Loading insights...')}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          {t('insights.title', 'Tax Insights & Recommendations')}
        </Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={handleGenerateInsights}
          disabled={loading}
        >
          {t('insights.regenerate', 'Regenerate')}
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Statistics Summary */}
      {statistics.total_insights > 0 && (
        <Card sx={{ mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
              <Box>
                <Typography variant="h4">{statistics.total_insights}</Typography>
                <Typography variant="body2">{t('insights.stats.total', 'Total Insights')}</Typography>
              </Box>
              <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
              <Box>
                <Typography variant="h4">
                  CHF {(statistics.total_estimated_savings || 0).toLocaleString()}
                </Typography>
                <Typography variant="body2">{t('insights.stats.potentialSavings', 'Potential Savings')}</Typography>
              </Box>
              <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
              <Box>
                <Typography variant="h4">{statistics.by_priority?.high || 0}</Typography>
                <Typography variant="body2">{t('insights.stats.highPriority', 'High Priority')}</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Insights List */}
      {insights.length === 0 ? (
        <Alert severity="info">
          {t('insights.noInsights', 'No insights available yet. Complete your tax interview to generate personalized recommendations.')}
        </Alert>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {insights.map((insight) => (
            <Card
              key={insight.id}
              variant="outlined"
              sx={{
                borderLeft: 4,
                borderLeftColor: `${getPriorityColor(insight.priority)}.main`,
                opacity: insight.is_applied ? 0.7 : 1
              }}
            >
              <CardContent>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'start', flex: 1 }}>
                    {getTypeIcon(insight.insight_type)}
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        {insight.title}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                        <Chip
                          label={insight.priority}
                          size="small"
                          color={getPriorityColor(insight.priority)}
                        />
                        {insight.estimated_savings_chf && (
                          <Chip
                            icon={<SavingsIcon />}
                            label={`Save CHF ${insight.estimated_savings_chf.toLocaleString()}`}
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                        )}
                        {insight.is_applied && (
                          <Chip
                            icon={<CheckIcon />}
                            label={t('insights.applied', 'Applied')}
                            size="small"
                            color="success"
                          />
                        )}
                      </Box>
                    </Box>
                  </Box>
                  <IconButton
                    onClick={() => toggleExpanded(insight.id)}
                    size="small"
                  >
                    {expandedInsights[insight.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Box>

                {/* Description */}
                <Typography variant="body2" color="text.secondary" paragraph>
                  {insight.description}
                </Typography>

                {/* Expanded Content */}
                <Collapse in={expandedInsights[insight.id]}>
                  {insight.action_items && insight.action_items.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        {t('insights.actionItems', 'Recommended Actions:')}
                      </Typography>
                      <List dense>
                        {insight.action_items.map((item, index) => (
                          <ListItem key={index}>
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              <CheckIcon fontSize="small" color="action" />
                            </ListItemIcon>
                            <ListItemText primary={item} />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}

                  {/* Actions */}
                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    {!insight.is_acknowledged && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleAcknowledge(insight.id)}
                      >
                        {t('insights.markRead', 'Mark as Read')}
                      </Button>
                    )}
                    {!insight.is_applied && (
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        onClick={() => handleMarkApplied(insight.id)}
                      >
                        {t('insights.markApplied', 'Mark as Applied')}
                      </Button>
                    )}
                    <Button
                      size="small"
                      onClick={() => setDetailDialog({ open: true, insight })}
                    >
                      {t('insights.moreInfo', 'More Info')}
                    </Button>
                  </Box>
                </Collapse>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Detail Dialog */}
      <Dialog
        open={detailDialog.open}
        onClose={() => setDetailDialog({ open: false, insight: null })}
        maxWidth="md"
        fullWidth
      >
        {detailDialog.insight && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {getTypeIcon(detailDialog.insight.insight_type)}
                {detailDialog.insight.title}
              </Box>
            </DialogTitle>
            <DialogContent>
              <Typography paragraph>
                {detailDialog.insight.description}
              </Typography>

              {detailDialog.insight.estimated_savings_chf && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  <strong>{t('insights.estimatedSavings', 'Estimated Tax Savings:')}</strong>{' '}
                  CHF {detailDialog.insight.estimated_savings_chf.toLocaleString()}
                </Alert>
              )}

              {detailDialog.insight.action_items && detailDialog.insight.action_items.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    {t('insights.actionItems', 'Recommended Actions')}
                  </Typography>
                  <List>
                    {detailDialog.insight.action_items.map((item, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <CheckIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText primary={item} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {detailDialog.insight.related_questions && detailDialog.insight.related_questions.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>{t('insights.relatedQuestions', 'Related to questions:')}</strong>{' '}
                    {detailDialog.insight.related_questions.join(', ')}
                  </Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailDialog({ open: false, insight: null })}>
                {t('common.close', 'Close')}
              </Button>
              {!detailDialog.insight.is_applied && (
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => {
                    handleMarkApplied(detailDialog.insight.id);
                    setDetailDialog({ open: false, insight: null });
                  }}
                >
                  {t('insights.markApplied', 'Mark as Applied')}
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default InsightsSection;
