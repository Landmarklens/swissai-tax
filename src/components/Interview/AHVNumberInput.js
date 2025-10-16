import React, { useState, useEffect } from 'react';
import {
  TextField,
  FormHelperText,
  Box,
  InputAdornment,
  IconButton,
  Tooltip
} from '@mui/material';
import { Help as HelpIcon, CheckCircle, Error as ErrorIcon } from '@mui/icons-material';

/**
 * AHV Number Input Component
 * Swiss social security number input with auto-formatting and validation
 * Format: 756.XXXX.XXXX.XX
 *
 * @param {Object} props
 * @param {string} props.value - Current AHV number value
 * @param {function} props.onChange - Callback when value changes
 * @param {string} [props.error] - Error message
 * @param {string} props.label - Input label
 * @param {boolean} [props.required] - Whether field is required
 * @param {boolean} [props.disabled] - Whether field is disabled
 * @param {string} [props.helperText] - Custom helper text
 */
const AHVNumberInput = ({
  value,
  onChange,
  error,
  label,
  required = false,
  disabled = false,
  helperText
}) => {
  const [rawValue, setRawValue] = useState(value || '');
  const [validationResult, setValidationResult] = useState({ isValid: false, errorKey: null });
  const [isTouched, setIsTouched] = useState(false);

  /**
   * Format AHV number as user types
   * @param {string} input - Raw input string
   * @returns {string} Formatted AHV number
   */
  const formatAHV = (input) => {
    // Remove all non-digits
    const digits = input.replace(/\D/g, '');

    // Limit to 13 digits max
    const limited = digits.slice(0, 13);

    // Format as 756.XXXX.XXXX.XX
    if (limited.length <= 3) return limited;
    if (limited.length <= 7) return `${limited.slice(0, 3)}.${limited.slice(3)}`;
    if (limited.length <= 11) {
      return `${limited.slice(0, 3)}.${limited.slice(3, 7)}.${limited.slice(7)}`;
    }
    return `${limited.slice(0, 3)}.${limited.slice(3, 7)}.${limited.slice(7, 11)}.${limited.slice(11, 13)}`;
  };

  /**
   * Validate AHV number format and return detailed error
   * @param {string} ahv - AHV number to validate
   * @returns {Object} { isValid: boolean, errorKey: string|null }
   */
  const validateAHV = (ahv) => {
    if (!ahv) return { isValid: false, errorKey: null };

    // Check if we have any digits
    const digits = ahv.replace(/\D/g, '');

    // Check length first
    if (digits.length < 13) {
      return { isValid: false, errorKey: 'incomplete' };
    }

    if (digits.length !== 13) {
      return { isValid: false, errorKey: 'length' };
    }

    // Check country code (must be 756 for Switzerland)
    if (!digits.startsWith('756')) {
      return { isValid: false, errorKey: 'country_code' };
    }

    // Basic format validation: 756.XXXX.XXXX.XX
    const pattern = /^756\.\d{4}\.\d{4}\.\d{2}$/;
    if (!pattern.test(ahv)) {
      return { isValid: false, errorKey: 'format' };
    }

    // EAN-13 checksum algorithm
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(digits[i], 10);
      sum += (i % 2 === 0) ? digit : digit * 3;
    }
    const checkDigit = (10 - (sum % 10)) % 10;

    if (checkDigit !== parseInt(digits[12], 10)) {
      return { isValid: false, errorKey: 'checksum' };
    }

    return { isValid: true, errorKey: null };
  };

  /**
   * Handle input change
   */
  const handleChange = (e) => {
    const formatted = formatAHV(e.target.value);
    setRawValue(formatted);

    const result = validateAHV(formatted);
    setValidationResult(result);

    // Always call onChange to update parent state
    // Validation is shown to user but doesn't block state updates
    onChange(formatted);
  };

  /**
   * Handle input blur
   */
  const handleBlur = () => {
    setIsTouched(true);
  };

  /**
   * Update internal state when external value changes
   * Only sync when value prop changes from parent (not from user input)
   */
  useEffect(() => {
    // Only update if parent's value is different AND not caused by user typing
    // This prevents the useEffect from fighting with user input
    const formattedValue = value || '';

    // FIX: Always clear rawValue when parent sends empty string
    // This handles question transitions where previous text needs to be cleared
    if (formattedValue === '' && rawValue !== '') {
      console.log('[AHVNumberInput] Clearing rawValue:', {oldValue: rawValue, newValue: ''});
      setRawValue('');
      setValidationResult({ isValid: false, errorKey: null });
      return;
    }

    if (formattedValue !== rawValue && formattedValue !== formatAHV(rawValue)) {
      console.log('[AHVNumberInput] Updating rawValue:', {oldValue: rawValue, newValue: formattedValue});
      setRawValue(formattedValue);
      setValidationResult(validateAHV(formattedValue));
    }
  }, [value]);

  /**
   * Determine if should show error
   */
  const showError = isTouched && rawValue && !validationResult.isValid;
  const hasError = !!error || showError;

  /**
   * Get specific error message based on validation result
   */
  const getErrorMessage = (errorKey) => {
    switch (errorKey) {
      case 'country_code':
        return 'Swiss AHV numbers must start with 756 (not 755 or other codes)';
      case 'incomplete':
        return 'Please complete the AHV number (13 digits required)';
      case 'length':
        return 'AHV number must be exactly 13 digits';
      case 'format':
        return 'Invalid format. Expected: 756.XXXX.XXXX.XX';
      case 'checksum':
        return 'Invalid AHV number - checksum validation failed';
      default:
        return 'Invalid AHV format. Expected: 756.XXXX.XXXX.XX';
    }
  };

  /**
   * Get helper text
   */
  const getHelperText = () => {
    if (error) return error;
    if (showError && validationResult.errorKey) {
      return getErrorMessage(validationResult.errorKey);
    }
    if (helperText) return helperText;
    return 'Format: 756.XXXX.XXXX.XX';
  };

  /**
   * Get end adornment icon
   */
  const getEndAdornment = () => {
    if (!rawValue) return null;

    if (validationResult.isValid) {
      return (
        <InputAdornment position="end">
          <CheckCircle color="success" />
        </InputAdornment>
      );
    }

    if (isTouched && !validationResult.isValid) {
      return (
        <InputAdornment position="end">
          <ErrorIcon color="error" />
        </InputAdornment>
      );
    }

    return null;
  };

  return (
    <Box sx={{ width: '100%' }}>
      <TextField
        label={label}
        value={rawValue}
        onChange={handleChange}
        onBlur={handleBlur}
        required={required}
        disabled={disabled}
        error={hasError}
        placeholder="756.1234.5678.97"
        helperText={getHelperText()}
        fullWidth
        inputProps={{
          maxLength: 16, // 756.XXXX.XXXX.XX (13 digits + 3 dots)
          'aria-label': label,
          'data-testid': 'ahv-number-input'
        }}
        InputProps={{
          endAdornment: getEndAdornment(),
          startAdornment: (
            <InputAdornment position="start">
              <Tooltip
                title="Your Swiss social security number (AHV/AVS/AVS). Format: 756.XXXX.XXXX.XX"
                arrow
              >
                <IconButton size="small" edge="start">
                  <HelpIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </InputAdornment>
          )
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            '&.Mui-focused': {
              '& fieldset': {
                borderColor: validationResult.isValid ? 'success.main' : undefined
              }
            }
          }
        }}
      />
      <FormHelperText sx={{ ml: 2, mt: 0.5 }}>
        Your Swiss social security number (AHV/AVS/AVS)
      </FormHelperText>
    </Box>
  );
};

export default AHVNumberInput;
