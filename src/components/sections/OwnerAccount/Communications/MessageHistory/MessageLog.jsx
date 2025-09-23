import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Tooltip,
  Avatar,
  Button,
  Menu,
  Badge
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon,
  Email as EmailIcon,
  Schedule as ScheduleIcon,
  CheckCircle as SentIcon,
  Error as FailedIcon,
  AccessTime as PendingIcon,
  Reply as ReplyIcon,
  Forward as ForwardIcon,
  Download as DownloadIcon,
  MoreVert as MoreIcon,
  CheckCircle,
  Chat as ChatIcon,
  ListAlt as ListAltIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { format, formatDistanceToNow } from 'date-fns';
import MessageDetail from './MessageDetail';
import ConversationView from './ConversationView';
import { tenantSelectionAPI } from '../../../../../api/tenantSelectionApi';
import tenantQuestionsAPI from '../../../../../api/tenantQuestionsApi';
import { useSelector } from 'react-redux';
import { selectProperties } from '../../../../../store/slices/propertiesSlice';
import EmailStatusWidget from '../../../../PropertyImport/components/EmailStatusWidget';
import config from '../../../../../config/environments';

// Mock data - will be replaced with actual data from API
const mockMessages = [
  {
    id: 1,
    recipient: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      leadId: 'lead-1'
    },
    subject: 'Viewing Invitation - Bahnhofstrasse 10',
    template: 'viewing_invitation',
    status: 'sent',
    sentAt: new Date('2024-01-20T10:30:00'),
    openedAt: new Date('2024-01-20T11:15:00'),
    clickedLinks: 2,
    type: 'automated',
    property: 'Bahnhofstrasse 10, 8001 Zürich'
  },
  {
    id: 2,
    recipient: {
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      leadId: 'lead-2'
    },
    subject: 'Application Received - Seestrasse 25',
    template: 'application_received',
    status: 'sent',
    sentAt: new Date('2024-01-19T14:20:00'),
    openedAt: new Date('2024-01-19T15:00:00'),
    clickedLinks: 0,
    type: 'automated',
    property: 'Seestrasse 25, 8002 Zürich'
  },
  {
    id: 3,
    recipient: {
      name: 'Mike Johnson',
      email: 'mike.j@example.com',
      leadId: 'lead-3'
    },
    subject: 'Additional Documents Required',
    template: 'document_request',
    status: 'pending',
    scheduledFor: new Date('2024-01-21T09:00:00'),
    type: 'scheduled',
    property: 'Hauptstrasse 5, 8003 Zürich'
  },
  {
    id: 4,
    recipient: {
      name: 'Sarah Wilson',
      email: 'sarah.w@example.com',
      leadId: 'lead-4'
    },
    subject: 'Re: Question about the apartment',
    template: null,
    status: 'sent',
    sentAt: new Date('2024-01-18T16:45:00'),
    openedAt: null,
    type: 'manual',
    property: 'Langstrasse 100, 8004 Zürich'
  },
  {
    id: 5,
    recipient: {
      name: 'Multiple Recipients',
      email: '15 recipients',
      leadId: null
    },
    subject: 'Open House Invitation - This Saturday',
    template: 'bulk_viewing',
    status: 'sent',
    sentAt: new Date('2024-01-17T11:00:00'),
    openedAt: new Date('2024-01-17T14:30:00'),
    openRate: 73,
    clickRate: 45,
    type: 'bulk',
    property: 'Multiple Properties'
  }
];

