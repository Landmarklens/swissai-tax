import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Button,
  Typography,
  LinearProgress,
  Alert,
  Link,
  Paper,
  Chip,
  Stack,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import {
  CloudUpload,
  InsertDriveFile,
  CheckCircle,
  Error as ErrorIcon,
  Info as InfoIcon,
  AccessTime
} from '@mui/icons-material';

/**
 * Document Upload Question Component
 * Handles document uploads with drag-and-drop, progress tracking, and "bring later" option
 *
 * @param {Object} props
 * @param {import('../../types/interview').DocumentUploadQuestion} props.question - Question data
 * @param {string} props.sessionId - Interview session ID
 * @param {function} props.onUploadComplete - Callback when upload completes
 * @param {function} props.onBringLater - Callback when user chooses "bring later"
 * @param {function} props.onUpload - Upload function
 */
const DocumentUploadQuestion = ({
  question,
  sessionId,
  onUploadComplete,
  onBringLater,
  onUpload
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // DEBUG: Log props on component mount
  console.log('[DocumentUploadQuestion] Component mounted with props:', {
    questionId: question?.id,
    sessionId,
    onUploadType: typeof onUpload,
    onUploadExists: !!onUpload,
    allProps: { question, sessionId, onUploadComplete, onBringLater, onUpload }
  });

  /**
   * Validate file before upload
   * @param {File} file - File to validate
   * @returns {{valid: boolean, error: string | null}}
   */
  const validateFile = (file) => {
    // Validate file size
    const maxSizeMB = question.max_size_mb || 10;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return {
        valid: false,
        error: `File too large. Maximum size is ${maxSizeMB}MB (your file: ${(file.size / 1024 / 1024).toFixed(2)}MB)`
      };
    }

    // Validate file type
    const extension = file.name.split('.').pop()?.toLowerCase();
    const acceptedFormats = question.accepted_formats || ['pdf', 'jpg', 'jpeg', 'png'];
    if (!acceptedFormats.includes(extension)) {
      return {
        valid: false,
        error: `Invalid file type. Accepted formats: ${acceptedFormats.join(', ')}`
      };
    }

    return { valid: true, error: null };
  };

  /**
   * Handle file drop/selection
   */
  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setError(null);
    setUploading(true);
    setUploadedFile(file);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('question_id', question.id);
      formData.append('document_type', question.document_type || 'general');

      // DEBUG: Log what we're sending
      console.log('[DocumentUploadQuestion] Preparing upload:', {
        fileName: file.name,
        fileSize: file.size,
        questionId: question.id,
        documentType: question.document_type || 'general',
        formDataKeys: Array.from(formData.keys()),
        formDataValues: Array.from(formData.entries()).map(([key, value]) =>
          key === 'file' ? `${key}: [File: ${value.name}]` : `${key}: ${value}`
        )
      });

      // Call upload function with progress tracking
      const response = await onUpload(formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          setProgress(percentCompleted);
        }
      });

      setUploadSuccess(true);
      setTimeout(() => {
        onUploadComplete(response.data);
      }, 500); // Small delay to show success state
    } catch (err) {
      console.error('Upload error:', err);
      setError(
        err.response?.data?.error ||
        err.message ||
        'Upload failed. Please try again.'
      );
      setUploadedFile(null);
      setUploadSuccess(false);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [question, onUpload, onUploadComplete]);

  /**
   * Configure dropzone
   */
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    fileRejections
  } = useDropzone({
    onDrop,
    accept: (question.accepted_formats || ['pdf', 'jpg', 'jpeg', 'png']).reduce((acc, format) => {
      const mimeTypes = {
        pdf: 'application/pdf',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png'
      };
      const mimeType = mimeTypes[format.toLowerCase()];
      if (mimeType) {
        acc[mimeType] = [`.${format}`];
      }
      return acc;
    }, {}),
    maxFiles: 1,
    disabled: uploading || uploadSuccess
  });

  /**
   * Handle "bring later" button
   */
  const handleBringLater = () => {
    onBringLater();
  };

  /**
   * Get file size display
   */
  const getFileSizeDisplay = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  return (
    <Box sx={{ my: 3 }}>
      {/* Question Title */}
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
        {typeof question.text === 'object' ? question.text.en : question.text}
      </Typography>

      {/* Help Text */}
      {question.help_text && (
        <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 2 }}>
          {question.help_text}
        </Alert>
      )}

      {/* Sample Document Link */}
      {question.sample_url && (
        <Box sx={{ mb: 2 }}>
          <Link
            href={question.sample_url}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            <InsertDriveFile fontSize="small" />
            View sample document
          </Link>
        </Box>
      )}

      {/* Error Message */}
      {error && (
        <Alert
          severity="error"
          onClose={() => setError(null)}
          sx={{ mb: 2 }}
          icon={<ErrorIcon />}
        >
          {error}
        </Alert>
      )}

      {/* File Rejections */}
      {fileRejections.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {fileRejections[0].errors[0].message}
        </Alert>
      )}

      {/* Upload Area */}
      <Paper
        {...getRootProps()}
        elevation={isDragActive ? 8 : 1}
        sx={{
          p: 4,
          border: '2px dashed',
          borderColor: isDragActive
            ? 'primary.main'
            : uploadSuccess
            ? 'success.main'
            : 'grey.300',
          bgcolor: isDragActive
            ? 'action.hover'
            : uploadSuccess
            ? 'success.light'
            : 'background.paper',
          cursor: uploading || uploadSuccess ? 'not-allowed' : 'pointer',
          textAlign: 'center',
          transition: 'all 0.2s ease',
          opacity: uploading ? 0.7 : 1,
          '&:hover': {
            borderColor: uploading || uploadSuccess ? undefined : 'primary.main',
            bgcolor: uploading || uploadSuccess ? undefined : 'action.hover'
          }
        }}
      >
        <input {...getInputProps()} data-testid="file-input" />

        {uploading ? (
          // Uploading State
          <Box>
            <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="body1" gutterBottom fontWeight={500}>
              Uploading {uploadedFile?.name}...
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {getFileSizeDisplay(uploadedFile?.size || 0)}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ my: 2, height: 8, borderRadius: 4 }}
            />
            <Typography variant="body2" color="text.secondary">
              {progress}% complete
            </Typography>
          </Box>
        ) : uploadSuccess ? (
          // Success State
          <Box>
            <CheckCircle color="success" sx={{ fontSize: 64, mb: 2 }} />
            <Typography variant="h6" color="success.main" gutterBottom>
              Upload Successful!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {uploadedFile?.name}
            </Typography>
            <Chip
              label="Verified"
              color="success"
              size="small"
              sx={{ mt: 2 }}
            />
          </Box>
        ) : (
          // Default State
          <Box>
            <CloudUpload
              sx={{
                fontSize: 64,
                color: isDragActive ? 'primary.main' : 'action.active',
                mb: 2
              }}
            />
            <Typography variant="h6" gutterBottom fontWeight={500}>
              {isDragActive
                ? 'Drop your document here'
                : 'Drag & drop your document here'}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              or click to browse
            </Typography>
            <Stack
              direction="row"
              spacing={1}
              justifyContent="center"
              sx={{ mt: 2, flexWrap: 'wrap' }}
            >
              {(question.accepted_formats || ['pdf', 'jpg', 'png']).map((format) => (
                <Chip
                  key={format}
                  label={format.toUpperCase()}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Stack>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
              Maximum file size: {question.max_size_mb || 10}MB
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Bring Later Checkbox */}
      {question.bring_later && !uploadSuccess && (
        <Box
          sx={{
            mt: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <FormControlLabel
            control={
              <Checkbox
                onChange={(e) => {
                  if (e.target.checked) {
                    handleBringLater();
                  }
                }}
                disabled={uploading}
                color="primary"
              />
            }
            label={
              <Typography variant="body2" color="text.secondary">
                I'll bring this document later
              </Typography>
            }
          />
        </Box>
      )}
    </Box>
  );
};

export default DocumentUploadQuestion;
