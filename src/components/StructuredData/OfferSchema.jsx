import React from 'react';
import { Helmet } from 'react-helmet-async';
import PropTypes from 'prop-types';

/**
 * OfferSchema - Structured data for subscription plans and pricing
 *
 * This component generates Schema.org Offer structured data for pricing plans,
 * helping search engines understand the services and pricing offered by SwissAI Tax.
 * This can appear in search results with pricing information.
 *
 * @component
 * @param {Object} props
 * @param {string} props.name - Name of the subscription plan (e.g., "Basic Plan", "Premium Plan")
 * @param {string|number} props.price - Price of the plan (e.g., "49" or "Free")
 * @param {string} [props.currency="CHF"] - Currency code (ISO 4217)
 * @param {string} props.description - Description of what the plan includes
 * @param {string[]} [props.features] - Array of features included in the plan
 * @param {string} [props.pricingPeriod="MONTH"] - Billing period (MONTH, YEAR, ONE_TIME)
 * @param {string} [props.url] - URL to the pricing/checkout page
 * @param {string} [props.availability="InStock"] - Availability status
 *
 * @example
 * <OfferSchema
 *   name="Premium Plan"
 *   price="99"
 *   currency="CHF"
 *   description="Complete tax filing with expert support"
 *   features={["AI-powered filing", "Expert review", "Priority support"]}
 *   pricingPeriod="YEAR"
 *   url="https://swissai.tax/pricing/premium"
 * />
 */
const OfferSchema = ({
  name,
  price,
  currency = "CHF",
  description,
  features = [],
  pricingPeriod = "MONTH",
  url,
  availability = "InStock"
}) => {
  // Convert pricingPeriod to Schema.org format
  const billingPeriodMap = {
    "MONTH": "P1M",
    "YEAR": "P1Y",
    "ONE_TIME": null
  };

  // Determine if it's a free plan
  const isFree = price === 0 || price === "0" || price === "Free" || price === "free";

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Offer",
    "name": name,
    "description": description,
    "price": isFree ? "0" : price.toString(),
    "priceCurrency": currency,
    "url": url || `https://swissai.tax/pricing`,
    "availability": `https://schema.org/${availability}`,
    "seller": {
      "@type": "Organization",
      "name": "SwissAI Tax",
      "legalName": "LandMarK Lens GMBH",
      "url": "https://swissai.tax",
      "email": "contact@swissai.tax"
    },
    "itemOffered": {
      "@type": "Service",
      "name": name,
      "description": description,
      "provider": {
        "@type": "Organization",
        "name": "SwissAI Tax",
        "legalName": "LandMarK Lens GMBH"
      },
      "serviceType": "Tax Preparation and Filing",
      "areaServed": {
        "@type": "Country",
        "name": "Switzerland"
      }
    },
    "category": "Financial Services"
  };

  // Add billing period if not one-time
  if (billingPeriodMap[pricingPeriod]) {
    schemaData.priceSpecification = {
      "@type": "UnitPriceSpecification",
      "price": isFree ? "0" : price.toString(),
      "priceCurrency": currency,
      "billingDuration": billingPeriodMap[pricingPeriod],
      "billingIncrement": 1
    };
  }

  // Add features if provided
  if (features && features.length > 0) {
    schemaData.itemOffered.offers = features.map(feature => ({
      "@type": "Offer",
      "itemOffered": {
        "@type": "Service",
        "name": feature
      }
    }));
  }

  // Add valid from date (current date)
  schemaData.validFrom = new Date().toISOString();

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schemaData)}
      </script>
    </Helmet>
  );
};

OfferSchema.propTypes = {
  name: PropTypes.string.isRequired,
  price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  currency: PropTypes.string,
  description: PropTypes.string.isRequired,
  features: PropTypes.arrayOf(PropTypes.string),
  pricingPeriod: PropTypes.oneOf(["MONTH", "YEAR", "ONE_TIME"]),
  url: PropTypes.string,
  availability: PropTypes.oneOf([
    "InStock",
    "OutOfStock",
    "PreOrder",
    "Discontinued",
    "LimitedAvailability"
  ])
};

export default OfferSchema;
