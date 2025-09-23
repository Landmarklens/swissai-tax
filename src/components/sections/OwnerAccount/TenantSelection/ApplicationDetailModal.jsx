import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Tabs,
  Tab,
  Button,
  IconButton,
  Paper,
  Grid,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  LinearProgress,
  Alert,
  Stack,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Tooltip,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  TextField
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  Assignment as DocumentIcon,
  Email as EmailIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  AttachMoney as IncomeIcon,
  Work as WorkIcon,
  Home as HomeIcon,
  Groups as FamilyIcon,
  Pets as PetsIcon,
  SmokeFree as SmokingIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Star as StarIcon,
  Schedule as ScheduleIcon,
  EventAvailable as AttendedIcon,
  Description as FileIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Lock as LockIcon,
  LockOpen as UnlockIcon,
  Warning as WarningIcon,
  Message as MessageIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchLeadDetails, 
  updateLeadStatus,
  makeDecision,
  selectLeadById 
} from '../../../../store/slices/tenantSelectionSlice';

const ApplicationDetailModal = ({ open, onClose, leadId }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState(0);
  const [decisionNotes, setDecisionNotes] = useState('');
  const [loading, setLoading] = useState(false);
  
  const lead = useSelector(state => selectLeadById(state, leadId));

  useEffect(() => {
    if (open && leadId) {
      setLoading(true);
      dispatch(fetchLeadDetails(leadId)).finally(() => setLoading(false));
    }
  }, [open, leadId, dispatch]);

  if (!lead) {
    return null;
  }

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleAccept = async () => {
    await dispatch(makeDecision({
      leadId: lead.id,
      decision: 'accept',
      reasoning: decisionNotes || 'Manually accepted by landlord'
    }));
    onClose();
  };

  const handleReject = async () => {
    await dispatch(makeDecision({
      leadId: lead.id,
      decision: 'reject',
      reasoning: decisionNotes || 'Manually rejected by landlord'
    }));
    onClose();
  };

  const handleScheduleViewing = () => {
    // TODO: Open viewing scheduler
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      'viewing_requested': { color: 'info', label: t('Viewing Requested'), icon: <ScheduleIcon /> },
      'viewing_scheduled': { color: 'primary', label: t('Viewing Scheduled'), icon: <ScheduleIcon /> },
      'viewing_attended': { color: 'secondary', label: t('Viewing Attended'), icon: <CheckIcon /> },
      'dossier_requested': { color: 'warning', label: t('Dossier Requested'), icon: <DocumentIcon /> },
      'dossier_submitted': { color: 'default', label: t('Dossier Submitted'), icon: <DocumentIcon /> },
      'qualified': { color: 'success', label: t('Qualified'), icon: <CheckIcon /> },
      'selected': { color: 'success', label: t('Selected'), icon: <StarIcon /> },
      'rejected': { color: 'error', label: t('Rejected'), icon: <CancelIcon /> }
    };
    return statusMap[status] || { color: 'default', label: status, icon: <WarningIcon /> };
  };

  const statusInfo = getStatusInfo(lead.status);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: '80vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}>
              {lead.name ? lead.name.split(' ').map(n => n[0]).join('').toUpperCase() : '?'}
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {lead.name || t('Anonymous Applicant')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                <Chip 
                  label={statusInfo.label} 
                  color={statusInfo.color} 
                  size="small" 
                  icon={statusInfo.icon}
                />
                <Chip 
                  label={`${t('Score')}: ${lead.score}`} 
                  color={getScoreColor(lead.score)} 
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
              </Box>
            </Box>
          </Box>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      {loading && <LinearProgress />}

      <DialogContent>
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
          <Tab label={t('Overview')} />
          <Tab label={t('AI Analysis')} />
          <Tab label={t('Documents')} />
          <Tab label={t('Communication')} />
          <Tab label={t('Timeline')} />
        </Tabs>

        {/* Overview Tab */}
        {activeTab === 0 && (
          <Grid container spacing={3}>
            {/* Contact Information */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {t('Contact Information')}
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <EmailIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary={t('Email')}
                      secondary={lead.email}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <PhoneIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary={t('Phone')}
                      secondary={lead.phone || t('Not provided')}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <HomeIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary={t('Current Address')}
                      secondary={lead.application_details?.current_address || t('Not provided')}
                    />
                  </ListItem>
                </List>
              </Paper>
            </Grid>

            {/* Application Details */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {t('Application Details')}
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <IncomeIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary={t('Monthly Income')}
                      secondary={lead.application_details?.income 
                        ? `CHF ${lead.application_details.income.toLocaleString()}`
                        : t('Not provided')}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <WorkIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary={t('Employment')}
                      secondary={lead.application_details?.employment || t('Not provided')}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <FamilyIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary={t('Household Size')}
                      secondary={lead.application_details?.household_size 
                        ? `${lead.application_details.household_size} ${t('person(s)')}`
                        : t('Not provided')}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <ScheduleIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary={t('Move-in Date')}
                      secondary={lead.application_details?.move_in_date 
                        ? new Date(lead.application_details.move_in_date).toLocaleDateString()
                        : t('Flexible')}
                    />
                  </ListItem>
                </List>
              </Paper>
            </Grid>

            {/* Additional Information */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {t('Additional Information')}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PetsIcon color={lead.application_details?.has_pets ? 'primary' : 'disabled'} />
                      <Typography>
                        {lead.application_details?.has_pets ? t('Has pets') : t('No pets')}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SmokingIcon color={!lead.application_details?.is_smoker ? 'primary' : 'disabled'} />
                      <Typography>
                        {lead.application_details?.is_smoker ? t('Smoker') : t('Non-smoker')}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      {t('Source')}: {lead.source_portal}
                    </Typography>
                  </Grid>
                </Grid>
                {lead.application_details?.notes && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      {t('Applicant Notes')}:
                    </Typography>
                    <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                      "{lead.application_details.notes}"
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* AI Analysis Tab */}
        {activeTab === 1 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h6">
                    {t('AI Score Analysis')}
                  </Typography>
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: `${getScoreColor(lead.score)}.light`,
                      color: `${getScoreColor(lead.score)}.dark`,
                      fontSize: '1.5rem',
                      fontWeight: 'bold'
                    }}
                  >
                    {lead.score}
                  </Box>
                </Box>

                <LinearProgress 
                  variant="determinate" 
                  value={lead.score} 
                  color={getScoreColor(lead.score)}
                  sx={{ height: 10, borderRadius: 5, mb: 3 }}
                />

                {/* Green Flags */}
                {lead.ai_insights?.green_flags?.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: 'success.main' }}>
                      {t('Positive Factors')}
                    </Typography>
                    {lead.ai_insights.green_flags.map((flag, index) => (
                      <Chip
                        key={index}
                        label={flag}
                        color="success"
                        variant="outlined"
                        icon={<CheckIcon />}
                        sx={{ m: 0.5 }}
                      />
                    ))}
                  </Box>
                )}

                {/* Red Flags */}
                {lead.ai_insights?.red_flags?.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: 'error.main' }}>
                      {t('Risk Factors')}
                    </Typography>
                    {lead.ai_insights.red_flags.map((flag, index) => (
                      <Chip
                        key={index}
                        label={flag}
                        color="error"
                        variant="outlined"
                        icon={<WarningIcon />}
                        sx={{ m: 0.5 }}
                      />
                    ))}
                  </Box>
                )}

                {/* AI Recommendation */}
                {lead.ai_insights?.recommendation && (
                  <Alert 
                    severity={lead.ai_insights.recommendation === 'accept' ? 'success' : 
                            lead.ai_insights.recommendation === 'reject' ? 'error' : 'warning'}
                    sx={{ mt: 2 }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {t('AI Recommendation')}: {t(lead.ai_insights.recommendation)}
                    </Typography>
                    {lead.ai_insights.reasoning && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {lead.ai_insights.reasoning}
                      </Typography>
                    )}
                  </Alert>
                )}
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* Documents Tab */}
        {activeTab === 2 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {t('Application Documents')}
                </Typography>
                {lead.documents?.length > 0 ? (
                  <List>
                    {lead.documents.map((doc, index) => (
                      <ListItem key={index} secondaryAction={
                        <IconButton edge="end" aria-label="download">
                          <DownloadIcon />
                        </IconButton>
                      }>
                        <ListItemIcon>
                          <DocumentIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={doc.name}
                          secondary={`${doc.type} - ${new Date(doc.uploaded_at).toLocaleDateString()}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Alert severity="info">
                    {t('No documents have been uploaded yet.')}
                  </Alert>
                )}
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* Communication Tab */}
        {activeTab === 3 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {t('Communication History')}
                </Typography>
                {lead.communications?.length > 0 ? (
                  <List>
                    {lead.communications.map((comm, index) => (
                      <ListItem key={index} alignItems="flex-start">
                        <ListItemIcon>
                          <MessageIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={comm.subject}
                          secondary={
                            <>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(comm.sent_at).toLocaleString()}
                              </Typography>
                              <Typography variant="body2" sx={{ mt: 1 }}>
                                {comm.content}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Alert severity="info">
                    {t('No communication history available.')}
                  </Alert>
                )}
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* Timeline Tab */}
        {activeTab === 4 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {t('Application Timeline')}
                </Typography>
                <Stepper orientation="vertical" activeStep={-1}>
                  <Step completed>
                    <StepLabel>
                      {t('Application Received')}
                    </StepLabel>
                    <StepContent>
                      <Typography variant="body2">
                        {new Date(lead.created_at).toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t('Via')}: {lead.source_portal}
                      </Typography>
                    </StepContent>
                  </Step>
                  
                  {lead.ai_analysis_at && (
                    <Step completed>
                      <StepLabel>
                        {t('AI Analysis Completed')}
                      </StepLabel>
                      <StepContent>
                        <Typography variant="body2">
                          {new Date(lead.ai_analysis_at).toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t('Score')}: {lead.score}
                        </Typography>
                      </StepContent>
                    </Step>
                  )}
                  
                  {lead.viewing_scheduled_at && (
                    <Step completed>
                      <StepLabel>
                        {t('Viewing Scheduled')}
                      </StepLabel>
                      <StepContent>
                        <Typography variant="body2">
                          {new Date(lead.viewing_scheduled_at).toLocaleString()}
                        </Typography>
                      </StepContent>
                    </Step>
                  )}
                  
                  {lead.decision_made_at && (
                    <Step completed>
                      <StepLabel>
                        {t('Decision Made')}
                      </StepLabel>
                      <StepContent>
                        <Typography variant="body2">
                          {new Date(lead.decision_made_at).toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t('Status')}: {lead.status}
                        </Typography>
                      </StepContent>
                    </Step>
                  )}
                </Stepper>
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* Decision Notes */}
        {lead.status !== 'selected' && lead.status !== 'rejected' && (
          <Box sx={{ mt: 3 }}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label={t('Decision Notes (Optional)')}
              value={decisionNotes}
              onChange={(e) => setDecisionNotes(e.target.value)}
              placeholder={t('Add any notes about your decision...')}
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose}>
          {t('Close')}
        </Button>
        {lead.status !== 'selected' && lead.status !== 'rejected' && (
          <>
            <Button
              variant="outlined"
              startIcon={<ScheduleIcon />}
              onClick={handleScheduleViewing}
            >
              {t('Schedule Viewing')}
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<CancelIcon />}
              onClick={handleReject}
            >
              {t('Reject')}
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckIcon />}
              onClick={handleAccept}
            >
              {t('Accept')}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ApplicationDetailModal;