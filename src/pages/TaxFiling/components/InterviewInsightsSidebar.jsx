import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Chip,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Lightbulb as LightbulbIcon,
  TrendingUp as TrendingUpIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { api } from '../../../services/api';

const InterviewInsightsSidebar = ({ filingSessionId, triggerRefetch }) => {
  const { t } = useTranslation();
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (filingSessionId) {
      fetchInsights();
    }
  }, [filingSessionId, triggerRefetch]);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/api/insights/filing/${filingSessionId}`);
      setInsights(response.data || []);
    } catch (err) {
      // Silently handle errors - insights are optional
      // 404 is expected when no insights have been generated yet
      setError(null); // Don't show error to user
      setInsights([]);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  // Map subcategories to display names and emojis
  const subcategoryConfig = {
    personal: { label: 'Personal', emoji: '👤', order: 1 },
    partner: { label: 'Partner', emoji: '💑', order: 2 },
    kids: { label: 'Kids', emoji: '👶', order: 3 },
    employment: { label: 'Employment', emoji: '💼', order: 4 },
    location: { label: 'Location', emoji: '📍', order: 5 },
    property_assets: { label: 'Property & Assets', emoji: '🏠', order: 6 },
    retirement_savings: { label: 'Retirement & Savings', emoji: '🏦', order: 7 },
    deductions: { label: 'Deductions', emoji: '💰', order: 8 },
    general: { label: 'General', emoji: '📋', order: 9 }
  };

  // Group insights by category (completed/action_required) and then by subcategory
  const groupInsights = () => {
    const grouped = {
      completed: {},
      action_required: {}
    };

    insights.forEach(insight => {
      const category = insight.category || 'completed';
      const subcategory = insight.subcategory || 'general';

      if (!grouped[category][subcategory]) {
        grouped[category][subcategory] = [];
      }
      grouped[category][subcategory].push(insight);
    });

    return grouped;
  };

  const renderInsight = (insight, index, total) => {
    const isDataSummary = insight.insight_type === 'data_summary';

    return (
      <Box key={insight.id || index}>
        <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
          <Typography variant="subtitle2" fontWeight={600}>
            {insight.title}
          </Typography>
          {!isDataSummary && (
            <Chip
              label={insight.priority}
              size="small"
              color={getPriorityColor(insight.priority)}
            />
          )}
        </Box>

        {/* For data summaries, preserve line breaks and use smaller font */}
        {isDataSummary ? (
          <Box sx={{
            bgcolor: 'grey.50',
            p: 1.5,
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'grey.200'
          }}>
            {insight.description.split('\n').map((line, idx) => (
              <Typography
                key={idx}
                variant="body2"
                sx={{
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  lineHeight: 1.8,
                  color: 'text.primary'
                }}
              >
                {line}
              </Typography>
            ))}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {insight.description}
          </Typography>
        )}

        {/* Only show estimated savings for non-data-summary insights */}
        {!isDataSummary && insight.estimated_savings_chf && insight.estimated_savings_chf > 0 && (
          <Box
            display="flex"
            alignItems="center"
            gap={0.5}
            sx={{
              mt: 1,
              p: 1,
              bgcolor: 'success.lighter',
              borderRadius: 1
            }}
          >
            <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
            <Typography variant="caption" color="success.main" fontWeight={600}>
              Potential savings: CHF {insight.estimated_savings_chf.toLocaleString('de-CH')}
            </Typography>
          </Box>
        )}

        {/* Only show action items for non-data-summary insights */}
        {!isDataSummary && insight.action_items && insight.action_items.length > 0 && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              {t('Action items')}:
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2 }}>
              {insight.action_items.map((action, idx) => (
                <Typography
                  key={idx}
                  component="li"
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  {action}
                </Typography>
              ))}
            </Box>
          </Box>
        )}

        {index < total - 1 && <Divider sx={{ mt: 2 }} />}
      </Box>
    );
  };

  const renderSubcategorySection = (subcategory, subcategoryInsights) => {
    const config = subcategoryConfig[subcategory] || subcategoryConfig.general;

    return (
      <Accordion
        key={subcategory}
        defaultExpanded={true}
        sx={{
          boxShadow: 'none',
          '&:before': { display: 'none' },
          bgcolor: 'transparent',
          mb: 1
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            minHeight: 'auto',
            px: 0,
            py: 0.5,
            '& .MuiAccordionSummary-content': {
              my: 0.5
            }
          }}
        >
          <Typography variant="body2" fontWeight={600} sx={{ color: 'text.primary' }}>
            {config.emoji} {config.label} ({subcategoryInsights.length})
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 0, pt: 0, pl: 3 }}>
          <Box display="flex" flexDirection="column" gap={2}>
            {subcategoryInsights.map((insight, index) =>
              renderInsight(insight, index, subcategoryInsights.length)
            )}
          </Box>
        </AccordionDetails>
      </Accordion>
    );
  };

  if (loading) {
    return (
      <Card sx={{ position: 'sticky', top: 24, height: 'fit-content' }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <LightbulbIcon sx={{ color: '#003DA5' }} />
            <Typography variant="h6" fontWeight={600}>
              {t('Insights')}
            </Typography>
          </Box>
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress size={30} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  const groupedInsights = groupInsights();
  const hasCompleted = Object.keys(groupedInsights.completed).length > 0;
  const hasPending = Object.keys(groupedInsights.action_required).length > 0;

  return (
    <Card sx={{ position: 'sticky', top: 24, height: 'fit-content', maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={3}>
          <LightbulbIcon sx={{ color: '#003DA5' }} />
          <Typography variant="h6" fontWeight={600}>
            {t('Tax Insights')}
          </Typography>
        </Box>

        {insights.length === 0 ? (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            py={4}
            textAlign="center"
          >
            <LightbulbIcon
              sx={{
                fontSize: 48,
                color: 'text.disabled',
                mb: 2
              }}
            />
            <Typography variant="body2" color="text.secondary">
              {t('Keep answering questions to get personalized tax-saving insights')}
            </Typography>
          </Box>
        ) : (
          <Box display="flex" flexDirection="column" gap={3}>
            {/* Completed Insights Section */}
            {hasCompleted && (
              <Box>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1, color: 'success.main' }}>
                  ✓ Completed
                </Typography>
                <Box sx={{ pl: 2, mt: 1 }}>
                  {Object.entries(groupedInsights.completed)
                    .sort((a, b) => {
                      const orderA = subcategoryConfig[a[0]]?.order || 999;
                      const orderB = subcategoryConfig[b[0]]?.order || 999;
                      return orderA - orderB;
                    })
                    .map(([subcategory, subcategoryInsights]) =>
                      renderSubcategorySection(subcategory, subcategoryInsights)
                    )}
                </Box>
              </Box>
            )}

            {/* Pending/Action Required Section */}
            {hasPending && (
              <Box>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1, color: 'warning.main' }}>
                  ⚠ Pending
                </Typography>
                <Box sx={{ pl: 2, mt: 1 }}>
                  {Object.entries(groupedInsights.action_required)
                    .sort((a, b) => {
                      const orderA = subcategoryConfig[a[0]]?.order || 999;
                      const orderB = subcategoryConfig[b[0]]?.order || 999;
                      return orderA - orderB;
                    })
                    .map(([subcategory, subcategoryInsights]) =>
                      renderSubcategorySection(subcategory, subcategoryInsights)
                    )}
                </Box>
              </Box>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

InterviewInsightsSidebar.propTypes = {
  filingSessionId: PropTypes.string,
  triggerRefetch: PropTypes.any
};

export default InterviewInsightsSidebar;
