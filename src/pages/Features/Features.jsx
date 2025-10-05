import React from 'react';
import Layout from '../Layout/Layout';
import FeatureBox from '../../components/sections/featureSection/Feature';
import { useTranslation } from 'react-i18next';
import SEOHelmet from '../../components/SEO/SEOHelmet';

const Features = () => {
  const { t } = useTranslation();

  const heading = t('SwissAI Tax Features');
  const text = t('Powerful AI-driven tools to simplify your Swiss tax filing and maximize your returns');

  return (
    <>
      <SEOHelmet
        titleKey="meta.features.title"
        descriptionKey="meta.features.description"
      />
      <Layout heading={heading} text={text}>
        <FeatureBox isFeature />
      </Layout>
    </>
  );
};

export default Features;
