import React, { useState } from 'react';
import * as Yup from 'yup';

import { useFormik } from 'formik';
import { useTranslation } from 'react-i18next';

import { theme } from '../../theme/theme';

import { styled } from '@mui/system';

import { Box, TextField, Button, FormLabel, Select, MenuItem, FormControl, Typography, Alert } from '@mui/material';
import { PasswordField } from '../passwordField';
import { LanguageSelect } from '../LanguageSelect/LanguageSelect';

const InputField = styled(TextField)({
  marginBottom: '20px',
  '.MuiFormHelperText-root': {
    marginLeft: '8px'
  }
});

const SignupForm = ({ onBack, onSubmit, userType, onUserTypeChange }) => {
  const { t, i18n } = useTranslation();

  const changeLocalLanguage = (language) => {
    i18n.changeLanguage(language);
    localStorage.setItem('i18nextLng', language);
  };

  const emptySpaceValidation = Yup.string().trim('Empty space is not valid').strict(true);

  const nameValidation = emptySpaceValidation
    .min(2, 'Name must be at least 2 characters long') // Minimum length requirement
    .max(30, 'Name cannot be more than 30 characters') // Maximum length requirement
    .matches(
      /^[a-zA-Z\s'-]*$/,
      'Name can only contain letters, spaces, hyphens, and apostrophes'
    ) // Name pattern validation - only letters and common name characters
    .required(t('Required'));

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
      confirmPassword: '',
      firstname: '',
      lastname: '',
      user_type: 'tenant',
      status: 'active',
      language: 'en'
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email(t('Invalid email address'))
        .test(
          'has-tld',
          t('Invalid email address'),
          (value) => !!value && /\.[a-zA-Z]{2,}$/.test(value)
        )
        .required(t('Required')),

      password: emptySpaceValidation
        .min(8, t('Must be at least 8 characters'))
        .required(t('Required')),
      confirmPassword: emptySpaceValidation
        .min(8, t('Must be at least 8 characters'))
        .oneOf([Yup.ref('password'), null], t('Passwords must match'))
        .required(t('Required')),
      firstname: nameValidation,
      lastname: nameValidation,
      user_type: Yup.string().oneOf(['tenant', 'landlord']).required(t('Required')),
      language: Yup.string().oneOf(['de', 'en', 'fr', 'it']).required(t('Required'))
    }),
    onSubmit: async (values) => {
      const { confirmPassword, ...dataToSend } = values;
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
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
          {t('Choose your account type:')}
        </Typography>
        <Typography variant="body2">
          <strong>{t('Tenant:')}</strong> {t('Search for properties, schedule viewings, and submit applications')}
        </Typography>
        <Typography variant="body2">
          <strong>{t('Landlord:')}</strong> {t('List properties, manage tenant applications, and use AI-powered selection tools')}
        </Typography>
      </Alert>
      
      <FormLabel component="legend" sx={labelSx}>
        {t('Account Type')} <span style={{ color: 'red' }}>*</span>
      </FormLabel>
      <FormControl 
        fullWidth 
        size="small"
        error={formik.touched.user_type && Boolean(formik.errors.user_type)}
        sx={{ mb: 2.5 }}
      >
        <Select
          id="user_type"
          name="user_type"
          value={formik.values.user_type}
          onChange={(e) => {
            formik.handleChange(e);
            if (onUserTypeChange) {
              onUserTypeChange(e.target.value);
            }
          }}
          onBlur={formik.handleBlur}
          displayEmpty
          sx={{
            '& .MuiSelect-select': {
              display: 'flex',
              alignItems: 'center',
            }
          }}
        >
          <MenuItem value="tenant">
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <span style={{ marginRight: '8px' }}>🏠</span>
              <Box>
                <Typography variant="body2">{t("I'm a Tenant")}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {t("Looking for properties to rent")}
                </Typography>
              </Box>
            </Box>
          </MenuItem>
          <MenuItem value="landlord">
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <span style={{ marginRight: '8px' }}>🔑</span>
              <Box>
                <Typography variant="body2">{t("I'm a Landlord")}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {t("Listing properties for rent")}
                </Typography>
              </Box>
            </Box>
          </MenuItem>
        </Select>
        {formik.touched.user_type && formik.errors.user_type && (
          <Typography variant="caption" color="error" sx={{ ml: 1, mt: 0.5 }}>
            {formik.errors.user_type}
          </Typography>
        )}
      </FormControl>

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
        name="firstname"
        placeholder={t('Enter your First Name')}
        {...formik.getFieldProps('firstname')}
        error={formik.touched.firstname && Boolean(formik.errors.firstname)}
        helperText={formik.touched.firstname && formik.errors.firstname}
        variant="outlined"
      />

      <FormLabel component="legend" sx={labelSx}>
        {t('Last Name')}
      </FormLabel>
      <InputField
        size="small"
        fullWidth
        name="lastname"
        placeholder={t('Enter your Last Name')}
        {...formik.getFieldProps('lastname')}
        error={formik.touched.lastname && Boolean(formik.errors.lastname)}
        helperText={formik.touched.lastname && formik.errors.lastname}
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
