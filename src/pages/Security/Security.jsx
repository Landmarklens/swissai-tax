import React from 'react';
import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import SEOHelmet from '../../components/SEO/SEOHelmet';
import Header from '../../components/header/Header';
import Footer from '../../components/footer/Footer';
import SecurityHero from '../../components/sections/SecurityHero/SecurityHero';
import SecurityFeatures from '../../components/sections/SecurityFeatures/SecurityFeatures';
import SecurityCompliance from '../../components/sections/SecurityCompliance/SecurityCompliance';
import SecurityFAQ from '../../components/sections/SecurityFAQ/SecurityFAQ';
import SecurityActions from '../../components/sections/SecurityActions/SecurityActions';

const Security = () => {
  const { t } = useTranslation();

  return (
    <>
      <SEOHelmet
        title={t('security.meta.title')}
        description={t('security.meta.description')}
      />

      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />

        <Box component="main" sx={{ flex: 1 }}>
          <SecurityHero />
          <SecurityFeatures />
          <SecurityCompliance />
          <SecurityFAQ />
          <SecurityActions />
        </Box>

        <Footer />
      </Box>
    </>
  );
};

export default Security;
