import React from 'react';
import { Box, Typography, Card, CardContent, IconButton } from '@mui/material';
import { useTranslation } from 'react-i18next';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { theme } from '../../../../theme/theme';
import PropTypes from 'prop-types';

const ChatHistoryGrid = ({ conversations, onChatSelect, onDeleteChat }) => {
  const { t } = useTranslation();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) {
      return t('Today');
    } else if (isYesterday) {
      return t('Yesterday');
    } else {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return date.toLocaleDateString('en-US', options);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const groupChatsByDay = (conversations) => {
    if (!Array.isArray(conversations) || conversations.length === 0) {
      return {};
    }

    const groups = {};
    for (const conversation of conversations) {
      const key = formatDate(conversation.created_at);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(conversation);
    }

    return groups;
  };

  const groupedConversations = groupChatsByDay(conversations);

  return (
    <Box>
      {Object.entries(groupedConversations).map(([day, dayConversations]) => (
        <Box key={day} sx={{ mb: 4 }}>
          <Typography
            variant="h6"
            sx={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              mb: 2,
              pb: 1,
              borderBottom: '1px solid #e5e7eb'
            }}>
            {day}
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 2
            }}>
            {dayConversations
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .map((conversation) => (
                <Card
                  key={conversation.id}
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    border: '1px solid #e5e7eb',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
                      borderColor: theme.palette.primary.main
                    }
                  }}
                  onClick={() => onChatSelect(conversation.id)}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between'
                      }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            backgroundColor: theme.palette.primary.main,
                            color: 'white'
                          }}>
                          <ChatBubbleOutlineIcon sx={{ fontSize: 20 }} />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="h6"
                            sx={{
                              fontSize: '16px',
                              fontWeight: 600,
                              color: '#111827',
                              lineHeight: 1.3,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                            {conversation.name || t('New chat')}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                            <AccessTimeIcon sx={{ fontSize: 14, color: '#6b7280' }} />
                            <Typography
                              variant="body2"
                              sx={{
                                fontSize: '12px',
                                color: '#6b7280',
                                fontWeight: 400
                              }}>
                              {formatTime(conversation.created_at)}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>

                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteChat(conversation.id);
                        }}
                        sx={{
                          color: '#9ca3af',
                          '&:hover': {
                            backgroundColor: '#fef2f2',
                            color: '#ef4444'
                          }
                        }}>
                        <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              ))}
          </Box>
        </Box>
      ))}
    </Box>
  );
};

ChatHistoryGrid.propTypes = {
  conversations: PropTypes.array.isRequired,
  onChatSelect: PropTypes.func.isRequired,
  onDeleteChat: PropTypes.func
};

export default ChatHistoryGrid;
