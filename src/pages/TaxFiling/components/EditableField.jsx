import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, TextField, IconButton, Tooltip } from '@mui/material';
import { Edit as EditIcon, Check as CheckIcon, Close as CloseIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const EditableField = ({ label, value, onSave, type = 'text', prefix = '', suffix = '' }) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  // Sync editValue with value prop when not editing
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value);
    }
  }, [value, isEditing]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditValue(value);
  };

  const handleSave = async () => {
    try {
      const valueToSave = type === 'number' ? parseFloat(editValue) : editValue;
      if (type === 'number' && isNaN(valueToSave)) {
        // Invalid number, revert
        setEditValue(value);
        setIsEditing(false);
        return;
      }
      await onSave(valueToSave);
      setIsEditing(false);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to save:', err);
      }
      // Revert on error
      setEditValue(value);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const formatValue = (val) => {
    if (type === 'number') {
      const num = parseFloat(val);
      if (isNaN(num)) return `${prefix}0${suffix}`;
      return `${prefix}${num.toLocaleString('de-CH')}${suffix}`;
    }
    return `${prefix}${val}${suffix}`;
  };

  return (
    <Box display="flex" justifyContent="space-between" alignItems="center">
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>

      {isEditing ? (
        <Box display="flex" alignItems="center" gap={1}>
          <TextField
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            type={type}
            size="small"
            variant="outlined"
            sx={{ width: 150 }}
            InputProps={{
              startAdornment: prefix ? <Typography variant="body2">{prefix}</Typography> : null,
              endAdornment: suffix ? <Typography variant="body2">{suffix}</Typography> : null
            }}
          />
          <Tooltip title={t('Save')}>
            <IconButton size="small" onClick={handleSave} color="primary">
              <CheckIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('Cancel')}>
            <IconButton size="small" onClick={handleCancel}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ) : (
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="body2" fontWeight={600}>
            {formatValue(value)}
          </Typography>
          <Tooltip title={t('Edit')}>
            <IconButton size="small" onClick={handleEdit}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Box>
  );
};

EditableField.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onSave: PropTypes.func.isRequired,
  type: PropTypes.oneOf(['text', 'number', 'email']),
  prefix: PropTypes.string,
  suffix: PropTypes.string
};

EditableField.defaultProps = {
  type: 'text',
  prefix: '',
  suffix: ''
};

export default EditableField;
