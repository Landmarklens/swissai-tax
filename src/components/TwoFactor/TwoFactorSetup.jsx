import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Security as SecurityIcon,
  ContentCopy as CopyIcon,
  Download as DownloadIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import twoFactorService from '../../services/twoFactorService';

const steps = ['Scan QR Code', 'Verify Code', 'Save Backup Codes'];

/**
 * Component for setting up 2FA
 * @param {function} onComplete - Callback when setup is complete
 * @param {function} onCancel - Callback when user cancels
 */
const TwoFactorSetup = ({ onComplete, onCancel }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Setup data
  const [secret, setSecret] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);

  // User input
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodesSaved, setBackupCodesSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const initializeSetup = async () => {
      setLoading(true);
      setError('');

      try {
        const result = await twoFactorService.initializeSetup();

        if (!cancelled && result.success) {
          setSecret(result.data.secret);
          setQrCode(result.data.qr_code);
          setBackupCodes(result.data.backup_codes);
        } else if (!cancelled) {
          setError(result.error || 'Failed to initialize 2FA setup');
        }
      } catch (err) {
        if (!cancelled) {
          setError('Failed to initialize 2FA setup. Please try again.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    initializeSetup();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('[2FA Setup] Calling verifyAndEnable with code:', verificationCode);
      const result = await twoFactorService.verifyAndEnable(
        verificationCode,
        secret,
        backupCodes
      );
      console.log('[2FA Setup] Verify result:', result);

      if (result.success) {
        setSuccess('Two-factor authentication enabled successfully!');
        setActiveStep(2); // Move to backup codes step
      } else {
        console.error('[2FA Setup] Verification failed:', result.error);
        setError(result.error || 'Invalid code. Please try again.');
      }
    } catch (err) {
      console.error('[2FA Setup] Verification error:', err);
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopySecret = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setSuccess('Secret key copied to clipboard!');
      const timer = setTimeout(() => setSuccess(''), 3000);
      // Cleanup timeout on unmount (stored in a ref if needed)
      return () => clearTimeout(timer);
    } catch (err) {
      setError('Failed to copy to clipboard');
    }
  };

  const handleDownloadBackupCodes = () => {
    twoFactorService.downloadBackupCodes(backupCodes);
    setBackupCodesSaved(true);
  };

  const handleCopyBackupCodes = async () => {
    const copied = await twoFactorService.copyBackupCodes(backupCodes);
    if (copied) {
      setSuccess('Backup codes copied to clipboard!');
      const timer = setTimeout(() => setSuccess(''), 3000);
      setBackupCodesSaved(true);
      // Cleanup timeout on unmount (stored in a ref if needed)
      return () => clearTimeout(timer);
    } else {
      setError('Failed to copy backup codes');
    }
  };

  const handleComplete = () => {
    if (!backupCodesSaved) {
      setError('Please save your backup codes before continuing');
      return;
    }
    onComplete();
  };

  const handleNext = () => {
    if (activeStep === 0) {
      setActiveStep(1);
    } else if (activeStep === 1) {
      handleVerify();
    }
  };

  const handleBack = () => {
    if (activeStep === 1) {
      setActiveStep(0);
      setVerificationCode('');
      setError('');
    }
  };

  if (loading && !secret) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 800, margin: '0 auto', p: 3 }}>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <SecurityIcon fontSize="large" color="primary" />
        <Typography variant="h5" component="h1">
          Set Up Two-Factor Authentication
        </Typography>
      </Box>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Step 1: Scan QR Code */}
      {activeStep === 0 && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Scan QR Code with Authenticator App
          </Typography>

          <Typography variant="body2" color="text.secondary" paragraph>
            Use an authenticator app like Google Authenticator, Authy, or Microsoft Authenticator
            to scan this QR code.
          </Typography>

          <Box display="flex" justifyContent="center" my={3}>
            {qrCode && (
              <img
                src={qrCode}
                alt="2FA QR Code"
                style={{ maxWidth: '250px', border: '1px solid #ddd', padding: '10px' }}
              />
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="body2" color="text.secondary" gutterBottom>
            Can't scan the QR code? Enter this key manually:
          </Typography>

          <Box display="flex" alignItems="center" gap={1} mt={1}>
            <TextField
              fullWidth
              value={secret}
              InputProps={{ readOnly: true }}
              size="small"
              sx={{ fontFamily: 'monospace' }}
            />
            <Tooltip title="Copy to clipboard">
              <IconButton onClick={handleCopySecret} color="primary">
                <CopyIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Paper>
      )}

      {/* Step 2: Verify Code */}
      {activeStep === 1 && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Verify Your Setup
          </Typography>

          <Typography variant="body2" color="text.secondary" paragraph>
            Enter the 6-digit code from your authenticator app to verify the setup.
          </Typography>

          <TextField
            fullWidth
            label="Authentication Code"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            margin="normal"
            autoFocus
            disabled={loading}
            inputProps={{
              maxLength: 6,
              style: { fontSize: '24px', letterSpacing: '8px', textAlign: 'center' }
            }}
          />
        </Paper>
      )}

      {/* Step 3: Save Backup Codes */}
      {activeStep === 2 && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Save Your Backup Codes
          </Typography>

          <Alert severity="warning" sx={{ mb: 2 }}>
            <strong>Important!</strong> Store these backup codes in a safe place. You can use them to
            access your account if you lose your authenticator device.
          </Alert>

          <Typography variant="body2" color="text.secondary" paragraph>
            Each code can only be used once. You can regenerate new codes from your account settings.
          </Typography>

          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50', my: 2 }}>
            <List dense>
              {backupCodes.map((code, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={code}
                    primaryTypographyProps={{
                      fontFamily: 'monospace',
                      fontSize: '16px',
                      letterSpacing: '2px'
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>

          <Box display="flex" gap={2} justifyContent="center">
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadBackupCodes}
            >
              Download Codes
            </Button>
            <Button
              variant="outlined"
              startIcon={<CopyIcon />}
              onClick={handleCopyBackupCodes}
            >
              Copy to Clipboard
            </Button>
          </Box>

          {backupCodesSaved && (
            <Alert severity="success" icon={<CheckIcon />} sx={{ mt: 2 }}>
              Backup codes saved! You can now complete the setup.
            </Alert>
          )}
        </Paper>
      )}

      {/* Navigation Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button
          onClick={activeStep === 2 ? onCancel : handleBack}
          disabled={loading || activeStep === 0}
        >
          {activeStep === 2 ? 'Cancel' : 'Back'}
        </Button>

        {activeStep < 2 ? (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={loading || (activeStep === 1 && verificationCode.length !== 6)}
            startIcon={loading && <CircularProgress size={20} />}
          >
            {loading ? 'Verifying...' : 'Next'}
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleComplete}
            disabled={!backupCodesSaved}
            color="success"
          >
            Complete Setup
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default TwoFactorSetup;
