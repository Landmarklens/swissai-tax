import React, { useState, useRef } from 'react';

import * as Yup from 'yup';

import { useFormik } from 'formik';
import { useTranslation } from 'react-i18next';

import Layout from '../Layout/Layout';
import { theme } from '../../theme/theme';
import parameterStore from '../../services/awsParameterStore';

import {
  Grid,
  Typography,
  TextField,
  Button,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Box,
  Radio,
  Snackbar,
  FormHelperText
} from '@mui/material';
import { styled } from '@mui/system';

import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import InstagramIcon from '@mui/icons-material/Instagram';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { toast } from 'react-toastify';
import SEOHelmet from '../../components/SEO/SEOHelmet';

const ContactContainer = styled(Box)({
  backgroundColor: '#f7f9ff',
  padding: '20px'
});

const InnerContainer = styled(Grid)({
  backgroundColor: 'white',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'stretch',
  border: '1px solid #d2dbf8'
  // height: '100%'
});

const InfoPaper = styled(Box)(({ theme }) => ({
  backgroundColor: '#3F63EC',
  padding: '30px',
  flex: 1,
  color: 'white',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: '8px',
  [theme.breakpoints.up('md')]: {
    minHeight: '470px' // Apply minHeight only on screens 900px or above
  }
}));

const InfoPaperBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  [theme.breakpoints.up('md')]: {
    marginTop: '60px',
    marginBottom: '60px'
  }
}));

const FormPaper = styled(Box)({
  backgroundColor: '#fff',
  padding: '20px',
  flex: 1,
  display: 'flex',
  flexDirection: 'column'
});

const InputField = styled(TextField)({
  marginBottom: '20px',

  '.MuiFormHelperText-root': {
    marginLeft: '8px'
  },

  /* Hide incr/decr btns */
  '& input[type=number]': {
    '-moz-appearance': 'textfield'
  },
  '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button':
    {
      '-webkit-appearance': 'none',
      margin: 0
    }
});

const CustomRadio = styled(Radio)(({ theme }) => ({
  '& .MuiSvgIcon-root': {
    width: '20px',
    height: '20px'
  }
}));

const iconStyle = {
  fontSize: '15px',
  color: 'white'
};

const upperIconStyle = {
  fontSize: '25px',
  color: 'white',
  paddingRight: '10px'
};

const iconWrapperStyle = {
  backgroundColor: theme.palette.background.iconColor, // Dark blue color for the circle
  borderRadius: '50%',
  width: '30px',
  height: '30px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer'
};

