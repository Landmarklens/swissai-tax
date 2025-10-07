import React, { useState, useMemo } from 'react';
import { useFormik } from 'formik';
import { useTranslation } from 'react-i18next';
import { styled } from '@mui/system';
import { Box, TextField, Button, FormLabel, Typography } from '@mui/material';
import { PasswordField } from '../passwordField';
import { LanguageSelect } from '../LanguageSelect/LanguageSelect';
import { createRegistrationSchema } from '../../utils/validation/schemaFactory';
import { theme } from '../../theme/theme';

const InputField = styled(TextField)({
  marginBottom: '20px',
  '.MuiFormHelperText-root': {
    marginLeft: '8px'
  }
});

const SignupForm = ({ onBack, onSubmit }) => {
  const { t, i18n } = useTranslation();

  const changeLocalLanguage = (language) => {
    i18n.changeLanguage(language);
    localStorage.setItem('i18nextLng', language);
  };

  // Create validation schema with current translations
  const validationSchema = useMemo(() => createRegistrationSchema(t), [t]);

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      acceptTerms: false,
      user_type: 'tenant', // Default for tax app
      status: 'active',
      language: 'en'
    },
    validationSchema,
    onSubmit: async (values) => {
      const { confirmPassword, acceptTerms, firstName, lastName, ...rest } = values;
      // Map firstName/lastName to firstname/lastname for backend compatibility
      const dataToSend = {
        ...rest,
        firstname: firstName,
        lastname: lastName
      };
      onSubmit(dataToSend);
      changeLocalLanguage(dataToSend.language);
    }
  });

  const labelSx = {
    color: theme.palette.text.primary,
    mb: 0.5,
    ml: 1
  };

  return (
    <Box component="form" onSubmit={formik.handleSubmit} noValidate sx={{ mt: 1, pb: 10 }}>
      <FormLabel component="legend" sx={labelSx}>
        {t('Email Address')}
      </FormLabel>
      <InputField
        size="small"
        fullWidth
        id="email"
        name="email"
        placeholder={t('Enter your Email')}
        {...formik.getFieldProps('email')}
        error={formik.touched.email && Boolean(formik.errors.email)}
        helperText={formik.touched.email && formik.errors.email}
        variant="outlined"
      />

      <FormLabel component="legend" sx={labelSx}>
        {t('Password')}
      </FormLabel>
      <PasswordField
        {...formik.getFieldProps('password')}
        error={formik.touched.password && Boolean(formik.errors.password)}
        helperText={formik.touched.password && formik.errors.password}
      />

      <FormLabel component="legend" sx={labelSx}>
        {t('Confirm Password')}
      </FormLabel>
      <PasswordField
        placeholder={t('Confirm your Password')}
        {...formik.getFieldProps('confirmPassword')}
        error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
        helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
      />

      <FormLabel component="legend" sx={labelSx}>
        {t('First Name')}
      </FormLabel>
      <InputField
        size="small"
        fullWidth
        name="firstName"
        placeholder={t('Enter your First Name')}
        {...formik.getFieldProps('firstName')}
        error={formik.touched.firstName && Boolean(formik.errors.firstName)}
        helperText={formik.touched.firstName && formik.errors.firstName}
        variant="outlined"
      />

      <FormLabel component="legend" sx={labelSx}>
        {t('Last Name')}
      </FormLabel>
      <InputField
        size="small"
        fullWidth
        name="lastName"
        placeholder={t('Enter your Last Name')}
        {...formik.getFieldProps('lastName')}
        error={formik.touched.lastName && Boolean(formik.errors.lastName)}
        helperText={formik.touched.lastName && formik.errors.lastName}
        variant="outlined"
      />

      {/* <FormControl fullWidth sx={{ mb: 2 }}>
        <FormLabel component="legend" sx={labelSx}>
          {t('User Type')}
        </FormLabel>
        <Select
          size="small"
          {...formik.getFieldProps('user_type')}
          error={formik.touched.user_type && Boolean(formik.errors.user_type)}>
          <MenuItem value="tenant">{t('Tenant')}</MenuItem>
          <MenuItem value="landlord">{t('Owner')}</MenuItem>
        </Select>
      </FormControl> */}

      {/* <FormControl fullWidth sx={{ mb: 2 }}>
        <FormLabel component="legend" sx={labelSx}>
          {t('Language')}
        </FormLabel>
        <Select
          onChange={(event) => {
            changeLanguage(event);
            formik.setFieldValue('language', event.target.value);
          }}
          value={formik.values.language}
          size="small"
          error={formik.touched.language && Boolean(formik.errors.language)}>
          <MenuItem value="de">{t('German')}</MenuItem>
          <MenuItem value="en">{t('English')}</MenuItem>
          <MenuItem value="fr">{t('French')}</MenuItem>
          <MenuItem value="it">{t('Italian')}</MenuItem>
        </Select>
      </FormControl> */}

      <LanguageSelect formik={formik} />

      <Button
        type="submit"
        variant="contained"
        sx={{ mt: 3, mb: 2, float: 'right', width: 'auto' }}
        disabled={!formik.isValid || formik.isSubmitting}>
        {t('Sign Up')}
      </Button>
    </Box>
  );
};

export default SignupForm;
