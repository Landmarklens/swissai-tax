import React from 'react';
import Layout from '../Layout/Layout';
import HowItWorks from '../../components/sections/workSection/WorkSection';
import { useTranslation } from 'react-i18next';
import SEOHelmet from '../../components/SEO/SEOHelmet';

const HowItWork = () => {
  const { t } = useTranslation();
  const heading = t('How It Works');
  const text = t(
    'Discover how Home Al transforms your apartment search into a seamless experience.Our intelligent platform leverages advanced algorithms to connect you with the best listings based on your unique preferences.'
  );
  return (
    <>
      <SEOHelmet
        titleKey="meta.howitworks.title"
        descriptionKey="meta.howitworks.description"
      />
      <Layout heading={heading} text={text}>
        <HowItWorks title={t('Explore the Process')} />
      </Layout>
    </>
  );
};

export default HowItWork;
