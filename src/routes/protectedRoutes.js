import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { useTranslation } from 'react-i18next';
export default function ProtectedRoutes({ children }) {
  const { t } = useTranslation();
  const { isAuthenticated, loading } = useAuth();
  const { lang } = useParams();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    // Preserve language when redirecting to homepage
    const currentLang = lang || localStorage.getItem('i18nextLng') || 'en';
    return <Navigate to={`/${currentLang}`} replace />;
  }

  return children;
}
