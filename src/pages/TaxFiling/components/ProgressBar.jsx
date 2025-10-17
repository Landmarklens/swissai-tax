import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, LinearProgress, Stepper, Step, StepLabel } from '@mui/material';
import { useTranslation } from 'react-i18next';

const ProgressBar = ({
  currentQuestion,
  totalQuestions,
  progress,
  currentCategory = 'personal_info'
}) => {
  const { t } = useTranslation();

  const steps = [
    t('Personal Info'),
    t('Income'),
    t('Deductions'),
    t('Property & Assets'),
    t('Special Situations')
  ];

  // Map backend category to stepper index
  const categoryToStepIndex = {
    'personal_info': 0,
    'income_sources': 1,
    'deductions': 2,
    'property_assets': 3,
    'special_situations': 4
  };

  const activeStep = categoryToStepIndex[currentCategory] || 0;

  return (
    <Box sx={{ width: '100%', mb: 4 }}>
      {/* Linear Progress Bar */}
      <Box sx={{ mb: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="body2" color="text.secondary">
            {t('Question')} {currentQuestion} {t('of')} {totalQuestions}
          </Typography>
          <Typography variant="body2" fontWeight={600} color="primary">
            {progress}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 8,
            borderRadius: 4,
            backgroundColor: '#E0E0E0',
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
              backgroundColor: '#DC0018'
            }
          }}
        />
      </Box>

      {/* Step Indicator */}
      <Stepper activeStep={activeStep} alternativeLabel sx={{ mt: 3 }}>
        {steps.map((label, index) => (
          <Step key={label}>
            <StepLabel
              sx={{
                '& .MuiStepLabel-label': {
                  fontSize: '0.875rem',
                  fontWeight: activeStep === index ? 600 : 400
                },
                '& .MuiStepIcon-root': {
                  color: '#E0E0E0',
                  '&.Mui-completed': {
                    color: '#4CAF50'
                  },
                  '&.Mui-active': {
                    color: '#DC0018'
                  }
                }
              }}
            >
              {label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
};

ProgressBar.propTypes = {
  currentQuestion: PropTypes.number.isRequired,
  totalQuestions: PropTypes.number.isRequired,
  progress: PropTypes.number.isRequired,
  currentCategory: PropTypes.string
};

export default ProgressBar;
