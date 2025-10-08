import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Alert,
  AlertTitle,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  DeleteForever as DeleteIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import userService from '../../../services/userService';
import DeletionVerificationDialog from './DeletionVerificationDialog';
import DeletionGracePeriodBanner from './DeletionGracePeriodBanner';

const AccountDeletionSection = () => {
  const { t } = useTranslation();
  const [deletionStatus, setDeletionStatus] = useState(null);
  const [showWarning, setShowWarning] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch deletion status on mount
  useEffect(() => {
    fetchDeletionStatus();
  }, []);

  const fetchDeletionStatus = async () => {
    const result = await userService.getDeletionStatus();
    if (result.success) {
      setDeletionStatus(result.data);
    }
  };

  const handleRequestDeletion = () => {
    setShowWarning(true);
    setError('');
    setSuccess('');
  };

  const handleConfirmWarning = async () => {
    setShowWarning(false);
    setLoading(true);
    setError('');

    const result = await userService.requestAccountDeletion();
    setLoading(false);

    if (result.success) {
      setShowVerification(true);
      setSuccess('Verification code sent to your email');
    } else {
      setError(result.error);
    }
  };

  const handleVerifyCode = async (code) => {
    setLoading(true);
    setError('');

    const result = await userService.verifyAccountDeletion(code);
    setLoading(false);

    if (result.success) {
      setShowVerification(false);
      setSuccess('Account deletion scheduled successfully!');
      // Refresh status to show grace period banner
      await fetchDeletionStatus();
    } else {
      setError(result.error);
    }
  };

  const handleCancelDeletion = async () => {
    if (!deletionStatus?.verification_token) return;

    setLoading(true);
    setError('');

    const result = await userService.cancelAccountDeletion(deletionStatus.verification_token);
    setLoading(false);

    if (result.success) {
      setSuccess('Account deletion cancelled successfully');
      setDeletionStatus(null);
    } else {
      setError(result.error);
    }
  };

  return (
    <>
      {/* Grace Period Banner */}
      {deletionStatus && deletionStatus.status === 'verified' && (
        <DeletionGracePeriodBanner
          deletionStatus={deletionStatus}
          onCancel={handleCancelDeletion}
          loading={loading}
        />
      )}

      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={3}>
            <DeleteIcon sx={{ color: '#DC0018' }} />
            <Typography variant="h6" fontWeight={600}>
              {t('Delete Account')}
            </Typography>
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

          <Alert severity="error" sx={{ mb: 3 }}>
            <AlertTitle fontWeight={600}>
              {t('Permanently Delete Your Account')}
            </AlertTitle>
            <Typography variant="body2">
              {t('Once you delete your account, there is no going back. Please be certain.')}
            </Typography>
          </Alert>

          <Typography variant="body2" color="text.secondary" mb={3}>
            {t('Deleting your account will')}:
          </Typography>

          <List dense>
            <ListItem>
              <ListItemIcon>
                <WarningIcon color="error" fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={t('Permanently delete all your tax filings and documents')}
                primaryTypographyProps={{ variant: 'body2' }}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <WarningIcon color="error" fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={t('Cancel any active subscriptions')}
                primaryTypographyProps={{ variant: 'body2' }}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <WarningIcon color="error" fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={t('Delete all your personal information and settings')}
                primaryTypographyProps={{ variant: 'body2' }}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckIcon color="success" fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={t('7-day grace period to cancel the deletion')}
                primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
              />
            </ListItem>
          </List>

          <Divider sx={{ my: 3 }} />

          {!deletionStatus || !deletionStatus.has_pending_deletion || deletionStatus.status === 'cancelled' ? (
            <Button
              variant="contained"
              color="error"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
              onClick={handleRequestDeletion}
              disabled={loading}
              fullWidth
            >
              {loading ? t('Processing...') : t('Delete My Account')}
            </Button>
          ) : deletionStatus.status === 'pending' ? (
            <Alert severity="info">
              <AlertTitle>Verification Pending</AlertTitle>
              Please check your email for the verification code. The code expires in 15 minutes.
            </Alert>
          ) : null}
        </CardContent>
      </Card>

      {/* Warning Dialog */}
      <Dialog
        open={showWarning}
        onClose={() => setShowWarning(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <WarningIcon color="error" fontSize="large" />
            <Typography variant="h6" fontWeight={600}>
              Are you absolutely sure?
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            <AlertTitle fontWeight={600}>This action cannot be undone</AlertTitle>
          </Alert>

          <Typography variant="body1" gutterBottom>
            This will permanently delete your account and all associated data after a 7-day grace period.
          </Typography>

          <Typography variant="body2" color="text.secondary" mt={2}>
            To confirm, we'll send a verification code to your email address.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setShowWarning(false)}
            startIcon={<CloseIcon />}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmWarning}
            startIcon={<DeleteIcon />}
          >
            Yes, Send Verification Code
          </Button>
        </DialogActions>
      </Dialog>

      {/* Verification Dialog */}
      <DeletionVerificationDialog
        open={showVerification}
        onClose={() => setShowVerification(false)}
        onVerify={handleVerifyCode}
        loading={loading}
        error={error}
      />
    </>
  );
};

export default AccountDeletionSection;
