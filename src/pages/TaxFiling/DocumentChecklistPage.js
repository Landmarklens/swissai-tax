import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Grid,
  Alert,
  CircularProgress,
  LinearProgress,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { Upload, Calculate, CheckCircle } from '@mui/icons-material';
import DocumentChecklist from '../../components/Interview/DocumentChecklist';
import ProfileSummary from '../../components/Interview/ProfileSummary';
import { api } from '../../services/api';

const DocumentChecklistPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [error, setError] = useState(null);
  const [activeStep, setActiveStep] = useState(1);

  // Get data from interview completion
  const { session_id, profile, document_requirements } = location.state || {};

  const steps = ['Complete Interview', 'Upload Documents', 'Calculate Taxes', 'Review & Submit'];

  useEffect(() => {
    if (!session_id) {
      // Redirect back to interview if no session
      navigate('/tax-filing/interview');
    }
  }, [session_id, navigate]);

  const handleFileUpload = async (file, documentType) => {
    try {
      setLoading(true);
      setError(null);

      // Step 1: Get presigned URL from backend
      const presignedResponse = await api.post('/api/documents/presigned-url', {
        session_id,
        document_type: documentType,
        file_name: file.name,
        expires_in: 3600
      });

      const { url, fields, s3_key } = presignedResponse.data;

      // Step 2: Upload file directly to S3
      const formData = new FormData();
      Object.keys(fields).forEach(key => {
        formData.append(key, fields[key]);
      });
      formData.append('file', file);

      const uploadResponse = await fetch(url, {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload to S3 failed');
      }

      // Step 3: Save document metadata
      const metadataResponse = await api.post('/api/documents/metadata', {
        session_id,
        document_type_id: getDocumentTypeId(documentType),
        file_name: file.name,
        s3_key,
        file_size: file.size
      });

      // Step 4: Trigger OCR extraction
      const documentId = metadataResponse.data.id;
      await api.post(`/api/documents/${documentId}/extract`);

      // Update uploaded documents list
      setUploadedDocuments(prev => [...prev, {
        id: documentId,
        type: documentType,
        name: file.name,
        status: 'processing'
      }]);

      setUploadProgress(prev => Math.min(prev + (100 / document_requirements.length), 100));

    } catch (err) {
      setError(`Failed to upload ${file.name}: ${err.message}`);
      console.error('Upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDocumentTypeId = (type) => {
    // Map document types to IDs (these should match the database)
    const typeMap = {
      'lohnausweis': 1,
      'unemployment_statement': 2,
      'insurance_benefits': 3,
      'pillar_3a_certificate': 4,
      'donation_receipts': 5,
      // Add more as needed
    };
    return typeMap[type] || 1;
  };

  const handleCalculateTaxes = async () => {
    try {
      setLoading(true);
      setError(null);

      // Call tax calculation endpoint
      const response = await api.post('/api/tax-calculations/calculate', {
        session_id
      });

      // Navigate to results page
      navigate('/tax-filing/results', {
        state: {
          session_id,
          calculation: response.data
        }
      });

    } catch (err) {
      setError('Failed to calculate taxes. Please try again.');
      console.error('Calculation error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!session_id) {
    return null; // Will redirect in useEffect
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Typography variant="h4" gutterBottom align="center" sx={{ mb: 2 }}>
        Document Upload
      </Typography>

      {/* Progress Stepper */}
      <Box sx={{ mb: 4 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Upload Progress */}
      {uploadProgress > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="body2" gutterBottom>
            Upload Progress: {Math.round(uploadProgress)}%
          </Typography>
          <LinearProgress variant="determinate" value={uploadProgress} />
        </Paper>
      )}

      <Grid container spacing={3}>
        {/* Left Column - Profile Summary */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, position: 'sticky', top: 20 }}>
            <Typography variant="h6" gutterBottom>
              Your Profile
            </Typography>
            <ProfileSummary profile={profile} />

            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Documents uploaded: {uploadedDocuments.length} / {document_requirements?.length || 0}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Right Column - Document Checklist */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Required Documents
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Based on your interview answers, you need to upload the following documents:
            </Typography>

            <DocumentChecklist
              requirements={document_requirements || []}
              onUpload={handleFileUpload}
              uploadedDocuments={uploadedDocuments}
              loading={loading}
            />

            {/* Action Buttons */}
            <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/tax-filing/interview')}
              >
                Back to Interview
              </Button>

              <Button
                variant="contained"
                color="primary"
                startIcon={loading ? <CircularProgress size={20} /> : <Calculate />}
                onClick={handleCalculateTaxes}
                disabled={loading || uploadedDocuments.length === 0}
              >
                {loading ? 'Calculating...' : 'Calculate My Taxes'}
              </Button>
            </Box>

            {/* Skip for now option */}
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button
                size="small"
                onClick={handleCalculateTaxes}
                disabled={loading}
              >
                Calculate without all documents (estimate)
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DocumentChecklistPage;
