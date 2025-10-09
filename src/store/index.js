import { configureStore } from '@reduxjs/toolkit';
import { persistStore, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import rootReducer from './reducer';
import { useTranslation } from 'react-i18next';

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER]
      },
      // Disable immutable check in production for better performance
      immutableCheck: process.env.NODE_ENV === 'production' ? false : {
        warnAfter: 128 // Increase warning threshold in development
      }
    }),
  devTools: process.env.REACT_APP_APP_MODE !== 'production'
});

export const persistedStore = persistStore(store);
