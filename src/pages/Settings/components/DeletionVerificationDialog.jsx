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
  CircularProgress
} from '@mui/material';
import {
  Security as SecurityIcon,
  Close as CloseIcon
} from '@mui/icons-material';

const DeletionVerificationDialog = ({ open, onClose, onVerify, loading, error }) => {
  const [code, setCode] = useState('');
  const [localError, setLocalError] = useState('');

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only digits
    if (value.length <= 6) {
      setCode(value);
      setLocalError('');
    }
  };

  const handleSubmit = () => {
    if (code.length !== 6) {
      setLocalError('Please enter a 6-digit code');
      return;
    }
    onVerify(code);
  };

  const handleClose = () => {
    setCode('');
    setLocalError('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <SecurityIcon color="primary" />
          <Typography variant="h6" fontWeight={600}>
            Verify Account Deletion
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box py={2}>
          <Typography variant="body1" color="text.secondary" mb={3}>
            We've sent a 6-digit verification code to your email. Please enter it below to confirm account deletion.
          </Typography>

          <TextField
            fullWidth
            label="Verification Code"
            value={code}
            onChange={handleCodeChange}
            placeholder="000000"
            autoFocus
            inputProps={{
              maxLength: 6,
              style: {
                fontSize: '24px',
                letterSpacing: '8px',
                textAlign: 'center',
                fontFamily: 'monospace'
              }
            }}
            error={Boolean(localError || error)}
            helperText={localError || error || 'Enter the 6-digit code from your email'}
            disabled={loading}
          />

          <Alert severity="warning" sx={{ mt: 3 }}>
            <Typography variant="body2" fontWeight={600} gutterBottom>
              This action will schedule your account for deletion
            </Typography>
            <Typography variant="body2">
              Your account will be permanently deleted after a 7-day grace period. You can cancel the deletion during this time.
            </Typography>
          </Alert>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={handleClose}
          disabled={loading}
          startIcon={<CloseIcon />}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || code.length !== 6}
          startIcon={loading ? <CircularProgress size={20} /> : <SecurityIcon />}
        >
          {loading ? 'Verifying...' : 'Verify & Schedule Deletion'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeletionVerificationDialog;
