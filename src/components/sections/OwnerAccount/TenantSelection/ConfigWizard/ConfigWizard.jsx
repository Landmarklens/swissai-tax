import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Stepper,
  Step,
  StepLabel,
  Button,
  Box,
  Typography,
  IconButton,
  Alert
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import EmailSetup from './EmailSetup';
import CriteriaSetup from './CriteriaSetup';
import ScoringSetup from './ScoringSetup';
import ViewingSchedule from './ViewingSchedule';
import ConfigPreview from './ConfigPreview';
import { 
  createConfig, 
  updateConfig,
  selectConfigByPropertyId 
} from '../../../../../store/slices/tenantSelectionSlice';

const steps = ['Email Setup', 'Criteria', 'Scoring', 'Viewing Schedule', 'Review'];

const ConfigWizard = ({ open, onClose, propertyId, configId = null }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    emailSettings: {
      managedEmail: '',
      forwardingEnabled: true,
      autoReplyEnabled: false,
      autoReplyTemplate: ''
    },
    hardCriteria: [],
    softCriteria: [],
    scoringWeights: {
      income: 30,
      creditScore: 25,
      references: 20,
      employmentHistory: 15,
      otherFactors: 10
    },
    viewingSettings: {
      maxInvitesPerViewing: 5,
      autoScheduleEnabled: false,
      preferredDays: [],
      preferredTimes: [],
      duration: 30,
      buffer: 15
    }
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const existingConfig = useSelector(state => 
    configId ? selectConfigByPropertyId(state, propertyId) : null
  );

  useEffect(() => {
    if (existingConfig) {
      setFormData({
        emailSettings: existingConfig.emailSettings || formData.emailSettings,
        hardCriteria: existingConfig.hardCriteria || [],
        softCriteria: existingConfig.softCriteria || [],
        scoringWeights: existingConfig.scoringWeights || formData.scoringWeights,
        viewingSettings: existingConfig.viewingSettings || formData.viewingSettings
      });
    }
  }, [existingConfig]);

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 0: // Email Setup
        if (!formData.emailSettings.managedEmail) {
          newErrors.email = t('Email is required');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailSettings.managedEmail)) {
          newErrors.email = t('Invalid email format');
        }
        break;
      case 1: // Criteria
        if (formData.hardCriteria.length === 0 && formData.softCriteria.length === 0) {
          newErrors.criteria = t('At least one criterion is required');
        }
        break;
      case 2: // Scoring
        const totalWeight = Object.values(formData.scoringWeights).reduce((sum, w) => sum + w, 0);
        if (totalWeight !== 100) {
          newErrors.scoring = t('Weights must sum to 100%');
        }
        break;
      case 3: // Viewing Schedule
        if (formData.viewingSettings.autoScheduleEnabled && formData.viewingSettings.preferredDays.length === 0) {
          newErrors.viewing = t('Select at least one preferred day');
        }
        break;
      default:
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const configData = {
        ...formData,
        propertyId
      };

      if (configId) {
        await dispatch(updateConfig({ configId, data: configData })).unwrap();
      } else {
        await dispatch(createConfig(configData)).unwrap();
      }
      
      onClose();
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setSaving(false);
    }
  };

  const updateFormData = (section, data) => {
    setFormData(prev => ({
      ...prev,
      [section]: data
    }));
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <EmailSetup
            data={formData.emailSettings}
            onChange={(data) => updateFormData('emailSettings', data)}
            errors={errors}
          />
        );
      case 1:
        return (
          <CriteriaSetup
            hardCriteria={formData.hardCriteria}
            softCriteria={formData.softCriteria}
            onHardCriteriaChange={(data) => updateFormData('hardCriteria', data)}
            onSoftCriteriaChange={(data) => updateFormData('softCriteria', data)}
            errors={errors}
          />
        );
      case 2:
        return (
          <ScoringSetup
            weights={formData.scoringWeights}
            onChange={(data) => updateFormData('scoringWeights', data)}
            errors={errors}
          />
        );
      case 3:
        return (
          <ViewingSchedule
            settings={formData.viewingSettings}
            onChange={(data) => updateFormData('viewingSettings', data)}
            errors={errors}
          />
        );
      case 4:
        return (
          <ConfigPreview
            config={formData}
            propertyId={propertyId}
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
        sx: { minHeight: '600px' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">
            {configId ? t('Edit Tenant Selection Configuration') : t('Setup Tenant Selection')}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{t(label)}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {errors.submit && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.submit}
          </Alert>
        )}

        <Box sx={{ minHeight: '400px' }}>
          {getStepContent(activeStep)}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
          >
            {t('Back')}
          </Button>
          
          <Box>
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? t('Saving...') : t('Save Configuration')}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
              >
                {t('Next')}
              </Button>
            )}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ConfigWizard;