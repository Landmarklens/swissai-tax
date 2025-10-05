import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  LinearProgress,
  Chip
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const FilingStatusCard = ({ filing, onContinue, onStartNew }) => {
  const { t } = useTranslation();

  if (!filing || filing.status === 'not_started') {
    return (
      <Card
        sx={{
          height: '100%',
          background: 'linear-gradient(135deg, #FFFFFF 0%, #FFE5E8 100%)',
          border: '2px dashed #DC0018'
        }}
      >
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="h5" gutterBottom fontWeight={600}>
            {t('Start Your 2024 Tax Filing')}
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            {t('Begin your Swiss tax declaration in just a few simple steps')}
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={onStartNew}
            sx={{ mt: 2 }}
          >
            {t('Start Filing Now')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'in_progress':
        return 'warning';
      case 'completed':
        return 'info';
      case 'filed':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'in_progress':
        return t('In Progress');
      case 'completed':
        return t('Ready to Submit');
      case 'filed':
        return t('Filed');
      default:
        return status;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5" fontWeight={600}>
            {filing.taxYear} {t('Tax Filing')}
          </Typography>
          <Chip
            label={getStatusLabel(filing.status)}
            color={getStatusColor(filing.status)}
            size="small"
          />
        </Box>

        {/* Progress Section */}
        <Box mb={3}>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="body2" color="text.secondary">
              {t('Progress')}
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {filing.progress}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={filing.progress}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: '#E0E0E0',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                backgroundColor: '#DC0018'
              }
            }}
          />
        </Box>

        {/* Info Grid */}
        <Box mb={3}>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="body2" color="text.secondary">
              {t('Last Saved')}:
            </Typography>
            <Typography variant="body2">
              {formatDate(filing.lastSaved)}
            </Typography>
          </Box>
          {filing.estimatedRefund && (
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                {t('Estimated Refund')}:
              </Typography>
              <Typography variant="body2" fontWeight={600} color="success.main">
                CHF {filing.estimatedRefund}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Action Button */}
        <Button
          variant="contained"
          fullWidth
          size="large"
          startIcon={<PlayArrowIcon />}
          onClick={onContinue}
        >
          {t('Continue Filing')}
        </Button>
      </CardContent>
    </Card>
  );
};

export default FilingStatusCard;
