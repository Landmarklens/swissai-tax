import React from 'react';
import Layout from '../Layout/Layout';
import HowItWorks from '../../components/sections/workSection/WorkSection';
import { useTranslation } from 'react-i18next';
import SEOHelmet from '../../components/SEO/SEOHelmet';

const HowItWork = () => {
  const { t } = useTranslation();
  const heading = t('howitworks.heading');
  const text = t('howitworks.text');
  return (
    <>
      <SEOHelmet
        titleKey="meta.howitworks.title"
        descriptionKey="meta.howitworks.description"
      />
      <Layout heading={heading} text={text}>
        <HowItWorks title={t('howitworks.explore')} />
      </Layout>
    </>
  );
};

export default HowItWork;
