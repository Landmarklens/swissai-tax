import React, { useEffect } from 'react';
import {
  Box
} from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../../components/header/Header';
import Footer from '../../components/footer/Footer';
import SubscriptionPlans from '../SubscriptionPlans/SubscriptionPlans';

const Plan = () => {
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref');

  // Pass referral code down to SubscriptionPlans if present
  return (
    <>
      <Header />
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
        {/* Use the new SubscriptionPlans component */}
        <SubscriptionPlans referralCode={referralCode} />
      </Box>
      <Footer />
    </>
  );
};

export default Plan;
