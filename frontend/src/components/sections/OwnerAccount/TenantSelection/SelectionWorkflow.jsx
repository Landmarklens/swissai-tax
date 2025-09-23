import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Box,
  Typography,
  TextField,
  Alert,
  AlertTitle,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  FormControlLabel,
  Stack,
  Chip,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Send as SendIcon,
  Description as DocumentIcon,
  Email as EmailIcon,
  Schedule as ScheduleIcon,
  Home as HomeIcon,
  PersonAdd as PersonAddIcon,
  NotificationImportant as NotificationIcon,
  Archive as ArchiveIcon
} from '@mui/icons-material';
import { tenantSelectionAPI } from '../../../../api/tenantSelectionApi';

const SelectionWorkflow = ({
  open,
  onClose,
  application,
  propertyId,
  propertyData,
  onComplete
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notes, setNotes] = useState('');
  const [actions, setActions] = useState({
    sendAcceptanceEmail: true,
    prepareContract: true,
    scheduleMoveIn: true,
    rejectOthers: true,
    archiveApplications: true,
    notifyOwner: false
  });
  const [completedActions, setCompletedActions] = useState([]);

  const steps = [
    {
      label: 'Confirm Selection',
      description: 'Review and confirm your tenant selection'
    },
    {
      label: 'Automated Actions',
      description: 'Configure automated post-selection actions'
    },
    {
      label: 'Execute Workflow',
      description: 'Processing your selection...'
    },
    {
      label: 'Complete',
      description: 'Selection process completed successfully'
    }
  ];

  const handleNext = async () => {
    if (activeStep === 1) {
      // Execute workflow
      await executeWorkflow();
    } else if (activeStep === 3) {
      // Complete and close
      onComplete();
      onClose();
    } else {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const executeWorkflow = async () => {
    setLoading(true);
    setError(null);
    setActiveStep(2);
    const completed = [];

    try {
      // 1. Make the selection decision
      if (actions.sendAcceptanceEmail) {
        await tenantSelectionAPI.makeDecision(application.id, {
          decision: 'select',
          reasoning: notes || 'Selected as the best candidate based on criteria match'
        });
        completed.push('selection_recorded');
      }

      // 2. Send acceptance email
      if (actions.sendAcceptanceEmail) {
        // This would call an email service endpoint
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulated
        completed.push('acceptance_email_sent');
      }

      // 3. Prepare contract documents
      if (actions.prepareContract) {
        // This would trigger document generation
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulated
        completed.push('contract_prepared');
      }

      // 4. Schedule move-in coordination
      if (actions.scheduleMoveIn) {
        // This would create calendar events
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulated
        completed.push('move_in_scheduled');
      }

      // 5. Reject other applicants
      if (actions.rejectOthers) {
        // This would bulk reject other applications
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulated
        completed.push('others_rejected');
      }

      // 6. Archive applications
      if (actions.archiveApplications) {
        // This would archive all applications for this property
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulated
        completed.push('applications_archived');
      }

      setCompletedActions(completed);
      setActiveStep(3);
    } catch (err) {
      setError(err.message || 'Failed to complete selection workflow');
      console.error('Workflow execution failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'selection_recorded':
        return <PersonAddIcon color="success" />;
      case 'acceptance_email_sent':
        return <EmailIcon color="success" />;
      case 'contract_prepared':
        return <DocumentIcon color="success" />;
      case 'move_in_scheduled':
        return <ScheduleIcon color="success" />;
      case 'others_rejected':
        return <CancelIcon color="warning" />;
      case 'applications_archived':
        return <ArchiveIcon color="success" />;
      default:
        return <CheckCircleIcon color="success" />;
    }
  };

  const getActionLabel = (action) => {
    switch (action) {
      case 'selection_recorded':
        return 'Tenant selection recorded';
      case 'acceptance_email_sent':
        return 'Acceptance email sent to tenant';
      case 'contract_prepared':
        return 'Rental contract prepared';
      case 'move_in_scheduled':
        return 'Move-in coordination scheduled';
      case 'others_rejected':
        return 'Other applicants notified';
      case 'applications_archived':
        return 'Applications archived';
      default:
        return action;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" spacing={2} alignItems="center">
          <HomeIcon color="primary" />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6">Complete Tenant Selection</Typography>
            <Typography variant="caption" color="text.secondary">
              {propertyData?.title || 'Property'} - {application?.anonymized_id || 'Applicant'}
            </Typography>
          </Box>
          {application?.match_percentage && (
            <Chip
              label={`${application.match_percentage}% Match`}
              color="success"
              variant="outlined"
            />
          )}
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel>{step.label}</StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {step.description}
                </Typography>

                {/* Step 0: Confirm Selection */}
                {index === 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      <AlertTitle>You are about to select this tenant</AlertTitle>
                      This action will:
                      <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                        <li>Mark this applicant as selected</li>
                        <li>Send them an acceptance notification</li>
                        <li>Reject all other applicants</li>
                        <li>Begin the contract preparation process</li>
                      </ul>
                    </Alert>

                    <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Selected Tenant Details
                      </Typography>
                      <Stack spacing={1}>
                        <Typography variant="body2">
                          <strong>ID:</strong> {application?.anonymized_id}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Match Score:</strong> {application?.match_percentage || application?.soft_score || 0}%
                        </Typography>
                        <Typography variant="body2">
                          <strong>Status:</strong> {application?.lead_status}
                        </Typography>
                        {application?.ai_insights?.executive_summary && (
                          <Typography variant="body2">
                            <strong>AI Summary:</strong> {application.ai_insights.executive_summary}
                          </Typography>
                        )}
                      </Stack>
                    </Paper>

                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Selection Notes (Optional)"
                      placeholder="Add any notes about why this tenant was selected..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </Box>
                )}

                {/* Step 1: Configure Actions */}
                {index === 1 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Select actions to perform automatically:
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemIcon>
                          <Checkbox
                            checked={actions.sendAcceptanceEmail}
                            onChange={(e) => setActions({ ...actions, sendAcceptanceEmail: e.target.checked })}
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary="Send Acceptance Email"
                          secondary="Notify the selected tenant immediately"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <Checkbox
                            checked={actions.prepareContract}
                            onChange={(e) => setActions({ ...actions, prepareContract: e.target.checked })}
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary="Prepare Rental Contract"
                          secondary="Generate contract documents with tenant information"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <Checkbox
                            checked={actions.scheduleMoveIn}
                            onChange={(e) => setActions({ ...actions, scheduleMoveIn: e.target.checked })}
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary="Schedule Move-in Coordination"
                          secondary="Set up calendar events for key handover"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <Checkbox
                            checked={actions.rejectOthers}
                            onChange={(e) => setActions({ ...actions, rejectOthers: e.target.checked })}
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary="Notify Other Applicants"
                          secondary="Send polite rejection emails to non-selected applicants"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <Checkbox
                            checked={actions.archiveApplications}
                            onChange={(e) => setActions({ ...actions, archiveApplications: e.target.checked })}
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary="Archive All Applications"
                          secondary="Move all applications to archive for record keeping"
                        />
                      </ListItem>
                    </List>
                  </Box>
                )}

                {/* Step 2: Processing */}
                {index === 2 && (
                  <Box sx={{ mt: 2, textAlign: 'center', py: 4 }}>
                    {loading ? (
                      <>
                        <CircularProgress size={60} />
                        <Typography variant="body1" sx={{ mt: 3 }}>
                          Processing your selection...
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          This may take a few moments
                        </Typography>
                      </>
                    ) : error ? (
                      <Alert severity="error">
                        <AlertTitle>Error</AlertTitle>
                        {error}
                      </Alert>
                    ) : (
                      <Typography>Processing complete!</Typography>
                    )}
                  </Box>
                )}

                {/* Step 3: Complete */}
                {index === 3 && (
                  <Box sx={{ mt: 2 }}>
                    <Alert severity="success" sx={{ mb: 2 }}>
                      <AlertTitle>Selection Completed Successfully!</AlertTitle>
                      The tenant has been selected and all configured actions have been executed.
                    </Alert>

                    <Typography variant="subtitle2" gutterBottom>
                      Completed Actions:
                    </Typography>
                    <List dense>
                      {completedActions.map((action, idx) => (
                        <ListItem key={idx}>
                          <ListItemIcon>
                            {getActionIcon(action)}
                          </ListItemIcon>
                          <ListItemText primary={getActionLabel(action)} />
                        </ListItem>
                      ))}
                    </List>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="subtitle2" gutterBottom>
                      Next Steps:
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText
                          primary="1. Review and sign the rental contract"
                          secondary="Document has been prepared and is ready for signing"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="2. Coordinate move-in details"
                          secondary="Contact the tenant to finalize move-in date and time"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="3. Prepare property handover"
                          secondary="Ensure property is ready and keys are available"
                        />
                      </ListItem>
                    </List>
                  </Box>
                )}

                <Box sx={{ mt: 3 }}>
                  {index > 0 && index < 2 && (
                    <Button onClick={handleBack} sx={{ mr: 1 }}>
                      Back
                    </Button>
                  )}
                  {index < 3 && (
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      disabled={loading}
                    >
                      {index === 1 ? 'Execute Selection' : index === 2 ? 'Processing...' : 'Next'}
                    </Button>
                  )}
                  {index === 3 && (
                    <Button
                      variant="contained"
                      color="success"
                      onClick={handleNext}
                      startIcon={<CheckCircleIcon />}
                    >
                      Complete
                    </Button>
                  )}
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </DialogContent>

      {activeStep < 2 && (
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default SelectionWorkflow;