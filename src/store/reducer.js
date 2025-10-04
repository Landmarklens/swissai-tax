import { combineReducers } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import taxFilingReducer from './slices/taxFilingSlice';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'user'] // Only persist auth and user data
};

const reducers = combineReducers({
  auth: authReducer,
  user: userReducer,
  taxFiling: taxFilingReducer
});

export default persistReducer(persistConfig, reducers);
