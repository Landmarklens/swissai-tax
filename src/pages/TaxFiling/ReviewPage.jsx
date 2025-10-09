import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  Breadcrumbs,
  Link as MuiLink
} from '@mui/material';
import {
  Edit as EditIcon,
  Download as DownloadIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  NavigateNext as NavigateNextIcon
} from '@mui/icons-material';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '../../components/header/Header';
import Footer from '../../components/footer/Footer';
import EditableField from './components/EditableField';
import TaxCalculationBreakdown from './components/TaxCalculationBreakdown';
import { api } from '../../services/api';

const ReviewPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState(null);
  const [calculation, setCalculation] = useState(null);
  const [error, setError] = useState(null);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  const loadReviewData = useCallback(async () => {
    try {
      setLoading(true);
      const sessionId = location.state?.session_id || localStorage.getItem('currentSessionId');

      if (!sessionId) {
        navigate('/dashboard');
        return;
      }

      const response = await api.get(`/api/interview/${sessionId}/review`);
      setSessionData(response.data);
      setCalculation(response.data.calculation);
      setError(null);
    } catch (err) {
      setError(t('review.error_load'));
      if (process.env.NODE_ENV === 'development') {
        console.error('Review load error:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [location.state?.session_id, navigate]);

  useEffect(() => {
    loadReviewData();
  }, [loadReviewData]);

  const handleFieldUpdate = async (section, field, value) => {
    try {
      const sessionId = sessionData.session_id;
      await api.put(`/api/interview/${sessionId}/update`, {
        section,
        field,
        value
      });

      // Reload data to get updated calculation
      await loadReviewData();
    } catch (err) {
      console.error('Failed to update field:', err);
      throw err;
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setDownloadingPDF(true);
      const sessionId = sessionData.session_id;
      const response = await api.get(`/api/interview/${sessionId}/pdf`, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `tax-filing-${sessionData.taxYear}-preview.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('PDF download failed:', err);
      }
      setError(t('review.error_pdf'));
    } finally {
      setDownloadingPDF(false);
    }
  };

  const handleContinue = () => {
    // Navigate to payment or submission based on plan
    if (sessionData?.requiresPayment) {
      navigate('/tax-filing/payment', {
        state: {
          session_id: sessionData.session_id,
          calculation: calculation
        }
      });
    } else {
      navigate('/tax-filing/submit', {
        state: {
          session_id: sessionData.session_id,
          calculation: calculation
        }
      });
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <Container maxWidth="lg" sx={{ py: 6, flex: 1 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 3 }}>
          <MuiLink component={Link} to="/dashboard" underline="hover" color="inherit">
            {t('Dashboard')}
          </MuiLink>
          <MuiLink component={Link} to="/tax-filing/interview" underline="hover" color="inherit">
            {t('Interview')}
          </MuiLink>
          <Typography color="text.primary">{t('review.title')}</Typography>
        </Breadcrumbs>

        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography variant="h3" fontWeight={700} gutterBottom>
              {t('review.title')}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t('review.subtitle')}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={downloadingPDF ? <CircularProgress size={16} /> : <DownloadIcon />}
            onClick={handleDownloadPDF}
            disabled={downloadingPDF}
          >
            {t('Download PDF Preview')}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Left Column - Personal & Income Info */}
          <Grid item xs={12} md={7}>
            {/* Personal Information */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" fontWeight={600}>
                    {t('review.personal_info')}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => navigate('/tax-filing/interview', { state: { section: 'personal' } })}
                  >
                    <EditIcon />
                  </IconButton>
                </Box>

                <Box display="flex" flexDirection="column" gap={2}>
                  <EditableField
                    label={t('filing.full_name')}
                    value={sessionData?.personal?.fullName || ''}
                    onSave={(value) => handleFieldUpdate('personal', 'fullName', value)}
                  />
                  <EditableField
                    label={t('filing.canton')}
                    value={sessionData?.personal?.canton || ''}
                    onSave={(value) => handleFieldUpdate('personal', 'canton', value)}
                  />
                  <EditableField
                    label={t('filing.filing_status')}
                    value={sessionData?.personal?.filingStatus || ''}
                    onSave={(value) => handleFieldUpdate('personal', 'filingStatus', value)}
                  />
                  <EditableField
                    label={t('filing.dependents')}
                    value={sessionData?.personal?.dependents || 0}
                    type="number"
                    onSave={(value) => handleFieldUpdate('personal', 'dependents', value)}
                  />
                </Box>
              </CardContent>
            </Card>

            {/* Income Summary */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" fontWeight={600}>
                    {t('review.income_summary')}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => navigate('/tax-filing/interview', { state: { section: 'income' } })}
                  >
                    <EditIcon />
                  </IconButton>
                </Box>

                <Box display="flex" flexDirection="column" gap={2}>
                  <EditableField
                    label={t('Employment Income')}
                    value={sessionData?.income?.employment || 0}
                    type="number"
                    prefix="CHF "
                    onSave={(value) => handleFieldUpdate('income', 'employment', value)}
                  />
                  <EditableField
                    label={t('Investment Income')}
                    value={sessionData?.income?.investment || 0}
                    type="number"
                    prefix="CHF "
                    onSave={(value) => handleFieldUpdate('income', 'investment', value)}
                  />
                  <EditableField
                    label={t('Other Income')}
                    value={sessionData?.income?.other || 0}
                    type="number"
                    prefix="CHF "
                    onSave={(value) => handleFieldUpdate('income', 'other', value)}
                  />
                  <Divider />
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body1" fontWeight={600}>
                      {t('review.total_income')}
                    </Typography>
                    <Typography variant="body1" fontWeight={700}>
                      CHF {((sessionData?.income?.employment || 0) + (sessionData?.income?.investment || 0) + (sessionData?.income?.other || 0)).toLocaleString('de-CH')}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Deductions */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" fontWeight={600}>
                    {t('Deductions')}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => navigate('/tax-filing/interview', { state: { section: 'deductions' } })}
                  >
                    <EditIcon />
                  </IconButton>
                </Box>

                <Box display="flex" flexDirection="column" gap={2}>
                  <EditableField
                    label={t('Pillar 3a')}
                    value={sessionData?.deductions?.pillar3a || 0}
                    type="number"
                    prefix="CHF "
                    onSave={(value) => handleFieldUpdate('deductions', 'pillar3a', value)}
                  />
                  <EditableField
                    label={t('Health Insurance')}
                    value={sessionData?.deductions?.healthInsurance || 0}
                    type="number"
                    prefix="CHF "
                    onSave={(value) => handleFieldUpdate('deductions', 'healthInsurance', value)}
                  />
                  <EditableField
                    label={t('Childcare')}
                    value={sessionData?.deductions?.childcare || 0}
                    type="number"
                    prefix="CHF "
                    onSave={(value) => handleFieldUpdate('deductions', 'childcare', value)}
                  />
                  <EditableField
                    label={t('Work Expenses')}
                    value={sessionData?.deductions?.workExpenses || 0}
                    type="number"
                    prefix="CHF "
                    onSave={(value) => handleFieldUpdate('deductions', 'workExpenses', value)}
                  />
                  <Divider />
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body1" fontWeight={600}>
                      {t('review.total_deductions')}
                    </Typography>
                    <Typography variant="body1" fontWeight={700} color="success.main">
                      CHF {((sessionData?.deductions?.pillar3a || 0) + (sessionData?.deductions?.healthInsurance || 0) + (sessionData?.deductions?.childcare || 0) + (sessionData?.deductions?.workExpenses || 0)).toLocaleString('de-CH')}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Right Column - Tax Calculation */}
          <Grid item xs={12} md={5}>
            <TaxCalculationBreakdown calculation={calculation} />
          </Grid>
        </Grid>

        {/* Navigation Buttons */}
        <Box display="flex" justifyContent="space-between" mt={4}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/tax-filing/documents')}
          >
            {t('review.back_to_documents')}
          </Button>
          <Button
            variant="contained"
            size="large"
            endIcon={<ArrowForwardIcon />}
            onClick={handleContinue}
          >
            {sessionData?.requiresPayment ? t('review.continue_payment') : t('review.continue_submit')}
          </Button>
        </Box>
      </Container>

      <Footer />
    </Box>
  );
};

export default ReviewPage;
