import React from 'react';
import Layout from '../Layout/Layout';
import AboutUs1 from '../../components/sections/AboutUs1/AboutUs1';
import AboutUs2 from '../../components/sections/AboutUs2/AboutUs2';
import { useTranslation } from 'react-i18next';
import SEOHelmet from '../../components/SEO/SEOHelmet';

const About = () => {
  const { t } = useTranslation();
  const heading = 'About The Home AI';
  const text =
    'We offers best solutions with the help of in-depth analysis of artificial intelligence to make life easier for our users.';
  return (
    <>
      <SEOHelmet
        titleKey="meta.about.title"
        descriptionKey="meta.about.description"
      />
      <Layout heading={heading} text={text} isAbout>
        <AboutUs1 />
        <AboutUs2 />
      </Layout>
    </>
  );
};

export default About;
