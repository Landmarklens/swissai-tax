import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import QuestionCard from '../../components/TaxFiling/QuestionCard';
import { api } from '../../services/api';

const InterviewPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [progress, setProgress] = useState(0);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Interview categories for stepper
  const categories = [
    'Personal Information',
    'Income Sources',
    'Deductions',
    'Property & Assets',
    'Special Situations'
  ];

  const getCategoryIndex = (questionId) => {
    if (!questionId) return 0;
    const num = parseInt(questionId.substring(1));
    if (num <= 2) return 0;
    if (num <= 5) return 1;
    if (num <= 10) return 2;
    if (num <= 12) return 3;
    return 4;
  };

  useEffect(() => {
    startInterview();
  }, []);

  const startInterview = async () => {
    try {
      setLoading(true);
      const response = await api.post('/api/interview/start', {
        taxYear: 2024,
        language: 'en'
      });

      setSession(response.data.sessionId);
      setCurrentQuestion(response.data.currentQuestion);
      setProgress(response.data.progress || 0);
      setError(null);
    } catch (err) {
      setError('Failed to start interview. Please try again.');
      console.error('Interview start error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (answer) => {
    if (!session || !currentQuestion) return;

    try {
      setSubmitting(true);
      const response = await api.post('/api/interview/answer', {
        sessionId: session,
        questionId: currentQuestion.id,
        answer: answer,
        language: 'en'
      });

      // Update local answers
      setAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: answer
      }));

      // Update progress and next question
      setProgress(response.data.progress);

      if (response.data.status === 'completed') {
        // Interview completed, show results
        navigate('/tax-filing/results', {
          state: {
            sessionId: session,
            requiredDocuments: response.data.requiredDocuments
          }
        });
      } else {
        setCurrentQuestion(response.data.nextQuestion);
      }
    } catch (err) {
      setError('Failed to submit answer. Please try again.');
      console.error('Answer submission error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    // TODO: Implement going back to previous question
    console.log('Go back to previous question');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom align="center" sx={{ mb: 4 }}>
        Swiss Tax Filing Interview
      </Typography>

      {/* Progress Stepper */}
      <Box sx={{ mb: 4 }}>
        <Stepper activeStep={getCategoryIndex(currentQuestion?.id)} alternativeLabel>
          {categories.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {/* Progress Bar */}
      <Box sx={{ mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="body2" color="text.secondary">
            Progress
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {progress}% Complete
          </Typography>
        </Box>
        <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 1 }} />
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Question Card */}
      {currentQuestion && (
        <Paper elevation={3} sx={{ p: 4, mb: 3 }}>
          <QuestionCard
            question={currentQuestion}
            onAnswer={handleAnswer}
            onBack={handleBack}
            isSubmitting={submitting}
            previousAnswer={answers[currentQuestion.id]}
          />
        </Paper>
      )}

      {/* Navigation Buttons */}
      <Box display="flex" justifyContent="space-between" mt={3}>
        <Button
          variant="outlined"
          onClick={() => navigate('/tax-filing')}
        >
          Save & Exit
        </Button>
        <Button
          variant="contained"
          onClick={() => console.log('Skip question')}
          disabled={submitting}
        >
          Skip Question
        </Button>
      </Box>
    </Container>
  );
};

export default InterviewPage;