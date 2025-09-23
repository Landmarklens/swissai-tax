import { configureStore } from '@reduxjs/toolkit';
import axios from 'axios';
import config from '../../config/environments';
import { conversationReducer, 
  getInsightTimeline,
  createInsight,
  createInsights,
  deleteInsight,
  updateInsightPriority,
  createNewConversationProfileThunk,
  generateConversationNameThunk,
  saveAiResponse,
  addRecommendationsToMessage,
  setVisibleClientOverview,
  setSearchProperties,
  setShouldUpdateConversation,
  setShouldSendFeedback,
  setLastMessageId,
  resetQueryOptions,
  updateActiveConversationProfile,
  setActiveConversationProfile,
  setActiveConversationProfileMessage,
  setActiveConversationId,
  setConversationProfiles,
  setUserId,
  clearError,
  setLoading,
  setError,
  setIsTyping,
  resetConversations,
  getConversationProfiles,
  sendConversationMessage,
  updateConversationProfile,
  getConversationHistory,
  conversationComplete,
  getUserId
} from './conversationsSlice';
import authService from '../../services/authService';
import { toast } from 'react-toastify';

jest.mock('axios');
jest.mock('../../services/authService');
jest.mock('react-toastify', () => ({
  toast: {
    error: jest.fn()
  }
}));

// Use the same API URL as the actual slice
const API_URL = process.env.REACT_APP_API_URL || config.API_BASE_URL || 'https://api.homeai.ch';

