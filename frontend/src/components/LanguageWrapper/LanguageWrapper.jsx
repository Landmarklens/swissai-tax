import React, { useEffect } from 'react';
import { useParams, Navigate, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const SUPPORTED_LANGUAGES = ['en', 'de', 'fr', 'it'];

const LanguageWrapper = () => {
  const { lang } = useParams();
  const { i18n } = useTranslation();

  useEffect(() => {
    // Only change language if it's different from current
    if (SUPPORTED_LANGUAGES.includes(lang) && i18n.language !== lang) {
      i18n.changeLanguage(lang);
      // Store in localStorage for persistence
      localStorage.setItem('i18nextLng', lang);
    }
  }, [lang, i18n]);

  // If language is not supported, redirect to English
  if (!SUPPORTED_LANGUAGES.includes(lang)) {
    return <Navigate to="/en" replace />;
  }

  return <Outlet />;
};

export default LanguageWrapper;