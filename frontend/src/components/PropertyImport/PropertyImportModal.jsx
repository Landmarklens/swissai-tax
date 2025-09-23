import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Box,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  Typography,
  Button,
  Alert
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

// Import step components
import ImportMethodStep from './steps/ImportMethodStep';
import PropertyPreviewStep from './steps/PropertyPreviewStep';
import EmailSetupStep from './steps/EmailSetupStep';
import CompletionStep from './steps/CompletionStep';

// Import hooks
import { useEmailMonitoring } from './hooks/useEmailMonitoring';

// Import Redux actions
import { 
  setImportMethod,
  setPropertyData,
  setEmailConfig,
  importPropertyFromURL,
  createProperty
} from '../../store/slices/tenantSelectionSlice';

const steps = [
  'Import Method',
  'Property Details',
  'Email Setup',
  'Complete Setup'
];

const PropertyImportModal = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const { importFlow, loading, error } = useSelector((state) => state.tenantSelection);
  
  const [activeStep, setActiveStep] = useState(0);
  const [propertyData, setPropertyData] = useState({});
  const [emailConfig, setEmailConfig] = useState({
    managedEmail: '',
    forwardToPersonal: false,
    personalEmail: '',
    testStatus: 'not_tested',
    verificationCode: ''
  });
  const [importMethod, setImportMethod] = useState('url'); // 'url' or 'manual'
  const [validationErrors, setValidationErrors] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);

  // Email monitoring hook
  const { 
    startMonitoring, 
    stopMonitoring, 
    monitoringStatus, 
    testResult 
  } = useEmailMonitoring(propertyData.id);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setActiveStep(0);
      setPropertyData({});
      setEmailConfig({
        managedEmail: '',
        forwardToPersonal: false,
        personalEmail: '',
        testStatus: 'not_tested',
        verificationCode: generateVerificationCode()
      });
      setValidationErrors({});
    }
  }, [open]);

  // Generate verification code for email testing
  const generateVerificationCode = () => {
    return `TEST-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  };

  // Handle step navigation
  const handleNext = async () => {
    if (activeStep === 0) {
      // After choosing import method - just move to next step
      // Validation will happen when saving the property
      setActiveStep((prev) => prev + 1);
      return;
    }
    
    if (activeStep === 1) {
      // After property preview, save property
      try {
        setIsProcessing(true);
        await saveProperty();
        setActiveStep((prev) => prev + 1);
      } catch (err) {
        console.error('Failed to save property:', err);
      } finally {
        setIsProcessing(false);
      }
      return;
    }
    
    if (activeStep === 2) {
      // After email setup
      if (emailConfig.testStatus !== 'success' && emailConfig.testStatus !== 'skipped') {
        // Show warning but allow to continue
        if (!window.confirm('Email forwarding has not been tested. Continue anyway?')) {
          return;
        }
        setEmailConfig({ ...emailConfig, testStatus: 'skipped' });
      }
    }
    
    // For other steps, just move forward
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
    stopMonitoring();
  };

  const handleSkip = () => {
    if (activeStep === 2) {
      setEmailConfig({ ...emailConfig, testStatus: 'skipped' });
      setActiveStep((prev) => prev + 1);
    }
  };

  const validateManualEntry = () => {
    const errors = {};
    if (!propertyData.title && !propertyData.address) {
      errors.title = 'Please enter a property title or address';
    }
    if (!propertyData.address) {
      errors.address = 'Address is required';
    }
    if (!propertyData.price_chf) {
      errors.price = 'Rent amount is required';
    }
    if (!propertyData.bedrooms) {
      errors.bedrooms = 'Number of rooms is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveProperty = async () => {
    try {
      let savedProperty;
      
      if (importMethod === 'url') {
        // Validate URL exists
        if (!propertyData.url) {
          setValidationErrors({ url: 'Please enter a property URL' });
          throw new Error('URL is required');
        }
        // Import from URL
        savedProperty = await dispatch(importPropertyFromURL({
          url: propertyData.url,
          portal: propertyData.portal || 'auto'
        })).unwrap();
      } else {
        // Validate manual entry
        if (!validateManualEntry()) {
          throw new Error('Please fill in all required fields');
        }
        // Create from manual entry
        savedProperty = await dispatch(createProperty(propertyData)).unwrap();
      }
      
      // Generate managed email for the property
      const managedEmail = `listing-${savedProperty.id}@listings.homeai.ch`;
      setEmailConfig({
        ...emailConfig,
        managedEmail,
        propertyId: savedProperty.id
      });
      
      setPropertyData(savedProperty);
      
      return savedProperty;
    } catch (err) {
      console.error('Failed to save property:', err);
      throw err;
    }
  };

  const handleComplete = () => {
    // Dispatch success action
    dispatch(setPropertyData(propertyData));
    dispatch(setEmailConfig(emailConfig));
    
    // Close modal
    onClose();
    
    // Redirect to messages or show success notification
    if (emailConfig.testStatus === 'success') {
      // Show success notification
      window.location.href = '/owner/messages';
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <ImportMethodStep
            importMethod={importMethod}
            onMethodChange={setImportMethod}
            propertyData={propertyData}
            onPropertyDataChange={setPropertyData}
            validationErrors={validationErrors}
            onValidationErrorsChange={setValidationErrors}
          />
        );
      
      case 1:
        return (
          <PropertyPreviewStep
            propertyData={propertyData}
            onEdit={(updatedData) => {
              setPropertyData(updatedData);
            }}
            importMethod={importMethod}
          />
        );
      
      case 2:
        return (
          <EmailSetupStep
            emailConfig={emailConfig}
            onConfigChange={setEmailConfig}
            propertyData={propertyData}
            onStartMonitoring={startMonitoring}
            onStopMonitoring={stopMonitoring}
            monitoringStatus={monitoringStatus}
            testResult={testResult}
          />
        );
      
      case 3:
        return (
          <CompletionStep
            propertyData={propertyData}
            emailConfig={emailConfig}
            onComplete={handleComplete}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '70vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">
            Add Property to Tenant Selection
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 4, mt: 2 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ minHeight: '400px' }}>
          {renderStepContent()}
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
          >
            Back
          </Button>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            {activeStep === 2 && (
              <Button
                onClick={handleSkip}
                variant="outlined"
              >
                Skip Testing
              </Button>
            )}
            
            {activeStep < steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={isProcessing || loading?.importingProperty || false}
              >
                {isProcessing ? 'Processing...' : activeStep === 1 ? 'Save & Continue' : 'Next'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleComplete}
                color="success"
              >
                Complete Setup
              </Button>
            )}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default PropertyImportModal;