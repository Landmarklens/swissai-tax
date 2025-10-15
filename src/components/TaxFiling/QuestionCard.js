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
  InputAdornment
} from '@mui/material';
import {
  HelpOutline,
  ArrowBack,
  ArrowForward,
  CheckCircle
} from '@mui/icons-material';

const QuestionCard = ({
  question,
  onAnswer,
  onBack,
  isSubmitting,
  previousAnswer,
  canGoBack = false
}) => {
  const { t } = useTranslation();
  const [answer, setAnswer] = useState(previousAnswer || '');
  const [multiSelectAnswers, setMultiSelectAnswers] = useState(previousAnswer || []);
  const [showHelp, setShowHelp] = useState(false);

  // Debug logging

  useEffect(() => {
    // Reset answer when question changes
    if (question.question_type === 'multiselect') {
      setMultiSelectAnswers(previousAnswer || []);
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
    } else {
      setAnswer(previousAnswer || '');
    }
  }, [question, previousAnswer]);

  const handleSubmit = () => {
    if (question.question_type === 'multiselect') {
      onAnswer(multiSelectAnswers);
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
    return answer !== '';
  };

  const renderQuestionInput = () => {
    switch (question.question_type) {
      case 'boolean':
        return (
          <RadioGroup
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          >
            <FormControlLabel value="yes" control={<Radio />} label={t("filing.yes")} />
            <FormControlLabel value="no" control={<Radio />} label="No" />
          </RadioGroup>
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
              {question.options?.options?.map((option) => (
                <MenuItem key={option} value={option}>
                  {option.replace('_', ' ').charAt(0).toUpperCase() + option.slice(1).replace('_', ' ')}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'multiselect':
        const hasNoneOption = question.options?.options?.some(opt =>
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
            {question.options?.options?.map((option) => {
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

      case 'text':
        // Handle postal code format with special validation
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
          <TextField
            type="date"
            fullWidth
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            InputLabelProps={{
              shrink: true,
            }}
          />
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
              variant="outlined"
            />
          </Box>
          <Typography variant="h5" component="h2" gutterBottom>
            {question.question_text}
          </Typography>
        </Box>
        {question.help_text && (
          <Tooltip title={showHelp ? "Hide help" : "Show help"}>
            <IconButton onClick={() => setShowHelp(!showHelp)}>
              <HelpOutline />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Help Text */}
      {showHelp && question.help_text && (
        <Box
          sx={{
            bgcolor: 'info.lighter',
            borderRadius: 1,
            p: 2,
            mb: 3,
            borderLeft: 3,
            borderColor: 'info.main'
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {question.help_text}
          </Typography>
        </Box>
      )}

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
    </Box>
  );
};

export default QuestionCard;