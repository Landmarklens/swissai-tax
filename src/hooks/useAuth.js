import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

const useAuth = () => {
  const { t } = useTranslation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);

  const auth = useSelector((state) => state.auth.isAuthenticated);
  const isLoading = useSelector((state) => state.auth.isLoading);

  useEffect(() => {
    if (auth) {
      setIsAuthenticated(auth);
      setLoading(isLoading);
    }
  }, [auth, isLoading]);

  return {
    isAuthenticated: auth,
    setIsAuthenticated,
    loading: isLoading,
    setLoading
  };
};

export default useAuth;