const MessageLog = () => {
  const { t } = useTranslation();
  const { properties } = useSelector(selectProperties);
  const emailConfig = useSelector((state) => state.tenantSelection?.emailConfig);
  const [messages, setMessages] = useState([]);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPropertyId, setSelectedPropertyId] = useState('all');
  const [viewMode, setViewMode] = useState('conversation'); // 'table' or 'conversation'

  // Fetch communications when component mounts or property changes
  useEffect(() => {

    // If we're trying to show all properties but none are loaded yet,
    // still try to fetch communications (they might exist even if property list is empty)
    // This fixes the issue where communications don't show when property API has errors
    if (selectedPropertyId === 'all' && (!properties?.data || properties.data.length === 0)) {
      console.warn('[MessageLog] No properties loaded, but attempting to fetch communications anyway');
      // Don't return early - continue to fetch communications
    }

    // Always fetch, whether it's a specific property or 'all'
    fetchCommunications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPropertyId, properties?.data]);
  
  // Keep the default as 'all' to show all properties by default
  useEffect(() => {
    
    // Keep 'all' as default to show all properties
    if (!properties?.data?.length) {
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties?.data]);
  
  const fetchCommunications = async () => {
    
    setLoading(true);
    try {
      // We'll focus on fetching real email communications from communication_logs
      // Skip tenant questions for now since we want to show actual emails
      let questionsResponse = { data: [] };
      
      
      // Transform tenant questions to WhatsApp-style message format
      const questionMessages = [];
      if (questionsResponse?.data && Array.isArray(questionsResponse.data)) {
        questionsResponse.data.forEach(question => {
          // Create a unique conversation/lead ID for each question
          const conversationId = `tenant-${question.lead_id || question.id}`;
          
          // 1. Add the tenant's question as an inbound message
          questionMessages.push({
            id: `question-${question.id}`,
            recipient: {
              name: question.lead_name || 'Tenant',
              email: question.lead_email || 'tenant@email.com',
              leadId: conversationId
            },
            subject: 'Tenant Inquiry',
            template: question.question_type || 'tenant_question',
            status: 'received',
            sentAt: question.created_at ? new Date(question.created_at) : new Date(),
            openedAt: question.created_at ? new Date(question.created_at) : new Date(),
            clickedLinks: 0,
            type: 'tenant_question',
            property: question.propertyAddress || `Property ${question.propertyId || selectedPropertyId}`,
            propertyId: question.propertyId,
            content: question.question_text,
            direction: 'inbound',
            metadata: {
              channel: 'Web Portal',
              questionType: question.question_type || 'general',
              complexity: question.complexity || 'unknown'
            }
          });
          
          // 2. Add AI response as an outbound message (if exists)
          if (question.ai_response) {
            const aiResponseTime = question.ai_response_time ? 
              new Date(question.ai_response_time) : 
              new Date(new Date(question.created_at).getTime() + 30000); // Add 30 seconds to question time
            
            questionMessages.push({
              id: `ai-response-${question.id}`,
              recipient: {
                name: question.lead_name || 'Tenant',
                email: question.lead_email || 'tenant@email.com',
                leadId: conversationId
              },
              subject: 'AI Assistant Response',
              template: 'ai_response',
              status: 'sent',
              sentAt: aiResponseTime,
              openedAt: null,
              clickedLinks: 0,
              type: 'ai_response',
              property: question.propertyAddress || `Property ${question.propertyId || selectedPropertyId}`,
              propertyId: question.propertyId,
              content: question.ai_response,
              direction: 'outbound',
              metadata: {
                channel: 'AI Assistant',
                responseType: 'automated',
                responder: 'HomeAI Assistant'
              }
            });
          }
          
          // 3. Add human/owner response as an outbound message (if exists)
          if (question.human_response) {
            const humanResponseTime = question.response_time ? 
              new Date(question.response_time) : 
              new Date(new Date(question.created_at).getTime() + 3600000); // Add 1 hour to question time
            
            questionMessages.push({
              id: `human-response-${question.id}`,
              recipient: {
                name: question.lead_name || 'Tenant',
                email: question.lead_email || 'tenant@email.com',
                leadId: conversationId
              },
              subject: 'Property Owner Response',
              template: 'owner_response',
              status: 'sent',
              sentAt: humanResponseTime,
              openedAt: null,
              clickedLinks: 0,
              type: 'owner_response',
              property: question.propertyAddress || `Property ${question.propertyId || selectedPropertyId}`,
              propertyId: question.propertyId,
              content: question.human_response,
              direction: 'outbound',
              metadata: {
                channel: 'Property Owner',
                responseType: 'manual',
                responder: 'Property Owner'
              }
            });
          }
        });
      }
      
      // Fetch real email communications from communication_logs
      let emailMessages = [];
      try {
        let response;
        // Fetch for all properties or specific property
        if (selectedPropertyId === 'all') {
          // For 'all', we need to call the endpoint without property_id to get all
          response = await tenantSelectionAPI.getPropertyMessages({ 
            limit: 200 
          });
        } else {
          response = await tenantSelectionAPI.getPropertyMessages({ 
            propertyId: selectedPropertyId,
            limit: 200 
          });
        }
      
      
      if (response.data?.messages && response.data.messages.length > 0) {
        
        // Group messages by lead_id to create conversations
        const messagesByLead = {};
        
        response.data.messages.forEach(msg => {
          const leadId = msg.lead_id;
          if (!messagesByLead[leadId]) {
            messagesByLead[leadId] = [];
          }
          
          // Determine if this is inbound (from tenant) or outbound (from property management)
          // Messages TO listing-XXXXX@listings.homeai.ch are inbound (from tenants)
          // Messages FROM listing-XXXXX@listings.homeai.ch are outbound (property management replies)
          const isInbound = msg.recipient_email?.includes('@listings.homeai.ch') && 
                           !msg.sender_email?.includes('@listings.homeai.ch');
          
          // Determine the tenant's email address
          // For inbound messages: tenant is the sender
          // For outbound messages: tenant is the recipient
          const tenantEmail = isInbound ? msg.sender_email : msg.recipient_email;
          
          // Extract tenant name from the appropriate source
          const tenantName = isInbound ? 
            (msg.sender_name === 'Unknown' || !msg.sender_name ? 
              (msg.sender_email ? msg.sender_email.split('@')[0] : 'Tenant') : 
              msg.sender_name) :
            (msg.recipient_name === 'Unknown' || !msg.recipient_name ? 
              (msg.recipient_email ? msg.recipient_email.split('@')[0] : 'Tenant') : 
              msg.recipient_name || (msg.recipient_email ? msg.recipient_email.split('@')[0] : 'Tenant'));
          
          const transformedMsg = {
            id: msg.message_id || msg.id,
            lead_id: leadId,  // Add lead_id as top-level field
            leadId: leadId,   // Also keep leadId for compatibility
            recipient: {
              name: tenantName,
              email: tenantEmail || 'unknown@email.com',
              leadId: leadId
            },
            recipient_email: tenantEmail,  // Add recipient_email for backend compatibility
            sender_name: msg.sender_name,  // Add sender fields
            sender_email: msg.sender_email,
            subject: msg.subject || 'Property Inquiry',
            template: msg.message_type || 'email',
            status: msg.status || 'sent',
            sentAt: msg.sent_at ? new Date(msg.sent_at) : (msg.created_at ? new Date(msg.created_at) : new Date()),
            openedAt: msg.opened_at ? new Date(msg.opened_at) : null,
            type: isInbound ? 'tenant_email' : 'owner_reply',
            property: msg.property_address || msg.property_title || `Property ${msg.property_id}`,
            property_id: msg.property_id,  // Add property_id field
            propertyId: msg.property_id,   // Keep propertyId for compatibility
            content: msg.body || '',
            direction: isInbound ? 'inbound' : 'outbound',
            visibility: msg.visibility,     // Include visibility field
            sender_type: msg.sender_type,   // Include sender_type field
            metadata: {
              channel: isInbound ? 'Email' : 'Email Reply',
              messageId: msg.message_id,
              recipientEmail: msg.recipient_email,
              originalSender: msg.sender_email
            }
          };
          
          messagesByLead[leadId].push(transformedMsg);
        });
        
        // Flatten all messages from all leads
        Object.values(messagesByLead).forEach(leadMessages => {
          emailMessages.push(...leadMessages);
        });
        
      } else {
      }
      } catch (msgError) {
      }
      
      // Combine tenant questions and email messages
      const allMessages = [...questionMessages, ...emailMessages];
      
      // Sort by date (newest first)
      allMessages.sort((a, b) => b.sentAt - a.sentAt);
      
      setMessages(allMessages);
    } catch (error) {
      console.error('[MessageLog.fetchCommunications] Error fetching communications:', error);
      console.error('[MessageLog.fetchCommunications] Error details:', {
        message: error.message,
        response: error.response,
        request: error.request,
        config: error.config
      });
      
      if (error.response) {
        console.error('[MessageLog.fetchCommunications] Response error:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers
        });
      }
      
      // Show empty state on error
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    filterMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, statusFilter, typeFilter, messages]);

  const filterMessages = () => {
    let filtered = [...messages];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(msg =>
        msg.recipient.name.toLowerCase().includes(query) ||
        msg.recipient.email.toLowerCase().includes(query) ||
        msg.subject.toLowerCase().includes(query) ||
        msg.property.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(msg => msg.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(msg => msg.type === typeFilter);
    }

    setFilteredMessages(filtered);
    setPage(0); // Reset to first page when filtering
  };

  const handleViewMessage = (message) => {
    setSelectedMessage(message);
    setDetailOpen(true);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return <SentIcon fontSize="small" color="success" />;
      case 'failed':
        return <FailedIcon fontSize="small" color="error" />;
      case 'pending':
      case 'scheduled':
        return <PendingIcon fontSize="small" color="warning" />;
      case 'replied':
        return <CheckCircle fontSize="small" color="success" />;
      case 'ai_replied':
        return <ChatIcon fontSize="small" color="info" />;
      default:
        return <EmailIcon fontSize="small" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent':
      case 'replied':
        return 'success';
      case 'failed':
        return 'error';
      case 'pending':
      case 'scheduled':
        return 'warning';
      case 'ai_replied':
        return 'info';
      default:
        return 'default';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'inbound':
        return 'primary';
      case 'outbound':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const handleMenuClick = (event, message) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedMessage(message);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export message history');
  };

  const selectedProperty = properties?.data?.find(p => p.id === selectedPropertyId);

  return (
    <Box>
      {/* Email Status Widget */}
      {selectedProperty && emailConfig && (
        <EmailStatusWidget 
          property={selectedProperty} 
          emailConfig={emailConfig}
        />
      )}
      
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" fontWeight="bold">
          {t('Message History')}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant={viewMode === 'conversation' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('conversation')}
            startIcon={<ChatIcon />}
          >
            {t('Conversations')}
          </Button>
          <Button
            variant={viewMode === 'table' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('table')}
            startIcon={<ListAltIcon />}
          >
            {t('Table View')}
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
          >
            {t('Export')}
          </Button>
        </Box>
      </Box>

      {/* Filters - Show different filters based on view mode */}
      {viewMode === 'table' && (
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>{t('Select Property')}</InputLabel>
              <Select
                value={selectedPropertyId || 'all'}
                onChange={(e) => {
                  setSelectedPropertyId(e.target.value);
                }}
                label={t('Select Property')}
              >
                <MenuItem value="all">{t('All Properties')}</MenuItem>
                {properties?.data?.map((property) => (
                  <MenuItem key={property.id} value={property.id}>
                    {property.title || property.address || `Property ${property.id}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              placeholder={t('Search messages...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          
          <Grid item xs={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>{t('Status')}</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label={t('Status')}
              >
                <MenuItem value="all">{t('All Status')}</MenuItem>
                <MenuItem value="sent">{t('Sent')}</MenuItem>
                <MenuItem value="pending">{t('Pending')}</MenuItem>
                <MenuItem value="failed">{t('Failed')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>{t('Direction')}</InputLabel>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                label={t('Direction')}
              >
                <MenuItem value="all">{t('All Messages')}</MenuItem>
                <MenuItem value="inbound">{t('Received')}</MenuItem>
                <MenuItem value="outbound">{t('Sent')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Chip
                label={t('{{count}} messages', { count: filteredMessages.length })}
                color="primary"
                variant="outlined"
              />
              {statusFilter !== 'all' && (
                <Chip
                  label={statusFilter}
                  onDelete={() => setStatusFilter('all')}
                  color={getStatusColor(statusFilter)}
                />
              )}
              {typeFilter !== 'all' && (
                <Chip
                  label={typeFilter}
                  onDelete={() => setTypeFilter('all')}
                  color={getTypeColor(typeFilter)}
                />
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>
      )}

      {/* Show Conversation View or Table based on viewMode */}
      {viewMode === 'conversation' ? (
        <ConversationView
          messages={filteredMessages}
          loading={loading}
          selectedPropertyId={selectedPropertyId}
          onPropertyChange={(propertyId) => {
            setSelectedPropertyId(propertyId);
          }}
          onSendMessage={async (data) => {
            console.log('Send message:', data);
            // After sending message, refresh the communications to show new messages
            await fetchCommunications();
          }}
          onExport={handleExport}
        />
      ) : (
      <TableContainer component={Paper}>
        {loading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              {t('Loading communications...')}
            </Typography>
          </Box>
        ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('Sender')}</TableCell>
              <TableCell>{t('Subject')}</TableCell>
              <TableCell>{t('Property')}</TableCell>
              <TableCell>{t('Status')}</TableCell>
              <TableCell>{t('Date')}</TableCell>
              <TableCell align="right">{t('Actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredMessages
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((message) => (
                <TableRow
                  key={message.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => handleViewMessage(message)}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {message.direction === 'inbound' ? 
                          (message.recipient.name[0]?.toUpperCase() || 'T') : 
                          'P'}
                      </Avatar>
                      <Box>
                        <Typography variant="body2">
                          {message.direction === 'inbound' ? 
                            message.recipient.name : 
                            'Property Management'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {message.recipient.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2">
                      {message.subject || 'Property Inquiry'}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                      {message.property}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <Chip
                      icon={getStatusIcon(message.status)}
                      label={t(message.status === 'pending' ? 'received' : message.status)}
                      size="small"
                      color={message.status === 'pending' ? 'info' : getStatusColor(message.status)}
                    />
                  </TableCell>
                  
                  <TableCell>
                    {message.sentAt ? (
                      <Tooltip title={format(message.sentAt, 'PPpp')}>
                        <Typography variant="body2">
                          {formatDistanceToNow(message.sentAt, { addSuffix: true })}
                        </Typography>
                      </Tooltip>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuClick(e, message)}
                    >
                      <MoreIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        )}
        
        {!loading && (
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredMessages.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
        )}
      </TableContainer>
      )}

      {/* Empty State */}
      {filteredMessages.length === 0 && viewMode === 'table' && (
        <Paper sx={{ p: 8, textAlign: 'center' }}>
          <EmailIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {t('No messages found')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
              ? t('Try adjusting your filters')
              : t('Your message history will appear here')}
          </Typography>
        </Paper>
      )}

      {/* Action Menu */}
      {anchorEl && (
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          handleViewMessage(selectedMessage);
          handleMenuClose();
        }}>
          <ViewIcon sx={{ mr: 2 }} />
          {t('View Details')}
        </MenuItem>
        <MenuItem onClick={() => {
          // TODO: Implement resend
          handleMenuClose();
        }}>
          <ReplyIcon sx={{ mr: 2 }} />
          {t('Resend')}
        </MenuItem>
        <MenuItem onClick={() => {
          // TODO: Implement forward
          handleMenuClose();
        }}>
          <ForwardIcon sx={{ mr: 2 }} />
          {t('Forward')}
        </MenuItem>
      </Menu>
      )}

      {/* Message Detail Dialog */}
      {selectedMessage && (
        <MessageDetail
          open={detailOpen}
          message={selectedMessage}
          onClose={() => {
            setDetailOpen(false);
            setSelectedMessage(null);
          }}
        />
      )}
    </Box>
  );
};

export default MessageLog;