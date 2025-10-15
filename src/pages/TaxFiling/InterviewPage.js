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
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import QuestionCard from '../../components/TaxFiling/QuestionCard';
import ProgressBar from './components/ProgressBar';
import TaxEstimateSidebar from './components/TaxEstimateSidebar';
import { api } from '../../services/api';
import Header from '../../components/header/Header';
import Footer from '../../components/footer/Footer';

const InterviewPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { filingId } = useParams();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [filingSessionId, setFilingSessionId] = useState(filingId || null);
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
  const [questionHistory, setQuestionHistory] = useState([]); // Track question history for back button

  const autoSaveTimer = useRef(null);

  // Interview categories for stepper
  const categories = [
    t('interview.category_personal_info'),
    t('interview.category_income_sources'),
    t('interview.category_deductions'),
    t('interview.category_property_assets'),
    t('interview.category_special_situations')
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
  }, [filingId]); // Re-run when filingId changes

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
    if (!session || !filingSessionId) return;

    try {
      const response = await api.post(`/api/interview/${session}/calculate`, {
        filing_session_id: filingSessionId,
        answers: updatedAnswers
      });
      setTaxCalculation(response.data.calculation);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Tax calculation failed:', err);
      }
    }
  }, [session, filingSessionId]);

  const startInterview = async () => {
    try {
      setLoading(true);
      const requestData = {
        tax_year: 2024,
        language: 'en'
      };

      // If filingId is provided in URL, use it to resume existing filing
      if (filingId) {
        requestData.filing_session_id = filingId;
      }

      const response = await api.post('/api/interview/start', requestData);


      // Handle both camelCase (sessionId) and snake_case (session_id) from API
      const sessionId = response.data.sessionId || response.data.session_id;
      const filing_session_id = response.data.filingSessionId || response.data.filing_session_id;
      const question = response.data.currentQuestion || response.data.current_question;


      // Transform API response to match QuestionCard expected format
      const language = 'en'; // TODO: Get from i18n context
      const transformedQuestion = question ? {
        ...question,
        question_type: question.type === 'single_choice' ? 'select' :
                      question.type === 'multi_select' ? 'multiselect' :
                      question.type === 'multiple_choice' ? 'multiselect' :
                      question.type || question.question_type,
        question_text: question.text || question.question_text,
        help_text: question.help_text,
        validation_rules: question.validation_rules,
        // Handle both array of strings and array of objects
        options: question.options?.map(opt => {
          if (typeof opt === 'string') return opt;
          return {
            value: opt.value,
            label: opt.label?.[language] || opt.label?.en || opt.value
          };
        }) || []
      } : null;


      setSession(sessionId);
      setFilingSessionId(filing_session_id);
      setCurrentQuestion(transformedQuestion);
      setProgress(response.data.progress || 0);
      setError(null);
    } catch (err) {
      console.error('Interview start error:', err);
      console.error('Error details:', err.response?.data);

      // Handle specific error cases
      if (err.response?.status === 404 && filingId) {
        // Filing session not found - redirect back to filings list
        setError(t('interview.error_filing_not_found') || 'This filing session was not found. Please create a new filing or select an existing one.');
        setTimeout(() => {
          navigate('/en/filings');
        }, 3000);
      } else {
        setError(t('interview.error_start_failed') || 'Failed to start interview. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (answer) => {
    if (!session || !currentQuestion || !filingSessionId) return;

    try {
      setSubmitting(true);
      const response = await api.post(`/api/interview/${session}/answer`, {
        filing_session_id: filingSessionId,
        question_id: currentQuestion.id,
        answer: answer
      });

      // Check if answer was invalid
      if (!response.data.valid) {
        setError(response.data.error || t('interview.error_invalid_answer'));
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
        // Interview completed, show results
        navigate('/tax-filing/document-checklist', {
          state: {
            session_id: session,
            filing_session_id: filingSessionId,
            profile: response.data.profile,
            document_requirements: response.data.documentRequirements || response.data.document_requirements
          }
        });
      } else {
        // Save current question to history before moving to next one
        setQuestionHistory(prevHistory => [...prevHistory, {
          question: currentQuestion,
          questionNumber: currentQuestionNumber,
          answer: answer
        }]);

        // Transform next question format
        const nextQuestion = response.data.current_question;
        const language = 'en'; // TODO: Get from i18n context

        const transformedNextQuestion = nextQuestion ? {
          ...nextQuestion,
          question_type: nextQuestion.type === 'single_choice' ? 'select' :
                        nextQuestion.type === 'multi_select' ? 'multiselect' :
                        nextQuestion.type === 'multiple_choice' ? 'multiselect' :
                        nextQuestion.type === 'yes_no' ? 'boolean' :
                        nextQuestion.type === 'dropdown' ? 'select' :
                        nextQuestion.type || nextQuestion.question_type,
          question_text: nextQuestion.text || nextQuestion.question_text,
          help_text: nextQuestion.help_text,
          validation_rules: nextQuestion.validation || nextQuestion.validation_rules,
          // Handle both array of strings and array of objects
          options: nextQuestion.options?.map(opt => {
            if (typeof opt === 'string') return opt;
            return {
              value: opt.value,
              label: opt.label?.[language] || opt.label?.en || opt.value
            };
          }) || []
        } : null;


        setCurrentQuestion(transformedNextQuestion);
        setCurrentQuestionNumber(prev => prev + 1);
        setError(null);
      }
    } catch (err) {
      setError(t('interview.error_submit_failed'));
      console.error('Answer submission error:', err);
      console.error('Error response:', err.response?.data);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    // Can't go back if no history
    if (questionHistory.length === 0) {
      return;
    }

    // Get the last question from history
    const previousEntry = questionHistory[questionHistory.length - 1];

    // Remove the last entry from history
    setQuestionHistory(prevHistory => prevHistory.slice(0, -1));

    // Restore the previous question and state
    setCurrentQuestion(previousEntry.question);
    setCurrentQuestionNumber(previousEntry.questionNumber);

    // Clear any errors
    setError(null);

    // Recalculate progress (go back one step)
    setProgress(prev => Math.max(0, prev - (100 / totalQuestions)));
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
      <Header />
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Page Title and Save Status */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h4" fontWeight={700}>
            {t('interview.page_title')}
          </Typography>
          <Box display="flex" gap={2} alignItems="center">
            {saving && (
              <Chip
                icon={<SaveIcon />}
                label={t('interview.saving')}
                size="small"
                color="warning"
              />
            )}
            {lastSaved && !saving && (
              <Chip
                icon={<CheckCircleIcon />}
                label={t('interview.saved_time_ago', { minutes: Math.floor((new Date() - lastSaved) / 60000) })}
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
              {t('interview.save_draft')}
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
                canGoBack={questionHistory.length > 0}
              />
            </Paper>
          )}
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
    <Footer />
    </>
  );
};

export default InterviewPage;