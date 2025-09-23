import React from 'react';
import { Box, TextField } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { useTranslation } from 'react-i18next';

const MessageField = ({ onSendMessage, onChange, disabled, message }) => {
  const { t } = useTranslation();

  const handleChange = (e) => {
    onChange(e);
  };

  const handleSend = () => {
    if (disabled) {
      return;
    }
    if (message.trim()) {
      onSendMessage();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        position: 'relative'
      }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'stretch',
          background: 'linear-gradient(145deg, #f3f4f6, #ffffff)',
          borderRadius: '16px',
          padding: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07), inset 0 1px 3px rgba(0, 0, 0, 0.05)',
          border: '1px solid rgba(0, 0, 0, 0.05)',
          transition: 'all 0.3s ease',
          '&:focus-within': {
            boxShadow: '0 6px 12px rgba(0, 0, 0, 0.1), inset 0 1px 3px rgba(0, 0, 0, 0.05)',
            background: 'linear-gradient(145deg, #ffffff, #f9fafb)',
          }
        }}>
        <TextField
          autoComplete="off"
          name="User"
          multiline
          maxRows={4}
          sx={{
            flex: 1,
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              fontSize: '15px',
              '& fieldset': {
                borderColor: 'transparent',
                transition: 'border-color 0.3s'
              },
              '&:hover fieldset': {
                borderColor: 'rgba(62, 99, 221, 0.2)'
              },
              '&.Mui-focused fieldset': {
                borderColor: 'rgba(62, 99, 221, 0.4)',
                borderWidth: '2px'
              }
            },
            '& .MuiInputBase-input': {
              padding: '12px 16px',
              lineHeight: 1.5
            }
          }}
          placeholder={t('Tell me what you want from your next home...')}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyPress}
        />
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-end',
            ml: '8px'
          }}>
          <Box
            disabled={disabled}
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              background: disabled
                ? 'linear-gradient(135deg, #9CA3AF, #D1D5DB)'
                : 'linear-gradient(135deg, #3e63dd, #5a7fff)',
              color: 'white',
              cursor: disabled ? 'not-allowed' : 'pointer',
              borderRadius: '12px',
              padding: '12px',
              transition: 'all 0.3s ease',
              boxShadow: disabled ? 'none' : '0 2px 8px rgba(62, 99, 221, 0.3)',
              ...(!disabled && {
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a7fff, #3e63dd)',
                  transform: 'scale(1.05)',
                  boxShadow: '0 4px 12px rgba(62, 99, 221, 0.4)'
                },
                '&:active': {
                  transform: 'scale(0.95)'
                }
              })
            }}
            onClick={handleSend}>
            <SendIcon
              disabled={disabled}
              sx={{
                fontSize: '22px',
                transform: 'rotate(-45deg)'
              }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default MessageField;
