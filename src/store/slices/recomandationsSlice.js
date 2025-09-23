import { createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import authService from '../../services/authService';
import { toast } from 'react-toastify';
import { isFeatureEnabled } from '../../config/features';
import config from '../../config/environments';
import {
  addRecommendationsToMessage,
  setVisibleClientOverview,
  createNewConversationProfileThunk,
  setActiveConversationProfile
} from './conversationsSlice';
import {
  getEnrichedRecommendationsByConversationId as fetchEnrichedRecommendations,
  transformEnrichedToLegacyFormat 
} from '../../api/recommendationsV2';

const API_URL = process.env.REACT_APP_API_URL || config.API_BASE_URL || 'https://api.homeai.ch';

const initialState = {
  newRecommendations: [],
  enrichedRecommendations: [], // Store enriched format separately
  error: null,
  loading: false,
  isGenerating: false,
  // Async job tracking
  currentJob: null,
  jobProgress: {
    status: null,
    percentage: 0,
    message: ''
  }
};

const recommendationSlice = createSlice({
  name: 'recommendation',
  initialState,
  reducers: {
    saveRecommendations: (state, action) => {
      console.log('[REDUX-REDUCER] 💾 === SAVE RECOMMENDATIONS REDUCER CALLED ===', {
        payloadKeys: Object.keys(action.payload || {}),
        dataLength: action.payload.data?.length,
        enrichedDataLength: action.payload.enrichedData?.length,
        conversationId: action.payload.conversationId,
        hasData: !!action.payload.data,
        hasEnrichedData: !!action.payload.enrichedData,
        firstDataItem: action.payload.data?.[0],
        firstEnrichedItem: action.payload.enrichedData?.[0],
        timestamp: new Date().toISOString()
      });
      
      console.log('[REDUX-REDUCER] 📊 Previous state:', {
        previousNewRecommendationsCount: state.newRecommendations?.length || 0,
        previousEnrichedRecommendationsCount: state.enrichedRecommendations?.length || 0,
        previousLoading: state.loading,
        previousIsGenerating: state.isGenerating
      });
      
      state.newRecommendations = action.payload.data;
      console.log('[REDUX-REDUCER] ✅ Updated newRecommendations:', {
        newCount: state.newRecommendations?.length || 0,
        firstItem: state.newRecommendations?.[0],
        timestamp: new Date().toISOString()
      });
      
      // Store enriched data if provided
      if (action.payload.enrichedData) {
        state.enrichedRecommendations = action.payload.enrichedData;
        console.log('[REDUX-REDUCER] ✅ Updated enrichedRecommendations:', {
          enrichedCount: state.enrichedRecommendations?.length || 0,
          firstEnrichedItem: state.enrichedRecommendations?.[0],
          timestamp: new Date().toISOString()
        });
      } else {
        console.log('[REDUX-REDUCER] ℹ️ No enriched data provided, keeping existing enriched recommendations');
      }
      
      console.log('[REDUX-REDUCER] 🏁 === SAVE RECOMMENDATIONS COMPLETE ===', {
        finalNewRecommendationsCount: state.newRecommendations?.length || 0,
        finalEnrichedRecommendationsCount: state.enrichedRecommendations?.length || 0,
        timestamp: new Date().toISOString()
      });
    },
    resetRecommendations: (state, action) => {
      state.newRecommendations = [];
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setIsGenerating: (state, action) => {
      state.isGenerating = action.payload;
    },
    setCurrentJob: (state, action) => {
      state.currentJob = action.payload;
    },
    updateJobProgress: (state, action) => {
      state.jobProgress = {
        status: action.payload.status || state.jobProgress.status,
        percentage: action.payload.progress || state.jobProgress.percentage,
        message: action.payload.message || state.jobProgress.message
      };
    },
    resetJobProgress: (state) => {
      state.currentJob = null;
      state.jobProgress = {
        status: null,
        percentage: 0,
        message: ''
      };
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(createNewConversationProfileThunk.fulfilled, (state) => {
        state.newRecommendations = [];
      })
      .addCase(setActiveConversationProfile, (state, action) => {
        if (action.payload.messages && Array.isArray(action.payload.messages)) {
          const quickFormMessages = action.payload.messages.filter(
            (msg) => msg.role === 'quick_form'
          );
          if (quickFormMessages.length > 0) {
            const newestQuickFormMessage = quickFormMessages[0];
            if (
              newestQuickFormMessage.recommendations &&
              Array.isArray(newestQuickFormMessage.recommendations)
            ) {
              state.newRecommendations = newestQuickFormMessage.recommendations;
            }
          }
        }
      });
  }
});



export const getRecommendationsByConversationId = ({
  conversation_profile_id,
  conversation_id,
  quick_form_submission_id
}) => {
  return async (dispatch) => {
    console.log('[REDUX] 🎯 === getRecommendationsByConversationId CALLED ===', {
      conversation_profile_id,
      conversation_id,
      quick_form_submission_id,
      timestamp: new Date().toISOString(),
      callStack: new Error().stack.split('\n').slice(1, 5).map(line => line.trim())
    });

    // Use v2 enriched endpoint if feature is enabled
    const useEnriched = isFeatureEnabled('useEnrichedRecommendations');
    console.log('[REDUX] 🚩 Feature flag check result:', {
      useEnrichedRecommendations: useEnriched,
      willUseV2: useEnriched,
      alternativePath: !useEnriched ? 'legacy-sync-api' : 'v2-async-api'
    });

    if (useEnriched) {
      console.log('[REDUX] ✅ USING V2 ASYNC API - Dispatching getEnrichedRecommendationsByConversationId');
      return dispatch(getEnrichedRecommendationsByConversationId({
        conversation_profile_id,
        conversation_id,
        useV2: true,
        forceRefresh: false
      }));
    } else {
      console.log('[REDUX] ⚠️ USING LEGACY SYNC API - Feature flag disabled');
    }
    
    // Original implementation for backward compatibility
    try {
      dispatch(setIsGenerating(true));

      const user = authService.getCurrentUser();

      let url = `${API_URL}/recommendations?conversation_profile_id=${conversation_profile_id}`;
      if (conversation_id !== undefined && conversation_id !== null) {
        url += `&conversation_id=${conversation_id}`;
      }
      if (quick_form_submission_id !== undefined && quick_form_submission_id !== null) {
        url += `&quick_form_submission_id=${quick_form_submission_id}`;
      }

      const response = await axios.get(url, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.access_token}`
        }
      });

      const data = response.data;

      if (!Array.isArray(data) || data.length === 0) {
        toast.warning('No properties match your current search criteria');
        dispatch(setVisibleClientOverview(true));
      }

      dispatch(addRecommendationsToMessage(data));

      dispatch(saveRecommendations({ data, conversationId: conversation_profile_id }));
      dispatch(setIsGenerating(false));
    } catch (error) {
      // Check if it's a timeout error
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        toast.error('Recommendation generation is taking longer than expected. Please try again.');
      } else if (error.response?.status === 500) {
        toast.error('Server error while generating recommendations. Please try again.');
      } else {
        toast.error('Something went wrong. Try again!');
      }
      
      dispatch(setVisibleClientOverview(true));
      dispatch(setError(error.response?.data || error.message));
      dispatch(setIsGenerating(false));
    }
  };
};
export const sendRecommendationsFeedback = async ({
  conversation_profile_id,
  recommendation_id,
  comment
}) => {
  try {
    const user = authService.getCurrentUser();
    const response = await axios.post(
      `${API_URL}/recommendations/feedback`,
      { conversation_profile_id, comment, recommendation_id },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.access_token}`
        }
      }
    );

    return response.data;
  } catch (error) {
  }
};

// New action for enriched recommendations (v2 endpoints with async support)
export const getEnrichedRecommendationsByConversationId = ({
  conversation_profile_id,
  conversation_id,
  useV2 = true,
  forceRefresh = false
}) => {
  return async (dispatch) => {
    console.log('[REDUX] 🚀 === STARTING getEnrichedRecommendationsByConversationId ===', {
      conversation_profile_id,
      conversation_id,
      useV2,
      forceRefresh,
      timestamp: new Date().toISOString(),
      calledFrom: 'enriched-recommendations-action',
      functionName: 'getEnrichedRecommendationsByConversationId'
    });
    
    try {
      dispatch(setIsGenerating(true));
      dispatch(resetJobProgress());

      console.log('[REDUX] 🔍 useV2 parameter check:', {
        useV2,
        typeof_useV2: typeof useV2,
        willUseV2Path: !!useV2,
        alternativePath: !useV2 ? 'fallback-to-original' : 'v2-async-path'
      });

      if (useV2) {
        console.log('[REDUX] ✅ CONFIRMED: Using V2 async path');
        
        // Progress callback to update UI
        const onProgress = (progressData) => {
          console.log('[REDUX] 📊 Progress update:', progressData);
          dispatch(updateJobProgress(progressData));
          
          // Show toast messages for key milestones
          if (progressData.status === 'processing' && progressData.progress === 50) {
            toast.info('AI is analyzing your preferences...', { autoClose: 2000 });
          } else if (progressData.status === 'processing' && progressData.progress >= 75) {
            toast.info('Almost done...', { autoClose: 1500 });
          }
        };

        // Use new v2 async endpoint with progress tracking
        console.log('[REDUX] 🌐 About to call fetchEnrichedRecommendations with params:', {
          conversation_profile_id,
          conversation_id,
          forceRefresh,
          hasProgressCallback: !!onProgress
        });
        const enrichedData = await fetchEnrichedRecommendations(
          conversation_profile_id,
          conversation_id,
          forceRefresh,
          onProgress // Pass progress callback
        );
        console.log('[REDUX] 📨 fetchEnrichedRecommendations returned:', {
          dataType: typeof enrichedData,
          isArray: Array.isArray(enrichedData),
          length: enrichedData?.length,
          hasData: !!enrichedData,
          errorType: enrichedData?.errorType
        });
        
        // Check if this is a "No properties found" response
        if (enrichedData?.errorType === 'NO_PROPERTIES_FOUND') {
          console.log('[REDUX] Handling NO_PROPERTIES_FOUND scenario');
          
          // Show user-friendly message with suggestions
          toast.warning(enrichedData.userMessage || 'No properties match your current search criteria', {
            autoClose: 5000
          });
          
          // Show suggestions as info toasts
          if (enrichedData.suggestions && enrichedData.suggestions.length > 0) {
            setTimeout(() => {
              toast.info(
                <div>
                  <strong>Try these suggestions:</strong>
                  <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                    {enrichedData.suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>,
                { autoClose: 8000 }
              );
            }, 500);
          }
          
          // Clear any existing recommendations and show client overview
          dispatch(saveRecommendations({ data: [], enrichedData: [], conversationId: conversation_profile_id }));
          dispatch(setVisibleClientOverview(true));
          dispatch(resetJobProgress());
          dispatch(setIsGenerating(false));
          return; // Exit early
        }
        
        console.log('[REDUX] Received enriched data:', {
          isArray: Array.isArray(enrichedData),
          length: enrichedData?.length || 0,
          firstItem: enrichedData?.[0],
          dataType: typeof enrichedData
        });

        if (!Array.isArray(enrichedData) || enrichedData.length === 0) {
          console.warn('[REDUX] No enriched data received or empty array');
          toast.warning('No properties match your current search criteria');
          dispatch(setVisibleClientOverview(true));
          dispatch(resetJobProgress());
          dispatch(setIsGenerating(false));
          return; // Exit early if no data
        }

        // Transform to legacy format for backward compatibility
        console.log('[REDUX] 🔄 === TRANSFORMING ENRICHED DATA TO LEGACY FORMAT ===', {
          inputDataCount: enrichedData.length,
          inputDataType: typeof enrichedData,
          firstInputItem: enrichedData[0],
          inputStructure: enrichedData[0] ? Object.keys(enrichedData[0]) : null,
          hasPropertyField: !!enrichedData[0]?.property,
          hasEnrichmentField: !!enrichedData[0]?.enrichment,
          timestamp: new Date().toISOString()
        });
        
        const legacyFormatData = enrichedData
          .map((item, index) => {
            console.log(`[REDUX] 🔄 Transforming item ${index + 1}/${enrichedData.length}:`, {
              itemId: item?.id || item?.property?.id,
              hasProperty: !!item?.property,
              hasEnrichment: !!item?.enrichment,
              itemKeys: Object.keys(item || {}),
              timestamp: new Date().toISOString()
            });
            
            const transformed = transformEnrichedToLegacyFormat(item);
            if (!transformed) {
              console.error(`[REDUX] ❌ Failed to transform item ${index}:`, {
                originalItem: item,
                reason: 'transformEnrichedToLegacyFormat returned null',
                timestamp: new Date().toISOString()
              });
            } else {
              console.log(`[REDUX] ✅ Successfully transformed item ${index}:`, {
                originalId: item?.id || item?.property?.id,
                transformedId: transformed?.id,
                transformedTitle: transformed?.title,
                hasEnrichmentData: !!transformed?.enrichment_scores,
                transformedKeys: Object.keys(transformed),
                timestamp: new Date().toISOString()
              });
            }
            return transformed;
          })
          .filter(item => item !== null); // Remove any failed transformations
        
        console.log('[REDUX] Transformation complete:', {
          originalCount: enrichedData.length,
          transformedCount: legacyFormatData.length,
          firstTransformed: legacyFormatData[0]
        });
        
        if (legacyFormatData.length === 0) {
          console.error('[REDUX] No valid recommendations after transformation', enrichedData);
          toast.warning('Unable to display recommendations. Please try again.');
          dispatch(setVisibleClientOverview(true));
          dispatch(resetJobProgress());
          dispatch(setIsGenerating(false));
          return;
        }
        
        // Store both formats - legacy for components, enriched for new features
        console.log('[REDUX] 💾 === STORING RECOMMENDATIONS TO REDUX ===', {
          legacyCount: legacyFormatData.length,
          enrichedCount: enrichedData.length,
          conversationProfileId: conversation_profile_id,
          firstLegacyItem: legacyFormatData[0],
          firstEnrichedItem: enrichedData[0],
          legacyItemKeys: legacyFormatData[0] ? Object.keys(legacyFormatData[0]) : null,
          timestamp: new Date().toISOString()
        });
        
        console.log('[REDUX] 📝 Dispatching addRecommendationsToMessage with legacy data...');
        dispatch(addRecommendationsToMessage(legacyFormatData));
        
        console.log('[REDUX] 💾 Dispatching saveRecommendations with both formats...', {
          savePayload: {
            dataLength: legacyFormatData.length,
            enrichedDataLength: enrichedData.length,
            conversationId: conversation_profile_id
          }
        });
        dispatch(saveRecommendations({ 
          data: legacyFormatData, 
          enrichedData,
          conversationId: conversation_profile_id 
        }));
        
        console.log('[REDUX] ✅ === RECOMMENDATIONS SUCCESSFULLY STORED ===', {
          storedLegacyCount: legacyFormatData.length,
          storedEnrichedCount: enrichedData.length,
          conversationId: conversation_profile_id,
          timestamp: new Date().toISOString()
        });
        
        // Clear progress after successful completion
        dispatch(resetJobProgress());
        toast.success(`Found ${legacyFormatData.length} recommendations!`, { autoClose: 2000 });
      } else {
        // Fallback to original implementation
        dispatch(getRecommendationsByConversationId({
          conversation_profile_id,
          conversation_id
        }));
      }
      
      dispatch(setIsGenerating(false));
      console.log('[REDUX] === Completed getEnrichedRecommendationsByConversationId ===');
    } catch (error) {
      console.error('[REDUX] === Error in getEnrichedRecommendationsByConversationId ===', {
        error: error.message,
        response: error.response,
        stack: error.stack
      });
      
      // Handle "No properties found" error specifically
      if (error.message?.includes('No properties match the search criteria') || 
          error.message?.includes('No recommendations found')) {
        toast.warning('No properties currently match your search criteria. Try adjusting your preferences or expanding your search area.', {
          autoClose: 5000
        });
        
        // Show helpful suggestions
        setTimeout(() => {
          toast.info(
            <div>
              <strong>Suggestions:</strong>
              <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                <li>Expand your search area</li>
                <li>Adjust your budget range</li>
                <li>Try different property types</li>
                <li>Modify must-have features</li>
              </ul>
            </div>,
            { autoClose: 8000 }
          );
        }, 500);
      }
      // Check if it's a timeout error
      else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout') || error.message?.includes('Timeout')) {
        toast.error('Recommendation generation is taking longer than expected. Please try again.');
      } else if (error.response?.status === 500) {
        toast.error('Server error while generating recommendations. Please try again.');
      } else if (error.response?.status === 504) {
        toast.error('Request timed out. The system is now using faster processing. Please try again.');
      } else {
        toast.error('Something went wrong. Try again!');
      }
      
      // Always clear state and reset on error to prevent infinite loops
      dispatch(saveRecommendations({ data: [], enrichedData: [], conversationId: conversation_profile_id }));
      dispatch(setVisibleClientOverview(true));
      dispatch(setError(error.response?.data || error.message));
      dispatch(setIsGenerating(false));
      dispatch(resetJobProgress());
    }
  };
};

export const { 
  setError, 
  saveRecommendations, 
  setLoading, 
  resetRecommendations, 
  setIsGenerating,
  setCurrentJob,
  updateJobProgress,
  resetJobProgress 
} = recommendationSlice.actions;

export default recommendationSlice.reducer;
