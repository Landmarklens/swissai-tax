import React from 'react';
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
  Divider
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StarIcon from '@mui/icons-material/Star';
import './CurrentPlanCard.scss';

const CurrentPlanCard = ({ subscription }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!subscription) {
    return null;
  }

  const { plan_type, status, current_period_end, trial_end, is_in_trial, price_chf } = subscription;

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'trialing':
        return 'info';
      case 'past_due':
        return 'warning';
      case 'canceled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPlanDisplayName = (planType) => {
    const names = {
      free: t('subscription.plans.free.name', 'Free'),
      basic: t('subscription.plans.basic.name', 'Basic'),
      pro: t('subscription.plans.pro.name', 'Pro'),
      premium: t('subscription.plans.premium.name', 'Premium')
    };
    return names[planType] || planType;
  };

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
        t('subscription.features.basic.pdf_export', 'Professional PDF export')
      ],
      pro: [
        t('subscription.features.pro.everything_basic', 'Everything in Basic, plus:'),
        t('subscription.features.pro.optimization', 'AI tax optimization (5-10 recommendations)'),
        t('subscription.features.pro.documents', 'Unlimited document uploads'),
        t('subscription.features.pro.comparison', 'Multi-canton comparison (up to 5)'),
        t('subscription.features.pro.etax_export', 'Export to eTax XML')
      ],
      premium: [
        t('subscription.features.premium.everything_pro', 'Everything in Pro, plus:'),
        t('subscription.features.premium.advanced_optimization', 'Advanced AI optimization (10-15+ tips)'),
        t('subscription.features.premium.all_cantons', 'All 26 cantons comparison'),
        t('subscription.features.premium.expert_review', 'Tax expert review before submission'),
        t('subscription.features.premium.phone_support', 'Phone/video consultation (30min/year)')
      ]
    };
    return features[planType] || [];
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleManageSubscription = () => {
    navigate('/subscription/manage');
  };

  return (
    <Card className="current-plan-card" sx={{ mb: 4, border: '3px solid #1976d2' }}>
      <CardContent sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold' }}>
                {getPlanDisplayName(plan_type)}
              </Typography>
              <Chip
                icon={<StarIcon />}
                label={t('subscription.current_plan', 'Current Plan')}
                color="primary"
                sx={{ fontWeight: 'bold' }}
              />
              <Chip
                label={t(`subscription.status.${status}`, status)}
                color={getStatusColor(status)}
                size="small"
              />
            </Box>
            <Typography variant="h5" color="text.secondary" sx={{ fontWeight: 'bold' }}>
              CHF {price_chf} {plan_type !== 'free' && `/ ${t('subscription.billing.annual', 'year')}`}
            </Typography>
          </Box>

          <Button
            variant="outlined"
            color="primary"
            onClick={handleManageSubscription}
            sx={{ minWidth: 120 }}
          >
            {t('subscription.manage_plan', 'Manage Plan')}
          </Button>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Trial Info */}
        {is_in_trial && trial_end && (
          <Box
            sx={{
              bgcolor: 'info.light',
              p: 2,
              borderRadius: 1,
              mb: 3
            }}
          >
            <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'info.dark' }}>
              {t('subscription.trial_active', 'Trial Period Active')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('subscription.trial_ends_on', 'Your trial ends on {{date}}', {
                date: formatDate(trial_end)
              })}
            </Typography>
          </Box>
        )}

        {/* Period Info */}
        {current_period_end && !is_in_trial && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              {status === 'active'
                ? t('subscription.renews_on', 'Renews on {{date}}', { date: formatDate(current_period_end) })
                : t('subscription.period_ends_on', 'Period ends on {{date}}', { date: formatDate(current_period_end) })
              }
            </Typography>
          </Box>
        )}

        {/* Features */}
        <Box>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
            {t('subscription.your_features', 'Your Plan Features')}
          </Typography>
          <List dense>
            {getPlanFeatures(plan_type).map((feature, index) => (
              <ListItem key={index} disablePadding sx={{ mb: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <CheckCircleIcon color="success" fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={feature} />
              </ListItem>
            ))}
          </List>
        </Box>
      </CardContent>
    </Card>
  );
};

CurrentPlanCard.propTypes = {
  subscription: PropTypes.shape({
    plan_type: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    current_period_start: PropTypes.string,
    current_period_end: PropTypes.string,
    trial_start: PropTypes.string,
    trial_end: PropTypes.string,
    is_in_trial: PropTypes.bool,
    price_chf: PropTypes.number.isRequired,
    cancel_at_period_end: PropTypes.bool
  })
};

export default CurrentPlanCard;
