import React from 'react';
import { CircularProgress, Box } from '@mui/material';

const Loading = () => {
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
