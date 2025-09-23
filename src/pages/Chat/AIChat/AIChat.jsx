import React, { Fragment, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  sendConversationMessage,
  getUserId,
  updateConversationProfile,
  getConversationProfiles,
  getConversationHistory,
  setVisibleClientOverview,
  resetQueryOptions,
  setShouldUpdateConversation,
  setShouldSendFeedback,
  createNewConversationProfileThunk,
  validateActiveConversation,
  getInsightTimeline
} from '../../../store/slices/conversationsSlice';
import { ClientOverview } from '../../../components/clientSummary/ClientSummary';
import './AIChat.scss';
import MessageField from '../../../components/messageField/MessageField';
import { AIMessageCard } from './AIMessageCard/AIMessageCard';
import { Box, Button, Chip, Typography, useMediaQuery, useTheme } from '@mui/material';
import AIAvatar from '../../../assets/svg/AIAvatar';
import { useTranslation } from 'react-i18next';
import { WelcomeCard } from './WelcomeCard/WelcomeCard';
import { QueryChips } from './QueryChips/QueryChips';
import { MultiFilterPanel } from './MultiFilterPanel/MultiFilterPanel';
import { UserMessageCard } from './UserMessageCard/UserMessageCard';
import { formatToAmPm } from '../../../utils/date/formatToAmPm';
import { createCheckoutUrl } from '../../../store/slices/subscriptionsSlice';
import { toast, ToastContainer } from 'react-toastify';

import {
  getRecommendationsByConversationId,
  resetRecommendations,
  sendRecommendationsFeedback
} from '../../../store/slices/recomandationsSlice';
import { RecommendationsList } from './RecommendationsList/RecommendationsList';
import { useSearchParams } from 'react-router-dom';
import { ToggleChatMode } from '../Insight/ToggleChatMode/ToggleChatMode';
import { QuickFormContainer } from './QuickFormContainer/QuickFormContainer';
import { Select, MenuItem, FormControl, InputLabel, TextField } from '@mui/material';
import { searchProperties } from '../Sidebar/SearchProperties/SearchProperties';
import RecommendationsModal from '../../../components/modals/RecommendationsModal';
import CreateNewChatModal from '../../../components/modals/CreateNewChatModal';
import LoadingModal from './LoadingModal';
import MissingDataPrompt from '../../../components/enrichment/MissingDataPrompt';

