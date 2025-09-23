import React from 'react';
import Layout from '../Layout/Layout';
import HowItWorks from '../../components/sections/workSection/WorkSection';
import { useTranslation } from 'react-i18next';
import SEOHelmet from '../../components/SEO/SEOHelmet';

const Tenants = () => {
  const { t } = useTranslation();

  const heading = t('How it works for Tenants');
  const text = t(
    'Discover how Home AI transforms your apartment search into a seamless experience. Our intelligent platform leverages advanced algorithms to connect you with the best listings based on your unique preferences.'
  );
  return (
    <>
      <SEOHelmet
        titleKey="meta.tenants.title"
        descriptionKey="meta.tenants.description"
      />
      <Layout heading={heading} text={text} isTenants>
        <HowItWorks title={t('Explore the Process')} isTenants />
      </Layout>
    </>
  );
};

export default Tenants;
