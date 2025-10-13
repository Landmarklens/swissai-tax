import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  Alert,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Cloud as CloudIcon,
  Description as PdfIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Email as EmailIcon,
  Download as DownloadIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '../../components/header/Header';
import Footer from '../../components/footer/Footer';
import { api } from '../../services/api';

const SubmissionPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [submissionMethod, setSubmissionMethod] = useState('efile');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [confirmationNumber, setConfirmationNumber] = useState('');
  const [error, setError] = useState(null);

  const sessionId = location.state?.session_id;
  const taxYear = 2024;
  const canton = 'Zürich';
  const deadline = 'April 30, 2025';

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);

      const response = await api.post(`/api/interview/${sessionId}/submit`, {
        method: submissionMethod
      });

      setConfirmationNumber(response.data.confirmation_number);
      setSuccess(true);

      // Send confirmation email
      await api.post(`/api/interview/${sessionId}/send-confirmation`, {
        method: submissionMethod,
        confirmation_number: response.data.confirmation_number
      });
    } catch (err) {
      setError(t('submission.error_message'));
      if (process.env.NODE_ENV === 'development') {
        console.error('Submission error:', err);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await api.get(`/api/interview/${sessionId}/pdf`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `tax-filing-${taxYear}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('PDF download failed:', err);
      }
    }
  };

  const handleGoToDashboard = () => {
    navigate('/filings');
  };

  // Success Dialog
  if (success) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />

        <Container maxWidth="md" sx={{ py: 6, flex: 1 }}>
          <Box textAlign="center">
            <CheckCircleIcon sx={{ fontSize: 80, color: '#4CAF50', mb: 3 }} />

            <Typography variant="h3" fontWeight={700} gutterBottom>
              {t('submission.success_title')}
            </Typography>

            <Typography variant="body1" color="text.secondary" paragraph>
              {t('submission.success_message')}
            </Typography>

            <Card sx={{ mt: 4, textAlign: 'left' }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} mb={2}>
                  {t('submission.confirmation_details')}
                </Typography>

                <Box display="flex" flexDirection="column" gap={2}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      {t('submission.confirmation_number')}:
                    </Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace' }}>
                      {confirmationNumber}
                    </Typography>
                  </Box>

                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      {t('submission.tax_year')}:
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {taxYear}
                    </Typography>
                  </Box>

                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      {t('submission.submission_method')}:
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {submissionMethod === 'efile' ? t('submission.efile') : t('submission.manual_submission')}
                    </Typography>
                  </Box>

                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      {t('submission.submitted_date')}:
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {new Date().toLocaleDateString('en-GB')}
                    </Typography>
                  </Box>
                </Box>

                <Alert severity="info" sx={{ mt: 3 }}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <EmailIcon fontSize="small" />
                    <Typography variant="body2">
                      {t('submission.email_confirmation')}
                    </Typography>
                  </Box>
                </Alert>
              </CardContent>
            </Card>

            <Box display="flex" gap={2} justifyContent="center" mt={4}>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadPDF}
              >
                {t('submission.download_pdf')}
              </Button>
              <Button
                variant="contained"
                onClick={handleGoToDashboard}
              >
                {t('submission.go_to_dashboard')}
              </Button>
            </Box>
          </Box>
        </Container>

        <Footer />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <Container maxWidth="lg" sx={{ py: 6, flex: 1 }}>
        <Box mb={4}>
          <Typography variant="h3" fontWeight={700} gutterBottom>
            {t('submission.page_title')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('submission.page_subtitle')}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <RadioGroup
          value={submissionMethod}
          onChange={(e) => setSubmissionMethod(e.target.value)}
        >
          {/* E-Filing Option */}
          <Card
            sx={{
              mb: 3,
              border: submissionMethod === 'efile' ? '2px solid #DC0018' : '1px solid #E0E0E0',
              cursor: 'pointer',
              '&:hover': { boxShadow: 3 }
            }}
            onClick={() => setSubmissionMethod('efile')}
          >
            <CardContent>
              <FormControlLabel
                value="efile"
                control={<Radio />}
                label={
                  <Box>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <CloudIcon sx={{ color: '#003DA5' }} />
                      <Typography variant="h6" fontWeight={600}>
                        {t('submission.efile')} ({t('submission.recommended')})
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {t('submission.efile_description', { canton })}
                    </Typography>

                    <List dense>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <CheckCircleIcon sx={{ fontSize: 20, color: '#4CAF50' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={t('submission.instant_confirmation')}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <CheckCircleIcon sx={{ fontSize: 20, color: '#4CAF50' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={t('submission.faster_processing')}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <CheckCircleIcon sx={{ fontSize: 20, color: '#4CAF50' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={t('submission.automatic_receipt')}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    </List>
                  </Box>
                }
                sx={{ alignItems: 'flex-start', m: 0 }}
              />
            </CardContent>
          </Card>

          {/* Manual Submission Option */}
          <Card
            sx={{
              mb: 3,
              border: submissionMethod === 'manual' ? '2px solid #DC0018' : '1px solid #E0E0E0',
              cursor: 'pointer',
              '&:hover': { boxShadow: 3 }
            }}
            onClick={() => setSubmissionMethod('manual')}
          >
            <CardContent>
              <FormControlLabel
                value="manual"
                control={<Radio />}
                label={
                  <Box>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <PdfIcon sx={{ color: '#DC0018' }} />
                      <Typography variant="h6" fontWeight={600}>
                        {t('submission.manual_submission')}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {t('submission.manual_description')}
                    </Typography>

                    <Alert severity="warning" sx={{ mb: 2 }}>
                      {t('submission.manual_warning')}
                    </Alert>

                    <Box
                      sx={{
                        p: 2,
                        backgroundColor: '#F5F5F5',
                        borderRadius: 1
                      }}
                    >
                      <Typography variant="caption" fontWeight={600} display="block" mb={0.5}>
                        {t('submission.submission_address')}:
                      </Typography>
                      <Typography variant="body2">
                        Kantonales Steueramt Zürich<br />
                        Bändliweg 21<br />
                        8090 Zürich
                      </Typography>
                    </Box>
                  </Box>
                }
                sx={{ alignItems: 'flex-start', m: 0 }}
              />
            </CardContent>
          </Card>
        </RadioGroup>

        {/* Important Reminders */}
        <Alert severity="info" icon={<WarningIcon />} sx={{ mb: 4 }}>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            {t('submission.important_reminders')}
          </Typography>
          <List dense>
            <ListItem sx={{ px: 0 }}>
              <Typography variant="body2">
                • {t('submission.deadline_label')}: {deadline}
              </Typography>
            </ListItem>
            <ListItem sx={{ px: 0 }}>
              <Typography variant="body2">
                • {t('submission.keep_documents')}
              </Typography>
            </ListItem>
            <ListItem sx={{ px: 0 }}>
              <Typography variant="body2">
                • {t('submission.check_email')}
              </Typography>
            </ListItem>
          </List>
        </Alert>

        {/* Navigation Buttons */}
        <Box display="flex" justifyContent="space-between">
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/tax-filing/review')}
            disabled={submitting}
          >
            {t('submission.back')}
          </Button>
          <Button
            variant="contained"
            size="large"
            onClick={handleSubmit}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} /> : submissionMethod === 'efile' ? <CloudIcon /> : <PdfIcon />}
          >
            {submitting
              ? t('submission.submitting')
              : submissionMethod === 'efile'
              ? t('submission.submit_efile_button')
              : t('submission.download_pdf_forms')}
          </Button>
        </Box>
      </Container>

      <Footer />
    </Box>
  );
};

export default SubmissionPage;
