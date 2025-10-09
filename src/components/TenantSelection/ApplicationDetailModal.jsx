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
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      setActionMessage(t('modal.application_detail.tenant_selected_success'));
      setTimeout(onClose, 3000);
    } catch (error) {
      setActionMessage(`${t('modal.application_detail.error')}: ${error.message}`);
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
      setActionMessage(t('modal.application_detail.applicant_rejected'));
      setTimeout(onClose, 2000);
    } catch (error) {
      setActionMessage(`${t('modal.application_detail.error')}: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateAICard = async () => {
    setIsProcessing(true);
    try {
      await dispatch(generateAICard(application.id)).unwrap();
      setActionMessage(t('modal.application_detail.ai_card_generated'));
    } catch (error) {
      setActionMessage(`${t('modal.application_detail.error')}: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const getApplicationSteps = () => {
    const steps = [
      { label: t('modal.application_detail.application_received'), completed: true },
      { label: t('modal.application_detail.viewing_scheduled'), completed: !!application?.viewing_slot_id },
      { label: t('modal.application_detail.viewing_attended'), completed: application?.lead_status === 'viewing_attended' || application?.lead_status === 'dossier_submitted' },
      { label: t('modal.application_detail.documents_submitted'), completed: application?.lead_status === 'dossier_submitted' },
      { label: t('modal.application_detail.decision_made'), completed: ['selected', 'rejected'].includes(application?.lead_status) }
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
            <Tooltip title={showIdentity ? t('modal.application_detail.hide_identity') : t('modal.application_detail.reveal_identity')}>
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
          <Alert severity={actionMessage.includes(t('modal.application_detail.error')) ? 'error' : 'success'} sx={{ mb: 2 }}>
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
          <Tab label={t("filing.overview")} />
          <Tab label={t("filing.ai_analysis")} icon={<Badge badgeContent="GPT-5" color="primary"><PsychologyIcon /></Badge>} />
          <Tab label={t("filing.documents")} icon={<Badge badgeContent={application.document_count || 0} color="primary"><AttachFileIcon /></Badge>} />
          <Tab label={t("filing.communication")} />
          <Tab label={t("filing.viewing")} />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  {t('modal.application_detail.contact_information')}
                </Typography>
                {showIdentity ? (
                  <List dense>
                    <ListItem>
                      <ListItemIcon><PersonIcon /></ListItemIcon>
                      <ListItemText primary={t('modal.application_detail.name')} secondary={application.name || t('modal.application_detail.not_provided')} />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><EmailIcon /></ListItemIcon>
                      <ListItemText primary={t('modal.application_detail.email')} secondary={application.email} />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><PhoneIcon /></ListItemIcon>
                      <ListItemText primary={t('modal.application_detail.phone')} secondary={application.phone || t('modal.application_detail.not_provided')} />
                    </ListItem>
                  </List>
                ) : (
                  <Alert severity="info">
                    {t('modal.application_detail.identity_hidden')}
                  </Alert>
                )}
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  {t('modal.application_detail.application_details')}
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary={t('modal.application_detail.applied')}
                      secondary={format(new Date(application.created_at), 'PPpp')}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary={t('modal.application_detail.source_portal')}
                      secondary={application.source_portal || t('modal.application_detail.direct')}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary={t('modal.application_detail.auto_allocated')}
                      secondary={application.auto_allocated ? t('modal.application_detail.yes_ai') : t('modal.application_detail.no')}
                    />
                  </ListItem>
                </List>
              </Paper>
            </Grid>

            {application.dossier_data && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    {t('modal.application_detail.submitted_information')}
                  </Typography>
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    {Object.entries(application.dossier_data).map(([key, value]) => (
                      <Grid item xs={6} md={4} key={key}>
                        <Typography variant="body2" color="text.secondary">
                          {key.replace('_', ' ').toUpperCase()}
                        </Typography>
                        <Typography variant="body1">
                          {typeof value === 'boolean' ? (value ? t('modal.application_detail.yes') : t('modal.application_detail.no')) : value}
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
                        {t('modal.application_detail.ai_analysis_gpt5')}
                      </Typography>
                      <Chip
                        label={`${t('modal.application_detail.generated')} ${format(new Date(application.card_generated_at), 'PP')}`}
                        size="small"
                      />
                    </Box>

                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          {t('modal.application_detail.scoring_results')}
                        </Typography>
                        <Stack spacing={2}>
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Typography variant="body2">{t('filing.hard_criteria')}</Typography>
                              {application.ai_card_data.scores.hard_filter_passed ? (
                                <Chip icon={<CheckCircleIcon />} label={t("filing.passed")} size="small" color="success" />
                              ) : (
                                <Chip icon={<WarningIcon />} label={t("filing.failed")} size="small" color="error" />
                              )}
                            </Box>
                          </Box>
                          <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2">{t('filing.soft_score')}</Typography>
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
                          {t('modal.application_detail.key_insights')}
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
                              {t('modal.application_detail.ai_summary')}
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
                            {t('modal.application_detail.ai_recommendations')}
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
                {t('modal.application_detail.no_ai_analysis')}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {t('modal.application_detail.generate_ai_card_description')}
              </Typography>
              <Button
                variant="contained"
                onClick={handleGenerateAICard}
                disabled={isProcessing}
                startIcon={isProcessing ? <CircularProgress size={20} /> : <PsychologyIcon />}
              >
                {isProcessing ? t('modal.application_detail.generating') : t('modal.application_detail.generate_ai_card')}
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
                {t('modal.application_detail.no_documents_submitted')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('modal.application_detail.documents_description')}
              </Typography>
            </Box>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {t('modal.application_detail.communication_history')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('modal.application_detail.communication_description')}
            </Typography>
            {/* TODO: Implement communication history */}
          </Paper>
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          {application.viewing_slot_id ? (
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                {t('modal.application_detail.viewing_information')}
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon><CalendarIcon /></ListItemIcon>
                  <ListItemText
                    primary={t('modal.application_detail.scheduled_date')}
                    secondary={application.viewing_datetime ? format(new Date(application.viewing_datetime), 'PPpp') : t('modal.application_detail.not_specified')}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><ScheduleIcon /></ListItemIcon>
                  <ListItemText
                    primary={t('modal.application_detail.status')}
                    secondary={application.viewing_attended ? t('modal.application_detail.attended') : t('modal.application_detail.scheduled')}
                  />
                </ListItem>
              </List>
            </Paper>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CalendarIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                {t('modal.application_detail.no_viewing_scheduled')}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {t('modal.application_detail.no_viewing_description')}
              </Typography>
              <Button variant="contained" onClick={() => {/* TODO: Implement viewing scheduling */}}>
                {t('modal.application_detail.schedule_viewing')}
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
                  {t('modal.application_detail.reject')}
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleSelectTenant}
                  disabled={isProcessing}
                  startIcon={<ThumbUpIcon />}
                >
                  {t('modal.application_detail.select_as_tenant')}
                </Button>
              </>
            )}
          </Box>
          <Button onClick={onClose}>{t('filing.close')}</Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default ApplicationDetailModal;