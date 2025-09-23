import React from 'react';
import { Helmet } from 'react-helmet-async';

const OrganizationSchema = () => {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "HomeAI",
    "alternateName": "HomeAI Switzerland",
    "url": "https://homeai.ch",
    "logo": "https://homeai.ch/logo.png",
    "description": "AI-powered property search platform for Switzerland. Stop scrolling through 100+ listings — let AI send the 4 homes that actually fit.",
    "foundingDate": "2023",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "CH",
      "addressRegion": "Switzerland"
    },
    "sameAs": [
      "https://www.linkedin.com/company/homeai-ch",
      "https://twitter.com/homeai_ch",
      "https://www.facebook.com/homeaich"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+41-XX-XXX-XXXX",
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