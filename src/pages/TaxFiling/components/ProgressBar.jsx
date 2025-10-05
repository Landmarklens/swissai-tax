import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, LinearProgress, Stepper, Step, StepLabel } from '@mui/material';
import { useTranslation } from 'react-i18next';

const ProgressBar = ({ currentQuestion, totalQuestions, progress }) => {
  const { t } = useTranslation();

  const steps = [
    t('Personal Info'),
    t('Income'),
    t('Deductions'),
    t('Review')
  ];

  // Calculate which step we're on based on current question
  const getActiveStep = (currentQ) => {
    if (currentQ <= 4) return 0; // Questions 1-4: Personal Info
    if (currentQ <= 9) return 1; // Questions 5-9: Income
    if (currentQ <= 13) return 2; // Questions 10-13: Deductions
    return 3; // Question 14+: Review
  };

  const activeStep = getActiveStep(currentQuestion);

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
  progress: PropTypes.number.isRequired
};

export default ProgressBar;
