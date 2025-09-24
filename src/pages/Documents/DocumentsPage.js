import React, { useState } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Alert,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  LinearProgress,
  Chip
} from '@mui/material';
import {
  CloudUpload,
  CheckCircle,
  Error,
  Description
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';

const DocumentsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { sessionId, profile, documentRequirements } = location.state || {};

  const [uploadedFiles, setUploadedFiles] = useState({});
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  // Redirect if no session data
  React.useEffect(() => {
    if (!sessionId || !documentRequirements) {
      navigate('/interview');
    }
  }, [sessionId, documentRequirements, navigate]);

  // Early return if no data
  if (!sessionId || !documentRequirements) {
    return null;
  }

  const handleFileSelect = (docType, event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload PDF or image files only');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setUploadedFiles(prev => ({
      ...prev,
      [docType]: file
    }));
    setError(null);
  };

  const handleUpload = async (docType) => {
    const file = uploadedFiles[docType];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sessionId', sessionId);
      formData.append('documentType', docType);

      // TODO: Implement actual upload to S3 via backend API
      // const response = await api.post('/api/documents/upload', formData);

      // Simulate upload for now
      await new Promise(resolve => setTimeout(resolve, 1500));

      setUploadedFiles(prev => ({
        ...prev,
        [docType]: { ...file, uploaded: true }
      }));
    } catch (err) {
      setError('Failed to upload document. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const allDocumentsUploaded = documentRequirements.every(
    req => uploadedFiles[req.type]?.uploaded
  );

  const handleSubmit = async () => {
    if (!allDocumentsUploaded) {
      setError('Please upload all required documents');
      return;
    }

    // Navigate to next step (e.g., review or submission)
    navigate('/review', {
      state: {
        sessionId,
        profile,
        documentRequirements,
        uploadedFiles
      }
    });
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom align="center">
        Document Upload
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Required Documents
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Please upload the following documents to complete your tax filing
          </Typography>

          <List>
            {documentRequirements.map((requirement, index) => {
              const file = uploadedFiles[requirement.type];
              const isUploaded = file?.uploaded;

              return (
                <ListItem
                  key={`${requirement.type}-${index}`}
                  sx={{
                    border: '1px solid',
                    borderColor: isUploaded ? 'success.main' : 'grey.300',
                    borderRadius: 1,
                    mb: 2,
                    p: 2
                  }}
                >
                  <ListItemIcon>
                    {isUploaded ? (
                      <CheckCircle color="success" />
                    ) : (
                      <Description />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1">
                          {requirement.type.replace(/_/g, ' ').toUpperCase()}
                        </Typography>
                        {requirement.quantity > 1 && (
                          <Chip
                            label={`${requirement.quantity} required`}
                            size="small"
                            color="primary"
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {requirement.description}
                        </Typography>
                        {file && (
                          <Typography variant="caption" color="text.secondary">
                            Selected: {file.name}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <Box sx={{ ml: 2 }}>
                    <input
                      accept=".pdf,image/*"
                      style={{ display: 'none' }}
                      id={`upload-${requirement.type}`}
                      type="file"
                      onChange={(e) => handleFileSelect(requirement.type, e)}
                      disabled={uploading || isUploaded}
                    />
                    <label htmlFor={`upload-${requirement.type}`}>
                      <Button
                        variant={file ? "outlined" : "contained"}
                        component="span"
                        disabled={uploading || isUploaded}
                        startIcon={<CloudUpload />}
                      >
                        {isUploaded ? 'Uploaded' : file ? 'Change' : 'Select'}
                      </Button>
                    </label>
                    {file && !isUploaded && (
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleUpload(requirement.type)}
                        disabled={uploading}
                        sx={{ ml: 1 }}
                      >
                        Upload
                      </Button>
                    )}
                  </Box>
                </ListItem>
              );
            })}
          </List>

          {uploading && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                Uploading document...
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button
          variant="outlined"
          onClick={() => navigate('/interview')}
        >
          Back to Interview
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={!allDocumentsUploaded || uploading}
        >
          Continue to Review
        </Button>
      </Box>
    </Container>
  );
};

export default DocumentsPage;