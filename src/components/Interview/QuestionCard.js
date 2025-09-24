import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Select,
  MenuItem,
  InputLabel,
  FormHelperText,
  InputAdornment,
  Stack,
  Chip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

const QuestionCard = ({ question, onAnswer, onBack, loading, previousAnswer }) => {
  const [answer, setAnswer] = useState('');
  const [groupAnswers, setGroupAnswers] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    // Set previous answer if exists
    if (previousAnswer !== undefined) {
      setAnswer(previousAnswer);
    } else {
      // Reset answer when question changes
      setAnswer('');
      setGroupAnswers({});
    }
    setError('');
  }, [question, previousAnswer]);

  const handleSubmit = () => {
    // Validate required fields
    if (question.required && !answer && Object.keys(groupAnswers).length === 0) {
      setError('This field is required');
      return;
    }

    // Additional validation based on type
    if (question.validation) {
      if (question.type === 'number' || question.type === 'currency') {
        const numValue = parseFloat(answer);
        if (isNaN(numValue)) {
          setError('Please enter a valid number');
          return;
        }
        if (question.validation.min !== undefined && numValue < question.validation.min) {
          setError(`Minimum value is ${question.validation.min}`);
          return;
        }
        if (question.validation.max !== undefined && numValue > question.validation.max) {
          setError(`Maximum value is ${question.validation.max}`);
          return;
        }
      }

      if (question.type === 'text') {
        if (question.validation.minLength && answer.length < question.validation.minLength) {
          setError(`Minimum length is ${question.validation.minLength} characters`);
          return;
        }
        if (question.validation.maxLength && answer.length > question.validation.maxLength) {
          setError(`Maximum length is ${question.validation.maxLength} characters`);
          return;
        }
      }
    }

    // Submit answer based on question type
    if (question.type === 'group' && question.fields) {
      // For group questions, validate all fields
      const allFieldsValid = question.fields.every(field => {
        if (field.required) {
          return groupAnswers[field.id] && groupAnswers[field.id] !== '';
        }
        return true;
      });

      if (!allFieldsValid) {
        setError('Please fill in all required fields');
        return;
      }

      onAnswer(groupAnswers);
    } else {
      onAnswer(answer);
    }
  };

  const renderInput = () => {
    switch (question.type) {
      case 'text':
        return (
          <TextField
            fullWidth
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            error={!!error}
            helperText={error}
            placeholder="Enter your answer"
            variant="outlined"
          />
        );

      case 'number':
        return (
          <TextField
            fullWidth
            type="number"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            error={!!error}
            helperText={error}
            placeholder="Enter a number"
            variant="outlined"
            inputProps={{
              min: question.validation?.min,
              max: question.validation?.max
            }}
          />
        );

      case 'currency':
        return (
          <TextField
            fullWidth
            type="number"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            error={!!error}
            helperText={error}
            placeholder="0.00"
            variant="outlined"
            InputProps={{
              startAdornment: <InputAdornment position="start">CHF</InputAdornment>
            }}
            inputProps={{
              min: question.validation?.min || 0,
              max: question.validation?.max,
              step: 0.01
            }}
          />
        );

      case 'date':
        return (
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              value={answer || null}
              onChange={(newValue) => setAnswer(newValue ? newValue.format('YYYY-MM-DD') : '')}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: !!error,
                  helperText: error
                }
              }}
              format="dd/MM/yyyy"
            />
          </LocalizationProvider>
        );

      case 'yes_no':
        return (
          <FormControl error={!!error}>
            <RadioGroup
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            >
              <FormControlLabel value="yes" control={<Radio />} label="Yes" />
              <FormControlLabel value="no" control={<Radio />} label="No" />
            </RadioGroup>
            {error && <FormHelperText>{error}</FormHelperText>}
          </FormControl>
        );

      case 'single_choice':
        return (
          <FormControl error={!!error}>
            <RadioGroup
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            >
              {question.options?.map((option) => (
                <FormControlLabel
                  key={option.value}
                  value={option.value}
                  control={<Radio />}
                  label={option.label}
                />
              ))}
            </RadioGroup>
            {error && <FormHelperText>{error}</FormHelperText>}
          </FormControl>
        );

      case 'dropdown':
        return (
          <FormControl fullWidth error={!!error}>
            <InputLabel>Select an option</InputLabel>
            <Select
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              label="Select an option"
            >
              {question.options?.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {error && <FormHelperText>{error}</FormHelperText>}
          </FormControl>
        );

      case 'group':
        return (
          <Stack spacing={2}>
            {question.fields?.map((field) => (
              <Box key={field.id}>
                <Typography variant="subtitle2" gutterBottom>
                  {field.text}
                  {field.required && <span style={{ color: 'red' }}> *</span>}
                </Typography>
                {renderFieldInput(field)}
              </Box>
            ))}
            {error && (
              <Typography color="error" variant="caption">
                {error}
              </Typography>
            )}
          </Stack>
        );

      default:
        return (
          <TextField
            fullWidth
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            error={!!error}
            helperText={error}
            placeholder="Enter your answer"
            variant="outlined"
          />
        );
    }
  };

  const renderFieldInput = (field) => {
    const value = groupAnswers[field.id] || '';

    const handleFieldChange = (fieldId, fieldValue) => {
      setGroupAnswers(prev => ({
        ...prev,
        [fieldId]: fieldValue
      }));
    };

    switch (field.type) {
      case 'text':
        return (
          <TextField
            fullWidth
            size="small"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder="Enter value"
          />
        );

      case 'date':
        return (
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              value={value || null}
              onChange={(newValue) => handleFieldChange(field.id, newValue ? newValue.format('YYYY-MM-DD') : '')}
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: 'small'
                }
              }}
              format="dd/MM/yyyy"
            />
          </LocalizationProvider>
        );

      case 'yes_no':
        return (
          <RadioGroup
            row
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
          >
            <FormControlLabel value="yes" control={<Radio size="small" />} label="Yes" />
            <FormControlLabel value="no" control={<Radio size="small" />} label="No" />
          </RadioGroup>
        );

      case 'number':
        return (
          <TextField
            fullWidth
            size="small"
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder="Enter number"
          />
        );

      case 'currency':
        return (
          <TextField
            fullWidth
            size="small"
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder="0.00"
            InputProps={{
              startAdornment: <InputAdornment position="start">CHF</InputAdornment>
            }}
            inputProps={{
              step: 0.01,
              min: 0
            }}
          />
        );

      default:
        return (
          <TextField
            fullWidth
            size="small"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
          />
        );
    }
  };

  return (
    <Box>
      {/* Question Context (for loops) */}
      {question.context && (
        <Box sx={{ mb: 2 }}>
          <Chip
            label={`${question.context.current} of ${question.context.total}`}
            color="primary"
            size="small"
          />
        </Box>
      )}

      {/* Question Text */}
      <Typography variant="h6" gutterBottom>
        {question.text}
        {question.required && <span style={{ color: 'red' }}> *</span>}
      </Typography>

      {/* Input Field */}
      <Box sx={{ mt: 3, mb: 3 }}>
        {renderInput()}
      </Box>

      {/* Action Buttons */}
      <Stack direction="row" spacing={2} justifyContent="space-between">
        <Button
          variant="outlined"
          onClick={onBack}
          disabled={loading}
        >
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Next'}
        </Button>
      </Stack>
    </Box>
  );
};

export default QuestionCard;