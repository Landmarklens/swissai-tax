import React, { useEffect, useState } from 'react';
import PaymentPlan from '../../components/sections/PaymentPlan/PaymentPlan';
import PaymentMethod from '../../components/sections/PaymentMethod/PaymentMethod';
import { Box, Divider, Typography } from '@mui/material';

import { useDispatch } from 'react-redux';
import SEOHelmet from '../../components/SEO/SEOHelmet';

import { fetchUserProfile } from '../../store/slices/accountSlice';

const Payment = () => {
  const dispatch = useDispatch();

  const [profile, setProfile] = useState();

  async function getProfile() {
    const profile = await dispatch(fetchUserProfile());
    setProfile(profile.payload);
  }

  useEffect(() => {
    getProfile();
  }, []);

  return (
    <>
      <SEOHelmet
        title="Payment - HomeAI"
        description="Secure payment processing for HomeAI services"
      />
      <Box>
      <Box
        sx={{
          display: { sm: 'flex', xs: 'block' },
          margin: 'auto',
          fontFamily: 'Arial, sans-serif',
          backgroundColor: '#ffffff',
          borderRadius: 2,
          boxShadow: '0 0 10px rgba(0,0,0,0.1)'
        }}
      >
        <PaymentPlan />
        <PaymentMethod profile={profile} />
      </Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '68px',
          borderBottom: '1px solid rgba(0, 0, 51, 0.06)'
        }}
      >
        <Typography
          sx={{
            width: '100%',
            fontSize: '14px',
            fontWeight: 400,
            textAlign: 'center'
          }}
          variant="body2"
          color="textSecondary"
        >
          © 2025 Home Ai, LLC
        </Typography>
      </Box>
    </Box>
    </>
  );
};

export default Payment;
