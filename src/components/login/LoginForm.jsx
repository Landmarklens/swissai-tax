import { useState, useEffect } from 'react';
import { Box, TextField, Button, FormLabel, Typography } from '@mui/material';
import { useFormik } from 'formik';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { styled } from '@mui/system';
import { loginSchema } from '../../utils/validation/schemas';

const theme = {
  palette: {
    text: { primary: '#000' },
    primary: { main: '#1976d2' }
  }
};

const InputField = styled(TextField)({
  marginBottom: '20px',
  '.MuiFormHelperText-root': {
    marginLeft: '8px'
  }
});

const LoginForm = ({ onSubmit, hasLoginError, setHasLoginError }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [formInteracted, setFormInteracted] = useState(false);

  useEffect(() => {
    setFormInteracted(false);
  }, [location.pathname]);

  const formik = useFormik({
    initialValues: {
      email: '',
      password: ''
    },
    validateOnMount: false,
    validateOnChange: formInteracted,
    validateOnBlur: formInteracted,
    validationSchema: loginSchema,
    onSubmit: async (values) => {
      onSubmit(values);
    }
  });

  useEffect(() => {
    if (hasLoginError) {
      setHasLoginError(false);
    }
  }, [formik.values.email, formik.values.password]);

  const handleInputInteraction = () => {
    if (!formInteracted) {
      setFormInteracted(true);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={(e) => {
        e.preventDefault();
        setFormInteracted(true);
        formik.handleSubmit(e);
      }}
      noValidate
      sx={{ mt: 1 }}
      onChange={handleInputInteraction}
      onFocus={handleInputInteraction}>
      <FormLabel component="legend" sx={{ color: theme.palette.text.primary, mb: 0.5, ml: 1 }}>
        {t('Email Address')}
      </FormLabel>
      <InputField
        fullWidth
        size="small"
        id="email"
        name="email"
        placeholder={t('Enter your Email')}
        autoComplete="email"
        autoFocus
        {...formik.getFieldProps('email')}
        error={formInteracted && formik.touched.email && Boolean(formik.errors.email)}
        helperText={formInteracted && formik.touched.email && formik.errors.email}
        variant="outlined"
      />

      <FormLabel
        component="legend"
        sx={{
          color: theme.palette.text.primary,
          mb: 0.5,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          ml: 1
        }}>
        {t('Password')}
      </FormLabel>

      <InputField
        fullWidth
        size="small"
        placeholder={t('Enter your Password')}
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        {...formik.getFieldProps('password')}
        error={formInteracted && formik.touched.password && Boolean(formik.errors.password)}
        helperText={formInteracted && formik.touched.password && formik.errors.password}
        variant="outlined"
      />

      <Typography
        onClick={() => navigate('/forgot-password')}
        sx={{
          fontSize: '0.875rem',
          color: theme.palette.primary.main,
          cursor: 'pointer',
          '&:hover': {
            textDecoration: 'underline'
          }
        }}>
        {t('Forgot password?')}
      </Typography>

      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 3, mb: 2, float: 'right', width: 'auto' }}
        disabled={formik.isSubmitting || !formik.isValid}>
        {t('Sign In')}
      </Button>
    </Box>
  );
};

export default LoginForm;
