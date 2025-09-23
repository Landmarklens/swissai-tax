import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const API_URL = API_BASE_URL;

/**
 * Fetch landlord platform statistics
 * @returns {Promise<Object>} Landlord statistics data
 */
export const getLandlordStats = async () => {
  console.log('[DEBUG] Fetching landlord stats from:', `${API_URL}/api/landlord-stats/`);

  try {
    const response = await axios.get(`${API_URL}/api/landlord-stats/`);
    console.log('[DEBUG] Landlord stats response:', response.data);
    return response.data;
  } catch (error) {
    console.error('[DEBUG] Error fetching landlord stats:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      url: `${API_URL}/api/landlord-stats/`
    });

    // Return default values on error
    const defaultStats = {
      properties_managed: 450,
      successful_rentals: 42,
      active_landlords: 120,
      applications_processed: 1800,
      average_time_saved: 8.5,
      avg_vacancy_reduction: 14,
      tenant_satisfaction_rate: 93.5
    };

    console.log('[DEBUG] Using default landlord stats:', defaultStats);
    return defaultStats;
  }
};