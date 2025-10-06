import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Chip
} from '@mui/material';
import {
  Save as SaveIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import QuestionCard from '../../components/TaxFiling/QuestionCard';
import ProgressBar from './components/ProgressBar';
import TaxEstimateSidebar from './components/TaxEstimateSidebar';
import { api } from '../../services/api';
import LoggedInHeader from '../../components/loggedInHeader/loggedInHeader';

const InterviewPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(14);
  const [progress, setProgress] = useState(0);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [taxCalculation, setTaxCalculation] = useState(null);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const autoSaveTimer = useRef(null);

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

    // Cleanup on unmount
    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, []);

  const autoSave = useCallback(async () => {
    if (!session) return;

    try {
      setSaving(true);
      await api.post(`/api/interview/${session}/save`, {
        answers: answers,
        progress: progress
      });
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Auto-save failed:', err);
      }
    } finally {
      setSaving(false);
    }
  }, [session, answers, progress]);

  // Auto-save effect
  useEffect(() => {
    if (hasUnsavedChanges && session) {
      // Clear existing timer
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }

      // Set new timer for 30 seconds
      autoSaveTimer.current = setTimeout(() => {
        autoSave();
      }, 30000);
    }

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [hasUnsavedChanges, session, autoSave]);

  const updateTaxCalculation = useCallback(async (updatedAnswers) => {
    if (!session) return;

    try {
      const response = await api.post(`/api/interview/${session}/calculate`, {
        answers: updatedAnswers
      });
      setTaxCalculation(response.data.calculation);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Tax calculation failed:', err);
      }
    }
  }, [session]);

  const startInterview = async () => {
    try {
      setLoading(true);
      const response = await api.post('/api/interview/start', {
        tax_year: 2024,
        language: 'en'
      });

      // Handle both camelCase (sessionId) and snake_case (session_id) from API
      setSession(response.data.sessionId || response.data.session_id);
      setCurrentQuestion(response.data.currentQuestion || response.data.current_question);
      setProgress(response.data.progress || 0);
      setError(null);
    } catch (err) {
      setError('Failed to start interview. Please try again.');
      if (process.env.NODE_ENV === 'development') {
        console.error('Interview start error:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (answer) => {
    if (!session || !currentQuestion) return;

    try {
      setSubmitting(true);
      const response = await api.post(`/api/interview/${session}/answer`, {
        question_id: currentQuestion.id,
        answer: answer
      });

      // Check if answer was invalid
      if (!response.data.valid) {
        setError(response.data.error || 'Invalid answer. Please try again.');
        setSubmitting(false);
        return;
      }

      // Update local answers
      const updatedAnswers = {
        ...answers,
        [currentQuestion.id]: answer
      };
      setAnswers(updatedAnswers);
      setHasUnsavedChanges(true);

      // Update progress
      setProgress(response.data.progress || 0);

      // Update tax calculation
      updateTaxCalculation(updatedAnswers);

      // Check if interview is complete
      if (response.data.complete) {
        // Save before navigating
        await autoSave();
        // Interview completed, show results
        navigate('/tax-filing/document-checklist', {
          state: {
            session_id: session,
            profile: response.data.profile,
            document_requirements: response.data.document_requirements
          }
        });
      } else {
        // Set next question
        setCurrentQuestion(response.data.current_question);
        setCurrentQuestionNumber(prev => prev + 1);
        setError(null);
      }
    } catch (err) {
      setError('Failed to submit answer. Please try again.');
      if (process.env.NODE_ENV === 'development') {
        console.error('Answer submission error:', err);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    // TODO: Implement going back to previous question
    if (process.env.NODE_ENV === 'development') {
      console.log('Go back to previous question');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <LoggedInHeader />
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" fontWeight={700}>
          Swiss Tax Filing 2024
        </Typography>
        <Box display="flex" gap={2} alignItems="center">
          {saving && (
            <Chip
              icon={<SaveIcon />}
              label="Saving..."
              size="small"
              color="warning"
            />
          )}
          {lastSaved && !saving && (
            <Chip
              icon={<CheckCircleIcon />}
              label={`Saved ${Math.floor((new Date() - lastSaved) / 60000)}m ago`}
              size="small"
              color="success"
            />
          )}
          <Button
            variant="outlined"
            startIcon={<SaveIcon />}
            onClick={autoSave}
            disabled={saving || !hasUnsavedChanges}
          >
            Save Draft
          </Button>
        </Box>
      </Box>

      <Grid container spacing={4}>
        {/* Main Content */}
        <Grid item xs={12} lg={8}>
          {/* Progress Bar */}
          <ProgressBar
            currentQuestion={currentQuestionNumber}
            totalQuestions={totalQuestions}
            progress={progress}
          />

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
              onClick={() => navigate('/dashboard')}
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
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} lg={4}>
          <TaxEstimateSidebar
            calculation={taxCalculation}
            loading={loading}
          />
        </Grid>
      </Grid>
    </Container>
    </>
  );
};

export default InterviewPage;