import React from 'react';
import Layout from '../Layout/Layout';
import TaxWorkSection from '../../components/sections/workSection/TaxWorkSection';
import { useTranslation } from 'react-i18next';
import SEOHelmet from '../../components/SEO/SEOHelmet';

const HowItWork = () => {
  const { t } = useTranslation();
  const heading = t('How SwissAI Tax Works');
  const text = t(
    'Complete your tax return in just 20 minutes with our AI-powered assistant. Available in all 26 Swiss cantons, supporting German, French, Italian and English.'
  );
  return (
    <>
      <SEOHelmet
        titleKey="meta.howitworks.title"
        descriptionKey="meta.howitworks.description"
      />
      <Layout heading={heading} text={text}>
        <TaxWorkSection title={t('Your Tax Filing Journey')} />
      </Layout>
    </>
  );
};

export default HowItWork;
