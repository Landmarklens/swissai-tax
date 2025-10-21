import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Button,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  CircularProgress
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import './PlanComparisonCard.scss';

const PlanComparisonCard = ({ plan, currentPlan, isUpgrade, onSelectPlan, loading }) => {
  const { t } = useTranslation();
  const [showComparison, setShowComparison] = useState(false);

  const getPlanFeatures = (planType) => {
    const features = {
      free: [
        t('subscription.features.free.basic_filing', '1 basic tax filing per year'),
        t('subscription.features.free.ai_interview', 'AI-guided interview (limited to 10 questions)'),
        t('subscription.features.free.tax_calculation', 'Basic tax calculation'),
        t('subscription.features.free.pdf_export', 'PDF export (with watermark)')
      ],
      basic: [
        t('subscription.features.basic.complete_filing', '1 complete tax filing per year'),
        t('subscription.features.basic.full_interview', 'Full AI-guided interview (unlimited)'),
        t('subscription.features.basic.forms', 'Official cantonal form generation'),
        t('subscription.features.basic.documents', 'Document upload (up to 10 documents)'),
        t('subscription.features.basic.pdf_export', 'Professional PDF export'),
        t('subscription.features.basic.support', 'Email support (48h response)')
      ],
      pro: [
        t('subscription.features.pro.everything_basic', 'Everything in Basic'),
        t('subscription.features.pro.optimization', 'AI tax optimization (5-10 recommendations)'),
        t('subscription.features.pro.documents', 'Unlimited document uploads'),
        t('subscription.features.pro.comparison', 'Multi-canton comparison (up to 5)'),
        t('subscription.features.pro.etax_export', 'Export to eTax XML'),
        t('subscription.features.pro.support', 'Priority email support (24h response)')
      ],
      premium: [
        t('subscription.features.premium.everything_pro', 'Everything in Pro'),
        t('subscription.features.premium.advanced_optimization', 'Advanced AI optimization (10-15+ tips)'),
        t('subscription.features.premium.all_cantons', 'All 26 cantons comparison'),
        t('subscription.features.premium.expert_review', 'Tax expert review before submission'),
        t('subscription.features.premium.audit', 'Audit assistance & document prep'),
        t('subscription.features.premium.phone_support', 'Phone/video consultation (30min/year)')
      ]
    };
    return features[planType] || [];
  };

  const getFeatureDifference = () => {
    const currentFeatures = getPlanFeatures(currentPlan);
    const targetFeatures = getPlanFeatures(plan.id);

    if (isUpgrade) {
      // Show what they'll gain
      return {
        type: 'gain',
        features: targetFeatures.filter(f => !currentFeatures.includes(f))
      };
    } else {
      // Show what they'll lose
      return {
        type: 'lose',
        features: currentFeatures.filter(f => !targetFeatures.includes(f))
      };
    }
  };

  const difference = getFeatureDifference();
  const priceDiff = Math.abs(plan.price - (currentPlan === 'free' ? 0 : currentPlan === 'basic' ? 49 : currentPlan === 'pro' ? 99 : 149));

  return (
    <Card
      className={`plan-comparison-card ${isUpgrade ? 'upgrade' : 'downgrade'}`}
      sx={{
        border: isUpgrade ? '2px solid #4caf50' : '1px solid #e0e0e0',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: isUpgrade ? '0 8px 16px rgba(76, 175, 80, 0.2)' : '0 8px 16px rgba(0,0,0,0.1)'
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Typography variant="h5" component="h3" sx={{ fontWeight: 'bold' }}>
              {plan.name}
            </Typography>
            {isUpgrade ? (
              <TrendingUpIcon color="success" />
            ) : (
              <TrendingDownIcon color="warning" />
            )}
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {plan.description}
          </Typography>
        </Box>

        {/* Price */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              CHF {plan.price}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              / {plan.billing}
            </Typography>
          </Box>
          {priceDiff > 0 && (
            <Typography
              variant="body2"
              color={isUpgrade ? 'success.main' : 'warning.main'}
              sx={{ fontWeight: 'bold', mt: 0.5 }}
            >
              {isUpgrade
                ? `+CHF ${priceDiff} ${t('subscription.per_year', 'per year')}`
                : `-CHF ${priceDiff} ${t('subscription.per_year', 'per year')}`
              }
            </Typography>
          )}
        </Box>

        {/* Feature Difference Summary */}
        <Box
          sx={{
            bgcolor: isUpgrade ? 'success.light' : 'warning.light',
            p: 2,
            borderRadius: 1,
            mb: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            {isUpgrade ? (
              <AddCircleIcon color="success" fontSize="small" />
            ) : (
              <RemoveCircleIcon color="warning" fontSize="small" />
            )}
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {isUpgrade
                ? t('subscription.what_youll_gain', "What you'll gain:")
                : t('subscription.what_youll_lose', "What you'll lose:")
              }
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary">
            {difference.features.length} {isUpgrade ? t('subscription.new_features', 'new features') : t('subscription.features_removed', 'features will be unavailable')}
          </Typography>
        </Box>

        {/* Show/Hide Comparison */}
        <Button
          variant="text"
          size="small"
          onClick={() => setShowComparison(!showComparison)}
          endIcon={showComparison ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          sx={{ mb: 1 }}
        >
          {showComparison
            ? t('subscription.hide_details', 'Hide Details')
            : t('subscription.show_details', 'Show Details')
          }
        </Button>

        <Collapse in={showComparison}>
          <List dense sx={{ mb: 2 }}>
            {difference.features.map((feature, index) => (
              <ListItem key={index} disablePadding sx={{ mb: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  {isUpgrade ? (
                    <CheckCircleIcon color="success" fontSize="small" />
                  ) : (
                    <RemoveCircleIcon color="warning" fontSize="small" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={feature}
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
            ))}
          </List>
        </Collapse>

        {/* Action Button */}
        <Button
          variant={isUpgrade ? 'contained' : 'outlined'}
          color={isUpgrade ? 'success' : 'primary'}
          fullWidth
          size="large"
          disabled={loading}
          onClick={() => onSelectPlan(plan.id)}
          sx={{ mt: 2 }}
        >
          {loading ? (
            <CircularProgress size={24} />
          ) : isUpgrade ? (
            t('subscription.upgrade_to', 'Upgrade to {{plan}}', { plan: plan.name })
          ) : (
            t('subscription.downgrade_to', 'Downgrade to {{plan}}', { plan: plan.name })
          )}
        </Button>

        {/* Trial Info for Upgrades */}
        {isUpgrade && !plan.isFree && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
            {t('subscription.change_note', 'Changes take effect immediately')}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

PlanComparisonCard.propTypes = {
  plan: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    billing: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    features: PropTypes.arrayOf(PropTypes.string).isRequired,
    isFree: PropTypes.bool
  }).isRequired,
  currentPlan: PropTypes.string.isRequired,
  isUpgrade: PropTypes.bool.isRequired,
  onSelectPlan: PropTypes.func.isRequired,
  loading: PropTypes.bool
};

export default PlanComparisonCard;
