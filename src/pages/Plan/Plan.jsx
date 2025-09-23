import React, { useState } from 'react';
import Layout from '../Layout/Layout';
import { theme } from '../../theme/theme';
import { useTranslation } from 'react-i18next';
import SEOHelmet from '../../components/SEO/SEOHelmet';
import { PricingPlans } from '../../components/sections/PricingPlans/PricingPlans';
import LoginSignupModal from '../../components/login/Login';
import UserTypeToggle from '../../components/UserTypeToggle/UserTypeToggle';
import { Box } from '@mui/material';
import useUserType from '../../hooks/useUserType';
import './Plan.scss';

const Plan = () => {
  const { t } = useTranslation();
  const [isOpenAuthModal, setIsOpenAuthModal] = useState(false);
  const { userType, setUserType } = useUserType();

  const handleOpenAuthModal = () => {
    setIsOpenAuthModal(true);
  };
  const handleCloseAuthModal = () => {
    setIsOpenAuthModal(false);
  };

  return (
    <>
      <SEOHelmet
        title="Subscription Plans - HomeAI"
        description="Choose the perfect HomeAI subscription plan for your needs"
      />
      <Layout backgroundColor={theme.palette.background.lightBlue}>
        <Box sx={{ mt: -2, mb: 2 }}>
          <UserTypeToggle
            userType={userType}
            onUserTypeChange={setUserType}
          />
        </Box>
        <PricingPlans
          className="pricing-plans"
          handleOpenAuthModal={handleOpenAuthModal}
          userType={userType}
        />
        <LoginSignupModal open={isOpenAuthModal} onClose={handleCloseAuthModal} />
      </Layout>
    </>
  );
};

export default Plan;
