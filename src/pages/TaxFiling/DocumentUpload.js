import React, { useState, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import {
  CloudUpload,
  Description,
  Check,
  Close,
  Delete,
  Visibility,
  Scanner,
  Warning,
  Info,
  ArrowForward,
  ArrowBack
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { uploadDocument } from '../../store/slices/taxFilingSlice';
import { documentAPI } from '../../services/api';
import { useTranslation } from 'react-i18next';

const DocumentUpload = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { session, documents } = useSelector((state) => state.taxFiling);
  const [uploading, setUploading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({});
  const [ocrDialog, setOcrDialog] = useState(false);
  const [ocrDocument, setOcrDocument] = useState(null);

  // Document requirements based on session
  const requiredDocuments = session.requiredDocuments || [
    { code: 'LOHNAUSWEIS', reason: 'Employment income declared' },
    { code: 'PILLAR_3A', reason: 'Pillar 3a contributions declared' },
    { code: 'INSURANCE_PREMIUM', reason: 'Insurance deductions claimed' }
  ];

  const documentStatus = {
    LOHNAUSWEIS: { uploaded: true, verified: true, fileName: 'Lohnausweis_2024.pdf' },
    PILLAR_3A: { uploaded: true, verified: false, fileName: 'Pillar3a_Certificate.pdf' },
    INSURANCE_PREMIUM: { uploaded: false, verified: false, fileName: null }
  };

  const onDrop = useCallback(async (acceptedFiles, fileRejections, documentType) => {
    if (fileRejections.length > 0) {
      alert(t('document.file_type_error'));
      return;
    }

    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress({ [documentType]: 0 });

    try {
      // Simulate upload progress
      for (let i = 0; i <= 100; i += 20) {
        setUploadProgress({ [documentType]: i });
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Upload document
      await dispatch(uploadDocument({
        sessionId: session.id,
        documentType,
        file
      })).unwrap();

      setUploadProgress({ [documentType]: 100 });

      // Trigger OCR if it's a document that needs processing
      if (['LOHNAUSWEIS', 'BANK_STATEMENTS'].includes(documentType)) {
        setOcrDocument({ type: documentType, fileName: file.name });
        setOcrDialog(true);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert(t('document.upload_error'));
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress({}), 1000);
    }
  }, [dispatch, session.id]);

  const handleStartOCR = async () => {
    if (!ocrDocument) return;

    try {
      // Start OCR processing
      await documentAPI.processDocument(ocrDocument.documentId);
      alert(t('document.ocr_processing_started'));
      setOcrDialog(false);
    } catch (error) {
      console.error('OCR failed:', error);
      alert(t('document.ocr_processing_error'));
    }
  };

  const getDropzoneProps = (documentType) => {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop: (acceptedFiles, fileRejections) => onDrop(acceptedFiles, fileRejections, documentType),
      accept: {
        'application/pdf': ['.pdf'],
        'image/jpeg': ['.jpg', '.jpeg'],
        'image/png': ['.png']
      },
      maxSize: 10485760, // 10MB
      multiple: false
    });

    return { getRootProps, getInputProps, isDragActive };
  };

  const getDocumentName = (code) => {
    const names = {
      LOHNAUSWEIS: t('document.salary_certificate'),
      PILLAR_3A: t('document.pillar_3a_certificate'),
      INSURANCE_PREMIUM: t('document.insurance_premium_statement'),
      BANK_STATEMENTS: t('document.bank_statements'),
      MEDICAL_RECEIPTS: t('document.medical_receipts')
    };
    return names[code] || code;
  };

  const allDocumentsUploaded = requiredDocuments.every(
    doc => documentStatus[doc.code]?.uploaded
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom align="center" sx={{ mb: 4 }}>
        {t('document.upload_title')}
      </Typography>

      {/* Progress Stepper */}
      <Box sx={{ mb: 4 }}>
        <Stepper activeStep={1} alternativeLabel>
          <Step completed>
            <StepLabel>{t('document.interview')}</StepLabel>
          </Step>
          <Step>
            <StepLabel>{t('document.documents')}</StepLabel>
          </Step>
          <Step>
            <StepLabel>{t('document.review')}</StepLabel>
          </Step>
          <Step>
            <StepLabel>{t('document.submit')}</StepLabel>
          </Step>
        </Stepper>
      </Box>

      {/* Info Alert */}
      <Alert severity="info" icon={<Info />} sx={{ mb: 3 }}>
        {t('document.upload_info_message')}
      </Alert>

      {/* Document Upload Cards */}
      <Grid container spacing={3}>
        {requiredDocuments.map((doc) => {
          const status = documentStatus[doc.code];
          const dropzone = getDropzoneProps(doc.code);

          return (
            <Grid item xs={12} md={6} key={doc.code}>
              <Card
                sx={{
                  border: status?.verified ? '2px solid' : '1px solid',
                  borderColor: status?.verified ? 'success.main' : 'divider'
                }}
              >
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">
                      {getDocumentName(doc.code)}
                    </Typography>
                    {status?.uploaded && (
                      <Chip
                        size="small"
                        label={status.verified ? t('document.verified') : t('document.uploaded')}
                        color={status.verified ? 'success' : 'warning'}
                        icon={status.verified ? <Check /> : <Warning />}
                      />
                    )}
                  </Box>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {doc.reason}
                  </Typography>

                  {status?.uploaded ? (
                    <Box>
                      <List dense>
                        <ListItem>
                          <ListItemIcon>
                            <Description color="primary" />
                          </ListItemIcon>
                          <ListItemText
                            primary={status.fileName}
                            secondary={t('document.uploaded_successfully')}
                          />
                          <ListItemSecondaryAction>
                            <IconButton edge="end" size="small">
                              <Visibility />
                            </IconButton>
                            <IconButton edge="end" size="small">
                              <Delete />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                      </List>
                      {!status.verified && (
                        <Button
                          startIcon={<Scanner />}
                          size="small"
                          onClick={() => {
                            setOcrDocument({ type: doc.code, fileName: status.fileName });
                            setOcrDialog(true);
                          }}
                        >
                          {t('document.run_ocr_scan')}
                        </Button>
                      )}
                    </Box>
                  ) : (
                    <Box
                      {...dropzone.getRootProps()}
                      sx={{
                        border: '2px dashed',
                        borderColor: dropzone.isDragActive ? 'primary.main' : 'divider',
                        borderRadius: 1,
                        p: 3,
                        textAlign: 'center',
                        cursor: 'pointer',
                        bgcolor: dropzone.isDragActive ? 'action.hover' : 'background.paper',
                        '&:hover': {
                          bgcolor: 'action.hover'
                        }
                      }}
                    >
                      <input {...dropzone.getInputProps()} />
                      <CloudUpload sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                      <Typography variant="body2">
                        {dropzone.isDragActive
                          ? t('document.drop_file_here')
                          : t('document.drag_drop_or_click')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t('document.file_format_info')}
                      </Typography>
                      {uploadProgress[doc.code] !== undefined && (
                        <Box mt={2}>
                          <LinearProgress variant="determinate" value={uploadProgress[doc.code]} />
                        </Box>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Optional Documents Section */}
      <Paper sx={{ mt: 4, p: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t('document.additional_documents_optional')}
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          {t('document.additional_documents_info')}
        </Typography>
        <Button variant="outlined" startIcon={<CloudUpload />}>
          {t('document.upload_additional_documents')}
        </Button>
      </Paper>

      {/* Navigation Buttons */}
      <Box display="flex" justifyContent="space-between" mt={4}>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/tax-filing/interview')}
        >
          {t('document.back_to_interview')}
        </Button>
        <Button
          variant="contained"
          endIcon={<ArrowForward />}
          onClick={() => navigate('/tax-filing/review')}
          disabled={!allDocumentsUploaded}
        >
          {t('document.continue_to_review')}
        </Button>
      </Box>

      {/* OCR Dialog */}
      <Dialog open={ocrDialog} onClose={() => setOcrDialog(false)}>
        <DialogTitle>{t('document.process_document_with_ocr')}</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            {t('document.ocr_extract_question', { fileName: ocrDocument?.fileName })}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('document.ocr_description')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOcrDialog(false)}>
            {t('document.skip')}
          </Button>
          <Button variant="contained" onClick={handleStartOCR} startIcon={<Scanner />}>
            {t('document.start_ocr_scan')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DocumentUpload;