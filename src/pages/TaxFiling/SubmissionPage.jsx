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
      setError('Submission failed. Please try again or contact support.');
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
    navigate('/dashboard');
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
              {t('Submission Successful!')}
            </Typography>

            <Typography variant="body1" color="text.secondary" paragraph>
              {t('Your tax filing has been successfully submitted')}
            </Typography>

            <Card sx={{ mt: 4, textAlign: 'left' }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} mb={2}>
                  {t('Confirmation Details')}
                </Typography>

                <Box display="flex" flexDirection="column" gap={2}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      {t('Confirmation Number')}:
                    </Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace' }}>
                      {confirmationNumber}
                    </Typography>
                  </Box>

                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      {t('Tax Year')}:
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {taxYear}
                    </Typography>
                  </Box>

                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      {t('Submission Method')}:
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {submissionMethod === 'efile' ? t('E-Filing') : t('Manual Submission')}
                    </Typography>
                  </Box>

                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      {t('Submitted Date')}:
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
                      {t('A confirmation email has been sent to your registered email address')}
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
                {t('Download PDF')}
              </Button>
              <Button
                variant="contained"
                onClick={handleGoToDashboard}
              >
                {t('Go to Dashboard')}
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
            {t('Submit Your Tax Filing')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('Choose your preferred submission method')}
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
                        {t('E-Filing')} ({t('Recommended')})
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {t('Submit directly to')} {canton} {t('tax authority')}
                    </Typography>

                    <List dense>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <CheckCircleIcon sx={{ fontSize: 20, color: '#4CAF50' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={t('Instant confirmation')}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <CheckCircleIcon sx={{ fontSize: 20, color: '#4CAF50' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={t('Faster processing time')}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <CheckCircleIcon sx={{ fontSize: 20, color: '#4CAF50' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={t('Automatic receipt and confirmation number')}
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
                        {t('Manual Submission')}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {t('Download PDF and submit yourself')}
                    </Typography>

                    <Alert severity="warning" sx={{ mb: 2 }}>
                      {t('You will need to submit the forms to the tax office yourself')}
                    </Alert>

                    <Box
                      sx={{
                        p: 2,
                        backgroundColor: '#F5F5F5',
                        borderRadius: 1
                      }}
                    >
                      <Typography variant="caption" fontWeight={600} display="block" mb={0.5}>
                        {t('Submission Address')}:
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
            {t('Important Reminders')}
          </Typography>
          <List dense>
            <ListItem sx={{ px: 0 }}>
              <Typography variant="body2">
                • {t('Deadline')}: {deadline}
              </Typography>
            </ListItem>
            <ListItem sx={{ px: 0 }}>
              <Typography variant="body2">
                • {t('Keep copies of all documents for at least 10 years')}
              </Typography>
            </ListItem>
            <ListItem sx={{ px: 0 }}>
              <Typography variant="body2">
                • {t('Check your email for confirmation')}
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
            {t('Back')}
          </Button>
          <Button
            variant="contained"
            size="large"
            onClick={handleSubmit}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} /> : submissionMethod === 'efile' ? <CloudIcon /> : <PdfIcon />}
          >
            {submitting
              ? t('Submitting...')
              : submissionMethod === 'efile'
              ? t('Submit via E-Filing')
              : t('Download PDF Forms')}
          </Button>
        </Box>
      </Container>

      <Footer />
    </Box>
  );
};

export default SubmissionPage;