const Contact = () => {
  const { t } = useTranslation();

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: ''
  });


  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      subject: 'Contact Us',
      message: ''
    },

    validationSchema: Yup.object({
      email: Yup.string()
        .matches(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, t('Invalid email address'))
        .required(t('Required')),
      firstName: Yup.string()
        .min(2, t('First name must be at least 2 characters'))
        .max(50, t('First name must be at most 50 characters'))
        .required(t('Required')),
      lastName: Yup.string()
        .min(2, t('Last name must be at least 2 characters'))
        .max(50, t('Last name must be at most 50 characters'))
        .required(t('Required')),
      subject: Yup.string()
        .min(3, t('Subject must be at least 3 characters'))
        .max(100, t('Subject must be at most 100 characters'))
        .required(t('Please select a subject')),
      message: Yup.string()
        .min(10, t('Message must be at least 10 characters'))
        .max(2000, t('Message must be at most 2000 characters'))
        .required(t('Required')),
      phoneNumber: Yup.string()
        .matches(/^[0-9+\-\s]*$/, t('Phone number must contain only digits, spaces, +, or -'))
        .min(7, t('Phone number is too short'))
        .max(20, t('Phone number is too long'))
    }),
    onSubmit: async (values, formikHelpers) => {
      try {
        // Get API URL from parameter store and ensure no trailing slash
        let apiUrl = await parameterStore.getParameter('API_BASE_URL') || 'https://api.homeai.ch';
        apiUrl = apiUrl.replace(/\/$/, ''); // Remove trailing slash if present

        const response = await fetch(`${apiUrl}/api/contact`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firstName: values.firstName,
            lastName: values.lastName,
            email: values.email,
            phone: values.phoneNumber || null,
            subject: values.subject || 'Contact Form Submission',
            message: values.message,
            inquiry: values.inquiry || 'general'
          })
        });

        const data = await response.json();

        if (response.ok) {
          toast.success(data.message || 'Thank you for your request! We\'ll get back to you soon.');
          formikHelpers.resetForm();
        } else {
          // Handle specific error cases
          if (response.status === 422) {
            // Handle validation errors from backend
            if (data.details && Array.isArray(data.details)) {
              // Show each validation error
              data.details.forEach(error => {
                const fieldName = error.field ? error.field.replace('body.', '') : '';
                const message = error.message || 'Validation error';

                // Set field-specific errors in formik
                if (fieldName) {
                  formikHelpers.setFieldError(fieldName, message);
                }

                // Also show as toast for visibility
                toast.error(`${fieldName ? fieldName + ': ' : ''}${message}`);
              });
            } else {
              toast.error(data.error || 'Validation failed. Please check your input.');
            }
          } else if (response.status === 429) {
            toast.error('Too many requests. Please wait a moment and try again.');
          } else if (response.status === 400) {
            toast.error(data.detail || 'Please check your input and try again.');
          } else {
            toast.error(data.detail || data.error || 'Failed to send message. Please try again later.');
          }
        }
      } catch (error) {
        console.error('Contact form submission error:', error);
        toast.error('Network error. Please check your connection and try again.');
      } finally {
        formikHelpers.setSubmitting(false);
      }
    }
  });

  function handleCloseSnackbar() {
    setSnackbar({ ...snackbar, open: false });
  }

  const labelSx = {
    color: theme.palette.text.primary,
    mb: 0.5,
    ml: 1
  };

  return (
    <>
      <SEOHelmet
        titleKey="meta.contact.title"
        descriptionKey="meta.contact.description"
      />
      <Layout id="ContactLayout">
        <ContactContainer id="ContactContainer">
          <Grid container spacing={1} justifyContent="center">
            <Grid item xs={12} md={10} sx={{ paddingBottom: '50px' }}>
              <Typography variant="h2" sx={{ paddingBottom: '30px' }} align="center">
                {t('Contact Us')}
              </Typography>
              <Typography variant="body1" align="center">
                {t('Any question or remarks? Just write us a message!')}
              </Typography>
            </Grid>

            <Grid item xs={12} md={10}>
              <InnerContainer container spacing={2}>
                <Grid item xs={12} md={4}>
                  <InfoPaper elevation={3}>
                    <Typography
                      variant="h6"
                      style={{ color: 'white', fontWeight: 'bold' }}
                      gutterBottom>
                      {t('Contact Information')}
                    </Typography>
                    {/* <Typography
                    variant="body1"
                    style={{ color: "white" }}
                    gutterBottom
                  >
                    {t("Say something to start a live chat!")}
                  </Typography> */}

                    <InfoPaperBox>
                      <Box sx={{ display: 'flex', alignItems: 'center' }} mt={3}>
                        {/* <EmailOutlinedIcon sx={upperIconStyle} /> */}
                        <Typography variant="body1" style={{ color: 'white' }} gutterBottom>
                          LandMarK Lens GMBH
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }} mt={3}>
                        <EmailOutlinedIcon sx={upperIconStyle} />
                        <Typography variant="body1" style={{ color: 'white' }} gutterBottom>
                          contact@homeai.ch
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center' }} mt={3}>
                        <LocationOnIcon sx={upperIconStyle} />
                        <Typography variant="body1" style={{ color: 'white' }} gutterBottom>
                          Sandbuckstrasse 24, Schneisingen 5425
                        </Typography>
                      </Box>
                    </InfoPaperBox>
                    {/* <Box
                    mt={3}
                    display="flex"
                    justifyContent="space-between"
                    width="180px"
                  >
                    <Box sx={iconWrapperStyle}>
                      <FacebookIcon sx={iconStyle} />
                    </Box>
                    <Box sx={iconWrapperStyle}>
                      <TwitterIcon sx={iconStyle} />
                    </Box>
                    <Box sx={iconWrapperStyle}>
                      <LinkedInIcon sx={iconStyle} />
                    </Box>
                    <Box sx={iconWrapperStyle}>
                      <InstagramIcon sx={iconStyle} />
                    </Box>
                  </Box> */}
                  </InfoPaper>
                </Grid>

                <Grid id="ContactFormGrid" item xs={12} md={8}>
                  <FormPaper id="ContactFormFormPaper" elevation={3}>
                    <form
                      id="ContactForm"
                      style={{ flex: 1 }}
                      onSubmit={formik.handleSubmit}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <FormLabel component="legend" sx={labelSx}>
                            {t('First name')} *
                          </FormLabel>
                          <InputField
                            size="small"
                            placeholder={t('Enter your First name')}
                            variant="outlined"
                            fullWidth
                            required
                            name="firstName"
                            inputProps={{ name: 'firstName' }}
                            {...formik.getFieldProps('firstName')}
                            error={formik.touched.firstName && !!formik.errors.firstName}
                            helperText={formik.touched.firstName && formik.errors.firstName}
                          />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <FormLabel component="legend" sx={labelSx}>
                            {t('Last name')} *
                          </FormLabel>
                          <InputField
                            inputProps={{ name: 'lastName' }}
                            size="small"
                            placeholder={t('Enter your Last name')}
                            variant="outlined"
                            fullWidth
                            required
                            name="lastName"
                            {...formik.getFieldProps('lastName')}
                            error={formik.touched.lastName && !!formik.errors.lastName}
                            helperText={formik.touched.lastName && formik.errors.lastName}
                          />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <FormLabel component="legend" sx={labelSx}>
                            {t('Email')} *
                          </FormLabel>
                          <InputField
                            size="small"
                            placeholder={t('Enter your Email')}
                            type="email"
                            name="email"
                            variant="outlined"
                            fullWidth
                            required
                            inputProps={{ name: 'email' }}
                            {...formik.getFieldProps('email')}
                            error={formik.touched.email && !!formik.errors.email}
                            helperText={formik.touched.email && formik.errors.email}
                          />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <FormLabel component="legend" sx={labelSx}>
                            {t('Phone number')}
                          </FormLabel>
                          <InputField
                            type="text"
                            size="small"
                            placeholder="079 123 45 67"
                            variant="outlined"
                            fullWidth
                            name="phoneNumber"
                            inputProps={{ name: 'phoneNumber' }}
                            {...formik.getFieldProps('phoneNumber')}
                            error={formik.touched.phoneNumber && !!formik.errors.phoneNumber}
                            helperText={formik.touched.phoneNumber && formik.errors.phoneNumber}
                          />
                        </Grid>

                        {/* <Grid item xs={12}>
                          <FormControl
                            component="fieldset"
                            required
                            error={!!formik.errors.subject}
                            helperText={formik.errors.subject}>
                            <FormLabel
                              component="legend"
                              sx={{
                                fontWeight: 'bold',
                                fontSize: '1.1rem',
                                color: theme.palette.text.primary,
                                '&.Mui-focused': {
                                  color: theme.palette.text.primary
                                },
                                '&:focus': {
                                  outline: 'none'
                                }
                              }}>
                              {t('Select Subject')}?
                            </FormLabel>
                            <RadioGroup
                              required
                              row
                              aria-label="subject"
                              name="subject"
                              value={formik.values.subject}
                              onChange={formik.handleChange}
                              sx={{
                                display: 'flex',
                                flexDirection: 'row'
                              }}>
                              <FormControlLabel
                                value="General Inquiry"
                                sx={{ color: theme.palette.text.primary }}
                                control={
                                  <CustomRadio
                                    icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
                                    checkedIcon={<CheckBoxIcon fontSize="small" />}
                                  />
                                }
                                label={t('General Inquiry')}
                              />
                              <FormControlLabel
                                value="General Inquiry1"
                                sx={{ color: theme.palette.text.primary }}
                                control={
                                  <CustomRadio
                                    icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
                                    checkedIcon={<CheckBoxIcon fontSize="small" />}
                                  />
                                }
                                label={`${t('General Inquiry')} 1`}
                              />
                              <FormControlLabel
                                value="General Inquiry2"
                                sx={{ color: theme.palette.text.primary }}
                                control={
                                  <CustomRadio
                                    icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
                                    checkedIcon={<CheckBoxIcon fontSize="small" />}
                                  />
                                }
                                label={`${t('General Inquiry')} 2`}
                              />
                              <FormControlLabel
                                value="General Inquiry3"
                                sx={{ color: theme.palette.text.primary }}
                                control={
                                  <CustomRadio
                                    icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
                                    checkedIcon={<CheckBoxIcon fontSize="small" />}
                                  />
                                }
                                label={`${t('General Inquiry')} 3`}
                              />
                            </RadioGroup>
                            {formik.errors.subject && (
                              <FormHelperText color="red">{formik.errors.subject}</FormHelperText>
                            )}
                          </FormControl>
                        </Grid> */}

                        <Grid item xs={12}>
                          <FormLabel component="legend" sx={labelSx}>
                            {t('Message')} *
                          </FormLabel>
                          <InputField
                            placeholder={t('Write your Message..')}
                            variant="outlined"
                            multiline
                            rows={4}
                            fullWidth
                            required
                            name="message"
                            inputProps={{ name: 'message' }}
                            {...formik.getFieldProps('message')}
                            error={formik.touched.message && !!formik.errors.message}
                            helperText={formik.touched.message && formik.errors.message}
                          />
                        </Grid>

                        <Grid item xs={12}>
                          <Button type="submit" variant="contained" sx={{ float: 'right' }}>
                            {t('Send Message')}
                          </Button>
                        </Grid>
                      </Grid>
                    </form>
                  </FormPaper>
                </Grid>
              </InnerContainer>
            </Grid>
          </Grid>
        </ContactContainer>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          message={snackbar.message}
        />
      </Layout>
    </>
  );
};

export default Contact;
