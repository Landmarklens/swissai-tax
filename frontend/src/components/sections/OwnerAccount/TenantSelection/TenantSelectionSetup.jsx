import React, { useState } from 'react';
import {
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  FormControl,
  FormLabel,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  Select,
  MenuItem,
  InputLabel,
  Paper,
  Grid,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
  Slider,
  InputAdornment
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Home as HomeIcon,
  Settings as SettingsIcon,
  Email as EmailIcon,
  Check as CheckIcon
} from '@mui/icons-material';

const steps = ['Property Selection', 'Criteria Setup', 'Communication', 'Review & Confirm'];

const TenantSelectionSetup = ({ propertyId, onClose, onSetupComplete }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [setupData, setSetupData] = useState({
    property: {
      id: propertyId,
      name: '',
      address: '',
      rent: '',
      bedrooms: 1,
      bathrooms: 1
    },
    criteria: {
      minCreditScore: 650,
      minIncome: 3000,
      incomeRatio: 3,
      petsAllowed: false,
      smokingAllowed: false,
      maxOccupants: 2,
      requiredDocuments: ['ID', 'Income Proof', 'References'],
      employmentTypes: ['Full-time', 'Part-time', 'Self-employed'],
      autoReject: false,
      autoRejectScore: 50
    },
    communication: {
      emailNotifications: true,
      smsNotifications: false,
      autoRespond: true,
      responseTime: '24',
      emailTemplates: true,
      viewingAutoSchedule: false
    }
  });

  const [errors, setErrors] = useState({});

  const handleNext = () => {
    if (validateStep(activeStep)) {
      if (activeStep === steps.length - 1) {
        handleComplete();
      } else {
        setActiveStep((prevStep) => prevStep + 1);
      }
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 0: // Property Selection
        if (!setupData.property.name) newErrors.propertyName = 'Property name is required';
        if (!setupData.property.address) newErrors.propertyAddress = 'Address is required';
        if (!setupData.property.rent) newErrors.rent = 'Rent amount is required';
        break;
      case 1: // Criteria Setup
        if (setupData.criteria.minCreditScore < 300 || setupData.criteria.minCreditScore > 850) {
          newErrors.creditScore = 'Credit score must be between 300 and 850';
        }
        break;
      case 2: // Communication
        // No mandatory fields
        break;
      default:
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleComplete = () => {
    // Save configuration
    console.log('Setup completed:', setupData);
    onSetupComplete(setupData);
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Property Information
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Enter the details of the property for tenant selection
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Property Name"
                  value={setupData.property.name}
                  onChange={(e) => setSetupData({
                    ...setupData,
                    property: { ...setupData.property, name: e.target.value }
                  })}
                  error={!!errors.propertyName}
                  helperText={errors.propertyName}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Property Address"
                  value={setupData.property.address}
                  onChange={(e) => setSetupData({
                    ...setupData,
                    property: { ...setupData.property, address: e.target.value }
                  })}
                  error={!!errors.propertyAddress}
                  helperText={errors.propertyAddress}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Monthly Rent"
                  type="number"
                  value={setupData.property.rent}
                  onChange={(e) => setSetupData({
                    ...setupData,
                    property: { ...setupData.property, rent: e.target.value }
                  })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>
                  }}
                  error={!!errors.rent}
                  helperText={errors.rent}
                />
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Bedrooms"
                  type="number"
                  value={setupData.property.bedrooms}
                  onChange={(e) => setSetupData({
                    ...setupData,
                    property: { ...setupData.property, bedrooms: parseInt(e.target.value) }
                  })}
                />
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Bathrooms"
                  type="number"
                  value={setupData.property.bathrooms}
                  onChange={(e) => setSetupData({
                    ...setupData,
                    property: { ...setupData.property, bathrooms: parseInt(e.target.value) }
                  })}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Tenant Selection Criteria
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Define your requirements for tenant applications
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography gutterBottom>Minimum Credit Score</Typography>
                <Slider
                  value={setupData.criteria.minCreditScore}
                  onChange={(e, value) => setSetupData({
                    ...setupData,
                    criteria: { ...setupData.criteria, minCreditScore: value }
                  })}
                  min={300}
                  max={850}
                  marks
                  valueLabelDisplay="on"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography gutterBottom>Income to Rent Ratio</Typography>
                <Slider
                  value={setupData.criteria.incomeRatio}
                  onChange={(e, value) => setSetupData({
                    ...setupData,
                    criteria: { ...setupData.criteria, incomeRatio: value }
                  })}
                  min={1}
                  max={5}
                  step={0.5}
                  marks
                  valueLabelDisplay="on"
                  valueLabelFormat={(value) => `${value}x`}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={setupData.criteria.petsAllowed}
                      onChange={(e) => setSetupData({
                        ...setupData,
                        criteria: { ...setupData.criteria, petsAllowed: e.target.checked }
                      })}
                    />
                  }
                  label="Pets Allowed"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={setupData.criteria.smokingAllowed}
                      onChange={(e) => setSetupData({
                        ...setupData,
                        criteria: { ...setupData.criteria, smokingAllowed: e.target.checked }
                      })}
                    />
                  }
                  label="Smoking Allowed"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Typography gutterBottom>Required Documents</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {['ID', 'Income Proof', 'References', 'Employment Letter', 'Bank Statements'].map((doc) => (
                    <Chip
                      key={doc}
                      label={doc}
                      onClick={() => {
                        const docs = setupData.criteria.requiredDocuments;
                        const newDocs = docs.includes(doc)
                          ? docs.filter(d => d !== doc)
                          : [...docs, doc];
                        setSetupData({
                          ...setupData,
                          criteria: { ...setupData.criteria, requiredDocuments: newDocs }
                        });
                      }}
                      color={setupData.criteria.requiredDocuments.includes(doc) ? 'primary' : 'default'}
                      variant={setupData.criteria.requiredDocuments.includes(doc) ? 'filled' : 'outlined'}
                    />
                  ))}
                </Box>
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={setupData.criteria.autoReject}
                      onChange={(e) => setSetupData({
                        ...setupData,
                        criteria: { ...setupData.criteria, autoReject: e.target.checked }
                      })}
                    />
                  }
                  label="Auto-reject applications below threshold score"
                />
                {setupData.criteria.autoReject && (
                  <Slider
                    value={setupData.criteria.autoRejectScore}
                    onChange={(e, value) => setSetupData({
                      ...setupData,
                      criteria: { ...setupData.criteria, autoRejectScore: value }
                    })}
                    min={0}
                    max={100}
                    marks
                    valueLabelDisplay="on"
                    sx={{ mt: 2 }}
                  />
                )}
              </Grid>
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Communication Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Configure how you want to communicate with applicants
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={setupData.communication.emailNotifications}
                      onChange={(e) => setSetupData({
                        ...setupData,
                        communication: { ...setupData.communication, emailNotifications: e.target.checked }
                      })}
                    />
                  }
                  label="Email Notifications"
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={setupData.communication.smsNotifications}
                      onChange={(e) => setSetupData({
                        ...setupData,
                        communication: { ...setupData.communication, smsNotifications: e.target.checked }
                      })}
                    />
                  }
                  label="SMS Notifications (Coming Soon)"
                  disabled
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={setupData.communication.autoRespond}
                      onChange={(e) => setSetupData({
                        ...setupData,
                        communication: { ...setupData.communication, autoRespond: e.target.checked }
                      })}
                    />
                  }
                  label="Auto-respond to new applications"
                />
              </Grid>
              
              {setupData.communication.autoRespond && (
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Response Time</InputLabel>
                    <Select
                      value={setupData.communication.responseTime}
                      onChange={(e) => setSetupData({
                        ...setupData,
                        communication: { ...setupData.communication, responseTime: e.target.value }
                      })}
                      label="Response Time"
                    >
                      <MenuItem value="immediate">Immediate</MenuItem>
                      <MenuItem value="1">Within 1 hour</MenuItem>
                      <MenuItem value="24">Within 24 hours</MenuItem>
                      <MenuItem value="48">Within 48 hours</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={setupData.communication.emailTemplates}
                      onChange={(e) => setSetupData({
                        ...setupData,
                        communication: { ...setupData.communication, emailTemplates: e.target.checked }
                      })}
                    />
                  }
                  label="Use email templates"
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={setupData.communication.viewingAutoSchedule}
                      onChange={(e) => setSetupData({
                        ...setupData,
                        communication: { ...setupData.communication, viewingAutoSchedule: e.target.checked }
                      })}
                    />
                  }
                  label="Allow applicants to self-schedule viewings"
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review Your Configuration
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Please review your settings before confirming
            </Typography>
            
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                <HomeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Property Details
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="Name" secondary={setupData.property.name || 'Not set'} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Address" secondary={setupData.property.address || 'Not set'} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Rent" secondary={`$${setupData.property.rent || 0}/month`} />
                </ListItem>
              </List>
            </Paper>
            
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Selection Criteria
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="Min Credit Score" secondary={setupData.criteria.minCreditScore} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Income Ratio" secondary={`${setupData.criteria.incomeRatio}x rent`} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Pets" secondary={setupData.criteria.petsAllowed ? 'Allowed' : 'Not allowed'} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Auto-reject" secondary={setupData.criteria.autoReject ? `Below ${setupData.criteria.autoRejectScore}` : 'Disabled'} />
                </ListItem>
              </List>
            </Paper>
            
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                <EmailIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Communication
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="Email Notifications" secondary={setupData.communication.emailNotifications ? 'Enabled' : 'Disabled'} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Auto-respond" secondary={setupData.communication.autoRespond ? `Within ${setupData.communication.responseTime} hours` : 'Disabled'} />
                </ListItem>
              </List>
            </Paper>
            
            <Alert severity="info" sx={{ mt: 2 }}>
              You can modify these settings at any time from the Tenant Selection dashboard.
            </Alert>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box sx={{ minHeight: 400 }}>
        {renderStepContent(activeStep)}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button
          onClick={onClose}
          sx={{ display: activeStep === 0 ? 'block' : 'none' }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleBack}
          sx={{ display: activeStep === 0 ? 'none' : 'block' }}
        >
          Back
        </Button>
        
        <Box sx={{ flex: 1 }} />
        
        <Button
          variant="contained"
          onClick={handleNext}
          startIcon={activeStep === steps.length - 1 ? <CheckIcon /> : null}
        >
          {activeStep === steps.length - 1 ? 'Complete Setup' : 'Next'}
        </Button>
      </Box>
    </Box>
  );
};

export default TenantSelectionSetup;