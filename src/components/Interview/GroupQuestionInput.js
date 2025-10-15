import React, { useState, useEffect } from 'react';
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
  IconButton
} from '@mui/material';
import {
  Add,
  Delete,
  Edit,
  CheckCircle,
  ArrowForward,
  ArrowBack
} from '@mui/icons-material';

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
  disabled = false
}) => {
  const [entries, setEntries] = useState(value || []);
  const [currentEntry, setCurrentEntry] = useState({});
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);

  /**
   * Update parent when entries change
   */
  useEffect(() => {
    if (JSON.stringify(entries) !== JSON.stringify(value)) {
      onChange(entries);
    }
  }, [entries]);

  /**
   * Update internal state when external value changes
   */
  useEffect(() => {
    if (JSON.stringify(value) !== JSON.stringify(entries)) {
      setEntries(value || []);
    }
  }, [value]);

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
      if (field.validation?.required) {
        const value = currentEntry[field.id];
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
          <TextField
            key={field.id}
            type="date"
            fullWidth
            label={fieldLabel}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            required={field.validation?.required}
            InputLabelProps={{
              shrink: true,
            }}
            sx={{ mb: 2 }}
          />
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
              value={value.toString()}
              onChange={(e) => handleChange(e.target.value === 'true')}
            >
              <FormControlLabel value="true" control={<Radio />} label="Yes" />
              <FormControlLabel value="false" control={<Radio />} label="No" />
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
          {fields.map(field => {
            const fieldLabel = field.text?.[language] || field.text?.en || field.id;
            const fieldValue = entry[field.id];

            // Format value based on type
            let displayValue = fieldValue;
            if (field.type === 'yes_no' || field.type === 'boolean') {
              displayValue = fieldValue ? 'Yes' : 'No';
            } else if (field.type === 'date' && fieldValue) {
              displayValue = new Date(fieldValue).toLocaleDateString();
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

  return (
    <Box sx={{ width: '100%' }}>
      {/* Existing Entries */}
      {entries.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" fontWeight={600} sx={{ mb: 2 }}>
            Added Entries ({entries.length}):
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

          {/* Render all fields */}
          {question.fields?.map(field => renderField(field))}

          {/* Action Buttons */}
          <Box display="flex" gap={2} justifyContent="flex-end" mt={2}>
            <Button
              variant="outlined"
              onClick={handleCancel}
              startIcon={<ArrowBack />}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={!isEntryValid()}
              startIcon={<CheckCircle />}
            >
              {editingIndex !== null ? 'Update' : 'Add'}
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
