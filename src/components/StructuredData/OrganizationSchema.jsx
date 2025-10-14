import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

/**
 * OrganizationSchema - Main organization structured data for SwissAI Tax
 *
 * This component generates Schema.org Organization structured data to help search engines
 * understand the company behind SwissAI Tax, including legal information, contact details,
 * and business information.
 *
 * @component
 * @example
 * return <OrganizationSchema />
 */
const OrganizationSchema = () => {
  const { t } = useTranslation();
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "SwissAI Tax",
    "legalName": "LandMarK Lens GMBH",
    "alternateName": "SwissAI Tax Switzerland",
    "url": "https://swissai.tax",
    "logo": "https://swissai.tax/logo.png",
    "description": "AI-powered Swiss tax filing platform. Simplify your Swiss tax return with intelligent automation and expert guidance for individuals and businesses.",
    "foundingDate": "2023",
    "email": "contact@swissai.tax",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Sandbuckstrasse 24",
      "addressLocality": "Schneisingen",
      "postalCode": "5425",
      "addressCountry": "CH",
      "addressRegion": "Aargau"
    },
    // TODO: Add social media links when available
    // "sameAs": [
    //   "https://www.linkedin.com/company/swissai-tax",
    //   "https://twitter.com/swissaitax",
    //   "https://www.facebook.com/swissaitax"
    // ],
    "contactPoint": {
      "@type": "ContactPoint",
      "email": "contact@swissai.tax",
      "contactType": "customer service",
      "areaServed": "CH",
      "availableLanguage": ["English", "German", "French", "Italian"]
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "250"
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schemaData)}
      </script>
    </Helmet>
  );
};

export default OrganizationSchema;