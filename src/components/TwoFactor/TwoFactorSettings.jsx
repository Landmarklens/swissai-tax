import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Security as SecurityIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import twoFactorService from '../../services/twoFactorService';
import TwoFactorSetup from './TwoFactorSetup';

/**
 * Component for managing 2FA settings
 */
const TwoFactorSettings = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dialog states
  const [showSetup, setShowSetup] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Regenerated codes
  const [newBackupCodes, setNewBackupCodes] = useState(null);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await twoFactorService.getStatus();

      if (result.success) {
        setStatus(result.data);
      } else {
        setError(result.error || 'Failed to load 2FA status');
      }
    } catch (err) {
      setError('Failed to load 2FA status');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setActionLoading(true);
    setError('');

    try {
      const result = await twoFactorService.disable(password);

      if (result.success) {
        setSuccess('Two-factor authentication disabled successfully');
        setShowDisableDialog(false);
        setPassword('');
        loadStatus();
      } else {
        setError(result.error || 'Failed to disable 2FA');
      }
    } catch (err) {
      setError('Failed to disable 2FA');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setActionLoading(true);
    setError('');

    try {
      const result = await twoFactorService.regenerateBackupCodes(password);

      if (result.success) {
        setNewBackupCodes(result.data.backup_codes);
        setSuccess('Backup codes regenerated successfully');
        setPassword('');
        loadStatus();
      } else {
        setError(result.error || 'Failed to regenerate backup codes');
      }
    } catch (err) {
      setError('Failed to regenerate backup codes');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadCodes = () => {
    if (newBackupCodes) {
      twoFactorService.downloadBackupCodes(newBackupCodes);
    }
  };

  const handleCopyCodes = async () => {
    if (newBackupCodes) {
      const copied = await twoFactorService.copyBackupCodes(newBackupCodes);
      if (copied) {
        setSuccess('Backup codes copied to clipboard!');
        setTimeout(() => setSuccess(''), 3000);
      }
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (showSetup) {
    return (
      <TwoFactorSetup
        onComplete={() => {
          setShowSetup(false);
          setSuccess('Two-factor authentication enabled successfully!');
          loadStatus();
        }}
        onCancel={() => setShowSetup(false)}
      />
    );
  }

  return (
    <Box sx={{ maxWidth: 800 }}>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <SecurityIcon fontSize="large" color="primary" />
        <Box>
          <Typography variant="h5" component="h2">
            Two-Factor Authentication
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Add an extra layer of security to your account
          </Typography>
        </Box>
      </Box>

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

      <Paper elevation={2} sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="h6">
              Status
            </Typography>
            {status?.enabled ? (
              <Chip
                icon={<CheckIcon />}
                label="Enabled"
                color="success"
                size="small"
              />
            ) : (
              <Chip
                icon={<WarningIcon />}
                label="Disabled"
                color="warning"
                size="small"
              />
            )}
          </Box>

          {!status?.enabled ? (
            <Button
              variant="contained"
              startIcon={<SecurityIcon />}
              onClick={() => setShowSetup(true)}
            >
              Enable 2FA
            </Button>
          ) : (
            <Button
              variant="outlined"
              color="error"
              onClick={() => setShowDisableDialog(true)}
            >
              Disable 2FA
            </Button>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {status?.enabled && (
          <>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Two-factor authentication is currently enabled for your account.
            </Typography>

            {status.verified_at && (
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                Enabled on: {new Date(status.verified_at).toLocaleString()}
              </Typography>
            )}

            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Backup Codes
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                You have {status.backup_codes_remaining || 0} backup codes remaining.
              </Typography>

              {status.backup_codes_remaining < 3 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  You're running low on backup codes. Consider regenerating new ones.
                </Alert>
              )}

              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => setShowRegenerateDialog(true)}
              >
                Regenerate Backup Codes
              </Button>
            </Box>
          </>
        )}

        {!status?.enabled && (
          <>
            <Typography variant="body2" color="text.secondary" paragraph>
              Two-factor authentication adds an extra layer of security by requiring a code from
              your authenticator app in addition to your password when logging in.
            </Typography>

            <Typography variant="body2" color="text.secondary">
              We recommend using apps like:
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="• Google Authenticator" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Microsoft Authenticator" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Authy" />
              </ListItem>
            </List>
          </>
        )}
      </Paper>

      {/* Disable 2FA Dialog */}
      <Dialog open={showDisableDialog} onClose={() => !actionLoading && setShowDisableDialog(false)}>
        <DialogTitle>Disable Two-Factor Authentication?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" paragraph>
            This will make your account less secure. Enter your password to confirm.
          </Typography>

          <TextField
            fullWidth
            type="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            disabled={actionLoading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDisableDialog(false)} disabled={actionLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleDisable}
            color="error"
            variant="contained"
            disabled={actionLoading || !password}
            startIcon={actionLoading && <CircularProgress size={20} />}
          >
            {actionLoading ? 'Disabling...' : 'Disable 2FA'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Regenerate Backup Codes Dialog */}
      <Dialog
        open={showRegenerateDialog}
        onClose={() => !actionLoading && !newBackupCodes && setShowRegenerateDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Regenerate Backup Codes</DialogTitle>
        <DialogContent>
          {!newBackupCodes ? (
            <>
              <Alert severity="warning" sx={{ mb: 2 }}>
                This will invalidate all existing backup codes. Enter your password to confirm.
              </Alert>

              <TextField
                fullWidth
                type="password"
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                disabled={actionLoading}
              />
            </>
          ) : (
            <>
              <Alert severity="success" sx={{ mb: 2 }}>
                New backup codes generated! Save them in a secure location.
              </Alert>

              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50', my: 2 }}>
                <List dense>
                  {newBackupCodes.map((code, index) => (
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
                <Button variant="outlined" onClick={handleDownloadCodes}>
                  Download
                </Button>
                <Button variant="outlined" onClick={handleCopyCodes}>
                  Copy
                </Button>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          {!newBackupCodes ? (
            <>
              <Button onClick={() => setShowRegenerateDialog(false)} disabled={actionLoading}>
                Cancel
              </Button>
              <Button
                onClick={handleRegenerate}
                variant="contained"
                disabled={actionLoading || !password}
                startIcon={actionLoading && <CircularProgress size={20} />}
              >
                {actionLoading ? 'Generating...' : 'Regenerate'}
              </Button>
            </>
          ) : (
            <Button
              onClick={() => {
                setShowRegenerateDialog(false);
                setNewBackupCodes(null);
                setPassword('');
              }}
              variant="contained"
            >
              Done
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TwoFactorSettings;
