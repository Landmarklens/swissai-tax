import { combineReducers } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import taxFilingReducer from './slices/taxFilingSlice';
import accountReducer from './slices/accountSlice';
import dashboardReducer from './slices/dashboardSlice';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'user', 'account'] // Only persist auth, user and account data
};

const reducers = combineReducers({
  auth: authReducer,
  user: userReducer,
  taxFiling: taxFilingReducer,
  account: accountReducer,
  dashboard: dashboardReducer
});

export default persistReducer(persistConfig, reducers);