describe('conversationsSlice', () => {
  let store;
  const mockUser = { access_token: 'test-token' };

  beforeEach(() => {
    store = configureStore({
      reducer: {
        conversations: conversationReducer
      }
    });
    jest.clearAllMocks();
    axios.get.mockReset();
    axios.post.mockReset();
    axios.delete.mockReset();
    authService.getCurrentUser.mockReturnValue(mockUser);
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState().conversations;
      expect(state).toEqual({
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
      });
    });
  });

  describe('reducers', () => {
    it('should handle saveAiResponse', () => {
      const payload = {
        conversation_id: 'conv123',
        role: 'assistant',
        messageFromAI: 'Hello',
        insights: ['insight1'],
        searchProperties: { area: 'downtown' },
        profileCompleted: true,
        active_step: 'step2',
        queryOptions: ['option1', 'option2']
      };

      store.dispatch(saveAiResponse(payload));
      const state = store.getState().conversations;

      expect(state.activeConversationProfile.messages).toHaveLength(1);
      expect(state.activeConversationProfile.messages[0]).toEqual({
        conversation_id: 'conv123',
        role: 'assistant',
        content: 'Hello'
      });
      expect(state.activeConversationProfile.insights).toEqual(['insight1']);
      expect(state.activeConversationProfile.lastMessageId).toBe('conv123');
      expect(state.activeConversationProfile.profileCompleted).toBe(true);
      expect(state.activeConversationProfile.visibleClientOverview).toBe(true);
    });

    it('should handle addRecommendationsToMessage', () => {
      // Setup initial message
      store.dispatch(saveAiResponse({
        conversation_id: 'conv123',
        role: 'assistant',
        messageFromAI: 'Hello'
      }));

      const recommendations = [{ conversation_id: 'conv123', property: 'rec1' }];
      store.dispatch(addRecommendationsToMessage(recommendations));

      const state = store.getState().conversations;
      expect(state.activeConversationProfile.messages[0].recommendations).toEqual(recommendations);
    });

    it('should handle setActiveConversationProfileMessage', () => {
      const messages = [
        { role: 'user', content: 'User message', timestamp: Date.now() }
      ];
      store.dispatch(setActiveConversationProfileMessage(messages));

      const state = store.getState().conversations;
      expect(state.activeConversationProfile.messages).toHaveLength(1);
      expect(state.activeConversationProfile.messages[0].role).toBe('user');
      expect(state.activeConversationProfile.messages[0].content).toBe('User message');
      expect(state.activeConversationProfile.messages[0].timestamp).toBeDefined();
    });

    it('should handle resetConversations', () => {
      store.dispatch(setLoading(true));
      store.dispatch(setError('Some error'));
      store.dispatch(resetConversations());

      const state = store.getState().conversations;
      expect(state.loading).toBe(false);
      expect(state.error).toBe(null);
    });
  });

  describe('async thunks', () => {
    describe('getInsightTimeline', () => {
      it('should handle getInsightTimeline.pending', () => {
        store.dispatch(getInsightTimeline.pending());
        const state = store.getState().conversations;
        expect(state.activeConversationProfile.timelineLoading).toBe(true);
        expect(state.activeConversationProfile.timelineError).toBe(null);
      });

      it('should handle getInsightTimeline.fulfilled', async () => {
        const mockTimeline = [{ id: 1, event: 'created' }];
        // Mock validation call first, then timeline call
        axios.get
          .mockResolvedValueOnce({ data: [{ id: 'profile123', name: 'Test' }] })
          .mockResolvedValueOnce({ data: mockTimeline });

        await store.dispatch(getInsightTimeline('profile123'));

        expect(axios.get).toHaveBeenNthCalledWith(2, `${API_URL}/api/insights/timeline`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token'
          },
          params: { conversation_profile_id: 'profile123' }
        });

        const state = store.getState().conversations;
        expect(state.activeConversationProfile.timelineLoading).toBe(false);
        expect(state.activeConversationProfile.timeline).toEqual(mockTimeline);
      });

      it('should handle getInsightTimeline.rejected', async () => {
        // Mock validation to return invalid profile
        axios.get.mockResolvedValue({ data: [] });

        await store.dispatch(getInsightTimeline('profile123'));

        const state = store.getState().conversations;
        expect(state.activeConversationProfile.timelineLoading).toBe(false);
        expect(state.activeConversationProfile.timelineError).toEqual({ error: 'Invalid conversation profile' });
      });
    });

    describe('createInsight', () => {
      it('should create insight successfully', async () => {
        const mockInsight = { id: 1, text: 'New insight' };
        const insightData = { text: 'New insight', profile_id: 'profile123' };
        
        // Set up initial state with active conversation
        store.dispatch(setActiveConversationId('profile123'));
        
        // Mock validation call to return valid profile
        axios.get.mockResolvedValue({ data: [{ id: 'profile123', name: 'Test' }] });
        axios.post.mockResolvedValue({ data: mockInsight });

        const result = await store.dispatch(createInsight(insightData));

        expect(axios.post).toHaveBeenCalledWith(
          `${API_URL}/api/insights`,
          { ...insightData, conversation_profile_id: 'profile123' },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer test-token'
            }
          }
        );
        expect(result.payload).toEqual(mockInsight);
      });
    });

    describe('deleteInsight', () => {
      it('should handle deleteInsight.fulfilled', async () => {
        // Setup initial state with insights
        store.dispatch(setActiveConversationProfile({
          messages: [],
          insights: [{ id: 1, text: 'insight1' }, { id: 2, text: 'insight2' }],
          profile_completed: false
        }));

        axios.delete.mockResolvedValue({});

        await store.dispatch(deleteInsight(1));

        expect(axios.delete).toHaveBeenCalledWith(
          `${API_URL}/insights/1`,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer test-token'
            }
          }
        );

        const state = store.getState().conversations;
        expect(state.activeConversationProfile.insights).toHaveLength(1);
        expect(state.activeConversationProfile.insights[0].id).toBe(2);
      });
    });

    describe('updateInsightPriority', () => {
      it('should handle updateInsightPriority.fulfilled', async () => {
        // Setup initial state with insights
        store.dispatch(setActiveConversationProfile({
          messages: [],
          insights: [{ id: 1, priority: 'low' }, { id: 2, priority: 'medium' }],
          profile_completed: false
        }));

        const updateData = { insightId: 1, priority: 'high' };
        axios.put.mockResolvedValue({ data: { priority: 'high' } });

        await store.dispatch(updateInsightPriority(updateData));

        expect(axios.put).toHaveBeenCalledWith(
          `${API_URL}/insights/1/priority`,
          { priority: 'high' },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer test-token'
            }
          }
        );

        const state = store.getState().conversations;
        expect(state.activeConversationProfile.insights[0].priority).toBe('high');
      });
    });

    describe('createNewConversationProfileThunk', () => {
      it('should handle createNewConversationProfileThunk.fulfilled', async () => {
        const newProfile = { id: 'prof123', name: 'New chat' };
        axios.post.mockResolvedValue({ data: newProfile });

        await store.dispatch(createNewConversationProfileThunk('New chat'));

        expect(axios.post).toHaveBeenCalledWith(
          `${API_URL}/api/conversation/profiles`,
          { name: 'New chat' },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer test-token'
            }
          }
        );

        const state = store.getState().conversations;
        expect(state.conversationProfiles).toContainEqual(newProfile);
        expect(state.activeConversationId).toBe('prof123');
      });

      it('should show error toast on failure', async () => {
        axios.post.mockRejectedValue(new Error('Network error'));

        await store.dispatch(createNewConversationProfileThunk('New chat'));

        expect(toast.error).toHaveBeenCalledWith('Something went wrong. Try again!');
      });
    });

    describe('generateConversationNameThunk', () => {
      it('should handle generateConversationNameThunk.fulfilled', async () => {
        // Setup initial profiles
        store.dispatch(setConversationProfiles([
          { id: 'prof123', name: 'Old name' },
          { id: 'prof456', name: 'Other chat' }
        ]));

        const updatedProfile = { id: 'prof123', name: 'Generated name' };
        axios.post.mockResolvedValue({ data: updatedProfile });

        await store.dispatch(generateConversationNameThunk('prof123'));

        const state = store.getState().conversations;
        expect(state.conversationProfiles[0].name).toBe('Generated name');
        expect(state.conversationProfiles[1].name).toBe('Other chat');
      });
    });
  });

  describe('thunk functions', () => {
    describe('getConversationProfiles', () => {
      it('should fetch and set conversation profiles', async () => {
        const mockProfiles = [{ id: 1, name: 'Profile 1' }, { id: 2, name: 'Profile 2' }];
        axios.get.mockResolvedValue({ data: mockProfiles });

        await getConversationProfiles()(store.dispatch);

        expect(axios.get).toHaveBeenCalledWith(`${API_URL}/api/conversation/profiles`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token'
          }
        });

        const state = store.getState().conversations;
        expect(state.conversationProfiles).toEqual(mockProfiles);
      });

      it('should show error toast on failure', async () => {
        axios.get.mockRejectedValue(new Error('Network error'));

        await getConversationProfiles()(store.dispatch);

        expect(toast.error).toHaveBeenCalledWith('Failed to load conversations. Please check your connection.');
      });
    });

    describe('sendConversationMessage', () => {
      it('should send message and handle response', async () => {
        const mockResponse = {
          data: {
            sender: 'assistant',
            text: 'AI response',
            conversation_id: 'conv123',
            insights: ['insight1'],
            profile_completed: true,
            step: 'final',
            options: ['opt1'],
            profile: { insights: { area: 'downtown' } }
          }
        };
        
        // Mock validation response
        axios.get.mockResolvedValue({
          data: [{ id: 'profile123', name: 'Test chat' }]
        });
        axios.post.mockResolvedValue(mockResponse);

        await sendConversationMessage({
          conversationId: 'profile123',
          message: 'User message'
        })(store.dispatch, store.getState);

        expect(axios.post).toHaveBeenCalledWith(
          `${API_URL}/api/conversation/`,
          { message: 'User message', conversation_profile_id: 'profile123' },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer test-token'
            }
          }
        );

        const state = store.getState().conversations;
        expect(state.activeConversationProfile.messages).toHaveLength(2); // User + AI
        expect(state.isTyping).toBe(false);
        expect(state.loading).toBe(false);
      });

      it('should not send message if no conversationId', async () => {
        await sendConversationMessage({
          conversationId: null,
          message: 'User message'
        })(store.dispatch, store.getState);

        expect(axios.post).not.toHaveBeenCalled();
      });
    });

    describe('getConversationHistory', () => {
      it('should fetch conversation history and insights', async () => {
        const mockHistory = {
          data: {
            messages: [{ role: 'user', content: 'Hi' }],
            insights: { insights: [] },
            profile_completed: true
          }
        };
        const mockInsights = [{ id: 1, text: 'insight' }];

        // First call for validation, second for history
        axios.get
          .mockResolvedValueOnce({ data: [{ id: 'profile123', name: 'Test' }] })
          .mockResolvedValueOnce(mockHistory);

        await getConversationHistory({
          id: 'profile123',
          page: 1,
          pageSize: 30
        })(store.dispatch);

        expect(axios.get).toHaveBeenCalledTimes(2);
        // Test for conversation history API call
        expect(axios.get).toHaveBeenNthCalledWith(2,
          `${API_URL}/api/conversation/history`,
          expect.objectContaining({
            params: {
              conversation_profile_id: 'profile123',
              page: 1,
              page_size: 30
            }
          })
        );

        const state = store.getState().conversations;
        expect(state.activeConversationProfile.messages).toEqual(mockHistory.data.messages);
        expect(state.loading).toBe(false);
      });
    });

    describe('conversationComplete', () => {
      it('should complete conversation', async () => {
        // Mock validation response
        axios.get.mockResolvedValue({ data: [{ id: 'profile123', name: 'Test' }] });
        axios.post.mockResolvedValue({ data: { success: true } });

        await conversationComplete('profile123')(store.dispatch);

        expect(axios.post).toHaveBeenCalledWith(
          `${API_URL}/api/conversation/complete`,
          { conversation_profile_id: 'profile123' },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer test-token'
            }
          }
        );
      });
    });

    describe('getUserId', () => {
      it('should fetch and set user ID', async () => {
        const mockUserData = { id: 'user123', name: 'Test User' };
        axios.get.mockResolvedValue({ data: mockUserData });

        await getUserId()(store.dispatch);

        expect(axios.get).toHaveBeenCalledWith(
          `${API_URL}/api/user/profile`,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer test-token'
            }
          }
        );

        const state = store.getState().conversations;
        expect(state.userId).toEqual(mockUserData);
        expect(state.loading).toBe(false);
      });
    });
  });
});