/**
 * UpgradePrompt component
 *
 * Displays a call-to-action for users to upgrade their subscription plan.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Button, Card, CardContent, Chip } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LockIcon from '@mui/icons-material/Lock';
import StarIcon from '@mui/icons-material/Star';
import { getFeatureDisplayName } from '../../utils/planFeatures';

const StyledCard = styled(Card)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius * 2,
  border: `2px dashed ${theme.palette.divider}`,
  padding: theme.spacing(3),
  textAlign: 'center',
  maxWidth: 600,
  margin: '0 auto'
}));

const IconWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 64,
  height: 64,
  borderRadius: '50%',
  backgroundColor: theme.palette.primary.main + '20',
  margin: '0 auto',
  marginBottom: theme.spacing(2)
}));

/**
 * Upgrade prompt shown when user tries to access a restricted feature.
 *
 * @param {Object} props
 * @param {string} props.feature - Feature that is restricted
 * @param {string} props.currentPlan - User's current plan
 * @param {string} props.requiredPlan - Plan required for this feature
 * @param {string} [props.title] - Custom title
 * @param {string} [props.description] - Custom description
 * @param {string} [props.ctaText] - Custom CTA button text
 */
const UpgradePrompt = ({
  feature,
  currentPlan,
  requiredPlan,
  title,
  description,
  ctaText
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const featureDisplayName = getFeatureDisplayName(feature);

  const handleUpgrade = () => {
    navigate('/subscription/plans', {
      state: {
        from: window.location.pathname,
        highlightPlan: requiredPlan,
        feature
      }
    });
  };

  const getPlanDisplayName = (plan) => {
    const names = {
      free: t('Free'),
      basic: t('Basic'),
      pro: t('Pro'),
      premium: t('Premium')
    };
    return names[plan] || plan;
  };

  const getPlanPrice = (plan) => {
    const prices = {
      free: 0,
      basic: 49,
      pro: 99,
      premium: 149
    };
    return prices[plan] || 0;
  };

  return (
    <StyledCard elevation={0}>
      <CardContent>
        <IconWrapper>
          <LockIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        </IconWrapper>

        <Typography variant="h6" gutterBottom fontWeight={600}>
          {title || t('Upgrade to Unlock This Feature')}
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Chip
            icon={<StarIcon />}
            label={featureDisplayName}
            color="primary"
            variant="outlined"
            sx={{ mb: 1 }}
          />
        </Box>

        <Typography variant="body2" color="text.secondary" paragraph>
          {description ||
            t(
              `This feature requires a {{requiredPlan}} plan or higher. You're currently on the {{currentPlan}} plan.`,
              {
                requiredPlan: getPlanDisplayName(requiredPlan),
                currentPlan: getPlanDisplayName(currentPlan)
              }
            )}
        </Typography>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            mb: 3
          }}>
          <Typography variant="body2" color="text.secondary">
            {t('From')}
          </Typography>
          <Typography variant="h5" color="primary" fontWeight={700}>
            CHF {getPlanPrice(requiredPlan)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            / {t('year')}
          </Typography>
        </Box>

        <Button
          variant="contained"
          color="primary"
          size="large"
          fullWidth
          onClick={handleUpgrade}
          sx={{
            py: 1.5,
            fontSize: '1rem',
            fontWeight: 600,
            textTransform: 'none',
            mb: 1
          }}>
          {ctaText || t('Upgrade to {{plan}}', { plan: getPlanDisplayName(requiredPlan) })}
        </Button>

        <Button
          variant="text"
          color="primary"
          size="small"
          fullWidth
          onClick={() => navigate('/subscription/plans')}
          sx={{ textTransform: 'none' }}>
          {t('Compare All Plans')}
        </Button>
      </CardContent>
    </StyledCard>
  );
};

UpgradePrompt.propTypes = {
  feature: PropTypes.string.isRequired,
  currentPlan: PropTypes.string.isRequired,
  requiredPlan: PropTypes.string.isRequired,
  title: PropTypes.string,
  description: PropTypes.string,
  ctaText: PropTypes.string
};

export default UpgradePrompt;
