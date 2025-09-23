import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  IconButton,
  Chip,
  Grid,
  TextField,
  Divider,
  Card,
  CardContent
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  ContentCopy as CopyIcon,
  Email as EmailIcon,
  Send as SendIcon,
  OpenInNew as OpenIcon,
  VideoLibrary as VideoIcon,
  Message as MessageIcon,
  Home as HomeIcon,
  Check as CheckIcon,
  ArrowForward as ArrowIcon
} from '@mui/icons-material';
import Confetti from 'react-confetti';

const PORTAL_LIST = [
  { 
    id: 'homegate', 
    name: 'Homegate.ch', 
    icon: '🏠',
    helpUrl: 'https://help.homegate.ch/update-email'
  },
  { 
    id: 'flatfox', 
    name: 'Flatfox.ch', 
    icon: '🦊',
    helpUrl: 'https://flatfox.ch/help/email-update'
  },
  { 
    id: 'immoscout24', 
    name: 'ImmoScout24.ch', 
    icon: '🔍',
    helpUrl: 'https://immoscout24.ch/support/email'
  },
  { 
    id: 'comparis', 
    name: 'Comparis.ch', 
    icon: '⚖️',
    helpUrl: 'https://comparis.ch/help'
  },
  { 
    id: 'newhome', 
    name: 'Newhome.ch', 
    icon: '🏡',
    helpUrl: 'https://newhome.ch/support'
  }
];

const CompletionStep = ({ propertyData, emailConfig, onComplete }) => {
  const [checkedPortals, setCheckedPortals] = useState({});
  const [otherPortal, setOtherPortal] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(true);

  // Hide confetti after 5 seconds
  React.useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const handlePortalCheck = (portalId) => {
    setCheckedPortals({
      ...checkedPortals,
      [portalId]: !checkedPortals[portalId]
    });
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(emailConfig.managedEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendInstructions = async () => {
    // In a real implementation, this would call an API to send the email
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setEmailSent(true);
      
      // Show success message
      setTimeout(() => setEmailSent(false), 5000);
    } catch (error) {
      console.error('Failed to send instructions:', error);
    }
  };

  const getCompletionStatus = () => {
    const checkedCount = Object.values(checkedPortals).filter(Boolean).length;
    const totalPortals = PORTAL_LIST.length;
    
    if (checkedCount === 0) return { text: 'Not started', color: 'text.secondary' };
    if (checkedCount < totalPortals / 2) return { text: 'In progress', color: 'warning.main' };
    if (checkedCount < totalPortals) return { text: 'Almost done', color: 'info.main' };
    return { text: 'Complete!', color: 'success.main' };
  };

  const status = getCompletionStatus();

  return (
    <Box>
      {showConfetti && emailConfig.testStatus === 'success' && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={200}
          gravity={0.1}
        />
      )}

      <Paper sx={{ p: 3, mb: 3, bgcolor: 'success.light', border: '2px solid', borderColor: 'success.main' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <CheckCircleIcon color="success" sx={{ fontSize: 48 }} />
          <Box>
            <Typography variant="h5" fontWeight="bold" color="success.dark">
              Setup Complete!
            </Typography>
            <Typography variant="body1" color="success.dark">
              Your property is ready to receive applications
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Property Details
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <HomeIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={propertyData.title || propertyData.address}
                    secondary={propertyData.address}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <EmailIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Managed Email"
                    secondary={emailConfig.managedEmail}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    {emailConfig.testStatus === 'success' ? (
                      <CheckCircleIcon fontSize="small" color="success" />
                    ) : (
                      <EmailIcon fontSize="small" />
                    )}
                  </ListItemIcon>
                  <ListItemText 
                    primary="Email Status"
                    secondary={
                      emailConfig.testStatus === 'success' 
                        ? 'Verified and working' 
                        : 'Not tested'
                    }
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={copied ? <CheckIcon /> : <CopyIcon />}
                  onClick={handleCopyEmail}
                  color={copied ? 'success' : 'primary'}
                >
                  {copied ? 'Email Copied!' : 'Copy Managed Email'}
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={emailSent ? <CheckIcon /> : <SendIcon />}
                  onClick={handleSendInstructions}
                  disabled={emailSent}
                  color={emailSent ? 'success' : 'primary'}
                >
                  {emailSent ? 'Instructions Sent!' : 'Email Me Instructions'}
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<VideoIcon />}
                  onClick={() => window.open('/help/portal-setup', '_blank')}
                >
                  Watch Tutorial
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Next Steps: Update Your Portal Listings
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Update the contact email on each portal where your property is listed. 
          Check off each portal as you complete the update.
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Update Status: <Chip label={status.text} size="small" sx={{ color: status.color }} />
          </Typography>
        </Box>

        <List>
          {PORTAL_LIST.map((portal) => (
            <ListItem
              key={portal.id}
              sx={{
                bgcolor: checkedPortals[portal.id] ? 'action.hover' : 'transparent',
                borderRadius: 1,
                mb: 1
              }}
            >
              <ListItemIcon>
                <Checkbox
                  checked={checkedPortals[portal.id] || false}
                  onChange={() => handlePortalCheck(portal.id)}
                />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>{portal.icon}</span>
                    <Typography
                      sx={{
                        textDecoration: checkedPortals[portal.id] ? 'line-through' : 'none',
                        color: checkedPortals[portal.id] ? 'text.secondary' : 'text.primary'
                      }}
                    >
                      {portal.name}
                    </Typography>
                  </Box>
                }
                secondary="Update contact email in listing settings"
              />
              <IconButton
                size="small"
                onClick={() => window.open(portal.helpUrl, '_blank')}
                title="Get help"
              >
                <OpenIcon fontSize="small" />
              </IconButton>
            </ListItem>
          ))}
          
          <Divider sx={{ my: 2 }} />
          
          <ListItem>
            <ListItemIcon>
              <Checkbox
                checked={!!otherPortal}
                onChange={(e) => setOtherPortal(e.target.checked ? 'Other' : '')}
              />
            </ListItemIcon>
            <TextField
              fullWidth
              size="small"
              placeholder="Other portal (specify)"
              value={otherPortal}
              onChange={(e) => setOtherPortal(e.target.value)}
            />
          </ListItem>
        </List>

        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>Remember:</strong> Applications will only be received from portals where you've 
            updated the contact email to {emailConfig.managedEmail}
          </Typography>
        </Alert>
      </Paper>

      <Paper sx={{ p: 3, mt: 3, bgcolor: 'primary.light' }}>
        <Typography variant="h6" gutterBottom>
          Monitor Your Applications
        </Typography>
        <Typography variant="body2" sx={{ mb: 3 }}>
          Once you've updated your portal listings, applications will automatically appear in your Messages section.
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<MessageIcon />}
              onClick={() => window.location.href = '/owner/messages'}
            >
              Go to Messages
            </Button>
          </Grid>
          <Grid item xs={12} md={6}>
            <Button
              fullWidth
              variant="outlined"
              size="large"
              onClick={onComplete}
            >
              Done
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {emailConfig.testStatus !== 'success' && (
        <Alert severity="warning" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>Note:</strong> Email forwarding was not tested. You can test it anytime from the 
            Messages section to ensure everything is working correctly.
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default CompletionStep;