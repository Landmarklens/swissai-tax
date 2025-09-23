import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  Tab,
  Tabs,
  Paper
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  Save as SaveIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

const emailTemplates = [
  {
    id: 1,
    name: 'Viewing Invitation',
    subject: 'Invitation to Property Viewing',
    body: `Dear {applicant_name},

Thank you for your interest in our property. We would like to invite you to a viewing.

Date: {viewing_date}
Time: {viewing_time}
Location: {property_address}

Please confirm your attendance by replying to this email.

Best regards,
{landlord_name}`
  },
  {
    id: 2,
    name: 'Application Received',
    subject: 'Application Received - {property_name}',
    body: `Dear {applicant_name},

Thank you for submitting your application for {property_name}. We have received your documents and will review them shortly.

We will contact you within 2-3 business days with our decision.

Best regards,
{landlord_name}`
  },
  {
    id: 3,
    name: 'Request Additional Documents',
    subject: 'Additional Documents Required',
    body: `Dear {applicant_name},

Thank you for your application. To proceed with the evaluation, we need the following additional documents:

- [Document 1]
- [Document 2]

Please send these documents at your earliest convenience.

Best regards,
{landlord_name}`
  },
  {
    id: 4,
    name: 'Application Approved',
    subject: 'Congratulations! Your Application is Approved',
    body: `Dear {applicant_name},

We are pleased to inform you that your application for {property_name} has been approved!

Next steps:
1. Sign the lease agreement
2. Transfer the security deposit
3. Schedule move-in date

We will send you the lease agreement shortly.

Best regards,
{landlord_name}`
  }
];

