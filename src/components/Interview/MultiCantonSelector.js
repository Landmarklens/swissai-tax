import React, { useState, useEffect } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Alert,
  Typography
} from '@mui/material';
import { Add, Close } from '@mui/icons-material';

/**
 * Multi-Canton Selector Component
 * Allows users to select multiple Swiss cantons via dropdown + add button
 *
 * @param {Object} props
 * @param {Array<string>} props.value - Array of selected canton codes (e.g., ['ZH', 'BE'])
 * @param {function} props.onChange - Callback when canton list changes
 * @param {string} props.label - Input label
 * @param {boolean} [props.required] - Whether field is required
 * @param {boolean} [props.disabled] - Whether field is disabled
 * @param {string} [props.helperText] - Custom helper text
 * @param {string} [props.excludeCanton] - Canton code to exclude from dropdown (usually residence canton)
 */
const MultiCantonSelector = ({
  value = [],
  onChange,
  label,
  required = false,
  disabled = false,
  helperText,
  excludeCanton = null
}) => {
  const [selectedCantons, setSelectedCantons] = useState(value || []);
  const [currentSelection, setCurrentSelection] = useState('');

  // Swiss Cantons (26 total)
  const SWISS_CANTONS = [
    { code: 'AG', name: 'Aargau' },
    { code: 'AI', name: 'Appenzell Innerrhoden' },
    { code: 'AR', name: 'Appenzell Ausserrhoden' },
    { code: 'BE', name: 'Bern' },
    { code: 'BL', name: 'Basel-Landschaft' },
    { code: 'BS', name: 'Basel-Stadt' },
    { code: 'FR', name: 'Fribourg' },
    { code: 'GE', name: 'Geneva' },
    { code: 'GL', name: 'Glarus' },
    { code: 'GR', name: 'Graubünden' },
    { code: 'JU', name: 'Jura' },
    { code: 'LU', name: 'Luzern' },
    { code: 'NE', name: 'Neuchâtel' },
    { code: 'NW', name: 'Nidwalden' },
    { code: 'OW', name: 'Obwalden' },
    { code: 'SG', name: 'St. Gallen' },
    { code: 'SH', name: 'Schaffhausen' },
    { code: 'SO', name: 'Solothurn' },
    { code: 'SZ', name: 'Schwyz' },
    { code: 'TG', name: 'Thurgau' },
    { code: 'TI', name: 'Ticino' },
    { code: 'UR', name: 'Uri' },
    { code: 'VD', name: 'Vaud' },
    { code: 'VS', name: 'Valais' },
    { code: 'ZG', name: 'Zug' },
    { code: 'ZH', name: 'Zürich' }
  ];

  /**
   * Get available cantons (excluding already selected and residence canton)
   */
  const getAvailableCantons = () => {
    return SWISS_CANTONS.filter(
      canton =>
        !selectedCantons.includes(canton.code) &&
        canton.code !== excludeCanton
    );
  };

  /**
   * Get canton name by code
   */
  const getCantonName = (code) => {
    const canton = SWISS_CANTONS.find(c => c.code === code);
    return canton ? canton.name : code;
  };

  /**
   * Handle adding a canton
   */
  const handleAddCanton = () => {
    if (!currentSelection) return;

    // Check if already added
    if (selectedCantons.includes(currentSelection)) {
      return;
    }

    const newCantons = [...selectedCantons, currentSelection];
    setSelectedCantons(newCantons);
    onChange(newCantons);
    setCurrentSelection(''); // Reset selection
  };

  /**
   * Handle removing a canton
   */
  const handleRemoveCanton = (cantonCode) => {
    const newCantons = selectedCantons.filter(c => c !== cantonCode);
    setSelectedCantons(newCantons);
    onChange(newCantons);
  };

  /**
   * Update internal state when external value changes
   */
  useEffect(() => {
    if (JSON.stringify(value) !== JSON.stringify(selectedCantons)) {
      setSelectedCantons(value || []);
    }
  }, [value]);

  const availableCantons = getAvailableCantons();
  const hasAvailableCantons = availableCantons.length > 0;

  return (
    <Box sx={{ width: '100%' }}>
      {/* Canton Selector */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
        <FormControl fullWidth disabled={disabled || !hasAvailableCantons}>
          <InputLabel>{label || 'Select Canton'}</InputLabel>
          <Select
            value={currentSelection}
            onChange={(e) => setCurrentSelection(e.target.value)}
            label={label || 'Select Canton'}
            disabled={disabled || !hasAvailableCantons}
          >
            {availableCantons.map((canton) => (
              <MenuItem key={canton.code} value={canton.code}>
                {canton.name} ({canton.code})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddCanton}
          disabled={!currentSelection || disabled}
          sx={{
            minWidth: '120px',
            height: '56px', // Match Select height
            whiteSpace: 'nowrap'
          }}
        >
          Add
        </Button>
      </Box>

      {/* Helper Text */}
      {helperText && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {helperText}
        </Typography>
      )}

      {/* Selected Cantons List */}
      {selectedCantons.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" fontWeight={600} sx={{ mb: 1.5 }}>
            Selected Cantons ({selectedCantons.length}):
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {selectedCantons.map((cantonCode) => (
              <Chip
                key={cantonCode}
                label={`${getCantonName(cantonCode)} (${cantonCode})`}
                onDelete={() => handleRemoveCanton(cantonCode)}
                deleteIcon={<Close />}
                color="primary"
                variant="outlined"
                sx={{
                  fontWeight: 500,
                  '& .MuiChip-deleteIcon': {
                    color: 'error.main'
                  }
                }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* No cantons available message */}
      {!hasAvailableCantons && selectedCantons.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          No additional cantons available to select.
        </Alert>
      )}

      {/* Required validation message */}
      {required && selectedCantons.length === 0 && (
        <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
          Please add at least one canton
        </Typography>
      )}
    </Box>
  );
};

export default MultiCantonSelector;