const AiChat = ({ handleChangeMessage, message, onTempInsightsChange, onChatModeChange }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const dispatch = useDispatch();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [chatMode, setChatMode] = useState('chat');
  const [selectedProperty, setSelectedProperty] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [feedback, setFeedback] = useState('');
  const [initialMessageSent, setInitialMessageSent] = useState(false);
  const [showRecommendationsModal, setShowRecommendationsModal] = useState(false);
  const [showCreateNewChatModal, setShowCreateNewChatModal] = useState(false);
  const [pendingChatMode, setPendingChatMode] = useState(null);
  const [tempInsights, setTempInsights] = useState([]);
  const bottomRef = useRef(null);

  const [searchParams, setSearchParams] = useSearchParams();

  const newRecommendations = useSelector((state) => state.recommendations.newRecommendations);
  const enrichedRecommendations = useSelector(
    (state) => state.recommendations.enrichedRecommendations
  );
  const recommendationsLoading = useSelector((state) => state.recommendations.isGenerating);

  // Add logging for recommendation state changes
  useEffect(() => {
    console.log('[AICHAT] 📊 === RECOMMENDATIONS STATE CHANGE ===', {
      newRecommendationsCount: newRecommendations?.length || 0,
      hasNewRecommendations: Array.isArray(newRecommendations) && newRecommendations.length > 0,
      enrichedRecommendationsCount: enrichedRecommendations?.length || 0,
      hasEnrichedRecommendations: Array.isArray(enrichedRecommendations) && enrichedRecommendations.length > 0,
      recommendationsLoading,
      firstNewRecommendation: newRecommendations?.[0],
      firstEnrichedRecommendation: enrichedRecommendations?.[0],
      timestamp: new Date().toISOString(),
      source: 'recommendations-state-selector'
    });
  }, [newRecommendations, enrichedRecommendations, recommendationsLoading]);

  const isActiveSubscription = useSelector((state) => state.subscriptions.subscription.isActive);
  const profileCompleted = useSelector(
    (state) => state.conversations.activeConversationProfile?.profileCompleted
  );
  const visibleClientOverview = useSelector(
    (state) => state.conversations.activeConversationProfile?.visibleClientOverview
  );
  const activeConversationId = useSelector((state) => state.conversations.activeConversationId);

  const shouldUpdateConversation =
    useSelector(
      (state) => state.conversations.activeConversationProfile?.shouldUpdateConversation
    ) || false;

  const shouldSendFeedback = useSelector(
    (state) => state.conversations.activeConversationProfile?.shouldSendFeedback
  );

  const conversations = useSelector((state) => state.conversations);
  const conversationProfiles = useSelector((state) => state.conversations.conversationProfiles);

  const isTyping = conversations.isTyping;

  const hasConversationProfiles =
    Array.isArray(conversationProfiles) && conversationProfiles.length > 0;

  const activeTrial = searchParams.get('active-trial');
  const initialInput = searchParams.get('input');

  const conversationMessages = conversations.activeConversationProfile?.messages;
  const lastMessageId = conversations.activeConversationProfile?.lastMessageId;
  const queryOptions = conversations.activeConversationProfile?.queryOptions;

  const completionPercentage = conversations.activeConversationProfile?.completionPercentage;

  const sortedConversation = conversationMessages
    ? [...conversationMessages].sort((a, b) => new Date(a?.timestamp) - new Date(b?.timestamp))
    : [];

  const isSomeFilled = !sortedConversation.some((msg) => msg.role === 'assistant');

  // Check if this is a quick-form conversation
  const isQuickFormConversation =
    conversationMessages &&
    Array.isArray(conversationMessages) &&
    conversationMessages.some((msg) => msg.role === 'quick_form');

  // Auto-detect chat mode based on conversation content
  useEffect(() => {
    if (isQuickFormConversation && chatMode === 'chat') {
      setChatMode('quick-form');
    }
  }, [isQuickFormConversation, chatMode]);

  // Notify parent component about chat mode changes and refresh insights
  useEffect(() => {
    console.log('🔄 Chat mode changed:', {
      newMode: chatMode,
      activeConversationId,
      hasMessages: conversationMessages?.length > 0
    });

    if (onChatModeChange) {
      onChatModeChange(chatMode);
    }

    // Force conversation data and insights to refresh when switching modes
    // This ensures the timeline and insights are updated for the current mode
    if (activeConversationId) {
      console.log('🔄 Refreshing conversation data for mode switch');
      // Refresh the entire conversation history including insights
      dispatch(getConversationHistory({ id: activeConversationId }));
      // Also refresh the insight timeline
      dispatch(getInsightTimeline(activeConversationId));

      // Clear temp insights when switching modes
      setTempInsights([]);
    }
  }, [chatMode, onChatModeChange, activeConversationId, dispatch]);

  useEffect(() => {
    // Initialize user and conversation profiles
    const initializeChat = async () => {
      try {
        // Get user ID first
        await dispatch(getUserId());
        
        // Get all conversation profiles
        await dispatch(getConversationProfiles());
        
        // Validate active conversation before fetching history
        if (activeConversationId) {
          // Validate the conversation
          const validationResult = await dispatch(validateActiveConversation()).unwrap();
          
          if (validationResult.valid && validationResult.conversationId) {
            // Only fetch history if conversation is valid
            dispatch(getConversationHistory({ id: validationResult.conversationId }));
          } else {
            // If invalid, a new conversation will be created by validateActiveConversation
            console.log('[AICHAT] Invalid conversation detected, new one created');
          }
        } else {
          // No active conversation, create a new one
          await dispatch(validateActiveConversation());
        }
        
        dispatch(setShouldSendFeedback(false));
      } catch (error) {
        console.error('[AICHAT] Failed to initialize chat:', error);
        // Create a new conversation if initialization fails
        dispatch(createNewConversationProfileThunk());
      }
    };
    
    initializeChat();
  }, [dispatch]);

  useEffect(() => {
    if (
      initialInput &&
      initialInput.trim() &&
      !initialMessageSent
    ) {
      searchParams.delete('input');
      setSearchParams(searchParams);
      setInitialMessageSent(true);
    }
  }, [initialInput, initialMessageSent, searchParams, setSearchParams]);

  useEffect(() => {
    console.log('[AICHAT] 🚀 === ACTIVE TRIAL EFFECT TRIGGERED ===', {
      activeTrial,
      hasActiveTrial: Boolean(activeTrial),
      activeConversationId,
      lastMessageId,
      timestamp: new Date().toISOString(),
      source: 'active-trial-useEffect'
    });
    
    if (Boolean(activeTrial)) {
      console.log('[AICHAT] ⏱️ Setting timeout for active trial recommendations...', {
        delay: 1000,
        willCallGetRecommendations: true,
        parameters: {
          conversation_profile_id: activeConversationId,
          conversation_id: lastMessageId || ''
        }
      });
      
      setTimeout(() => {
        console.log('[AICHAT] 🎯 === DISPATCHING RECOMMENDATIONS (ACTIVE TRIAL) ===', {
          conversation_profile_id: activeConversationId,
          conversation_id: lastMessageId || '',
          source: 'active-trial-timeout',
          timestamp: new Date().toISOString()
        });
        
        dispatch(
          getRecommendationsByConversationId({
            conversation_profile_id: activeConversationId,
            conversation_id: lastMessageId || ''
          })
        );
        dispatch(setVisibleClientOverview(false));

        searchParams.delete('active-trial');
        setSearchParams(searchParams);
      }, 1000);
    }
  }, [dispatch, activeTrial]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [sortedConversation, isTyping, newRecommendations]);

  const handleMessage = async (msg) => {
    if (shouldUpdateConversation) {
      dispatch(
        updateConversationProfile(msg, activeConversationId, 'tenant')
      );
      handleChangeMessage('');
      return;
    }

    if (!hasConversationProfiles || !activeConversationId) {
      const result = await dispatch(createNewConversationProfileThunk()).unwrap();
      const newConversationId = result?.payload?.id || result?.id;

      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('conversation', newConversationId);
      setSearchParams(newSearchParams);

      dispatch(
        sendConversationMessage({
          conversationId: newConversationId,
          message: msg
        })
      );
    } else {
      dispatch(
        sendConversationMessage({
          conversationId: activeConversationId,
          message: msg
        })
      );
    }

    handleChangeMessage('');
  };

  // Handle initial message after handleMessage is defined
  useEffect(() => {
    if (initialMessageSent && initialInput && initialInput.trim()) {
      const timer = setTimeout(() => {
        handleMessage(initialInput);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [initialMessageSent, initialInput]);

  const handleUpdateConversation = async () => {
    const property = selectedProperty;
    const value = inputValue;
    
    setSelectedProperty('');
    setInputValue('');
    
    dispatch(
      updateConversationProfile({
        conversationId: activeConversationId,
        message: `I want to update my ${property.toLowerCase()}: ${value}`
      })
    );
    
    dispatch(setShouldUpdateConversation(false));
  };

  const handleChangeQuery = (msg) => {
    handleMessage(msg);
    dispatch(resetQueryOptions());
  };

  const handleDone = () => {
    console.log('[AICHAT] 🎬 === HANDLE DONE TRIGGERED ===', {
      isActiveSubscription,
      activeConversationId,
      lastMessageId,
      willTriggerRecommendations: !!isActiveSubscription,
      timestamp: new Date().toISOString(),
      source: 'handleDone'
    });
    
    if (!isActiveSubscription) {
      console.log('[AICHAT] 💳 No active subscription - redirecting to checkout');
      dispatch(createCheckoutUrl({ plan: 'monthly' }));
    } else {
      console.log('[AICHAT] 🎯 === DISPATCHING RECOMMENDATIONS (HANDLE DONE) ===', {
        conversation_profile_id: activeConversationId,
        conversation_id: lastMessageId,
        willResetRecommendations: true,
        source: 'handleDone-active-subscription',
        timestamp: new Date().toISOString()
      });
      
      dispatch(setVisibleClientOverview(false));
      dispatch(resetRecommendations());
      dispatch(
        getRecommendationsByConversationId({
          conversation_profile_id: activeConversationId,
          conversation_id: lastMessageId
        })
      );
    }
  };

  const handleEditSearch = () => {
    dispatch(setVisibleClientOverview(false));
    dispatch(setShouldUpdateConversation(true));
  };

  const handleSendFeedback = async () => {
    const feedbackText = feedback;
    setFeedback('');
    
    const data = {
      conversation_profile_id: Number(activeConversationId),
      comment: feedbackText
    };

    const response = await sendRecommendationsFeedback(data);

    if (response?.status === 'success') {
      toast.success(t('Your feedback has been sent successfully!'));
    }

    dispatch(setShouldSendFeedback(false));
  };

  const handleShowRecommendationsModal = () => {
    setShowRecommendationsModal(true);
  };

  const handleCloseRecommendationsModal = () => {
    setShowRecommendationsModal(false);
  };

  const handleShowRecommendations = () => {
    console.log('[AICHAT] 🎯 === HANDLE SHOW RECOMMENDATIONS TRIGGERED ===', {
      isActiveSubscription,
      activeConversationId,
      lastMessageId,
      willTriggerRecommendations: !!isActiveSubscription,
      timestamp: new Date().toISOString(),
      source: 'handleShowRecommendations'
    });
    
    setShowRecommendationsModal(false);
    if (!isActiveSubscription) {
      console.log('[AICHAT] 💳 No active subscription - redirecting to checkout from show recommendations');
      dispatch(createCheckoutUrl({ plan: 'monthly' }));
    } else {
      console.log('[AICHAT] 🎯 === DISPATCHING RECOMMENDATIONS (SHOW RECOMMENDATIONS) ===', {
        conversation_profile_id: activeConversationId,
        conversation_id: lastMessageId,
        willResetRecommendations: true,
        source: 'handleShowRecommendations-active-subscription',
        timestamp: new Date().toISOString()
      });
      
      dispatch(setVisibleClientOverview(false));
      dispatch(resetRecommendations());
      dispatch(
        getRecommendationsByConversationId({
          conversation_profile_id: activeConversationId,
          conversation_id: lastMessageId
        })
      );
    }
  };

  const handleCreateNewChatAndSwitch = async () => {
    setShowCreateNewChatModal(false);
    const modeToCopy = pendingChatMode;
    setPendingChatMode(null);
    
    try {
      await dispatch(createNewConversationProfileThunk()).unwrap();
      if (modeToCopy) {
        setChatMode(modeToCopy);
      }
    } catch (e) {
      toast.error(t('Failed to create new chat. Please try again.'));
    }
  };

  const handleToggleChatMode = (mode) => {
    const chatHasMessages = sortedConversation.length > 0;
    const hasRecommendations = Array.isArray(newRecommendations) && newRecommendations.length > 0;

    // If switching to quick-form and there are regular chat messages (not quick-form), create new chat
    if (mode === 'quick-form' && chatHasMessages && !isQuickFormConversation) {
      setPendingChatMode(mode);
      setShowCreateNewChatModal(true);
      return;
    }

    // If switching to chat and there are REAL quick-form messages or recommendations, create new chat
    if (mode === 'chat' && (isQuickFormConversation || hasRecommendations)) {
      setPendingChatMode(mode);
      setShowCreateNewChatModal(true);
      return;
    }

    // Only change mode if no modal is needed
    setChatMode(mode);
  };

  return (
    <div className={`ai-chat ${chatMode === 'quick-form' ? 'quick-form-mode' : ''}`}>
      <LoadingModal open={recommendationsLoading} />
      <ToggleChatMode value={chatMode} onChange={handleToggleChatMode} />

      {chatMode === 'quick-form' && (
        <QuickFormContainer 
          onTempInsightsChange={(insights) => {
            setTempInsights(insights);
            if (onTempInsightsChange) {
              onTempInsightsChange(insights);
            }
          }}
        />
      )}

      {chatMode === 'chat' && (
        <>
          {/* Only show MultiFilterPanel when no messages have been sent yet */}
          {sortedConversation.length === 0 && !isTyping && (
            <MultiFilterPanel isProfileCompleted={profileCompleted} />
          )}

          {/* Only show WelcomeCard when no conversation has started */}
          {sortedConversation.length === 0 && <WelcomeCard />}

          <div className="messages-wrapper">
            {sortedConversation.map((message, i) => {
              const recommendations = message.recommendations;
              const isValidRecommendations =
                Array.isArray(recommendations) && recommendations.length > 0;

              const isNewRecommendations =
                newRecommendations?.[0]?.conversation_id === recommendations?.[0]?.conversation_id;
              return (
                <Fragment key={i}>
                  {message.role === 'user' && (
                    <UserMessageCard
                      message={message.content}
                      time={formatToAmPm(message.timestamp)}
                    />
                  )}
                  {message.role === 'assistant' && <AIMessageCard message={message.content} />}
                  {isValidRecommendations && (
                    <div className="recommendations-block">
                      {(() => {
                        const useEnriched = enrichedRecommendations.length > 0 && enrichedRecommendations[0]?.property;
                        const finalRecommendations = useEnriched ? enrichedRecommendations : recommendations;
                        
                        console.log('[AICHAT] 🏠 === RENDERING RECOMMENDATIONS LIST ===', {
                          messageIndex: i,
                          useEnriched,
                          enrichedCount: enrichedRecommendations?.length || 0,
                          regularCount: recommendations?.length || 0,
                          finalRecommendationsCount: finalRecommendations?.length || 0,
                          firstEnrichedItem: enrichedRecommendations?.[0],
                          firstRegularItem: recommendations?.[0],
                          firstFinalItem: finalRecommendations?.[0],
                          hasPropertyInEnriched: !!enrichedRecommendations?.[0]?.property,
                          timestamp: new Date().toISOString(),
                          source: 'RecommendationsList-render'
                        });
                        
                        return null;
                      })()}
                      <RecommendationsList
                        recommendations={
                          enrichedRecommendations.length > 0 && 
                          enrichedRecommendations[0]?.property 
                            ? enrichedRecommendations 
                            : recommendations
                        }
                        isEnriched={
                          enrichedRecommendations.length > 0 && 
                          enrichedRecommendations[0]?.property
                        }
                      />

                      {isNewRecommendations && (
                        <>
                          <AIMessageCard
                            message={
                              'Are you happy with the results? Do you want to change something?'
                            }
                          />
                          <div className="wrapper-chips">
                            <Chip
                              sx={{ borderRadius: '16px', padding: '10px 20px', fontSize: '16px' }}
                              label="I want to give feedback"
                              clickable
                              color="primary"
                              onClick={() => {
                                dispatch(setShouldSendFeedback(true));
                              }}
                            />
                            <Chip
                              sx={{ borderRadius: '16px', padding: '10px 20px', fontSize: '16px' }}
                              label="I want to change my preferences"
                              clickable
                              color="primary"
                              onClick={() => {
                                handleEditSearch();
                                dispatch(resetRecommendations());
                              }}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </Fragment>
              );
            })}

            <AIMessageCard isTyping={isTyping} />
          </div>
          {shouldUpdateConversation && (
            <div
              style={{
                width: '100%',
                maxWidth: '400px',
                display: 'flex',
                flexDirection: 'column',
                rowGap: '20px',
                marginBottom: '60px'
              }}>
              <FormControl fullWidth>
                <InputLabel id="search-property-label">{t('Select Property')}</InputLabel>
                <Select
                  sx={{ zIndex: '100' }}
                  labelId="search-property-label"
                  value={selectedProperty}
                  label={t('Select Property')}
                  onChange={(e) => setSelectedProperty(e.target.value)}>
                  {searchProperties.map((property) => (
                    <MenuItem key={property} value={property}>
                      {property}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {selectedProperty && (
                <>
                  <TextField
                    fullWidth
                    label={t('Enter new value')}
                    variant="outlined"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                  />
                  <Button
                    disabled={!searchProperties || !inputValue}
                    variant="contained"
                    color="primary"
                    onClick={handleUpdateConversation}>
                    Update
                  </Button>
                </>
              )}
            </div>
          )}
          {shouldSendFeedback && (
            <div
              style={{
                width: '100%',
                maxWidth: '400px',
                display: 'flex',
                flexDirection: 'column',
                rowGap: '20px',
                marginBottom: '40px'
              }}>
              <TextField
                fullWidth
                label={t('Enter your feedback')}
                variant="outlined"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
              <Button
                disabled={!feedback}
                variant="contained"
                color="primary"
                onClick={handleSendFeedback}>
                Send
              </Button>
            </div>
          )}

          {visibleClientOverview && (
            <>
              <div className="client-overview" id="ClientOverview">
                <ClientOverview />
              </div>
              <Box p={isMobile ? 1 : 2}>
                <Box sx={{ display: 'flex' }}>
                  <Box sx={{ mr: 1 }}>
                    <AIAvatar />
                  </Box>
                  <Box>
                    <Typography
                      sx={{
                        fontSize: isMobile ? '14px' : '16px',
                        color: 'black',
                        fontWeight: 500
                      }}>
                      {t('AI Agent')}
                    </Typography>
                    <Typography
                      sx={{ fontSize: isMobile ? '12px' : '14px', color: 'black', mt: 1 }}>
                      {t(
                        'Check All your search parameters. Do you want to edit anything or everything is good?'
                      )}
                    </Typography>
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: isMobile ? 1 : 2,
                    border: `1px solid ${theme.palette.border.grey}`,
                    borderRadius: '10px',
                    my: isMobile ? 2 : 5,
                    py: isMobile ? 2 : 3,
                    flexWrap: 'wrap',
                    [theme.breakpoints.down('md')]: { px: 1 }
                  }}>
                  <Button
                    variant="outlined"
                    sx={{
                      fontWeight: 400,
                      fontSize: isMobile ? '12px' : '14px',
                      px: isMobile ? 1 : 2
                    }}
                    onClick={handleEditSearch}>
                    {t('I want to edit my search parameters')}
                  </Button>
                  <Button
                    data-testid="im-done-btn"
                    onClick={handleDone}
                    variant="contained"
                    sx={{
                      fontWeight: 400,
                      fontSize: isMobile ? '12px' : '14px',
                      px: isMobile ? 1 : 2
                    }}>
                    {t("I'm done")}
                  </Button>
                </Box>
              </Box>
            </>
          )}

          {/* Display New Recommendations */}
          {newRecommendations.length > 0 && !visibleClientOverview && (
            <Box sx={{ mb: 2 }}>
              {(() => {
                const useEnriched = enrichedRecommendations.length > 0 && enrichedRecommendations[0]?.property;
                const finalRecommendations = useEnriched ? enrichedRecommendations : newRecommendations;
                
                console.log('[AICHAT] 🎪 === RENDERING NEW RECOMMENDATIONS LIST ===', {
                  newRecommendationsCount: newRecommendations?.length || 0,
                  visibleClientOverview,
                  useEnriched,
                  enrichedCount: enrichedRecommendations?.length || 0,
                  finalRecommendationsCount: finalRecommendations?.length || 0,
                  firstNewItem: newRecommendations?.[0],
                  firstEnrichedItem: enrichedRecommendations?.[0],
                  firstFinalItem: finalRecommendations?.[0],
                  hasPropertyInEnriched: !!enrichedRecommendations?.[0]?.property,
                  timestamp: new Date().toISOString(),
                  source: 'NewRecommendationsList-render'
                });
                
                return null;
              })()}
              <RecommendationsList
                recommendations={
                  enrichedRecommendations.length > 0 && 
                  enrichedRecommendations[0]?.property 
                    ? enrichedRecommendations 
                    : newRecommendations
                }
                isEnriched={
                  enrichedRecommendations.length > 0 && 
                  enrichedRecommendations[0]?.property
                }
              />
              
              {/* Display missing data prompt if enriched recommendations have missing fields */}
              {enrichedRecommendations.length > 0 && 
               enrichedRecommendations.some(rec => rec.enrichment?.missing_fields?.length > 0) && (
                <Box sx={{ mt: 2 }}>
                  <MissingDataPrompt 
                    missingFields={enrichedRecommendations
                      .flatMap(rec => rec.enrichment?.missing_fields || [])
                      .filter((field, index, self) => 
                        index === self.findIndex(f => f.field === field.field)
                      )}
                  />
                </Box>
              )}
            </Box>
          )}

          <div className="ai-chat-messageField">
            {/* Query Chips */}
            <Box sx={{ mb: 2 }}>
              <QueryChips handleChangeQuery={handleChangeQuery} queryOptions={queryOptions || []} />
            </Box>

            <MessageField
              disabled={!message || isTyping || shouldSendFeedback}
              message={message}
              onChange={(ev) => {
                handleChangeMessage(ev.target.value);
              }}
              onSendMessage={() => handleMessage(message)}
            />

            {/* Show Matches Button - Under Message Input */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button
                variant="contained"
                disabled={!sortedConversation.some((msg) => msg.role === 'assistant')}
                onClick={handleShowRecommendationsModal}
                size="medium"
                sx={{
                  borderRadius: '8px',
                  px: 4,
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  background: sortedConversation.some((msg) => msg.role === 'assistant')
                    ? '#1976d2'
                    : 'rgba(25, 118, 210, 0.3)',
                  color: 'white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  transition: 'all 0.3s',
                  '&:hover': {
                    background: sortedConversation.some((msg) => msg.role === 'assistant')
                      ? '#1565c0'
                      : 'rgba(25, 118, 210, 0.3)',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.15)'
                  },
                  '&:disabled': {
                    background: 'rgba(25, 118, 210, 0.3)',
                    color: 'rgba(255, 255, 255, 0.6)',
                    cursor: 'not-allowed'
                  }
                }}>
                🏠 {t('Show Matches')}
              </Button>
            </Box>
          </div>
        </>
      )}
      <div ref={bottomRef} />
      <ToastContainer position="top-right" autoClose={3000} />

      <RecommendationsModal
        open={showRecommendationsModal}
        onClose={handleCloseRecommendationsModal}
        onShowRecommendations={handleShowRecommendations}
        completionPercentage={completionPercentage}
      />
      <CreateNewChatModal
        open={showCreateNewChatModal}
        onClose={() => {
          setShowCreateNewChatModal(false);
          setPendingChatMode(null);
        }}
        onConfirm={handleCreateNewChatAndSwitch}
        isSubmitting={false} // isSubmitting is removed, so it's always false
        targetMode={pendingChatMode}
      />
    </div>
  );
};

export default AiChat;
