import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

/**
 * Interview API Client
 * Handles all API calls related to the interview process
 */

/**
 * Create a new interview session
 * @param {string} userId - User ID
 * @param {number} taxYear - Tax year
 * @param {string} language - Language code (en, de, fr, it)
 * @returns {Promise<import('../types/interview').InterviewSession>}
 */
export const createSession = async (userId, taxYear, language = 'en') => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/interview/sessions`,
      {
        user_id: userId,
        tax_year: taxYear,
        language
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating interview session:', error);
    throw error;
  }
};

/**
 * Get an existing interview session
 * @param {string} sessionId - Session ID
 * @returns {Promise<import('../types/interview').InterviewSession>}
 */
export const getSession = async (sessionId) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/interview/sessions/${sessionId}`,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching interview session:', error);
    throw error;
  }
};

/**
 * Submit an answer to the current question
 * @param {string} sessionId - Session ID
 * @param {string} questionId - Question ID
 * @param {any} answer - Answer value
 * @param {Object} [additionalData] - Additional data (e.g., extracted_data)
 * @returns {Promise<import('../types/interview').InterviewSession>}
 */
export const submitAnswer = async (sessionId, questionId, answer, additionalData = {}) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/interview/sessions/${sessionId}/answer`,
      {
        question_id: questionId,
        answer,
        ...additionalData
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error submitting answer:', error);
    throw error;
  }
};

/**
 * Upload a document for a question
 * @param {string} sessionId - Session ID
 * @param {string} questionId - Question ID
 * @param {FormData} formData - Form data with file
 * @param {Object} [options] - Additional options
 * @param {function} [options.onUploadProgress] - Progress callback
 * @returns {Promise<import('../types/interview').UploadResponse>}
 */
export const uploadDocument = async (sessionId, questionId, formData, options = {}) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/interview/sessions/${sessionId}/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: options.onUploadProgress,
        timeout: 60000 // 60 second timeout for large files
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
};

/**
 * Calculate taxes for a completed interview
 * @param {string} sessionId - Session ID
 * @param {boolean} [ignorePendingDocuments] - Whether to ignore pending documents
 * @returns {Promise<{filing_id: string, calculations: Object}>}
 */
export const calculateTaxes = async (sessionId, ignorePendingDocuments = false) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/calculate`,
      {
        session_id: sessionId,
        ignore_pending_documents: ignorePendingDocuments
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error calculating taxes:', error);
    throw error;
  }
};

/**
 * Resume an existing interview session
 * @param {string} sessionId - Session ID
 * @returns {Promise<import('../types/interview').InterviewSession>}
 */
export const resumeSession = async (sessionId) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/interview/sessions/${sessionId}/resume`,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error resuming session:', error);
    throw error;
  }
};

export default {
  createSession,
  getSession,
  submitAnswer,
  uploadDocument,
  calculateTaxes,
  resumeSession
};
