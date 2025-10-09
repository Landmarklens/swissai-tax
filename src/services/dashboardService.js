/**
 * Dashboard Service
 * Handles dashboard data retrieval for SwissAI Tax
 */

import { dashboardAPI } from './api';
import { useTranslation } from 'react-i18next';

const dashboardService = {
  /**
   * Get dashboard data including active/past filings, stats, and reminders
   * @returns {Promise} Dashboard data
   */
  getDashboardData: async () => {
    try {
      const response = await dashboardAPI.getDashboard();
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch dashboard data'
      };
    }
  },

  /**
   * Format dashboard data for display
   * @param {Object} dashboardData - Raw dashboard data
   * @returns {Object} Formatted dashboard data
   */
  formatDashboardData: (dashboardData) => {
    if (!dashboardData) return null;

    return {
      activeFilings: dashboardData.active_filings || [],
      pastFilings: dashboardData.past_filings || [],
      stats: {
        totalFilings: dashboardData.stats?.total_filings || 0,
        totalRefunds: dashboardData.stats?.total_refunds || 0,
        daysUntilDeadline: dashboardData.stats?.days_until_deadline || 0,
        deadline: dashboardData.stats?.deadline || null
      },
      reminders: dashboardData.reminders || []
    };
  }
};

export default dashboardService;
