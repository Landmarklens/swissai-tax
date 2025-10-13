import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Divider,
  Alert,
  LinearProgress,
  CircularProgress,
  Snackbar
} from '@mui/material';
import {
  Folder as FolderIcon,
  CloudDownload as CloudDownloadIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { documentAPI } from '../../../services/api';

const DocumentManagementSection = () => {
  const { t } = useTranslation();
  const [storageUsed, setStorageUsed] = useState(0);
  const [storageLimit, setStorageLimit] = useState(500);
  const [documentCount, setDocumentCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    fetchStorageInfo();
  }, []);

  const fetchStorageInfo = async () => {
    try {
      const response = await documentAPI.getUserStorage();
      setStorageUsed(response.data.storage_used_mb);
      setStorageLimit(response.data.storage_limit_mb);
      setDocumentCount(response.data.document_count);
    } catch (error) {
      console.error('Error fetching storage info:', error);
      setSnackbar({
        open: true,
        message: t('Failed to load storage information'),
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadAll = async () => {
    setDownloading(true);
    try {
      const response = await documentAPI.downloadAllDocuments();
      const { download_url, document_count } = response.data;

      // Open download URL in new window
      window.open(download_url, '_blank');

      setSnackbar({
        open: true,
        message: t('Download started for {{count}} document(s)', { count: document_count }),
        severity: 'success'
      });
    } catch (error) {
      console.error('Error downloading documents:', error);
      setSnackbar({
        open: true,
        message: t('Failed to download documents'),
        severity: 'error'
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleDeleteOld = async () => {
    if (!window.confirm(t('Are you sure you want to delete all documents older than 7 years? This action cannot be undone.'))) {
      return;
    }

    setDeleting(true);
    try {
      const response = await documentAPI.deleteOldDocuments();
      const { deleted_count } = response.data;

      setSnackbar({
        open: true,
        message: t('Successfully deleted {{count}} old document(s)', { count: deleted_count }),
        severity: 'success'
      });

      // Refresh storage info
      fetchStorageInfo();
    } catch (error) {
      console.error('Error deleting old documents:', error);
      setSnackbar({
        open: true,
        message: t('Failed to delete old documents'),
        severity: 'error'
      });
    } finally {
      setDeleting(false);
    }
  };

  const storagePercentage = (storageUsed / storageLimit) * 100;

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={3}>
            <FolderIcon sx={{ color: '#DC0018' }} />
            <Typography variant="h6" fontWeight={600}>
              {t('Document Management')}
            </Typography>
          </Box>

          {/* Storage Usage */}
          <Box mb={3}>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body2" color="text.secondary">
                {t('Storage Used')} ({documentCount} {t('documents')})
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {storageUsed.toFixed(2)} MB / {storageLimit} MB
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={storagePercentage}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: '#E0E0E0',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  backgroundColor: storagePercentage > 80 ? '#DC0018' : '#4CAF50'
                }
              }}
            />
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Download All Documents */}
          <Box mb={3}>
            <Typography variant="subtitle1" fontWeight={600} mb={1}>
              {t('Download All Documents')}
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              {t('Download all your uploaded documents and tax filings as a ZIP archive')}
            </Typography>
            <Button
              variant="outlined"
              startIcon={downloading ? <CircularProgress size={20} /> : <CloudDownloadIcon />}
              onClick={handleDownloadAll}
              disabled={downloading || documentCount === 0}
              fullWidth
            >
              {downloading ? t('Creating Archive...') : t('Download All Documents')}
            </Button>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Delete Old Documents */}
          <Box>
            <Typography variant="subtitle1" fontWeight={600} mb={1}>
              {t('Delete Old Documents')}
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              {t('Delete documents older than 7 years (as per Swiss retention requirements)')}
            </Typography>
            <Alert severity="warning" sx={{ mb: 2 }}>
              {t('This action cannot be undone. Documents will be permanently deleted.')}
            </Alert>
            <Button
              variant="outlined"
              color="error"
              startIcon={deleting ? <CircularProgress size={20} /> : <DeleteIcon />}
              onClick={handleDeleteOld}
              disabled={deleting || documentCount === 0}
              fullWidth
            >
              {deleting ? t('Deleting...') : t('Delete Old Documents')}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default DocumentManagementSection;
