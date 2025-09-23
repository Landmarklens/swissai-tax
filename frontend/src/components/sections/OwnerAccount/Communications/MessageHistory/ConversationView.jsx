import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  TextField,
  InputAdornment,
  IconButton,
  Badge,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Menu,
  Tooltip,
  Switch
} from '@mui/material';
import {
  Search as SearchIcon,
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Error as ErrorIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
  Home as HomeIcon,
  Person as PersonIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { styled } from '@mui/material/styles';
import { useSelector } from 'react-redux';
import { selectProperties } from '../../../../../store/slices/propertiesSlice';

// Styled Components
const ConversationContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  height: '700px',
  backgroundColor: '#F0F4FF',
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
  border: `1px solid ${theme.palette.divider}`
}));

const ConversationList = styled(Box)(({ theme }) => ({
  width: '380px',
  borderRight: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  display: 'flex',
  flexDirection: 'column',
  overflowY: 'hidden'
}));

const MessageArea = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '#E0E7FD',
  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23dcd5cc' fill-opacity='0.2'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
}));

const MessageHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  borderBottom: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2)
}));

const MessagesContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: 'auto',
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column'
}));

const MessageBubble = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'isOutbound' && prop !== 'isLandlord'
})(({ theme, isOutbound, isLandlord }) => ({
  padding: theme.spacing(1.5, 2),
  maxWidth: '70%',
  backgroundColor: !isOutbound 
    ? theme.palette.background.paper  // Tenant message - white
    : isLandlord 
      ? '#AEC2FF'  // Landlord manual message - tenant blue
      : '#65BA7420',  // Property Management automated reply - tenant green
  borderRadius: isOutbound ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
  boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
  wordBreak: 'break-word',
  position: 'relative'
}));

const MessageTime = styled(Typography)(({ theme }) => ({
  fontSize: '0.7rem',
  color: theme.palette.text.secondary,
  marginTop: theme.spacing(0.5),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5)
}));

const DateDivider = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  margin: theme.spacing(2, 0),
  '&::before, &::after': {
    content: '""',
    flex: 1,
    height: 1,
    backgroundColor: theme.palette.divider
  }
}));

const DateChip = styled(Chip)(({ theme }) => ({
  margin: '0 10px',
  backgroundColor: theme.palette.background.paper,
  fontSize: '0.75rem'
}));

const InputArea = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  borderTop: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  gap: theme.spacing(1),
  alignItems: 'center'
}));

