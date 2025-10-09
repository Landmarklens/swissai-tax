import { API_BASE_URL } from '../config/api';
import { useTranslation } from 'react-i18next';

class FAQService {
  /**
   * Get all FAQs for a specific user type
   * @param {string} userType - 'landlord' or 'tenant'
   */
  async getAllFAQs(userType) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/faq/?user_type=${userType}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      throw error;
    }
  }

  /**
   * Get FAQ categories for a user type
   * @param {string} userType - 'landlord' or 'tenant'
   */
  async getCategories(userType) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/faq/categories?user_type=${userType}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching FAQ categories:', error);
      throw error;
    }
  }

  /**
   * Search FAQs by keyword
   * @param {string} userType - 'landlord' or 'tenant'
   * @param {string} query - Search query
   */
  async searchFAQs(userType, query) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/faq/search?user_type=${userType}&q=${encodeURIComponent(query)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error searching FAQs:', error);
      throw error;
    }
  }

  /**
   * Get popular FAQs
   * @param {string} userType - 'landlord' or 'tenant'
   * @param {number} limit - Number of FAQs to return
   */
  async getPopularFAQs(userType, limit = 5) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/faq/popular?user_type=${userType}&limit=${limit}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching popular FAQs:', error);
      throw error;
    }
  }

  /**
   * Get FAQs for a specific category
   * @param {string} userType - 'landlord' or 'tenant'
   * @param {string} categoryName - Category name
   */
  async getCategoryFAQs(userType, categoryName) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/faq/category/${encodeURIComponent(categoryName)}?user_type=${userType}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching category FAQs:', error);
      throw error;
    }
  }

  /**
   * Get a specific FAQ by ID
   * @param {string} userType - 'landlord' or 'tenant'
   * @param {string} faqId - FAQ ID
   */
  async getFAQById(userType, faqId) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/faq/${faqId}?user_type=${userType}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching FAQ by ID:', error);
      throw error;
    }
  }

  /**
   * Get related FAQs
   * @param {string} userType - 'landlord' or 'tenant'
   * @param {string} faqId - FAQ ID
   * @param {number} limit - Number of related FAQs
   */
  async getRelatedFAQs(userType, faqId, limit = 3) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/faq/${faqId}/related?user_type=${userType}&limit=${limit}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching related FAQs:', error);
      throw error;
    }
  }

  /**
   * Get FAQ statistics
   */
  async getStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/faq/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching FAQ stats:', error);
      throw error;
    }
  }

  /**
   * Clear FAQ cache (admin only)
   * @param {string} token - Auth token
   */
  async clearCache(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/faq/cache/clear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error clearing FAQ cache:', error);
      throw error;
    }
  }
}

export default new FAQService();