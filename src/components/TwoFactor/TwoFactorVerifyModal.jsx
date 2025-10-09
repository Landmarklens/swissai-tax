import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Link
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import twoFactorService from '../../services/twoFactorService';
import { useTranslation } from 'react-i18next';

/**
 * Modal for verifying 2FA code during login
 * @param {boolean} open - Whether modal is open
 * @param {function} onClose - Close handler
 * @param {string} tempToken - Temporary token from login
 * @param {function} onSuccess - Success callback with user data
 */
const TwoFactorVerifyModal = ({ open, onClose, tempToken, onSuccess }) => {
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);

  const handleVerify = async () => {
    if (!code || code.trim().length === 0) {
      setError('Please enter a code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await twoFactorService.verifyLogin(tempToken, code);

      if (result.success) {
        // Call success callback with user data
        onSuccess(result.data);
      } else {
        setError(result.error || 'Invalid code. Please try again.');
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleVerify();
    }
  };

  const handleClose = () => {
    if (!loading) {
      setCode('');
      setError('');
      setUseBackupCode(false);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={loading}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <SecurityIcon color="primary" />
          <Typography variant="h6">
            Two-Factor Authentication
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {!useBackupCode ? (
            <>
              <Typography variant="body1" gutterBottom>
                Enter the 6-digit code from your authenticator app to complete login.
              </Typography>

              <TextField
                fullWidth
                label={t("filing.authentication_code")}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyPress={handleKeyPress}
                placeholder="123456"
                margin="normal"
                autoFocus
                disabled={loading}
                inputProps={{
                  maxLength: 6,
                  style: { fontSize: '24px', letterSpacing: '8px', textAlign: 'center' }
                }}
              />

              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Link
                  component="button"
                  variant="body2"
                  onClick={() => {
                    setUseBackupCode(true);
                    setCode('');
                    setError('');
                  }}
                  disabled={loading}
                  sx={{ cursor: 'pointer' }}
                >
                  Use a backup code instead
                </Link>
              </Box>
            </>
          ) : (
            <>
              <Typography variant="body1" gutterBottom>
                Enter one of your backup codes. Each code can only be used once.
              </Typography>

              <TextField
                fullWidth
                label={t("filing.backup_code")}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 9))}
                onKeyPress={handleKeyPress}
                placeholder={t("filing.xxxxxxxx")}
                margin="normal"
                autoFocus
                disabled={loading}
                inputProps={{
                  style: { fontSize: '20px', letterSpacing: '4px', textAlign: 'center' }
                }}
              />

              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Link
                  component="button"
                  variant="body2"
                  onClick={() => {
                    setUseBackupCode(false);
                    setCode('');
                    setError('');
                  }}
                  disabled={loading}
                  sx={{ cursor: 'pointer' }}
                >
                  Use authenticator app code instead
                </Link>
              </Box>
            </>
          )}

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              <strong>{t('filing.lost_access_to_your_authenticator')}</strong><br />
              Use a backup code to log in, then regenerate new codes from your settings.
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={handleClose}
          disabled={loading}
          color="inherit"
        >
          Cancel
        </Button>
        <Button
          onClick={handleVerify}
          variant="contained"
          disabled={loading || !code}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {loading ? 'Verifying...' : 'Verify'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TwoFactorVerifyModal;
