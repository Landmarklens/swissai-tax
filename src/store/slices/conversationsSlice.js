import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import authService from '../../services/authService';
import { toast } from 'react-toastify';
import config from '../../config/environments';

const API_URL = process.env.REACT_APP_API_URL || config.API_BASE_URL || 'https://api.homeai.ch';

const initialState = {
  conversationProfiles: [],
  activeConversationProfile: {
    messages: [],
    insights: [],
    queryOptions: [],
    clientOverview: {},
    activeStep: '',
    lastMessageId: '',
    completionPercentage: 0,
    profileCompleted: false,
    shouldUpdateConversation: false,
    shouldSendFeedback: false,
    visibleClientOverview: false,
    timelineLoading: false,
    timelineError: null,
    timeline: [],
    quickFormSubmissionId: null,
    quickFormRecommendations: []
  },
  activeConversationId: '',
  isTyping: false,
  userId: {},
  loading: false,
  error: null,
  conversationValidated: false
};

// Helper function to validate conversation profile
const validateConversationProfile = async (conversationId) => {
  try {
    const user = authService.getCurrentUser();
    if (!user?.access_token) return false;
    
    const response = await axios.get(`${API_URL}/api/conversation/profiles`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.access_token}`
      }
    });
    
    const profiles = response.data || [];
    return profiles.some(profile => profile.id === conversationId);
  } catch (error) {
    console.error('Failed to validate conversation profile:', error);
    return false;
  }
};

// Helper function to create new conversation if needed
const ensureValidConversation = async (dispatch, getState) => {
  const state = getState();
  const currentId = state.conversations.activeConversationId;
  
  // If we have a conversation ID, validate it
  if (currentId) {
    const isValid = await validateConversationProfile(currentId);
    if (isValid) {
      return currentId;
    }
    // Invalid conversation, clear it
    dispatch(clearInvalidConversation());
  }
  
  // Create new conversation profile
  try {
    const user = authService.getCurrentUser();
    const response = await axios.post(
      `${API_URL}/api/conversation/profiles`,
      { name: 'New chat' },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.access_token}`
        }
      }
    );
    
    dispatch(setActiveConversationId(response.data.id));
    return response.data.id;
  } catch (error) {
    console.error('Failed to create new conversation:', error);
    throw error;
  }
};

