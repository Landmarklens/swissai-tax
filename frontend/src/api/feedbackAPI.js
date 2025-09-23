import axios from 'axios';
import authService from '../services/authService';
import config from '../config/environments';

const API_URL = process.env.REACT_APP_API_BASE_URL || config.API_BASE_URL || 'https://api.homeai.ch';

/**
 * Submit feedback for a property recommendation
 * @param {Object} feedbackData - The feedback data
 * @param {number} feedbackData.propertyId - The property ID
 * @param {string} feedbackData.feedback - The feedback text
 * @param {number} feedbackData.rating - The rating (1-5)
 * @param {number} feedbackData.conversationId - Optional conversation ID
 * @returns {Promise<Object>} Feedback submission response
 */
export const submitPropertyFeedback = async (feedbackData) => {
  const user = authService.getCurrentUser();
  
  try {
    const response = await axios.post(
      `${API_URL}/property-feedback`,
      {
        property_id: feedbackData.propertyId,
        feedback_text: feedbackData.feedback,
        rating: feedbackData.rating,
        conversation_id: feedbackData.conversationId,
        recommendation_context: feedbackData.property
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.access_token}`
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('[FeedbackAPI] Failed to submit property feedback:', error);
    throw error;
  }
};

/**
 * Get feedback for a property
 * @param {number} propertyId - The property ID
 * @returns {Promise<Array>} Array of feedback items
 */
export const getPropertyFeedback = async (propertyId) => {
  const user = authService.getCurrentUser();
  
  try {
    const response = await axios.get(
      `${API_URL}/property-feedback/${propertyId}`,
      {
        headers: {
          Authorization: `Bearer ${user?.access_token}`
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('[FeedbackAPI] Failed to get property feedback:', error);
    throw error;
  }
};

/**
 * Update property feedback
 * @param {number} feedbackId - The feedback ID
 * @param {Object} updateData - The data to update
 * @returns {Promise<Object>} Updated feedback
 */
export const updatePropertyFeedback = async (feedbackId, updateData) => {
  const user = authService.getCurrentUser();
  
  try {
    const response = await axios.put(
      `${API_URL}/property-feedback/${feedbackId}`,
      updateData,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.access_token}`
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('[FeedbackAPI] Failed to update property feedback:', error);
    throw error;
  }
};

/**
 * Delete property feedback
 * @param {number} feedbackId - The feedback ID
 * @returns {Promise<Object>} Deletion response
 */
export const deletePropertyFeedback = async (feedbackId) => {
  const user = authService.getCurrentUser();
  
  try {
    const response = await axios.delete(
      `${API_URL}/property-feedback/${feedbackId}`,
      {
        headers: {
          Authorization: `Bearer ${user?.access_token}`
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('[FeedbackAPI] Failed to delete property feedback:', error);
    throw error;
  }
};

export default {
  submitPropertyFeedback,
  getPropertyFeedback,
  updatePropertyFeedback,
  deletePropertyFeedback
};