import React from 'react';
import Layout from '../Layout/Layout';
import HowItWorks from '../../components/sections/workSection/WorkSection';
import { useTranslation } from 'react-i18next';
import SEOHelmet from '../../components/SEO/SEOHelmet';

const Owners = () => {
  const { t } = useTranslation();

  const heading = t('How it works for Hosts');
  const text = t(
    'With our SmartView Experience, you can showcase your property effortlessly while maximizing convenience and security. Here’s how it works:'
  );
  return (
    <>
      <SEOHelmet
        titleKey="meta.owners.title"
        descriptionKey="meta.owners.description"
      />
      <Layout heading={heading} text={text} isOwners>
        <HowItWorks title={t('Explore the Process')} isOwners />
      </Layout>
    </>
  );
};

export default Owners;
