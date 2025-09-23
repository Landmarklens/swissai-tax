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

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

// Load system tests in development
if (process.env.NODE_ENV === 'development') {
  import('./utils/systemTest').then(module => {
    console.log('🧪 System tests available. Run window.runSystemTests() to test all features.');
  });
}

// Load Google Auth debug tools
import('./utils/googleAuthDebug');

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
