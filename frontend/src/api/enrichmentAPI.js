import axios from 'axios';
import authService from '../services/authService';
import config from '../config/environments';

const API_URL = process.env.REACT_APP_API_BASE_URL || config.API_BASE_URL || 'https://api.homeai.ch';

/**
 * Get property enrichment data including amenities, facilities, and location data
 * @param {number} propertyId - The property ID
 * @returns {Promise<Object>} Enrichment data including amenities, facilities, taxes, etc.
 */
export const getPropertyEnrichment = async (propertyId) => {
  const user = authService.getCurrentUser();
  
  try {
    const response = await axios.get(
      `${API_URL}/properties/${propertyId}/enrichment`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.access_token}`
        },
        timeout: 30000
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('[EnrichmentAPI] Failed to get property enrichment:', error);
    
    // Return mock data for now if endpoint doesn't exist
    if (error.response?.status === 404) {
      return getMockEnrichmentData(propertyId);
    }
    
    throw error;
  }
};

/**
 * Get amenities for a property
 * @param {number} propertyId - The property ID
 * @returns {Promise<Object>} Amenities data
 */
export const getPropertyAmenities = async (propertyId) => {
  const user = authService.getCurrentUser();
  
  try {
    const response = await axios.get(
      `${API_URL}/properties/${propertyId}/amenities`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.access_token}`
        },
        timeout: 30000
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('[EnrichmentAPI] Failed to get property amenities:', error);
    
    // Return mock data for now if endpoint doesn't exist
    if (error.response?.status === 404) {
      return getMockAmenitiesData();
    }
    
    throw error;
  }
};

/**
 * Get facilities near a property
 * @param {number} propertyId - The property ID
 * @returns {Promise<Object>} Nearby facilities data
 */
export const getPropertyFacilities = async (propertyId) => {
  const user = authService.getCurrentUser();
  
  try {
    const response = await axios.get(
      `${API_URL}/properties/${propertyId}/facilities`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.access_token}`
        },
        timeout: 30000
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('[EnrichmentAPI] Failed to get property facilities:', error);
    
    // Return mock data for now if endpoint doesn't exist
    if (error.response?.status === 404) {
      return getMockFacilitiesData();
    }
    
    throw error;
  }
};

/**
 * Get tax information for a property
 * @param {number} propertyId - The property ID
 * @returns {Promise<Object>} Tax information
 */
export const getPropertyTaxes = async (propertyId) => {
  const user = authService.getCurrentUser();
  
  try {
    const response = await axios.get(
      `${API_URL}/properties/${propertyId}/taxes`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.access_token}`
        },
        timeout: 30000
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('[EnrichmentAPI] Failed to get property taxes:', error);
    
    // Return mock data for now if endpoint doesn't exist
    if (error.response?.status === 404) {
      return getMockTaxData();
    }
    
    throw error;
  }
};

// Mock data functions for development/fallback
const getMockEnrichmentData = (propertyId) => ({
  propertyId,
  amenities: getMockAmenitiesData(),
  facilities: getMockFacilitiesData(),
  taxes: getMockTaxData(),
  computed_at: new Date().toISOString()
});

const getMockAmenitiesData = () => ({
  indoor: [
    'Dishwasher',
    'Washing Machine',
    'Dryer',
    'Air Conditioning',
    'Heating',
    'Internet/WiFi',
    'Cable TV',
    'Elevator'
  ],
  outdoor: [
    'Balcony',
    'Garden',
    'Parking Space',
    'Garage',
    'Bicycle Storage'
  ],
  building: [
    'Gym',
    'Swimming Pool',
    'Concierge Service',
    'Security System',
    'Storage Room'
  ]
});

const getMockFacilitiesData = () => ({
  transportation: {
    public_transport: [
      { name: 'Zürich HB', type: 'train_station', distance: '2.5 km', time: '15 min' },
      { name: 'Paradeplatz', type: 'tram_stop', distance: '500 m', time: '5 min' }
    ],
    airports: [
      { name: 'Zürich Airport', distance: '12 km', time: '25 min by car' }
    ]
  },
  education: {
    schools: [
      { name: 'Primary School Zürich', level: 'primary', distance: '800 m' },
      { name: 'Gymnasium Zürich', level: 'secondary', distance: '1.2 km' }
    ],
    universities: [
      { name: 'ETH Zürich', distance: '3 km' },
      { name: 'University of Zürich', distance: '2.5 km' }
    ]
  },
  healthcare: {
    hospitals: [
      { name: 'University Hospital Zürich', distance: '2 km', emergency: true },
      { name: 'City Hospital', distance: '1.5 km', emergency: false }
    ],
    pharmacies: [
      { name: 'Apotheke Central', distance: '300 m' },
      { name: 'City Pharmacy', distance: '500 m' }
    ]
  },
  shopping: {
    supermarkets: [
      { name: 'Migros', distance: '200 m' },
      { name: 'Coop', distance: '400 m' }
    ],
    shopping_centers: [
      { name: 'Glattzentrum', distance: '5 km' }
    ]
  },
  leisure: {
    parks: [
      { name: 'Stadtpark', distance: '600 m' },
      { name: 'Lake Zürich', distance: '1 km' }
    ],
    sports: [
      { name: 'Fitness Park', type: 'gym', distance: '500 m' },
      { name: 'Tennis Club Zürich', type: 'tennis', distance: '1.5 km' }
    ],
    restaurants: [
      { name: 'Restaurant Swiss', cuisine: 'Swiss', distance: '100 m' },
      { name: 'Pizzeria Roma', cuisine: 'Italian', distance: '300 m' }
    ]
  }
});

const getMockTaxData = () => ({
  annual_property_tax: 2400,
  tax_rate: 0.8,
  municipality: 'Zürich',
  canton: 'Zürich',
  additional_fees: {
    waste_disposal: 240,
    water: 360,
    building_insurance: 480
  },
  total_annual_cost: 3480,
  currency: 'CHF'
});

export default {
  getPropertyEnrichment,
  getPropertyAmenities,
  getPropertyFacilities,
  getPropertyTaxes
};