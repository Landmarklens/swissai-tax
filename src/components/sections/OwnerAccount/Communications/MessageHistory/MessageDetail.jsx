import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Divider,
  IconButton,
  Avatar,
  Grid,
  Paper
} from '@mui/material';
import {
  Close as CloseIcon,
  Email as EmailIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Person as PersonIcon,
  Home as HomeIcon,
  Message as MessageIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

const MessageDetail = ({ open, message, onClose }) => {
  const { t } = useTranslation();

  if (!message) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent':
        return 'success';
      case 'failed':
        return 'error';
      case 'pending':
      case 'scheduled':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2
        }
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">
            {t('Message Details')}
          </Typography>
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Recipient Information */}
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="subtitle1" fontWeight="bold">
                  {t('Recipient Information')}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar sx={{ width: 48, height: 48, mr: 2 }}>
                  {message.recipient?.name?.[0] || '?'}
                </Avatar>
                <Box>
                  <Typography variant="body1" fontWeight="medium">
                    {message.recipient?.name || t('Unknown')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {message.recipient?.email || t('No email')}
                  </Typography>
                  {message.recipient?.leadId && (
                    <Typography variant="caption" color="text.secondary">
                      Lead ID: {message.recipient.leadId}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Message Information */}
          <Grid item xs={12}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                {t('Subject')}
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {message.subject || t('No Subject')}
              </Typography>
            </Box>

            {message.property && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  <HomeIcon sx={{ fontSize: 16, verticalAlign: 'text-bottom', mr: 0.5 }} />
                  {t('Property')}
                </Typography>
                <Typography variant="body1">
                  {message.property}
                </Typography>
              </Box>
            )}

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                {t('Status')}
              </Typography>
              <Chip
                label={t(message.status || 'unknown')}
                color={getStatusColor(message.status)}
                size="small"
                sx={{ mt: 0.5 }}
              />
            </Box>

            {message.template && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  {t('Template')}
                </Typography>
                <Typography variant="body2">
                  {message.template}
                </Typography>
              </Box>
            )}

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                <ScheduleIcon sx={{ fontSize: 16, verticalAlign: 'text-bottom', mr: 0.5 }} />
                {t('Date & Time')}
              </Typography>
              <Typography variant="body2">
                {message.sentAt ? format(new Date(message.sentAt), 'PPpp') : t('Not sent')}
              </Typography>
              {message.openedAt && (
                <Typography variant="body2" color="success.main" sx={{ mt: 0.5 }}>
                  <CheckCircleIcon sx={{ fontSize: 14, verticalAlign: 'text-bottom', mr: 0.5 }} />
                  {t('Opened')}: {format(new Date(message.openedAt), 'PPpp')}
                </Typography>
              )}
            </Box>
          </Grid>

          {/* Message Content */}
          {message.content && (
            <Grid item xs={12}>
              <Divider sx={{ mb: 2 }} />
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  <MessageIcon sx={{ fontSize: 16, verticalAlign: 'text-bottom', mr: 0.5 }} />
                  {t('Message Content')}
                </Typography>
                <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50', mt: 1 }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {message.content}
                  </Typography>
                </Paper>
              </Box>
            </Grid>
          )}

          {/* Engagement Metrics */}
          {(message.clickedLinks > 0 || message.openRate || message.clickRate) && (
            <Grid item xs={12}>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                {t('Engagement')}
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {message.clickedLinks > 0 && (
                  <Grid item xs={4}>
                    <Paper elevation={0} sx={{ p: 1.5, textAlign: 'center', bgcolor: 'primary.50' }}>
                      <Typography variant="h6" color="primary.main">
                        {message.clickedLinks}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t('Links Clicked')}
                      </Typography>
                    </Paper>
                  </Grid>
                )}
                {message.openRate && (
                  <Grid item xs={4}>
                    <Paper elevation={0} sx={{ p: 1.5, textAlign: 'center', bgcolor: 'success.50' }}>
                      <Typography variant="h6" color="success.main">
                        {message.openRate}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t('Open Rate')}
                      </Typography>
                    </Paper>
                  </Grid>
                )}
                {message.clickRate && (
                  <Grid item xs={4}>
                    <Paper elevation={0} sx={{ p: 1.5, textAlign: 'center', bgcolor: 'info.50' }}>
                      <Typography variant="h6" color="info.main">
                        {message.clickRate}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t('Click Rate')}
                      </Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>
          {t('Close')}
        </Button>
        <Button variant="contained" startIcon={<EmailIcon />}>
          {t('Reply')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MessageDetail;