import React from 'react';
import {
  Stepper,
  Step,
  StepLabel,
  Box,
  Typography,
  useTheme,
  useMediaQuery,
  MobileStepper,
  Button
} from '@mui/material';
import {
  Check as CheckIcon,
  KeyboardArrowLeft,
  KeyboardArrowRight
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const ProgressTracker = ({
  steps,
  currentStep,
  orientation = 'horizontal',
  showMobileVersion = true,
  onStepClick,
  allowStepNavigation = false
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const StepIconComponent = ({ active, completed, icon }) => {
    return (
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: completed
              ? 'success.main'
              : active
              ? 'primary.main'
              : 'grey.300',
            color: 'white',
            fontWeight: 'bold',
            cursor: allowStepNavigation ? 'pointer' : 'default',
            transition: 'all 0.3s ease',
            '&:hover': allowStepNavigation && {
              transform: 'scale(1.1)',
              boxShadow: 2
            }
          }}
        >
          {completed ? <CheckIcon /> : icon}
        </Box>
      </motion.div>
    );
  };

  const handleStepClick = (index) => {
    if (allowStepNavigation && onStepClick) {
      onStepClick(index);
    }
  };

  // Mobile version
  if (isMobile && showMobileVersion) {
    const currentStepData = steps[currentStep] || {};
    
    return (
      <Box>
        <MobileStepper
          variant="progress"
          steps={steps.length}
          position="static"
          activeStep={currentStep}
          sx={{
            background: 'transparent',
            '& .MuiLinearProgress-root': {
              width: '100%',
              height: 8,
              borderRadius: 4,
              bgcolor: 'background.lightGrey'
            },
            '& .MuiLinearProgress-bar': {
              bgcolor: 'primary.main',
              borderRadius: 4
            }
          }}
          nextButton={
            allowStepNavigation && (
              <Button
                size="small"
                onClick={() => handleStepClick(Math.min(currentStep + 1, steps.length - 1))}
                disabled={currentStep === steps.length - 1}
              >
                Weiter
                <KeyboardArrowRight />
              </Button>
            )
          }
          backButton={
            allowStepNavigation && (
              <Button
                size="small"
                onClick={() => handleStepClick(Math.max(currentStep - 1, 0))}
                disabled={currentStep === 0}
              >
                <KeyboardArrowLeft />
                Zurück
              </Button>
            )
          }
        />
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Schritt {currentStep + 1} von {steps.length}
          </Typography>
          <Typography variant="h6" sx={{ mt: 1 }}>
            {currentStepData.label}
          </Typography>
          {currentStepData.description && (
            <Typography variant="caption" color="text.secondary">
              {currentStepData.description}
            </Typography>
          )}
        </Box>
      </Box>
    );
  }

  // Desktop version
  return (
    <Stepper
      activeStep={currentStep}
      orientation={orientation}
      alternativeLabel={orientation === 'horizontal'}
      sx={{
        '& .MuiStepConnector-line': {
          borderColor: 'border.grey',
          borderTopWidth: 2
        },
        '& .MuiStepConnector-root.Mui-active .MuiStepConnector-line': {
          borderColor: 'primary.main'
        },
        '& .MuiStepConnector-root.Mui-completed .MuiStepConnector-line': {
          borderColor: 'success.main'
        }
      }}
    >
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;

        return (
          <Step key={step.id || index} completed={isCompleted}>
            <StepLabel
              StepIconComponent={(props) => (
                <div onClick={() => handleStepClick(index)}>
                  <StepIconComponent
                    {...props}
                    icon={index + 1}
                    completed={isCompleted}
                    active={isActive}
                  />
                </div>
              )}
            >
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? 'text.primary' : 'text.secondary',
                    cursor: allowStepNavigation ? 'pointer' : 'default'
                  }}
                >
                  {step.label}
                </Typography>
                {step.description && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mt: 0.5 }}
                  >
                    {step.description}
                  </Typography>
                )}
              </motion.div>
            </StepLabel>
          </Step>
        );
      })}
    </Stepper>
  );
};

export default ProgressTracker;