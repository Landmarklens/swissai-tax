import { Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect, lazy, Suspense } from 'react';
import LanguageWrapper from '../components/LanguageWrapper/LanguageWrapper';
import { LAZY_NAVIGATION_ROUTE } from '../constants/lazyRoutes';
import { CircularProgress, Box } from '@mui/material';

// Lazy load NotFound page
const NotFound = lazy(() => import('../pages/NotFound'));

const AppRoutesWithLanguage = () => {
  const { i18n, t } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    // Scroll to top immediately and forcefully
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    // Backup scroll after a short delay to ensure it happens after render
    setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, 0);
    // Update document title - this will be replaced with SEOHelmet later
    document.title = t("filing.swisstax");
  }, [location.pathname, t]);

  // Get current language from URL or fallback
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const urlLang = ['en', 'de', 'fr', 'it'].includes(pathSegments[0]) ? pathSegments[0] : null;

  // Handle root path redirect
  if (location.pathname === '/') {
    const savedLang = localStorage.getItem('i18nextLng');
    const defaultLang = savedLang && ['en', 'de', 'fr', 'it'].includes(savedLang) ? savedLang : 'en';
    return <Navigate to={`/${defaultLang}`} replace />;
  }

  // Handle missing language prefix - redirect to current language version
  if (!urlLang) {
    const currentLang = i18n.language || localStorage.getItem('i18nextLng') || 'en';
    const newPath = `/${currentLang}${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={newPath} replace />;
  }

  return (
    <Suspense fallback={
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    }>
      <Routes>
        {/* Language-prefixed routes */}
        <Route path="/:lang" element={<LanguageWrapper />}>
          {LAZY_NAVIGATION_ROUTE.map((route, index) => {
            // Convert absolute paths to relative paths for nested routing
            let routePath;
            if (route.path === '/') {
              routePath = '';
            } else if (route.path.startsWith('/')) {
              // Remove leading slash for nested routes
              routePath = route.path.substring(1);
            } else {
              routePath = route.path;
            }
            return (
              <Route key={`route-${index}`} path={routePath} element={route.element} />
            );
          })}
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Legacy routes - redirect to language-prefixed versions */}
        {LAZY_NAVIGATION_ROUTE.map((route, index) => {
          if (route.path !== '/') {
            return (
              <Route
                key={`legacy-${index}`}
                path={route.path}
                element={<Navigate to={`/en${route.path}`} replace />}
              />
            );
          }
          return null;
        })}

        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutesWithLanguage;