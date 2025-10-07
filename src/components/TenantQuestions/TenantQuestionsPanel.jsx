import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  CircularProgress,
  Alert,
  IconButton,
  Collapse,
  Chip,
  Divider,
  Stack,
  Paper
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Send as SendIcon,
  QuestionAnswer as QuestionAnswerIcon,
  AccessTime as AccessTimeIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import {
  fetchOwnerQuestions,
  fetchPropertyQuestions,
  respondToQuestion,
  escalateQuestion,
  selectOwnerQuestions,
  selectRespondToQuestion
} from '../../store/slices/tenantQuestionsSlice';

const TenantQuestionsPanel = ({ propertyId = null }) => {
  const dispatch = useDispatch();
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [respondingTo, setRespondingTo] = useState(null);

  const { data: questions, isLoading, error } = useSelector(selectOwnerQuestions);
  const { isLoading: isResponding } = useSelector(selectRespondToQuestion);

  // Memoize questions to prevent unnecessary re-renders
  const memoizedQuestions = useMemo(() => questions || [], [questions]);

  // Add debug logging only in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
    }
  }, [propertyId, memoizedQuestions.length, isLoading, error]);

  useEffect(() => {
    // Only fetch if we don't have data and aren't already loading
    let isMounted = true;
    
    const fetchData = async () => {
      if (!isLoading && isMounted) {
        if (process.env.NODE_ENV === 'development') {
        }
        
        try {
          if (propertyId) {
            await dispatch(fetchPropertyQuestions({ propertyId, params: { includeAnswered: true } })).unwrap();
          } else {
            await dispatch(fetchOwnerQuestions({ includeAnswered: true })).unwrap();
          }
        } catch (error) {
          console.error('[TenantQuestionsPanel] Failed to fetch questions:', error);
        }
      }
    };
    
    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, [dispatch, propertyId]); // Remove isLoading from dependencies to prevent loops

  const handleExpandQuestion = useCallback((questionId) => {
    setExpandedQuestion(prev => prev === questionId ? null : questionId);
  }, []);

  const handleRespondToQuestion = useCallback(async (questionId) => {
    if (!responseText.trim()) return;

    try {
      await dispatch(respondToQuestion({ questionId, responseText })).unwrap();
      setResponseText('');
      setRespondingTo(null);
      // Refresh questions
      if (propertyId) {
        dispatch(fetchPropertyQuestions({ propertyId, params: { includeAnswered: true } }));
      } else {
        dispatch(fetchOwnerQuestions({ includeAnswered: true }));
      }
    } catch (error) {
      console.error('Failed to respond to question:', error);
    }
  }, [dispatch, propertyId, responseText]);

  const handleEscalateQuestion = useCallback(async (questionId) => {
    try {
      await dispatch(escalateQuestion({ 
        questionId, 
        escalationData: { escalationReason: 'Requires manual review' } 
      })).unwrap();
      // Refresh questions
      if (propertyId) {
        dispatch(fetchPropertyQuestions({ propertyId, params: { includeAnswered: true } }));
      } else {
        dispatch(fetchOwnerQuestions({ includeAnswered: true }));
      }
    } catch (error) {
      console.error('Failed to escalate question:', error);
    }
  }, [dispatch, propertyId]);

  const getQuestionStatusIcon = (question) => {
    if (question.human_response) {
      return <CheckCircleIcon color="success" />;
    } else if (question.ai_response) {
      return <CheckCircleIcon color="info" />;
    } else if (question.escalated) {
      return <WarningIcon color="warning" />;
    } else {
      return <AccessTimeIcon color="action" />;
    }
  };

  const getQuestionStatusText = (question) => {
    if (question.human_response) {
      return 'Answered by Owner';
    } else if (question.ai_response) {
      return 'Answered by AI';
    } else if (question.escalated) {
      return 'Escalated for Review';
    } else {
      return 'Pending Response';
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Failed to load tenant questions: {error}
      </Alert>
    );
  }

  if (!memoizedQuestions || memoizedQuestions.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <QuestionAnswerIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          No Tenant Questions Yet
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Questions from prospective tenants will appear here
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
        Tenant Questions ({memoizedQuestions.length})
      </Typography>

      <Stack spacing={2}>
        {memoizedQuestions.map((question) => (
          <Card key={question.id} elevation={2}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box flex={1}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    {getQuestionStatusIcon(question)}
                    <Chip 
                      label={getQuestionStatusText(question)} 
                      size="small" 
                      color={question.human_response ? 'success' : question.ai_response ? 'info' : 'default'}
                    />
                    {question.propertyAddress && (
                      <Chip 
                        label={question.propertyAddress} 
                        size="small" 
                        variant="outlined"
                      />
                    )}
                    {question.question_type && (
                      <Chip 
                        label={question.question_type} 
                        size="small" 
                        variant="outlined"
                        color="primary"
                      />
                    )}
                  </Box>
                  
                  <Typography variant="body1" sx={{ mb: 1, fontWeight: 500 }}>
                    {question.question_text}
                  </Typography>

                  <Typography variant="caption" color="text.secondary">
                    Asked {question.created_at ? format(new Date(question.created_at), 'MMM d, yyyy h:mm a') : 'recently'}
                  </Typography>
                </Box>

                <IconButton onClick={() => handleExpandQuestion(question.id)}>
                  {expandedQuestion === question.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>

              <Collapse in={expandedQuestion === question.id}>
                <Divider sx={{ my: 2 }} />
                
                {/* Show AI Response */}
                {question.ai_response && (
                  <Box sx={{ mb: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                    <Typography variant="subtitle2" color="info.dark" gutterBottom>
                      AI Response:
                    </Typography>
                    <Typography variant="body2">
                      {question.ai_response}
                    </Typography>
                  </Box>
                )}

                {/* Show Human Response */}
                {question.human_response && (
                  <Box sx={{ mb: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                    <Typography variant="subtitle2" color="success.dark" gutterBottom>
                      Your Response:
                    </Typography>
                    <Typography variant="body2">
                      {question.human_response}
                    </Typography>
                    {question.response_time && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Responded on {format(new Date(question.response_time), 'MMM d, yyyy h:mm a')}
                      </Typography>
                    )}
                  </Box>
                )}

                {/* Response Form for Unanswered Questions */}
                {!question.human_response && (
                  <Box sx={{ mt: 2 }}>
                    {respondingTo === question.id ? (
                      <Box>
                        <TextField
                          fullWidth
                          multiline
                          rows={3}
                          placeholder="Type your response..."
                          value={responseText}
                          onChange={(e) => setResponseText(e.target.value)}
                          disabled={isResponding}
                          sx={{ mb: 2 }}
                        />
                        <Box display="flex" gap={1}>
                          <Button
                            variant="contained"
                            startIcon={<SendIcon />}
                            onClick={() => handleRespondToQuestion(question.id)}
                            disabled={!responseText.trim() || isResponding}
                          >
                            Send Response
                          </Button>
                          <Button
                            variant="outlined"
                            onClick={() => {
                              setRespondingTo(null);
                              setResponseText('');
                            }}
                            disabled={isResponding}
                          >
                            Cancel
                          </Button>
                        </Box>
                      </Box>
                    ) : (
                      <Box display="flex" gap={1}>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => setRespondingTo(question.id)}
                        >
                          Respond
                        </Button>
                        {!question.escalated && (
                          <Button
                            variant="outlined"
                            size="small"
                            color="warning"
                            onClick={() => handleEscalateQuestion(question.id)}
                          >
                            Escalate
                          </Button>
                        )}
                      </Box>
                    )}
                  </Box>
                )}

                {/* Escalation Info */}
                {question.escalated && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    This question has been escalated for manual review
                    {question.escalation_reason && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Reason: {question.escalation_reason}
                      </Typography>
                    )}
                  </Alert>
                )}
              </Collapse>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  );
};

export default TenantQuestionsPanel;