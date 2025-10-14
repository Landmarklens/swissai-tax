import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

const SEOHelmet = ({
  titleKey,
  descriptionKey,
  title, // Direct title if not using translation key
  description, // Direct description if not using translation key
  keywords,
  image,
  type = 'website',
  noindex = false,
  children
}) => {
  const { t, i18n } = useTranslation();
  const location = useLocation();

  // Get current path without language prefix
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const currentLang = ['en', 'de', 'fr', 'it'].includes(pathSegments[0]) ? pathSegments[0] : 'en';
  const pathWithoutLang = '/' + pathSegments.slice(1).join('/');

  // Resolve title and description
  const pageTitle = title || (titleKey ? t(titleKey) : 'SwissAI Tax - AI-Powered Swiss Tax Filing');
  const pageDescription = description || (descriptionKey ? t(descriptionKey) : 'Simplify your Swiss tax filing with AI. Complete your tax declaration in 20 minutes. Swiss tax software for all cantons - secure, accurate, and multilingual.');

  // Build canonical URL
  const baseUrl = 'https://swissai.tax';
  const canonicalUrl = `${baseUrl}/${currentLang}${pathWithoutLang}`;

  // Default image for social sharing
  const ogImage = image || `${baseUrl}/images/og-image.png`;

  // Language mappings for hreflang
  const languageLocales = {
    'de': 'de-CH',
    'fr': 'fr-CH',
    'it': 'it-CH',
    'en': 'en'
  };

  return (
    <Helmet>
      {/* Dynamic language attribute */}
      <html lang={i18n.language} />

      {/* Primary Meta Tags */}
      <title>{pageTitle}</title>
      <meta name="title" content={pageTitle} />
      <meta name="description" content={pageDescription} />
      {keywords && <meta name="keywords" content={keywords} />}

      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Hreflang Tags for Language/Region Targeting */}
      <link rel="alternate" hreflang="de-CH" href={`${baseUrl}/de${pathWithoutLang}`} />
      <link rel="alternate" hreflang="fr-CH" href={`${baseUrl}/fr${pathWithoutLang}`} />
      <link rel="alternate" hreflang="it-CH" href={`${baseUrl}/it${pathWithoutLang}`} />
      <link rel="alternate" hreflang="en" href={`${baseUrl}/en${pathWithoutLang}`} />
      <link rel="alternate" hreflang="x-default" href={`${baseUrl}/en${pathWithoutLang}`} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:locale" content={languageLocales[currentLang] || 'en_US'} />
      <meta property="og:site_name" content="SwissAI Tax" />

      {/* Alternate locales for Open Graph */}
      <meta property="og:locale:alternate" content="de_CH" />
      <meta property="og:locale:alternate" content="fr_CH" />
      <meta property="og:locale:alternate" content="it_CH" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@swissaitax" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={ogImage} />

      {/* Robots */}
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Geographic targeting - Switzerland */}
      <meta name="geo.region" content="CH" />
      <meta name="geo.placename" content="Switzerland" />
      <meta name="geo.position" content="46.8182;8.2275" />
      <meta name="ICBM" content="46.8182, 8.2275" />

      {/* Additional geographic and language targeting */}
      <meta name="language" content={i18n.language} />
      <meta name="target" content="all" />
      <meta name="audience" content="all" />
      <meta name="distribution" content="global" />
      <meta name="country" content="Switzerland" />

      {/* Additional children elements */}
      {children}
    </Helmet>
  );
};

export default SEOHelmet;