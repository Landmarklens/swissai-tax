import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Card, CardContent, Typography, Divider, Chip, CircularProgress, Alert, Button } from '@mui/material';
import {
  TrendingDown as TrendingDownIcon,
  TrendingUp as TrendingUpIcon,
  Calculate as CalculateIcon,
  UploadFile as UploadFileIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const TaxEstimateSidebar = ({ calculation, loading = false, pendingDocumentsError = null, onCalculate }) => {
  const { t } = useTranslation();
  const [calculating, setCalculating] = useState(false);

  const handleCalculate = async () => {
    if (onCalculate && !calculating) {
      setCalculating(true);
      try {
        await onCalculate();
      } finally {
        setCalculating(false);
      }
    }
  };

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

  // Show pending documents message if calculation was blocked
  if (pendingDocumentsError) {
    return (
      <Card sx={{ position: 'sticky', top: 24, height: 'fit-content' }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <CalculateIcon sx={{ color: '#003DA5' }} />
            <Typography variant="h6" fontWeight={600}>
              {t('Tax Estimate')}
            </Typography>
          </Box>
          <Alert severity="info" icon={<UploadFileIcon />} sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight={600} mb={1}>
              Documents Pending
            </Typography>
            <Typography variant="caption">
              Tax calculation will be available after you upload all required documents or complete the interview.
            </Typography>
          </Alert>
          <Box sx={{ p: 2, borderRadius: 1, bgcolor: 'background.default' }}>
            <Typography variant="caption" color="text.secondary">
              <strong>{pendingDocumentsError.pendingCount}</strong> {pendingDocumentsError.pendingCount === 1 ? 'document' : 'documents'} marked as "bring later"
            </Typography>
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
          <Typography variant="body2" color="text.secondary" mb={2}>
            {t('Answer questions to see your estimate')}
          </Typography>
          {onCalculate && (
            <Button
              variant="contained"
              startIcon={calculating ? <CircularProgress size={16} /> : <CalculateIcon />}
              onClick={handleCalculate}
              disabled={calculating}
              fullWidth
              sx={{ mt: 2 }}
            >
              {calculating ? t('Calculating...') : t('Calculate Estimate')}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Calculate refund/payment based on total tax and tax paid
  const totalTax = calculation.total_tax || 0;
  const taxPaid = calculation.paid || 0;
  const refund = taxPaid - totalTax;
  const isRefund = refund > 0;
  const amount = Math.abs(refund);

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
                CHF {(calculation.income?.total_income || 0).toLocaleString('de-CH')}
              </Typography>
            </Box>

            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                {t('Total Deductions')}
              </Typography>
              <Typography variant="body2" fontWeight={600} color="success.main">
                -CHF {(calculation.deductions?.total_deductions || 0).toLocaleString('de-CH')}
              </Typography>
            </Box>

            <Divider />

            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                {t('Taxable Income')}
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                CHF {(calculation.taxable_income || 0).toLocaleString('de-CH')}
              </Typography>
            </Box>

            <Divider />

            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                {t('Federal Tax')}
              </Typography>
              <Typography variant="body2">
                CHF {(calculation.federal_tax || 0).toLocaleString('de-CH')}
              </Typography>
            </Box>

            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                {t('Cantonal Tax')}
              </Typography>
              <Typography variant="body2">
                CHF {(calculation.cantonal_tax || 0).toLocaleString('de-CH')}
              </Typography>
            </Box>

            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                {t('Municipal Tax')}
              </Typography>
              <Typography variant="body2">
                CHF {(calculation.municipal_tax || 0).toLocaleString('de-CH')}
              </Typography>
            </Box>

            <Divider />

            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" fontWeight={600}>
                {t('Total Tax Due')}
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                CHF {(calculation.total_tax || 0).toLocaleString('de-CH')}
              </Typography>
            </Box>

            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                {t('Tax Paid')}
              </Typography>
              <Typography variant="body2">
                CHF {(taxPaid || 0).toLocaleString('de-CH')}
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

        {onCalculate && (
          <Button
            variant="outlined"
            startIcon={calculating ? <CircularProgress size={16} /> : <RefreshIcon />}
            onClick={handleCalculate}
            disabled={calculating}
            fullWidth
            sx={{ mt: 2 }}
          >
            {calculating ? t('Updating...') : t('Update Estimate')}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

TaxEstimateSidebar.propTypes = {
  calculation: PropTypes.shape({
    income: PropTypes.shape({
      total_income: PropTypes.number,
      employment: PropTypes.number,
      capital: PropTypes.number,
      rental: PropTypes.number
    }),
    deductions: PropTypes.shape({
      total_deductions: PropTypes.number,
      pillar_3a: PropTypes.number,
      insurance_premiums: PropTypes.number
    }),
    taxable_income: PropTypes.number,
    federal_tax: PropTypes.number,
    cantonal_tax: PropTypes.number,
    municipal_tax: PropTypes.number,
    church_tax: PropTypes.number,
    total_tax: PropTypes.number,
    paid: PropTypes.number
  }),
  loading: PropTypes.bool,
  pendingDocumentsError: PropTypes.shape({
    message: PropTypes.string,
    pendingCount: PropTypes.number,
    pendingDocuments: PropTypes.array
  }),
  onCalculate: PropTypes.func
};

export default TaxEstimateSidebar;
