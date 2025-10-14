import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

const WebSiteSchema = () => {
  const { t } = useTranslation();
  const { i18n } = useTranslation();
  const currentLang = i18n.language;

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "SwissAI Tax",
    "alternateName": "SwissAI Tax Switzerland - AI Tax Filing",
    "url": `https://swissai.tax/${currentLang}`,
    "description": "AI-powered Swiss tax filing platform for individuals and businesses",
    "publisher": {
      "@type": "Organization",
      "name": "SwissAI Tax",
      "url": "https://swissai.tax"
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `https://swissai.tax/${currentLang}/search?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    },
    "inLanguage": [
      {
        "@type": "Language",
        "name": "English",
        "alternateName": "en"
      },
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
      }
    ]
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schemaData)}
      </script>
    </Helmet>
  );
};

export default WebSiteSchema;