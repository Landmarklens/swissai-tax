/**
 * Normalizes different error response formats into a consistent structure
 * @param {Error|Object} error - The error object from axios or other sources
 * @returns {Object} Normalized error object with message and code
 */
export const normalizeError = (error) => {
  // Handle axios response errors
  if (error.response?.data) {
    const data = error.response.data;
    
    // Backend format: { detail: "...", error_code: "..." }
    if (data.detail) {
      return {
        message: data.detail,
        code: data.error_code || 'UNKNOWN_ERROR',
        status: error.response.status
      };
    }
    
    // Backend format: { error: "...", code: "..." }
    if (data.error) {
      return {
        message: data.error,
        code: data.code || 'UNKNOWN_ERROR',
        status: error.response.status
      };
    }
    
    // Backend format: { message: "..." }
    if (data.message) {
      return {
        message: data.message,
        code: data.code || 'UNKNOWN_ERROR',
        status: error.response.status
      };
    }
    
    // Fallback for any other format
    if (typeof data === 'string') {
      return {
        message: data,
        code: 'UNKNOWN_ERROR',
        status: error.response.status
      };
    }
  }
  
  // Handle network errors
  if (error.message) {
    return {
      message: error.message,
      code: 'NETWORK_ERROR',
      status: null
    };
  }
  
  // Fallback
  return {
    message: 'Something went wrong',
    code: 'UNKNOWN_ERROR',
    status: null
  };
};

/**
 * Checks if error is an authentication error
 * @param {Object} normalizedError - Normalized error object
 * @returns {boolean}
 */
export const isAuthError = (normalizedError) => {
  return normalizedError.status === 401 || 
         normalizedError.code === 'UNAUTHORIZED' ||
         normalizedError.code === 'TOKEN_EXPIRED';
};

/**
 * Checks if error is a validation error
 * @param {Object} normalizedError - Normalized error object
 * @returns {boolean}
 */
export const isValidationError = (normalizedError) => {
  return normalizedError.status === 422 || 
         normalizedError.status === 400 ||
         normalizedError.code === 'VALIDATION_ERROR';
};

/**
 * Gets user-friendly error message
 * @param {Object} normalizedError - Normalized error object
 * @returns {string}
 */
export const getUserFriendlyMessage = (normalizedError) => {
  const errorMessages = {
    'NETWORK_ERROR': 'Network error. Please check your connection.',
    'UNAUTHORIZED': 'Please log in to continue.',
    'TOKEN_EXPIRED': 'Your session has expired. Please log in again.',
    'NOT_FOUND': 'The requested resource was not found.',
    'SERVER_ERROR': 'Server error. Please try again later.',
    'RATE_LIMIT': 'Too many requests. Please slow down.',
  };
  
  return errorMessages[normalizedError.code] || normalizedError.message;
};