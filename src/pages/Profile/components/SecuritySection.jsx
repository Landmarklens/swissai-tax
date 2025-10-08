import React, { useState, useMemo } from 'react';
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
  Alert
} from '@mui/material';
import {
  Lock as LockIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useFormik } from 'formik';
import { createPasswordChangeSchema } from '../../../utils/validation/schemaFactory';
import { TwoFactorSettings } from '../../../components/TwoFactor';

const SecuritySection = () => {
  const { t } = useTranslation();
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  // Create validation schema with current translations
  const validationSchema = useMemo(() => createPasswordChangeSchema(t), [t]);

  const passwordFormik = useFormik({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    },
    validationSchema,
    onSubmit: async (values) => {
      // TODO: Implement password change logic with API call
      console.log('Password change:', values);
      setPasswordDialogOpen(false);
      passwordFormik.resetForm();
    }
  });

  const handleChangePassword = () => {
    setPasswordDialogOpen(true);
  };

  const handleClosePasswordDialog = () => {
    setPasswordDialogOpen(false);
    passwordFormik.resetForm();
  };

  const handleSavePassword = () => {
    passwordFormik.handleSubmit();
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
          <TwoFactorSettings />
        </CardContent>
      </Card>

      {/* Password Change Dialog */}
      <Dialog open={passwordDialogOpen} onClose={handleClosePasswordDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{t('Change Password')}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={passwordFormik.handleSubmit} display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              fullWidth
              label={t('Current Password')}
              type="password"
              variant="outlined"
              {...passwordFormik.getFieldProps('currentPassword')}
              error={passwordFormik.touched.currentPassword && Boolean(passwordFormik.errors.currentPassword)}
              helperText={passwordFormik.touched.currentPassword && passwordFormik.errors.currentPassword}
            />
            <TextField
              fullWidth
              label={t('New Password')}
              type="password"
              variant="outlined"
              {...passwordFormik.getFieldProps('newPassword')}
              error={passwordFormik.touched.newPassword && Boolean(passwordFormik.errors.newPassword)}
              helperText={passwordFormik.touched.newPassword && passwordFormik.errors.newPassword}
            />
            <TextField
              fullWidth
              label={t('Confirm New Password')}
              type="password"
              variant="outlined"
              {...passwordFormik.getFieldProps('confirmPassword')}
              error={passwordFormik.touched.confirmPassword && Boolean(passwordFormik.errors.confirmPassword)}
              helperText={passwordFormik.touched.confirmPassword && passwordFormik.errors.confirmPassword}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePasswordDialog}>{t('Cancel')}</Button>
          <Button
            onClick={handleSavePassword}
            variant="contained"
            disabled={!passwordFormik.isValid || passwordFormik.isSubmitting}
          >
            {t('Save')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SecuritySection;
