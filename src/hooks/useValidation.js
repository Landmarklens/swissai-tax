/**
 * Custom React Hook for Form Validation using Yup
 * Provides real-time validation, error management, and field-level validation
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * useValidation Hook
 * @param {Object} schema - Yup validation schema
 * @returns {Object} Validation utilities and state
 */
export const useValidation = (schema) => {
  const { t } = useTranslation();
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isValidating, setIsValidating] = useState(false);

  /**
   * Validate entire form against schema
   * @param {Object} data - Form data to validate
   * @returns {Promise<boolean>} - True if valid, false if errors exist
   */
  const validate = useCallback(async (data) => {
    setIsValidating(true);
    try {
      await schema.validate(data, { abortEarly: false });
      setErrors({});
      setIsValidating(false);
      return true;
    } catch (err) {
      const validationErrors = {};
      if (err.inner) {
        err.inner.forEach((error) => {
          if (error.path) {
            validationErrors[error.path] = error.message;
          }
        });
      }
      setErrors(validationErrors);
      setIsValidating(false);
      return false;
    }
  }, [schema]);

  /**
   * Validate single field
   * @param {string} fieldName - Name of the field to validate
   * @param {any} value - Value to validate
   * @param {Object} formData - Complete form data for cross-field validation
   * @returns {Promise<boolean>} - True if valid, false if error
   */
  const validateField = useCallback(async (fieldName, value, formData = {}) => {
    try {
      // Create data object with the field
      const dataToValidate = { ...formData, [fieldName]: value };

      // Validate at specific path
      await schema.validateAt(fieldName, dataToValidate);

      // Clear error for this field
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });

      return true;
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        [fieldName]: err.message
      }));
      return false;
    }
  }, [schema]);

  /**
   * Mark field as touched
   * @param {string} fieldName - Name of the field
   */
  const touchField = useCallback((fieldName) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
  }, []);

  /**
   * Mark multiple fields as touched
   * @param {Array<string>} fieldNames - Array of field names
   */
  const touchFields = useCallback((fieldNames) => {
    setTouched((prev) => {
      const newTouched = { ...prev };
      fieldNames.forEach((name) => {
        newTouched[name] = true;
      });
      return newTouched;
    });
  }, []);

  /**
   * Clear all errors
   */
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  /**
   * Clear specific field error
   * @param {string} fieldName - Name of the field
   */
  const clearFieldError = useCallback((fieldName) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  /**
   * Clear all touched state
   */
  const clearTouched = useCallback(() => {
    setTouched({});
  }, []);

  /**
   * Reset validation state
   */
  const reset = useCallback(() => {
    setErrors({});
    setTouched({});
    setIsValidating(false);
  }, []);

  /**
   * Check if field has error and has been touched
   * @param {string} fieldName - Name of the field
   * @returns {boolean}
   */
  const hasError = useCallback((fieldName) => {
    return touched[fieldName] && !!errors[fieldName];
  }, [touched, errors]);

  /**
   * Get error message for field
   * @param {string} fieldName - Name of the field
   * @returns {string|null}
   */
  const getError = useCallback((fieldName) => {
    return touched[fieldName] ? errors[fieldName] : null;
  }, [touched, errors]);

  /**
   * Check if form is valid (no errors)
   * @returns {boolean}
   */
  const isValid = Object.keys(errors).length === 0;

  /**
   * Check if form has been touched
   * @returns {boolean}
   */
  const isTouched = Object.keys(touched).length > 0;

  return {
    // State
    errors,
    touched,
    isValidating,
    isValid,
    isTouched,

    // Validation methods
    validate,
    validateField,

    // Touch management
    touchField,
    touchFields,

    // Error management
    clearErrors,
    clearFieldError,
    clearTouched,

    // Utility methods
    hasError,
    getError,
    reset
  };
};

/**
 * useFieldValidation - Simplified hook for single field validation
 * @param {Object} fieldSchema - Yup schema for single field
 * @returns {Object} Field validation utilities
 */
export const useFieldValidation = (fieldSchema) => {
  const [error, setError] = useState(null);
  const [touched, setTouched] = useState(false);

  const validate = useCallback(async (value) => {
    try {
      await fieldSchema.validate(value);
      setError(null);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [fieldSchema]);

  const touch = useCallback(() => {
    setTouched(true);
  }, []);

  const clear = useCallback(() => {
    setError(null);
    setTouched(false);
  }, []);

  return {
    error: touched ? error : null,
    touched,
    validate,
    touch,
    clear,
    hasError: touched && !!error
  };
};

export default useValidation;
