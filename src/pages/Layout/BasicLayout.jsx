import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';

// Basic layout for SwissAI Tax - no footer needed for logged-in pages
function BasicLayout({ children }) {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box component="main" sx={{ flex: 1 }}>
        {children || <Outlet />}
      </Box>
    </Box>
  );
}

export default BasicLayout;
