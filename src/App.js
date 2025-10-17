import 'leaflet/dist/leaflet.css';
import './App.css';
import 'react-toastify/dist/ReactToastify.css';
import { BrowserRouter } from 'react-router-dom';
import AppRoutesWithLanguage from './routes/AppRoutesWithLanguage';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from './theme/theme';
import { HelmetProvider } from 'react-helmet-async';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import { ToastContainer } from 'react-toastify';
import { useWebVitals } from './hooks/useWebVitals';
import CookieConsent from './components/CookieConsent';

function App() {
  // Monitor Core Web Vitals - disabled to reduce console noise
  useWebVitals(null, false);
  return (
    <ErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
      <ThemeProvider theme={theme}>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <HelmetProvider>
            <AppRoutesWithLanguage />
            <CookieConsent />
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
            />
          </HelmetProvider>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
export default App;
