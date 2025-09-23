import React, { useState } from 'react';
import { Grid, TextField, Button, Typography, MenuItem } from '@mui/material';

const countries = [
  { value: 'US', label: 'United States' },
  { value: 'IN', label: 'India' },
  { value: 'CH', label: 'China' },
  { value: 'UK', label: 'United Kingdom' }
];

const states = [
  { value: 'NY', label: 'New York' },
  { value: 'CA', label: 'California' },
  { value: 'TX', label: 'Texas' }
];

const PaymentForm = () => {
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');

  const handleCountryChange = (event) => {
    setCountry(event.target.value);
  };

  const handleStateChange = (event) => {
    setState(event.target.value);
  };

  return (
    <form>
      <Typography variant="h5" gutterBottom>
        Payment information
      </Typography>

      <Grid container spacing={2}>
        {/* Cardholder Name */}
        <Grid item xs={12}>
          <TextField fullWidth label="Cardholder Name" placeholder="Enter Cardholder Name" />
        </Grid>

        {/* Credit Card Details */}
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="Credit Card Number" placeholder="XXXX XXXX XXXX XXXX" />
        </Grid>
        <Grid item xs={6} md={3}>
          <TextField fullWidth label="Expiration Date" placeholder="MM/YY" />
        </Grid>
        <Grid item xs={6} md={3}>
          <TextField fullWidth label="CVV/CVC" placeholder="***" />
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Billing information
          </Typography>
        </Grid>

        {/* First and Last Name */}
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="First name" placeholder="Enter First name" />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="Last name" placeholder="Enter Last name" />
        </Grid>

        {/* Country and City */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            select
            label="Country"
            value={country}
            onChange={handleCountryChange}
            placeholder="Select Country"
          >
            {countries.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="City" placeholder="Enter City" />
        </Grid>

        {/* State and ZIP */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            select
            label="State"
            value={state}
            onChange={handleStateChange}
            placeholder="Select State"
          >
            {states.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="ZIP" placeholder="Enter ZIP" />
        </Grid>

        {/* Address */}
        <Grid item xs={12}>
          <TextField fullWidth label="Address" placeholder="Enter Address" />
        </Grid>

        {/* Buttons */}
        <Grid item xs={12} mt={2}>
          <Button variant="contained" color="primary" style={{ marginRight: 8 }}>
            Save
          </Button>
          <Button variant="text">Cancel</Button>
        </Grid>
      </Grid>
    </form>
  );
};

export default PaymentForm;
