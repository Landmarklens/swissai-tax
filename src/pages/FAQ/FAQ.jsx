import React, { Suspense, lazy } from 'react';
import Layout from '../Layout/Layout';
import { useTranslation } from 'react-i18next';
import SEOHelmet from '../../components/SEO/SEOHelmet';
import FAQSchema from '../../components/StructuredData/FAQSchema';
import { CircularProgress, Box } from '@mui/material';

// Lazy load the Enhanced FAQ with fallback to original
const EnhancedFAQ = lazy(() => 
  import('../../components/sections/FAQ/EnhancedFAQ').catch(() => ({
    default: () => {
      const FAQSection = require('../../components/sections/FAQ/FAQ').default;
      return <FAQSection />;
    }
  }))
);

const FAQ = () => {
  const { t } = useTranslation();

  return (
    <>
      <SEOHelmet
        titleKey="meta.faq.title"
        descriptionKey="meta.faq.description"
      />
      <FAQSchema />
      <Layout
        heading={t('Frequently Asked Questions')}
        text={t('Get answers to common questions about Swiss tax filing, deductions, security, and our AI-powered platform.')}
        backgroundColor={'linear-gradient(to bottom, #d2dbf8, #f7f9ff)'}
      >
        <Suspense
          fallback={
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
              <CircularProgress />
            </Box>
          }
        >
          <EnhancedFAQ />
        </Suspense>
      </Layout>
    </>
  );
};

export default FAQ;
