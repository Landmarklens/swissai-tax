import React from 'react';
import { Helmet } from 'react-helmet-async';

/**
 * LocalBusinessSchema - Structured data for SwissAI Tax as a Professional Service
 *
 * This component generates Schema.org LocalBusiness/ProfessionalService structured data
 * to help search engines understand the business location, services, and contact information.
 *
 * @component
 * @example
 * return <LocalBusinessSchema />
 */
const LocalBusinessSchema = () => {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "name": "SwissAI Tax",
    "legalName": "LandMarK Lens GMBH",
    "description": "AI-powered Swiss tax filing service that simplifies tax preparation for individuals and businesses in Switzerland",
    "url": "https://swissai.tax",
    "logo": "https://swissai.tax/logo.png",
    "image": "https://swissai.tax/og-image.png",
    "priceRange": "$$",
    "email": "contact@swissai.tax",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Sandbuckstrasse 24",
      "addressLocality": "Schneisingen",
      "postalCode": "5425",
      "addressCountry": "CH",
      "addressRegion": "Aargau"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "47.5217",
      "longitude": "8.3696"
    },
    "areaServed": [
      {
        "@type": "Country",
        "name": "Switzerland",
        "sameAs": "https://www.wikidata.org/wiki/Q39"
      },
      // All Swiss cantons
      { "@type": "AdministrativeArea", "name": "Zürich", "addressCountry": "CH" },
      { "@type": "AdministrativeArea", "name": "Bern", "addressCountry": "CH" },
      { "@type": "AdministrativeArea", "name": "Luzern", "addressCountry": "CH" },
      { "@type": "AdministrativeArea", "name": "Uri", "addressCountry": "CH" },
      { "@type": "AdministrativeArea", "name": "Schwyz", "addressCountry": "CH" },
      { "@type": "AdministrativeArea", "name": "Obwalden", "addressCountry": "CH" },
      { "@type": "AdministrativeArea", "name": "Nidwalden", "addressCountry": "CH" },
      { "@type": "AdministrativeArea", "name": "Glarus", "addressCountry": "CH" },
      { "@type": "AdministrativeArea", "name": "Zug", "addressCountry": "CH" },
      { "@type": "AdministrativeArea", "name": "Fribourg", "addressCountry": "CH" },
      { "@type": "AdministrativeArea", "name": "Solothurn", "addressCountry": "CH" },
      { "@type": "AdministrativeArea", "name": "Basel-Stadt", "addressCountry": "CH" },
      { "@type": "AdministrativeArea", "name": "Basel-Landschaft", "addressCountry": "CH" },
      { "@type": "AdministrativeArea", "name": "Schaffhausen", "addressCountry": "CH" },
      { "@type": "AdministrativeArea", "name": "Appenzell Ausserrhoden", "addressCountry": "CH" },
      { "@type": "AdministrativeArea", "name": "Appenzell Innerrhoden", "addressCountry": "CH" },
      { "@type": "AdministrativeArea", "name": "St. Gallen", "addressCountry": "CH" },
      { "@type": "AdministrativeArea", "name": "Graubünden", "addressCountry": "CH" },
      { "@type": "AdministrativeArea", "name": "Aargau", "addressCountry": "CH" },
      { "@type": "AdministrativeArea", "name": "Thurgau", "addressCountry": "CH" },
      { "@type": "AdministrativeArea", "name": "Ticino", "addressCountry": "CH" },
      { "@type": "AdministrativeArea", "name": "Vaud", "addressCountry": "CH" },
      { "@type": "AdministrativeArea", "name": "Valais", "addressCountry": "CH" },
      { "@type": "AdministrativeArea", "name": "Neuchâtel", "addressCountry": "CH" },
      { "@type": "AdministrativeArea", "name": "Genève", "addressCountry": "CH" },
      { "@type": "AdministrativeArea", "name": "Jura", "addressCountry": "CH" }
    ],
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
    ],
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday"
      ],
      "opens": "09:00",
      "closes": "17:00"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "email": "contact@swissai.tax",
      "contactType": "customer service",
      "areaServed": "CH",
      "availableLanguage": ["de", "fr", "it", "en"]
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

export default LocalBusinessSchema;
