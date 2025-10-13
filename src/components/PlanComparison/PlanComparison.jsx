/**
 * PlanComparison component
 *
 * Displays a detailed comparison of features across subscription plans.
 */

import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import InfiniteIcon from '@mui/icons-material/AllInclusive';
import { PLAN_FEATURES, formatFeatureValue } from '../../utils/planFeatures';

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius * 2,
  '& .MuiTableCell-head': {
    backgroundColor: theme.palette.background.default,
    fontWeight: 600,
    fontSize: '0.875rem'
  },
  '& .MuiTableCell-root': {
    borderBottom: `1px solid ${theme.palette.divider}`
  }
}));

const PlanHeader = styled(TableCell)(({ theme, highlighted }) => ({
  textAlign: 'center',
  padding: theme.spacing(2),
  backgroundColor: highlighted ? theme.palette.primary.main + '10' : undefined,
  position: 'relative',
  '&::before': highlighted
    ? {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 4,
        backgroundColor: theme.palette.primary.main
      }
    : {}
}));

const FeatureCategory = styled(TableRow)(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  '& .MuiTableCell-root': {
    fontWeight: 700,
    fontSize: '0.875rem',
    padding: theme.spacing(1.5, 2)
  }
}));

/**
 * Render feature value with appropriate icon/formatting.
 */
const FeatureValue = ({ value, featureName }) => {
  const theme = useTheme();

  // Boolean values
  if (typeof value === 'boolean') {
    return value ? (
      <CheckIcon sx={{ color: 'success.main', fontSize: 20 }} />
    ) : (
      <CloseIcon sx={{ color: 'error.main', fontSize: 20 }} />
    );
  }

  // Null (unlimited)
  if (value === null) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
        <InfiniteIcon sx={{ fontSize: 18, color: 'success.main' }} />
        <Typography variant="caption" color="success.main">
          Unlimited
        </Typography>
      </Box>
    );
  }

  // Numeric >= 999 (treated as unlimited)
  if (typeof value === 'number' && value >= 999) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
        <InfiniteIcon sx={{ fontSize: 18, color: 'success.main' }} />
        <Typography variant="caption" color="success.main">
          Unlimited
        </Typography>
      </Box>
    );
  }

  // Formatted value
  return (
    <Typography variant="body2">{formatFeatureValue(featureName, value)}</Typography>
  );
};

/**
 * Main comparison component.
 *
 * @param {Object} props
 * @param {string[]} [props.plans] - Plans to compare (default: all)
 * @param {string} [props.highlightPlan] - Plan to highlight
 * @param {string} [props.currentPlan] - User's current plan
 * @param {boolean} [props.compact] - Use compact layout
 */
