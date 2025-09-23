import React from 'react';
import Layout from '../Layout/Layout';
import FeatureBox from '../../components/sections/featureSection/Feature';
import { useTranslation } from 'react-i18next';
import SEOHelmet from '../../components/SEO/SEOHelmet';
import UserTypeToggle from '../../components/UserTypeToggle/UserTypeToggle';
import { Box } from '@mui/material';
import useUserType from '../../hooks/useUserType';

const Features = () => {
  const { t } = useTranslation();
  const { userType, setUserType } = useUserType();

  // Dynamic heading and text based on user type
  const heading = userType === 'landlord'
    ? t('Features for Landlords')
    : t('Features');

  const text = userType === 'landlord'
    ? t('Powerful tools to manage your properties efficiently and find the best tenants')
    : t('Explore the innovative features of Home AI that make appartment hunting effortless and efficient');

  return (
    <>
      <SEOHelmet
        titleKey="meta.features.title"
        descriptionKey="meta.features.description"
      />
      <Layout heading={heading} text={text}>
        <Box sx={{ mt: -2, mb: 2 }}>
          <UserTypeToggle
            userType={userType}
            onUserTypeChange={setUserType}
          />
        </Box>
        <FeatureBox
          title={userType === 'landlord'
            ? t('Features that Power Your Property Management')
            : t('Explore the Features')}
          isFeature
          userType={userType}
        />
      </Layout>
    </>
  );
};

export default Features;
