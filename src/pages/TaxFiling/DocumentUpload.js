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

const DocumentUpload = () => {
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
      alert('Please upload only PDF, JPG, or PNG files under 10MB');
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
      alert('Failed to upload document. Please try again.');
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
      alert('OCR processing started. This may take a few moments.');
      setOcrDialog(false);
    } catch (error) {
      console.error('OCR failed:', error);
      alert('Failed to process document. Please try again.');
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
      LOHNAUSWEIS: 'Salary Certificate',
      PILLAR_3A: 'Pillar 3a Certificate',
      INSURANCE_PREMIUM: 'Insurance Premium Statement',
      BANK_STATEMENTS: 'Bank Statements',
      MEDICAL_RECEIPTS: 'Medical Receipts'
    };
    return names[code] || code;
  };

  const allDocumentsUploaded = requiredDocuments.every(
    doc => documentStatus[doc.code]?.uploaded
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom align="center" sx={{ mb: 4 }}>
        Upload Your Documents
      </Typography>

      {/* Progress Stepper */}
      <Box sx={{ mb: 4 }}>
        <Stepper activeStep={1} alternativeLabel>
          <Step completed>
            <StepLabel>Interview</StepLabel>
          </Step>
          <Step>
            <StepLabel>Documents</StepLabel>
          </Step>
          <Step>
            <StepLabel>Review</StepLabel>
          </Step>
          <Step>
            <StepLabel>Submit</StepLabel>
          </Step>
        </Stepper>
      </Box>

      {/* Info Alert */}
      <Alert severity="info" icon={<Info />} sx={{ mb: 3 }}>
        Based on your interview answers, please upload the following documents.
        Our OCR technology will automatically extract relevant information.
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
                        label={status.verified ? 'Verified' : 'Uploaded'}
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
                            secondary="Uploaded successfully"
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
                          Run OCR Scan
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
                          ? 'Drop the file here'
                          : 'Drag & drop or click to upload'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        PDF, JPG, PNG (max 10MB)
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
          Additional Documents (Optional)
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Upload any additional documents that may help reduce your tax burden
        </Typography>
        <Button variant="outlined" startIcon={<CloudUpload />}>
          Upload Additional Documents
        </Button>
      </Paper>

      {/* Navigation Buttons */}
      <Box display="flex" justifyContent="space-between" mt={4}>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/tax-filing/interview')}
        >
          Back to Interview
        </Button>
        <Button
          variant="contained"
          endIcon={<ArrowForward />}
          onClick={() => navigate('/tax-filing/review')}
          disabled={!allDocumentsUploaded}
        >
          Continue to Review
        </Button>
      </Box>

      {/* OCR Dialog */}
      <Dialog open={ocrDialog} onClose={() => setOcrDialog(false)}>
        <DialogTitle>Process Document with OCR</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            Would you like to automatically extract information from{' '}
            <strong>{ocrDocument?.fileName}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Our OCR technology will scan the document and automatically fill in relevant
            tax information, saving you time and reducing errors.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOcrDialog(false)}>
            Skip
          </Button>
          <Button variant="contained" onClick={handleStartOCR} startIcon={<Scanner />}>
            Start OCR Scan
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DocumentUpload;