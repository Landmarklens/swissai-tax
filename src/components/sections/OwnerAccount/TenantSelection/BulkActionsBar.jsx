import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Menu,
  MenuItem,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  FormControl,
  InputLabel,
  Chip
} from '@mui/material';
import {
  Close as CloseIcon,
  Email as EmailIcon,
  Schedule as ScheduleIcon,
  CheckCircle as AcceptIcon,
  Cancel as RejectIcon,
  MoreVert as MoreIcon,
  Download as ExportIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { updateLeadStatus, scheduleViewing, bulkInviteToViewing } from '../../../../store/slices/tenantSelectionSlice';

const BulkActionsBar = ({ selectedCount, selectedLeads = [], onClear, leads = [] }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [anchorEl, setAnchorEl] = useState(null);
  const [messageDialog, setMessageDialog] = useState(false);
  const [viewingDialog, setViewingDialog] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  const [messageTemplate, setMessageTemplate] = useState('');
  const [viewingDate, setViewingDate] = useState('');
  const [viewingTime, setViewingTime] = useState('');
  const [viewingLocation, setViewingLocation] = useState('');

  const handleMoreClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleBulkAccept = async () => {
    const confirmMessage = t('Are you sure you want to accept {{count}} applications?', { count: selectedCount });
    if (window.confirm(confirmMessage)) {
      for (const leadId of selectedLeads) {
        await dispatch(updateLeadStatus({ 
          leadId, 
          status: 'qualified',
          notes: 'Bulk accepted'
        }));
      }
      onClear();
    }
  };

  const handleBulkReject = async () => {
    const confirmMessage = t('Are you sure you want to reject {{count}} applications?', { count: selectedCount });
    if (window.confirm(confirmMessage)) {
      for (const leadId of selectedLeads) {
        await dispatch(updateLeadStatus({ 
          leadId, 
          status: 'rejected',
          notes: 'Bulk rejected'
        }));
      }
      onClear();
    }
  };

  const handleSendMessage = () => {
    setMessageDialog(true);
    handleCloseMenu();
  };

  const handleScheduleViewing = () => {
    setViewingDialog(true);
    handleCloseMenu();
  };

  const handleExport = () => {
    const selectedLeadData = leads.filter(lead => selectedLeads.includes(lead.id));
    const csvContent = convertToCSV(selectedLeadData);
    downloadCSV(csvContent, 'selected_applications.csv');
    handleCloseMenu();
  };

  const convertToCSV = (data) => {
    const headers = ['Name', 'Email', 'Phone', 'Score', 'Status', 'Source', 'Applied Date'];
    const rows = data.map(lead => [
      lead.name || 'N/A',
      lead.email,
      lead.phone || 'N/A',
      lead.score,
      lead.status,
      lead.source_portal,
      new Date(lead.created_at).toLocaleDateString()
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
  };

  const downloadCSV = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleSendBulkMessage = async () => {
    // TODO: Implement bulk message sending via API
    setMessageDialog(false);
    setMessageContent('');
    setMessageTemplate('');
    onClear();
  };

  const handleScheduleBulkViewing = async () => {
    const viewingData = {
      leadIds: selectedLeads,
      viewingDetails: {
        date: viewingDate,
        time: viewingTime,
        location: viewingLocation
      }
    };
    
    await dispatch(bulkInviteToViewing(viewingData));
    setViewingDialog(false);
    setViewingDate('');
    setViewingTime('');
    setViewingLocation('');
    onClear();
  };

  return (
    <>
      <AppBar 
        position="sticky" 
        color="primary" 
        elevation={2}
        sx={{ 
          top: 'auto', 
          bottom: 0,
          borderRadius: '8px 8px 0 0'
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={onClear}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
          
          <Typography variant="h6" sx={{ ml: 2, mr: 3 }}>
            {t('{{count}} selected', { count: selectedCount })}
          </Typography>
          
          <Divider orientation="vertical" flexItem sx={{ mx: 2, bgcolor: 'rgba(255,255,255,0.3)' }} />
          
          <Box sx={{ display: 'flex', gap: 2, flexGrow: 1 }}>
            <Button
              color="inherit"
              startIcon={<AcceptIcon />}
              onClick={handleBulkAccept}
            >
              {t('Accept All')}
            </Button>
            
            <Button
              color="inherit"
              startIcon={<RejectIcon />}
              onClick={handleBulkReject}
            >
              {t('Reject All')}
            </Button>
            
            <Button
              color="inherit"
              startIcon={<EmailIcon />}
              onClick={handleSendMessage}
            >
              {t('Send Message')}
            </Button>
            
            <Button
              color="inherit"
              startIcon={<ScheduleIcon />}
              onClick={handleScheduleViewing}
            >
              {t('Schedule Viewing')}
            </Button>
          </Box>
          
          <IconButton
            color="inherit"
            onClick={handleMoreClick}
          >
            <MoreIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* More Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={handleExport}>
          <ExportIcon sx={{ mr: 2 }} />
          {t('Export Selected')}
        </MenuItem>
      </Menu>

      {/* Bulk Message Dialog */}
      <Dialog
        open={messageDialog}
        onClose={() => setMessageDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('Send Message to {{count}} Recipients', { count: selectedCount })}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mb: 2, mt: 1 }}>
            <InputLabel>{t('Message Template')}</InputLabel>
            <Select
              value={messageTemplate}
              onChange={(e) => setMessageTemplate(e.target.value)}
              label={t('Message Template')}
            >
              <MenuItem value="">{t('None')}</MenuItem>
              <MenuItem value="viewing_invitation">{t('Viewing Invitation')}</MenuItem>
              <MenuItem value="document_request">{t('Document Request')}</MenuItem>
              <MenuItem value="application_received">{t('Application Received')}</MenuItem>
              <MenuItem value="application_update">{t('Application Update')}</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            multiline
            rows={6}
            label={t('Message Content')}
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            placeholder={t('Enter your message here...')}
          />
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              {t('Available variables')}: 
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
              <Chip label="{{name}}" size="small" onClick={() => setMessageContent(prev => prev + ' {{name}}')} />
              <Chip label="{{property}}" size="small" onClick={() => setMessageContent(prev => prev + ' {{property}}')} />
              <Chip label="{{date}}" size="small" onClick={() => setMessageContent(prev => prev + ' {{date}}')} />
              <Chip label="{{time}}" size="small" onClick={() => setMessageContent(prev => prev + ' {{time}}')} />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMessageDialog(false)}>{t('Cancel')}</Button>
          <Button 
            onClick={handleSendBulkMessage} 
            variant="contained"
            disabled={!messageContent.trim()}
          >
            {t('Send Message')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Viewing Dialog */}
      <Dialog
        open={viewingDialog}
        onClose={() => setViewingDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('Schedule Viewing for {{count}} Applicants', { count: selectedCount })}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <TextField
              fullWidth
              type="date"
              label={t('Viewing Date')}
              value={viewingDate}
              onChange={(e) => setViewingDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            
            <TextField
              fullWidth
              type="time"
              label={t('Viewing Time')}
              value={viewingTime}
              onChange={(e) => setViewingTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
          
          <TextField
            fullWidth
            label={t('Location')}
            value={viewingLocation}
            onChange={(e) => setViewingLocation(e.target.value)}
            placeholder={t('Enter viewing location...')}
            sx={{ mt: 2 }}
          />
          
          <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
            <Typography variant="body2">
              {t('An invitation will be sent to all selected applicants with the viewing details.')}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewingDialog(false)}>{t('Cancel')}</Button>
          <Button 
            onClick={handleScheduleBulkViewing} 
            variant="contained"
            disabled={!viewingDate || !viewingTime || !viewingLocation}
          >
            {t('Schedule & Send Invites')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BulkActionsBar;