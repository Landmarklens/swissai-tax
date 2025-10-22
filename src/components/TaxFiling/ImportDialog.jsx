/**
 * ImportDialog Component
 *
 * Modern, polished modal dialog for uploading structured import documents (eCH-0196, Swissdec ELM).
 * Provides 4-step flow: Choose → Upload → Review → Confirm
 */

import React, { useState } from 'react';
import axios from 'axios';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  LinearProgress,
  Alert,
  IconButton,
  Card,
  CardContent,
  CardActionArea,
  Stepper,
  Step,
  StepLabel,
  Chip,
  Divider,
  Paper,
  Stack,
  CircularProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  AccountBalance as BankIcon,
  Work as WorkIcon,
  CloudUpload as UploadIcon,
  CheckCircle as CheckCircleIcon,
  Description as DocumentIcon,
  TimerOutlined as TimerIcon,
} from '@mui/icons-material';

const ImportDialog = ({ isOpen, onClose, onImportComplete, sessionId }) => {
  const [step, setStep] = useState(1); // 1=Choose, 2=Upload, 3=Review
  const [selectedType, setSelectedType] = useState(null); // 'bank' or 'salary'
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [error, setError] = useState(null);
  const [uploadedDocuments, setUploadedDocuments] = useState([]); // Track uploaded docs

  const steps = ['Choose Type', 'Upload', 'Review'];

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUploadAndPreview = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Call preview endpoint
      const response = await axios.post(
        '/api/documents/structured-import/preview',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setPreviewData(response.data);
      setStep(3); // Move to review step
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to process document');
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmImport = async () => {
    setProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (sessionId) {
        formData.append('session_id', sessionId);
      }

      // Call actual import endpoint
      const response = await axios.post(
        '/api/documents/structured-import',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      // Track this uploaded document
      setUploadedDocuments(prev => [...prev, { type: selectedType, data: response.data }]);

      // Success! Notify parent
      onImportComplete(response.data);

      // Reset for potential next upload
      setFile(null);
      setPreviewData(null);
      setSelectedType(null);
      setStep(1);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to import document');
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setSelectedType(null);
    setFile(null);
    setPreviewData(null);
    setError(null);
    setUploadedDocuments([]);
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '90vh',
        }
      }}
    >
      {/* Header */}
      <DialogTitle sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        pb: 2,
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <Box>
          <Typography variant="h5" component="div" fontWeight="bold" gutterBottom>
            Import Tax Documents
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Auto-fill your tax data in seconds
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small" sx={{ ml: 2 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Stepper */}
      <Box sx={{ px: 3, pt: 3 }}>
        <Stepper activeStep={step - 1} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {/* Content */}
      <DialogContent sx={{ px: 3, py: 3 }}>
        {/* Step 1: Choose Type */}
        {step === 1 && (
          <Box>
            <Typography variant="body1" color="text.secondary" mb={3} textAlign="center">
              Select the type of document you want to import
            </Typography>

            {uploadedDocuments.length > 0 && (
              <Alert severity="success" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>{uploadedDocuments.length} document(s) uploaded!</strong> You can upload another document or finish.
                </Typography>
              </Alert>
            )}

            <Stack spacing={2}>
              {/* Bank Statement Card */}
              <Card
                variant="outlined"
                sx={{
                  transition: 'all 0.2s',
                  opacity: uploadedDocuments.some(doc => doc.type === 'bank') ? 0.5 : 1,
                  '&:hover': uploadedDocuments.some(doc => doc.type === 'bank') ? {} : {
                    borderColor: 'primary.main',
                    boxShadow: 2,
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <CardActionArea
                  onClick={() => {
                    setSelectedType('bank');
                    setStep(2);
                  }}
                  disabled={uploadedDocuments.some(doc => doc.type === 'bank')}
                  sx={{ p: 3 }}
                >
                  <Box display="flex" alignItems="flex-start" gap={2}>
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: 2,
                        bgcolor: uploadedDocuments.some(doc => doc.type === 'bank') ? 'success.light' : 'primary.light',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        position: 'relative',
                      }}
                    >
                      {uploadedDocuments.some(doc => doc.type === 'bank') ? (
                        <CheckCircleIcon sx={{ fontSize: 32, color: 'success.main' }} />
                      ) : (
                        <BankIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                      )}
                    </Box>
                    <Box flex={1}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="h6" fontWeight="bold">
                          Bank Statement (eCH-0196)
                        </Typography>
                        {uploadedDocuments.some(doc => doc.type === 'bank') && (
                          <Chip label="Uploaded" size="small" color="success" />
                        )}
                      </Box>
                      <Typography variant="body2" color="text.secondary" mb={2}>
                        Electronic tax statement from your bank with account balances, interest, securities, and dividends
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Chip label="17 fields" size="small" color="primary" variant="outlined" />
                        <Chip label="99% accuracy" size="small" color="success" variant="outlined" />
                        <Chip label="~20 min saved" size="small" icon={<TimerIcon />} />
                      </Stack>
                    </Box>
                  </Box>
                </CardActionArea>
              </Card>

              {/* Salary Certificate Card */}
              <Card
                variant="outlined"
                sx={{
                  transition: 'all 0.2s',
                  opacity: uploadedDocuments.some(doc => doc.type === 'salary') ? 0.5 : 1,
                  '&:hover': uploadedDocuments.some(doc => doc.type === 'salary') ? {} : {
                    borderColor: 'primary.main',
                    boxShadow: 2,
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <CardActionArea
                  onClick={() => {
                    setSelectedType('salary');
                    setStep(2);
                  }}
                  disabled={uploadedDocuments.some(doc => doc.type === 'salary')}
                  sx={{ p: 3 }}
                >
                  <Box display="flex" alignItems="flex-start" gap={2}>
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: 2,
                        bgcolor: uploadedDocuments.some(doc => doc.type === 'salary') ? 'success.light' : 'secondary.light',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        position: 'relative',
                      }}
                    >
                      {uploadedDocuments.some(doc => doc.type === 'salary') ? (
                        <CheckCircleIcon sx={{ fontSize: 32, color: 'success.main' }} />
                      ) : (
                        <WorkIcon sx={{ fontSize: 32, color: 'secondary.main' }} />
                      )}
                    </Box>
                    <Box flex={1}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="h6" fontWeight="bold">
                          Salary Certificate (Swissdec ELM)
                        </Typography>
                        {uploadedDocuments.some(doc => doc.type === 'salary') && (
                          <Chip label="Uploaded" size="small" color="success" />
                        )}
                      </Box>
                      <Typography variant="body2" color="text.secondary" mb={2}>
                        Electronic salary certificate (Lohnausweis) from your employer with salary, deductions, and benefits
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Chip label="15 fields" size="small" color="primary" variant="outlined" />
                        <Chip label="99% accuracy" size="small" color="success" variant="outlined" />
                        <Chip label="~15 min saved" size="small" icon={<TimerIcon />} />
                      </Stack>
                    </Box>
                  </Box>
                </CardActionArea>
              </Card>
            </Stack>

            <Alert severity="info" icon={<DocumentIcon />} sx={{ mt: 3 }}>
              <Typography variant="body2">
                <strong>Tip:</strong> You can upload both documents to maximize the information extracted from your records.
              </Typography>
            </Alert>
          </Box>
        )}

        {/* Step 2: Upload */}
        {step === 2 && (
          <Box>
            <Alert
              severity="info"
              icon={selectedType === 'bank' ? <BankIcon /> : <WorkIcon />}
              sx={{ mb: 3 }}
            >
              <Typography variant="body2">
                <strong>
                  {selectedType === 'bank' ? 'eCH-0196 Bank Statement' : 'Swissdec Salary Certificate'}
                </strong>
                <br />
                {selectedType === 'bank'
                  ? 'Upload your eCH-0196 bank statement (PDF with barcode or XML)'
                  : 'Upload your Swissdec ELM salary certificate (PDF or XML)'}
              </Typography>
            </Alert>

            <Paper
              variant="outlined"
              sx={{
                p: 4,
                textAlign: 'center',
                borderStyle: 'dashed',
                borderWidth: 2,
                borderColor: file ? 'success.main' : 'divider',
                bgcolor: file ? 'success.lighter' : 'background.default',
                transition: 'all 0.2s',
              }}
            >
              <input
                type="file"
                accept=".pdf,.xml"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                id="file-upload-input"
              />

              {!file ? (
                <>
                  <UploadIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Drop your file here or click to browse
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={3}>
                    Supported formats: PDF, XML (max 10MB)
                  </Typography>
                  <label htmlFor="file-upload-input">
                    <Button
                      variant="contained"
                      component="span"
                      size="large"
                      startIcon={<UploadIcon />}
                    >
                      Choose File
                    </Button>
                  </label>
                </>
              ) : (
                <>
                  <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    File Selected
                  </Typography>
                  <Typography variant="body1" fontWeight="medium" gutterBottom>
                    {file.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    {(file.size / 1024).toFixed(1)} KB
                  </Typography>
                  <label htmlFor="file-upload-input">
                    <Button
                      variant="outlined"
                      component="span"
                      size="small"
                    >
                      Change File
                    </Button>
                  </label>
                </>
              )}
            </Paper>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            {processing && (
              <Box sx={{ mt: 3 }}>
                <LinearProgress />
                <Typography variant="body2" color="text.secondary" textAlign="center" mt={1}>
                  Processing document...
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Step 3: Review */}
        {step === 3 && previewData && (
          <Box>
            <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Successfully extracted {previewData.fields_count} fields</strong>
                <br />
                Format: {previewData.format} | Confidence: {(previewData.confidence * 100).toFixed(0)}%
              </Typography>
            </Alert>

            <Paper variant="outlined" sx={{ p: 2, maxHeight: 400, overflow: 'auto' }}>
              <Typography variant="h6" gutterBottom>
                Extracted Data
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={1.5}>
                {Object.entries(previewData.tax_profile_mappings || {}).map(([key, value]) => (
                  <Box
                    key={key}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      py: 1,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      '&:last-child': { borderBottom: 'none' }
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {value}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Paper>

            <Alert severity="info" icon={<TimerIcon />} sx={{ mt: 3 }}>
              <Typography variant="body2">
                <strong>Estimated time saved:</strong> {previewData.estimated_time_saved}
              </Typography>
            </Alert>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>

      {/* Actions */}
      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        {step === 1 && (
          <>
            <Button onClick={handleClose} size="large">
              {uploadedDocuments.length > 0 ? 'Finish' : 'Cancel'}
            </Button>
            {uploadedDocuments.length > 0 && uploadedDocuments.length < 2 && (
              <Typography variant="caption" color="text.secondary" sx={{ flex: 1, ml: 2 }}>
                Upload another document or click Finish to continue
              </Typography>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <Button onClick={() => setStep(1)} size="large">
              Back
            </Button>
            <Button
              onClick={handleUploadAndPreview}
              variant="contained"
              size="large"
              disabled={!file || processing}
              startIcon={processing ? <CircularProgress size={20} /> : <UploadIcon />}
            >
              {processing ? 'Processing...' : 'Continue'}
            </Button>
          </>
        )}

        {step === 3 && (
          <>
            <Button onClick={() => setStep(2)} size="large">
              Change File
            </Button>
            <Button
              onClick={handleConfirmImport}
              variant="contained"
              color="success"
              size="large"
              disabled={processing}
              startIcon={processing ? <CircularProgress size={20} /> : <CheckCircleIcon />}
            >
              {processing ? 'Importing...' : (uploadedDocuments.length > 0 ? 'Import & Continue' : 'Confirm Import')}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ImportDialog;
