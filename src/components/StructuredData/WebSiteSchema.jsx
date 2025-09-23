import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

const WebSiteSchema = () => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "HomeAI",
    "alternateName": "HomeAI Switzerland - AI Property Search",
    "url": `https://homeai.ch/${currentLang}`,
    "description": "AI-powered property search platform for Switzerland",
    "publisher": {
      "@type": "Organization",
      "name": "HomeAI",
      "url": "https://homeai.ch"
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `https://homeai.ch/${currentLang}/search?q={search_term_string}`
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