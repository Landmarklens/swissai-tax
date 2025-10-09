import React, { createContext, useContext, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/**
 * Navigation Context for maintaining application state across module transitions
 */
const NavigationContext = createContext({
  navigationState: null,
  setNavigationState: () => {},
  navigateWithContext: () => {},
  getReturnPath: () => {},
  clearNavigationState: () => {}
});

export const useNavigationContext = () => {
  const { t } = useTranslation();
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigationContext must be used within NavigationProvider');
  }
  return context;
};

export const NavigationProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [navigationState, setNavigationState] = useState(null);

  /**
   * Navigate to a path with context preservation
   * @param {string} path - Target path
   * @param {object} context - Context to preserve
   */
  const navigateWithContext = useCallback((path, context = {}) => {
    const fullContext = {
      ...context,
      returnPath: location.pathname + location.search,
      timestamp: new Date().toISOString(),
      source: context.source || 'unknown'
    };

    setNavigationState(fullContext);

    // Store in session storage for persistence across page refreshes
    sessionStorage.setItem('navigationContext', JSON.stringify(fullContext));

    // Navigate with state
    navigate(path, { state: fullContext });
  }, [navigate, location]);

  /**
   * Get the return path from context
   */
  const getReturnPath = useCallback(() => {
    // Check current navigation state
    if (navigationState?.returnPath) {
      return navigationState.returnPath;
    }

    // Check location state (from react-router)
    if (location.state?.returnPath) {
      return location.state.returnPath;
    }

    // Check session storage
    try {
      const stored = sessionStorage.getItem('navigationContext');
      if (stored) {
        const context = JSON.parse(stored);
        if (context.returnPath) {
          return context.returnPath;
        }
      }
    } catch (error) {
      console.error('Failed to parse navigation context:', error);
    }

    // Default return path
    return '/owner-account/tenant-applications';
  }, [navigationState, location.state]);

  /**
   * Clear navigation state
   */
  const clearNavigationState = useCallback(() => {
    setNavigationState(null);
    sessionStorage.removeItem('navigationContext');
  }, []);

  // Restore navigation state from session storage on mount
  React.useEffect(() => {
    try {
      const stored = sessionStorage.getItem('navigationContext');
      if (stored && !navigationState) {
        setNavigationState(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to restore navigation context:', error);
    }
  }, []);

  const value = {
    navigationState,
    setNavigationState,
    navigateWithContext,
    getReturnPath,
    clearNavigationState
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

export default NavigationContext;