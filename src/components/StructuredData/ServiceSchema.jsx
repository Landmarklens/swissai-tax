import React from 'react';
import { Helmet } from 'react-helmet-async';
import PropTypes from 'prop-types';

/**
 * ServiceSchema - Structured data for SwissAI Tax services
 *
 * This component generates Schema.org Service structured data to help search engines
 * understand the specific services offered by SwissAI Tax.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.serviceType="Tax Preparation"] - Type of service offered
 * @param {string} [props.description] - Custom description for the service
 *
 * @example
 * <ServiceSchema serviceType="Tax Consultation" description="Expert tax consultation..." />
 */
const ServiceSchema = ({
  serviceType = "Tax Preparation",
  description
}) => {
  // Default descriptions for each service type
  const defaultDescriptions = {
    "Tax Preparation": "AI-powered tax preparation service for Swiss residents. Simplify your tax filing process with intelligent automation and expert guidance.",
    "Tax Filing": "Complete tax filing service for individuals and businesses in Switzerland. Our AI platform handles federal and cantonal tax returns.",
    "Tax Consultation": "Professional tax consultation services to help you optimize your tax strategy and ensure compliance with Swiss tax regulations."
  };

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": serviceType,
    "name": `${serviceType} - SwissAI Tax`,
    "description": description || defaultDescriptions[serviceType] || defaultDescriptions["Tax Preparation"],
    "provider": {
      "@type": "Organization",
      "name": "SwissAI Tax",
      "legalName": "LandMarK Lens GMBH",
      "url": "https://swissai.tax",
      "logo": "https://swissai.tax/logo.png",
      "email": "contact@swissai.tax",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Sandbuckstrasse 24",
        "addressLocality": "Schneisingen",
        "postalCode": "5425",
        "addressCountry": "CH"
      }
    },
    "areaServed": {
      "@type": "Country",
      "name": "Switzerland",
      "sameAs": "https://www.wikidata.org/wiki/Q39"
    },
    "availableChannel": {
      "@type": "ServiceChannel",
      "serviceUrl": "https://swissai.tax",
      "servicePhone": "contact@swissai.tax",
      "availableLanguage": [
        {
          "@type": "Language",
          "name": "German",
          "alternateName": "de"
        },
        {
          "@type": "Language",
          "name": "French",
          "alternateName": "fr"
        },
        {
          "@type": "Language",
          "name": "Italian",
          "alternateName": "it"
        },
        {
          "@type": "Language",
          "name": "English",
          "alternateName": "en"
        }
      ]
    },
    "category": "Financial Services",
    "offers": {
      "@type": "Offer",
      "url": "https://swissai.tax/pricing",
      "priceCurrency": "CHF",
      "availability": "https://schema.org/InStock"
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

ServiceSchema.propTypes = {
  serviceType: PropTypes.oneOf(["Tax Preparation", "Tax Filing", "Tax Consultation"]),
  description: PropTypes.string
};

export default ServiceSchema;
