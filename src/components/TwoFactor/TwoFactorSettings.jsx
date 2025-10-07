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
      console.log('[2FA Settings] Status result:', result);

      if (result.success) {
        console.log('[2FA Settings] Status data:', result.data);
        setStatus(result.data);
      } else {
        setError(result.error || 'Failed to load 2FA status');
      }
    } catch (err) {
      console.error('[2FA Settings] Load status error:', err);
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
        onComplete={async () => {
          setShowSetup(false);
          setSuccess('Two-factor authentication enabled successfully!');
          // Small delay to ensure backend has processed
          await new Promise(resolve => setTimeout(resolve, 500));
          await loadStatus();
        }}
        onCancel={() => setShowSetup(false)}
      />
    );
  }

  return (
    <Box>
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

      <Box mb={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Box>
            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
              <Typography variant="subtitle1" fontWeight={600}>
                Two-Factor Authentication
              </Typography>
              {status?.enabled && (
                <Chip
                  icon={<CheckIcon />}
                  label="Enabled"
                  color="success"
                  size="small"
                />
              )}
            </Box>
            <Typography variant="body2" color="text.secondary">
              {status?.enabled
                ? 'Your account is protected with 2FA'
                : 'Add an extra layer of security to your account'}
            </Typography>
          </Box>
          {!status?.enabled ? (
            <Button
              startIcon={<SecurityIcon />}
              variant="contained"
              onClick={() => setShowSetup(true)}
            >
              Enable
            </Button>
          ) : (
            <Button
              variant="outlined"
              color="error"
              onClick={() => setShowDisableDialog(true)}
            >
              Disable
            </Button>
          )}
        </Box>
      </Box>

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
