import React, { useCallback, useEffect, useMemo, useState } from 'react';
import './Sidebar.scss';
import { useMediaQuery, Box, Typography, IconButton } from '@mui/material';
import { theme } from '../../../theme/theme';
import { ConversationsList } from './ConversationsList/ConversationsList';
import PropTypes from 'prop-types';
import AddIcon from '@mui/icons-material/Add';
import ChatIcon from '@mui/icons-material/Chat';
import SearchIcon from '@mui/icons-material/Search';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import HistoryIcon from '@mui/icons-material/History';
import HomeIcon from '@mui/icons-material/Home';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { createNewConversationProfileThunk } from '../../../store/slices/conversationsSlice';
import { useSearchParams } from 'react-router-dom';
import { throttle } from '../../../utils/performanceUtils';

const Sidebar = ({ activeTab, onToggleCollapse, isCollapsed, onNewChat, chatMode = 'chat' }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery('(min-width:600px) and (max-width:1100px)');

  const [sidebarMode, setSidebarMode] = useState('tips'); // 'tips' or 'chats'

  const handleCreateNewConversation = useCallback(
    async (conversationName) => {
      try {
        // Clear insights and form state when creating new chat
        if (onNewChat) {
          onNewChat();
        }

        const result = await dispatch(createNewConversationProfileThunk(conversationName)).unwrap();
        const newConversationId = result?.payload?.id || result?.id;

        // Add the new conversation ID to URL search params
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set('conversation', newConversationId);
        setSearchParams(newSearchParams);

        setSidebarMode('tips');
      } catch (err) {
        console.error(err);
      }
    },
    [dispatch, searchParams, setSearchParams, onNewChat]
  );

  const throttledHandler = useMemo(() => {
    return throttle(handleCreateNewConversation, 1000, { trailing: false });
  }, [handleCreateNewConversation]);

  useEffect(() => {
    return () => {
      throttledHandler.cancel();
    };
  }, [throttledHandler]);

  const handleSidebarToggle = (mode) => {
    setSidebarMode(mode);
  };

  const handleConversationSelect = (id) => {
    // Switch to tips mode when a conversation is selected
    setSidebarMode('tips');
  };


  const handleToggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    }
  };

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {(isMobile ? activeTab === 'search' : true) && (
        <div className="sidebar-content">
          {/* Collapse/Expand Button */}
          {!isMobile && !isTablet && (
            <button className="collapse-button" onClick={handleToggleCollapse}>
              {isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </button>
          )}

          {/* Header Section - AI Assistant Branding */}
          <Box sx={{
            p: 2,
            borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            mb: 2
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <AutoAwesomeIcon sx={{ fontSize: 20 }} />
              {!isCollapsed && (
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  HomeAI Assistant
                </Typography>
              )}
            </Box>
            {!isCollapsed && (
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                Find your perfect home with AI
              </Typography>
            )}
          </Box>

          {/* New Chat Button - Prominent */}
          <Box sx={{ px: 2, mb: 2 }}>
            <button
              onClick={() => throttledHandler()}
              className="new-chat-button-enhanced"
              style={{
                width: '100%',
                padding: isCollapsed ? '12px' : '14px 18px',
                background: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
              <AddIcon sx={{ fontSize: 20 }} />
              {!isCollapsed && t('Start New Search')}
            </button>
          </Box>

          {/* Quick Start Section */}
          {!isCollapsed && (
            <Box sx={{ px: 2, mb: 3 }}>
              <Box sx={{
                background: 'rgba(25, 118, 210, 0.05)',
                borderRadius: '8px',
                p: 2,
                border: '1px solid rgba(25, 118, 210, 0.1)'
              }}>
                <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: '#1976d2', fontSize: '15px' }}>
                  Find Your Home in Minutes
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleIcon sx={{ fontSize: 16, color: '#4caf50' }} />
                    <Typography variant="caption">AI-powered search</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleIcon sx={{ fontSize: 16, color: '#4caf50' }} />
                    <Typography variant="caption">Personalized matches</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleIcon sx={{ fontSize: 16, color: '#4caf50' }} />
                    <Typography variant="caption">Save your preferences</Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}

          {/* Navigation Tabs */}
          {!isMobile && !isTablet && (
            <Box sx={{ px: 2, mb: 2 }}>
              <Box sx={{
                display: 'flex',
                gap: 1,
                p: 0.5,
                background: 'rgba(0, 0, 0, 0.04)',
                borderRadius: '8px'
              }}>
                <button
                  className={`nav-tab-button ${sidebarMode === 'tips' ? 'active' : ''}`}
                  onClick={() => handleSidebarToggle('tips')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: sidebarMode === 'tips' ? 'white' : 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    fontSize: '14px',
                    fontWeight: sidebarMode === 'tips' ? 600 : 400,
                    color: sidebarMode === 'tips' ? '#1976d2' : '#666',
                    transition: 'all 0.2s ease',
                    boxShadow: sidebarMode === 'tips' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}>
                  <TipsAndUpdatesIcon sx={{ fontSize: 20 }} />
                  {!isCollapsed && t('Tips')}
                </button>
                <button
                  className={`nav-tab-button ${sidebarMode === 'chats' ? 'active' : ''}`}
                  onClick={() => handleSidebarToggle('chats')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: sidebarMode === 'chats' ? 'white' : 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    fontSize: '14px',
                    fontWeight: sidebarMode === 'chats' ? 600 : 400,
                    color: sidebarMode === 'chats' ? '#1976d2' : '#666',
                    transition: 'all 0.2s ease',
                    boxShadow: sidebarMode === 'chats' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}>
                  <HistoryIcon sx={{ fontSize: 20 }} />
                  {!isCollapsed && t('Recent')}
                </button>
              </Box>
            </Box>
          )}

          {/* Content based on mode */}
          <div className="sidebar-content-area">
            {sidebarMode === 'tips' ? (
              <Box sx={{ px: 2 }}>
                {!isCollapsed && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, fontSize: '16px' }}>
                      {chatMode === 'chat' ? 'Chat Tips' : 'Pro Tips'}
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {chatMode === 'chat' ? (
                        <>
                          <Box sx={{ display: 'flex', gap: 1.5 }}>
                            <ChatIcon sx={{ fontSize: 22, color: '#1976d2', mt: 0.5 }} />
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '14px' }}>
                                Start with your priorities
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '12px' }}>
                                Tell me what matters most - location, budget, or space
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1.5 }}>
                            <TipsAndUpdatesIcon sx={{ fontSize: 22, color: '#f57c00', mt: 0.5 }} />
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '14px' }}>
                                Be specific with numbers
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '12px' }}>
                                When you mention beds, price, or size, insights are generated
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1.5 }}>
                            <AutoAwesomeIcon sx={{ fontSize: 22, color: '#9c27b0', mt: 0.5 }} />
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '14px' }}>
                                I learn as we chat
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '12px' }}>
                                Each message helps me understand your needs better
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1.5 }}>
                            <HomeIcon sx={{ fontSize: 22, color: '#4caf50', mt: 0.5 }} />
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '14px' }}>
                                Ask follow-up questions
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '12px' }}>
                                Curious about a neighborhood? Just ask!
                              </Typography>
                            </Box>
                          </Box>
                        </>
                      ) : (
                        <>
                          <Box sx={{ display: 'flex', gap: 1.5 }}>
                            <HomeIcon sx={{ fontSize: 22, color: '#1976d2', mt: 0.5 }} />
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '14px' }}>
                                Be specific about amenities
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '12px' }}>
                                Mark must-have features as 'Must have'
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1.5 }}>
                            <TipsAndUpdatesIcon sx={{ fontSize: 22, color: '#f57c00', mt: 0.5 }} />
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '14px' }}>
                                Consider commute times
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '12px' }}>
                                Factor in your daily travel to work/school
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1.5 }}>
                            <CheckCircleIcon sx={{ fontSize: 22, color: '#4caf50', mt: 0.5 }} />
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '14px' }}>
                                Your data is secure
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '12px' }}>
                                We protect your preferences and personal info
                              </Typography>
                            </Box>
                          </Box>
                        </>
                      )}
                    </Box>

                    <Box sx={{ mt: 3 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
                        Why tenants love our quick form:
                      </Typography>
                      <Box sx={{
                        background: 'rgba(76, 175, 80, 0.05)',
                        borderRadius: '8px',
                        p: 1.5,
                        border: '1px solid rgba(76, 175, 80, 0.2)'
                      }}>
                        <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                          🏠 500+ properties matched daily
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                          ✨ 95% satisfaction rate
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'block' }}>
                          ⏱️ 2 min average completion time
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                )}
              </Box>
            ) : (
              <ConversationsList
                onConversationSelect={handleConversationSelect}
                isCollapsed={isCollapsed}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default Sidebar;

Sidebar.propTypes = {
  activeTab: PropTypes.string,
  onToggleCollapse: PropTypes.func,
  isCollapsed: PropTypes.bool,
  onNewChat: PropTypes.func,
  chatMode: PropTypes.string
};
