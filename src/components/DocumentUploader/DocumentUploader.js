import React, { useState, useCallback } from 'react';
import {
  Card,
  Box,
  Typography,
  CircularProgress,
  LinearProgress,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  InsertDriveFile as FileIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

const DocumentUploader = ({
  documentType,
  onUpload,
  onSuccess,
  onError,
  maxSize = 10485760, // 10MB default
  acceptedFormats = { 'application/pdf': ['.pdf'], 'image/*': ['.jpg', '.jpeg', '.png'] },
  multiple = false
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleUpload = async (files) => {
    if (!files || files.length === 0) return;

    const file = files[0]; // Handle first file for now
    
    // Validate file size
    if (file.size > maxSize) {
      toast.error(`Datei ist zu gross. Maximum: ${formatFileSize(maxSize)}`);
      if (onError) onError({ type: 'size', file });
      return;
    }

    setUploading(true);
    setProgress(0);

    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // Call upload function
      if (onUpload) {
        const response = await onUpload(formData);
        
        clearInterval(progressInterval);
        setProgress(100);
        
        // Add to uploaded files list
        const uploadedFile = {
          id: Date.now(),
          name: file.name,
          size: file.size,
          type: file.type,
          status: 'success',
          uploadedAt: new Date(),
          ...response
        };
        
        setUploadedFiles(prev => [...prev, uploadedFile]);
        
        toast.success('Dokument erfolgreich hochgeladen');
        if (onSuccess) onSuccess(uploadedFile);
      }
    } catch (error) {
      toast.error('Fehler beim Hochladen des Dokuments');
      if (onError) onError({ type: 'upload', error, file });
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles.map(({ file, errors }) => {
        const errorMessages = errors.map(e => e.message).join(', ');
        return `${file.name}: ${errorMessages}`;
      });
      toast.error(errors.join('\n'));
      return;
    }

    handleUpload(acceptedFiles);
  }, [documentType]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: acceptedFormats,
    maxSize,
    multiple,
    disabled: uploading
  });

  const getBorderColor = () => {
    if (isDragReject) return 'error.main';
    if (isDragActive) return 'primary.main';
    return 'border.grey';
  };

  const getBackgroundColor = () => {
    if (isDragReject) return 'error.light';
    if (isDragActive) return 'primary.lighter';
    return 'background.paper';
  };

  return (
    <Box>
      <Card
        {...getRootProps()}
        sx={{
          p: 4,
          border: '2px dashed',
          borderColor: getBorderColor(),
          bgcolor: getBackgroundColor(),
          cursor: uploading ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s ease',
          position: 'relative',
          overflow: 'hidden',
          '&:hover': {
            borderColor: uploading ? 'border.grey' : 'primary.main',
            bgcolor: uploading ? 'background.paper' : 'primary.lighter'
          }
        }}
      >
        <input {...getInputProps()} />
        
        {uploading && (
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4
            }}
          />
        )}

        <Box sx={{ textAlign: 'center' }}>
          {uploading ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <CircularProgress size={60} sx={{ mb: 2 }} />
              <Typography variant="h6">
                Hochladen... {progress}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Bitte warten Sie einen Moment
              </Typography>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <CloudUploadIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                {isDragActive ? 'Loslassen zum Hochladen' : 'Dokument hierher ziehen'}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                oder klicken zum Auswählen
              </Typography>
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 1 }}>
                <Chip label="PDF" size="small" />
                <Chip label="JPG" size="small" />
                <Chip label="PNG" size="small" />
              </Box>
              <Typography variant="caption" color="text.muted" sx={{ mt: 2, display: 'block' }}>
                Maximale Dateigrösse: {formatFileSize(maxSize)}
              </Typography>
            </motion.div>
          )}
        </Box>
      </Card>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <Card sx={{ mt: 2, p: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Hochgeladene Dokumente ({uploadedFiles.length})
          </Typography>
          <List dense>
            <AnimatePresence>
              {uploadedFiles.map((file) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <ListItem>
                    <ListItemIcon>
                      {file.status === 'success' ? (
                        <CheckCircleIcon color="success" />
                      ) : file.status === 'error' ? (
                        <ErrorIcon color="error" />
                      ) : (
                        <FileIcon />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={file.name}
                      secondary={`${formatFileSize(file.size)} • ${new Date(file.uploadedAt).toLocaleString('de-CH')}`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton size="small" onClick={() => {}}>
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => removeFile(file.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                </motion.div>
              ))}
            </AnimatePresence>
          </List>
        </Card>
      )}
    </Box>
  );
};

export default DocumentUploader;