export const getInsightTimeline = createAsyncThunk(
  'conversations/getInsightTimeline',
  async (conversationProfileId, thunkAPI) => {
    try {
      // Validate conversation first
      const isValid = await validateConversationProfile(conversationProfileId);
      if (!isValid) {
        return thunkAPI.rejectWithValue({ error: 'Invalid conversation profile' });
      }
      
      const user = require('../../services/authService').default.getCurrentUser();
      const response = await axios.get(`${API_URL}/api/insights/timeline`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.access_token}`
        },
        params: { conversation_profile_id: conversationProfileId }
      });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createInsight = createAsyncThunk(
  'conversations/createInsight',
  async (data, thunkAPI) => {
    try {
      // Ensure we have a valid conversation
      const conversationId = await ensureValidConversation(thunkAPI.dispatch, thunkAPI.getState);

      const user = require('../../services/authService').default.getCurrentUser();
      const response = await axios.post(
        `${API_URL}/api/insights`,
        { ...data, conversation_profile_id: conversationId },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user?.access_token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createInsights = createAsyncThunk(
  'conversations/createInsights',
  async (
    { insights, conversation_profile_id, source_type = 'regular_chat' },
    { dispatch, getState, rejectWithValue }
  ) => {
    try {
      // Use provided conversation_id or ensure we have a valid one
      let conversationId = conversation_profile_id;
      
      if (!conversationId) {
        conversationId = await ensureValidConversation(dispatch, getState);
      } else {
        // Validate the provided conversation ID
        const isValid = await validateConversationProfile(conversationId);
        if (!isValid) {
          conversationId = await ensureValidConversation(dispatch, getState);
        }
      }
      
      const user = require('../../services/authService').default.getCurrentUser();

      const payload = {
        insights: insights.map((insight) => ({
          ...insight,
          conversation_profile_id: conversationId
        })),
        source_type
      };

      const response = await axios.post(`${API_URL}/api/insights/bulk`, payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.access_token}`
        }
      });
      return response.data;
    } catch (error) {
      // If conversation not found, try creating a new one
      if (error.response?.status === 404 && error.response?.data?.error === 'Conversation profile not found') {
        try {
          const newConversationId = await ensureValidConversation(dispatch, getState);
          
          const user = require('../../services/authService').default.getCurrentUser();
          const payload = {
            insights: insights.map((insight) => ({
              ...insight,
              conversation_profile_id: newConversationId
            })),
            source_type
          };

          const response = await axios.post(`${API_URL}/api/insights/bulk`, payload, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${user?.access_token}`
            }
          });
          return response.data;
        } catch (retryError) {
          return rejectWithValue(retryError.response?.data || retryError.message);
        }
      }
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteInsight = createAsyncThunk(
  'conversations/deleteInsight',
  async (insightId, thunkAPI) => {
    try {
      const user = authService.getCurrentUser();
      await axios.delete(`${API_URL}/insights/${insightId}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.access_token}`
        }
      });
      return insightId;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateInsightPriority = createAsyncThunk(
  'conversations/updateInsightPriority',
  async ({ insightId, priority }, thunkAPI) => {
    try {
      const user = authService.getCurrentUser();
      const response = await axios.put(
        `${API_URL}/insights/${insightId}/priority`,
        { priority },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user?.access_token}`
          }
        }
      );
      return { insightId, priority: response.data.priority || priority };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createNewConversationProfileThunk = createAsyncThunk(
  'conversations/createNewConversationProfile',
  async (name = 'New chat', thunkAPI) => {
    try {
      const user = authService.getCurrentUser();
      const response = await axios.post(
        `${API_URL}/api/conversation/profiles`,
        { name },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user?.access_token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      toast.error('Something went wrong. Try again!');
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Helper function for generating conversation name
const generateConversationNameAPI = async (id) => {
  try {
    const user = authService.getCurrentUser();
    const response = await axios.post(
      `${API_URL}/api/conversation/profiles/${id}/generate-name`,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.access_token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message || 'Failed to generate conversation name';
  }
};

// Conversation management actions
export const deleteConversation = createAsyncThunk(
  'conversations/deleteConversation',
  async (id, thunkAPI) => {
    try {
      const user = authService.getCurrentUser();
      await axios.delete(`${API_URL}/api/conversation/profiles/${id}`, {
        headers: {
          Authorization: `Bearer ${user?.access_token}`
        }
      });
      return id;
    } catch (error) {
      toast.error('Failed to delete conversation');
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const archiveConversation = createAsyncThunk(
  'conversations/archiveConversation',
  async (id, thunkAPI) => {
    try {
      const state = thunkAPI.getState();
      const conversation = state.conversations.conversationProfiles.find(c => c.id === id);
      const isArchived = conversation?.is_archived || false;
      
      const user = authService.getCurrentUser();
      const response = await axios.patch(
        `${API_URL}/api/conversation/profiles/${id}`,
        { is_archived: !isArchived },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user?.access_token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      toast.error('Failed to archive conversation');
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const renameConversation = createAsyncThunk(
  'conversations/renameConversation',
  async ({ id, name }, thunkAPI) => {
    try {
      const user = authService.getCurrentUser();
      const response = await axios.patch(
        `${API_URL}/api/conversation/profiles/${id}`,
        { name },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user?.access_token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      toast.error('Failed to rename conversation');
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const pinConversation = createAsyncThunk(
  'conversations/pinConversation',
  async (id, thunkAPI) => {
    try {
      const state = thunkAPI.getState();
      const conversation = state.conversations.conversationProfiles.find(c => c.id === id);
      const isPinned = conversation?.is_pinned || false;
      
      const user = authService.getCurrentUser();
      const response = await axios.patch(
        `${API_URL}/api/conversation/profiles/${id}`,
        { is_pinned: !isPinned },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user?.access_token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      toast.error('Failed to pin conversation');
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const duplicateConversation = createAsyncThunk(
  'conversations/duplicateConversation',
  async (id, thunkAPI) => {
    try {
      const state = thunkAPI.getState();
      const conversation = state.conversations.conversationProfiles.find(c => c.id === id);
      
      if (!conversation) {
        throw new Error('Conversation not found');
      }
      
      const user = authService.getCurrentUser();
      const response = await axios.post(
        `${API_URL}/api/conversation/profiles`,
        {
          name: `${conversation.name || 'New chat'} (Copy)`,
          profile: conversation.profile
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user?.access_token}`
          }
        }
      );
      toast.success('Conversation duplicated successfully');
      return response.data;
    } catch (error) {
      toast.error('Failed to duplicate conversation');
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const generateConversationName = createAsyncThunk(
  'conversations/generateConversationName',
  async (id, thunkAPI) => {
    try {
      const user = authService.getCurrentUser();
      console.log(`Attempting to generate name for conversation ${id}`);
      const response = await axios.post(
        `${API_URL}/api/conversation/profiles/${id}/generate-name`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user?.access_token}`
          }
        }
      );
      console.log(`Generated name for conversation ${id}:`, response.data);
      return { id, name: response.data.name };
    } catch (error) {
      // Silently fail for name generation
      console.error('Failed to generate name for conversation', id, error.response?.data || error.message);
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const generateConversationNameThunk = createAsyncThunk(
  'conversations/generateConversationNameThunk',
  async (id, thunkAPI) => {
    try {
      const data = await generateConversationNameAPI(id);
      return data;
    } catch (error) {
      toast.error('Something went wrong. Try again!');
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

// New thunk to validate conversation on app startup
export const validateActiveConversation = createAsyncThunk(
  'conversations/validateActiveConversation',
  async (_, { dispatch, getState }) => {
    try {
      const state = getState();
      const currentId = state.conversations.activeConversationId;
      
      if (!currentId) {
        // No active conversation, create a new one
        const newId = await ensureValidConversation(dispatch, getState);
        return { valid: true, conversationId: newId };
      }
      
      const isValid = await validateConversationProfile(currentId);
      
      if (!isValid) {
        // Invalid conversation, create a new one
        dispatch(clearInvalidConversation());
        const newId = await ensureValidConversation(dispatch, getState);
        return { valid: true, conversationId: newId };
      }
      
      return { valid: true, conversationId: currentId };
    } catch (error) {
      console.error('Failed to validate conversation:', error);
      return { valid: false, conversationId: null };
    }
  }
);

const conversationSlice = createSlice({
  name: 'conversation',
  initialState,
  reducers: {
    saveUserMessage: (state, action) => {
      const { message } = action.payload;
      state.activeConversationProfile.messages = [
        ...state.activeConversationProfile.messages,
        {
          conversation_id: Date.now().toString(),
          role: 'user',
          content: message,
          timestamp: new Date().toISOString()
        }
      ];
    },
    saveAiResponse: (state, action) => {
      const data = action.payload;
      const completionPercentage = Math.floor(Number(data.completionPercentage) || 0);
      const conversation_id = data.conversation_id;

      state.activeConversationProfile.messages = [
        ...state.activeConversationProfile.messages,
        { conversation_id, role: data.role, content: data.messageFromAI }
      ];
      state.activeConversationProfile.insights = Array.isArray(data.insights) ? data.insights : [];
      state.activeConversationProfile.clientOverview = data.clientOverview;
      state.activeConversationProfile.lastMessageId = conversation_id;
      state.activeConversationProfile.profileCompleted = data.profileCompleted;
      state.activeConversationProfile.visibleClientOverview = data.profileCompleted;
      state.activeConversationProfile.activeStep = data.active_step;
      state.activeConversationProfile.queryOptions = data.queryOptions;
      state.activeConversationProfile.completionPercentage = completionPercentage;
    },
    setActiveConversationProfile: (state, action) => {
      const completionPercentage = Math.floor(Number(action.payload.completion_percentage) || 0);
      state.activeConversationProfile.shouldUpdateConversation = false;
      state.activeConversationProfile.queryOptions = [];
      state.activeConversationProfile.activeStep = '';

      // Reset typing state when loading conversation history
      state.isTyping = false;

      state.activeConversationProfile.messages = [...action.payload.messages];

      state.activeConversationProfile.insights = Array.isArray(action.payload.insights) ? action.payload.insights : [];
      state.activeConversationProfile.clientOverview = action.payload.client_overview;
      state.activeConversationProfile.profileCompleted = action.payload.profile_completed;
      state.activeConversationProfile.visibleClientOverview = action.payload.profile_completed;
      state.activeConversationProfile.completionPercentage = completionPercentage;

      let quickFormSubmissionId = null;
      if (action.payload.insights && Array.isArray(action.payload.insights)) {
        const insightWithSubmissionId = action.payload.insights.find(
          (insight) => insight.quick_form_submission_id
        );
        if (insightWithSubmissionId) {
          quickFormSubmissionId = insightWithSubmissionId.quick_form_submission_id;
        }
      }
      state.activeConversationProfile.quickFormSubmissionId = quickFormSubmissionId;

      const isValidMessages =
        Array.isArray(action.payload.messages) && action.payload.messages.length > 0;

      if (isValidMessages) {
        state.activeConversationProfile.lastMessageId = action.payload.messages[0].conversation_id;

        const quickFormMessages = action.payload.messages.filter(
          (msg) => msg.role === 'quick_form'
        );
        if (quickFormMessages.length > 0) {
          const newestQuickFormMessage = quickFormMessages[0];
          if (
            newestQuickFormMessage.recommendations &&
            Array.isArray(newestQuickFormMessage.recommendations)
          ) {
            state.activeConversationProfile.quickFormRecommendations =
              newestQuickFormMessage.recommendations;
          }
        }
      }
    },
    updateActiveConversationProfile: (state, action) => {
      const data = action.payload;
      const role = data.role;
      const messageFromAI = data.messageFromAI;
      const insights = data.insights;
      const updateStatus = data.updateStatus;
      const conversationId = data.conversation_id;
      const profileCompleted = data.profileCompleted;
      const completionPercentage = Math.floor(Number(data.completionPercentage) || 0);
      const clientOverview = data.clientOverview;

      // Only add a message if there's actual content to add
      if (messageFromAI !== undefined && role !== undefined) {
        state.activeConversationProfile.messages = [
          ...state.activeConversationProfile.messages,
          { conversation_id: conversationId, role, content: messageFromAI }
        ];
      }
      state.activeConversationProfile.insights = Array.isArray(insights) ? insights : [];

      state.activeConversationProfile.visibleClientOverview =
        updateStatus === 'success' && profileCompleted;
      state.activeConversationProfile.shouldUpdateConversation =
        updateStatus !== 'success' || !profileCompleted;

      state.activeConversationProfile.lastMessageId = conversationId;
      state.activeConversationProfile.completionPercentage = completionPercentage;
      state.activeConversationProfile.clientOverview = clientOverview;
    },
    addRecommendationsToMessage: (state, action) => {
      const recommendations = action.payload;

      const isValidRecommendations = Array.isArray(recommendations) && recommendations.length > 0;

      if (!isValidRecommendations) {
        return;
      }

      const messages = state.activeConversationProfile.messages;
      const isValidMessages = Array.isArray(messages) && messages.length > 0;

      if (!isValidMessages) {
        return;
      }

      const lastMessage = messages[messages.length - 1];
      const isValidLastMessage = lastMessage && typeof lastMessage === 'object';

      if (!isValidLastMessage) {
        return;
      }

      lastMessage.recommendations = recommendations;
    },
    injectIntoConversation: (state, action) => {
      const role = action.payload.role;
      const content = action.payload.content;

      state.activeConversationProfile.messages = [
        ...state.activeConversationProfile.messages,
        { role, content }
      ];
    },
    setConversationProfiles: (state, action) => {
      state.conversationProfiles = action.payload;
    },
    setActiveConversationId: (state, action) => {
      state.activeConversationId = action.payload;
      state.conversationValidated = true;

      // Find if we're switching to an existing conversation with data
      const existingConversation = state.conversationProfiles.find(
        profile => profile.id === action.payload
      );

      if (existingConversation && existingConversation.insights) {
        // Load existing conversation data
        state.activeConversationProfile = {
          ...state.activeConversationProfile,
          messages: existingConversation.messages || [],
          insights: existingConversation.insights || [],
          clientOverview: existingConversation.client_overview || {},
          completionPercentage: existingConversation.completion_percentage || 0,
          profileCompleted: existingConversation.profile_completed || false
        };
      } else {
        // Clear the active conversation profile for new conversation
        // to ensure no insights from previous conversation are shown
        state.activeConversationProfile = {
          messages: [],
          insights: [],
          queryOptions: [],
          clientOverview: {},
          activeStep: '',
          lastMessageId: '',
          completionPercentage: 0,
          profileCompleted: false,
          shouldUpdateConversation: false,
          shouldSendFeedback: false,
          visibleClientOverview: false,
          timelineLoading: false,
          timelineError: null,
          timeline: [],
          quickFormSubmissionId: null,
          quickFormRecommendations: []
        };
      }
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearInvalidConversation: (state) => {
      state.activeConversationId = '';
      state.activeConversationProfile = initialState.activeConversationProfile;
      state.conversationValidated = false;
    },
    setIsTyping: (state, action) => {
      state.isTyping = action.payload;
    },
    setUserId: (state, action) => {
      state.userId = action.payload;
    },
    setCompletedSteps: (state, action) => {
      state.activeConversationProfile.completedSteps = action.payload.steps;
    },
    setInsights: (state, action) => {
      state.activeConversationProfile.insights = Array.isArray(action.payload) ? action.payload : [];
    },
    addLocalInsight: (state, action) => {
      console.log('🔵 addLocalInsight reducer called with payload:', action.payload);

      // Add UI-generated insight locally without API call
      const localInsight = {
        ...action.payload,
        id: `local_${Date.now()}_${Math.random()}`, // Local ID
        origin: 'USER',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        isLocal: true // Flag to identify local insights
      };

      console.log('🔵 Created local insight:', localInsight);
      console.log('🔵 Current insights before adding:', state.activeConversationProfile.insights);

      state.activeConversationProfile.insights.push(localInsight);

      console.log('🔵 Insights after adding:', state.activeConversationProfile.insights);
    },
    removeLocalInsight: (state, action) => {
      console.log('🔴 removeLocalInsight reducer called with id:', action.payload);
      console.log('🔴 Current insights before removal:', state.activeConversationProfile.insights);

      // Remove a local insight
      state.activeConversationProfile.insights = state.activeConversationProfile.insights.filter(
        insight => insight.id !== action.payload
      );

      console.log('🔴 Insights after removal:', state.activeConversationProfile.insights);
    },
    setActiveConversationProfileMessage: (state, action) => {
      state.activeConversationProfile = {
        ...state.activeConversationProfile,
        messages: [...action.payload]
      };
    },
    setVisibleClientOverview: (state, action) => {
      state.activeConversationProfile.visibleClientOverview = action.payload;
    },
    resetConversations: (state) => {
      return initialState;
    },
    resetQueryOptions: (state) => {
      state.activeConversationProfile.queryOptions = [];
    },
    setLastMessageId: (state, action) => {
      state.activeConversationProfile.lastMessageId = action.payload;
    },
    setShouldUpdateConversation: (state, action) => {
      state.activeConversationProfile.shouldUpdateConversation = action.payload;
    },
    setShouldSendFeedback: (state, action) => {
      state.activeConversationProfile.shouldSendFeedback = action.payload;
    },
    setSearchProperties: (state, action) => {
      state.activeConversationProfile.searchProperties = action.payload;
    },
    setQuickFormSubmissionId: (state, action) => {
      state.activeConversationProfile.quickFormSubmissionId = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(createNewConversationProfileThunk.fulfilled, (state, action) => {
        state.conversationProfiles.push(action.payload);
        state.activeConversationId = action.payload.id;
        state.conversationValidated = true;
        
        // Reset the active conversation profile to clear previous insights
        state.activeConversationProfile = {
          messages: [],
          insights: [],
          queryOptions: [],
          clientOverview: {},
          activeStep: '',
          lastMessageId: '',
          completionPercentage: 0,
          profileCompleted: false,
          shouldUpdateConversation: false,
          shouldSendFeedback: false,
          visibleClientOverview: false,
          timelineLoading: false,
          timelineError: null,
          timeline: [],
          quickFormSubmissionId: null,
          quickFormRecommendations: []
        };
      })
      .addCase(generateConversationNameThunk.fulfilled, (state, action) => {
        const index = state.conversationProfiles.findIndex(
          (profile) => profile.id === action.payload.id
        );
        if (index !== -1) {
          state.conversationProfiles[index] = action.payload;
        }
      })
      .addCase(createInsights.rejected, (state, action) => {
        // Handle insight creation failure
        if (action.payload?.error === 'Conversation profile not found') {
          state.activeConversationId = '';
          state.conversationValidated = false;
        }
      })
      // New conversation management actions
      .addCase(deleteConversation.fulfilled, (state, action) => {
        state.conversationProfiles = state.conversationProfiles.filter(
          (profile) => profile.id !== action.payload
        );
        if (state.activeConversationId === action.payload) {
          state.activeConversationId = '';
          state.activeConversationProfile = initialState.activeConversationProfile;
        }
      })
      .addCase(archiveConversation.fulfilled, (state, action) => {
        const index = state.conversationProfiles.findIndex(
          (profile) => profile.id === action.payload.id
        );
        if (index !== -1) {
          state.conversationProfiles[index] = action.payload;
        }
      })
      .addCase(renameConversation.fulfilled, (state, action) => {
        const index = state.conversationProfiles.findIndex(
          (profile) => profile.id === action.payload.id
        );
        if (index !== -1) {
          state.conversationProfiles[index] = action.payload;
        }
      })
      .addCase(pinConversation.fulfilled, (state, action) => {
        const index = state.conversationProfiles.findIndex(
          (profile) => profile.id === action.payload.id
        );
        if (index !== -1) {
          state.conversationProfiles[index] = action.payload;
        }
      })
      .addCase(duplicateConversation.fulfilled, (state, action) => {
        state.conversationProfiles.push(action.payload);
      })
      .addCase(generateConversationName.fulfilled, (state, action) => {
        const index = state.conversationProfiles.findIndex(
          (profile) => profile.id === action.payload.id
        );
        if (index !== -1) {
          state.conversationProfiles[index].name = action.payload.name;
        }
      })
      .addCase(validateActiveConversation.fulfilled, (state, action) => {
        if (action.payload.valid && action.payload.conversationId) {
          state.activeConversationId = action.payload.conversationId;
          state.conversationValidated = true;
        } else {
          state.activeConversationId = '';
          state.conversationValidated = false;
        }
      })
      .addCase(getInsightTimeline.pending, (state) => {
        state.activeConversationProfile.timelineLoading = true;
        state.activeConversationProfile.timelineError = null;
      })
      .addCase(getInsightTimeline.fulfilled, (state, action) => {
        state.activeConversationProfile.timeline = action.payload;
        state.activeConversationProfile.timelineLoading = false;
      })
      .addCase(getInsightTimeline.rejected, (state, action) => {
        state.activeConversationProfile.timelineError = action.payload;
        state.activeConversationProfile.timelineLoading = false;
      })
      .addCase(createInsight.fulfilled, (state, action) => {
        state.activeConversationProfile.insights.push(action.payload);
      })
      .addCase(deleteInsight.fulfilled, (state, action) => {
        state.activeConversationProfile.insights = state.activeConversationProfile.insights.filter(
          (insight) => insight.id !== action.payload
        );
      })
      .addCase(updateInsightPriority.fulfilled, (state, action) => {
        const insight = state.activeConversationProfile.insights.find(
          (i) => i.id === action.payload.insightId
        );
        if (insight) {
          insight.priority = action.payload.priority;
        }
      });
  }
});

export function createNewConversationProfile(name = 'New chat') {
  return async function (dispatch) {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());

      const user = authService.getCurrentUser();
      const response = await axios.post(
        `${API_URL}/api/conversation/profiles`,
        { name },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user?.access_token}`
          }
        }
      );

      dispatch(setActiveConversationId(response.data.id));
      dispatch(getConversationProfiles());
    } catch (error) {
      toast.error('Something went wrong. Try again!');
      dispatch(setError(error.response?.data || error.message));
    } finally {
      dispatch(setLoading(false));
    }
  };
}

export function getConversationProfiles() {
  return async function (dispatch) {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());

      const user = authService.getCurrentUser();
      console.log('Current user for API call:', { 
        hasUser: !!user, 
        hasToken: !!user?.access_token,
        tokenPreview: user?.access_token ? `${user.access_token.substring(0, 20)}...` : 'none'
      });

      const response = await axios.get(`${API_URL}/api/conversation/profiles`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.access_token}`
        }
      });

      console.log('Raw conversation profiles from API:', response.data);
      
      // Debug conversation names
      if (response.data && response.data.length > 0) {
        const { debugConversations } = await import('../../utils/debugConversations');
        debugConversations(response.data);
      }
      
      // Ensure we have an array even if API returns null/undefined
      const profiles = Array.isArray(response.data) ? response.data : [];
      dispatch(setConversationProfiles(profiles));
    } catch (error) {
      console.error('Failed to fetch conversation profiles:', error.response?.status, error.response?.data);
      
      // Check if it's a 500 error
      if (error.response?.status === 500) {
        toast.error('Server error: Unable to load conversations. Please try again later.');
      } else if (error.response?.status === 401) {
        toast.error('Authentication error. Please log in again.');
      } else {
        toast.error('Failed to load conversations. Please check your connection.');
      }
      
      // Set empty array to prevent crashes
      dispatch(setConversationProfiles([]));
      dispatch(setError(error.response?.data || error.message));
    } finally {
      dispatch(setLoading(false));
    }
  };
}

export function sendConversationMessage({ conversationId, message }) {
  return async function (dispatch, getState) {
    try {
      // Don't send if no conversation ID
      if (!conversationId) {
        console.warn('No conversation ID provided for message');
        return;
      }

      dispatch(setLoading(true));
      dispatch(setIsTyping(true));
      dispatch(clearError());

      // Save the user message to the conversation
      dispatch(saveUserMessage({ message }));

      // Validate conversation before sending message
      const isValid = await validateConversationProfile(conversationId);
      if (!isValid) {
        // Invalid conversation, create a new one
        dispatch(clearInvalidConversation());
        conversationId = await ensureValidConversation(dispatch, getState);
      }

      const user = authService.getCurrentUser();
      const response = await axios.post(
        `${API_URL}/api/conversation/`,
        {
          message,
          conversation_profile_id: conversationId
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user?.access_token}`
          }
        }
      );

      // Handle the response
      if (response.data) {
        const messageData = {
          conversation_id: response.data.conversation_id || Date.now().toString(),
          role: 'assistant',
          messageFromAI: response.data.text || response.data.message || '',
          insights: response.data.insights || [],
          active_step: response.data.active_step || response.data.step || '',
          profileCompleted: response.data.profile_completed || false,
          completionPercentage: response.data.completion_percentage || 0,
          queryOptions: response.data.options || [],
          clientOverview: response.data.client_overview || {}
        };

        // Save the AI response
        dispatch(saveAiResponse(messageData));
        
        // Update conversation profile if needed
        if (response.data.profile) {
          dispatch(updateActiveConversationProfile({
            insights: response.data.profile.insights || [],
            clientOverview: response.data.profile.client_overview || {}
          }));
        }

        // Generate conversation name if this is the first message
        const state = getState();
        const messages = state.conversations.activeConversationProfile.messages || [];
        if (messages.length <= 2) {
          dispatch(generateConversationNameThunk(conversationId));
        }
      }

      return response.data;
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message. Please try again.');
      dispatch(setError(error.response?.data || error.message));
      throw error;
    } finally {
      dispatch(setLoading(false));
      dispatch(setIsTyping(false));
    }
  };
}

export function updateConversationProfile(prompt, conversationId, conversationType) {
  return async function (dispatch) {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());
      dispatch(setIsTyping(true));

      const user = authService.getCurrentUser();
      const response = await axios.post(
        `${API_URL}/api/conversation/update_conversation_profile`,
        { prompt, conversation_profile_id: conversationId },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user?.access_token}`
          }
        }
      );

      const messageFromAI = response.data.message;
      const profileCompleted = response.data.profile_completed;
      const updateStatus = response.data.status;
      const completionPercentage = response.data.completion_percentage;

      const data = {
        messageFromAI,
        role: conversationType,
        insights: response.data.insights,
        updateStatus,
        conversation_id: response.data.conversation_id,
        profileCompleted,
        completionPercentage,
        clientOverview: response.data.client_overview
      };

      dispatch(updateActiveConversationProfile(data));
      dispatch(generateConversationNameThunk(conversationId));
    } catch (error) {
      toast.error('Something went wrong. Try again!');
      dispatch(setError(error.response?.data || error.message));
    } finally {
      dispatch(setLoading(false));
      dispatch(setIsTyping(false));
    }
  };
}

export function getConversationHistory({ id, page = 1, pageSize = 30 }) {
  return async function (dispatch) {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());

      // Validate conversation before fetching history
      const isValid = await validateConversationProfile(id);
      if (!isValid) {
        // Invalid conversation, create a new one
        dispatch(clearInvalidConversation());
        await ensureValidConversation(dispatch, () => ({ conversations: { activeConversationId: id } }));
        
        // Return empty history for new conversation
        dispatch(setActiveConversationProfile({
          messages: [],
          insights: [],
          client_overview: {},
          profile_completed: false,
          completion_percentage: 0
        }));
        return;
      }

      const user = authService.getCurrentUser();

      const response = await axios.get(`${API_URL}/api/conversation/history`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.access_token}`
        },
        params: {
          conversation_profile_id: id,
          page,
          page_size: pageSize
        }
      });

      dispatch(setActiveConversationProfile(response.data));
    } catch (error) {
      // Handle 404 specifically
      if (error.response?.status === 404) {
        console.log('Conversation not found, creating new one...');
        dispatch(clearInvalidConversation());
        
        // Create new conversation
        try {
          await ensureValidConversation(dispatch, () => ({ conversations: { activeConversationId: null } }));
          dispatch(setActiveConversationProfile({
            messages: [],
            insights: [],
            client_overview: {},
            profile_completed: false,
            completion_percentage: 0
          }));
        } catch (createError) {
          toast.error('Failed to create new conversation. Please refresh the page.');
          dispatch(setError(createError.message));
        }
      } else {
        toast.error('Something went wrong. Try again!');
        dispatch(setError(error.response?.data || error.message));
      }
    } finally {
      dispatch(setLoading(false));
    }
  };
}

export function conversationComplete(activeConversationId) {
  return async function (dispatch) {
    try {
      dispatch(clearError());

      // Validate conversation first
      const isValid = await validateConversationProfile(activeConversationId);
      if (!isValid) {
        toast.error('Invalid conversation. Please refresh the page.');
        return;
      }

      const user = authService.getCurrentUser();
      await axios.post(
        `${API_URL}/api/conversation/complete`,
        { conversation_profile_id: activeConversationId },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user?.access_token}`
          }
        }
      );
    } catch (error) {
      dispatch(setError(error.response?.data || error.message));
    }
  };
}

export function getUserId() {
  return async function (dispatch) {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());

      const user = authService.getCurrentUser();
      const response = await axios.get(`${API_URL}/api/user/profile`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.access_token}`
        }
      });

      dispatch(setUserId(response.data));
    } catch (error) {
      dispatch(setError(error.response?.data || error.message));
    } finally {
      dispatch(setLoading(false));
    }
  };
}

export const {
  saveUserMessage,
  saveAiResponse,
  setLoading,
  setError,
  setIsTyping,
  setUserId,
  clearError,
  clearInvalidConversation,
  injectIntoConversation,
  setCompletedSteps,
  setInsights,
  setConversationProfiles,
  setActiveConversationProfile,
  setActiveConversationId,
  setActiveConversationProfileMessage,
  setVisibleClientOverview,
  updateActiveConversationProfile,
  resetConversations,
  resetQueryOptions,
  setLastMessageId,
  addRecommendationsToMessage,
  setShouldUpdateConversation,
  setShouldSendFeedback,
  setSearchProperties,
  setQuickFormSubmissionId,
  addLocalInsight,
  removeLocalInsight
} = conversationSlice.actions;

const conversationReducer = conversationSlice.reducer;

export { conversationReducer, initialState };