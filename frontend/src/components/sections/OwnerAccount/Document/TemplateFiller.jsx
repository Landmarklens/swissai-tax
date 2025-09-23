import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Grid,
  Chip,
  Alert,
  IconButton,
  Checkbox,
  FormControlLabel,
  FormGroup,
  InputAdornment,
  Divider,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Stack
} from '@mui/material';
import { styled } from '@mui/material/styles';
// Remove date picker imports - use native HTML date input instead

// Icons
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import SendIcon from '@mui/icons-material/Send';
import PreviewIcon from '@mui/icons-material/Visibility';
import PersonIcon from '@mui/icons-material/Person';
import HomeIcon from '@mui/icons-material/Home';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import EventIcon from '@mui/icons-material/Event';
import DrawIcon from '@mui/icons-material/Draw';
import DescriptionIcon from '@mui/icons-material/Description';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

// Import templates and signature pad
import { getTemplateById, generateDocumentHTML } from './templates/documentTemplates';
import SignaturePad from './SignaturePad';

const FormSection = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(2),
  borderRadius: theme.spacing(1),
}));

const FieldGroup = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

const PreviewContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundColor: '#fff',
  minHeight: '600px',
  maxHeight: '80vh',
  overflow: 'auto',
  boxShadow: theme.shadows[3],
}));

const ProgressBar = styled(LinearProgress)(({ theme }) => ({
  height: 8,
  borderRadius: 4,
  marginBottom: theme.spacing(3),
}));

