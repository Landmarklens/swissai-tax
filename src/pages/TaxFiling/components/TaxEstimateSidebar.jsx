import React from 'react';
import PropTypes from 'prop-types';
import { Box, Card, CardContent, Typography, Divider, Chip, CircularProgress } from '@mui/material';
import {
  TrendingDown as TrendingDownIcon,
  TrendingUp as TrendingUpIcon,
  Calculate as CalculateIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const TaxEstimateSidebar = ({ calculation, loading }) => {
  const { t } = useTranslation();

  if (loading) {
    return (
      <Card sx={{ position: 'sticky', top: 24, height: 'fit-content' }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <CalculateIcon sx={{ color: '#003DA5' }} />
            <Typography variant="h6" fontWeight={600}>
              {t('Tax Estimate')}
            </Typography>
          </Box>
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (!calculation) {
    return (
      <Card sx={{ position: 'sticky', top: 24, height: 'fit-content' }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <CalculateIcon sx={{ color: '#003DA5' }} />
            <Typography variant="h6" fontWeight={600}>
              {t('Tax Estimate')}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {t('Answer questions to see your estimate')}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const isRefund = calculation.refund > 0;
  const amount = Math.abs(calculation.refund);

  return (
    <Card sx={{ position: 'sticky', top: 24, height: 'fit-content' }}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={3}>
          <CalculateIcon sx={{ color: '#003DA5' }} />
          <Typography variant="h6" fontWeight={600}>
            {t('Tax Estimate')}
          </Typography>
        </Box>

        {/* Main Result */}
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            backgroundColor: isRefund ? '#E8F5E9' : '#FFEBEE',
            mb: 3
          }}
        >
          <Typography variant="body2" color="text.secondary" mb={1}>
            {isRefund ? t('Estimated Refund') : t('Estimated Payment')}
          </Typography>
          <Box display="flex" alignItems="center" gap={1}>
            {isRefund ? (
              <TrendingDownIcon sx={{ color: '#4CAF50', fontSize: 28 }} />
            ) : (
              <TrendingUpIcon sx={{ color: '#DC0018', fontSize: 28 }} />
            )}
            <Typography
              variant="h4"
              fontWeight={700}
              color={isRefund ? 'success.main' : 'error.main'}
            >
              CHF {amount.toLocaleString('de-CH')}
            </Typography>
          </Box>
        </Box>

        {/* Breakdown */}
        <Box>
          <Typography variant="subtitle2" fontWeight={600} mb={2}>
            {t('Breakdown')}
          </Typography>

          <Box display="flex" flexDirection="column" gap={1.5}>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                {t('Total Income')}
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                CHF {(calculation.income || 0).toLocaleString('de-CH')}
              </Typography>
            </Box>

            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                {t('Total Deductions')}
              </Typography>
              <Typography variant="body2" fontWeight={600} color="success.main">
                -CHF {(calculation.deductions?.total || 0).toLocaleString('de-CH')}
              </Typography>
            </Box>

            <Divider />

            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                {t('Taxable Income')}
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                CHF {(calculation.taxableIncome || 0).toLocaleString('de-CH')}
              </Typography>
            </Box>

            <Divider />

            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                {t('Federal Tax')}
              </Typography>
              <Typography variant="body2">
                CHF {(calculation.taxes?.federal || 0).toLocaleString('de-CH')}
              </Typography>
            </Box>

            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                {t('Cantonal Tax')}
              </Typography>
              <Typography variant="body2">
                CHF {(calculation.taxes?.cantonal || 0).toLocaleString('de-CH')}
              </Typography>
            </Box>

            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                {t('Municipal Tax')}
              </Typography>
              <Typography variant="body2">
                CHF {(calculation.taxes?.municipal || 0).toLocaleString('de-CH')}
              </Typography>
            </Box>

            <Divider />

            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" fontWeight={600}>
                {t('Total Tax Due')}
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                CHF {(calculation.taxes?.total || 0).toLocaleString('de-CH')}
              </Typography>
            </Box>

            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                {t('Tax Paid')}
              </Typography>
              <Typography variant="body2">
                CHF {(calculation.paid || 0).toLocaleString('de-CH')}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Chip
          label={t('Preliminary Estimate')}
          size="small"
          sx={{ mt: 3, width: '100%' }}
          color="warning"
          variant="outlined"
        />
      </CardContent>
    </Card>
  );
};

TaxEstimateSidebar.propTypes = {
  calculation: PropTypes.shape({
    income: PropTypes.number,
    deductions: PropTypes.shape({
      total: PropTypes.number
    }),
    taxableIncome: PropTypes.number,
    taxes: PropTypes.shape({
      federal: PropTypes.number,
      cantonal: PropTypes.number,
      municipal: PropTypes.number,
      total: PropTypes.number
    }),
    paid: PropTypes.number,
    refund: PropTypes.number
  }),
  loading: PropTypes.bool
};

TaxEstimateSidebar.defaultProps = {
  loading: false
};

export default TaxEstimateSidebar;
