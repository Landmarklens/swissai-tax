import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  FormControl,
  FormLabel,
  Select,
  MenuItem,
  InputLabel,
  Checkbox,
  FormGroup,
  IconButton,
  Tooltip,
  Chip,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  HelpOutline,
  ArrowBack,
  ArrowForward,
  CheckCircle
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import AHVNumberInput from '../Interview/AHVNumberInput';
import PostalCodeInput from '../Interview/PostalCodeInput';
import MultiCantonSelector from '../Interview/MultiCantonSelector';
import GroupQuestionInput from '../Interview/GroupQuestionInput';
import DocumentUploadQuestion from '../Interview/DocumentUploadQuestion';

const QuestionCard = ({
  question,
  onAnswer,
  onBack,
  isSubmitting,
  previousAnswer,
  canGoBack = false,
  sessionId,
  onUpload,
  autoFilled = false,
  importSource = null
}) => {
  const { t } = useTranslation();
  const [answer, setAnswer] = useState(previousAnswer || '');
  const [multiSelectAnswers, setMultiSelectAnswers] = useState(previousAnswer || []);
  const [multiCantonAnswers, setMultiCantonAnswers] = useState(previousAnswer || []);
  const [groupAnswers, setGroupAnswers] = useState(previousAnswer || []);
  const [showExplanationModal, setShowExplanationModal] = useState(false);

  // Reset answer when question changes to prevent leakage between questions
  useEffect(() => {
    // Question changed - reset state will happen in next useEffect
  }, [question.id]);

  useEffect(() => {
    // IMPORTANT: Reset answer when question changes
    // Clear any previous values to prevent leakage between questions
    if (question.question_type === 'multiselect') {
      setMultiSelectAnswers(Array.isArray(previousAnswer) ? previousAnswer : []);
    } else if (question.question_type === 'multi_canton') {
      setMultiCantonAnswers(Array.isArray(previousAnswer) ? previousAnswer : []);
    } else if (question.question_type === 'group') {
      setGroupAnswers(Array.isArray(previousAnswer) ? previousAnswer : []);
    } else if (question.question_type === 'date' && previousAnswer) {
      // Convert timestamp or invalid date to YYYY-MM-DD format
      const dateValue = new Date(previousAnswer);
      if (!isNaN(dateValue.getTime())) {
        const year = dateValue.getFullYear();
        const month = String(dateValue.getMonth() + 1).padStart(2, '0');
        const day = String(dateValue.getDate()).padStart(2, '0');
        setAnswer(`${year}-${month}-${day}`);
      } else if (typeof previousAnswer === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(previousAnswer)) {
        // Already in correct format
        setAnswer(previousAnswer);
      } else {
        setAnswer('');
      }
    } else if (question.question_type === 'boolean') {
      // FIXED: Boolean questions should only accept 'yes' or 'no', not other answer types
      const newValue = (previousAnswer === 'yes' || previousAnswer === 'no' || previousAnswer === true || previousAnswer === false)
        ? (previousAnswer === true || previousAnswer === 'yes' ? 'yes' : 'no')
        : '';
      setAnswer(newValue);
    } else if (question.question_type === 'select') {
      // FIXED: Select questions should validate that previousAnswer is in options
      const isValidOption = question.options?.some(opt => {
        const optValue = typeof opt === 'string' ? opt : opt.value;
        return optValue === previousAnswer;
      });
      const newValue = isValidOption ? previousAnswer : '';
      setAnswer(newValue);
    } else {
      // FIXED: Explicitly check if previousAnswer is undefined/null/empty
      // This prevents showing stale values from previous questions
      const newValue = (previousAnswer !== undefined && previousAnswer !== null && previousAnswer !== '')
        ? String(previousAnswer)
        : '';
      setAnswer(newValue);
    }
  }, [question.id, previousAnswer]);

  const handleSubmit = () => {
    if (question.question_type === 'multiselect') {
      onAnswer(multiSelectAnswers);
    } else if (question.question_type === 'multi_canton') {
      onAnswer(multiCantonAnswers);
    } else if (question.question_type === 'group') {
      onAnswer(groupAnswers);
    } else if (question.question_type === 'boolean') {
      onAnswer(answer === 'yes');
    } else if (question.question_type === 'number') {
      onAnswer(parseFloat(answer));
    } else {
      onAnswer(answer);
    }
  };

  const isAnswerValid = () => {
    if (question.question_type === 'multiselect') {
      return multiSelectAnswers.length > 0;
    }
    if (question.question_type === 'multi_canton') {
      return multiCantonAnswers.length > 0;
    }
    if (question.question_type === 'group') {
      // Group questions can be optional (0 entries) or required (at least 1 entry)
      if (question.validation_rules?.required) {
        return groupAnswers.length > 0;
      }
      // If not required, always valid (can skip with 0 entries)
      return true;
    }
    if (question.question_type === 'document_upload') {
      // Document upload is valid if user uploaded something or selected "bring later"
      return answer && (answer.bring_later === true || answer.document_id || answer.file_name);
    }
    if (question.question_type === 'ahv_number') {
      // AHV number must be complete and valid: 756.XXXX.XXXX.XX (13 digits)
      const pattern = /^756\.\d{4}\.\d{4}\.\d{2}$/;
      return pattern.test(answer);
    }
    return answer !== '';
  };

  // Handle Enter key press to submit answer
  const handleKeyPress = (event) => {
    // Only submit on Enter key
    if (event.key === 'Enter') {
      // Don't submit if answer is invalid or already submitting
      if (isAnswerValid() && !isSubmitting) {
        // Prevent default form submission behavior
        event.preventDefault();
        handleSubmit();
      }
    }
  };

  // Add keyboard event listener for Enter key
  useEffect(() => {
    // Only add listener for question types that support Enter submission
    const shouldListenForEnter = [
      'text', 'number', 'date', 'ahv_number', 'postal_code', 'select', 'boolean'
    ].includes(question.question_type);

    if (shouldListenForEnter) {
      document.addEventListener('keydown', handleKeyPress);
      return () => {
        document.removeEventListener('keydown', handleKeyPress);
      };
    }
  }, [answer, multiSelectAnswers, multiCantonAnswers, groupAnswers, isSubmitting, question.question_type]);

  const renderQuestionInput = () => {
    switch (question.question_type) {
      case 'ahv_number':
        return (
          <AHVNumberInput
            value={answer}
            onChange={(val) => setAnswer(val)}
            label={question.question_text}
            required={question.validation_rules?.required}
            helperText={question.help_text}
          />
        );

      case 'boolean':
        return (
          <>
            <RadioGroup
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            >
              <FormControlLabel value="yes" control={<Radio />} label={t("filing.yes")} />
              <FormControlLabel value="no" control={<Radio />} label="No" />
            </RadioGroup>

            {/* Show inline document upload when user selects "yes" */}
            {answer === 'yes' && question.inline_document_upload && (
              <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <DocumentUploadQuestion
                  question={{
                    ...question,
                    document_type: question.inline_document_upload.document_type,
                    accepted_formats: question.inline_document_upload.accepted_formats,
                    max_size_mb: question.inline_document_upload.max_size_mb,
                    bring_later: question.inline_document_upload.bring_later,
                    question_text: question.inline_document_upload.upload_text?.en ||
                                   question.inline_document_upload.upload_text,
                    help_text: question.inline_document_upload.help_text?.en ||
                               question.inline_document_upload.help_text
                  }}
                  sessionId={sessionId}
                  onUploadComplete={(uploadData) => {
                    // Store upload data with the answer
                  }}
                  onBringLater={() => {
                    // Mark as bring later
                  }}
                  onUpload={onUpload}
                />
              </Box>
            )}
          </>
        );

      case 'select':
        return (
          <FormControl fullWidth>
            <InputLabel>{question.question_text}</InputLabel>
            <Select
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              label={question.question_text}
            >
              {question.options?.map((option) => {
                // Handle both string and object formats
                const optionValue = typeof option === 'string' ? option : option.value;
                const optionLabel = typeof option === 'string'
                  ? option.replace('_', ' ').charAt(0).toUpperCase() + option.slice(1).replace('_', ' ')
                  : option.label;

                return (
                  <MenuItem key={optionValue} value={optionValue}>
                    {optionLabel}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        );

      case 'multiselect':
        const hasNoneOption = question.options?.some(opt =>
          (typeof opt === 'string' ? opt : opt.value) === 'none_of_above'
        );

        const handleMultiSelectChange = (optionValue, checked) => {
          if (optionValue === 'none_of_above' && checked) {
            // Selecting "none of above" clears all other selections
            setMultiSelectAnswers(['none_of_above']);
          } else if (checked) {
            // Selecting any other option removes "none of above"
            const filtered = multiSelectAnswers.filter(a => a !== 'none_of_above');
            setMultiSelectAnswers([...filtered, optionValue]);
          } else {
            // Unchecking
            setMultiSelectAnswers(multiSelectAnswers.filter(a => a !== optionValue));
          }
        };

        return (
          <FormGroup>
            {question.options?.map((option) => {
              // Handle both string and object formats
              const optionValue = typeof option === 'string' ? option : option.value;
              const optionLabel = typeof option === 'string'
                ? option.replace('_', ' ').charAt(0).toUpperCase() + option.slice(1).replace('_', ' ')
                : option.label;

              const isNoneOption = optionValue === 'none_of_above';
              const isDisabled = hasNoneOption && (
                (isNoneOption && multiSelectAnswers.length > 0 && !multiSelectAnswers.includes('none_of_above')) ||
                (!isNoneOption && multiSelectAnswers.includes('none_of_above'))
              );

              return (
                <FormControlLabel
                  key={optionValue}
                  control={
                    <Checkbox
                      checked={multiSelectAnswers.includes(optionValue)}
                      onChange={(e) => handleMultiSelectChange(optionValue, e.target.checked)}
                      disabled={isDisabled}
                    />
                  }
                  label={optionLabel}
                />
              );
            })}
          </FormGroup>
        );

      case 'number':
        // Only show CHF for currency fields (not for counts like number of children)
        const isCurrencyField = question.format !== 'count';
        return (
          <TextField
            type="number"
            fullWidth
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={isCurrencyField ? "Enter amount" : "Enter number"}
            InputProps={isCurrencyField ? {
              startAdornment: <InputAdornment position="start">{t('filing.chf')}</InputAdornment>,
            } : {}}
            inputProps={{
              min: question.validation_rules?.min || 0,
              max: question.validation_rules?.max
            }}
          />
        );

      case 'multi_canton':
        return (
          <MultiCantonSelector
            value={multiCantonAnswers}
            onChange={(cantons) => setMultiCantonAnswers(cantons)}
            label={question.question_text}
            required={question.validation_rules?.required}
            helperText={question.help_text}
          />
        );

      case 'postal_code':
        return (
          <PostalCodeInput
            value={answer}
            onChange={(val) => setAnswer(val)}
            onLookup={(data) => {
              // Store location data for later use
            }}
            label={question.question_text}
            required={question.validation_rules?.required}
            helperText={question.help_text}
          />
        );

      case 'group':
        return (
          <GroupQuestionInput
            question={question}
            value={groupAnswers}
            onChange={(entries) => setGroupAnswers(entries)}
            disabled={isSubmitting}
            sessionId={sessionId}
            onUpload={onUpload}
          />
        );

      case 'document_upload':
        return (
          <DocumentUploadQuestion
            question={question}
            sessionId={sessionId}
            onUploadComplete={(uploadData) => {
              // Store the uploaded document data
              setAnswer(uploadData);
            }}
            onBringLater={() => {
              // Mark as "bring later"
              setAnswer({ bring_later: true });
            }}
            onUpload={onUpload}
          />
        );

      case 'text':
        // Handle postal code format with special validation (fallback for legacy)
        const isPostalCode = question.format === 'postal_code';
        return (
          <TextField
            fullWidth
            multiline={question.id === 'Q02b' && !isPostalCode}
            rows={question.id === 'Q02b' && !isPostalCode ? 2 : 1}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={isPostalCode ? "Enter 4-digit postal code" : question.question_text}
            inputProps={isPostalCode ? {
              pattern: "\\d{4}",
              maxLength: 4,
              inputMode: "numeric"
            } : {}}
            helperText={isPostalCode && answer.length > 0 && answer.length !== 4 ? "Postal code must be exactly 4 digits" : ""}
            error={isPostalCode && answer.length > 0 && answer.length !== 4}
          />
        );

      case 'date':
        return (
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              value={answer ? dayjs(answer) : null}
              onChange={(newValue) => setAnswer(newValue ? newValue.format('YYYY-MM-DD') : '')}
              slotProps={{
                textField: {
                  fullWidth: true
                }
              }}
              format="DD.MM.YYYY"
            />
          </LocalizationProvider>
        );

      default:
        return (
          <TextField
            fullWidth
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={t("filing.enter_your_answer")}
          />
        );
    }
  };

  return (
    <Box>
      {/* Question Header */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box flex={1}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <Chip
              label={question.id}
              size="small"
              color="primary"
            />
            <Chip
              label={question.category}
              size="small"
            />
            {autoFilled && (
              <Chip
                label={`Auto-filled from ${importSource || 'imported document'}`}
                size="small"
                color="success"
                icon={<CheckCircle />}
                variant="outlined"
                sx={{
                  fontWeight: 600,
                  '& .MuiChip-icon': {
                    color: 'success.main'
                  }
                }}
              />
            )}
          </Box>
          <Typography variant="h5" component="h2" gutterBottom>
            {question.question_text}
          </Typography>
        </Box>
        {(question.explanation || question.help_text) && (
          <Tooltip title={t("filing.question_help_tooltip") || "Learn more"}>
            <IconButton onClick={() => setShowExplanationModal(true)} color="primary">
              <HelpOutline />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Question Input */}
      <Box mb={4}>
        {renderQuestionInput()}
      </Box>

      {/* Validation Rules Display */}
      {question.validation_rules && (
        <Box mb={2}>
          <Typography variant="caption" color="text.secondary">
            {question.validation_rules.required && '* This question is required'}
          </Typography>
        </Box>
      )}

      {/* Action Buttons */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Button
          startIcon={<ArrowBack />}
          onClick={onBack}
          disabled={isSubmitting || !canGoBack}
        >
          Previous
        </Button>

        <Button
          variant="contained"
          endIcon={<ArrowForward />}
          onClick={handleSubmit}
          disabled={!isAnswerValid() || isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Next'}
        </Button>
      </Box>

      {/* Explanation Modal */}
      <Dialog
        open={showExplanationModal}
        onClose={() => setShowExplanationModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <HelpOutline color="primary" />
            <Typography variant="h6">
              {t("filing.question_explanation_title") || "Why we ask this"}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1" paragraph>
            {question.explanation || question.help_text || t("filing.no_explanation_available")}
          </Typography>
          {question.explanation && question.help_text && (
            <Box mt={2} p={2} bgcolor="grey.100" borderRadius={1}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                {t("filing.additional_help") || "Additional Information"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {question.help_text}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowExplanationModal(false)} color="primary" variant="contained">
            {t("common.close") || "Close"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuestionCard;