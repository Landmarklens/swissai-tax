import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import {
  CloudDownload as DownloadIcon,
  Refresh as RefreshIcon,
  GetApp as GetAppIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Pending as PendingIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import userService from '../../../services/userService';

const DataExportSection = () => {
  const { t } = useTranslation();
  const [format, setFormat] = useState('json');
  const [exports, setExports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchExports();
  }, []);

  const fetchExports = async () => {
    setRefreshing(true);
    const result = await userService.listDataExports();
    setRefreshing(false);

    if (result.success) {
      setExports(result.data || []);
    }
  };

  const handleRequestExport = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    const result = await userService.requestDataExport(format);
    setLoading(false);

    if (result.success) {
      setSuccess(`Data export requested in ${format.toUpperCase()} format. You'll receive an email when it's ready.`);
      // Refresh exports list
      setTimeout(fetchExports, 1000);
    } else {
      setError(result.error);
    }
  };

  const handleDownload = (exportItem) => {
    if (exportItem.file_url) {
      window.open(exportItem.file_url, '_blank');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon color="success" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      case 'processing':
      case 'pending':
        return <PendingIcon color="info" />;
      default:
        return <InfoIcon />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'processing':
        return 'info';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatTimeRemaining = (expiresAt) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry - now;

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={3}>
          <DownloadIcon sx={{ color: '#DC0018' }} />
          <Typography variant="h6" fontWeight={600}>
            {t('Export Your Data')}
          </Typography>
          <Box flex={1} />
          <Tooltip title="Refresh exports list">
            <IconButton
              size="small"
              onClick={fetchExports}
              disabled={refreshing}
            >
              <RefreshIcon className={refreshing ? 'rotating' : ''} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Success Message */}
        {success && (
          <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert severity="error" onClose={() => setError('')} sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            {t('Request a complete export of all your data. The export will include your profile, tax filings, payments, and settings.')}
          </Typography>
        </Alert>

        {/* Export Request Form */}
        <Box mb={4}>
          <Typography variant="subtitle2" fontWeight={600} mb={2}>
            Request New Export
          </Typography>

          <Box display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }}>
            <FormControl fullWidth sx={{ maxWidth: { sm: 200 } }}>
              <InputLabel>Format</InputLabel>
              <Select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                label="Format"
                disabled={loading}
              >
                <MenuItem value="json">JSON (Structured)</MenuItem>
                <MenuItem value="csv">CSV (Tabular)</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <GetAppIcon />}
              onClick={handleRequestExport}
              disabled={loading}
              fullWidth
              sx={{ maxWidth: { sm: 200 } }}
            >
              {loading ? t('Requesting...') : t('Request Export')}
            </Button>
          </Box>

          <Typography variant="caption" color="text.secondary" display="block" mt={1}>
            Exports are available for 48 hours after generation
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Export History */}
        <Typography variant="subtitle2" fontWeight={600} mb={2}>
          Your Exports
        </Typography>

        {exports.length === 0 ? (
          <Alert severity="info">
            <Typography variant="body2">
              No exports yet. Request one above to get started.
            </Typography>
          </Alert>
        ) : (
          <List>
            {exports.map((exportItem, index) => (
              <React.Fragment key={exportItem.id}>
                {index > 0 && <Divider component="li" />}
                <ListItem
                  sx={{
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: 2,
                    py: 2
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {getStatusIcon(exportItem.status)}
                  </ListItemIcon>

                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                        <Typography variant="body2" fontWeight={600}>
                          {exportItem.format?.toUpperCase()} Export
                        </Typography>
                        <Chip
                          label={exportItem.status}
                          size="small"
                          color={getStatusColor(exportItem.status)}
                        />
                        {exportItem.file_size_mb && (
                          <Chip
                            label={`${exportItem.file_size_mb} MB`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box mt={0.5}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Created: {new Date(exportItem.created_at).toLocaleString()}
                        </Typography>
                        {exportItem.status === 'completed' && exportItem.expires_at && (
                          <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                            <ScheduleIcon fontSize="small" color="warning" />
                            <Typography variant="caption" color="warning.main">
                              {formatTimeRemaining(exportItem.expires_at)}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    }
                  />

                  {exportItem.status === 'completed' && exportItem.file_url && (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<DownloadIcon />}
                      onClick={() => handleDownload(exportItem)}
                      sx={{ minWidth: 120 }}
                    >
                      Download
                    </Button>
                  )}

                  {exportItem.status === 'processing' && (
                    <CircularProgress size={24} />
                  )}

                  {exportItem.status === 'failed' && (
                    <Typography variant="caption" color="error">
                      {exportItem.error_message || 'Failed to generate export'}
                    </Typography>
                  )}
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
      </CardContent>

      <style>{`
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .rotating {
          animation: rotate 1s linear infinite;
        }
      `}</style>
    </Card>
  );
};

export default DataExportSection;
