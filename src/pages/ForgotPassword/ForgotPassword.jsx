import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormik } from 'formik';
import authService from './../../services/authService';
import { Box, Button, Card, CardContent, FormLabel, Typography, TextField } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { theme } from '../../theme/theme';
import styled from '@emotion/styled';
import SEOHelmet from '../../components/SEO/SEOHelmet';
import { toast, ToastContainer } from 'react-toastify';
import { createPasswordResetRequestSchema } from '../../utils/validation/schemaFactory';

const InputField = styled(TextField)({
  '.MuiFormHelperText-root': {
    marginLeft: '8px'
  }
});

export const ForgotPassword = () => {
  const { t } = useTranslation();

  const [isDone, setIsDone] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Create validation schema with current translations
  const validationSchema = useMemo(() => createPasswordResetRequestSchema(t), [t]);

  const formik = useFormik({
    initialValues: {
      email: ''
    },
    validationSchema,
    onSubmit: async (values) => {
      const { email } = values;
      email && handleResetPasswordClick(email);
    }
  });

  async function handleResetPasswordClick(email) {
    if (hasError) {
      return;
    }
    if (!email) {
      throw new Error('Email is required.');
    }

    try {
      const result = await authService.requestResetPassword(email);
      
      if (result.error) {
        if (!hasError) {
          toast.error(result.error);
          setHasError(true);
        }
      } else {
        setIsDone(true);
      }
    } catch (error) {
      if (!hasError) {
        toast.error(error?.error || error?.message || 'Something went wrong.');
        setHasError(true);
      }
    }
  }

  useEffect(() => {
    if (hasError) {
      setHasError(false);
    }
  }, [formik.values.email]);

  return (
    <>
      <SEOHelmet
        title={t("filing.reset_password_swissai_tax")}
        description="Reset your SwissAI Tax account password"
      />
      <Box
        sx={{
          width: '100%',
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: `linear-gradient(135deg, #ffffff, ${theme.palette.primary.light})`,
          px: 2
        }}>
        <Card
          sx={{
            maxWidth: 400,
            width: '100%',
            boxShadow: 3,
            borderRadius: 2,
            overflow: 'hidden'
          }}>
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
                  {t('Thank You')}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3, textAlign: 'center' }}>
                  {t(
                    'If an account with that email exists, you will receive password reset instructions.'
                  )}
                </Typography>
              </>
            ) : (
              <>
                <Typography
                  variant="h4"
                  gutterBottom
                  sx={{ textAlign: 'center', color: theme.palette.text.primary }}>
                  {t('Forgot Password')}
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3, textAlign: 'center' }}>
                  {t('Enter your email to receive password reset instructions.')}
                </Typography>
                <form onSubmit={formik.handleSubmit}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Box id="email">
                      <FormLabel
                        component="legend"
                        sx={{ color: theme.palette.text.primary, mb: 0.5, ml: 1 }}>
                        {t('Email Address')}
                      </FormLabel>
                      <InputField
                        {...formik.getFieldProps('email')}
                        error={formik.touched.email && Boolean(formik.errors.email)}
                        helperText={formik.touched.email && formik.errors.email}
                        variant="outlined"
                        size="small"
                        fullWidth
                        id="email"
                        name="email"
                        placeholder={t('Enter your Email')}
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
                      {t('Send Reset Link')}
                    </Button>
                  </Box>
                </form>
              </>
            )}
          </CardContent>
        </Card>
      </Box>
      <ToastContainer position="top-right" autoClose={5000} />
    </>
  );
};
