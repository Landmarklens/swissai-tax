import axios from 'axios';
import config from '../config/environments';

const API_URL = process.env.REACT_APP_API_BASE_URL || config.API_BASE_URL || 'https://api.swissai.tax';

/**
 * Session Management Service
 * Handles all session-related API calls
 */
const sessionService = {
  /**
   * Get all active sessions for current user
   * @returns {Promise<Object>} { success, data: { sessions: [...], count: number } }
   */
  getSessions: async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/sessions`,
        { withCredentials: true }
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error('[Sessions] Failed to get sessions:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to retrieve sessions'
      };
    }
  },

  /**
   * Revoke a specific session
   * @param {string} sessionId - UUID of the session to revoke
   * @returns {Promise<Object>} Success or error response
   */
  revokeSession: async (sessionId) => {
    try {
      const response = await axios.delete(
        `${API_URL}/api/sessions/${sessionId}`,
        { withCredentials: true }
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error('[Sessions] Failed to revoke session:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to revoke session'
      };
    }
  },

  /**
   * Revoke all sessions except the current one
   * @returns {Promise<Object>} { success, data: { message, count } }
   */
  revokeAllOtherSessions: async () => {
    try {
      const response = await axios.post(
        `${API_URL}/api/sessions/revoke-all`,
        {},
        { withCredentials: true }
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error('[Sessions] Failed to revoke all sessions:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to revoke sessions'
      };
    }
  },

  /**
   * Get count of active sessions
   * @returns {Promise<Object>} { success, data: { count: number } }
   */
  getSessionCount: async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/sessions/count`,
        { withCredentials: true }
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error('[Sessions] Failed to get session count:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to get session count'
      };
    }
  }
};

export default sessionService;
