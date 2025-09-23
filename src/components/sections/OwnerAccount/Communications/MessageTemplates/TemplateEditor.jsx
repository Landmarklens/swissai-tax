import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  IconButton,
  Tooltip,
  Grid,
  Paper
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
  Code as CodeIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const availableVariables = [
  { name: 'applicant_name', description: 'Full name of the applicant' },
  { name: 'applicant_email', description: 'Email address of the applicant' },
  { name: 'applicant_phone', description: 'Phone number of the applicant' },
  { name: 'property_address', description: 'Full address of the property' },
  { name: 'property_type', description: 'Type of property (apartment, house, etc.)' },
  { name: 'property_rent', description: 'Monthly rent amount' },
  { name: 'viewing_date', description: 'Date of the viewing' },
  { name: 'viewing_time', description: 'Time of the viewing' },
  { name: 'viewing_location', description: 'Location/meeting point for viewing' },
  { name: 'landlord_name', description: 'Name of the landlord/property manager' },
  { name: 'landlord_email', description: 'Email of the landlord' },
  { name: 'landlord_phone', description: 'Phone number of the landlord' },
  { name: 'move_in_date', description: 'Available move-in date' },
  { name: 'security_deposit', description: 'Security deposit amount' },
  { name: 'response_time', description: 'Expected response time' },
  { name: 'required_documents', description: 'List of required documents' },
  { name: 'contract_timeline', description: 'Timeline for contract preparation' },
  { name: 'application_date', description: 'Date when application was received' },
  { name: 'application_score', description: 'AI-generated application score' },
  { name: 'current_date', description: 'Today\'s date' }
];

const TemplateEditor = ({ open, template, onClose, onSave }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    category: 'confirmation',
    subject: '',
    content: '',
    variables: []
  });
  const [errors, setErrors] = useState({});
  const [showVariableHelper, setShowVariableHelper] = useState(true);
  const [customVariable, setCustomVariable] = useState('');

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || '',
        category: template.category || 'confirmation',
        subject: template.subject || '',
        content: template.content || '',
        variables: template.variables || []
      });
    }
  }, [template]);

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
    
    // Auto-detect variables in content and subject
    if (field === 'content' || field === 'subject') {
      detectVariables();
    }
  };

  const detectVariables = () => {
    const text = formData.subject + ' ' + formData.content;
    const regex = /\{\{(\w+)\}\}/g;
    const detectedVars = [];
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      if (!detectedVars.includes(match[1])) {
        detectedVars.push(match[1]);
      }
    }
    
    setFormData(prev => ({
      ...prev,
      variables: detectedVars
    }));
  };

  const insertVariable = (variable) => {
    const cursorPosition = document.getElementById('template-content').selectionStart;
    const textBefore = formData.content.substring(0, cursorPosition);
    const textAfter = formData.content.substring(cursorPosition);
    const newContent = `${textBefore}{{${variable}}}${textAfter}`;
    
    setFormData(prev => ({
      ...prev,
      content: newContent
    }));
    
    // Re-detect variables
    setTimeout(detectVariables, 100);
  };

  const addCustomVariable = () => {
    if (customVariable && !formData.variables.includes(customVariable)) {
      setFormData(prev => ({
        ...prev,
        variables: [...prev.variables, customVariable]
      }));
      setCustomVariable('');
    }
  };

  const removeVariable = (variable) => {
    setFormData(prev => ({
      ...prev,
      variables: prev.variables.filter(v => v !== variable)
    }));
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = t('Template name is required');
    }
    
    if (!formData.subject.trim()) {
      newErrors.subject = t('Subject line is required');
    }
    
    if (!formData.content.trim()) {
      newErrors.content = t('Message content is required');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      onSave(formData);
    }
  };

  const categories = [
    { value: 'viewing', label: t('Viewing') },
    { value: 'confirmation', label: t('Confirmation') },
    { value: 'request', label: t('Request') },
    { value: 'decision', label: t('Decision') },
    { value: 'reminder', label: t('Reminder') },
    { value: 'other', label: t('Other') }
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '80vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {template ? t('Edit Template') : t('Create New Template')}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label={t('Template Name')}
              value={formData.name}
              onChange={handleChange('name')}
              error={!!errors.name}
              helperText={errors.name}
              sx={{ mb: 2 }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>{t('Category')}</InputLabel>
              <Select
                value={formData.category}
                onChange={handleChange('category')}
                label={t('Category')}
              >
                {categories.map(cat => (
                  <MenuItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Subject Line */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('Subject Line')}
              value={formData.subject}
              onChange={handleChange('subject')}
              error={!!errors.subject}
              helperText={errors.subject || t('Use {{variable}} to insert dynamic content')}
            />
          </Grid>

          {/* Message Content */}
          <Grid item xs={12}>
            <TextField
              id="template-content"
              fullWidth
              multiline
              rows={12}
              label={t('Message Content')}
              value={formData.content}
              onChange={handleChange('content')}
              error={!!errors.content}
              helperText={errors.content || t('Use {{variable}} to insert dynamic content')}
            />
          </Grid>

          {/* Variable Helper */}
          {showVariableHelper && (
            <Grid item xs={12}>
              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center' }}>
                    <CodeIcon sx={{ mr: 1 }} />
                    {t('Available Variables')}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => setShowVariableHelper(false)}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  {availableVariables.slice(0, 10).map(variable => (
                    <Tooltip key={variable.name} title={variable.description}>
                      <Chip
                        label={`{{${variable.name}}}`}
                        size="small"
                        onClick={() => insertVariable(variable.name)}
                        sx={{ cursor: 'pointer' }}
                      />
                    </Tooltip>
                  ))}
                  <Chip
                    label={t('View all...')}
                    size="small"
                    variant="outlined"
                    onClick={() => {/* TODO: Show all variables dialog */}}
                  />
                </Box>

                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField
                    size="small"
                    placeholder={t('Custom variable name')}
                    value={customVariable}
                    onChange={(e) => setCustomVariable(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addCustomVariable();
                      }
                    }}
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={addCustomVariable}
                    disabled={!customVariable}
                  >
                    {t('Add')}
                  </Button>
                </Box>
              </Paper>
            </Grid>
          )}

          {/* Detected Variables */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              {t('Detected Variables')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {formData.variables.length > 0 ? (
                formData.variables.map(variable => (
                  <Chip
                    key={variable}
                    label={`{{${variable}}}`}
                    size="small"
                    onDelete={() => removeVariable(variable)}
                    color="primary"
                    variant="outlined"
                  />
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {t('No variables detected. Use {{variable_name}} syntax in your template.')}
                </Typography>
              )}
            </Box>
          </Grid>

          {/* Preview */}
          <Grid item xs={12}>
            <Alert severity="info">
              <Typography variant="subtitle2" gutterBottom>
                {t('Preview')}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                {formData.subject || t('(No subject)')}
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {formData.content || t('(No content)')}
              </Typography>
            </Alert>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          {t('Cancel')}
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!formData.name || !formData.subject || !formData.content}
        >
          {template ? t('Save Changes') : t('Create Template')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TemplateEditor;