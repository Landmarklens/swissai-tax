import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  FormControlLabel,
  Checkbox,
  LinearProgress,
  Chip,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  Email as EmailIcon,
  ContentCopy as CopyIcon,
  Send as SendIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  OpenInNew as OpenIcon,
  Timer as TimerIcon,
  ArrowForward as ArrowIcon
} from '@mui/icons-material';

const EmailSetupStep = ({
  emailConfig,
  onConfigChange,
  propertyData,
  onStartMonitoring,
  onStopMonitoring,
  monitoringStatus,
  testResult
}) => {
  const { t } = useTranslation();
  const [testStatus, setTestStatus] = useState(emailConfig.testStatus || 'not_tested');
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [copied, setCopied] = useState({ email: false, subject: false });
  const [showInstructions, setShowInstructions] = useState(true);

  // Generate test subject with verification code
  const testSubject = `TEST-PROPERTY-${propertyData.id || 'NEW'}-${emailConfig.verificationCode}`;

  // Countdown timer for monitoring
  useEffect(() => {
    let timer;
    if (monitoringStatus === 'monitoring' && timeRemaining > 0) {
      timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
    } else if (timeRemaining === 0 && monitoringStatus === 'monitoring') {
      handleMonitoringTimeout();
    }
    return () => clearTimeout(timer);
  }, [monitoringStatus, timeRemaining]);

  // Update test status based on monitoring results
  useEffect(() => {
    if (testResult?.success) {
      setTestStatus('success');
      onConfigChange({ ...emailConfig, testStatus: 'success' });
      onStopMonitoring();
    }
  }, [testResult]);

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied({ ...copied, [type]: true });
    setTimeout(() => {
      setCopied({ ...copied, [type]: false });
    }, 2000);
  };

  const handleOpenEmailClient = () => {
    const mailto = `mailto:${emailConfig.managedEmail}?subject=${encodeURIComponent(testSubject)}&body=${encodeURIComponent(
      `This is a test email for property verification.\n\nProperty: ${propertyData.address || propertyData.title}\nVerification Code: ${emailConfig.verificationCode}\n\nPlease do not modify this email.`
    )}`;
    window.open(mailto);
    
    // Start monitoring after a short delay
    setTimeout(() => {
      handleStartMonitoring();
    }, 3000);
  };

  const handleStartMonitoring = () => {
    setTestStatus('monitoring');
    setTimeRemaining(60);
    onStartMonitoring({
      propertyId: propertyData.id,
      verificationCode: emailConfig.verificationCode,
      managedEmail: emailConfig.managedEmail
    });
  };

  const handleMonitoringTimeout = () => {
    setTestStatus('timeout');
    onConfigChange({ ...emailConfig, testStatus: 'timeout' });
    onStopMonitoring();
  };

  const handleRetryTest = () => {
    setTestStatus('not_tested');
    setTimeRemaining(60);
    onConfigChange({ 
      ...emailConfig, 
      testStatus: 'not_tested',
      verificationCode: generateNewVerificationCode()
    });
  };

  const generateNewVerificationCode = () => {
    return `TEST-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  };

  const handlePersonalEmailChange = (event) => {
    onConfigChange({
      ...emailConfig,
      forwardToPersonal: event.target.checked
    });
  };

  const handlePersonalEmailAddressChange = (event) => {
    onConfigChange({
      ...emailConfig,
      personalEmail: event.target.value
    });
  };

  const renderEmailFlowDiagram = () => (
    <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
      <Typography variant="subtitle2" gutterBottom>
        How Email Forwarding Works
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', mt: 2 }}>
        <Box textAlign="center">
          <EmailIcon color="primary" />
          <Typography variant="caption">{t('filing.portal_listing')}</Typography>
        </Box>
        <ArrowIcon color="action" />
        <Box textAlign="center">
          <EmailIcon color="secondary" />
          <Typography variant="caption">{t('filing.managed_email')}</Typography>
        </Box>
        <ArrowIcon color="action" />
        <Box textAlign="center">
          <CheckIcon color="success" />
          <Typography variant="caption">{t('filing.your_dashboard')}</Typography>
        </Box>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        Applicants send emails to your managed address → We process them automatically → 
        Applications appear in your dashboard
      </Typography>
    </Paper>
  );

  const renderTestingSection = () => {
    switch (testStatus) {
      case 'not_tested':
        return (
          <Paper sx={{ p: 3, border: '2px dashed', borderColor: 'divider' }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Test Your Email Setup
            </Typography>
            
            <List>
              <ListItem>
                <ListItemIcon>
                  <Typography color="primary">1.</Typography>
                </ListItemIcon>
                <ListItemText
                  primary="Send a test email to:"
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontFamily: 'monospace',
                          bgcolor: 'white',
                          p: 1,
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'divider'
                        }}
                      >
                        {emailConfig.managedEmail}
                      </Typography>
                      <IconButton 
                        size="small" 
                        onClick={() => handleCopy(emailConfig.managedEmail, 'email')}
                      >
                        {copied.email ? <CheckIcon color="success" /> : <CopyIcon />}
                      </IconButton>
                    </Box>
                  }
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <Typography color="primary">2.</Typography>
                </ListItemIcon>
                <ListItemText
                  primary="Use this exact subject line:"
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontFamily: 'monospace',
                          bgcolor: 'white',
                          p: 1,
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'divider'
                        }}
                      >
                        {testSubject}
                      </Typography>
                      <IconButton 
                        size="small" 
                        onClick={() => handleCopy(testSubject, 'subject')}
                      >
                        {copied.subject ? <CheckIcon color="success" /> : <CopyIcon />}
                      </IconButton>
                    </Box>
                  }
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <Typography color="primary">3.</Typography>
                </ListItemIcon>
                <ListItemText
                  primary="Click below to send the test email"
                />
              </ListItem>
            </List>
            
            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <Button
                variant="contained"
                startIcon={<SendIcon />}
                onClick={handleOpenEmailClient}
                fullWidth
              >
                Open Email & Send Test
              </Button>
              <Button
                variant="outlined"
                onClick={handleStartMonitoring}
                fullWidth
              >
                I've Sent It Manually
              </Button>
            </Box>
          </Paper>
        );
      
      case 'monitoring':
        return (
          <Paper sx={{ p: 3, border: '2px solid', borderColor: 'primary.main' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <CircularProgress size={24} />
              <Typography variant="subtitle1" fontWeight="bold">
                Monitoring for your test email...
              </Typography>
            </Box>
            
            <LinearProgress 
              variant="determinate" 
              value={(60 - timeRemaining) / 60 * 100}
              sx={{ mb: 2 }}
            />
            
            <Typography variant="body2" color="text.secondary">
              Checking every 5 seconds • {timeRemaining} seconds remaining
            </Typography>
            
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                We're monitoring {emailConfig.managedEmail} for your test email with subject: {testSubject}
              </Typography>
            </Alert>
            
            <Button
              variant="outlined"
              onClick={() => {
                setTestStatus('not_tested');
                onStopMonitoring();
              }}
              sx={{ mt: 2 }}
              fullWidth
            >
              Cancel Monitoring
            </Button>
          </Paper>
        );
      
      case 'success':
        return (
          <Paper sx={{ p: 3, border: '2px solid', borderColor: 'success.main', bgcolor: 'success.light' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <CheckIcon color="success" sx={{ fontSize: 32 }} />
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" color="success.dark">
                  Email forwarding verified and working!
                </Typography>
                <Typography variant="body2" color="success.dark">
                  Test email received at {testResult?.receivedAt || 'just now'}
                </Typography>
              </Box>
            </Box>
            
            <Alert severity="success" sx={{ mt: 2 }}>
              Your email setup is working correctly. Applications sent to {emailConfig.managedEmail} will 
              be automatically processed and appear in your dashboard.
            </Alert>
            
            <Button
              variant="outlined"
              color="success"
              startIcon={<RefreshIcon />}
              onClick={handleRetryTest}
              sx={{ mt: 2 }}
            >
              Send Another Test
            </Button>
          </Paper>
        );
      
      case 'timeout':
        return (
          <Paper sx={{ p: 3, border: '2px solid', borderColor: 'warning.main', bgcolor: 'warning.light' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <WarningIcon color="warning" sx={{ fontSize: 32 }} />
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" color="warning.dark">
                  Test email not received yet
                </Typography>
                <Typography variant="body2" color="warning.dark">
                  This might take a few minutes. You can continue and check later.
                </Typography>
              </Box>
            </Box>
            
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Email delivery can sometimes be delayed. You can:
              </Typography>
              <List dense>
                <ListItem>• Check your spam folder</ListItem>
                <ListItem>• Verify the email address is correct</ListItem>
                <ListItem>• Try sending another test email</ListItem>
                <ListItem>• Continue setup and test later in Messages</ListItem>
              </List>
            </Alert>
            
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button
                variant="contained"
                color="warning"
                startIcon={<RefreshIcon />}
                onClick={handleRetryTest}
                fullWidth
              >
                Retry Test
              </Button>
              <Button
                variant="outlined"
                onClick={() => onConfigChange({ ...emailConfig, testStatus: 'skipped' })}
                fullWidth
              >
                Skip & Continue
              </Button>
            </Box>
          </Paper>
        );
      
      default:
        return null;
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Email Forwarding Configuration
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Set up automatic email forwarding to receive tenant applications
      </Typography>

      {renderEmailFlowDiagram()}

      <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.light' }}>
        <Typography variant="subtitle2" gutterBottom>
          Your Managed Email Address
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
          <TextField
            fullWidth
            value={emailConfig.managedEmail}
            InputProps={{
              readOnly: true,
              sx: { 
                fontFamily: 'monospace',
                bgcolor: 'white',
                fontSize: '1.1rem'
              },
              endAdornment: (
                <IconButton onClick={() => handleCopy(emailConfig.managedEmail, 'email')}>
                  {copied.email ? <CheckIcon color="success" /> : <CopyIcon />}
                </IconButton>
              )
            }}
          />
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          This unique email address will receive all applications for this property
        </Typography>
      </Paper>

      {renderTestingSection()}

      <Divider sx={{ my: 3 }} />

      <Box>
        <FormControlLabel
          control={
            <Checkbox
              checked={emailConfig.forwardToPersonal}
              onChange={handlePersonalEmailChange}
            />
          }
          label={t("filing.also_forward_copies_to_my_personal_email")}
        />
        
        <Collapse in={emailConfig.forwardToPersonal}>
          <TextField
            fullWidth
            label={t("filing.your_personal_email")}
            value={emailConfig.personalEmail}
            onChange={handlePersonalEmailAddressChange}
            placeholder={t("filing.youremailexamplecom")}
            sx={{ mt: 2 }}
            helperText="You'll receive a copy of each application in your personal inbox"
          />
        </Collapse>
      </Box>

      {testStatus === 'success' && (
        <Alert severity="success" sx={{ mt: 3 }}>
          <Typography variant="body2" fontWeight="bold">
            ✅ Email setup complete! 
          </Typography>
          <Typography variant="body2">
            Next, we'll show you how to update your property listings on various portals.
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default EmailSetupStep;