/**
 * Multi-Canton Tax Filing Dashboard
 *
 * Main dashboard for users with filings in multiple cantons.
 * Shows all filings (primary + secondaries) with tax calculations,
 * PDF downloads, and optimization recommendations.
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  Assessment as AssessmentIcon,
  TrendingUp as OptimizeIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon
} from '@mui/icons-material';

import FilingCard from './FilingCard';
import TaxSummaryCard from './TaxSummaryCard';
import OptimizationPanel from './OptimizationPanel';
import DocumentUploadPanel from './DocumentUploadPanel';
import { getApiUrl } from '../../utils/api/getApiUrl';
import { useTranslation } from 'react-i18next';

const API_BASE_URL = getApiUrl();

const MultiCantonDashboard = ({ userId, taxYear }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [filings, setFilings] = useState([]);
  const [primaryFiling, setPrimaryFiling] = useState(null);
  const [secondaryFilings, setSecondaryFilings] = useState([]);
  const [calculations, setCalculations] = useState({});
  const [totalTaxBurden, setTotalTaxBurden] = useState(0);
  const [error, setError] = useState(null);
  const [showOptimization, setShowOptimization] = useState(false);

  useEffect(() => {
    loadFilings();
  }, [userId, taxYear]);

  const loadFilings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all filings
      const response = await axios.get(
        `${API_BASE_URL}/api/multi-canton/filings/${taxYear}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      const allFilings = response.data.filings || [];

      // Separate primary and secondary
      const primary = allFilings.find(f => f.is_primary);
      const secondaries = allFilings.filter(f => !f.is_primary);

      setFilings(allFilings);
      setPrimaryFiling(primary);
      setSecondaryFilings(secondaries);

      // Load calculations for each filing
      await loadCalculations(allFilings);

    } catch (err) {
      console.error('Error loading filings:', err);
      setError(err.response?.data?.detail || 'Failed to load tax filings');
    } finally {
      setLoading(false);
    }
  };

  const loadCalculations = async (filingsList) => {
    const calcs = {};
    let totalBurden = 0;

    for (const filing of filingsList) {
      try {
        // This endpoint would need to be created in backend
        const response = await axios.get(
          `${API_BASE_URL}/api/tax-calculation/filing/${filing.id}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        calcs[filing.id] = response.data;
        totalBurden += response.data.total_tax || 0;
      } catch (err) {
        console.error(`Error loading calculation for ${filing.id}:`, err);
      }
    }

    setCalculations(calcs);
    setTotalTaxBurden(totalBurden);
  };

  const handleDownloadPDF = async (filingId, pdfType) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/pdf/download/${filingId}`,
        {
          params: { pdf_type: pdfType, language: 'de' },
          responseType: 'blob',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `tax_return_${filingId}_${pdfType}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

    } catch (err) {
      console.error('Error downloading PDF:', err);
      alert('Failed to download PDF');
    }
  };

  const handleDownloadAllPDFs = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/pdf/download-all/${userId}/${taxYear}`,
        {
          params: { pdf_type: 'both', language: 'de' },
          responseType: 'blob',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      // Download ZIP file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `tax_returns_${taxYear}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();

    } catch (err) {
      console.error('Error downloading all PDFs:', err);
      alert('Failed to download PDFs');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!primaryFiling) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="info">
          No tax filings found for {taxYear}. Please start a new tax filing.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Tax Filings {taxYear}
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            {filings.length} {filings.length === 1 ? 'Filing' : 'Filings'}
            {secondaryFilings.length > 0 && ` (1 Primary + ${secondaryFilings.length} Secondary)`}
          </Typography>
        </Box>
        <Box>
          <Tooltip title={t("filing.download_all_pdfs_as_zip")}>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadAllPDFs}
              sx={{ mr: 2 }}
            >
              Download All
            </Button>
          </Tooltip>
          <Tooltip title={t("filing.refresh_data")}>
            <IconButton onClick={loadFilings}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Total Tax Summary */}
      <TaxSummaryCard
        totalTaxBurden={totalTaxBurden}
        numFilings={filings.length}
        primaryFiling={primaryFiling}
        calculations={calculations}
      />

      {/* Multi-Canton Info Alert */}
      {secondaryFilings.length > 0 && (
        <Alert severity="info" sx={{ mb: 3 }} icon={<InfoIcon />}>
          <strong>{t('filing.multicanton_filing')}</strong> You have properties in multiple cantons
          and must file separate tax returns for each canton. We've automatically created
          all necessary filings for you.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Column: Filings */}
        <Grid item xs={12} lg={8}>
          {/* Primary Filing */}
          <Box mb={3}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              Primary Filing
              <Chip label={t("filing.main_residence")} size="small" color="primary" sx={{ ml: 2 }} />
            </Typography>
            <FilingCard
              filing={primaryFiling}
              calculation={calculations[primaryFiling.id]}
              isPrimary={true}
              onDownloadPDF={handleDownloadPDF}
            />
          </Box>

          {/* Secondary Filings */}
          {secondaryFilings.length > 0 && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                Secondary Filings
                <Chip
                  label={`${secondaryFilings.length} ${secondaryFilings.length === 1 ? 'Canton' : 'Cantons'}`}
                  size="small"
                  color="secondary"
                  sx={{ ml: 2 }}
                />
              </Typography>
              {secondaryFilings.map(filing => (
                <Box key={filing.id} mb={2}>
                  <FilingCard
                    filing={filing}
                    calculation={calculations[filing.id]}
                    isPrimary={false}
                    onDownloadPDF={handleDownloadPDF}
                  />
                </Box>
              ))}
            </Box>
          )}
        </Grid>

        {/* Right Column: Tools & Optimization */}
        <Grid item xs={12} lg={4}>
          {/* Quick Actions */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Box display="flex" flexDirection="column" gap={2}>
              <Button
                variant="outlined"
                startIcon={<OptimizeIcon />}
                onClick={() => setShowOptimization(true)}
                fullWidth
              >
                Tax Optimization
              </Button>
              <Button
                variant="outlined"
                startIcon={<AssessmentIcon />}
                fullWidth
              >
                View Reports
              </Button>
            </Box>
          </Paper>

          {/* Document Upload */}
          <DocumentUploadPanel
            filingId={primaryFiling.id}
            onDocumentProcessed={loadFilings}
          />

          {/* Tax Breakdown */}
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Tax Breakdown
            </Typography>
            <Divider sx={{ my: 2 }} />
            {filings.map(filing => {
              const calc = calculations[filing.id];
              if (!calc) return null;

              return (
                <Box key={filing.id} mb={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    {filing.canton} {filing.is_primary ? '(Primary)' : '(Secondary)'}
                  </Typography>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="body2" color="textSecondary">{t('filing.federal')}</Typography>
                    <Typography variant="body2">
                      CHF {(calc.federal_tax || 0).toLocaleString('de-CH', { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="body2" color="textSecondary">{t('filing.cantonal')}</Typography>
                    <Typography variant="body2">
                      CHF {(calc.cantonal_tax || 0).toLocaleString('de-CH', { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="body2" color="textSecondary">{t('filing.municipal')}</Typography>
                    <Typography variant="body2">
                      CHF {(calc.municipal_tax || 0).toLocaleString('de-CH', { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" fontWeight="bold">{t('filing.total')}</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      CHF {(calc.total_tax || 0).toLocaleString('de-CH', { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Paper>
        </Grid>
      </Grid>

      {/* Optimization Panel Dialog */}
      {showOptimization && (
        <OptimizationPanel
          open={showOptimization}
          onClose={() => setShowOptimization(false)}
          filingId={primaryFiling.id}
        />
      )}
    </Container>
  );
};

export default MultiCantonDashboard;
