/**
 * PreInterviewDocumentScreen Component
 *
 * Displayed BEFORE the interview questionnaire begins.
 * Educates users about eCH-0196 and Swissdec documents and offers option to upload.
 * Users can upload documents or skip and fill manually.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Divider,
  Alert,
  Paper,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';
import ImportDialog from './ImportDialog';

const PreInterviewDocumentScreen = ({ filingId, sessionId, onContinueToInterview }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const handleImportComplete = (result) => {
    console.log('Import completed:', result);
    // After successful import, continue to interview
    if (onContinueToInterview) {
      onContinueToInterview();
    }
  };

  const handleSkipToManual = () => {
    // Skip document upload and go straight to interview
    if (onContinueToInterview) {
      onContinueToInterview();
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box textAlign="center" mb={4}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          {t('preInterview.title', 'Do You Have Standard Tax Documents?')}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '800px', mx: 'auto' }}>
          {t(
            'preInterview.subtitle',
            'Upload your eCH-0196 or Swissdec documents to automatically fill in your tax information and save time!'
          )}
        </Typography>
      </Box>

      {/* Benefits Section */}
      <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 4 }}>
        <Typography variant="body2">
          <strong>{t('preInterview.whyUpload', 'Why upload documents?')}</strong>{' '}
          {t(
            'preInterview.whyUploadDesc',
            'Save up to 35 minutes by auto-filling your salary, deductions, and bank information. Our system extracts data with 99% accuracy from standardized Swiss documents.'
          )}
        </Typography>
      </Alert>

      {/* Document Type Cards */}
      <Grid container spacing={3} mb={4}>
        {/* eCH-0196 Card */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 1,
                    bgcolor: 'error.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2,
                  }}
                >
                  <Typography variant="h5">🏦</Typography>
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    eCH-0196
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('preInterview.ech0196Subtitle', 'Electronic Bank Tax Statement')}
                  </Typography>
                </Box>
              </Box>

              <Typography variant="body2" color="text.secondary" mb={2}>
                {t(
                  'preInterview.ech0196Desc',
                  'A digital tax statement from your bank containing account balances, interest income, securities, and dividends. Recognized by all Swiss cantons since 2023.'
                )}
              </Typography>

              {/* Benefits */}
              <Box mb={2}>
                <Typography variant="subtitle2" gutterBottom>
                  {t('preInterview.benefits', 'Benefits:')}
                </Typography>
                <Box display="flex" alignItems="center" mb={0.5}>
                  <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main', mr: 1 }} />
                  <Typography variant="body2">
                    {t('preInterview.autoFills', 'Auto-fills 17 questions')}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" mb={0.5}>
                  <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main', mr: 1 }} />
                  <Typography variant="body2">
                    {t('preInterview.accuracy', '99% accuracy')}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center">
                  <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main', mr: 1 }} />
                  <Typography variant="body2">
                    {t('preInterview.saves20min', 'Saves ~20 minutes')}
                  </Typography>
                </Box>
              </Box>

              {/* Example Image */}
              <Paper variant="outlined" sx={{ p: 1, bgcolor: 'grey.50' }}>
                <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                  {t('preInterview.exampleDocument', 'Example Document:')}
                </Typography>
                <img
                  src="/images/documents/ech0196-example.svg"
                  alt="eCH-0196 Example"
                  style={{ width: '100%', height: 'auto', borderRadius: '4px' }}
                />
              </Paper>
            </CardContent>
          </Card>
        </Grid>

        {/* Swissdec Card */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 1,
                    bgcolor: 'error.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2,
                  }}
                >
                  <Typography variant="h5">💼</Typography>
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    Swissdec ELM
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('preInterview.swissdecSubtitle', 'Electronic Salary Certificate')}
                  </Typography>
                </Box>
              </Box>

              <Typography variant="body2" color="text.secondary" mb={2}>
                {t(
                  'preInterview.swissdecDesc',
                  'Swiss standard salary certificate (Lohnausweis) issued by your employer. Contains your annual salary, social insurance contributions, benefits, and deductions.'
                )}
              </Typography>

              {/* Benefits */}
              <Box mb={2}>
                <Typography variant="subtitle2" gutterBottom>
                  {t('preInterview.benefits', 'Benefits:')}
                </Typography>
                <Box display="flex" alignItems="center" mb={0.5}>
                  <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main', mr: 1 }} />
                  <Typography variant="body2">
                    {t('preInterview.autoFills15', 'Auto-fills 15 questions')}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" mb={0.5}>
                  <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main', mr: 1 }} />
                  <Typography variant="body2">
                    {t('preInterview.accuracy', '99% accuracy')}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center">
                  <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main', mr: 1 }} />
                  <Typography variant="body2">
                    {t('preInterview.saves15min', 'Saves ~15 minutes')}
                  </Typography>
                </Box>
              </Box>

              {/* Example Image */}
              <Paper variant="outlined" sx={{ p: 1, bgcolor: 'grey.50' }}>
                <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                  {t('preInterview.exampleDocument', 'Example Document:')}
                </Typography>
                <img
                  src="/images/documents/swissdec-example.svg"
                  alt="Swissdec Example"
                  style={{ width: '100%', height: 'auto', borderRadius: '4px' }}
                />
              </Paper>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Divider sx={{ my: 4 }} />

      {/* Action Buttons */}
      <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={2} justifyContent="center">
        <Button
          variant="contained"
          size="large"
          startIcon={<UploadFileIcon />}
          onClick={() => setImportDialogOpen(true)}
          sx={{ px: 4, py: 1.5 }}
        >
          {t('preInterview.uploadDocuments', 'Upload Documents')}
        </Button>

        <Button
          variant="outlined"
          size="large"
          startIcon={<EditIcon />}
          onClick={handleSkipToManual}
          sx={{ px: 4, py: 1.5 }}
        >
          {t('preInterview.skipFillManually', 'Skip - Fill Manually')}
        </Button>
      </Box>

      {/* Additional Info */}
      <Box mt={4} textAlign="center">
        <Typography variant="body2" color="text.secondary">
          {t(
            'preInterview.uploadLaterNote',
            "Don't have these documents right now? No problem! You can upload them later during the interview."
          )}
        </Typography>
      </Box>

      {/* Import Dialog */}
      <ImportDialog
        isOpen={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onImportComplete={handleImportComplete}
        sessionId={sessionId}
      />
    </Container>
  );
};

export default PreInterviewDocumentScreen;
