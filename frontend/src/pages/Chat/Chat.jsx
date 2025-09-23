import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Tab, Tabs, useMediaQuery, useTheme } from '@mui/material';
import SEOHelmet from '../../components/SEO/SEOHelmet';
import { useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import LoggedInLayout from '../LoggedInLayout/LoggedInLayout';
import AiChat from './AIChat/AIChat';
import Insight from './Insight/Insight';
import ChatIcon from '@mui/icons-material/Chat';
import SearchIcon from '@mui/icons-material/Search';
import InsightsIcon from '@mui/icons-material/Insights';
import Sidebar from './Sidebar/Sidebar';
import {
  setActiveConversationId,
  getConversationHistory
} from '../../store/slices/conversationsSlice';

import './Chat.scss';

const Chat = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery('(min-width:600px) and (max-width:1100px)');
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState('chat');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [message, setMessage] = useState('');
  const [tempInsights, setTempInsights] = useState([]);
  const [chatMode, setChatMode] = useState('chat');

  // Handle conversation parameter from URL
  useEffect(() => {
    const conversationId = searchParams.get('conversation');
    if (conversationId) {
      dispatch(setActiveConversationId(conversationId));
      dispatch(getConversationHistory({ id: conversationId }));
    }
  }, [searchParams, dispatch]);

  const handleChangeMessage = (msg) => {
    setMessage(msg);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleNewChat = () => {
    // Clear temporary insights when starting new chat
    setTempInsights([]);
    // Clear message state
    setMessage('');
  };

  return (
    <LoggedInLayout>
      <SEOHelmet
        title="Chat - HomeAI"
        description="Chat with AI to find your perfect home in Switzerland"
      />
      <Box
        sx={{
          height: 'calc(100vh - 64px)',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          '@media (max-width:1100px)': {
            height: 'calc(100dvh - 64px)'
          }
        }}>
        {isMobile && (
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            centered
            sx={{
              borderBottom: `1px solid ${theme.palette.border.grey}`,
              bgcolor: theme.palette.background.paper,
              '& .MuiTab-root': {
                fontSize: '12px',
                padding: '8px 16px'
              }
            }}>
            <Tab label={t('Chat')} value="chat" />
            <Tab label={t('Search')} value="search" />
            <Tab label={t('Insights')} value="insights" />
          </Tabs>
        )}

        {isTablet && (
          <Tabs
            orientation="vertical"
            value={activeTab}
            onChange={handleTabChange}
            sx={{
              borderRight: `1px solid ${theme.palette.divider}`,
              width: '100%',
              maxWidth: 130,
              bgcolor: theme.palette.background.paper,
              '& .MuiTab-root': {
                alignItems: 'center'
              }
            }}
            TabIndicatorProps={{ style: { left: 0 } }}>
            <Tab icon={<ChatIcon />} iconPosition="start" label={t('Chat')} value="chat" />
            <Tab icon={<SearchIcon />} iconPosition="start" label={t('Search')} value="search" />
            <Tab
              icon={<InsightsIcon />}
              iconPosition="start"
              label={t('Insights')}
              value="insights"
            />
          </Tabs>
        )}

        {isMobile || isTablet ? (
          <div className="wrapperPage">
            {activeTab === 'chat' && (
              <AiChat
                handleChangeMessage={handleChangeMessage}
                message={message}
                onTempInsightsChange={setTempInsights}
                onChatModeChange={setChatMode}
              />
            )}
            {activeTab === 'search' && <Sidebar activeTab={activeTab} onNewChat={handleNewChat} />}
            {activeTab === 'insights' && <Insight activeTab={activeTab} tempInsights={tempInsights} chatMode={chatMode} />}
          </div>
        ) : (
          <div className="chat-page">
            <Sidebar
              activeTab={activeTab}
              onToggleCollapse={handleToggleSidebar}
              isCollapsed={isSidebarCollapsed}
              onNewChat={handleNewChat}
              chatMode={chatMode}
            />
            <AiChat
              handleChangeMessage={handleChangeMessage}
              message={message}
              onTempInsightsChange={setTempInsights}
              onChatModeChange={setChatMode}
            />
            <Insight tempInsights={tempInsights} chatMode={chatMode} />
          </div>
        )}
      </Box>
    </LoggedInLayout>
  );
};
export default Chat;
