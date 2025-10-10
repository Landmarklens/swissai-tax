import React from 'react';
import {
  Box
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/header/Header';
import Footer from '../../components/footer/Footer';
import SubscriptionPlans from '../SubscriptionPlans/SubscriptionPlans';

const Plan = () => {
  return (
    <>
      <Header />
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
        {/* Use the new SubscriptionPlans component */}
        <SubscriptionPlans />
      </Box>
      <Footer />
    </>
  );
};

export default Plan;