const PlanComparison = ({
  plans = ['free', 'basic', 'pro', 'premium'],
  highlightPlan,
  currentPlan,
  compact = false
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const planNames = {
    free: t('Free'),
    basic: t('Basic'),
    pro: t('Pro'),
    premium: t('Premium')
  };

  const planPrices = {
    free: 0,
    basic: 49,
    pro: 99,
    premium: 149
  };

  // Feature categories for organized display
  const featureCategories = [
    {
      name: t('Filings'),
      features: ['filings_per_year', 'filing_amendments']
    },
    {
      name: t('Documents'),
      features: ['document_uploads', 'document_storage_mb', 'document_ocr']
    },
    {
      name: t('AI Features'),
      features: [
        'ai_questions_limit',
        'ai_tax_assistant',
        'ai_optimization',
        'ai_document_analysis'
      ]
    },
    {
      name: t('Export & Integration'),
      features: ['pdf_export', 'csv_export', 'bulk_export', 'etax_export']
    },
    {
      name: t('Analysis Tools'),
      features: [
        'canton_comparison',
        'tax_scenarios',
        'multi_year_comparison',
        'historical_analysis_years',
        'tax_savings_tracker'
      ]
    },
    {
      name: t('Support'),
      features: ['email_support', 'phone_support', 'priority_support', 'expert_review', 'audit_assistance']
    },
    {
      name: t('Advanced Features'),
      features: [
        'multi_property',
        'joint_filing',
        'business_income',
        'investment_income',
        'foreign_income'
      ]
    },
    {
      name: t('Developer'),
      features: ['api_access', 'api_rate_limit']
    }
  ];

  // Get feature display names
  const getFeatureDisplayName = (featureName) => {
    const names = {
      filings_per_year: t('Filings per Year'),
      filing_amendments: t('Filing Amendments'),
      document_uploads: t('Document Uploads'),
      document_storage_mb: t('Storage'),
      document_ocr: t('OCR Extraction'),
      ai_questions_limit: t('AI Questions'),
      ai_tax_assistant: t('AI Tax Assistant'),
      ai_optimization: t('AI Optimization'),
      ai_document_analysis: t('Document Analysis'),
      pdf_export: t('PDF Export'),
      csv_export: t('CSV Export'),
      bulk_export: t('Bulk Export'),
      etax_export: t('eTax XML Export'),
      canton_comparison: t('Canton Comparisons'),
      tax_scenarios: t('Tax Scenarios'),
      multi_year_comparison: t('Multi-Year Comparison'),
      historical_analysis_years: t('Historical Analysis'),
      tax_savings_tracker: t('Tax Savings Tracker'),
      email_support: t('Email Support'),
      phone_support: t('Phone Support'),
      priority_support: t('Priority Support'),
      expert_review: t('Expert Review'),
      audit_assistance: t('Audit Assistance'),
      multi_property: t('Multiple Properties'),
      joint_filing: t('Joint Filing'),
      business_income: t('Business Income'),
      investment_income: t('Investment Income'),
      foreign_income: t('Foreign Income'),
      api_access: t('API Access'),
      api_rate_limit: t('API Rate Limit')
    };
    return names[featureName] || featureName;
  };

  // Mobile compact view
  if (isMobile || compact) {
    return (
      <Box sx={{ width: '100%' }}>
        {plans.map(plan => (
          <Box
            key={plan}
            sx={{
              mb: 2,
              p: 2,
              border: `2px solid ${
                highlightPlan === plan ? theme.palette.primary.main : theme.palette.divider
              }`,
              borderRadius: 2,
              backgroundColor:
                highlightPlan === plan ? theme.palette.primary.main + '08' : 'background.paper'
            }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>
                {planNames[plan]}
              </Typography>
              <Box>
                <Typography variant="h5" color="primary" fontWeight={700} component="span">
                  CHF {planPrices[plan]}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                  /year
                </Typography>
              </Box>
            </Box>
            {currentPlan === plan && (
              <Chip label={t('Current Plan')} color="primary" size="small" sx={{ mb: 2 }} />
            )}
            {/* Show key features only in compact view */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {['filings_per_year', 'ai_optimization', 'canton_comparison'].map(feature => {
                const value = PLAN_FEATURES[plan]?.[feature];
                return (
                  <Box key={feature} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">{getFeatureDisplayName(feature)}</Typography>
                    <FeatureValue value={value} featureName={feature} />
                  </Box>
                );
              })}
            </Box>
          </Box>
        ))}
      </Box>
    );
  }

  // Desktop full comparison table
  return (
    <StyledTableContainer component={Paper} elevation={0}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{t('Features')}</TableCell>
            {plans.map(plan => (
              <PlanHeader key={plan} highlighted={highlightPlan === plan}>
                <Typography variant="subtitle1" fontWeight={700}>
                  {planNames[plan]}
                </Typography>
                <Typography variant="h6" color="primary" fontWeight={700} sx={{ my: 0.5 }}>
                  CHF {planPrices[plan]}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  / {t('year')}
                </Typography>
                {currentPlan === plan && (
                  <Box sx={{ mt: 1 }}>
                    <Chip label={t('Current')} color="primary" size="small" />
                  </Box>
                )}
              </PlanHeader>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {featureCategories.map(category => (
            <React.Fragment key={category.name}>
              <FeatureCategory>
                <TableCell colSpan={plans.length + 1}>{category.name}</TableCell>
              </FeatureCategory>
              {category.features.map(feature => {
                // Check if any plan has this feature defined
                const hasFeature = plans.some(plan => PLAN_FEATURES[plan]?.[feature] !== undefined);
                if (!hasFeature) return null;

                return (
                  <TableRow key={feature} hover>
                    <TableCell>
                      <Typography variant="body2">{getFeatureDisplayName(feature)}</Typography>
                    </TableCell>
                    {plans.map(plan => (
                      <TableCell key={`${plan}-${feature}`} align="center">
                        <FeatureValue
                          value={PLAN_FEATURES[plan]?.[feature]}
                          featureName={feature}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </StyledTableContainer>
  );
};

PlanComparison.propTypes = {
  plans: PropTypes.arrayOf(PropTypes.oneOf(['free', 'basic', 'pro', 'premium'])),
  highlightPlan: PropTypes.oneOf(['free', 'basic', 'pro', 'premium']),
  currentPlan: PropTypes.oneOf(['free', 'basic', 'pro', 'premium']),
  compact: PropTypes.bool
};

export default PlanComparison;
