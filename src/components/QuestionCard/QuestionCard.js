import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormGroup,
  Checkbox,
  TextField,
  InputAdornment,
  Alert,
  Stack
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ArrowBack, ArrowForward } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const QuestionCard = ({
  question,
  value,
  onChange,
  onNext,
  onBack,
  error,
  isLastQuestion = false
}) => {
  const { t } = useTranslation();
  const handleCheckboxChange = (optionValue, checked) => {
    const currentValues = value || [];
    if (checked) {
      onChange([...currentValues, optionValue]);
    } else {
      onChange(currentValues.filter(v => v !== optionValue));
    }
  };

  const getInputComponent = () => {
    switch (question.type) {
      case 'single_choice':
        return (
          <RadioGroup
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          >
            {question.options.map((option) => (
              <FormControlLabel
                key={option.value}
                value={option.value}
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1">{option.label}</Typography>
                    {option.description && (
                      <Typography variant="caption" color="text.secondary">
                        {option.description}
                      </Typography>
                    )}
                  </Box>
                }
                sx={{
                  mb: 2,
                  '& .MuiFormControlLabel-label': {
                    ml: 1
                  }
                }}
              />
            ))}
          </RadioGroup>
        );

      case 'multiple_choice':
        return (
          <FormGroup>
            {question.options.map((option) => (
              <FormControlLabel
                key={option.value}
                control={
                  <Checkbox
                    checked={value?.includes(option.value) || false}
                    onChange={(e) => handleCheckboxChange(option.value, e.target.checked)}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1">{option.label}</Typography>
                    {option.description && (
                      <Typography variant="caption" color="text.secondary">
                        {option.description}
                      </Typography>
                    )}
                  </Box>
                }
                sx={{
                  mb: 2,
                  '& .MuiFormControlLabel-label': {
                    ml: 1
                  }
                }}
              />
            ))}
          </FormGroup>
        );

      case 'text':
        return (
          <TextField
            fullWidth
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            variant="outlined"
            placeholder={question.placeholder}
            multiline={question.multiline}
            rows={question.rows || 1}
            error={!!error}
            helperText={error}
          />
        );

      case 'number':
        return (
          <TextField
            fullWidth
            type="number"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            variant="outlined"
            placeholder={question.placeholder}
            error={!!error}
            helperText={error}
            InputProps={{
              startAdornment: question.prefix && (
                <InputAdornment position="start">{question.prefix}</InputAdornment>
              ),
              endAdornment: question.suffix && (
                <InputAdornment position="end">{question.suffix}</InputAdornment>
              ),
            }}
            inputProps={{
              min: question.min,
              max: question.max,
              step: question.step
            }}
          />
        );

      case 'date':
        return (
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              value={value || null}
              onChange={onChange}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  error={!!error}
                  helperText={error}
                />
              )}
              inputFormat={question.format || 'dd/MM/yyyy'}
              minDate={question.minDate}
              maxDate={question.maxDate}
            />
          </LocalizationProvider>
        );

      case 'yes_no':
        return (
          <Stack direction="row" spacing={2}>
            <Button
              variant={value === 'yes' ? 'contained' : 'outlined'}
              size="large"
              onClick={() => onChange('yes')}
              sx={{ flex: 1, py: 2 }}
            >
              Ja
            </Button>
            <Button
              variant={value === 'no' ? 'contained' : 'outlined'}
              size="large"
              onClick={() => onChange('no')}
              sx={{ flex: 1, py: 2 }}
            >
              Nein
            </Button>
          </Stack>
        );

      default:
        return null;
    }
  };

  const isValid = () => {
    if (!question.required) return true;
    if (!value) return false;
    if (question.type === 'multiple_choice' && Array.isArray(value)) {
      return value.length > 0;
    }
    return true;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card sx={{ maxWidth: 800, mx: 'auto' }}>
        <CardContent sx={{ p: 4 }}>
          {question.section && (
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ display: 'block', mb: 1 }}
            >
              {question.section}
            </Typography>
          )}

          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            {question.title}
          </Typography>

          {question.description && (
            <Typography variant="body1" color="text.secondary" paragraph>
              {question.description}
            </Typography>
          )}

          <Box sx={{ mt: 3, mb: 3 }}>
            {getInputComponent()}
          </Box>

          {question.helpText && (
            <Alert severity="info" sx={{ mt: 2, mb: 3 }}>
              {question.helpText}
            </Alert>
          )}

          {question.example && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'background.lightGrey', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Beispiel: {question.example}
              </Typography>
            </Box>
          )}

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={onBack}
              disabled={!question.canGoBack}
            >
              Zurück
            </Button>
            <Button
              variant="contained"
              endIcon={!isLastQuestion && <ArrowForward />}
              onClick={onNext}
              disabled={!isValid()}
            >
              {isLastQuestion ? 'Fertigstellen' : 'Weiter'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default QuestionCard;