const ConversationView = ({ messages, loading, onSendMessage, selectedPropertyId, onPropertyChange, onExport }) => {
  const { t } = useTranslation();
  const { properties } = useSelector(selectProperties);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [selectedProperty, setSelectedProperty] = useState(selectedPropertyId || '');
  const [selectedTenant, setSelectedTenant] = useState('all');
  const [filterMenuAnchor, setFilterMenuAnchor] = useState(null);
  const [messageVisibility, setMessageVisibility] = useState('all'); // 'all' or 'ai_only'
  const [showAIOnlyMessages, setShowAIOnlyMessages] = useState(true);
  const [localMessages, setLocalMessages] = useState([]); // Local state for optimistic updates
  const messagesEndRef = useRef(null);

  // Sync localMessages with incoming messages prop
  React.useEffect(() => {
    setLocalMessages(messages);
  }, [messages]);

  // Filter messages by selected property
  const filteredByProperty = React.useMemo(() => {
    if (!selectedProperty || selectedProperty === 'all') {
      return localMessages;
    }
    return localMessages.filter(msg => {
      // Check if message belongs to selected property
      const msgPropertyId = msg.propertyId ||
        properties?.data?.find(p => p.address === msg.property || p.title === msg.property)?.id;
      return msgPropertyId === parseInt(selectedProperty);
    });
  }, [localMessages, selectedProperty, properties]);

  // Group messages by lead/conversation - group by tenant email + property for unique conversations
  const conversations = React.useMemo(() => {
    const grouped = {};

    filteredByProperty.forEach(msg => {
      // Use the real lead_id if available, otherwise create a composite key as fallback
      // Messages from the database should have real lead_ids
      const leadId = msg.lead_id || msg.leadId;
      const tenantEmail = msg.recipient?.email || msg.recipient_email || 'unknown';
      const propertyId = msg.propertyId || msg.property_id || msg.property || 'unknown';

      // Use lead_id as the key if available, otherwise fallback to composite key
      const conversationKey = leadId || `${tenantEmail}_${propertyId}`;

      if (!grouped[conversationKey]) {
        // Store tenant info with proper email and real lead_id
        grouped[conversationKey] = {
          leadId: leadId || conversationKey,  // Use real lead_id if available
          recipient: {
            name: msg.recipient?.name || msg.sender_name || 'Tenant',
            email: tenantEmail
          },
          property: msg.property || msg.property_title || msg.property_address,
          propertyId: msg.propertyId || msg.property_id,
          messages: [],
          lastMessage: msg,
          unreadCount: 0
        };
      }
      
      grouped[conversationKey].messages.push(msg);
      
      // Update last message if this one is newer
      if (new Date(msg.sentAt) > new Date(grouped[conversationKey].lastMessage.sentAt)) {
        grouped[conversationKey].lastMessage = msg;
      }
      
      // Count unread (inbound messages without openedAt)
      if (msg.direction === 'inbound' && !msg.openedAt) {
        grouped[conversationKey].unreadCount++;
      }
    });


    // Sort conversations by last message time
    return Object.values(grouped).sort((a, b) => 
      new Date(b.lastMessage.sentAt) - new Date(a.lastMessage.sentAt)
    );
  }, [filteredByProperty]);

  // Filter conversations based on search and selected tenant
  const filteredConversations = conversations.filter(conv => {
    // Filter by selected tenant
    if (selectedTenant !== 'all' && conv.leadId !== selectedTenant) {
      return false;
    }
    
    // Filter by search query
    return conv.recipient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.recipient.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.property.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Auto-select first conversation
  useEffect(() => {
    if (filteredConversations.length > 0 && !selectedConversation) {
      setSelectedConversation(filteredConversations[0]);
    }
  }, [filteredConversations, selectedConversation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [selectedConversation?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatMessageDate = (date) => {
    if (!date) return '';
    try {
      const msgDate = new Date(date);
      if (isNaN(msgDate.getTime())) return '';

      if (isToday(msgDate)) {
        return format(msgDate, 'HH:mm');
      } else if (isYesterday(msgDate)) {
        return `Yesterday ${format(msgDate, 'HH:mm')}`;
      } else {
        return format(msgDate, 'MMM d, HH:mm');
      }
    } catch (error) {
      console.error('Error formatting message date:', date, error);
      return '';
    }
  };

  const getDateLabel = (date) => {
    if (!date) return '';
    try {
      const msgDate = new Date(date);
      if (isNaN(msgDate.getTime())) return '';

      if (isToday(msgDate)) {
        return t('Today');
      } else if (isYesterday(msgDate)) {
        return t('Yesterday');
      } else {
        return format(msgDate, 'MMMM d, yyyy');
      }
    } catch (error) {
      console.error('Error formatting date:', date, error);
      return '';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return <CheckCircleIcon sx={{ fontSize: 14, color: '#65BA74' }} />;
      case 'pending':
        return <ScheduleIcon sx={{ fontSize: 14, color: '#AA99EC' }} />;
      case 'failed':
        return <ErrorIcon sx={{ fontSize: 14, color: 'error.main' }} />;
      default:
        return null;
    }
  };

  const handlePropertyChange = (propertyId) => {
    setSelectedProperty(propertyId);
    setSelectedTenant('all'); // Reset tenant filter when property changes
    setSelectedConversation(null); // Reset selected conversation
    if (onPropertyChange) {
      onPropertyChange(propertyId);
    }
  };

  const handleExportConversation = () => {
    if (!selectedConversation) return;
    
    // Prepare export data
    const exportData = {
      property: selectedConversation.property,
      tenant: selectedConversation.recipient,
      messages: selectedConversation.messages.sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt)),
      exportDate: new Date().toISOString()
    };
    
    // Convert to CSV or JSON
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `conversation_${selectedConversation.leadId}_${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportAll = () => {
    if (onExport) {
      onExport(filteredConversations);
    } else {
      // Default export all conversations
      const exportData = {
        property: properties?.data?.find(p => p.id === parseInt(selectedProperty))?.title || 'All Properties',
        conversations: filteredConversations.map(conv => ({
          tenant: conv.recipient,
          property: conv.property,
          messageCount: conv.messages.length,
          lastMessage: conv.lastMessage,
          messages: conv.messages.sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt))
        })),
        exportDate: new Date().toISOString()
      };
      
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `all_conversations_${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handleSendMessage = async () => {
    if (messageInput.trim() && selectedConversation) {
      // Create a temporary message to show immediately (optimistic update)
      const tempMessage = {
        id: `temp-${Date.now()}`,
        recipient: selectedConversation.recipient,
        subject: messageVisibility === 'ai_only' ? 'AI Query' : 'Landlord Message',
        status: 'sending',
        sentAt: new Date(),
        type: 'owner_response',
        property: selectedConversation.property,
        propertyId: selectedConversation.propertyId,
        content: messageInput,
        direction: 'outbound',
        visibility: messageVisibility,
        sender_type: 'landlord',
        metadata: {
          channel: messageVisibility === 'ai_only' ? 'AI Only' : 'Direct Message',
          responseType: 'manual',
          responder: 'Property Owner',
          visibility: messageVisibility
        }
      };

      // Don't add temporary message - will refresh from database
      // selectedConversation.messages.push(tempMessage);

      // If sending to AI, make API call to AI endpoint
      if (messageVisibility === 'ai_only') {
        try {
          // Get the actual property_id - use conversation's propertyId if 'all' is selected
          let actualPropertyId = selectedProperty;
          if (selectedProperty === 'all' || !selectedProperty) {
            // Extract property ID from the conversation
            actualPropertyId = selectedConversation.propertyId ||
                             selectedConversation.messages[0]?.propertyId ||
                             selectedPropertyId;
          }


          // Ensure it's a valid integer
          const propertyIdInt = parseInt(actualPropertyId);
          if (isNaN(propertyIdInt)) {
            console.error('Invalid property ID:', actualPropertyId);
            alert('Please select a specific property to send messages');
            return;
          }

          // Don't send lead_id if it's not a valid UUID (composite key)
          const requestData = {
            recipient_email: selectedConversation.recipient?.email,
            property_id: propertyIdInt,
            message: messageInput,
            visibility: messageVisibility,
            sender_type: 'landlord'
          };

          // Only add lead_id if it looks like a valid UUID
          if (selectedConversation.leadId &&
              selectedConversation.leadId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            requestData.lead_id = selectedConversation.leadId;
          }

          const response = await axios.post('/api/communications/send-ai-message', requestData);

          const result = response.data;

          // Add the sent message to local state immediately
          const now = new Date().toISOString();
          const newMessage = {
            id: result.id,
            content: messageInput,  // Add content field that UI expects
            message: messageInput,
            body: messageInput,
            direction: 'outbound',
            sender_type: 'landlord',
            visibility: messageVisibility,
            recipient: selectedConversation.recipient,
            propertyId: actualPropertyId,
            timestamp: now,
            created_at: now,
            sentAt: now,
            date: now
          };

          setLocalMessages(prevMessages => [...prevMessages, newMessage]);

          // Update the selected conversation with the new message
          setSelectedConversation(prev => ({
            ...prev,
            messages: [...prev.messages, newMessage],
            lastMessage: newMessage.message,
            lastMessageTime: newMessage.timestamp
          }));

          // Clear input immediately after sending
          setMessageInput('');

          // Scroll to bottom after adding the message
          setTimeout(() => scrollToBottom(), 100);

          // Add AI response to conversation if available
          if (result.ai_response) {
            const aiNow = new Date().toISOString();
            const aiMessage = {
              id: `ai-${Date.now()}`,
              message: result.ai_response,
              body: result.ai_response,
              recipient: selectedConversation.recipient,
              subject: 'AI Response',
              status: 'sent',
              sentAt: aiNow,
              type: 'ai_response',
              property: selectedConversation.property,
              propertyId: actualPropertyId,
              content: result.ai_response,
              direction: 'outbound',
              visibility: messageVisibility,
              sender_type: 'ai',
              timestamp: aiNow,
              created_at: aiNow,
              date: aiNow,
              metadata: {
                channel: 'AI Assistant',
                responseType: 'ai_generated',
                responder: 'AI Assistant',
                visibility: messageVisibility,
                requires_clarification: result.requires_clarification
              }
            };
            // Add AI message to local state
            setLocalMessages(prevMessages => [...prevMessages, aiMessage]);

            // Update the selected conversation with the AI message
            setSelectedConversation(prev => ({
              ...prev,
              messages: [...prev.messages, aiMessage],
              lastMessage: result.ai_response,
              lastMessageTime: aiMessage.timestamp
            }));

            // Scroll to bottom after AI message
            setTimeout(() => {
              scrollToBottom();
            }, 100);

            // If AI needs clarification, show notification
            if (result.requires_clarification) {
              alert(result.clarification_message || 'AI needs clarification on this response.');
            }

            // Don't call parent's handler to avoid blank screen during 24-second API call
            // The message is already sent and displayed via optimistic update
          }
        } catch (error) {
          console.error('Error sending AI message:', error);
          console.error('Error response:', error.response?.data);
        }
      } else {
        // Send regular message using the same API endpoint
        try {
          // Get the actual property_id - use conversation's propertyId if 'all' is selected
          let actualPropertyId = selectedProperty;
          if (selectedProperty === 'all' || !selectedProperty) {
            // Extract property ID from the conversation
            actualPropertyId = selectedConversation.propertyId ||
                             selectedConversation.messages[0]?.propertyId ||
                             selectedPropertyId;
          }


          // Ensure it's a valid integer
          const propertyIdInt = parseInt(actualPropertyId);
          if (isNaN(propertyIdInt)) {
            console.error('Invalid property ID for regular message:', actualPropertyId);
            alert('Please select a specific property to send messages');
            return;
          }

          // Don't send lead_id if it's not a valid UUID (composite key)
          const requestData = {
            recipient_email: selectedConversation.recipient?.email,
            property_id: propertyIdInt,
            message: messageInput,
            visibility: messageVisibility,
            sender_type: 'landlord'
          };

          // Only add lead_id if it looks like a valid UUID
          if (selectedConversation.leadId &&
              selectedConversation.leadId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            requestData.lead_id = selectedConversation.leadId;
          }

          const response = await axios.post('/api/communications/send-ai-message', requestData);

          // Clear input immediately before adding message
          setMessageInput('');

          // Add the message to local state immediately for optimistic UI update
          const now = new Date().toISOString();
          const newMessage = {
            id: response.data.id,
            content: messageInput,  // Add content field that UI expects
            message: messageInput,
            body: messageInput,
            direction: 'outbound',
            sender_type: 'landlord',
            visibility: messageVisibility,
            recipient: selectedConversation.recipient,
            propertyId: actualPropertyId,
            timestamp: now,
            created_at: now,
            sentAt: now,
            date: now
          };

          setLocalMessages(prevMessages => [...prevMessages, newMessage]);

          // Update the selected conversation with the new message
          setSelectedConversation(prev => ({
            ...prev,
            messages: [...prev.messages, newMessage],
            lastMessage: newMessage.message,
            lastMessageTime: newMessage.timestamp
          }));

          // Scroll to bottom after adding the message
          setTimeout(() => scrollToBottom(), 100);

          // Don't call parent's handler to avoid blank screen during 24-second API call
          // The message is already sent and displayed via optimistic update
        } catch (error) {
          console.error('Error sending regular message:', error);
          console.error('Error response:', error.response?.data);
        }
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ConversationContainer>
      {/* Conversation List */}
      <ConversationList>
        <Box sx={{ p: 2 }}>
          {/* Property Selector */}
          <FormControl fullWidth size="small" sx={{ mb: 1 }}>
            <InputLabel id="property-select-label">{t('Property')}</InputLabel>
            <Select
              labelId="property-select-label"
              value={selectedProperty || 'all'}
              onChange={(e) => handlePropertyChange(e.target.value)}
              label={t('Property')}
              renderValue={(value) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HomeIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  {value === 'all' 
                    ? t('All Properties')
                    : properties?.data?.find(p => p.id === value)?.title || 
                      properties?.data?.find(p => p.id === value)?.address || 
                      `Property ${value}`}
                </Box>
              )}
            >
              <MenuItem value="all">{t('All Properties')}</MenuItem>
              {properties?.data?.map((property) => (
                <MenuItem key={property.id} value={property.id}>
                  {property.title || property.address || `Property ${property.id}`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Tenant Filter */}
          <FormControl fullWidth size="small" sx={{ mb: 1 }}>
            <InputLabel id="tenant-select-label">{t('Tenant')}</InputLabel>
            <Select
              labelId="tenant-select-label"
              value={selectedTenant}
              onChange={(e) => setSelectedTenant(e.target.value)}
              label={t('Tenant')}
              renderValue={(value) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  {value === 'all'
                    ? t('All Tenants')
                    : conversations.find(c => c.leadId === value)?.recipient.name || value}
                </Box>
              )}
            >
              <MenuItem value="all">{t('All Tenants')}</MenuItem>
              {conversations.map((conv) => (
                <MenuItem key={conv.leadId} value={conv.leadId}>
                  {conv.recipient.name} ({conv.recipient.email})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Search Bar */}
          <TextField
            fullWidth
            size="small"
            placeholder={t('Search messages...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchQuery('')}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          {/* Export Button */}
          <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={handleExportAll}
            >
              {t('Export All')}
            </Button>
          </Box>
        </Box>
        <Divider />
        <List sx={{ flex: 1, overflowY: 'auto', p: 0 }}>
          {filteredConversations.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {messages.length === 0 
                  ? t('No messages yet. Messages will appear here when tenants contact you.')
                  : t('No conversations match your filters')}
              </Typography>
            </Box>
          ) : (
          filteredConversations.map((conv) => (
            <React.Fragment key={conv.leadId}>
              <ListItem
                button
                selected={selectedConversation?.leadId === conv.leadId}
                onClick={() => setSelectedConversation(conv)}
                sx={{
                  '&:hover': { backgroundColor: 'action.hover' },
                  '&.Mui-selected': { backgroundColor: 'action.selected' }
                }}
              >
                <ListItemAvatar>
                  <Badge badgeContent={conv.unreadCount} color="error">
                    <Avatar sx={{ bgcolor: conv.unreadCount > 0 ? '#3E63DD' : '#8DA4EF' }}>
                      {conv.recipient.name === 'Unknown' ? 'D' : conv.recipient.name[0]?.toUpperCase() || '?'}
                    </Avatar>
                  </Badge>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle2" noWrap sx={{ fontWeight: conv.unreadCount > 0 ? 600 : 400 }}>
                        {conv.recipient.name === 'Unknown' ? (conv.recipient.email ? conv.recipient.email.split('@')[0] : 'Tenant') : conv.recipient.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatMessageDate(conv.lastMessage.sentAt)}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <React.Fragment>
                      <Typography component="span" variant="caption" color="text.secondary" display="block" noWrap>
                        {conv.property}
                      </Typography>
                      <Typography component="span" variant="body2" display="block" noWrap sx={{ color: conv.unreadCount > 0 ? 'text.primary' : 'text.secondary' }}>
                        {conv.lastMessage.subject || conv.lastMessage.content?.substring(0, 50) + '...'}
                      </Typography>
                    </React.Fragment>
                  }
                />
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          )))}
        </List>
      </ConversationList>

      {/* Message Area */}
      {selectedConversation ? (
        <>
          <MessageArea>
          {/* Header */}
          <MessageHeader>
            <Avatar sx={{ bgcolor: '#3E63DD' }}>
              {selectedConversation.recipient.name[0]?.toUpperCase() || '?'}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" fontWeight="medium">
                {selectedConversation.recipient.name === 'Unknown' ? (selectedConversation.recipient.email ? selectedConversation.recipient.email.split('@')[0] : 'Tenant') : selectedConversation.recipient.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {selectedConversation.recipient.email} • {selectedConversation.property}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {selectedConversation.messages.length} messages in conversation
              </Typography>
            </Box>
            <Tooltip title={t('Export this conversation')}>
              <IconButton onClick={handleExportConversation}>
                <DownloadIcon />
              </IconButton>
            </Tooltip>
          </MessageHeader>

          {/* Messages */}
          <MessagesContainer>
            {selectedConversation.messages
              .sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt))
              .map((msg, index, array) => {
                const showDateDivider = index === 0 || 
                  new Date(msg.sentAt).toDateString() !== new Date(array[index - 1].sentAt).toDateString();
                
                // Determine if message is from tenant (inbound) or owner (outbound)
                const isFromTenant = msg.direction === 'inbound';
                // Check message type and visibility
                const isLandlordMessage = !isFromTenant && (
                  msg.metadata?.responseType === 'manual' ||
                  msg.type === 'owner_response' ||
                  msg.metadata?.responder === 'Property Owner' ||
                  msg.sender_type === 'landlord'
                );
                const isAIMessage = msg.sender_type === 'ai' || msg.type === 'ai_response' || msg.metadata?.responder === 'AI Assistant';
                const isAIOnly = msg.visibility === 'ai_only' || msg.metadata?.visibility === 'ai_only';

                // Skip AI-only messages if filter is off
                if (isAIOnly && !showAIOnlyMessages) {
                  return null;
                }

                return (
                  <React.Fragment key={msg.id}>
                    {showDateDivider && (
                      <DateDivider>
                        <DateChip label={getDateLabel(msg.sentAt)} size="small" />
                      </DateDivider>
                    )}
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: isFromTenant ? 'flex-start' : 'flex-end',
                      mb: 2,
                      width: '100%'
                    }}>
                      <MessageBubble isOutbound={!isFromTenant} isLandlord={isLandlordMessage}>
                        {/* AI-only indicator */}
                        {isAIOnly && (
                          <Chip
                            label="AI Only"
                            size="small"
                            sx={{
                              mb: 1,
                              backgroundColor: '#FFF3E0',
                              color: '#F57C00',
                              fontWeight: 600,
                              fontSize: '0.7rem'
                            }}
                          />
                        )}

                        {/* Show sender info for better context */}
                        <Box sx={{ mb: 0.5, opacity: 0.8 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: !isFromTenant ? (isAIMessage ? '#FF6B35' : isLandlordMessage ? '#3E63DD' : '#65BA74') : '#6B7280' }}>
                            {isFromTenant ?
                              (msg.recipient?.name || msg.metadata?.originalSender?.split('@')[0] || 'Tenant') :
                              (isAIMessage ? 'AI Assistant' : isLandlordMessage ? 'You (Landlord)' : 'Property Management')}
                          </Typography>
                          {msg.metadata?.channel && (
                            <Typography variant="caption" sx={{ ml: 1, fontStyle: 'italic', color: 'text.secondary' }}>
                              • {msg.metadata.channel}
                            </Typography>
                          )}
                          {msg.metadata?.requires_clarification && (
                            <Chip
                              label="Needs Review"
                              size="small"
                              color="warning"
                              sx={{ ml: 1, height: 16 }}
                            />
                          )}
                        </Box>
                        
                        {/* Subject if exists */}
                        {msg.subject && msg.subject !== 'Property Inquiry' && msg.subject !== 'general' && (
                          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                            {msg.subject}
                          </Typography>
                        )}
                        
                        {/* Message content */}
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                          {msg.content || msg.template || t('No content')}
                        </Typography>
                        
                        {/* Timestamp and status */}
                        <MessageTime>
                          {formatMessageDate(msg.sentAt)}
                          {!isFromTenant && getStatusIcon(msg.status)}
                        </MessageTime>
                      </MessageBubble>
                    </Box>
                  </React.Fragment>
                );
              })}
            <div ref={messagesEndRef} />
          </MessagesContainer>

          {/* Input Area */}
          <InputArea>
            <IconButton size="small">
              <AttachFileIcon />
            </IconButton>

            {/* Message Visibility Selector */}
            <FormControl size="small" sx={{ minWidth: 150, mr: 1 }}>
              <Select
                value={messageVisibility}
                onChange={(e) => setMessageVisibility(e.target.value)}
                displayEmpty
                sx={{
                  borderRadius: '20px',
                  backgroundColor: messageVisibility === 'ai_only' ? '#FFF3E0' : '#E3F2FD',
                  '& .MuiSelect-select': { py: 1 }
                }}
              >
                <MenuItem value="all">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon fontSize="small" />
                    {t('To Tenant & AI')}
                  </Box>
                </MenuItem>
                <MenuItem value="ai_only">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography component="span" sx={{ fontWeight: 600 }}>AI</Typography>
                    {t('To AI Only')}
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>

            {/* AI Message Filter Toggle - moved here under visibility selector */}
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              mr: 1,
              backgroundColor: showAIOnlyMessages ? '#FFF3E0' : 'transparent',
              borderRadius: '12px',
              px: showAIOnlyMessages ? 1 : 0.5,
              py: 0.5,
              transition: 'all 0.2s'
            }}>
              <Typography variant="caption" sx={{
                fontWeight: 500,
                fontSize: '0.75rem',
                color: showAIOnlyMessages ? '#F57C00' : 'text.secondary',
                whiteSpace: 'nowrap'
              }}>
                Show AI-only
              </Typography>
              <Switch
                checked={showAIOnlyMessages}
                onChange={(e) => setShowAIOnlyMessages(e.target.checked)}
                size="small"
                sx={{
                  '& .MuiSwitch-track': {
                    height: 18,
                    backgroundColor: showAIOnlyMessages ? '#FFB74D' : undefined
                  },
                  '& .MuiSwitch-thumb': {
                    width: 14,
                    height: 14
                  },
                  '& .MuiSwitch-switchBase': {
                    padding: '2px',
                    '&.Mui-checked': {
                      '& + .MuiSwitch-track': {
                        backgroundColor: '#FFB74D'
                      }
                    }
                  }
                }}
              />
            </Box>

            <TextField
              fullWidth
              multiline
              maxRows={4}
              placeholder={messageVisibility === 'ai_only' ? t('Ask AI a question...') : t('Type a message...')}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '20px',
                  backgroundColor: 'background.default'
                }
              }}
            />
            <IconButton
              color="primary"
              onClick={handleSendMessage}
              disabled={!messageInput.trim()}
            >
              <SendIcon />
            </IconButton>
          </InputArea>
        </MessageArea>
        </>
      ) : (
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#E0E7FD',
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23dcd5cc' fill-opacity='0.2'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          p: 4
        }}>
          <Paper sx={{ p: 4, textAlign: 'center', maxWidth: 400 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {messages.length === 0 
                ? t('No conversations yet')
                : t('Select a conversation')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {messages.length === 0 
                ? t('When tenants contact you about your properties, their messages will appear here.')
                : t('Choose a conversation from the list to view messages')}
            </Typography>
            {messages.length === 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="caption" color="text.secondary">
                  {t('Tip: Make sure your properties are published and have the correct contact email configured.')}
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      )}
    </ConversationContainer>
  );
};

export default ConversationView;