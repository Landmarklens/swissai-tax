import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Chip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  TrendingDown as RefundIcon,
  TrendingUp as PaymentIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const TaxCalculationBreakdown = ({ calculation }) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  if (!calculation) {
    return (
      <Card>
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            {t('Complete the interview to see your tax calculation')}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const isRefund = calculation.refund > 0;
  const amount = Math.abs(calculation.refund || 0);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight={600} mb={3}>
          {t('Tax Calculation')}
        </Typography>

        {/* Taxable Income */}
        <Box mb={3}>
          <Typography variant="subtitle2" color="text.secondary" mb={1}>
            {t('Taxable Income')}
          </Typography>
          <Typography variant="h5" fontWeight={600}>
            CHF {(calculation.taxableIncome || 0).toLocaleString('de-CH')}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Tax Breakdown */}
        <Box mb={3}>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell>{t('Federal Tax')}</TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight={600}>
                    CHF {(calculation.taxes?.federal || 0).toLocaleString('de-CH')}
                  </Typography>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>{t('Cantonal Tax')}</TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight={600}>
                    CHF {(calculation.taxes?.cantonal || 0).toLocaleString('de-CH')}
                  </Typography>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>{t('Municipal Tax')}</TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight={600}>
                    CHF {(calculation.taxes?.municipal || 0).toLocaleString('de-CH')}
                  </Typography>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={2}>
                  <Divider />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <Typography fontWeight={600}>{t('Total Tax Due')}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body1" fontWeight={700}>
                    CHF {(calculation.taxes?.total || 0).toLocaleString('de-CH')}
                  </Typography>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>{t('Tax Already Paid')}</TableCell>
                <TableCell align="right">
                  <Typography variant="body2">
                    CHF {(calculation.paid || 0).toLocaleString('de-CH')}
                  </Typography>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Final Result */}
        <Box
          sx={{
            p: 3,
            borderRadius: 2,
            backgroundColor: isRefund ? '#E8F5E9' : '#FFEBEE',
            textAlign: 'center'
          }}
        >
          <Typography variant="body2" color="text.secondary" mb={1}>
            {isRefund ? t('Expected Refund') : t('Amount to Pay')}
          </Typography>
          <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
            {isRefund ? (
              <RefundIcon sx={{ fontSize: 32, color: '#4CAF50' }} />
            ) : (
              <PaymentIcon sx={{ fontSize: 32, color: '#DC0018' }} />
            )}
            <Typography
              variant="h3"
              fontWeight={700}
              color={isRefund ? 'success.main' : 'error.main'}
            >
              CHF {amount.toLocaleString('de-CH')}
            </Typography>
          </Box>
        </Box>

        {/* Detailed Breakdown Accordion */}
        <Accordion
          expanded={expanded}
          onChange={() => setExpanded(!expanded)}
          sx={{ mt: 3, boxShadow: 'none', border: '1px solid #E0E0E0' }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center" gap={1}>
              <InfoIcon fontSize="small" color="primary" />
              <Typography variant="body2" fontWeight={600}>
                {t('View Detailed Calculation')}
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box>
              <Typography variant="subtitle2" fontWeight={600} mb={2}>
                {t('Income Breakdown')}
              </Typography>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell>{t('Employment Income')}</TableCell>
                    <TableCell align="right">
                      CHF {(calculation.income?.employment || 0).toLocaleString('de-CH')}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>{t('Investment Income')}</TableCell>
                    <TableCell align="right">
                      CHF {(calculation.income?.investment || 0).toLocaleString('de-CH')}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>{t('Other Income')}</TableCell>
                    <TableCell align="right">
                      CHF {(calculation.income?.other || 0).toLocaleString('de-CH')}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <Typography variant="subtitle2" fontWeight={600} mb={2} mt={3}>
                {t('Deductions Breakdown')}
              </Typography>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell>{t('Pillar 3a')}</TableCell>
                    <TableCell align="right">
                      CHF {(calculation.deductions?.pillar3a || 0).toLocaleString('de-CH')}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>{t('Health Insurance')}</TableCell>
                    <TableCell align="right">
                      CHF {(calculation.deductions?.healthInsurance || 0).toLocaleString('de-CH')}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>{t('Childcare')}</TableCell>
                    <TableCell align="right">
                      CHF {(calculation.deductions?.childcare || 0).toLocaleString('de-CH')}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>{t('Work Expenses')}</TableCell>
                    <TableCell align="right">
                      CHF {(calculation.deductions?.workExpenses || 0).toLocaleString('de-CH')}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          </AccordionDetails>
        </Accordion>

        <Chip
          label={t('Preliminary Calculation - Subject to Verification')}
          size="small"
          variant="outlined"
          color="warning"
          sx={{ mt: 3, width: '100%' }}
        />
      </CardContent>
    </Card>
  );
};

TaxCalculationBreakdown.propTypes = {
  calculation: PropTypes.shape({
    taxableIncome: PropTypes.number,
    taxes: PropTypes.shape({
      federal: PropTypes.number,
      cantonal: PropTypes.number,
      municipal: PropTypes.number,
      total: PropTypes.number
    }),
    paid: PropTypes.number,
    refund: PropTypes.number,
    income: PropTypes.shape({
      employment: PropTypes.number,
      investment: PropTypes.number,
      other: PropTypes.number
    }),
    deductions: PropTypes.shape({
      pillar3a: PropTypes.number,
      healthInsurance: PropTypes.number,
      childcare: PropTypes.number,
      workExpenses: PropTypes.number,
      total: PropTypes.number
    })
  })
};

export default TaxCalculationBreakdown;
