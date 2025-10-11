import { API_BASE_URL } from '../config/api';
import { useTranslation } from 'react-i18next';

class FAQService {
  /**
   * Get all FAQs
   */
  async getAllFAQs() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/faq/`, {
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
   * Get FAQ categories
   */
  async getCategories() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/faq/categories`, {
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
   * @param {string} query - Search query
   */
  async searchFAQs(query) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/faq/search?q=${encodeURIComponent(query)}`,
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
   * @param {number} limit - Number of FAQs to return
   */
  async getPopularFAQs(limit = 5) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/faq/popular?limit=${limit}`,
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
   * @param {string} categoryName - Category name
   */
  async getCategoryFAQs(categoryName) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/faq/category/${encodeURIComponent(categoryName)}`,
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
   * @param {string} faqId - FAQ ID
   */
  async getFAQById(faqId) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/faq/${faqId}`,
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
   * @param {string} faqId - FAQ ID
   * @param {number} limit - Number of related FAQs
   */
  async getRelatedFAQs(faqId, limit = 3) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/faq/${faqId}/related?limit=${limit}`,
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