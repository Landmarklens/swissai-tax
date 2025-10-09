/**
 * Tax Summary Card Component
 *
 * Shows total tax burden across all cantons with visual breakdown
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  LinearProgress,
  Chip
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  AccountBalance as BankIcon
} from '@mui/icons-material';

const TaxSummaryCard = ({ totalTaxBurden, numFilings, primaryFiling, calculations }) => {
  const { t } = useTranslation();
  // Calculate breakdown
  const totalIncome = Object.values(calculations).reduce(
    (sum, calc) => sum + (calc.income?.total || 0), 0
  );

  const effectiveRate = totalIncome > 0 ? (totalTaxBurden / totalIncome) * 100 : 0;

  const federalTax = Object.values(calculations).reduce(
    (sum, calc) => sum + (calc.federal_tax || 0), 0
  );

  const cantonalTax = Object.values(calculations).reduce(
    (sum, calc) => sum + (calc.cantonal_tax || 0), 0
  );

  const municipalTax = Object.values(calculations).reduce(
    (sum, calc) => sum + (calc.municipal_tax || 0), 0
  );

  const churchTax = Object.values(calculations).reduce(
    (sum, calc) => sum + (calc.church_tax || 0), 0
  );

  return (
    <Card elevation={2} sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
      <CardContent>
        <Grid container spacing={3} alignItems="center">
          {/* Total Tax */}
          <Grid item xs={12} md={4}>
            <Box display="flex" alignItems="center" mb={1}>
              <BankIcon sx={{ mr: 1 }} />
              <Typography variant="h6">
                Total Tax Burden {primaryFiling?.tax_year}
              </Typography>
            </Box>
            <Typography variant="h3" fontWeight="bold">
              CHF {totalTaxBurden.toLocaleString('de-CH', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 1 }}>
              Across {numFilings} {numFilings === 1 ? 'Canton' : 'Cantons'}
            </Typography>
          </Grid>

          {/* Effective Rate */}
          <Grid item xs={12} md={4}>
            <Box>
              <Box display="flex" alignItems="center" mb={1}>
                <TrendingUpIcon sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Effective Tax Rate
                </Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold">
                {effectiveRate.toFixed(2)}%
              </Typography>
              <Box mt={2}>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Tax / Total Income
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(effectiveRate, 100)}
                  sx={{
                    mt: 1,
                    height: 8,
                    borderRadius: 4,
                    bgcolor: 'rgba(255,255,255,0.3)',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: 'white'
                    }
                  }}
                />
              </Box>
            </Box>
          </Grid>

          {/* Breakdown */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>
              Tax Breakdown
            </Typography>
            <Box display="flex" flexDirection="column" gap={1}>
              {federalTax > 0 && (
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">{t('filing.federal')}</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    CHF {federalTax.toLocaleString('de-CH', { minimumFractionDigits: 0 })}
                  </Typography>
                </Box>
              )}
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">{t('filing.cantonal')}</Typography>
                <Typography variant="body2" fontWeight="bold">
                  CHF {cantonalTax.toLocaleString('de-CH', { minimumFractionDigits: 0 })}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">{t('filing.municipal')}</Typography>
                <Typography variant="body2" fontWeight="bold">
                  CHF {municipalTax.toLocaleString('de-CH', { minimumFractionDigits: 0 })}
                </Typography>
              </Box>
              {churchTax > 0 && (
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">{t('filing.church')}</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    CHF {churchTax.toLocaleString('de-CH', { minimumFractionDigits: 0 })}
                  </Typography>
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>

        {/* Multi-Canton Badge */}
        {numFilings > 1 && (
          <Box mt={2} display="flex" gap={1}>
            <Chip
              label={`Multi-Canton Filing: ${numFilings} Cantons`}
              size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
            />
            <Chip
              label={`Monthly: CHF ${(totalTaxBurden / 12).toLocaleString('de-CH', { minimumFractionDigits: 0 })}`}
              size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default TaxSummaryCard;
