import React, { useState } from 'react';
import { Grid, TextField, Button, Typography, MenuItem } from '@mui/material';
import { useTranslation } from 'react-i18next';

const PaymentForm = () => {
  const { t } = useTranslation();
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');

  const countries = [
    { value: 'US', label: t('payment.country.united_states') },
    { value: 'IN', label: t('payment.country.india') },
    { value: 'CH', label: t('payment.country.switzerland') },
    { value: 'UK', label: t('payment.country.united_kingdom') }
  ];

  const states = [
    { value: 'NY', label: t('payment.state.new_york') },
    { value: 'CA', label: t('payment.state.california') },
    { value: 'TX', label: t('payment.state.texas') }
  ];

  const handleCountryChange = (event) => {
    setCountry(event.target.value);
  };

  const handleStateChange = (event) => {
    setState(event.target.value);
  };

  return (
    <form>
      <Typography variant="h5" gutterBottom>
        {t('payment.title')}
      </Typography>

      <Grid container spacing={2}>
        {/* Cardholder Name */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            label={t('payment.cardholder_name')}
            placeholder={t('payment.cardholder_name_placeholder')}
          />
        </Grid>

        {/* Credit Card Details */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label={t('payment.card_number')}
            placeholder={t('payment.card_number_placeholder')}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <TextField
            fullWidth
            label={t('payment.expiration_date')}
            placeholder={t('payment.expiration_date_placeholder')}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <TextField
            fullWidth
            label={t('payment.cvv')}
            placeholder={t('payment.cvv_placeholder')}
          />
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            {t('payment.billing_information')}
          </Typography>
        </Grid>

        {/* First and Last Name */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label={t('First name')}
            placeholder={t('Enter First name')}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label={t('Last name')}
            placeholder={t('Enter Last name')}
          />
        </Grid>

        {/* Country and City */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            select
            label={t('Country')}
            value={country}
            onChange={handleCountryChange}
            placeholder={t('payment.select_country')}
          >
            {countries.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label={t('City')}
            placeholder={t('Enter City')}
          />
        </Grid>

        {/* State and ZIP */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            select
            label={t('State')}
            value={state}
            onChange={handleStateChange}
            placeholder={t('Select State')}
          >
            {states.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label={t('ZIP')}
            placeholder={t('Enter ZIP')}
          />
        </Grid>

        {/* Address */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            label={t('Address')}
            placeholder={t('Enter Address')}
          />
        </Grid>

        {/* Buttons */}
        <Grid item xs={12} mt={2}>
          <Button variant="contained" color="primary" style={{ marginRight: 8 }}>
            {t('Save')}
          </Button>
          <Button variant="text">{t('Cancel')}</Button>
        </Grid>
      </Grid>
    </form>
  );
};

export default PaymentForm;
