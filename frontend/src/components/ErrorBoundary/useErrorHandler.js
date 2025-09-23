import { useState, useCallback } from 'react';

/**
 * Custom hook for error handling in functional components
 * Provides error state management and error throwing capability
 */
export const useErrorHandler = () => {
  const [error, setError] = useState(null);

  // Reset error state
  const resetError = useCallback(() => {
    setError(null);
  }, []);

  // Throw error to be caught by ErrorBoundary
  const throwError = useCallback((error) => {
    setError(error);
    throw error;
  }, []);

  // Handle async errors
  const handleAsyncError = useCallback((error) => {
    console.error('Async error caught:', error);
    setError(error);
    
    // Optionally show a toast or alert
    // toast.error(error.message || 'An error occurred');
  }, []);

  // Wrap async functions to catch errors
  const wrapAsync = useCallback((asyncFn) => {
    return async (...args) => {
      try {
        return await asyncFn(...args);
      } catch (error) {
        handleAsyncError(error);
        throw error;
      }
    };
  }, [handleAsyncError]);

  return {
    error,
    resetError,
    throwError,
    handleAsyncError,
    wrapAsync
  };
};