/**
 * Filing Card Component
 *
 * Displays a single tax filing (primary or secondary) with:
 * - Canton information
 * - Tax calculation summary
 * - PDF download buttons
 * - Status indicators
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  Tooltip
} from '@mui/material';
import {
  Download as DownloadIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Home as HomeIcon,
  Business as BusinessIcon
} from '@mui/icons-material';

const CANTON_FLAGS = {
  'ZH': '🏔️', 'BE': '🐻', 'LU': '🦁', 'UR': '🐂', 'SZ': '🏔️',
  'OW': '⛰️', 'NW': '⛰️', 'GL': '🏔️', 'ZG': '⚡', 'FR': '🏰',
  'SO': '🌲', 'BS': '👑', 'BL': '🦅', 'SH': '🏛️', 'AR': '🐑',
  'AI': '🐑', 'SG': '🦁', 'GR': '🏔️', 'AG': '⭐', 'TG': '🦅',
  'TI': '🌳', 'VD': '🍇', 'VS': '⛰️', 'NE': '🦅', 'GE': '🦅', 'JU': '🏰'
};

const FilingCard = ({ filing, calculation, isPrimary, onDownloadPDF }) => {
  const { t } = useTranslation();
  if (!filing) return null;

  const cantonFlag = CANTON_FLAGS[filing.canton] || '📋';
  const isComplete = calculation && calculation.total_tax > 0;

  return (
    <Card elevation={3} sx={{ position: 'relative' }}>
      {/* Status Badge */}
      <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
        {isComplete ? (
          <Chip
            icon={<CheckIcon />}
            label={t("filing.calculated")}
            color="success"
            size="small"
          />
        ) : (
          <Chip
            icon={<WarningIcon />}
            label={t("filing.incomplete")}
            color="warning"
            size="small"
          />
        )}
      </Box>

      <CardContent>
        {/* Canton Header */}
        <Box display="flex" alignItems="center" mb={2}>
          <Typography variant="h3" sx={{ mr: 2 }}>
            {cantonFlag}
          </Typography>
          <Box>
            <Typography variant="h5" gutterBottom>
              {filing.canton_name || filing.canton}
            </Typography>
            <Box display="flex" gap={1} alignItems="center">
              {isPrimary ? (
                <>
                  <HomeIcon fontSize="small" color="primary" />
                  <Typography variant="body2" color="primary">
                    Primary Residence
                  </Typography>
                </>
              ) : (
                <>
                  <BusinessIcon fontSize="small" color="secondary" />
                  <Typography variant="body2" color="secondary">
                    Property Canton
                  </Typography>
                </>
              )}
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Tax Calculation */}
        {calculation ? (
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">
                Taxable Income
              </Typography>
              <Typography variant="h6">
                CHF {(calculation.taxable_income || 0).toLocaleString('de-CH')}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">
                Total Tax
              </Typography>
              <Typography variant="h6" color="primary">
                CHF {(calculation.total_tax || 0).toLocaleString('de-CH', {
                  minimumFractionDigits: 2
                })}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">
                Effective Rate
              </Typography>
              <Typography variant="body1">
                {(calculation.effective_rate || 0).toFixed(2)}%
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">
                Monthly Payment
              </Typography>
              <Typography variant="body1">
                CHF {(calculation.monthly_payment || 0).toLocaleString('de-CH', {
                  minimumFractionDigits: 2
                })}
              </Typography>
            </Grid>
          </Grid>
        ) : (
          <Typography variant="body2" color="textSecondary">
            Tax calculation pending...
          </Typography>
        )}

        {/* Filing Type Info */}
        <Box mt={2} p={2} sx={{ bgcolor: 'background.default', borderRadius: 1 }}>
          <Typography variant="caption" color="textSecondary">
            {isPrimary ? (
              <>
                <strong>{t('filing.primary_filing')}</strong> includes all income sources and federal tax.
              </>
            ) : (
              <>
                <strong>{t('filing.secondary_filing')}</strong> includes only property income for this canton.
              </>
            )}
          </Typography>
        </Box>
      </CardContent>

      {/* Download Actions */}
      <CardActions sx={{ p: 2, pt: 0 }}>
        <Tooltip title={t("filing.modern_ech0196_pdf_with_barcode_re_ff32c6")}>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={() => onDownloadPDF(filing.id, 'ech0196')}
            disabled={!isComplete}
            size="small"
          >
            eCH-0196 PDF
          </Button>
        </Tooltip>
        <Tooltip title={`Official ${filing.canton} canton form`}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => onDownloadPDF(filing.id, 'traditional')}
            disabled={!isComplete}
            size="small"
          >
            Official Form
          </Button>
        </Tooltip>
      </CardActions>
    </Card>
  );
};

export default FilingCard;