const TemplateFiller = ({ templateId, onComplete, onCancel, initialData = {} }) => {
  const [template, setTemplate] = useState(null);
  const [fieldValues, setFieldValues] = useState({});
  const [activeStep, setActiveStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [showPreview, setShowPreview] = useState(false);
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [currentSignatureField, setCurrentSignatureField] = useState(null);
  const [completedSections, setCompletedSections] = useState([]);

  // Load template
  useEffect(() => {
    const loadedTemplate = getTemplateById(templateId);
    if (loadedTemplate) {
      setTemplate(loadedTemplate);
      
      // Initialize field values with defaults
      const initialValues = {};
      Object.entries(loadedTemplate.fields).forEach(([key, field]) => {
        if (initialData[key]) {
          initialValues[key] = initialData[key];
        } else if (field.default !== undefined) {
          initialValues[key] = field.default;
        } else {
          initialValues[key] = '';
        }
      });
      setFieldValues(initialValues);
    }
  }, [templateId, initialData]);

  // Group fields by category for better organization
  const getFieldGroups = () => {
    if (!template) return [];
    
    const groups = {
      landlord: { title: 'Landlord Information', icon: <PersonIcon />, fields: [] },
      tenant: { title: 'Tenant Information', icon: <PersonIcon />, fields: [] },
      property: { title: 'Property Details', icon: <HomeIcon />, fields: [] },
      financial: { title: 'Financial Terms', icon: <AttachMoneyIcon />, fields: [] },
      dates: { title: 'Dates & Terms', icon: <EventIcon />, fields: [] },
      rules: { title: 'Rules & Conditions', icon: <DescriptionIcon />, fields: [] },
      signatures: { title: 'Signatures', icon: <DrawIcon />, fields: [] },
      other: { title: 'Additional Information', icon: <InfoIcon />, fields: [] }
    };

    Object.entries(template.fields).forEach(([key, field]) => {
      const fieldWithKey = { ...field, key };
      
      if (key.includes('landlord')) {
        groups.landlord.fields.push(fieldWithKey);
      } else if (key.includes('tenant')) {
        groups.tenant.fields.push(fieldWithKey);
      } else if (key.includes('property') || key.includes('address')) {
        groups.property.fields.push(fieldWithKey);
      } else if (key.includes('rent') || key.includes('deposit') || key.includes('fee') || key.includes('amount') || field.type === 'currency') {
        groups.financial.fields.push(fieldWithKey);
      } else if (key.includes('date') || key.includes('term') || key.includes('period')) {
        groups.dates.fields.push(fieldWithKey);
      } else if (key.includes('rule') || key.includes('allowed') || key.includes('policy')) {
        groups.rules.fields.push(fieldWithKey);
      } else if (key.includes('signature')) {
        groups.signatures.fields.push(fieldWithKey);
      } else {
        groups.other.fields.push(fieldWithKey);
      }
    });

    // Filter out empty groups
    return Object.entries(groups)
      .filter(([_, group]) => group.fields.length > 0)
      .map(([key, group]) => ({ ...group, key }));
  };

  const fieldGroups = getFieldGroups();
  const steps = fieldGroups.map(group => group.title);

  // Calculate completion percentage
  const calculateProgress = () => {
    if (!template) return 0;
    
    const requiredFields = Object.entries(template.fields)
      .filter(([_, field]) => field.required)
      .map(([key, _]) => key);
    
    const completedRequired = requiredFields.filter(key => 
      fieldValues[key] && fieldValues[key] !== ''
    ).length;
    
    return (completedRequired / requiredFields.length) * 100;
  };

  // Validate a single field
  const validateField = (key, value, field) => {
    if (field.required && (!value || value === '')) {
      return `${field.label} is required`;
    }
    
    if (field.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return 'Invalid email address';
      }
    }
    
    if (field.type === 'tel' && value) {
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      if (!phoneRegex.test(value)) {
        return 'Invalid phone number';
      }
    }
    
    if (field.min !== undefined && Number(value) < field.min) {
      return `Minimum value is ${field.min}`;
    }
    
    if (field.max !== undefined && Number(value) > field.max) {
      return `Maximum value is ${field.max}`;
    }
    
    if (field.maxLength && value.length > field.maxLength) {
      return `Maximum length is ${field.maxLength} characters`;
    }
    
    return null;
  };

  // Validate current section
  const validateSection = () => {
    const currentGroup = fieldGroups[activeStep];
    const sectionErrors = {};
    let hasErrors = false;
    
    currentGroup.fields.forEach(field => {
      const error = validateField(field.key, fieldValues[field.key], field);
      if (error) {
        sectionErrors[field.key] = error;
        hasErrors = true;
      }
    });
    
    setErrors(sectionErrors);
    return !hasErrors;
  };

  // Handle field value change
  const handleFieldChange = (key, value) => {
    setFieldValues(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Clear error for this field
    if (errors[key]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  // Handle signature field
  const handleSignatureClick = (fieldKey) => {
    setCurrentSignatureField(fieldKey);
    setSignatureDialogOpen(true);
  };

  const handleSignatureSave = (signatureData) => {
    if (currentSignatureField) {
      handleFieldChange(currentSignatureField, signatureData);
    }
    setSignatureDialogOpen(false);
    setCurrentSignatureField(null);
  };

  // Render field based on type
  const renderField = (field) => {
    const value = fieldValues[field.key] || '';
    const error = errors[field.key];
    
    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
        return (
          <TextField
            fullWidth
            label={field.label}
            value={value}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            error={!!error}
            helperText={error}
            required={field.required}
            type={field.type === 'email' ? 'email' : 'text'}
            inputProps={{ maxLength: field.maxLength }}
          />
        );
      
      case 'number':
        return (
          <TextField
            fullWidth
            label={field.label}
            value={value}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            error={!!error}
            helperText={error}
            required={field.required}
            type="number"
            inputProps={{ min: field.min, max: field.max }}
          />
        );
      
      case 'currency':
        return (
          <TextField
            fullWidth
            label={field.label}
            value={value}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            error={!!error}
            helperText={error}
            required={field.required}
            type="number"
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
          />
        );
      
      case 'date':
        return (
          <TextField
            fullWidth
            label={field.label}
            value={value}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            error={!!error}
            helperText={error}
            required={field.required}
            type="date"
            InputLabelProps={{ shrink: true }}
          />
        );
      
      case 'time':
        return (
          <TextField
            fullWidth
            label={field.label}
            value={value}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            error={!!error}
            helperText={error}
            required={field.required}
            type="time"
            InputLabelProps={{ shrink: true }}
          />
        );
      
      case 'select':
        return (
          <FormControl fullWidth error={!!error} required={field.required}>
            <InputLabel>{field.label}</InputLabel>
            <Select
              value={value}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              label={field.label}
            >
              {field.options?.map(option => (
                <MenuItem key={option} value={option}>{option}</MenuItem>
              ))}
            </Select>
            {error && <Typography variant="caption" color="error">{error}</Typography>}
          </FormControl>
        );
      
      case 'multiselect':
        return (
          <FormControl fullWidth error={!!error}>
            <Typography variant="subtitle2" gutterBottom>{field.label}</Typography>
            <FormGroup row>
              {field.options?.map(option => (
                <FormControlLabel
                  key={option}
                  control={
                    <Checkbox
                      checked={Array.isArray(value) ? value.includes(option) : false}
                      onChange={(e) => {
                        const currentValues = Array.isArray(value) ? value : [];
                        if (e.target.checked) {
                          handleFieldChange(field.key, [...currentValues, option]);
                        } else {
                          handleFieldChange(field.key, currentValues.filter(v => v !== option));
                        }
                      }}
                    />
                  }
                  label={option}
                />
              ))}
            </FormGroup>
            {error && <Typography variant="caption" color="error">{error}</Typography>}
          </FormControl>
        );
      
      case 'textarea':
        return (
          <TextField
            fullWidth
            label={field.label}
            value={value}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            error={!!error}
            helperText={error}
            required={field.required}
            multiline
            rows={4}
          />
        );
      
      case 'checkbox':
        return (
          <FormControlLabel
            control={
              <Checkbox
                checked={!!value}
                onChange={(e) => handleFieldChange(field.key, e.target.checked)}
                required={field.required}
              />
            }
            label={field.label}
          />
        );
      
      case 'signature':
        return (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              {field.label} {field.required && '*'}
            </Typography>
            {value ? (
              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                {value.type === 'draw' && (
                  <img src={value.data} alt="Signature" style={{ maxHeight: 100 }} />
                )}
                {value.type === 'type' && (
                  <Typography style={{ fontFamily: value.font, fontSize: value.fontSize }}>
                    {value.text}
                  </Typography>
                )}
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => handleSignatureClick(field.key)}
                  sx={{ mt: 1 }}
                >
                  Change Signature
                </Button>
              </Paper>
            ) : (
              <Button
                variant="outlined"
                fullWidth
                startIcon={<DrawIcon />}
                onClick={() => handleSignatureClick(field.key)}
                sx={{ py: 2 }}
              >
                Add Signature
              </Button>
            )}
            {error && <Typography variant="caption" color="error">{error}</Typography>}
          </Box>
        );
      
      default:
        return (
          <TextField
            fullWidth
            label={field.label}
            value={value}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            error={!!error}
            helperText={error}
            required={field.required}
          />
        );
    }
  };

  const handleNext = () => {
    if (validateSection()) {
      setCompletedSections(prev => [...prev, activeStep]);
      if (activeStep < steps.length - 1) {
        setActiveStep(prev => prev + 1);
      } else {
        setShowPreview(true);
      }
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete({
        templateId,
        fieldValues,
        html: generateDocumentHTML(template, fieldValues)
      });
    }
  };

  if (!template) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Template not found</Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Progress Bar */}
      <ProgressBar variant="determinate" value={calculateProgress()} />

      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          {template.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {template.description}
        </Typography>
      </Box>

      {!showPreview ? (
        <>
          {/* Stepper */}
          <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
            {steps.map((label, index) => (
              <Step key={label} completed={completedSections.includes(index)}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Form Fields */}
          <FormSection elevation={1}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              {fieldGroups[activeStep].icon}
              <Typography variant="h6" sx={{ ml: 1 }}>
                {fieldGroups[activeStep].title}
              </Typography>
            </Box>
            
            <Grid container spacing={2}>
              {fieldGroups[activeStep].fields.map((field) => (
                <Grid item xs={12} md={field.type === 'textarea' ? 12 : 6} key={field.key}>
                  {renderField(field)}
                </Grid>
              ))}
            </Grid>
          </FormSection>

          {/* Navigation */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button
              onClick={onCancel}
              color="inherit"
            >
              Cancel
            </Button>
            
            <Box>
              <Button
                onClick={handleBack}
                disabled={activeStep === 0}
                startIcon={<ArrowBackIcon />}
                sx={{ mr: 1 }}
              >
                Back
              </Button>
              
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  startIcon={<PreviewIcon />}
                >
                  Preview Document
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  endIcon={<ArrowForwardIcon />}
                >
                  Next
                </Button>
              )}
            </Box>
          </Box>
        </>
      ) : (
        <>
          {/* Document Preview */}
          <Alert severity="success" sx={{ mb: 2 }}>
            Document is ready! Review the preview below before finalizing.
          </Alert>
          
          <PreviewContainer>
            <div 
              dangerouslySetInnerHTML={{ 
                __html: generateDocumentHTML(template, fieldValues) 
              }}
            />
          </PreviewContainer>

          {/* Actions */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button
              onClick={() => setShowPreview(false)}
              startIcon={<EditIcon />}
            >
              Edit Document
            </Button>
            
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                startIcon={<SaveIcon />}
              >
                Save Draft
              </Button>
              <Button
                variant="contained"
                onClick={handleComplete}
                startIcon={<SendIcon />}
              >
                Send for Signature
              </Button>
            </Stack>
          </Box>
        </>
      )}

      {/* Signature Dialog */}
      <Dialog
        open={signatureDialogOpen}
        onClose={() => setSignatureDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <SignaturePad
          onSave={handleSignatureSave}
          onCancel={() => setSignatureDialogOpen(false)}
        />
      </Dialog>
    </Box>
  );
};

export default TemplateFiller;