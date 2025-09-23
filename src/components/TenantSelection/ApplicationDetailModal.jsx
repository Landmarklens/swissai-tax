import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Chip,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Avatar,
  Badge,
  Tooltip,
  Card,
  CardContent,
  LinearProgress,
  Stack
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Work as WorkIcon,
  Euro as EuroIcon,
  Home as HomeIcon,
  Pets as PetsIcon,
  SmokeFree as SmokeFreeIcon,
  AttachFile as AttachFileIcon,
  Description as DescriptionIcon,
  Psychology as PsychologyIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Message as MessageIcon,
  CalendarMonth as CalendarIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import DocumentViewer from './DocumentViewer';
import { 
  selectTenant,
  rejectApplicant,
  scheduleViewing,
  sendMessage,
  generateAICard,
  processDocuments
} from '../../store/slices/tenantSelectionSlice';

const TabPanel = ({ children, value, index, ...other }) => (
  <div role="tabpanel" hidden={value !== index} {...other}>
    {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
  </div>
);

const ApplicationDetailModal = ({ open, onClose, application }) => {
  const dispatch = useDispatch();
  const [tabValue, setTabValue] = useState(0);
  const [showIdentity, setShowIdentity] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  
  const { documentProcessing, loading } = useSelector(state => state.tenantSelection);

  useEffect(() => {
    if (application?.id && application?.documents_processed && !documentProcessing[application.id]) {
      // Fetch document processing results if available
      dispatch(processDocuments({ leadId: application.id }));
    }
  }, [application, dispatch]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSelectTenant = async () => {
    setIsProcessing(true);
    try {
      await dispatch(selectTenant({
        propertyId: application.property_id,
        leadId: application.id
      })).unwrap();
      setActionMessage('Tenant selected successfully! Notification emails have been sent.');
      setTimeout(onClose, 3000);
    } catch (error) {
      setActionMessage(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectApplicant = async () => {
    setIsProcessing(true);
    try {
      await dispatch(rejectApplicant({
        leadId: application.id,
        reason: 'Does not meet criteria'
      })).unwrap();
      setActionMessage('Applicant rejected. Notification sent.');
      setTimeout(onClose, 2000);
    } catch (error) {
      setActionMessage(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateAICard = async () => {
    setIsProcessing(true);
    try {
      await dispatch(generateAICard(application.id)).unwrap();
      setActionMessage('AI card generated successfully with GPT-5!');
    } catch (error) {
      setActionMessage(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const getApplicationSteps = () => {
    const steps = [
      { label: 'Application Received', completed: true },
      { label: 'Viewing Scheduled', completed: !!application?.viewing_slot_id },
      { label: 'Viewing Attended', completed: application?.lead_status === 'viewing_attended' || application?.lead_status === 'dossier_submitted' },
      { label: 'Documents Submitted', completed: application?.lead_status === 'dossier_submitted' },
      { label: 'Decision Made', completed: ['selected', 'rejected'].includes(application?.lead_status) }
    ];
    
    const activeStep = steps.findIndex(step => !step.completed);
    return { steps, activeStep: activeStep === -1 ? steps.length : activeStep };
  };

  if (!application) return null;

  const { steps, activeStep } = getApplicationSteps();

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{ sx: { height: '90vh' } }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ width: 48, height: 48 }}>
              <PersonIcon />
            </Avatar>
            <Box>
              <Typography variant="h6">
                {showIdentity ? application.name : application.anonymized_id || `APP-${application.id.slice(0, 8)}`}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                <Chip 
                  label={application.lead_status.replace('_', ' ').toUpperCase()} 
                  size="small"
                  color="primary"
                />
                {application.source_portal && (
                  <Chip 
                    label={application.source_portal}
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title={showIdentity ? "Hide Identity" : "Reveal Identity"}>
              <IconButton onClick={() => setShowIdentity(!showIdentity)}>
                <VisibilityIcon />
              </IconButton>
            </Tooltip>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        {actionMessage && (
          <Alert severity={actionMessage.includes('Error') ? 'error' : 'success'} sx={{ mb: 2 }}>
            {actionMessage}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((step) => (
              <Step key={step.label} completed={step.completed}>
                <StepLabel>{step.label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Overview" />
          <Tab label="AI Analysis" icon={<Badge badgeContent="GPT-5" color="primary"><PsychologyIcon /></Badge>} />
          <Tab label="Documents" icon={<Badge badgeContent={application.document_count || 0} color="primary"><AttachFileIcon /></Badge>} />
          <Tab label="Communication" />
          <Tab label="Viewing" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Contact Information
                </Typography>
                {showIdentity ? (
                  <List dense>
                    <ListItem>
                      <ListItemIcon><PersonIcon /></ListItemIcon>
                      <ListItemText primary="Name" secondary={application.name || 'Not provided'} />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><EmailIcon /></ListItemIcon>
                      <ListItemText primary="Email" secondary={application.email} />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><PhoneIcon /></ListItemIcon>
                      <ListItemText primary="Phone" secondary={application.phone || 'Not provided'} />
                    </ListItem>
                  </List>
                ) : (
                  <Alert severity="info">
                    Identity information is hidden. Click the eye icon to reveal.
                  </Alert>
                )}
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Application Details
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="Applied" 
                      secondary={format(new Date(application.created_at), 'PPpp')} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Source Portal" 
                      secondary={application.source_portal || 'Direct'} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Auto Allocated" 
                      secondary={application.auto_allocated ? 'Yes (AI)' : 'No'} 
                    />
                  </ListItem>
                </List>
              </Paper>
            </Grid>

            {application.dossier_data && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Submitted Information
                  </Typography>
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    {Object.entries(application.dossier_data).map(([key, value]) => (
                      <Grid item xs={6} md={4} key={key}>
                        <Typography variant="body2" color="text.secondary">
                          {key.replace('_', ' ').toUpperCase()}
                        </Typography>
                        <Typography variant="body1">
                          {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}
                        </Typography>
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              </Grid>
            )}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {application.ai_card_data ? (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        AI Analysis (GPT-5)
                      </Typography>
                      <Chip 
                        label={`Generated ${format(new Date(application.card_generated_at), 'PP')}`}
                        size="small"
                      />
                    </Box>

                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Scoring Results
                        </Typography>
                        <Stack spacing={2}>
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Typography variant="body2">Hard Criteria</Typography>
                              {application.ai_card_data.scores.hard_filter_passed ? (
                                <Chip icon={<CheckCircleIcon />} label="Passed" size="small" color="success" />
                              ) : (
                                <Chip icon={<WarningIcon />} label="Failed" size="small" color="error" />
                              )}
                            </Box>
                          </Box>
                          <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2">Soft Score</Typography>
                              <Typography variant="body2" fontWeight="bold">
                                {application.ai_card_data.scores.soft_score}%
                              </Typography>
                            </Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={application.ai_card_data.scores.soft_score}
                              sx={{ height: 8, borderRadius: 1 }}
                              color={application.ai_card_data.scores.soft_score >= 70 ? 'success' : 'warning'}
                            />
                          </Box>
                        </Stack>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Key Insights
                        </Typography>
                        {application.ai_card_data.insights && (
                          <List dense>
                            {application.ai_card_data.insights.map((insight, index) => (
                              <ListItem key={index}>
                                <ListItemIcon>
                                  <CheckCircleIcon color="primary" fontSize="small" />
                                </ListItemIcon>
                                <ListItemText primary={insight} />
                              </ListItem>
                            ))}
                          </List>
                        )}
                      </Grid>

                      {application.ai_card_data.summary && (
                        <Grid item xs={12}>
                          <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                            <Typography variant="subtitle2" gutterBottom>
                              AI Summary
                            </Typography>
                            <Typography variant="body2">
                              {application.ai_card_data.summary}
                            </Typography>
                          </Paper>
                        </Grid>
                      )}

                      {application.ai_card_data.recommendations && (
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            AI Recommendations
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {application.ai_card_data.recommendations.map((rec, index) => (
                              <Chip key={index} label={rec} variant="outlined" />
                            ))}
                          </Box>
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <PsychologyIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No AI Analysis Available
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Generate an AI card to get GPT-5 powered insights about this applicant.
              </Typography>
              <Button
                variant="contained"
                onClick={handleGenerateAICard}
                disabled={isProcessing}
                startIcon={isProcessing ? <CircularProgress size={20} /> : <PsychologyIcon />}
              >
                {isProcessing ? 'Generating...' : 'Generate AI Card with GPT-5'}
              </Button>
            </Box>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {application.documents_processed ? (
            <DocumentViewer 
              leadId={application.id}
              documents={documentProcessing[application.id]?.documents || []}
              extractedData={documentProcessing[application.id]?.extractedData}
              onRefresh={() => dispatch(processDocuments({ leadId: application.id }))}
            />
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <AttachFileIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No Documents Submitted
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Documents will appear here once the applicant submits them.
              </Typography>
            </Box>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Communication History
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Email communications and messages will be displayed here.
            </Typography>
            {/* TODO: Implement communication history */}
          </Paper>
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          {application.viewing_slot_id ? (
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Viewing Information
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon><CalendarIcon /></ListItemIcon>
                  <ListItemText 
                    primary="Scheduled Date" 
                    secondary={application.viewing_datetime ? format(new Date(application.viewing_datetime), 'PPpp') : 'Not specified'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><ScheduleIcon /></ListItemIcon>
                  <ListItemText 
                    primary="Status" 
                    secondary={application.viewing_attended ? 'Attended' : 'Scheduled'}
                  />
                </ListItem>
              </List>
            </Paper>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CalendarIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No Viewing Scheduled
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                This applicant hasn't been scheduled for a viewing yet.
              </Typography>
              <Button variant="contained" onClick={() => {/* TODO: Implement viewing scheduling */}}>
                Schedule Viewing
              </Button>
            </Box>
          )}
        </TabPanel>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, width: '100%', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {application.lead_status === 'dossier_submitted' && (
              <>
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleRejectApplicant}
                  disabled={isProcessing}
                  startIcon={<ThumbDownIcon />}
                >
                  Reject
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleSelectTenant}
                  disabled={isProcessing}
                  startIcon={<ThumbUpIcon />}
                >
                  Select as Tenant
                </Button>
              </>
            )}
          </Box>
          <Button onClick={onClose}>Close</Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default ApplicationDetailModal;