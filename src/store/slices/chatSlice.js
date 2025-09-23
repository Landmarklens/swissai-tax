import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import authService from '../../services/authService';
import config from '../../config/environments';
const API_URL = config.API_BASE_URL;

export const MESSAGE_TYPES = {
  HUMAN: 'human',
  AI_ASSISTANT: 'ai_assistant',
  SYSTEM: 'system'
};

const initialState = {
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
};


export const getChats = createAsyncThunk('chat/get', async (_, thunkApi) => {
  try {
    const user = authService.getCurrentUser();
    const accountState = thunkApi.getState().account;

    const response = await axios.get(`${API_URL}/chats/`, {
      headers: {
        Authorization: `Bearer ${user.access_token}`
      }
    });
    // Throw Err
    if (response?.status && response.status !== 200) {
      throw response;
    }
    return response.data;
  } catch (err) {
    return thunkApi.rejectWithValue(err?.error || 'Something went wrong');
  }
});

export const sendMessage = createAsyncThunk('chat/send-message', async (messageData, thunkApi) => {
  try {
    const user = authService.getCurrentUser();

    const { manager_id, message } = messageData;

    const response = await axios.post(
      `${API_URL}/chats/`,
      {
        manager_id,
        message
      },
      {
        headers: {
          Authorization: `Bearer ${user.access_token}`
        }
      }
    );
    if (response?.status && response.status !== 200) {
      throw response;
    }
    return response.data;
  } catch (err) {
    return thunkApi.rejectWithValue(err?.error || 'Something went wrong');
  }
});

export const getCurrentChat = createAsyncThunk('chat/get-one', async (chatId, thunkApi) => {
  try {
    const user = authService.getCurrentUser();

    const response = await axios.get(`${API_URL}/chats/${chatId}`, {
      headers: {
        Authorization: `Bearer ${user.access_token}`
      }
    });
    // Throw Err
    if (response?.status && response.status !== 200) {
      throw response;
    }
    return response.data;
  } catch (err) {
    return thunkApi.rejectWithValue(err?.error || 'Something went wrong');
  }
});

export const getChat = createAsyncThunk('chat/get-one', async (chatId, thunkApi) => {
  try {
    const user = authService.getCurrentUser();

    const response = await axios.get(`${API_URL}/chats/${chatId}`, {
      headers: {
        Authorization: `Bearer ${user.access_token}`
      }
    });
    // Throw Err
    if (response?.status && response.status !== 200) {
      throw response;
    }
    return response.data;
  } catch (err) {
    return thunkApi.rejectWithValue(err?.error || 'Something went wrong');
  }
});

export const readChat = createAsyncThunk('chat/read-chat', async (chatId, thunkApi) => {
  try {
    const user = authService.getCurrentUser();

    const response = await axios.put(
      `${API_URL}/chats/${chatId}`,
      {
        is_read: true
      },
      {
        headers: {
          Authorization: `Bearer ${user.access_token}`
        }
      }
    );
    // Throw Err
    if (response?.status && response.status !== 200) {
      throw response;
    }
    return response.data;
  } catch (err) {
    return thunkApi.rejectWithValue(err?.error || 'Something went wrong');
  }
});

export const deleteChat = createAsyncThunk('chat/delete-chat', async (chatId, thunkApi) => {
  try {
    const user = authService.getCurrentUser();

    const response = await axios.delete(`${API_URL}/chats/${chatId}`, {
      headers: {
        Authorization: `Bearer ${user.access_token}`
      }
    });
    // Throw Err
    if (response?.status && response.status !== 200) {
      throw response;
    }
    return response.data;
  } catch (err) {
    return thunkApi.rejectWithValue(err?.error || 'Something went wrong');
  }
});

export const getInsight = createAsyncThunk('insight', async (profileId, thunkApi) => {
  try {
    const user = authService.getCurrentUser();

    const response = await axios.get(`${API_URL}/insights?conversation_profile_id=${profileId}`, {
      headers: {
        Authorization: `Bearer ${user.access_token}`
      }
    });
    // Throw Err
    if (response?.status && response.status !== 200) {
      throw response;
    }
    return response.data;
  } catch (err) {
    return thunkApi.rejectWithValue(err?.error || 'Something went wrong');
  }
});

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {},

  extraReducers: (builder) => {
    builder
      .addCase(getChats.pending, (state) => {
        state.chats.isLoading = true;
        state.chats.error = null;
      })
      .addCase(getChats.fulfilled, (state, action) => {
        state.chats.isLoading = false;
        state.chats.data = action.payload;
        state.chats.error = null;
      })
      .addCase(getChats.rejected, (state, action) => {
        state.chats.isLoading = false;
        state.chats.error = action.payload;
      })
      .addCase(sendMessage.pending, (state) => {
        state.sendMessage.isLoading = true;
        state.sendMessage.error = null;
      })
      .addCase(sendMessage.fulfilled, (state) => {
        state.sendMessage.isLoading = false;
        state.sendMessage.error = null;
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.sendMessage.isLoading = false;
        state.sendMessage.error = action.payload;
      })
      .addCase(getChat.pending, (state) => {
        state.currentChat.isLoading = true;
        state.currentChat.error = null;
      })
      .addCase(getChat.fulfilled, (state, action) => {
        state.currentChat.isLoading = false;
        state.currentChat.data = action.payload;
        state.currentChat.error = null;
      })
      .addCase(getChat.rejected, (state, action) => {
        state.currentChat.isLoading = false;
        state.currentChat.error = action.payload;
      })
      .addCase(readChat.pending, (state) => {
        state.readChat.isLoading = true;
        state.readChat.error = null;
      })
      .addCase(readChat.fulfilled, (state) => {
        state.readChat.isLoading = false;
        state.readChat.error = null;
      })
      .addCase(readChat.rejected, (state, action) => {
        state.readChat.isLoading = false;
        state.readChat.error = action.payload;
      })
      .addCase(deleteChat.pending, (state) => {
        state.deleteChat.isLoading = true;
        state.deleteChat.error = null;
      })
      .addCase(deleteChat.fulfilled, (state) => {
        state.deleteChat.isLoading = false;
        state.deleteChat.error = null;
      })
      .addCase(deleteChat.rejected, (state, action) => {
        state.deleteChat.isLoading = false;
        state.deleteChat.error = action.payload;
      })
      .addCase(getInsight.pending, (state) => {
        state.insight.isLoading = true;
        state.insight.error = null;
      })
      .addCase(getInsight.fulfilled, (state, action) => {
        state.insight.isLoading = false;
        state.insight.data = action.payload;
        state.insight.error = null;
      })
      .addCase(getInsight.rejected, (state, action) => {
        state.insight.isLoading = false;
        state.insight.error = action.payload;
      });
  }
});
export const selectChat = (state) => state.chat;
export default chatSlice.reducer;
