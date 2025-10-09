import React from 'react';
import { CircularProgress, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';

const Loading = () => {
  const { t } = useTranslation();
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height="100vh"
    >
      <CircularProgress size={40} />
    </Box>
  );
};

export default Loading;
