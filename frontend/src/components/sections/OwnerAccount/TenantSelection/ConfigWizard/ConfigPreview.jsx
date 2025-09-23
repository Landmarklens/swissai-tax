import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert
} from '@mui/material';
import {
  Email as EmailIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  TrendingUp as ScoreIcon,
  Schedule as ScheduleIcon,
  Check as DoneIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const ConfigPreview = ({ config, propertyId }) => {
  const { t } = useTranslation();

  const getTotalSoftWeight = () => {
    return config.softCriteria.reduce((sum, c) => sum + (c.weight || 0), 0);
  };

  const getScoringTotal = () => {
    return Object.values(config.scoringWeights).reduce((sum, w) => sum + w, 0);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {t('Configuration Review')}
      </Typography>

      <Alert severity="success" sx={{ mb: 3 }}>
        <Typography variant="body2">
          {t('Your tenant selection configuration is ready! Review the settings below before saving.')}
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        {/* Email Configuration */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box display="flex" alignItems="center" mb={2}>
              <EmailIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="subtitle1" fontWeight="bold">
                {t('Email Configuration')}
              </Typography>
            </Box>
            
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <DoneIcon fontSize="small" color="success" />
                </ListItemIcon>
                <ListItemText
                  primary={t('Managed Email')}
                  secondary={config.emailSettings.managedEmail || t('Not configured')}
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <DoneIcon fontSize="small" color={config.emailSettings.forwardingEnabled ? 'success' : 'disabled'} />
                </ListItemIcon>
                <ListItemText
                  primary={t('Email Forwarding')}
                  secondary={config.emailSettings.forwardingEnabled ? t('Enabled') : t('Disabled')}
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <DoneIcon fontSize="small" color={config.emailSettings.autoReplyEnabled ? 'success' : 'disabled'} />
                </ListItemIcon>
                <ListItemText
                  primary={t('Auto-Reply')}
                  secondary={config.emailSettings.autoReplyEnabled ? t('Enabled') : t('Disabled')}
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Criteria Summary */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box display="flex" alignItems="center" mb={2}>
              <WarningIcon sx={{ mr: 1, color: 'warning.main' }} />
              <Typography variant="subtitle1" fontWeight="bold">
                {t('Selection Criteria')}
              </Typography>
            </Box>
            
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {t('Hard Criteria (Must Have)')}
              </Typography>
              <Box display="flex" gap={0.5} flexWrap="wrap">
                {config.hardCriteria.length > 0 ? (
                  config.hardCriteria.map((criterion, index) => (
                    <Chip
                      key={index}
                      label={criterion.label}
                      size="small"
                      color="error"
                      variant="outlined"
                    />
                  ))
                ) : (
                  <Typography variant="body2" color="text.disabled">
                    {t('No hard criteria defined')}
                  </Typography>
                )}
              </Box>
            </Box>
            
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {t('Soft Criteria ({{count}} points)', { count: getTotalSoftWeight() })}
              </Typography>
              <Box display="flex" gap={0.5} flexWrap="wrap">
                {config.softCriteria.length > 0 ? (
                  config.softCriteria.map((criterion, index) => (
                    <Chip
                      key={index}
                      label={`${criterion.label} (${criterion.weight}%)`}
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  ))
                ) : (
                  <Typography variant="body2" color="text.disabled">
                    {t('No soft criteria defined')}
                  </Typography>
                )}
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Scoring Weights */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box display="flex" alignItems="center" mb={2}>
              <ScoreIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="subtitle1" fontWeight="bold">
                {t('Scoring Weights')}
              </Typography>
              <Chip
                label={`${getScoringTotal()}%`}
                size="small"
                color={getScoringTotal() === 100 ? 'success' : 'error'}
                sx={{ ml: 'auto' }}
              />
            </Box>
            
            <List dense>
              {Object.entries(config.scoringWeights).map(([key, value]) => (
                <ListItem key={key} sx={{ py: 0.5 }}>
                  <ListItemText
                    primary={getWeightLabel(key, t)}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                  <Box
                    sx={{
                      width: 100,
                      bgcolor: 'grey.200',
                      borderRadius: 1,
                      overflow: 'hidden',
                      mr: 1
                    }}
                  >
                    <Box
                      sx={{
                        width: `${value}%`,
                        bgcolor: 'primary.main',
                        height: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold' }}>
                        {value}%
                      </Typography>
                    </Box>
                  </Box>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Viewing Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box display="flex" alignItems="center" mb={2}>
              <ScheduleIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="subtitle1" fontWeight="bold">
                {t('Viewing Schedule')}
              </Typography>
            </Box>
            
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <DoneIcon fontSize="small" color="success" />
                </ListItemIcon>
                <ListItemText
                  primary={t('Max Invites per Viewing')}
                  secondary={config.viewingSettings.maxInvitesPerViewing}
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <DoneIcon fontSize="small" color={config.viewingSettings.autoScheduleEnabled ? 'success' : 'disabled'} />
                </ListItemIcon>
                <ListItemText
                  primary={t('Auto-Schedule')}
                  secondary={config.viewingSettings.autoScheduleEnabled ? t('Enabled') : t('Disabled')}
                />
              </ListItem>
              
              {config.viewingSettings.autoScheduleEnabled && (
                <>
                  <ListItem>
                    <ListItemText
                      primary={t('Preferred Days')}
                      secondary={
                        config.viewingSettings.preferredDays.length > 0
                          ? config.viewingSettings.preferredDays.map(d => t(d)).join(', ')
                          : t('Not specified')
                      }
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemText
                      primary={t('Duration')}
                      secondary={`${config.viewingSettings.duration} ${t('minutes')}`}
                    />
                  </ListItem>
                </>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3, mt: 3, bgcolor: 'primary.light' }}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          {t('What happens next?')}
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon>
              <CheckIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary={t('Automatic email processing begins immediately')}
              primaryTypographyProps={{ variant: 'body2' }}
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CheckIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary={t('AI analyzes and scores each application based on your criteria')}
              primaryTypographyProps={{ variant: 'body2' }}
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CheckIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary={t('Top applicants are automatically invited to viewings')}
              primaryTypographyProps={{ variant: 'body2' }}
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CheckIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary={t('You receive notifications for important updates')}
              primaryTypographyProps={{ variant: 'body2' }}
            />
          </ListItem>
        </List>
      </Paper>
    </Box>
  );
};

const getWeightLabel = (key, t) => {
  const labels = {
    income: t('Income & Financial'),
    creditScore: t('Credit Score'),
    references: t('References'),
    employmentHistory: t('Employment'),
    otherFactors: t('Other Factors')
  };
  return labels[key] || key;
};

export default ConfigPreview;