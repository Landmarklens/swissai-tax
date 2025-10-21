import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Chip,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider,
  Alert,
  IconButton,
  Select,
  MenuItem
} from '@mui/material';
import {
  Add,
  Delete,
  Edit,
  CheckCircle,
  ArrowBack
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import PostalCodeInput from './PostalCodeInput';
import DocumentUploadQuestion from './DocumentUploadQuestion';

/**
 * Group Question Input Component
 * Handles group-type questions with looping (e.g., child information, employer information)
 *
 * @param {Object} props
 * @param {Object} props.question - Question object with fields array
 * @param {Array} props.value - Array of completed entries
 * @param {function} props.onChange - Callback when entries change
 * @param {boolean} [props.disabled] - Whether input is disabled
 */
const GroupQuestionInput = ({
  question,
  value = [],
  onChange,
  disabled = false,
  sessionId,
  onUpload
}) => {
  const [entries, setEntries] = useState(value || []);
  const [currentEntry, setCurrentEntry] = useState({});
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);

  // Use ref to track if we're in the middle of an update to prevent loops
  const isUpdatingRef = useRef(false);
  const previousValueRef = useRef(value);

  /**
   * Update internal state when external value changes
   * FIXED: Only sync when prop value changes, not when internal state changes
   */
  useEffect(() => {
    // Skip if we're currently updating or value hasn't changed
    if (isUpdatingRef.current || JSON.stringify(value) === JSON.stringify(previousValueRef.current)) {
      return;
    }

    // Update entries only if external value is different
    if (JSON.stringify(value) !== JSON.stringify(entries)) {
      previousValueRef.current = value;
      setEntries(value || []);
    }
  }, [value]);

  /**
   * Update parent when entries change
   * FIXED: Use ref to prevent infinite loop
   */
  useEffect(() => {
    // Skip if entries match the current value (no real change)
    if (JSON.stringify(entries) === JSON.stringify(value)) {
      return;
    }

    // Mark that we're updating to prevent the other useEffect from running
    isUpdatingRef.current = true;
    onChange(entries);

    // Reset flag after a tick to allow future updates
    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 0);
  }, [entries]);

  /**
   * Initialize current entry with empty fields
   */
  const initializeEntry = () => {
    const emptyEntry = {};
    question.fields?.forEach(field => {
      emptyEntry[field.id] = '';
    });
    return emptyEntry;
  };

  /**
   * Start adding a new entry
   */
  const handleAddNew = () => {
    setCurrentEntry(initializeEntry());
    setIsAddingNew(true);
    setEditingIndex(null);
  };

  /**
   * Start editing an existing entry
   */
  const handleEdit = (index) => {
    setCurrentEntry({ ...entries[index] });
    setEditingIndex(index);
    setIsAddingNew(true);
  };

  /**
   * Delete an entry
   */
  const handleDelete = (index) => {
    const newEntries = entries.filter((_, i) => i !== index);
    setEntries(newEntries);
  };

  /**
   * Save current entry
   */
  const handleSave = () => {
    if (!isEntryValid()) return;

    let newEntries;
    if (editingIndex !== null) {
      // Update existing entry
      newEntries = entries.map((entry, i) =>
        i === editingIndex ? currentEntry : entry
      );
    } else {
      // Add new entry
      newEntries = [...entries, currentEntry];
    }

    setEntries(newEntries);
    setCurrentEntry({});
    setIsAddingNew(false);
    setEditingIndex(null);
  };

  /**
   * Cancel adding/editing
   */
  const handleCancel = () => {
    setCurrentEntry({});
    setIsAddingNew(false);
    setEditingIndex(null);
  };

  /**
   * Check if current entry is valid
   */
  const isEntryValid = () => {
    if (!question.fields) return false;

    // Check all required fields are filled
    return question.fields.every(field => {
      if (field.validation?.required || field.required) {
        const value = currentEntry[field.id];

        // Special validation for document upload fields
        if (field.type === 'document_upload') {
          // Valid if: uploaded a document OR selected "bring later"
          return value && (value.bring_later === true || value.document_id || value.file_name);
        }

        // Standard validation for other field types
        return value !== '' && value !== null && value !== undefined;
      }
      return true;
    });
  };

  /**
   * Render input field based on type
   */
  const renderField = (field) => {
    const value = currentEntry[field.id] || '';
    const language = 'en'; // TODO: Get from i18n context
    const fieldLabel = field.text?.[language] || field.text?.en || field.id;

    const handleChange = (newValue) => {
      setCurrentEntry({
        ...currentEntry,
        [field.id]: newValue
      });
    };

    switch (field.type) {
      case 'text':
        return (
          <TextField
            key={field.id}
            fullWidth
            label={fieldLabel}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            required={field.validation?.required}
            placeholder={fieldLabel}
            sx={{ mb: 2 }}
          />
        );

      case 'date':
        return (
          <LocalizationProvider key={field.id} dateAdapter={AdapterDayjs}>
            <DatePicker
              label={fieldLabel}
              value={value ? dayjs(value) : null}
              onChange={(newValue) => handleChange(newValue ? newValue.format('YYYY-MM-DD') : '')}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: field.validation?.required,
                  sx: { mb: 2 }
                }
              }}
              format="DD.MM.YYYY"
            />
          </LocalizationProvider>
        );

      case 'yes_no':
      case 'boolean':
        return (
          <FormControl key={field.id} fullWidth sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {fieldLabel}
              {field.validation?.required && ' *'}
            </Typography>
            <RadioGroup
              value={value ? (value === true || value === 'yes' ? 'yes' : 'no') : ''}
              onChange={(e) => handleChange(e.target.value)}
            >
              <FormControlLabel value="yes" control={<Radio />} label="Yes" />
              <FormControlLabel value="no" control={<Radio />} label="No" />
            </RadioGroup>
          </FormControl>
        );

      case 'number':
        return (
          <TextField
            key={field.id}
            type="number"
            fullWidth
            label={fieldLabel}
            value={value}
            onChange={(e) => handleChange(parseFloat(e.target.value) || 0)}
            required={field.validation?.required}
            placeholder={fieldLabel}
            inputProps={{
              min: field.validation?.min || 0,
              max: field.validation?.max,
              step: field.validation?.step || 1
            }}
            sx={{ mb: 2 }}
          />
        );

      case 'dropdown':
        return (
          <FormControl key={field.id} fullWidth sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {fieldLabel}
              {field.validation?.required && ' *'}
            </Typography>
            <Select
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              displayEmpty
            >
              <MenuItem value="" disabled>
                <em>Select an option</em>
              </MenuItem>
              {field.options?.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'postal_code':
        return (
          <Box key={field.id} sx={{ mb: 2 }}>
            <PostalCodeInput
              value={value}
              onChange={(newValue) => handleChange(newValue)}
              label={fieldLabel}
              required={field.validation?.required || field.required}
            />
          </Box>
        );

      case 'document_upload':
        return (
          <Box key={field.id} sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {fieldLabel}
              {field.required && ' *'}
            </Typography>
            {field.help_text?.[language] && (
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                {field.help_text[language]}
              </Typography>
            )}
            <DocumentUploadQuestion
              question={{
                ...field,
                question_text: fieldLabel,
                document_type: field.document_type,
                accepted_formats: field.accepted_formats,
                max_size_mb: field.max_size_mb,
                bring_later: field.bring_later,
                help_text: field.help_text?.[language] || field.help_text
              }}
              sessionId={sessionId}
              onUpload={onUpload}
              onUploadComplete={(uploadData) => {
                handleChange(uploadData);
              }}
              onBringLater={() => {
                handleChange({ bring_later: true });
              }}
            />
          </Box>
        );

      default:
        return (
          <TextField
            key={field.id}
            fullWidth
            label={fieldLabel}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            required={field.validation?.required}
            placeholder={fieldLabel}
            sx={{ mb: 2 }}
          />
        );
    }
  };

  /**
   * Render summary of an entry
   */
  const renderEntrySummary = (entry, index) => {
    const language = 'en';
    const fields = question.fields || [];

    return (
      <Paper
        key={index}
        elevation={1}
        sx={{
          p: 2,
          mb: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          bgcolor: 'background.default'
        }}
      >
        <Box flex={1}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <Chip
              icon={<CheckCircle />}
              label={`Entry ${index + 1}`}
              size="small"
              color="success"
              variant="outlined"
            />
          </Box>
          {fields.filter(field => {
            // Filter out conditional fields that shouldn't be displayed
            if (!field.conditional) return true;

            const conditionalFieldId = field.conditional.field;
            const requiredValue = field.conditional.value;
            const currentValue = entry[conditionalFieldId];

            if (typeof requiredValue === 'boolean') {
              return currentValue === requiredValue || currentValue === requiredValue.toString();
            }

            return currentValue === requiredValue;
          }).map(field => {
            const fieldLabel = field.text?.[language] || field.text?.en || field.id;
            const fieldValue = entry[field.id];

            // Format value based on type
            let displayValue = fieldValue;
            if (field.type === 'yes_no' || field.type === 'boolean') {
              displayValue = (fieldValue === 'yes' || fieldValue === true) ? 'Yes' : 'No';
            } else if (field.type === 'date' && fieldValue) {
              displayValue = new Date(fieldValue).toLocaleDateString();
            } else if (field.type === 'document_upload' && fieldValue) {
              // Handle document upload display
              if (fieldValue.bring_later) {
                displayValue = 'Will bring later';
              } else if (fieldValue.file_name) {
                displayValue = `✓ ${fieldValue.file_name}`;
              } else if (fieldValue.document_id) {
                displayValue = '✓ Document uploaded';
              } else {
                displayValue = '—';
              }
            }

            return (
              <Typography key={field.id} variant="body2" sx={{ mb: 0.5 }}>
                <strong>{fieldLabel}:</strong> {displayValue || '—'}
              </Typography>
            );
          })}
        </Box>
        <Box display="flex" gap={1}>
          <IconButton
            size="small"
            onClick={() => handleEdit(index)}
            disabled={disabled}
          >
            <Edit fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => handleDelete(index)}
            disabled={disabled}
          >
            <Delete fontSize="small" />
          </IconButton>
        </Box>
      </Paper>
    );
  };

  const expectedCount = question.expected_count || null;
  const remainingCount = expectedCount ? Math.max(0, expectedCount - entries.length) : null;

  return (
    <Box sx={{ width: '100%' }}>
      {/* Progress indicator if expected count is known */}
      {expectedCount && (
        <Alert
          severity={entries.length >= expectedCount ? "success" : "info"}
          sx={{ mb: 2 }}
        >
          {entries.length >= expectedCount
            ? `All ${expectedCount} entries completed!`
            : `Progress: ${entries.length} of ${expectedCount} entries completed. ${remainingCount} remaining.`}
        </Alert>
      )}

      {/* Existing Entries */}
      {entries.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" fontWeight={600} sx={{ mb: 2 }}>
            Added Entries ({entries.length}{expectedCount ? ` of ${expectedCount}` : ''}):
          </Typography>
          {entries.map((entry, index) => renderEntrySummary(entry, index))}
        </Box>
      )}

      {/* Add/Edit Form */}
      {isAddingNew ? (
        <Paper elevation={2} sx={{ p: 3, mb: 2, bgcolor: 'background.paper' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              {editingIndex !== null
                ? `Edit Entry ${editingIndex + 1}`
                : `Add New Entry${entries.length > 0 ? ` (${entries.length + 1})` : ''}`
              }
            </Typography>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Render all fields (conditionally based on field dependencies) */}
          {question.fields?.filter(field => {
            // If field has no conditional, always show it
            if (!field.conditional) return true;

            // Check if conditional field has the required value
            const conditionalFieldId = field.conditional.field;
            const requiredValue = field.conditional.value;
            const currentValue = currentEntry[conditionalFieldId];

            // Handle boolean comparisons (true/false vs 'true'/'false' string)
            if (typeof requiredValue === 'boolean') {
              return currentValue === requiredValue || currentValue === requiredValue.toString();
            }

            return currentValue === requiredValue;
          }).map(field => renderField(field))}

          {/* Action Buttons */}
          <Box display="flex" gap={2} justifyContent="space-between" mt={3}>
            <Button
              variant="text"
              size="small"
              onClick={handleCancel}
              startIcon={<ArrowBack />}
              sx={{ color: 'text.secondary' }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              size="large"
              onClick={handleSave}
              disabled={!isEntryValid()}
              startIcon={<CheckCircle />}
              sx={{
                minWidth: 180,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600,
                textTransform: 'none'
              }}
            >
              {editingIndex !== null ? 'Update Entry' : 'Add Entry'}
            </Button>
          </Box>
        </Paper>
      ) : (
        <>
          {/* Add Button */}
          <Button
            variant="outlined"
            fullWidth
            startIcon={<Add />}
            onClick={handleAddNew}
            disabled={disabled}
            sx={{ mb: 2 }}
          >
            Add {question.question_text || 'Entry'}
          </Button>

          {/* Info message if no entries */}
          {entries.length === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Click "Add" to provide information. You can add multiple entries if needed.
            </Alert>
          )}
        </>
      )}

      {/* Help text for required validation */}
      {question.validation_rules?.required && entries.length === 0 && !isAddingNew && (
        <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
          * At least one entry is required
        </Typography>
      )}
    </Box>
  );
};

export default GroupQuestionInput;
