// Utility function to extract error message from various error response formats
export const getErrorMessage = (error, defaultMessage = 'Something went wrong') => {
  // If error has already been processed by axios interceptor
  if (error.processed) {
    return error.message || defaultMessage;
  }

  // Handle different error structures
  if (error.response?.data) {
    const data = error.response.data;
    
    // Try different fields in order of preference
    if (data.error) return data.error;
    if (data.detail) {
      // Handle array of validation errors
      if (Array.isArray(data.detail)) {
        return data.detail.map(err => err.msg || err.message || err).join(', ');
      }
      return data.detail;
    }
    if (data.message) return data.message;
  }
  
  // Fallback to error message or default
  return error.message || defaultMessage;
};

// Mark error as processed to avoid double handling
export const markErrorAsProcessed = (error) => {
  if (error && typeof error === 'object') {
    error.processed = true;
  }
  return error;
};