import React, { useState } from 'react';
import * as Yup from 'yup';

import { useTranslation } from 'react-i18next';
import { useFormik } from 'formik';

import authService from './../../services/authService';

import { Box, Button, Card, CardContent, FormLabel, Typography } from '@mui/material';

import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { theme } from '../../theme/theme';
import { PasswordField } from '../../components/passwordField';
import { useTokenFromQuery } from './../../hooks/useTokenFromQuery';
import { toast, ToastContainer } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import SEOHelmet from '../../components/SEO/SEOHelmet';

const emptySpaceValidation = Yup.string().trim('Empty space is not valid').strict(true); // Enforce the trim validation strictly

const initialValues = {
  password: '',
  confirmPassword: ''
};

export const ResetPassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [isDone, setIsDone] = useState(false);

  const token = useTokenFromQuery();

  const formik = useFormik({
    initialValues,
    validationSchema: Yup.object({
      password: emptySpaceValidation
        .min(8, t('Must be at least 8 characters'))
        .required(t('Required')),
      confirmPassword: emptySpaceValidation
        .min(8, t('Must be at least 8 characters'))
        .oneOf([Yup.ref('password'), null], t('Passwords must match'))
        .required(t('Required'))
    }),

    onSubmit: async (values) => {
      const { password } = values;

      if (token && password) {
        await handleResetPasswordClick(token, password);
      } else {
        toast.error(t('Invalid token or password.'));
      }
    }
  });

  async function handleResetPasswordClick(token, password) {
    try {
      const result = await authService.confirmResetPassword({
        token,
        new_password: password
      });
      
      if (result.error) {
        toast.error(result.error);
      } else {
        setIsDone(true);
      }
    } catch (error) {
      toast.error(t('Failed to reset password. The link may have expired.'));
    }
  }

  if (!token) {
    return (
      <Box
        sx={{
          width: '100%',
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: `linear-gradient(135deg, white, ${theme.palette.primary.light})`,
          px: 2
        }}>
        <Card sx={{ maxWidth: 400, width: '100%', boxShadow: 3, borderRadius: 2 }}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h5" sx={{ color: theme.palette.text.primary, mb: 2 }}>
              {t('Invalid or Expired Link')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('The password reset link is invalid or has expired. Please request a new one.')}
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <>
      <SEOHelmet
        title="Reset Password - HomeAI"
        description="Create a new password for your HomeAI account"
      />
      <Box
        sx={{
          width: '100%',
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: `linear-gradient(135deg, white, ${theme.palette.primary.light})`,
          px: 2
        }}>
        <Card sx={{ maxWidth: 400, width: '100%', boxShadow: 3, borderRadius: 2 }}>
          <CardContent sx={{ p: 4 }}>
            {isDone ? (
              <>
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <CheckCircleOutlineIcon
                    sx={{ fontSize: 60, color: theme.palette.success.main }}
                  />
                </Box>
                <Typography
                  variant="h4"
                  gutterBottom
                  sx={{ textAlign: 'center', color: theme.palette.text.primary }}>
                  {t('Password Reset Successful')}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3, textAlign: 'center' }}>
                  {t('Your password has been updated. You can now log in.')}
                </Typography>
                <Button
                  variant="contained"
                  fullWidth
                  sx={{
                    py: 1.5,
                    boxShadow: 2,
                    textTransform: 'none',
                    fontSize: '1rem',
                    '&:hover': { boxShadow: 4 }
                  }}
                  onClick={() => {
                    navigate('/?passwordChanged=true', { replace: true });
                  }}>
                  {t('Go to Login')}
                </Button>
              </>
            ) : (
              <>
                <Typography
                  variant="h4"
                  gutterBottom
                  sx={{ textAlign: 'center', color: theme.palette.text.primary }}>
                  {t('Reset Password')}
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3, textAlign: 'center' }}>
                  {t('Set up a new password.')}
                </Typography>

                <form onSubmit={formik.handleSubmit}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Box id="newPassword">
                      <FormLabel
                        htmlFor="password"
                        sx={{ color: theme.palette.text.primary, mb: 1 }}>
                        {t('New Password')}
                      </FormLabel>

                      <PasswordField
                        id="password"
                        name="password"
                        {...formik.getFieldProps('password')}
                        error={formik.touched.password && Boolean(formik.errors.password)}
                        helperText={formik.touched.password && formik.errors.password}
                        sx={{ mb: 0 }}
                      />
                    </Box>

                    <Box id="confirmNewPassword">
                      <FormLabel
                        htmlFor="confirmPassword"
                        sx={{ color: theme.palette.text.primary, mb: 1 }}>
                        {t('Confirm New Password')}
                      </FormLabel>

                      <PasswordField
                        id="confirmPassword"
                        name="confirmPassword"
                        placeholder={t('Confirm your Password')}
                        {...formik.getFieldProps('confirmPassword')}
                        error={
                          formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)
                        }
                        helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
                      />
                    </Box>

                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      sx={{
                        py: 1.5,
                        boxShadow: 2,
                        textTransform: 'none',
                        fontSize: '1rem',
                        '&:hover': { boxShadow: 4 }
                      }}
                      disabled={!formik.isValid || formik.isSubmitting}>
                      {t('Reset Password')}
                    </Button>
                  </Box>
                </form>
              </>
            )}
          </CardContent>
        </Card>
        <ToastContainer position="top-right" autoClose={5000} />
      </Box>
    </>
  );
};
