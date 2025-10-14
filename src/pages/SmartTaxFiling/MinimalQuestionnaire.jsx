import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  TextField,
  LinearProgress,
  Alert,
  Chip,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Container,
  Grid,
  IconButton,
  Tooltip,
  Fade,
  CircularProgress
} from '@mui/material';
import {
  CheckCircle,
  RadioButtonUnchecked,
  SkipNext,
  ArrowBack,
  ArrowForward,
  AutoAwesome,
  CloudUpload,
  Help
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

const MinimalQuestionnaire = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  // State management
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [aiSuggestions, setAiSuggestions] = useState({});

  // Categories for stepper
  const categories = [
    { key: 'setup', label: 'Basic Information' },
    { key: 'situation', label: 'Your Tax Situation' },
    { key: 'documents', label: 'Document Upload' },
    { key: 'review', label: 'Review & Submit' }
  ];

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/v1/ai/questions/minimal');
      setQuestions(response.data.questions);

      // Set existing answers if any
      const existingAnswers = {};
      response.data.questions.forEach(q => {
        if (q.current_answer) {
          existingAnswers[q.key] = q.current_answer;
        }
      });
      setAnswers(existingAnswers);
    } catch (err) {
      setError('Failed to load questions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionKey, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionKey]: value
    }));
  };

  const handleSkip = (questionKey) => {
    setAnswers(prev => ({
      ...prev,
      [questionKey]: 'skip'
    }));
    handleNext();
  };

  const handleNext = async () => {
    const currentQuestion = questions[currentQuestionIndex];

    // Save current answer
    if (currentQuestion && answers[currentQuestion.key]) {
      await saveAnswer(currentQuestion.key, answers[currentQuestion.key]);
    }

    // Move to next question
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // All questions answered, proceed to document upload
      navigate('/smart-tax-filing/documents');
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const saveAnswer = async (questionKey, value) => {
    try {
      setSaving(true);
      const response = await api.post('/api/v1/ai/questions/answer', [
        {
          question_key: questionKey,
          answer_value: value,
          is_skip: value === 'skip'
        }
      ], {
        params: { session_id: sessionId }
      });

      if (!sessionId && response.data.session_id) {
        setSessionId(response.data.session_id);
      }
    } catch (err) {
      console.error('Failed to save answer:', err);
    } finally {
      setSaving(false);
    }
  };

  const getCurrentCategory = () => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return 0;

    const categoryIndex = categories.findIndex(c => c.key === currentQuestion.category);
    return categoryIndex >= 0 ? categoryIndex : 0;
  };

  const getProgress = () => {
    const answeredCount = Object.keys(answers).filter(key =>
      answers[key] && answers[key] !== ''
    ).length;
    return (answeredCount / questions.length) * 100;
  };

  const renderQuestion = (question) => {
    const value = answers[question.key] || '';

    switch (question.type) {
      case 'single_choice':
        return (
          <FormControl component="fieldset" fullWidth>
            <RadioGroup
              value={value}
              onChange={(e) => handleAnswerChange(question.key, e.target.value)}
            >
              {question.options?.options?.map((option) => (
                <FormControlLabel
                  key={option}
                  value={option}
                  control={<Radio />}
                  label={option}
                  sx={{ mb: 1 }}
                />
              ))}
            </RadioGroup>
          </FormControl>
        );

      case 'text':
        return (
          <TextField
            fullWidth
            value={value}
            onChange={(e) => handleAnswerChange(question.key, e.target.value)}
            variant="outlined"
            placeholder={`Enter ${question.text.toLowerCase()}`}
            sx={{ mt: 2 }}
          />
        );

      case 'boolean':
        return (
          <FormControl component="fieldset" fullWidth>
            <RadioGroup
              value={value}
              onChange={(e) => handleAnswerChange(question.key, e.target.value)}
            >
              <FormControlLabel value="yes" control={<Radio />} label="Yes" />
              <FormControlLabel value="no" control={<Radio />} label="No" />
            </RadioGroup>
          </FormControl>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Smart Tax Filing
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Answer a few quick questions to get started. You can skip questions and let AI figure it out from your documents.
        </Typography>
      </Box>

      {/* Progress Stepper */}
      <Box mb={4}>
        <Stepper activeStep={getCurrentCategory()}>
          {categories.map((category) => (
            <Step key={category.key}>
              <StepLabel>{category.label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {/* Progress Bar */}
      <Box mb={3}>
        <Box display="flex" justifyContent="space-between" mb={1}>
          <Typography variant="body2" color="text.secondary">
            Progress
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {Math.round(getProgress())}%
          </Typography>
        </Box>
        <LinearProgress variant="determinate" value={getProgress()} sx={{ height: 8, borderRadius: 1 }} />
      </Box>

      <Grid container spacing={3}>
        {/* Main Question Card */}
        <Grid item xs={12} md={8}>
          <Fade in={true} timeout={500}>
            <Card elevation={3}>
              <CardContent sx={{ p: 4 }}>
                {/* Question Header */}
                <Box display="flex" alignItems="flex-start" mb={3}>
                  <Box flex={1}>
                    <Typography variant="h5" gutterBottom>
                      {currentQuestion?.text}
                    </Typography>

                    {currentQuestion?.help_text && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {currentQuestion.help_text}
                      </Typography>
                    )}
                  </Box>

                  {currentQuestion?.ai_extractable && (
                    <Tooltip title="AI can extract this from your documents">
                      <Chip
                        icon={<AutoAwesome />}
                        label="AI Extractable"
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Tooltip>
                  )}
                </Box>

                {/* Question Input */}
                {currentQuestion && renderQuestion(currentQuestion)}

                {/* AI Suggestion if available */}
                {aiSuggestions[currentQuestion?.key] && (
                  <Alert
                    severity="info"
                    sx={{ mt: 3 }}
                    action={
                      <Button
                        color="inherit"
                        size="small"
                        onClick={() => handleAnswerChange(currentQuestion.key, aiSuggestions[currentQuestion.key])}
                      >
                        Use Suggestion
                      </Button>
                    }
                  >
                    AI suggests: <strong>{aiSuggestions[currentQuestion.key]}</strong>
                  </Alert>
                )}

                {/* Navigation Buttons */}
                <Box display="flex" justifyContent="space-between" mt={4}>
                  <Button
                    variant="outlined"
                    startIcon={<ArrowBack />}
                    onClick={handlePrevious}
                    disabled={currentQuestionIndex === 0}
                  >
                    Previous
                  </Button>

                  <Box>
                    {currentQuestion?.skip_enabled && (
                      <Button
                        variant="outlined"
                        startIcon={<SkipNext />}
                        onClick={() => handleSkip(currentQuestion.key)}
                        sx={{ mr: 2 }}
                      >
                        Skip
                      </Button>
                    )}

                    <Button
                      variant="contained"
                      endIcon={<ArrowForward />}
                      onClick={handleNext}
                      disabled={!answers[currentQuestion?.key] && !currentQuestion?.skip_enabled}
                    >
                      {currentQuestionIndex === questions.length - 1 ? 'Continue to Documents' : 'Next'}
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Fade>
        </Grid>

        {/* Side Panel */}
        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Your Answers
              </Typography>

              <Box mt={2}>
                {questions.map((q, index) => {
                  const isAnswered = answers[q.key] && answers[q.key] !== '';
                  const isCurrent = index === currentQuestionIndex;
                  const isSkipped = answers[q.key] === 'skip';

                  return (
                    <Box
                      key={q.key}
                      display="flex"
                      alignItems="center"
                      mb={1.5}
                      sx={{
                        p: 1,
                        borderRadius: 1,
                        backgroundColor: isCurrent ? 'action.selected' : 'transparent',
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'action.hover'
                        }
                      }}
                      onClick={() => setCurrentQuestionIndex(index)}
                    >
                      {isAnswered ? (
                        isSkipped ? (
                          <SkipNext color="action" sx={{ mr: 1 }} />
                        ) : (
                          <CheckCircle color="success" sx={{ mr: 1 }} />
                        )
                      ) : (
                        <RadioButtonUnchecked color="action" sx={{ mr: 1 }} />
                      )}
                      <Box flex={1}>
                        <Typography variant="body2" noWrap>
                          {q.text}
                        </Typography>
                        {isAnswered && !isSkipped && (
                          <Typography variant="caption" color="text.secondary">
                            {answers[q.key]}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </CardContent>
          </Card>

          {/* Tips Card */}
          <Card elevation={2} sx={{ mt: 2 }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Help color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Quick Tips</Typography>
              </Box>

              <Typography variant="body2" paragraph>
                • You can skip questions if you're unsure
              </Typography>
              <Typography variant="body2" paragraph>
                • AI will extract information from your documents
              </Typography>
              <Typography variant="body2">
                • You can review and edit everything before submission
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Saving Indicator */}
      {saving && (
        <Box
          position="fixed"
          bottom={24}
          right={24}
          bgcolor="background.paper"
          boxShadow={3}
          borderRadius={2}
          p={2}
          display="flex"
          alignItems="center"
        >
          <CircularProgress size={20} sx={{ mr: 1 }} />
          <Typography variant="body2">Saving...</Typography>
        </Box>
      )}
    </Container>
  );
};

export default MinimalQuestionnaire;