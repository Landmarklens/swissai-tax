import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { Box, Typography } from '@mui/material';
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const options = [
  {
    value: 'chat',
    label: 'Chat',
    subtitle: 'Guided, thorough'
  },
  {
    value: 'quick-form',
    label: 'Quick Form',
    subtitle: '2 min setup'
  }
];

export const ToggleChatMode = ({ value, onChange }) => {
  const [mode, setMode] = useState(value || 'chat');

  useEffect(() => {
    setMode(value || 'chat');
  }, [value]);

  const handleChange = (event, newMode) => {
    if (newMode !== null && newMode !== mode) {
      onChange?.(newMode);
    }
  };

  return (
    <Box display="flex" justifyContent="center" mb={4}>
      <ToggleButtonGroup value={mode} exclusive onChange={handleChange} aria-label="Mode selection">
        {options.map((option) => (
          <ToggleButton
            key={option.value}
            value={option.value}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              px: 3,
              py: 1.5,
              textTransform: 'none',
              gap: 0.5
            }}>
            <Typography variant="subtitle1" fontWeight="bold">
              {option.label}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {option.subtitle}
            </Typography>
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
};
ToggleChatMode.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func
};
