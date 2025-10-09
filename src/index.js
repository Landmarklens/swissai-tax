import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Provider } from 'react-redux';
import { HiddenItemsProvider } from './hooks/useHideSearchedProperty/useHiddenItems';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistedStore } from './store';
import './i18n';
import './config/axiosConfig'; // Initialize axios configuration
import { initializeAnalytics, setupConsentListener } from './utils/cookieConsent/analyticsIntegration';

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

// SwissAI Tax - Development mode
if (process.env.NODE_ENV === 'development') {
}

// Load Google Auth debug tools
import('./utils/googleAuthDebug');
setupConsentListener();
initializeAnalytics();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Provider store={store}>
    <HiddenItemsProvider>
      <PersistGate loading={null} persistor={persistedStore}>
        <App />
      </PersistGate>
    </HiddenItemsProvider>
  </Provider>
);

reportWebVitals();
