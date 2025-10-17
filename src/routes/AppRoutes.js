import { Route, Routes, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

import { NAVIGATION_ROUTE } from '../constants';
import NotFound from '../pages/NotFound';
const AppRoutes = () => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "SwissAI Tax";
  }, [pathname]);
  return (
    <Routes>
      {NAVIGATION_ROUTE.map((route, index) => (
        <Route key={index} path={route.path} element={route.element} />
      ))}
      <Route path="*" element={<NotFound />}></Route>
    </Routes>
  );
};

export default AppRoutes;
