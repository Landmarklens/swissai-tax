import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Box,
  Typography,
  Alert,
  Chip,
  Divider,
  Card,
  CardContent,
  Grid,
  CircularProgress
} from '@mui/material';
import {
  Home as HomeIcon,
  Settings as SettingsIcon,
  CalendarMonth as CalendarIcon,
  Email as EmailIcon,
  Check as CheckIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import PropertyImporter from './PropertyImporter';
import CriteriaBuilder from './CriteriaBuilder';
import ViewingSlotManager from './ViewingSlotManager';
import { 
  saveTenantSelectionConfig,
  fetchPropertyDetails,
  activateTenantSelection
} from '../../store/slices/tenantSelectionSlice';

const steps = [
  {
    label: 'Import Property',
    icon: <HomeIcon />,
    description: 'Import your property from a listing portal or create manually'
  },
  {
    label: 'Define Criteria',
    icon: <SettingsIcon />,
    description: 'Set your requirements for the ideal tenant'
  },
  {
    label: 'Schedule Viewings',
    icon: <CalendarIcon />,
    description: 'Create viewing slots for potential tenants'
  },
  {
    label: 'Activate & Share',
    icon: <EmailIcon />,
    description: 'Activate the system and share your managed email'
  }
];

const TenantSelectionSetup = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { propertyId } = useParams();
  const [activeStep, setActiveStep] = useState(0);
  const [setupComplete, setSetupComplete] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  
  const {
    importedProperty,
    criteria,
    viewingSlots,
    config,
    loading
  } = useSelector(state => state.tenantSelection);

  useEffect(() => {
    if (propertyId) {
      dispatch(fetchPropertyDetails(propertyId));
    }
  }, [propertyId, dispatch]);

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handlePropertyImported = (property) => {
    handleNext();
  };

  const handleCriteriaSaved = async (criteriaData) => {
    try {
      await dispatch(saveTenantSelectionConfig({
        propertyId: importedProperty?.id || propertyId,
        criteria: criteriaData
      })).unwrap();
      handleNext();
    } catch (error) {
      console.error('Failed to save criteria:', error);
    }
  };

  const handleViewingSlotsCreated = () => {
    handleNext();
  };

  const handleActivate = async () => {
    setIsActivating(true);
    try {
      const result = await dispatch(activateTenantSelection({
        propertyId: importedProperty?.id || propertyId
      })).unwrap();
      
      if (result.success) {
        setSetupComplete(true);
      }
    } catch (error) {
      console.error('Failed to activate tenant selection:', error);
    } finally {
      setIsActivating(false);
    }
  };

  const getManagedEmail = () => {
    if (config?.managed_email) return config.managed_email;
    if (importedProperty?.id) return `listing-${importedProperty.id}@listings.homeai.ch`;
    if (propertyId) return `listing-${propertyId}@listings.homeai.ch`;
    return 'Loading...';
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <PropertyImporter 
            onPropertyImported={handlePropertyImported}
            existingPropertyId={propertyId}
          />
        );
      
      case 1:
        return (
          <CriteriaBuilder
            propertyId={importedProperty?.id || propertyId}
            initialCriteria={criteria}
            onSave={handleCriteriaSaved}
            onBack={handleBack}
          />
        );
      
      case 2:
        return (
          <ViewingSlotManager
            propertyId={importedProperty?.id || propertyId}
            onComplete={handleViewingSlotsCreated}
            onBack={handleBack}
          />
        );
      
      case 3:
        return (
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Activate Tenant Selection
              </Typography>
              
              <Alert severity="success" sx={{ my: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Your managed email address:
                </Typography>
                <Typography variant="h6" sx={{ fontFamily: 'monospace' }}>
                  {getManagedEmail()}
                </Typography>
              </Alert>

              <Grid container spacing={3} sx={{ my: 2 }}>
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Property
                    </Typography>
                    <Typography variant="body1">
                      {importedProperty?.address || 'Property configured'}
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Viewing Slots
                    </Typography>
                    <Typography variant="body1">
                      {viewingSlots?.length || 0} slots created
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Selected Criteria
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {criteria?.pets_allowed && (
                        <Chip 
                          label={`Pets: ${criteria.pets_allowed}`} 
                          size="small" 
                          color={criteria.pets_allowed === 'yes' ? 'success' : 'default'}
                        />
                      )}
                      {criteria?.smoking_allowed && (
                        <Chip 
                          label={`Smoking: ${criteria.smoking_allowed}`} 
                          size="small"
                          color={criteria.smoking_allowed === 'yes' ? 'success' : 'default'}
                        />
                      )}
                      {criteria?.min_income_ratio && (
                        <Chip 
                          label={`Min Income: ${criteria.min_income_ratio}x rent`} 
                          size="small"
                          color="primary"
                        />
                      )}
                    </Box>
                  </Paper>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Typography variant="body2" color="text.secondary" paragraph>
                Once activated, the system will:
              </Typography>
              <Box sx={{ ml: 2, mb: 3 }}>
                <Typography variant="body2" color="text.secondary" paragraph>
                  • Process incoming applications to your managed email
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  • Use GPT-5 to extract and analyze applicant information
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  • Automatically allocate viewing slots based on availability
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  • Generate anonymized cards for tenant review
                </Typography>
              </Box>

              {setupComplete ? (
                <Alert severity="success" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">
                    Tenant selection is now active!
                  </Typography>
                  <Typography variant="body2">
                    Share your managed email with listing portals to start receiving applications.
                  </Typography>
                </Alert>
              ) : null}

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}>
                <Button
                  variant="outlined"
                  onClick={handleBack}
                  startIcon={<ArrowBackIcon />}
                >
                  Back
                </Button>
                
                {setupComplete ? (
                  <Button
                    variant="contained"
                    color="success"
                    onClick={() => navigate(`/tenant-selection/${importedProperty?.id || propertyId}/dashboard`)}
                    endIcon={<ArrowForwardIcon />}
                  >
                    Go to Dashboard
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleActivate}
                    disabled={isActivating}
                    startIcon={isActivating ? <CircularProgress size={20} /> : <CheckIcon />}
                  >
                    {isActivating ? 'Activating...' : 'Activate System'}
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        );
      
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Tenant Selection Setup
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Configure your automated tenant selection system powered by GPT-5
        </Typography>

        <Stepper activeStep={activeStep} orientation="vertical" sx={{ mt: 4 }}>
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel
                optional={
                  <Typography variant="caption">{step.description}</Typography>
                }
                StepLabelProps={{
                  icon: step.icon
                }}
              >
                {step.label}
              </StepLabel>
              <StepContent>
                <Box sx={{ mb: 2 }}>
                  {renderStepContent(index)}
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>

        {activeStep === steps.length && (
          <Paper square elevation={0} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Setup Complete!
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Your tenant selection system is now configured and ready to use.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate(`/tenant-selection/${importedProperty?.id || propertyId}/dashboard`)}
              endIcon={<ArrowForwardIcon />}
            >
              Go to Dashboard
            </Button>
          </Paper>
        )}
      </Paper>
    </Container>
  );
};

export default TenantSelectionSetup;