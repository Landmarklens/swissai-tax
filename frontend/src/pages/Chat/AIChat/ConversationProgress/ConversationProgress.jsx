import React, { useState, useEffect } from 'react';
import {
  Box,
  LinearProgress,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Chip,
  IconButton,
  Collapse,
  Alert,
  Grid,
  CircularProgress
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  RadioButtonUnchecked as PendingIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Timer as TimerIcon,
  Home as HomeIcon,
  AttachMoney as BudgetIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Favorite as PreferencesIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import PropTypes from 'prop-types';

const CONVERSATION_STEPS = [
  {
    id: 'location',
    label: 'Location & Commute',
    icon: LocationIcon,
    description: 'Where do you want to live and work?',
    questions: ['Preferred area', 'Work location', 'Max commute time'],
    weight: 20
  },
  {
    id: 'budget',
    label: 'Budget & Finances',
    icon: BudgetIcon,
    description: 'Your budget and financial situation',
    questions: ['Monthly budget', 'Income', 'Price flexibility'],
    weight: 25
  },
  {
    id: 'property',
    label: 'Property Requirements',
    icon: HomeIcon,
    description: 'Type and size of property you need',
    questions: ['Property type', 'Number of rooms', 'Size requirements'],
    weight: 20
  },
  {
    id: 'timing',
    label: 'Timeline',
    icon: CalendarIcon,
    description: 'When do you need to move?',
    questions: ['Move-in date', 'Flexibility', 'Urgency'],
    weight: 15
  },
  {
    id: 'lifestyle',
    label: 'Lifestyle & Amenities',
    icon: PreferencesIcon,
    description: 'Your lifestyle needs and preferences',
    questions: ['Amenities', 'Pets', 'Family situation', 'Special requirements'],
    weight: 15
  },
  {
    id: 'additional',
    label: 'Additional Preferences',
    icon: InfoIcon,
    description: 'Any other specific requirements',
    questions: ['Neighborhood preferences', 'Building features', 'Deal breakers'],
    weight: 5
  }
];

const getEstimatedTime = ({ progress, mode }) => {
  // Quick form is much faster - fixed at 2 minutes
  if (mode === 'form') {
    if (progress >= 90) return 'Almost done!';
    if (progress >= 70) return '30 seconds';
    if (progress >= 50) return '1 minute';
    if (progress >= 30) return '1.5 minutes';
    return '2 minutes';
  } else {
    if (progress >= 90) return 'Almost done!';
    if (progress >= 70) return '2-3 minutes';
    if (progress >= 50) return '5 minutes';
    if (progress >= 30) return '7 minutes';
    return '10 minutes';
  }
};

const ConversationProgress = ({
  progress = 0,
  profileCompleted = false,
  completedSteps = [],
  currentStep = null,
  insights = [],
  onEditStep,
  onSkipStep,
  mode = 'conversation' // 'conversation' or 'form'
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  // Reset state when mode changes
  useEffect(() => {
    setShowDetails(false);
    setActiveStepIndex(0);
    console.log('🔄 ConversationProgress mode changed to:', mode);
  }, [mode]);

  // Function to handle clicking on a step
  const handleStepClick = (stepId) => {
    if (mode === 'form' && onEditStep) {
      // In quick form mode, navigate to that section
      onEditStep(stepId);
    } else if (mode === 'conversation') {
      // In conversation mode, could trigger a specific question
      console.log('Navigate to step:', stepId);
      // Could dispatch an action to send a message about this topic
    }
  };

  useEffect(() => {
    // Calculate estimated time based on remaining steps
    const remainingSteps = CONVERSATION_STEPS.filter(
      step => !completedSteps.includes(step.id)
    );
    const avgTimePerStep = mode === 'conversation' ? 2 : 1; // minutes
    setEstimatedTime(remainingSteps.length * avgTimePerStep);

    // Set active step index
    const currentIndex = CONVERSATION_STEPS.findIndex(step => step.id === currentStep);
    setActiveStepIndex(currentIndex >= 0 ? currentIndex : 0);
  }, [completedSteps, currentStep, mode]);

  const getStepProgress = (stepId) => {
    const step = CONVERSATION_STEPS.find(s => s.id === stepId);
    if (!step) return 0;

    const stepInsights = insights.filter(i =>
      i.step?.toLowerCase().includes(step.label.toLowerCase()) ||
      i.category === stepId
    );

    return Math.min((stepInsights.length / step.questions.length) * 100, 100);
  };

  const getOverallProgress = () => {
    let totalProgress = 0;
    CONVERSATION_STEPS.forEach(step => {
      const stepProgress = getStepProgress(step.id);
      totalProgress += (stepProgress * step.weight) / 100;
    });
    return Math.round(totalProgress);
  };

  const overallProgress = progress || getOverallProgress();
  const timeToCompletion = getEstimatedTime({ progress: overallProgress, mode });

  const getProgressColor = () => {
    if (overallProgress < 30) return 'error';
    if (overallProgress < 60) return 'warning';
    if (overallProgress < 90) return 'info';
    return 'success';
  };

  const formatTime = (minutes) => {
    if (minutes < 1) return 'Less than a minute';
    if (minutes === 1) return '1 minute';
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return `${hours} hour${hours > 1 ? 's' : ''} ${mins} min`;
  };

  if (mode === 'form') {
    // Simplified progress for form mode - matching chat mode styling
    return (
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          border: '2px solid',
          borderColor: profileCompleted ? 'success.main' : 'divider',
          borderRadius: 2,
          overflow: 'hidden'
        }}
      >
        {/* Header with gradient background matching chat mode */}
        <Box
          sx={{
            p: 2,
            background: profileCompleted
              ? 'linear-gradient(135deg, #66bb6a 0%, #43a047 100%)'
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                {profileCompleted ? 'Profile Complete!' : 'Building Your Profile'}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {profileCompleted
                  ? 'We have all the information needed to find your perfect home'
                  : `Estimated time: ${timeToCompletion}`}
              </Typography>
            </Box>

            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="h4" fontWeight="bold">
                {overallProgress}%
              </Typography>
            </Box>
          </Box>

          <LinearProgress
            variant="determinate"
            value={overallProgress}
            sx={{
              mt: 2,
              height: 6,
              borderRadius: 3,
              bgcolor: 'rgba(255,255,255,0.3)',
              '& .MuiLinearProgress-bar': {
                bgcolor: 'white',
                borderRadius: 3,
                transition: 'transform 0.8s ease-in-out' // Slow down animation to 0.8 seconds
              }
            }}
          />
        </Box>

        {/* Toggle Details Button - matching chat mode */}
        <Box
          sx={{
            px: 2,
            py: 1,
            bgcolor: 'grey.50',
            borderBottom: '1px solid',
            borderColor: 'divider',
            cursor: 'pointer'
          }}
          onClick={() => setShowDetails(!showDetails)}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body2" fontWeight={600}>
              {showDetails ? 'Hide' : 'Show'} Progress Details
            </Typography>
            <IconButton size="small">
              {showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>

        {/* Detailed Progress Steps for Quick Form */}
        <Collapse in={showDetails}>
          <Box sx={{ p: 2 }}>
            <Grid container spacing={2}>
              {CONVERSATION_STEPS.map((step) => {
                const stepProgress = getStepProgress(step.id);
                const isCompleted = stepProgress === 100;

                return (
                  <Grid item xs={12} sm={6} key={step.id}>
                    <Box
                      sx={{
                        p: 2,
                        border: '1px solid',
                        borderColor: isCompleted ? 'success.light' : 'divider',
                        borderRadius: 1,
                        bgcolor: isCompleted ? 'success.50' : 'background.paper',
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: isCompleted ? 'success.100' : 'grey.50'
                        }
                      }}
                      onClick={() => handleStepClick(step.id)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {step.label}
                        </Typography>
                        {isCompleted ? (
                          <CheckIcon sx={{ color: 'success.main', fontSize: 20 }} />
                        ) : (
                          <Chip
                            label={`${Math.round(stepProgress)}%`}
                            size="small"
                            color={stepProgress > 0 ? 'primary' : 'default'}
                            variant="outlined"
                          />
                        )}
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {step.description}
                      </Typography>
                      {stepProgress > 0 && stepProgress < 100 && (
                        <LinearProgress
                          variant="determinate"
                          value={stepProgress}
                          sx={{ mt: 1, height: 3, borderRadius: 1 }}
                        />
                      )}
                    </Box>
                  </Grid>
                );
              })}
            </Grid>

            {/* Completion message */}
            {profileCompleted && (
              <Alert severity="success" sx={{ mt: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Great job! Your profile is complete.
                </Typography>
                <Typography variant="body2">
                  We're now searching for properties that match your requirements.
                </Typography>
              </Alert>
            )}
          </Box>
        </Collapse>
      </Paper>
    );
  }

  // Full conversation mode UI
  return (
    <Paper
      elevation={0}
      sx={{
        mb: 3,
        border: '2px solid',
        borderColor: profileCompleted ? 'success.main' : 'divider',
        borderRadius: 2,
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          background: profileCompleted
            ? 'linear-gradient(135deg, #66bb6a 0%, #43a047 100%)'
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" fontWeight="bold">
              {profileCompleted ? 'Profile Complete!' : 'Building Your Profile'}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {profileCompleted
                ? 'We have all the information needed to find your perfect home'
                : `Estimated time: ${timeToCompletion}`}
            </Typography>
          </Box>

          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h4" fontWeight="bold">
              {overallProgress}%
            </Typography>
            {!profileCompleted && estimatedTime > 0 && (
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                ~{formatTime(estimatedTime)} remaining
              </Typography>
            )}
          </Box>
        </Box>

        <LinearProgress
          variant="determinate"
          value={overallProgress}
          sx={{
            mt: 2,
            height: 6,
            borderRadius: 3,
            bgcolor: 'rgba(255,255,255,0.3)',
            '& .MuiLinearProgress-bar': {
              bgcolor: 'white',
              borderRadius: 3
            }
          }}
        />
      </Box>

      {/* Toggle Details Button */}
      <Box
        sx={{
          px: 2,
          py: 1,
          bgcolor: 'grey.50',
          borderBottom: '1px solid',
          borderColor: 'divider',
          cursor: 'pointer'
        }}
        onClick={() => setShowDetails(!showDetails)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="body2" fontWeight={600}>
            {showDetails ? 'Hide' : 'Show'} Progress Details
          </Typography>
          <IconButton size="small">
            {showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
      </Box>

      {/* Detailed Progress Steps */}
      <Collapse in={showDetails}>
        <Box sx={{ p: 2 }}>
          <Stepper activeStep={activeStepIndex} orientation="vertical">
            {CONVERSATION_STEPS.map((step, index) => {
              const stepProgress = getStepProgress(step.id);
              const isCompleted = completedSteps.includes(step.id) || stepProgress === 100;
              const isCurrent = step.id === currentStep;
              const Icon = step.icon;

              return (
                <Step key={step.id} completed={isCompleted}>
                  <StepLabel
                    onClick={() => handleStepClick(step.id)}
                    sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
                    icon={
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: isCompleted ? 'success.main' :
                                  isCurrent ? 'primary.main' :
                                  'grey.300',
                          color: isCompleted || isCurrent ? 'white' : 'text.secondary'
                        }}
                      >
                        {isCompleted ? <CheckIcon /> : Icon ? <Icon /> : null}
                      </Box>
                    }
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {step.label}
                      </Typography>
                      {stepProgress > 0 && stepProgress < 100 && (
                        <Chip
                          label={`${Math.round(stepProgress)}%`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      )}
                      {isCompleted && (
                        <Chip
                          icon={<CheckIcon />}
                          label="Complete"
                          size="small"
                          color="success"
                        />
                      )}
                    </Box>
                  </StepLabel>

                  <StepContent>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {step.description}
                    </Typography>

                    <Box sx={{ mt: 1 }}>
                      {/* Questions checklist */}
                      <Grid container spacing={1}>
                        {step.questions.map((question, qIndex) => {
                          const hasAnswer = insights.some(i =>
                            i.text?.toLowerCase().includes(question.toLowerCase())
                          );

                          return (
                            <Grid item xs={12} key={qIndex}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {hasAnswer ? (
                                  <CheckIcon sx={{ fontSize: 16, color: 'success.main' }} />
                                ) : (
                                  <PendingIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                                )}
                                <Typography variant="caption" color={hasAnswer ? 'text.primary' : 'text.secondary'}>
                                  {question}
                                </Typography>
                              </Box>
                            </Grid>
                          );
                        })}
                      </Grid>

                      {/* Action buttons */}
                      {isCurrent && !isCompleted && (
                        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                          {onEditStep && (
                            <Button
                              size="small"
                              startIcon={<EditIcon />}
                              onClick={() => onEditStep(step.id)}
                            >
                              Answer Questions
                            </Button>
                          )}
                          {onSkipStep && (
                            <Button
                              size="small"
                              color="secondary"
                              onClick={() => onSkipStep(step.id)}
                            >
                              Skip for Now
                            </Button>
                          )}
                        </Box>
                      )}

                      {/* Progress bar for this step */}
                      {stepProgress > 0 && stepProgress < 100 && (
                        <Box sx={{ mt: 2 }}>
                          <LinearProgress
                            variant="determinate"
                            value={stepProgress}
                            sx={{ height: 4, borderRadius: 2 }}
                          />
                        </Box>
                      )}
                    </Box>
                  </StepContent>
                </Step>
              );
            })}
          </Stepper>

          {/* Completion message */}
          {profileCompleted && (
            <Alert severity="success" sx={{ mt: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Great job! Your profile is complete.
              </Typography>
              <Typography variant="body2">
                We're now searching for properties that match your requirements.
                You can still update your preferences at any time.
              </Typography>
            </Alert>
          )}

          {/* Call to action for incomplete profiles */}
          {!profileCompleted && overallProgress >= 60 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                You're {100 - overallProgress}% away from a complete profile.
                The more information you provide, the better matches we can find!
              </Typography>
            </Alert>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
};

export { ConversationProgress };

ConversationProgress.propTypes = {
  progress: PropTypes.number.isRequired,
  profileCompleted: PropTypes.bool.isRequired,
  completedSteps: PropTypes.arrayOf(PropTypes.string),
  currentStep: PropTypes.string,
  insights: PropTypes.arrayOf(PropTypes.shape({
    step: PropTypes.string,
    text: PropTypes.string,
    category: PropTypes.string
  })),
  onEditStep: PropTypes.func,
  onSkipStep: PropTypes.func,
  mode: PropTypes.oneOf(['conversation', 'form'])
};

// Default props are now handled via default parameters in the function signature