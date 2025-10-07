/**
 * Document Upload Panel Component
 *
 * Allows users to upload tax documents (Lohnausweis, AHV statements, etc.)
 * for automatic OCR and data extraction
 */

import React, { useState } from 'react';
import axios from 'axios';
import {
  Paper,
  Typography,
  Box,
  Button,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  IconButton
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  InsertDriveFile as FileIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { getApiUrl } from '../../utils/api/getApiUrl';

const API_BASE_URL = getApiUrl();

const SUPPORTED_DOCUMENTS = [
  'Salary Certificate (Lohnausweis)',
  'AHV/IV Pension Statement',
  'Property Tax Assessment',
  'Expense Receipts',
  'Bank Statements',
  'Insurance Certificates',
  'Pillar 3a Statement'
];

const DocumentUploadPanel = ({ filingId, onDocumentProcessed }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files);

    if (files.length === 0) return;

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const results = [];

      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('ai_provider', 'anthropic');

        try {
          const response = await axios.post(
            `${API_BASE_URL}/api/documents/update-profile/${filingId}`,
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            }
          );

          results.push({
            name: file.name,
            success: true,
            documentType: response.data.document_type,
            updatedFields: response.data.updated_fields,
            confidence: response.data.confidence
          });

        } catch (err) {
          results.push({
            name: file.name,
            success: false,
            error: err.response?.data?.detail || 'Upload failed'
          });
        }
      }

      setUploadedFiles(results);

      const successCount = results.filter(r => r.success).length;
      if (successCount > 0) {
        setSuccess(`Successfully processed ${successCount} document(s)`);
        if (onDocumentProcessed) {
          onDocumentProcessed();
        }
      }

      if (results.some(r => !r.success)) {
        setError('Some documents failed to process');
      }

    } catch (err) {
      setError('Failed to upload documents');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Upload Tax Documents
      </Typography>
      <Typography variant="body2" color="textSecondary" paragraph>
        Upload your tax documents for automatic data extraction using AI
      </Typography>

      {/* Upload Button */}
      <Button
        variant="outlined"
        component="label"
        startIcon={<UploadIcon />}
        fullWidth
        disabled={uploading}
        sx={{ mb: 2 }}
      >
        {uploading ? 'Processing...' : 'Choose Files'}
        <input
          type="file"
          hidden
          multiple
          accept="image/*,.pdf"
          onChange={handleFileSelect}
        />
      </Button>

      {uploading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Status Messages */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <Box mb={2}>
          <Typography variant="subtitle2" gutterBottom>
            Processed Documents:
          </Typography>
          <List dense>
            {uploadedFiles.map((file, index) => (
              <ListItem
                key={index}
                secondaryAction={
                  <IconButton edge="end" size="small" onClick={() => handleRemoveFile(index)}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                }
                sx={{
                  bgcolor: file.success ? 'success.light' : 'error.light',
                  borderRadius: 1,
                  mb: 1
                }}
              >
                <ListItemIcon>
                  {file.success ? (
                    <CheckIcon color="success" />
                  ) : (
                    <ErrorIcon color="error" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={file.name}
                  secondary={
                    file.success ? (
                      <Box display="flex" gap={0.5} mt={0.5}>
                        <Chip
                          label={file.documentType}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={`${Object.keys(file.updatedFields || {}).length} fields`}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={`${(file.confidence * 100).toFixed(0)}% confidence`}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    ) : (
                      <Typography variant="caption" color="error">
                        {file.error}
                      </Typography>
                    )
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {/* Supported Documents */}
      <Box mt={2} p={2} sx={{ bgcolor: 'background.default', borderRadius: 1 }}>
        <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
          Supported Swiss tax documents:
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={0.5}>
          {SUPPORTED_DOCUMENTS.map((doc, index) => (
            <Chip
              key={index}
              label={doc}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.7rem' }}
            />
          ))}
        </Box>
      </Box>
    </Paper>
  );
};

export default DocumentUploadPanel;
