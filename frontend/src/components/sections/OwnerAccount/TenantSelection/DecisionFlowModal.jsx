import React, { useState, useEffect } from 'react';
import SelectionWorkflow from './SelectionWorkflow';
import logger from '../../../../services/enhancedLoggingService';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  Alert,
  AlertTitle,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Chip,
  CircularProgress,
  IconButton
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
  Lock as LockIcon,
  LockOpen as UnlockIcon,
  Send as SendIcon,
  Close as CloseIcon,
  ThumbUp as AcceptIcon,
  ThumbDown as RejectIcon,
  Visibility as ViewIcon,
  VisibilityOff as HideIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { tenantSelectionAPI } from '../../../../api/tenantSelectionApi';

const DecisionFlowModal = ({
  open,
  onClose,
  application,
  propertyId,
  propertyData,
  onComplete
}) => {
  const { t } = useTranslation();
  const [activeStep, setActiveStep] = useState(0);

  // Log modal open/close
  useEffect(() => {
    if (open) {
      logger.logComponentMount('DecisionFlowModal', {
        applicationId: application?.id,
        propertyId,
        hasPropertyData: !!propertyData
      });
    }
    return () => {
      if (open) {
        logger.logComponentUnmount('DecisionFlowModal');
      }
    };
  }, [open, application?.id, propertyId]);
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [decision, setDecision] = useState(''); // 'select' or 'reject'
  const [rejectionReason, setRejectionReason] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [sendNotifications, setSendNotifications] = useState(true);
  const [identityRevealed, setIdentityRevealed] = useState(false);
  const [revealedData, setRevealedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const steps = [
    'Make Decision',
    'Confirm Identity Reveal',
    'Review & Confirm',
    'Send Notifications'
  ];
  
  const handleNext = async () => {
    logger.debug('DECISION_FLOW', 'Moving to next step', {
      currentStep: activeStep,
      decision,
      applicationId: application?.id
    });

    if (activeStep === 0) {
      // Decision made, move to identity reveal
      if (!decision) {
        logger.warn('DECISION_FLOW', 'No decision selected', {
          applicationId: application?.id
        });
        setError('Please select a decision');
        return;
      }
      if (decision === 'reject' && !rejectionReason) {
        logger.warn('DECISION_FLOW', 'Rejection reason missing', {
          applicationId: application?.id
        });
        setError('Please provide a reason for rejection');
        return;
      }
      setError(null);
      setActiveStep(1);
    } else if (activeStep === 1) {
      // Reveal identity
      if (decision === 'select' && !identityRevealed) {
        await handleRevealIdentity();
      } else {
        setActiveStep(2);
      }
    } else if (activeStep === 2) {
      // Confirm decision
      setActiveStep(3);
      await handleFinalizeDecision();
    }
  };
  
  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
    setError(null);
  };
  
  const handleRevealIdentity = async () => {
    logger.info('IDENTITY_REVEAL', 'Attempting to reveal tenant identity', {
      applicationId: application.id,
      propertyId
    });

    setLoading(true);
    setError(null);
    const startTime = Date.now();

    try {
      const response = await tenantSelectionAPI.revealIdentity(application.id);
      const duration = Date.now() - startTime;

      logger.logApiCall('POST', `/api/tenant-selection/reveal-identity/${application.id}`,
        { applicationId: application.id },
        { status: 200, data: response.data },
        duration
      );

      setRevealedData(response.data);
      setIdentityRevealed(true);
      setActiveStep(2);

      logger.info('IDENTITY_REVEAL', 'Identity revealed successfully', {
        applicationId: application.id,
        revealedName: response.data?.name
      });
    } catch (err) {
      const duration = Date.now() - startTime;
      logger.error('IDENTITY_REVEAL', 'Failed to reveal identity', {
        applicationId: application.id,
        error: err.message,
        duration
      });

      setError('Failed to reveal identity. Please try again.');
      console.error('Identity reveal error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleFinalizeDecision = async () => {
    logger.info('DECISION_FINALIZE', 'Finalizing tenant decision', {
      applicationId: application.id,
      propertyId,
      decision,
      sendNotifications
    });

    setLoading(true);
    setError(null);
    const startTime = Date.now();

    try {
      // Make the decision
      const decisionData = {
        decision: decision === 'select' ? 'select' : 'reject',
        reason: decision === 'reject' ? rejectionReason : 'Selected as tenant',
        send_notification: sendNotifications,
        custom_message: customMessage
      };

      logger.debug('DECISION_FINALIZE', 'Sending decision data', decisionData);

      await tenantSelectionAPI.makeDecision(application.id, decisionData);
      const duration = Date.now() - startTime;

      logger.logApiCall('POST', `/api/tenant-selection/decision/${application.id}`,
        decisionData,
        { status: 200 },
        duration
      );

      logger.info('DECISION_FINALIZE', 'Decision finalized successfully', {
        applicationId: application.id,
        decision,
        notificationsSent: sendNotifications,
        duration
      });

      // If selecting, also reject all other applicants for this property
      if (decision === 'select' && sendNotifications) {
        logger.info('DECISION_FINALIZE', 'Auto-rejecting other applicants', {
          propertyId
        });
        // This would be handled by the backend automatically
      }

      // Success - trigger completion callback
      setTimeout(() => {
        logger.debug('DECISION_FINALIZE', 'Triggering completion callback');
        onComplete();
      }, 2000);
    } catch (err) {
      const duration = Date.now() - startTime;
      logger.error('DECISION_FINALIZE', 'Failed to finalize decision', {
        applicationId: application.id,
        error: err.message,
        duration,
        decision
      });

      setError('Failed to finalize decision. Please try again.');
      console.error('Decision error:', err);
      setActiveStep(2);
    } finally {
      setLoading(false);
    }
  };
  
  const getDecisionColor = () => {
    return decision === 'select' ? 'success' : decision === 'reject' ? 'error' : 'default';
  };
  
  const getDecisionIcon = () => {
    return decision === 'select' ? <AcceptIcon /> : decision === 'reject' ? <RejectIcon /> : null;
  };
  
  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        disableEscapeKeyDown={activeStep > 0}
      >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">
            Decision for {application?.anonymized_id || 'Applicant'}
          </Typography>
          <IconButton onClick={onClose} disabled={loading}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Stepper activeStep={activeStep} orientation="vertical">
          {/* Step 1: Make Decision */}
          <Step>
            <StepLabel>
              {steps[0]}
            </StepLabel>
            <StepContent>
              <Box sx={{ mb: 3 }}>
                <FormControl component="fieldset">
                  <RadioGroup
                    value={decision}
                    onChange={(e) => {
                      const newDecision = e.target.value;
                      logger.logUserAction('decision_selected', 'DecisionFlowModal', {
                        applicationId: application?.id,
                        decision: newDecision
                      });
                      setDecision(newDecision);
                    }}
                  >
                    <Paper sx={{ p: 2, mb: 2, border: decision === 'select' ? '2px solid' : '1px solid', borderColor: decision === 'select' ? 'success.main' : 'divider' }}>
                      <FormControlLabel
                        value="select"
                        control={<Radio color="success" />}
                        label={
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              Select this Applicant
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Choose this applicant as your tenant. Their identity will be revealed and they will receive a confirmation email.
                            </Typography>
                          </Box>
                        }
                      />
                    </Paper>
                    
                    <Paper sx={{ p: 2, border: decision === 'reject' ? '2px solid' : '1px solid', borderColor: decision === 'reject' ? 'error.main' : 'divider' }}>
                      <FormControlLabel
                        value="reject"
                        control={<Radio color="error" />}
                        label={
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              Reject this Applicant
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Decline this application. The applicant will receive a polite rejection email.
                            </Typography>
                          </Box>
                        }
                      />
                    </Paper>
                  </RadioGroup>
                </FormControl>
                
                {decision === 'reject' && (
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Rejection Reason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a reason for rejection..."
                    sx={{ mt: 2 }}
                    required
                  />
                )}
                
                {error && activeStep === 0 && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                  </Alert>
                )}
              </Box>
            </StepContent>
          </Step>
          
          {/* Step 2: Identity Reveal */}
          <Step>
            <StepLabel>
              {steps[1]}
            </StepLabel>
            <StepContent>
              {decision === 'select' ? (
                <Box>
                  {!identityRevealed ? (
                    <Paper sx={{ p: 3, bgcolor: 'warning.lighter', mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <LockIcon color="warning" />
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          Identity Protection Notice
                        </Typography>
                      </Box>
                      <Typography variant="body2" paragraph>
                        You are about to reveal the personal information of this applicant. This action cannot be undone.
                      </Typography>
                      <Typography variant="body2" paragraph>
                        By revealing the identity, you confirm your intention to select this applicant as your tenant.
                      </Typography>
                      <Alert severity="info" sx={{ mt: 2 }}>
                        <AlertTitle>What happens next?</AlertTitle>
                        <List dense>
                          <ListItem>
                            <ListItemText primary="• The applicant's full name and contact details will be shown" />
                          </ListItem>
                          <ListItem>
                            <ListItemText primary="• A confirmation email will be sent to the selected applicant" />
                          </ListItem>
                          <ListItem>
                            <ListItemText primary="• All other applicants will receive rejection emails" />
                          </ListItem>
                        </List>
                      </Alert>
                    </Paper>
                  ) : (
                    <Paper sx={{ p: 3, bgcolor: 'success.lighter', mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <UnlockIcon color="success" />
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          Identity Revealed
                        </Typography>
                      </Box>
                      <List>
                        <ListItem>
                          <ListItemIcon>
                            <PersonIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary="Full Name"
                            secondary={revealedData?.name || application.name || 'John Smith'}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <EmailIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary="Email"
                            secondary={revealedData?.email || application.email}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <PhoneIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary="Phone"
                            secondary={revealedData?.phone || application.phone || 'Not provided'}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <HomeIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary="Current Address"
                            secondary={revealedData?.current_address || 'Not provided'}
                          />
                        </ListItem>
                      </List>
                    </Paper>
                  )}
                </Box>
              ) : (
                <Alert severity="info">
                  Identity will not be revealed for rejected applicants.
                </Alert>
              )}
              
              {error && activeStep === 1 && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
            </StepContent>
          </Step>
          
          {/* Step 3: Review & Confirm */}
          <Step>
            <StepLabel>
              {steps[2]}
            </StepLabel>
            <StepContent>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                  Decision Summary
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Chip
                    icon={getDecisionIcon()}
                    label={decision === 'select' ? 'SELECTING' : 'REJECTING'}
                    color={getDecisionColor()}
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
                
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Applicant"
                      secondary={identityRevealed ? revealedData?.name || application.name : application.anonymized_id}
                    />
                  </ListItem>
                  {decision === 'reject' && (
                    <ListItem>
                      <ListItemText
                        primary="Reason"
                        secondary={rejectionReason}
                      />
                    </ListItem>
                  )}
                </List>
                
                <Divider sx={{ my: 2 }} />
                
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={sendNotifications}
                      onChange={(e) => setSendNotifications(e.target.checked)}
                    />
                  }
                  label="Send email notifications"
                />
                
                {sendNotifications && (
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Custom Message (Optional)"
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Add a personal message to the email..."
                    sx={{ mt: 2 }}
                  />
                )}
              </Paper>
              
              <Alert severity="warning">
                <AlertTitle>Final Confirmation</AlertTitle>
                This action cannot be undone. Please review your decision carefully.
              </Alert>
              
              {error && activeStep === 2 && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
            </StepContent>
          </Step>
          
          {/* Step 4: Send Notifications */}
          <Step>
            <StepLabel>
              {steps[3]}
            </StepLabel>
            <StepContent>
              {loading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                  <CircularProgress sx={{ mb: 2 }} />
                  <Typography>Processing decision...</Typography>
                </Box>
              ) : (
                <Paper sx={{ p: 3, bgcolor: 'success.lighter' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <CheckIcon color="success" sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Decision Completed Successfully!
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {decision === 'select' 
                          ? 'The applicant has been selected and notified.'
                          : 'The application has been rejected.'}
                      </Typography>
                    </Box>
                  </Box>
                  
                  {sendNotifications && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      <AlertTitle>Notifications Sent</AlertTitle>
                      {decision === 'select' ? (
                        <List dense>
                          <ListItem>
                            <ListItemText primary="✓ Confirmation email sent to selected applicant" />
                          </ListItem>
                          <ListItem>
                            <ListItemText primary="✓ Rejection emails sent to other applicants" />
                          </ListItem>
                        </List>
                      ) : (
                        <ListItem>
                          <ListItemText primary="✓ Rejection email sent to applicant" />
                        </ListItem>
                      )}
                    </Alert>
                  )}
                </Paper>
              )}
            </StepContent>
          </Step>
        </Stepper>
      </DialogContent>
      
      <DialogActions sx={{ p: 3 }}>
        {activeStep < 3 && (
          <>
            <Button onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            {activeStep > 0 && (
              <Button onClick={handleBack} disabled={loading}>
                Back
              </Button>
            )}
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={loading || (activeStep === 0 && !decision)}
              color={activeStep === 1 && decision === 'select' ? 'warning' : 'primary'}
              startIcon={loading ? <CircularProgress size={20} /> : activeStep === 1 && decision === 'select' && !identityRevealed ? <UnlockIcon /> : null}
            >
              {activeStep === 0 ? 'Next' :
               activeStep === 1 && decision === 'select' && !identityRevealed ? 'Reveal Identity & Continue' :
               activeStep === 1 ? 'Continue' :
               activeStep === 2 ? 'Confirm Decision' : 'Finish'}
            </Button>
          </>
        )}
        {activeStep === 3 && !loading && (
          <Button variant="contained" onClick={onComplete}>
            Close
          </Button>
        )}
      </DialogActions>
      </Dialog>

      {/* Selection Workflow for accepting tenants */}
      {showWorkflow && (
        <SelectionWorkflow
        open={showWorkflow}
        onClose={() => {
          setShowWorkflow(false);
          onClose();
        }}
        application={application}
        propertyId={propertyId}
        propertyData={propertyData}
        onComplete={() => {
          setShowWorkflow(false);
          onComplete();
        }}
        />
      )}
    </>
  );
};

export default DecisionFlowModal;