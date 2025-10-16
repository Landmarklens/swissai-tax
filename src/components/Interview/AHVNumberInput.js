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
  const [isValid, setIsValid] = useState(false);
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
   * Validate AHV number format
   * @param {string} ahv - AHV number to validate
   * @returns {boolean} Whether AHV is valid
   */
  const validateAHV = (ahv) => {
    // Basic format validation: 756.XXXX.XXXX.XX
    const pattern = /^756\.\d{4}\.\d{4}\.\d{2}$/;
    if (!pattern.test(ahv)) return false;

    // Extract digits for EAN-13 checksum validation
    const digits = ahv.replace(/\D/g, '');
    if (digits.length !== 13) return false;

    // EAN-13 checksum algorithm
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(digits[i], 10);
      sum += (i % 2 === 0) ? digit : digit * 3;
    }
    const checkDigit = (10 - (sum % 10)) % 10;

    return checkDigit === parseInt(digits[12], 10);
  };

  /**
   * Handle input change
   */
  const handleChange = (e) => {
    const formatted = formatAHV(e.target.value);
    setRawValue(formatted);

    const valid = validateAHV(formatted);
    setIsValid(valid);

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
    if (formattedValue !== rawValue && formattedValue !== formatAHV(rawValue)) {
      setRawValue(formattedValue);
      setIsValid(validateAHV(formattedValue));
    }
  }, [value]);

  /**
   * Determine if should show error
   */
  const showError = isTouched && rawValue && !isValid;
  const hasError = !!error || showError;

  /**
   * Get helper text
   */
  const getHelperText = () => {
    if (error) return error;
    if (showError) return 'Invalid AHV format. Expected: 756.XXXX.XXXX.XX';
    if (helperText) return helperText;
    return 'Format: 756.XXXX.XXXX.XX';
  };

  /**
   * Get end adornment icon
   */
  const getEndAdornment = () => {
    if (!rawValue) return null;

    if (isValid) {
      return (
        <InputAdornment position="end">
          <CheckCircle color="success" />
        </InputAdornment>
      );
    }

    if (isTouched && !isValid) {
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
                borderColor: isValid ? 'success.main' : undefined
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
