import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const BreadcrumbSchema = ({ items }) => {
  const { i18n, t } = useTranslation();
  const location = useLocation();
  const currentLang = i18n.language;
  const baseUrl = 'https://homeai.ch';

  // Default breadcrumb based on current path if items not provided
  const generateDefaultBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [
      {
        name: 'Home',
        url: `${baseUrl}/${currentLang}`
      }
    ];

    // Skip language segment
    const segments = pathSegments.slice(1);

    segments.forEach((segment, index) => {
      const path = segments.slice(0, index + 1).join('/');
      const name = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
      breadcrumbs.push({
        name: name,
        url: `${baseUrl}/${currentLang}/${path}`
      });
    });

    return breadcrumbs;
  };

  const breadcrumbItems = items || generateDefaultBreadcrumbs();

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbItems.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schemaData)}
      </script>
    </Helmet>
  );
};

export default BreadcrumbSchema;