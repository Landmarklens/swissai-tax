import { Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import LanguageWrapper from '../components/LanguageWrapper/LanguageWrapper';
import { NAVIGATION_ROUTE } from '../constants';
import NotFound from '../pages/NotFound';

const LanguageAwareRoutes = () => {
  const { t } = useTranslation();
  const { i18n } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Check if current path has no language prefix
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const hasLanguagePrefix = pathSegments[0] && ['en', 'de', 'fr', 'it'].includes(pathSegments[0]);

  // If no language prefix and we're not on root, redirect to current language version
  if (!hasLanguagePrefix && location.pathname !== '/') {
    const currentLang = i18n.language || 'en';
    const newPath = `/${currentLang}${location.pathname}`;
    return <Navigate to={newPath} replace />;
  }

  // If on root, redirect to language-specific root
  if (location.pathname === '/') {
    const currentLang = localStorage.getItem('i18nextLng') || 'en';
    return <Navigate to={`/${currentLang}`} replace />;
  }

  return (
    <Routes>
      {/* Language-prefixed routes */}
      <Route path="/:lang" element={<LanguageWrapper />}>
        {NAVIGATION_ROUTE.map((route, index) => {
          // Map root path to language root
          const routePath = route.path === '/' ? '' : route.path;
          return (
            <Route key={`lang-${index}`} path={routePath} element={route.element} />
          );
        })}
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Catch-all redirect to language-prefixed version */}
      <Route path="*" element={<Navigate to="/en" replace />} />
    </Routes>
  );
};

export default LanguageAwareRoutes;