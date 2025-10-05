import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Button, LinearProgress, Alert } from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  InsertDriveFile as FileIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const DocumentUploadZone = ({ documentType, onUpload, maxSize = 10 }) => {
  const { t } = useTranslation();
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleFiles = useCallback(async (files) => {
    if (files.length === 0) return;

    // Validate file size
    const maxSizeBytes = maxSize * 1024 * 1024; // Convert MB to bytes
    const invalidFiles = files.filter(file => file.size > maxSizeBytes);

    if (invalidFiles.length > 0) {
      setError(`File size exceeds ${maxSize}MB limit`);
      return;
    }

    // Validate file type (PDFs and images only)
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const invalidTypes = files.filter(file => !validTypes.includes(file.type));

    if (invalidTypes.length > 0) {
      setError('Only PDF, JPG, and PNG files are allowed');
      return;
    }

    setError(null);
    setUploading(true);
    setUploadProgress(0);

    let progressInterval = null; // Move outside try block to ensure cleanup
    try {
      // Simulate upload progress
      progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            if (progressInterval) clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Call the upload handler
      await onUpload(files[0], documentType);

      if (progressInterval) clearInterval(progressInterval);
      setUploadProgress(100);

      // Reset after a delay
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 1000);
    } catch (err) {
      if (progressInterval) clearInterval(progressInterval); // Clean up on error
      setError(err.message || 'Upload failed. Please try again.');
      setUploading(false);
      setUploadProgress(0);
    }
  }, [maxSize, onUpload, documentType]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, [handleFiles]);

  const handleFileInput = useCallback((e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  }, [handleFiles]);

  return (
    <Box>
      <Box
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        sx={{
          border: `2px dashed ${dragging ? '#DC0018' : '#D0D0D0'}`,
          borderRadius: 2,
          p: 4,
          textAlign: 'center',
          backgroundColor: dragging ? '#FFE5E8' : '#FAFAFA',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          '&:hover': {
            borderColor: '#DC0018',
            backgroundColor: '#FFE5E8'
          }
        }}
      >
        {uploading ? (
          <Box>
            <FileIcon sx={{ fontSize: 48, color: '#DC0018', mb: 2 }} />
            <Typography variant="body1" gutterBottom>
              {t('Uploading')}...
            </Typography>
            <Box sx={{ width: '100%', mt: 2 }}>
              <LinearProgress
                variant="determinate"
                value={uploadProgress}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#DC0018'
                  }
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                {uploadProgress}%
              </Typography>
            </Box>
          </Box>
        ) : uploadProgress === 100 ? (
          <Box>
            <CheckIcon sx={{ fontSize: 48, color: '#4CAF50', mb: 2 }} />
            <Typography variant="body1" color="success.main">
              {t('Upload Complete')}
            </Typography>
          </Box>
        ) : (
          <>
            <CloudUploadIcon sx={{ fontSize: 48, color: '#003DA5', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {t('Drop files here')}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {t('or click to browse')}
            </Typography>
            <Button
              variant="contained"
              component="label"
              startIcon={<CloudUploadIcon />}
            >
              {t('Choose File')}
              <input
                type="file"
                hidden
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileInput}
              />
            </Button>
            <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 2 }}>
              {t('Supported formats')}: PDF, JPG, PNG ({t('Max size')}: {maxSize}MB)
            </Typography>
          </>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

DocumentUploadZone.propTypes = {
  documentType: PropTypes.string.isRequired,
  onUpload: PropTypes.func.isRequired,
  maxSize: PropTypes.number
};

DocumentUploadZone.defaultProps = {
  maxSize: 10
};

export default DocumentUploadZone;
