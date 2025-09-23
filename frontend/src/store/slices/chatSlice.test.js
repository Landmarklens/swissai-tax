import { configureStore } from '@reduxjs/toolkit';
import axios from 'axios';
import chatReducer, {
  getChats,
  sendMessage,
  getCurrentChat,
  getChat,
  readChat,
  deleteChat,
  getInsight,
  selectChat
} from './chatSlice';
import authService from '../../services/authService';

jest.mock('axios');
jest.mock('../../services/authService');

import config from '../../config/environments';
const API_URL = config.API_BASE_URL;

describe('chatSlice', () => {
  let store;
  const mockUser = { access_token: 'test-token' };

  beforeEach(() => {
    store = configureStore({
      reducer: {
        chat: chatReducer,
        account: () => ({}) // Mock account reducer
      }
    });
    jest.clearAllMocks();
    authService.getCurrentUser.mockReturnValue(mockUser);
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState().chat;
      expect(state).toEqual({
        chats: {
          data: [],
          isLoading: false,
          error: null
        },
        currentChat: {
          data: null,
          isLoading: false,
          error: null
        },
        sendMessage: {
          isLoading: false,
          error: null
        },
        readChat: {
          isLoading: false,
          error: null
        },
        deleteChat: {
          isLoading: false,
          error: null
        },
        insight: {
          data: null,
          isLoading: false,
          error: null
        }
      });
    });
  });

  describe('getChats action', () => {
    it('should handle getChats.pending', () => {
      store.dispatch(getChats.pending());
      const state = store.getState().chat;
      expect(state.chats.isLoading).toBe(true);
      expect(state.chats.error).toBe(null);
    });

    it('should handle getChats.fulfilled', async () => {
      const mockResponse = {
        status: 200,
        data: [{ id: 1, message: 'Test chat' }]
      };
      axios.get.mockResolvedValue(mockResponse);

      await store.dispatch(getChats());

      expect(axios.get).toHaveBeenCalledWith(`${API_URL}/chats/`, {
        headers: { Authorization: 'Bearer test-token' }
      });

      const state = store.getState().chat;
      expect(state.chats.isLoading).toBe(false);
      expect(state.chats.data).toEqual(mockResponse.data);
      expect(state.chats.error).toBe(null);
    });

    it('should handle getChats.rejected', async () => {
      const mockError = { status: 401, error: 'Unauthorized' };
      axios.get.mockResolvedValue(mockError);

      await store.dispatch(getChats());

      const state = store.getState().chat;
      expect(state.chats.isLoading).toBe(false);
      expect(state.chats.error).toBe('Unauthorized');
    });
  });

  describe('sendMessage action', () => {
    it('should handle sendMessage.pending', () => {
      store.dispatch(sendMessage.pending());
      const state = store.getState().chat;
      expect(state.sendMessage.isLoading).toBe(true);
      expect(state.sendMessage.error).toBe(null);
    });

    it('should handle sendMessage.fulfilled', async () => {
      const mockResponse = { status: 200, data: { id: 1, message: 'Sent' } };
      axios.post.mockResolvedValue(mockResponse);

      const messageData = { manager_id: 123, message: 'Hello' };
      await store.dispatch(sendMessage(messageData));

      expect(axios.post).toHaveBeenCalledWith(
        `${API_URL}/chats/`,
        { manager_id: 123, message: 'Hello' },
        { headers: { Authorization: 'Bearer test-token' } }
      );

      const state = store.getState().chat;
      expect(state.sendMessage.isLoading).toBe(false);
      expect(state.sendMessage.error).toBe(null);
    });

    it('should handle sendMessage.rejected', async () => {
      axios.post.mockRejectedValue(new Error('Network error'));

      await store.dispatch(sendMessage({ manager_id: 123, message: 'Hello' }));

      const state = store.getState().chat;
      expect(state.sendMessage.isLoading).toBe(false);
      expect(state.sendMessage.error).toBe('Something went wrong');
    });
  });

  describe('getChat action', () => {
    it('should handle getChat.pending', () => {
      store.dispatch(getChat.pending());
      const state = store.getState().chat;
      expect(state.currentChat.isLoading).toBe(true);
      expect(state.currentChat.error).toBe(null);
    });

    it('should handle getChat.fulfilled', async () => {
      const mockResponse = { status: 200, data: { id: 1, messages: [] } };
      axios.get.mockResolvedValue(mockResponse);

      await store.dispatch(getChat('chat123'));

      expect(axios.get).toHaveBeenCalledWith(
        `${API_URL}/chats/chat123`,
        { headers: { Authorization: 'Bearer test-token' } }
      );

      const state = store.getState().chat;
      expect(state.currentChat.isLoading).toBe(false);
      expect(state.currentChat.data).toEqual(mockResponse.data);
      expect(state.currentChat.error).toBe(null);
    });

    it('should handle getChat.rejected', async () => {
      const mockError = { status: 404, error: 'Chat not found' };
      axios.get.mockResolvedValue(mockError);

      await store.dispatch(getChat('chat123'));

      const state = store.getState().chat;
      expect(state.currentChat.isLoading).toBe(false);
      expect(state.currentChat.error).toBe('Chat not found');
    });
  });

  describe('readChat action', () => {
    it('should handle readChat.pending', () => {
      store.dispatch(readChat.pending());
      const state = store.getState().chat;
      expect(state.readChat.isLoading).toBe(true);
      expect(state.readChat.error).toBe(null);
    });

    it('should handle readChat.fulfilled', async () => {
      const mockResponse = { status: 200, data: { success: true } };
      axios.put.mockResolvedValue(mockResponse);

      await store.dispatch(readChat('chat123'));

      expect(axios.put).toHaveBeenCalledWith(
        `${API_URL}/chats/chat123`,
        { is_read: true },
        { headers: { Authorization: 'Bearer test-token' } }
      );

      const state = store.getState().chat;
      expect(state.readChat.isLoading).toBe(false);
      expect(state.readChat.error).toBe(null);
    });

    it('should handle readChat.rejected', async () => {
      axios.put.mockRejectedValue(new Error('Update failed'));

      await store.dispatch(readChat('chat123'));

      const state = store.getState().chat;
      expect(state.readChat.isLoading).toBe(false);
      expect(state.readChat.error).toBe('Something went wrong');
    });
  });

  describe('deleteChat action', () => {
    it('should handle deleteChat.pending', () => {
      store.dispatch(deleteChat.pending());
      const state = store.getState().chat;
      expect(state.deleteChat.isLoading).toBe(true);
      expect(state.deleteChat.error).toBe(null);
    });

    it('should handle deleteChat.fulfilled', async () => {
      const mockResponse = { status: 200, data: { success: true } };
      axios.delete.mockResolvedValue(mockResponse);

      await store.dispatch(deleteChat('chat123'));

      expect(axios.delete).toHaveBeenCalledWith(
        `${API_URL}/chats/chat123`,
        { headers: { Authorization: 'Bearer test-token' } }
      );

      const state = store.getState().chat;
      expect(state.deleteChat.isLoading).toBe(false);
      expect(state.deleteChat.error).toBe(null);
    });

    it('should handle deleteChat.rejected', async () => {
      const mockError = { status: 403, error: 'Forbidden' };
      axios.delete.mockResolvedValue(mockError);

      await store.dispatch(deleteChat('chat123'));

      const state = store.getState().chat;
      expect(state.deleteChat.isLoading).toBe(false);
      expect(state.deleteChat.error).toBe('Forbidden');
    });
  });

  describe('getInsight action', () => {
    it('should handle getInsight.pending', () => {
      store.dispatch(getInsight.pending());
      const state = store.getState().chat;
      expect(state.insight.isLoading).toBe(true);
      expect(state.insight.error).toBe(null);
    });

    it('should handle getInsight.fulfilled', async () => {
      const mockResponse = { status: 200, data: { insights: [] } };
      axios.get.mockResolvedValue(mockResponse);

      await store.dispatch(getInsight('profile123'));

      expect(axios.get).toHaveBeenCalledWith(
        `${API_URL}/insights?conversation_profile_id=profile123`,
        { headers: { Authorization: 'Bearer test-token' } }
      );

      const state = store.getState().chat;
      expect(state.insight.isLoading).toBe(false);
      expect(state.insight.data).toEqual(mockResponse.data);
      expect(state.insight.error).toBe(null);
    });

    it('should handle getInsight.rejected', async () => {
      axios.get.mockRejectedValue(new Error('Insights not available'));

      await store.dispatch(getInsight('profile123'));

      const state = store.getState().chat;
      expect(state.insight.isLoading).toBe(false);
      expect(state.insight.error).toBe('Something went wrong');
    });
  });

  describe('selectChat selector', () => {
    it('should select chat state', () => {
      const mockState = {
        chat: {
          chats: { data: [], isLoading: false, error: null },
          currentChat: { data: null, isLoading: false, error: null }
        }
      };

      const result = selectChat(mockState);
      expect(result).toEqual(mockState.chat);
    });
  });
});