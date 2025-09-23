import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  InputAdornment,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Email as EmailIcon,
  ContentCopy as CopyIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

const EmailForwardingModal = ({ property, open, onClose }) => {
  const { t } = useTranslation();
  const [emailSetupData, setEmailSetupData] = useState({
    managedEmail: '',
    emailProvider: '',
    forwardingConfirmed: false
  });
  const [loading, setLoading] = useState(true);

  const getProviderInstructions = (provider) => {
    const managedEmail = emailSetupData.managedEmail;
    const instructions = {
      gmail: {
        name: 'Gmail',
        steps: [
          'Open Gmail settings (gear icon → See all settings)',
          'Go to "Forwarding and POP/IMAP" tab',
          'Click "Add a forwarding address"',
          `Enter: ${managedEmail}`,
          'Click "Next" → "Proceed" → "OK"',
          'Select "Forward a copy of incoming mail to" and choose the address',
          'Choose what to do with Gmail\'s copy (recommend: "Keep Gmail\'s copy in Inbox")',
          'Save changes at the bottom of the page'
        ]
      },
      outlook: {
        name: 'Outlook/Hotmail',
        steps: [
          'Go to Settings (gear icon) → View all Outlook settings',
          'Select "Mail" → "Forwarding"',
          'Enable forwarding',
          `Enter forwarding address: ${managedEmail}`,
          'Choose "Keep a copy of forwarded messages"',
          'Save your changes'
        ]
      },
      yahoo: {
        name: 'Yahoo Mail',
        steps: [
          'Click Settings (gear icon) → More Settings',
          'Select "Mailboxes" → Your email account',
          'In "Forwarding" section, enter the forwarding address',
          `Add: ${managedEmail}`,
          'Click "Verify"',
          'Save your settings'
        ]
      },
      apple: {
        name: 'iCloud Mail',
        steps: [
          'Sign in to iCloud.com',
          'Open Mail and click the gear icon',
          'Choose "Preferences" → "General"',
          'Select "Forward my email to:"',
          `Enter: ${managedEmail}`,
          'Choose "Delete messages after forwarding" or keep a copy',
          'Click "Done"'
        ]
      },
      other: {
        name: 'Other Email Providers',
        steps: [
          'Log in to your email account',
          'Navigate to Settings or Preferences',
          'Look for "Forwarding", "Mail Forwarding", or "Email Forwarding"',
          `Add forwarding address: ${managedEmail}`,
          'Verify the forwarding address if required',
          'Enable forwarding and save your settings'
        ]
      }
    };
    
    return instructions[provider] || instructions.other;
  };

  // Fetch managed email when modal opens
  useEffect(() => {
    if (property?.id) {
      const managedEmail = `listing-${property.id}@listings.homeai.ch`;
      setEmailSetupData(prev => ({ ...prev, managedEmail }));
      setLoading(false);
    }
  }, [property]);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(emailSetupData.managedEmail);
    toast.success('Email address copied to clipboard!');
  };

  const currentInstructions = getProviderInstructions(emailSetupData.emailProvider || 'other');

  if (!property) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '600px' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <EmailIcon color="primary" />
            <Typography variant="h6">
              {t('Email Forwarding Setup')}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {t('Property')}: {property.address}, {property.city}
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                {t('Configure your email to forward tenant applications to our system for automatic processing.')}
              </Typography>
            </Alert>
            
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                {t('Your Managed Email Address')}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <TextField
                  fullWidth
                  value={emailSetupData.managedEmail}
                  disabled
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <Tooltip title="Copy to clipboard">
                          <IconButton onClick={handleCopyEmail} edge="end">
                            <CopyIcon />
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    )
                  }}
                />
              </Box>
              <Typography variant="caption" color="text.secondary">
                {t('Use this email address when listing your property on portals like Homegate.ch, Flatfox.ch, or ImmoScout24.ch')}
              </Typography>
            </Paper>
            
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                {t('Setup Email Forwarding')}
              </Typography>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>{t('Select Your Email Provider')}</InputLabel>
                <Select
                  value={emailSetupData.emailProvider || ''}
                  onChange={(e) => setEmailSetupData(prev => ({ ...prev, emailProvider: e.target.value }))}
                  label={t('Select Your Email Provider')}
                >
                  <MenuItem value="gmail">Gmail</MenuItem>
                  <MenuItem value="outlook">Outlook/Hotmail</MenuItem>
                  <MenuItem value="yahoo">Yahoo Mail</MenuItem>
                  <MenuItem value="apple">iCloud Mail</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
              
              {emailSetupData.emailProvider && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                    {t('Instructions for')} {currentInstructions.name}:
                  </Typography>
                  <List dense>
                    {currentInstructions.steps.map((step, index) => (
                      <ListItem key={index}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <Typography variant="body2" color="primary">
                            {index + 1}.
                          </Typography>
                        </ListItemIcon>
                        <ListItemText 
                          primary={
                            <Typography variant="body2">
                              {step}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                  
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <strong>{t('Important:')}</strong> {t('After setting up forwarding, all emails sent to your listing email will be automatically forwarded to our system for processing.')}
                    </Typography>
                  </Alert>
                </Box>
              )}
            </Paper>
            
            <Paper sx={{ p: 3 }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                {t('Confirmation')}
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={emailSetupData.forwardingConfirmed || false}
                    onChange={(e) => setEmailSetupData(prev => ({ ...prev, forwardingConfirmed: e.target.checked }))}
                  />
                }
                label={t('I have set up email forwarding as instructed')}
              />
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                {t('Please confirm that you have configured email forwarding in your email account.')}
              </Typography>
            </Paper>
            
            <Alert severity="info" sx={{ mt: 3 }}>
              <Typography variant="body2">
                <strong>{t('What happens next:')}</strong>
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={t('Update your property listings')}
                    secondary={t('Use the managed email address as the contact email on all listing portals')}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={t('Automatic processing')}
                    secondary={t('All tenant applications will be automatically processed and appear in your Messages')}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={t('AI-powered screening')}
                    secondary={t('Applications will be scored and ranked based on your criteria')}
                  />
                </ListItem>
              </List>
            </Alert>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
        <Button 
          onClick={onClose} 
          variant="outlined"
          color="inherit"
          size="large"
        >
          {t('Cancel')}
        </Button>
        <Button 
          onClick={onClose} 
          variant="contained"
          disabled={!emailSetupData.forwardingConfirmed}
          size="large"
        >
          {t('Complete')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmailForwardingModal;