// Type definitions for recommendations

/**
 * @typedef {Object} Property
 * @property {number} id
 * @property {string} title
 * @property {string} address
 * @property {number} price
 * @property {number} bedrooms
 * @property {number} bathrooms
 * @property {number} area
 * @property {string} description
 * @property {string[]} images
 * @property {Object} location
 * @property {number} location.lat
 * @property {number} location.lng
 */

/**
 * @typedef {Object} TravelInfo
 * @property {string} destination_name
 * @property {number} duration_minutes
 * @property {number} distance_km
 * @property {string} transport_mode
 * @property {string} computed_at
 */

/**
 * @typedef {Object} TaxInfo
 * @property {number} annual_tax_euros
 * @property {number} annual_tax_local_currency
 * @property {string} local_currency
 * @property {number} percentage_of_annual_income
 * @property {string} computed_at
 */

/**
 * @typedef {Object} EnrichmentMetadata
 * @property {string} version
 * @property {number} completeness
 * @property {boolean} cache_hit
 */

/**
 * @typedef {Object} EnrichmentData
 * @property {TravelInfo} [work_travel]
 * @property {TravelInfo} [family_travel]
 * @property {TaxInfo} [tax_burden]
 * @property {Object.<string, number>} amenities_within_1000m
 * @property {number} [distance_to_hospital_m]
 * @property {number} [distance_to_pharmacy_m]
 * @property {number} [distance_to_supermarket_m]
 * @property {number} [distance_to_school_m]
 */

/**
 * @typedef {Object} MissingField
 * @property {string} field
 * @property {string} reason
 * @property {string[]} [required_data]
 */

/**
 * @typedef {Object} Enrichment
 * @property {EnrichmentMetadata} metadata
 * @property {EnrichmentData} data
 * @property {MissingField[]} missing_fields
 */

/**
 * @typedef {Object} EnrichedRecommendation
 * @property {Property} property
 * @property {Enrichment} enrichment
 * @property {number} [matchScore]
 */

/**
 * @typedef {Object} LegacyRecommendation
 * @property {number} id
 * @property {Property} property
 * @property {number} rank
 * @property {number} ai_confidence
 */

export const RecommendationTypes = {
  Property: 'Property',
  TravelInfo: 'TravelInfo',
  TaxInfo: 'TaxInfo',
  EnrichmentMetadata: 'EnrichmentMetadata',
  EnrichmentData: 'EnrichmentData',
  MissingField: 'MissingField',
  Enrichment: 'Enrichment',
  EnrichedRecommendation: 'EnrichedRecommendation',
  LegacyRecommendation: 'LegacyRecommendation'
};