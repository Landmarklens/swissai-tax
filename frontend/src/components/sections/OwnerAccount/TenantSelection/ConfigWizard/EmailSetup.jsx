import React from 'react';
import {
  Box,
  TextField,
  FormControlLabel,
  Switch,
  Typography,
  Alert,
  Paper,
  Chip
} from '@mui/material';
import { Email as EmailIcon, Info as InfoIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const EmailSetup = ({ data, onChange, errors }) => {
  const { t } = useTranslation();

  const handleChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    onChange({
      ...data,
      [field]: value
    });
  };

  const emailTemplates = [
    { id: 'professional', label: t('Professional'), template: 'Thank you for your application...' },
    { id: 'friendly', label: t('Friendly'), template: 'Hi there! Thanks for applying...' },
    { id: 'formal', label: t('Formal'), template: 'Dear Applicant, We acknowledge receipt...' }
  ];

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <EmailIcon sx={{ mr: 2, color: 'primary.main' }} />
        <Typography variant="h6">{t('Email Configuration')}</Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          {t('Set up a dedicated email address to automatically receive and process tenant applications from various portals.')}
        </Typography>
      </Alert>

      <TextField
        fullWidth
        label={t('Managed Email Address')}
        value={data.managedEmail}
        onChange={handleChange('managedEmail')}
        error={!!errors.email}
        helperText={errors.email || t('This email will receive applications from all portals')}
        placeholder="applications@yourcompany.com"
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: <EmailIcon sx={{ mr: 1, color: 'action.active' }} />
        }}
      />

      <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
        <Typography variant="subtitle2" gutterBottom>
          {t('Supported Portals')}
        </Typography>
        <Box display="flex" gap={1} flexWrap="wrap" mt={1}>
          <Chip label="Homegate" size="small" />
          <Chip label="Flatfox" size="small" />
          <Chip label="ImmoScout24" size="small" />
          <Chip label="Comparis" size="small" />
          <Chip label="Newhome" size="small" />
          <Chip label="Immomailing" size="small" />
        </Box>
      </Paper>

      <FormControlLabel
        control={
          <Switch
            checked={data.forwardingEnabled}
            onChange={handleChange('forwardingEnabled')}
            color="primary"
          />
        }
        label={t('Forward emails to my personal inbox')}
        sx={{ mb: 2 }}
      />

      <FormControlLabel
        control={
          <Switch
            checked={data.autoReplyEnabled}
            onChange={handleChange('autoReplyEnabled')}
            color="primary"
          />
        }
        label={t('Send automatic confirmation to applicants')}
        sx={{ mb: 3 }}
      />

      {data.autoReplyEnabled && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            {t('Auto-Reply Template')}
          </Typography>
          
          <Box display="flex" gap={1} mb={2}>
            {emailTemplates.map((template) => (
              <Chip
                key={template.id}
                label={template.label}
                onClick={() => onChange({ ...data, autoReplyTemplate: template.template })}
                variant={data.autoReplyTemplate === template.template ? 'filled' : 'outlined'}
                color={data.autoReplyTemplate === template.template ? 'primary' : 'default'}
              />
            ))}
          </Box>

          <TextField
            fullWidth
            multiline
            rows={4}
            label={t('Message Template')}
            value={data.autoReplyTemplate}
            onChange={handleChange('autoReplyTemplate')}
            placeholder={t('Thank you for your application. We will review it and get back to you soon.')}
            helperText={t('Available variables: {{name}}, {{property}}, {{date}}')}
          />
        </Box>
      )}

      <Alert severity="warning" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>{t('Important:')}</strong> {t('Make sure to update your property listings on all portals to use this email address.')}
        </Typography>
      </Alert>
    </Box>
  );
};

export default EmailSetup;