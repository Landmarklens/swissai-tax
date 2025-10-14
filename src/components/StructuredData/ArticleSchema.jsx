import React from 'react';
import { Helmet } from 'react-helmet-async';
import PropTypes from 'prop-types';

/**
 * ArticleSchema - Structured data for blog posts and articles
 *
 * This component generates Schema.org Article structured data for blog posts,
 * helping search engines understand the content, author, and publication dates.
 *
 * @component
 * @param {Object} props
 * @param {string} props.title - The article headline/title
 * @param {string} props.description - A brief description or excerpt of the article
 * @param {string} props.image - URL to the article's main image
 * @param {string} props.datePublished - ISO 8601 date when the article was first published
 * @param {string} [props.dateModified] - ISO 8601 date when the article was last modified
 * @param {string} [props.author="SwissAI Tax Team"] - Author name
 * @param {string} [props.url] - Canonical URL of the article
 * @param {string} [props.category] - Article category/section
 *
 * @example
 * <ArticleSchema
 *   title="How to File Swiss Taxes Online"
 *   description="A comprehensive guide to filing your Swiss taxes online..."
 *   image="https://swissai.tax/blog/tax-filing-guide.jpg"
 *   datePublished="2024-01-15T09:00:00+01:00"
 *   dateModified="2024-02-10T14:30:00+01:00"
 *   author="Jane Smith"
 *   url="https://swissai.tax/blog/how-to-file-swiss-taxes"
 *   category="Rental"
 * />
 */
const ArticleSchema = ({
  title,
  description,
  image,
  datePublished,
  dateModified,
  author = "SwissAI Tax Team",
  url,
  category
}) => {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": title,
    "description": description,
    "image": image,
    "datePublished": datePublished,
    "dateModified": dateModified || datePublished,
    "author": {
      "@type": "Person",
      "name": author
    },
    "publisher": {
      "@type": "Organization",
      "name": "SwissAI Tax",
      "legalName": "LandMarK Lens GMBH",
      "logo": {
        "@type": "ImageObject",
        "url": "https://swissai.tax/logo.png",
        "width": 600,
        "height": 60
      },
      "url": "https://swissai.tax",
      "email": "contact@swissai.tax",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Sandbuckstrasse 24",
        "addressLocality": "Schneisingen",
        "postalCode": "5425",
        "addressCountry": "CH"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": url || (typeof window !== 'undefined' ? window.location.href : '')
    },
    ...(category && { "articleSection": category }),
    "inLanguage": "en-US"
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schemaData)}
      </script>
    </Helmet>
  );
};

ArticleSchema.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  image: PropTypes.string.isRequired,
  datePublished: PropTypes.string.isRequired,
  dateModified: PropTypes.string,
  author: PropTypes.string,
  url: PropTypes.string,
  category: PropTypes.string
};

export default ArticleSchema;
