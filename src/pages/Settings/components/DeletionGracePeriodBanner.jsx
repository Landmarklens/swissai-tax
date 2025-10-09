import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Typography,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  Warning as WarningIcon,
  Cancel as CancelIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';

const DeletionGracePeriodBanner = ({ deletionStatus, onCancel, loading }) => {
  const { t } = useTranslation();
  const [timeRemaining, setTimeRemaining] = useState(null);

  useEffect(() => {
    if (!deletionStatus?.scheduled_deletion_at) return;

    const calculateTimeRemaining = () => {
      const scheduledDate = new Date(deletionStatus.scheduled_deletion_at);
      const now = new Date();
      const diff = scheduledDate - now;

      if (diff <= 0) {
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          total: 0
        };
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      return {
        days,
        hours,
        minutes,
        total: diff
      };
    };

    // Update immediately
    setTimeRemaining(calculateTimeRemaining());

    // Update every minute
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining());
    }, 60000);

    return () => clearInterval(interval);
  }, [deletionStatus]);

  if (!deletionStatus || deletionStatus.status !== 'verified') {
    return null;
  }

  const getProgressValue = () => {
    if (!timeRemaining) return 0;
    const gracePeriodMs = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
    const elapsed = gracePeriodMs - timeRemaining.total;
    return (elapsed / gracePeriodMs) * 100;
  };

  return (
    <Alert
      severity="warning"
      icon={<WarningIcon fontSize="large" />}
      sx={{
        mb: 3,
        '& .MuiAlert-message': {
          width: '100%'
        }
      }}
    >
      <AlertTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Typography variant="h6" component="span" fontWeight={700}>
          Account Deletion Scheduled
        </Typography>
        <Chip
          icon={<TimeIcon />}
          label={
            timeRemaining
              ? `${timeRemaining.days}d ${timeRemaining.hours}h ${timeRemaining.minutes}m remaining`
              : 'Calculating...'
          }
          color="warning"
          size="small"
        />
      </AlertTitle>

      <Box mb={2}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Your account is scheduled for permanent deletion on{' '}
          <strong>
            {new Date(deletionStatus.scheduled_deletion_at).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </strong>
        </Typography>

        <LinearProgress
          variant="determinate"
          value={getProgressValue()}
          sx={{
            mt: 2,
            mb: 1,
            height: 8,
            borderRadius: 4,
            backgroundColor: 'rgba(255, 152, 0, 0.2)',
            '& .MuiLinearProgress-bar': {
              backgroundColor: '#ff9800'
            }
          }}
        />
      </Box>

      <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={2}>
        <Button
          variant="contained"
          color="error"
          startIcon={<CancelIcon />}
          onClick={onCancel}
          disabled={loading}
          fullWidth
          sx={{ maxWidth: { sm: 200 } }}
        >
          {loading ? 'Cancelling...' : 'Cancel Deletion'}
        </Button>

        <Box display="flex" flexDirection="column" justifyContent="center">
          <Typography variant="caption" color="text.secondary">
            You can cancel the deletion anytime during the grace period.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            All your data will be permanently deleted after the grace period ends.
          </Typography>
        </Box>
      </Box>
    </Alert>
  );
};

export default DeletionGracePeriodBanner;
