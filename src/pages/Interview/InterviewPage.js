import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  LinearProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import QuestionCard from '../../components/Interview/QuestionCard';
import ProfileSummary from '../../components/Interview/ProfileSummary';
import DocumentChecklist from '../../components/Interview/DocumentChecklist';
import { interviewAPI } from '../../services/api';

const InterviewPage = () => {
  const navigate = useNavigate();

  // Interview state
  const [sessionId, setSessionId] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [progress, setProgress] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isComplete, setIsComplete] = useState(false);
  const [profile, setProfile] = useState(null);
  const [documentRequirements, setDocumentRequirements] = useState([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeStep, setActiveStep] = useState(0);

  // Interview sections for stepper
  const sections = [
    'Personal Information',
    'Family Status',
    'Employment',
    'Income & Benefits',
    'Deductions',
    'Property & Assets',
    'Review'
  ];

  // Start new interview on component mount
  useEffect(() => {
    startInterview();
  }, []);

  const startInterview = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await interviewAPI.startSession({
        taxYear: new Date().getFullYear(),
        language: 'en'
      });

      setSessionId(response.data.sessionId);
      setCurrentQuestion(response.data.currentQuestion);
      setProgress(response.data.progress);
    } catch (err) {
      setError('Failed to start interview. Please try again.');
      console.error('Error starting interview:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (answer) => {
    if (!sessionId || !currentQuestion) return;

    setLoading(true);
    setError(null);

    try {
      const response = await interviewAPI.submitAnswer({
        sessionId: sessionId,
        questionId: currentQuestion.id,
        answer: answer
      });

      // Store answer locally
      setAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: answer
      }));

      // Update progress
      setProgress(response.data.progress);

      // Update stepper based on question ID
      updateStepperPosition(response.data.nextQuestion?.id);

      // Check if interview is complete
      if (response.data.complete) {
        setIsComplete(true);
        setProfile(response.data.profile);
        setDocumentRequirements(response.data.documentRequirements);
        setCurrentQuestion(null);
      } else {
        setCurrentQuestion(response.data.nextQuestion);
      }
    } catch (err) {
      if (err.response?.status === 400) {
        setError(err.response.data.error || 'Invalid answer. Please check and try again.');
      } else {
        setError('Failed to submit answer. Please try again.');
      }
      console.error('Error submitting answer:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStepperPosition = (questionId) => {
    if (!questionId) return;

    // Map questions to sections
    if (questionId.startsWith('Q01') || questionId.startsWith('Q02')) {
      setActiveStep(0); // Personal Information
    } else if (questionId.startsWith('Q03')) {
      setActiveStep(1); // Family Status
    } else if (questionId.startsWith('Q04')) {
      setActiveStep(2); // Employment
    } else if (['Q05', 'Q06', 'Q07'].includes(questionId)) {
      setActiveStep(3); // Income & Benefits
    } else if (['Q08', 'Q11', 'Q12', 'Q13', 'Q14'].includes(questionId.substring(0, 3))) {
      setActiveStep(4); // Deductions
    } else if (['Q09', 'Q10'].includes(questionId.substring(0, 3))) {
      setActiveStep(5); // Property & Assets
    }
  };

  const handleBack = () => {
    // In a real implementation, we'd need to support going back
    // For now, just show a message
    alert('Going back is not yet implemented. Your answers are saved.');
  };

  const handleStartOver = () => {
    setIsComplete(false);
    setProfile(null);
    setDocumentRequirements([]);
    setAnswers({});
    setProgress(0);
    setActiveStep(0);
    startInterview();
  };

  const handleContinueToDocuments = () => {
    // Navigate to document upload page with session data
    navigate('/documents', {
      state: {
        sessionId,
        profile,
        documentRequirements
      }
    });
  };

  if (loading && !currentQuestion) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading interview...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom align="center">
        Swiss Tax Interview {new Date().getFullYear()}
      </Typography>

      {/* Progress Bar */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Progress
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {progress}%
          </Typography>
        </Box>
        <LinearProgress variant="determinate" value={progress} />
      </Box>

      {/* Stepper */}
      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
        {sections.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Main Content */}
      {!isComplete && currentQuestion && (
        <Card>
          <CardContent>
            <QuestionCard
              question={currentQuestion}
              onAnswer={handleAnswer}
              onBack={handleBack}
              loading={loading}
              previousAnswer={answers[currentQuestion.id]}
            />
          </CardContent>
        </Card>
      )}

      {/* Interview Complete */}
      {isComplete && (
        <Box>
          <Alert severity="success" sx={{ mb: 3 }}>
            <Typography variant="h6">Interview Complete!</Typography>
            <Typography>
              We've gathered all the information needed for your tax filing.
            </Typography>
          </Alert>

          <ProfileSummary profile={profile} answers={answers} />

          <Box sx={{ mt: 3 }}>
            <DocumentChecklist requirements={documentRequirements} />
          </Box>

          <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="outlined"
              onClick={handleStartOver}
            >
              Start Over
            </Button>
            <Button
              variant="contained"
              onClick={handleContinueToDocuments}
              color="primary"
            >
              Continue to Document Upload
            </Button>
          </Box>
        </Box>
      )}
    </Container>
  );
};

export default InterviewPage;