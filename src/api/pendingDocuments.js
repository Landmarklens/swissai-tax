import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

/**
 * Pending Documents API Client
 * Handles all API calls related to pending document management
 */

/**
 * Get all pending documents for a session
 * @param {string} sessionId - Interview session ID
 * @returns {Promise<{pending_documents: import('../types/interview').PendingDocument[], count: number}>}
 */
export const getPendingDocuments = async (sessionId) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/interview/sessions/${sessionId}/pending-documents`,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching pending documents:', error);
    throw error;
  }
};

/**
 * Upload a pending document
 * @param {string} sessionId - Interview session ID
 * @param {string} documentId - Pending document UUID
 * @param {FormData} formData - Form data with file
 * @param {Object} [options] - Additional options
 * @param {function} [options.onUploadProgress] - Progress callback
 * @returns {Promise<import('../types/interview').UploadResponse>}
 */
export const uploadPendingDocument = async (
  sessionId,
  documentId,
  formData,
  options = {}
) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/interview/sessions/${sessionId}/pending-documents/${documentId}/upload`,
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
    console.error('Error uploading pending document:', error);
    throw error;
  }
};

/**
 * Mark a pending document as not needed (delete)
 * @param {string} sessionId - Interview session ID
 * @param {string} documentId - Pending document UUID
 * @returns {Promise<{success: boolean}>}
 */
export const deletePendingDocument = async (sessionId, documentId) => {
  try {
    const response = await axios.delete(
      `${API_BASE_URL}/api/interview/sessions/${sessionId}/pending-documents/${documentId}`,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error deleting pending document:', error);
    throw error;
  }
};

/**
 * Check if a session has any pending documents
 * @param {string} sessionId - Interview session ID
 * @returns {Promise<boolean>}
 */
export const hasPendingDocuments = async (sessionId) => {
  try {
    const data = await getPendingDocuments(sessionId);
    return data.pending_documents && data.pending_documents.length > 0;
  } catch (error) {
    console.error('Error checking pending documents:', error);
    return false;
  }
};

/**
 * Get count of pending documents
 * @param {string} sessionId - Interview session ID
 * @returns {Promise<number>}
 */
export const getPendingDocumentsCount = async (sessionId) => {
  try {
    const data = await getPendingDocuments(sessionId);
    return data.count || 0;
  } catch (error) {
    console.error('Error getting pending documents count:', error);
    return 0;
  }
};

export default {
  getPendingDocuments,
  uploadPendingDocument,
  deletePendingDocument,
  hasPendingDocuments,
  getPendingDocumentsCount
};
