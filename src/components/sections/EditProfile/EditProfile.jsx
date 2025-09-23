import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as Yup from 'yup';
import { useFormik } from 'formik';
import {
  Box,
  Typography,
  Select,
  MenuItem,
  Button,
  Grid,
  Avatar,
  Paper,
  FormLabel,
  TextField,
  Divider,
  Snackbar,
  CardContent,
  Card
} from '@mui/material';
import { Google } from '../../../assets/svg/Google';
import { styled } from '@mui/system';
import {
  fetchUserProfile,
  editUserProfile,
  selectAccount
} from '../../../store/slices/accountSlice';
import countriesData from './countries.json';
import { useTranslation } from 'react-i18next';
import { LanguageSelect } from '../../LanguageSelect/LanguageSelect';

const InputField = styled(TextField)({
  marginBottom: '20px',
  '& .MuiInputBase-root': {
    height: '40px'
  }
});

const EditProfileSection = () => {
  const { t, i18n } = useTranslation();

  const dispatch = useDispatch();
  const { data: userData, error } = useSelector(selectAccount);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const countries = countriesData.countries;

  useEffect(() => {
    dispatch(fetchUserProfile());
  }, [dispatch]);

  const changeLocalLanguage = (language) => {
    i18n.changeLanguage(language);
    localStorage.setItem('i18nextLng', language);
  };

  const handleBlur = async (e) => {
    const fieldName = e.target.name;
    const fieldValue = formik.values[fieldName];
    const originalValue = userData?.[fieldName];

    if (fieldName === 'language') {
      changeLocalLanguage(fieldValue);
    }

    if (fieldValue === originalValue) return;

    const errors = await formik.validateForm();
    if (errors[fieldName]) return;

    try {
      await dispatch(editUserProfile(formik.values)).unwrap();
      setSnackbar({ open: true, message: t('Changes auto-saved') });
    } catch (err) {
      setSnackbar({ open: true, message: t('Auto-save failed') });
    }
  };

  const handleSubmit = async () => {
    try {
      // await dispatch(editUserProfile(formik.values)).unwrap();
      setSnackbar({ open: true, message: t('Profile updated successfully!') });
    } catch (error) {
      setSnackbar({
        open: true,
        message: t('Failed to update profile. Please try again.')
      });
    }
  };

  const formik = useFormik({
    initialValues: {
      firstname: userData?.firstname || '',
      lastname: userData?.lastname || '',
      email: userData?.email || '',
      phone: userData?.phone || '',
      country: userData?.country || '',
      city: userData?.city || '',
      state: userData?.state || '',
      zip_code: userData?.zip_code || '',
      address: userData?.address || '',
      language: userData?.language || 'en'
    },
    enableReinitialize: true,
    onSubmit: handleSubmit,
    validationSchema: Yup.object({
      firstname: Yup.string()
        .min(3, 'Name must be at least 3 characters long')
        .max(20, 'Name cannot be more than 20 characters')
        .required(t('Required')),
      lastname: Yup.string()
        .min(3, 'Name must be at least 3 characters long')
        .max(20, 'Name cannot be more than 20 characters')
        .required(t('Required')),
      email: Yup.string()
        .email(t('Invalid email address'))
        .test(
          'has-tld',
          t('Invalid email address'),
          (value) => !!value && /\.[a-zA-Z]{2,}$/.test(value)
        )
        .required(t('Required')),
      language: Yup.string().oneOf(['de', 'en', 'fr', 'it']).required(t('Required'))
    })
  });

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const labelStyle = {
    color: '#80838D',
    fontSize: '14px',
    marginBottom: '4px',
    display: 'inline-block'
  };

  if (error) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" mt={10}>
        <Card sx={{ p: 2 }}>
          <CardContent style={{ padding: 0 }}>
            <Typography fontSize={20} fontWeight={700} mb={1} color="#000">
              Something went wrong...
            </Typography>
            <Typography color="#000">
              Does it look like an error has occurred? Try reloading the page
            </Typography>
            <Button
              sx={{ mt: 2 }}
              fullWidth
              onClick={() => window.location.reload()}
              variant="contained">
              Reload App
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  console.log(formik.errors);

  return (
    <>
      <Box
        component="form"
        onSubmit={formik.handleSubmit}
        sx={{ maxWidth: 800, margin: 'auto', p: 3, paddingTop: '64px' }}>
        <Typography
          variant="h5"
          sx={{ mb: 3, color: '#202020', fontSize: '24px', fontWeight: '400' }}>
          {t('Edit Profile')}
        </Typography>

        <Paper
          sx={{
            p: 2,
            pb: 0,
            pt: 0,
            display: 'flex',
            alignItems: 'center',
            mb: 3,
            bgcolor: '#EDF2FE',
            height: '72px',
            boxShadow: 'unset'
          }}>
          <Box sx={{ display: 'flex', alignItems: 'center', pb: 0 }}>
            <Avatar
              src={userData?.avatar_url || '/path-to-default-image.jpg'}
              sx={{ width: 48, height: 48, mr: 2 }}
            />
            <Box>
              <Typography sx={{ color: '#202020', fontWeight: 500, fontSize: '14px' }} variant="h6">
                {`${formik.values.firstname} ${formik.values.lastname}`}
              </Typography>
              <Box sx={{ display: 'flex', mt: '5px', alignItems: 'center' }}>
                <Google sx={{ width: '14px', height: '14px' }} />
                <Typography sx={{ marginLeft: '12px' }} variant="body2" color="text.secondary">
                  {formik.values.email}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>
        <Divider sx={{ width: '100%', mb: '24px' }} />
        <Grid container>
          <Grid item xs={12} sm={6} sx={{ pr: { sm: 2 } }}>
            <FormLabel component="legend" style={labelStyle}>
              {t('First name')}
            </FormLabel>
            <InputField
              name="firstname"
              {...formik.getFieldProps('firstname')}
              placeholder={t('Enter First name')}
              variant="outlined"
              fullWidth
              size="small"
              error={Boolean(formik.errors.firstname)}
              helperText={formik.errors.firstname}
              onBlur={(e) => handleBlur(e)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormLabel component="legend" style={labelStyle}>
              {t('Last name')}
            </FormLabel>
            <InputField
              name="lastname"
              {...formik.getFieldProps('lastname')}
              placeholder={t('Enter Last name')}
              variant="outlined"
              fullWidth
              size="small"
              error={Boolean(formik.errors.lastname)}
              helperText={formik.errors.lastname}
              onBlur={(e) => handleBlur(e)}
            />
          </Grid>
          <Grid item xs={12} sm={6} sx={{ pr: { sm: 2 } }}>
            <FormLabel component="legend" style={labelStyle}>
              {t('Email')}
            </FormLabel>
            <InputField
              name="email"
              type="email"
              {...formik.getFieldProps('email')}
              placeholder={t('Enter Email')}
              variant="outlined"
              fullWidth
              size="small"
              error={Boolean(formik.errors.email)}
              helperText={formik.errors.email}
              onBlur={(e) => handleBlur(e)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormLabel component="legend" style={labelStyle}>
              {t('WhatsApp Number')}
            </FormLabel>
            <InputField
              name="phone"
              {...formik.getFieldProps('phone')}
              placeholder="876-987-9876"
              variant="outlined"
              fullWidth
              sx={{ mb: 'unset' }}
              size="small"
              onBlur={(e) => handleBlur(e)}
            />
            <Typography
              sx={{
                color: '#8E8E93',
                mb: '20px',
                fontSize: '14px',
                fontWeight: 400
              }}>
              {t('WhatsApp alerts commute time, taxes, real time monitoring')}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} sx={{ pr: { sm: 2 } }}>
            <FormLabel component="legend" style={labelStyle}>
              {t('Country')}
            </FormLabel>
            <Select
              name="country"
              {...formik.getFieldProps('country')}
              displayEmpty
              fullWidth
              size="small"
              onBlur={(e) => handleBlur(e)}
              sx={{
                height: '40px',
                marginBottom: '20px',
                color: formik.values.country ? 'rgb(10, 10, 10)' : '#8E8E93'
                // pl: '6px'
              }}>
              {countries.map((country) => (
                <MenuItem key={country.code} value={country.code}>
                  {country.name}
                </MenuItem>
              ))}
            </Select>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormLabel component="legend" style={labelStyle}>
              {t('City')}
            </FormLabel>
            <InputField
              name="city"
              {...formik.getFieldProps('city')}
              placeholder={t('Enter City')}
              variant="outlined"
              fullWidth
              size="small"
              onBlur={(e) => handleBlur(e)}
            />
          </Grid>
          {/* <Grid item xs={12} sm={6} sx={{ pr: { sm: 2 } }}>
            <FormLabel component="legend" style={labelStyle}>
              {t('State')}
            </FormLabel>
            <Select
              name="state"
              {...formik.getFieldProps('state')}
              displayEmpty
              fullWidth
              size="small"
              onBlur={(e) => handleBlur(e)}
              sx={{
                height: '40px',
                marginBottom: '20px',
                color: formik.values.state ? 'rgb(10, 10, 10)' : '#8E8E93'
                // pl: '6px'
              }}>
              <MenuItem value="" disabled>
                {t('Select State')}
              </MenuItem>
            </Select>
          </Grid> */}
          <Grid item xs={12} sm={6} sx={{ pr: { sm: 2 } }}>
            <FormLabel component="legend" style={labelStyle}>
              {t('ZIP')}
            </FormLabel>
            <InputField
              name="zip_code"
              {...formik.getFieldProps('zip_code')}
              placeholder={t('Enter ZIP')}
              variant="outlined"
              fullWidth
              size="small"
              onBlur={(e) => handleBlur(e)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormLabel component="legend" style={labelStyle}>
              {t('Address')}
            </FormLabel>
            <InputField
              name="address"
              {...formik.getFieldProps('address')}
              placeholder={t('Enter Address')}
              variant="outlined"
              fullWidth
              size="small"
              onBlur={(e) => handleBlur(e)}
            />
          </Grid>
          <Grid sx={{ width: '100%', maxWidth: '360px' }}>
            <LanguageSelect formik={formik} onBlur={(e) => handleBlur(e)} />
          </Grid>
        </Grid>
        <Button
          disabled={!formik.isValid || formik.isSubmitting}
          type="submit"
          variant="contained"
          fullWidth
          sx={{
            bgcolor: '#4a5af9',
            color: 'white',
            py: 1.5,
            fontSize: '18px',
            boxShadow: 'none',
            fontWeight: 500,
            height: '48px',
            mt: '20px',
            marginBottom: '64px'
          }}>
          {t('Save Profile')}
        </Button>
      </Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '68px',
          borderTop: '1px solid rgba(0, 0, 51, 0.06)'
        }}>
        <Typography
          sx={{
            width: '100%',
            fontSize: '14px',
            fontWeight: 400,
            textAlign: 'center'
          }}
          variant="body2"
          color="textSecondary">
          © 2025 Home Ai, LLC
        </Typography>
      </Box>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
      />
    </>
  );
};

export default EditProfileSection;
