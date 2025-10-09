import React from 'react';
import { Snackbar, Alert, AlertTitle } from '@mui/material';
import { useTranslation } from 'react-i18next';

const NotificationSnackbar = ({ open, onClose, severity = 'info', title, message }) => {
  const { t } = useTranslation();
  return (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert 
        onClose={onClose} 
        severity={severity} 
        sx={{ width: '100%' }}
        variant="filled"
      >
        {title && <AlertTitle>{title}</AlertTitle>}
        {message}
      </Alert>
    </Snackbar>
  );
};

export default NotificationSnackbar;