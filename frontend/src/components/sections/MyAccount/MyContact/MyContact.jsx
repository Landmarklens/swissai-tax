import React, { useEffect, useState } from 'react';
import { Box, Typography, InputBase, Avatar, Badge, Grid } from '@mui/material';
import { styled } from '@mui/material/styles';
import { ContentIcon } from '../../../../assets/svg/ContentIcon';
import { SearchIcon } from '../../../../assets/svg/SearchIcon';
import { NoChat } from '../../../../assets/svg/NoChat';
import MessageField from '../../../messageField/MessageField';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectChat,
  sendMessage,
  getCurrentChat,
  getChats
} from '../../../../store/slices/chatSlice';
import { useTranslation } from 'react-i18next';

import ContactManagerForm from '../../../contactForm/ContactForm';

const HeaderContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: '#f7f9ff'
}));

const SearchContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  maxWidth: '600px',
  height: '40px',
  margin: '16px auto'
}));

const SearchInputWrapper = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  height: '30px',
  border: '1px solid #b5b7c3',
  borderRadius: '4px',
  padding: '4px 8px',
  marginRight: '8px'
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  flex: 1,
  marginLeft: '8px'
}));

const EmptyStateMessage = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  color: theme.palette.text.secondary
}));

const ChatListContainer = styled('div')(({ theme }) => ({
  flex: 1,
  overflowY: 'auto',
  padding: 0,
  margin: '0 -24px'
}));

const ChatItem = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(1, 2),
  cursor: 'pointer',
  borderBottom: '1px solid #e0e0e0',

  '&:hover': {
    backgroundColor: '#f5f5f5'
  }
}));

const ChatInfo = styled('div')(({ theme }) => ({
  flex: 1,
  marginLeft: theme.spacing(2)
}));

const ChatName = styled(Typography)(({ theme }) => ({
  fontWeight: 'bold'
}));

const LastMessage = styled(Typography)(({ theme }) => ({
  color: '#757575',
  fontSize: '0.875rem'
}));

const ChatMeta = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end'
}));

const MessageContent = styled(Typography)(({ theme }) => ({
  backgroundColor: (props) => (props.isUser ? '#e3f2fd' : '#f5f5f5'),
  padding: theme.spacing(1, 2),
  maxWidth: 376,
  background: '#fff',
  borderRadius: '8px'
}));

const DateBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    border: `2px solid ${theme.palette.background.paper}`,
    padding: '0 4px',
    background: '#E5484D',
    color: '#fff',
    width: '25px',
    height: '25px',
    right: '15px',
    top: '17px',
    position: 'relative'
  }
}));

