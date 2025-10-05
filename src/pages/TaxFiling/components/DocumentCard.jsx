import React from 'react';
import PropTypes from 'prop-types';
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Chip,
  LinearProgress,
  Tooltip
} from '@mui/material';
import {
  InsertDriveFile as FileIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  CloudUpload as UploadIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const DocumentCard = ({ document, onView, onEdit, onDelete, onReplace }) => {
  const { t } = useTranslation();

  const getStatusIcon = (status) => {
    switch (status) {
      case 'processed':
        return <CheckCircleIcon sx={{ color: '#4CAF50' }} />;
      case 'error':
        return <ErrorIcon sx={{ color: '#DC0018' }} />;
      case 'processing':
        return <UploadIcon sx={{ color: '#FFB81C' }} />;
      default:
        return <FileIcon sx={{ color: '#003DA5' }} />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'processed':
        return t('Processed');
      case 'error':
        return t('Error');
      case 'processing':
        return t('Processing');
      case 'uploading':
        return t('Uploading');
      default:
        return t('Pending');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'processed':
        return 'success';
      case 'error':
        return 'error';
      case 'processing':
      case 'uploading':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <Card
      sx={{
        border: '1px solid #E0E0E0',
        '&:hover': {
          boxShadow: 3,
          borderColor: '#DC0018'
        },
        transition: 'all 0.3s ease'
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="flex-start" gap={2}>
          {/* File Icon */}
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              backgroundColor: '#E3F2FD',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {getStatusIcon(document.status)}
          </Box>

          {/* File Info */}
          <Box flex={1}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  {document.fileName || t('Untitled Document')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {document.fileSize && formatFileSize(document.fileSize)}
                  {document.uploadedAt && ` • ${formatDate(document.uploadedAt)}`}
                </Typography>
              </Box>
              <Chip
                label={getStatusLabel(document.status)}
                color={getStatusColor(document.status)}
                size="small"
              />
            </Box>

            {/* OCR Data Preview */}
            {document.ocrData && document.status === 'processed' && (
              <Box
                sx={{
                  mt: 2,
                  p: 1.5,
                  borderRadius: 1,
                  backgroundColor: '#F5F5F5'
                }}
              >
                <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                  {t('Extracted Data')}
                </Typography>
                {Object.entries(document.ocrData).map(([key, value]) => (
                  <Box key={`${document.id}-ocr-${key}`} display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="body2" color="text.secondary">
                      {key}:
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {typeof value === 'number' ? `CHF ${value.toLocaleString('de-CH')}` : value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}

            {/* Progress bar for uploading/processing */}
            {(document.status === 'uploading' || document.status === 'processing') && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress
                  variant={document.progress ? 'determinate' : 'indeterminate'}
                  value={document.progress || 0}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#DC0018'
                    }
                  }}
                />
                {document.progress && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                    {document.progress}%
                  </Typography>
                )}
              </Box>
            )}

            {/* Error message */}
            {document.status === 'error' && document.error && (
              <Typography variant="caption" color="error" display="block" sx={{ mt: 1 }}>
                {document.error}
              </Typography>
            )}

            {/* Actions */}
            {document.status === 'processed' && (
              <Box display="flex" gap={1} mt={2}>
                <Tooltip title={t('View Document')}>
                  <IconButton size="small" onClick={() => onView(document)} sx={{ color: '#003DA5' }}>
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('Edit Extracted Data')}>
                  <IconButton size="small" onClick={() => onEdit(document)} sx={{ color: '#FFB81C' }}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('Replace Document')}>
                  <IconButton size="small" onClick={() => onReplace(document)} sx={{ color: '#4CAF50' }}>
                    <UploadIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('Delete')}>
                  <IconButton size="small" onClick={() => onDelete(document)} sx={{ color: '#DC0018' }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

DocumentCard.propTypes = {
  document: PropTypes.shape({
    id: PropTypes.string.isRequired,
    fileName: PropTypes.string,
    fileSize: PropTypes.number,
    status: PropTypes.oneOf(['uploading', 'processing', 'processed', 'error']).isRequired,
    uploadedAt: PropTypes.string,
    ocrData: PropTypes.object,
    progress: PropTypes.number,
    error: PropTypes.string,
    type: PropTypes.string
  }).isRequired,
  onView: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onReplace: PropTypes.func.isRequired
};

export default DocumentCard;