const EmailComposer = ({ open, onClose, recipients = [], applications = [], onEmailSent }) => {
  const [tabValue, setTabValue] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [emailData, setEmailData] = useState({
    to: [],
    subject: '',
    body: '',
    attachments: []
  });
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [sendingStatus, setSendingStatus] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (recipients && recipients.length > 0) {
      setSelectedRecipients(recipients.map(r => r.id));
      setEmailData(prev => ({
        ...prev,
        to: recipients.map(r => r.email || `applicant_${r.id}@example.com`)
      }));
    }
  }, [recipients]);

  const handleTemplateSelect = (templateId) => {
    const template = emailTemplates.find(t => t.id === parseInt(templateId));
    if (template) {
      setEmailData({
        ...emailData,
        subject: template.subject,
        body: template.body
      });
    }
    setSelectedTemplate(templateId);
  };

  const handleRecipientToggle = (applicantId) => {
    const newSelected = selectedRecipients.includes(applicantId)
      ? selectedRecipients.filter(id => id !== applicantId)
      : [...selectedRecipients, applicantId];
    
    setSelectedRecipients(newSelected);
    
    const selectedApplicants = applications.filter(a => newSelected.includes(a.id));
    setEmailData({
      ...emailData,
      to: selectedApplicants.map(a => a.email || `applicant_${a.id}@example.com`)
    });
  };

  const handleSendEmail = async () => {
    // Validation
    const newErrors = {};
    if (emailData.to.length === 0) {
      newErrors.to = 'Please select at least one recipient';
    }
    if (!emailData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }
    if (!emailData.body.trim()) {
      newErrors.body = 'Email body is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSendingStatus('sending');
    
    // Simulate sending email
    setTimeout(() => {
      setSendingStatus('sent');
      if (onEmailSent) {
        selectedRecipients.forEach(recipientId => {
          onEmailSent(recipientId);
        });
      }
      
      // Reset form after successful send
      setTimeout(() => {
        handleClose();
      }, 1500);
    }, 2000);
  };

  const handleClose = () => {
    setEmailData({
      to: [],
      subject: '',
      body: '',
      attachments: []
    });
    setSelectedRecipients([]);
    setSelectedTemplate('');
    setSendingStatus('');
    setErrors({});
    setTabValue(0);
    onClose();
  };

  const replacePlaceholders = (text) => {
    // This would be replaced with actual data in production
    const placeholders = {
      '{applicant_name}': 'Applicant',
      '{property_name}': 'Property',
      '{property_address}': 'Property Address',
      '{viewing_date}': 'Date',
      '{viewing_time}': 'Time',
      '{landlord_name}': 'Landlord'
    };

    let result = text;
    Object.keys(placeholders).forEach(key => {
      result = result.replace(new RegExp(key, 'g'), placeholders[key]);
    });
    return result;
  };

  if (!open) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Compose Email</Typography>
          <Box>
            {selectedRecipients.length > 0 && (
              <Chip
                icon={selectedRecipients.length === 1 ? <PersonIcon /> : <GroupIcon />}
                label={`${selectedRecipients.length} recipient${selectedRecipients.length > 1 ? 's' : ''}`}
                color="primary"
                variant="outlined"
              />
            )}
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 2 }}>
          <Tab label="Compose" />
          <Tab label="Recipients" />
          <Tab label="Templates" />
        </Tabs>

        {/* Compose Tab */}
        {tabValue === 0 && (
          <Box>
            {sendingStatus === 'sent' && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Email sent successfully!
              </Alert>
            )}

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Template</InputLabel>
              <Select
                value={selectedTemplate}
                onChange={(e) => handleTemplateSelect(e.target.value)}
                label="Template"
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {emailTemplates.map(template => (
                  <MenuItem key={template.id} value={template.id}>
                    {template.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="To"
              value={emailData.to.join(', ')}
              InputProps={{ readOnly: true }}
              error={!!errors.to}
              helperText={errors.to}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Subject"
              value={emailData.subject}
              onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
              error={!!errors.subject}
              helperText={errors.subject}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              multiline
              rows={10}
              label="Message"
              value={emailData.body}
              onChange={(e) => setEmailData({ ...emailData, body: e.target.value })}
              error={!!errors.body}
              helperText={errors.body || 'Use placeholders like {applicant_name}, {property_name}, etc.'}
              sx={{ mb: 2 }}
            />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<AttachFileIcon />}
                component="label"
              >
                Attach Files
                <input type="file" hidden multiple />
              </Button>
              {emailData.attachments.length > 0 && (
                <Typography variant="body2">
                  {emailData.attachments.length} file(s) attached
                </Typography>
              )}
            </Box>
          </Box>
        )}

        {/* Recipients Tab */}
        {tabValue === 1 && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select recipients from your applicant list
            </Typography>
            
            <Paper variant="outlined" sx={{ maxHeight: 400, overflow: 'auto' }}>
              <List>
                {applications.length === 0 ? (
                  <ListItem>
                    <ListItemText primary="No applicants available" />
                  </ListItem>
                ) : (
                  applications.map((applicant) => (
                    <ListItem key={applicant.id}>
                      <ListItemIcon>
                        <Checkbox
                          checked={selectedRecipients.includes(applicant.id)}
                          onChange={() => handleRecipientToggle(applicant.id)}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={applicant.name || 'Anonymous Applicant'}
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              {applicant.email || `applicant_${applicant.id}@example.com`}
                            </Typography>
                            <Typography variant="caption">
                              Score: {applicant.score}/100 | Status: {applicant.lead_status || applicant.status}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))
                )}
              </List>
            </Paper>
          </Box>
        )}

        {/* Templates Tab */}
        {tabValue === 2 && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select a template to use for your email
            </Typography>
            
            <List>
              {emailTemplates.map((template) => (
                <Paper key={template.id} variant="outlined" sx={{ mb: 2, p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {template.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Subject: {template.subject}
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                        {template.body.substring(0, 150)}...
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleTemplateSelect(template.id)}
                    >
                      Use Template
                    </Button>
                  </Box>
                </Paper>
              ))}
            </List>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          variant="contained"
          startIcon={<SendIcon />}
          onClick={handleSendEmail}
          disabled={sendingStatus === 'sending' || selectedRecipients.length === 0}
        >
          {sendingStatus === 'sending' ? 'Sending...' : `Send to ${selectedRecipients.length} recipient(s)`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmailComposer;