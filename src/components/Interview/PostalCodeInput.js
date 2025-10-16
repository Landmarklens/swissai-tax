import React, { useState, useEffect } from 'react';
import {
  TextField,
  Box,
  InputAdornment,
  CircularProgress,
  Chip,
  Alert
} from '@mui/material';
import { LocationOn, CheckCircle, Error as ErrorIcon } from '@mui/icons-material';
import { api } from '../../services/api';

/**
 * Postal Code Input Component
 * Swiss postal code input with auto-lookup for municipality and canton
 * Format: 4-digit code (1000-9999)
 *
 * @param {Object} props
 * @param {string} props.value - Current postal code value
 * @param {function} props.onChange - Callback when value changes
 * @param {function} [props.onLookup] - Callback when lookup completes with location data
 * @param {string} [props.error] - Error message
 * @param {string} props.label - Input label
 * @param {boolean} [props.required] - Whether field is required
 * @param {boolean} [props.disabled] - Whether field is disabled
 * @param {string} [props.helperText] - Custom helper text
 */
const PostalCodeInput = ({
  value,
  onChange,
  onLookup,
  error,
  label,
  required = false,
  disabled = false,
  helperText
}) => {
  const [rawValue, setRawValue] = useState(value || '');
  const [isValid, setIsValid] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [locationData, setLocationData] = useState(null);
  const [lookupError, setLookupError] = useState(null);

  /**
   * Validate postal code format
   * @param {string} code - Postal code to validate
   * @returns {boolean} Whether code is valid
   */
  const validatePostalCode = (code) => {
    // Must be exactly 4 digits
    const pattern = /^\d{4}$/;
    if (!pattern.test(code)) return false;

    // Must be in valid range
    const codeInt = parseInt(code, 10);
    return codeInt >= 1000 && codeInt <= 9999;
  };

  /**
   * Lookup postal code location
   * @param {string} code - Postal code to lookup
   */
  const lookupPostalCode = async (code) => {
    if (!validatePostalCode(code)) return;

    try {
      setIsLoading(true);
      setLookupError(null);

      const response = await api.get(`/api/tax-filing/postal-code/${code}`);

      if (response.data) {
        setLocationData(response.data);
        if (onLookup) {
          onLookup(response.data);
        }
      }
    } catch (err) {
      console.error('Postal code lookup failed:', err);

      // Distinguish between "not found" and other errors
      if (err.response?.status === 404) {
        setLookupError('This postal code is not valid or does not exist in Switzerland. Please check and try again.');
      } else if (err.response?.status === 400) {
        setLookupError(err.response?.data?.detail || 'Invalid postal code format');
      } else {
        setLookupError('Unable to verify postal code. Please try again or enter manually.');
      }
      setLocationData(null);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle input change
   */
  const handleChange = (e) => {
    // Only allow digits
    const digits = e.target.value.replace(/\D/g, '');
    // Limit to 4 digits
    const limited = digits.slice(0, 4);

    setRawValue(limited);
    setLocationData(null);
    setLookupError(null);

    const valid = validatePostalCode(limited);
    setIsValid(valid);

    // Always call onChange to update parent
    onChange(limited);
  };

  /**
   * Handle input blur - trigger lookup if valid
   */
  const handleBlur = () => {
    setIsTouched(true);

    if (isValid && rawValue) {
      lookupPostalCode(rawValue);
    }
  };

  /**
   * Update internal state when external value changes
   */
  useEffect(() => {
    if (value !== rawValue) {
      setRawValue(value || '');
      const valid = validatePostalCode(value || '');
      setIsValid(valid);

      // Auto-lookup if value is valid (debounced to prevent redundant calls)
      if (valid && value && !locationData) {
        const timeoutId = setTimeout(() => {
          lookupPostalCode(value);
        }, 300);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [value]);

  /**
   * Determine if should show error
   */
  const showError = isTouched && rawValue && !isValid;
  const hasError = !!error || showError || !!lookupError;

  /**
   * Get helper text
   */
  const getHelperText = () => {
    if (error) return error;
    if (showError) return 'Swiss postal code must be 4 digits (1000-9999)';
    if (helperText) return helperText;
    return 'Enter your 4-digit Swiss postal code';
  };

  /**
   * Get end adornment icon
   */
  const getEndAdornment = () => {
    if (isLoading) {
      return (
        <InputAdornment position="end">
          <CircularProgress size={20} />
        </InputAdornment>
      );
    }

    if (locationData && isValid) {
      return (
        <InputAdornment position="end">
          <CheckCircle color="success" />
        </InputAdornment>
      );
    }

    if (isTouched && !isValid && rawValue) {
      return (
        <InputAdornment position="end">
          <ErrorIcon color="error" />
        </InputAdornment>
      );
    }

    return (
      <InputAdornment position="end">
        <LocationOn color="action" />
      </InputAdornment>
    );
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
        placeholder="8001"
        helperText={getHelperText()}
        fullWidth
        inputProps={{
          maxLength: 4,
          inputMode: 'numeric',
          'aria-label': label,
          'data-testid': 'postal-code-input'
        }}
        InputProps={{
          endAdornment: getEndAdornment()
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            '&.Mui-focused': {
              '& fieldset': {
                borderColor: isValid && locationData ? 'success.main' : undefined
              }
            }
          }
        }}
      />

      {/* Location display */}
      {locationData && !lookupError && (
        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <Chip
            icon={<LocationOn />}
            label={`${locationData.municipality}, ${locationData.canton_name}`}
            color="primary"
            variant="outlined"
            size="medium"
          />
        </Box>
      )}

      {/* Lookup error */}
      {lookupError && isTouched && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          {lookupError}
        </Alert>
      )}
    </Box>
  );
};

export default PostalCodeInput;