const MyContact = ({ userId }) => {
  const { t } = useTranslation();
  const chat = useSelector(selectChat);
  const [chatListData, setListChatData] = useState(null);
  const [chatData, setChatData] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [inputMessage, setInputMessage] = useState('');
  const [message, setMessage] = useState({ text: '', sender: 'User' });
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getChats());
  }, [dispatch, userId]);

  useEffect(() => {
    // need to replace handleChatSelect, as this is selected users chat
    setListChatData(chat.chats.data.data);
    setChatData(chat.currentChat?.data?.data);
  }, [chat]);

  const [conversation, setConversation] = useState([
    { sender: 'AI', text: 'Hello! How can I assist you today?' },
    { sender: 'User', text: 'I need help with my account.' },
    { sender: 'AI', text: 'Hello! How can I assist you today?' },
    { sender: 'User', text: 'I need help with my account.' },
    { sender: 'AI', text: 'Hello! How can I assist you today?' },
    { sender: 'User', text: 'I need help with my account.' },
    { sender: 'AI', text: 'Hello! How can I assist you today?' },
    { sender: 'User', text: 'I need help with my account.' }
  ]);

  const handleChatSelect = (chatId) => {
    dispatch(getCurrentChat(chatId));
  };

  const onSendMessage = (message) => {
    if (chatData.manager_id && message.trim()) {
      dispatch(sendMessage({ manager_id: chatData.manager_id, message }));
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (inputMessage.trim() !== '' && selectedChat) {
      const newMessage = {
        id: selectedChat.messages.length + 1,
        content: inputMessage,
        sender: 'You',
        time: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        })
      };
      setSelectedChat((prevChat) => ({
        ...prevChat,
        messages: [...prevChat.messages, newMessage]
      }));
      setInputMessage('');
    }
  };

  const sendHandler = () => {
    setConversation((prev) => [...prev, { ...message }]);
  };

  const MessageGroup = styled(Box)(({ theme }) => ({
    display: 'flex',
    marginBottom: theme.spacing(2)
  }));

  const TimeStamp = styled(Typography)(({ theme, isYou }) => ({
    fontSize: '0.75rem',
    color: theme.palette.text.secondary,
    textAlign: 'right',
    marginTop: theme.spacing(0.5)
  }));

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('default', { month: 'short' });
    return `${day} ${month}`;
  };

  const contactFormOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        bgcolor: 'white',
        width: '100%'
      }}>
      <HeaderContainer sx={{ width: '100%' }}>
        <Typography sx={{ mb: 3 }} variant="h6" fontWeight="normal">
          {t('Communication Hub')}
        </Typography>
        {chatData && chatData.length > 0 ? (
          <Grid
            item
            xs={7}
            sx={{
              height: 'calc(100% - 44px)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              pt: '0!important',
              pr: '16px',
              pb: '16px',
              '& .MuiGrid-item': {
                paddingLeft: '30px !important',
                paddingTop: 0
              }
            }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                overflowY: 'scroll',
                scrollbarWidth: 'none',
                '&::-webkit-scrollbar': {
                  display: 'none'
                }
              }}>
              {chatData.map((message) => {
                return (
                  <>
                    <MessageGroup key={message.id}>
                      {/* {message.user_id !== userId && ( */}
                      {message.avatar_url ? (
                        <Avatar
                          src={message?.avatar_url}
                          alt={message.user_id}
                          sx={{ marginRight: 2 }}
                        />
                      ) : (
                        <Avatar
                          src={`/api/placeholder/40/40`}
                          alt={chat.name}
                          sx={{ marginRight: 2 }}
                        />
                      )}

                      {/* )} */}
                      <Box
                        sx={{
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: message.sender !== 'You' ? 'flex-start' : 'flex-end'
                        }}>
                        {/* {message.sender !== "You" && ( */}
                        {/* <Typography variant="subtitle2" sx={{ mb: 1, mt: 1 }}>
                          {message.name}
                        </Typography> */}
                        {/* )} */}
                        <MessageContent isYou={message.sender === 'You'}>
                          <Typography variant="body2">{message.message}</Typography>
                          <TimeStamp isYou={message.sender === 'You'}>
                            {formatDate(message.sent_at)}
                          </TimeStamp>
                        </MessageContent>
                      </Box>
                      {/* {message.user_id !== userId && (
                        <Avatar
                          src={message.avatar}
                          alt={message.sender}
                          sx={{ marginLeft: 2 }}
                        />
                      )} */}
                    </MessageGroup>
                  </>
                );
              })}
            </Box>
            <Box
              id="MyContact"
              sx={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center'
              }}>
              <MessageField
                onSendMessage={onSendMessage}
                onChange={() => {}}
                message=""
                disabled={false}
              />
            </Box>
          </Grid>
        ) : (
          <Typography variant="h6" fontWeight="normal">
            {t('No Messages')}
          </Typography>
        )}
      </HeaderContainer>
      <Box sx={{ border: '1px solid #ddd' }} />
      <Box
        sx={{
          width: '40%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#fafafa',
          padding: '24px'
        }}>
        <SearchContainer>
          <SearchInputWrapper>
            <SearchIcon />
            <StyledInputBase placeholder="Search" inputProps={{ 'aria-label': 'search' }} />
          </SearchInputWrapper>
          <ContentIcon onClick={contactFormOpen} />
        </SearchContainer>
        <ContactManagerForm open={open} handleClose={handleClose} />
        {chatListData ? (
          <ChatListContainer>
            {chatListData.map((chat) => {
              return (
                <ChatItem key={chat.id} onClick={() => handleChatSelect(chat.manager_id)}>
                  <Avatar src={chat.avatar_url} alt={chat.name} />
                  <ChatInfo>
                    <ChatName variant="subtitle1">{chat.name}</ChatName>
                    <LastMessage variant="body2">{chat.last_message}</LastMessage>
                  </ChatInfo>
                  <ChatMeta>
                    <Typography variant="caption" color="textSecondary">
                      {formatDate(chat.sent_at)}
                    </Typography>
                    <DateBadge badgeContent={chat.unread_count} color="" />
                  </ChatMeta>
                </ChatItem>
              );
            })}
          </ChatListContainer>
        ) : (
          <EmptyStateMessage>
            <NoChat />
            <Typography variant="body1" gutterBottom>
              {t('No chats')}
            </Typography>
            <Typography variant="body2">{t('Here will be your list of managers chats')}</Typography>
          </EmptyStateMessage>
        )}
      </Box>
    </Box>
  );
};

export default MyContact;
