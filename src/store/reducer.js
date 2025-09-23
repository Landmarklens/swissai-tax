import { combineReducers } from '@reduxjs/toolkit';
import { createTransform, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import authReducer from './slices/authSlice';
import counterReducer from './slices/counterSlice';
import testimonialReducer from './slices/testimonialSlice';
import teamSlice from './slices/teamSlice';
import chatSlice from './slices/chatSlice';
import accountReducer from './slices/accountSlice';
import propertiesReducer from './slices/propertiesSlice';
import viewingReducer from './slices/viewingSlice';
import analyticsReducer from './slices/analyticsSlice';
import subscriptionsReducer from './slices/subscriptionsSlice';
import notesReducer from './slices/notesSlice';
import documentsReducer from './slices/documentsSlice';
import { conversationReducer } from './slices/conversationsSlice';
import recommendationsReducer from './slices/recomandationsSlice';
import userReducer from './slices/userSlice';
import tenantSelectionReducer from './slices/tenantSelectionSlice';
import tenantQuestionsReducer from './slices/tenantQuestionsSlice';

const persistConfig = {
  key: 'root',
  storage,
  blacklist: ['chat', 'recommendations', 'subscriptions', 'tenantSelection', 'tenantQuestions']
};

const reducers = combineReducers({
  auth: authReducer,
  counter: counterReducer,
  testimonials: testimonialReducer,
  team: teamSlice,
  chat: chatSlice,
  account: accountReducer,
  properties: propertiesReducer,
  viewing: viewingReducer,
  analytics: analyticsReducer,
  subscriptions: subscriptionsReducer,
  notes: notesReducer,
  documents: documentsReducer,
  conversations: conversationReducer,
  recommendations: recommendationsReducer,
  user: userReducer,
  tenantSelection: tenantSelectionReducer,
  tenantQuestions: tenantQuestionsReducer
});

export default persistReducer(persistConfig, reducers);
