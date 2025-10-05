import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Alert,
  Chip
} from '@mui/material';
import {
  Lock as LockIcon,
  Security as SecurityIcon,
  Delete as DeleteIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const SecuritySection = () => {
  const { t } = useTranslation();
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const handleChangePassword = () => {
    setPasswordDialogOpen(true);
  };

  const handleClosePasswordDialog = () => {
    setPasswordDialogOpen(false);
  };

  const handleSavePassword = () => {
    console.log('Changing password');
    // TODO: Implement password change logic
    setPasswordDialogOpen(false);
  };

  const handleToggle2FA = () => {
    console.log('Toggling 2FA');
    // TODO: Implement 2FA toggle logic
    setTwoFactorEnabled(!twoFactorEnabled);
  };

  const handleDeleteAccount = () => {
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
  };

  const handleConfirmDelete = () => {
    console.log('Deleting account');
    // TODO: Implement account deletion logic
    setDeleteDialogOpen(false);
  };

  return (
    <>
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={600} mb={3}>
            {t('Security Settings')}
          </Typography>

          {/* Password Section */}
          <Box mb={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  {t('Password')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('Last changed 30 days ago')}
                </Typography>
              </Box>
              <Button
                startIcon={<LockIcon />}
                variant="outlined"
                onClick={handleChangePassword}
              >
                {t('Change Password')}
              </Button>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Two-Factor Authentication Section */}
          <Box mb={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Box>
                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {t('Two-Factor Authentication')}
                  </Typography>
                  {twoFactorEnabled && (
                    <Chip
                      icon={<CheckIcon />}
                      label={t('Enabled')}
                      color="success"
                      size="small"
                    />
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {twoFactorEnabled
                    ? t('Your account is protected with 2FA')
                    : t('Add an extra layer of security to your account')}
                </Typography>
              </Box>
              <Button
                startIcon={<SecurityIcon />}
                variant={twoFactorEnabled ? 'outlined' : 'contained'}
                color={twoFactorEnabled ? 'error' : 'primary'}
                onClick={handleToggle2FA}
              >
                {twoFactorEnabled ? t('Disable') : t('Enable')}
              </Button>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Delete Account Section */}
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Box>
                <Typography variant="subtitle1" fontWeight={600} color="error">
                  {t('Delete Account')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('Permanently delete your account and all data')}
                </Typography>
              </Box>
              <Button
                startIcon={<DeleteIcon />}
                variant="outlined"
                color="error"
                onClick={handleDeleteAccount}
              >
                {t('Delete Account')}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Password Change Dialog */}
      <Dialog open={passwordDialogOpen} onClose={handleClosePasswordDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{t('Change Password')}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              fullWidth
              label={t('Current Password')}
              type="password"
              variant="outlined"
            />
            <TextField
              fullWidth
              label={t('New Password')}
              type="password"
              variant="outlined"
            />
            <TextField
              fullWidth
              label={t('Confirm New Password')}
              type="password"
              variant="outlined"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePasswordDialog}>{t('Cancel')}</Button>
          <Button onClick={handleSavePassword} variant="contained">
            {t('Save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog} maxWidth="sm" fullWidth>
        <DialogTitle color="error">{t('Delete Account')}</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            {t('This action cannot be undone')}
          </Alert>
          <DialogContentText>
            {t('Are you sure you want to delete your account? All your tax filings, documents, and personal data will be permanently deleted.')}
          </DialogContentText>
          <TextField
            fullWidth
            label={t('Type DELETE to confirm')}
            variant="outlined"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>{t('Cancel')}</Button>
          <Button onClick={handleConfirmDelete} variant="contained" color="error">
            {t('Delete My Account')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SecuritySection;
