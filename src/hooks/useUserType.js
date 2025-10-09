import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Custom hook for managing user type (tenant/landlord) across the application
 * Syncs with localStorage to maintain consistency across pages
 */
export const useUserType = () => {
  const { t } = useTranslation();
  const [userType, setUserType] = useState(() => {
    // Check localStorage for existing preference
    const savedType = localStorage.getItem('globalUserType');
    // Also check the home page specific storage for consistency
    const homePageType = localStorage.getItem('homePageUserType');
    return savedType || homePageType || 'tenant';
  });

  // Update localStorage whenever userType changes
  useEffect(() => {
    localStorage.setItem('globalUserType', userType);
    // Also update homePageUserType for consistency with Home page
    localStorage.setItem('homePageUserType', userType);
  }, [userType]);

  const handleUserTypeChange = (newType) => {
    if (newType && newType !== userType) {
      setUserType(newType);

      // Dispatch custom event for other components to listen to
      window.dispatchEvent(new CustomEvent('userTypeChanged', {
        detail: { userType: newType }
      }));
    }
  };

  // Listen for user type changes from other components
  useEffect(() => {
    const handleGlobalUserTypeChange = (event) => {
      const newType = event.detail?.userType;
      if (newType && newType !== userType) {
        setUserType(newType);
      }
    };

    window.addEventListener('userTypeChanged', handleGlobalUserTypeChange);

    return () => {
      window.removeEventListener('userTypeChanged', handleGlobalUserTypeChange);
    };
  }, [userType]);

  return {
    userType,
    setUserType: handleUserTypeChange,
    isTenant: userType === 'tenant',
    isLandlord: userType === 'landlord'
  };
};

export default useUserType;