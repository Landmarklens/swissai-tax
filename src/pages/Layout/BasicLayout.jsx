import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';
import Header from '../../components/header/Header';

// Basic layout for SwissAI Tax - includes header for authenticated pages
function BasicLayout({ children }) {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <Box component="main" sx={{ flex: 1 }}>
        {children || <Outlet />}
      </Box>
    </Box>
  );
}

export default BasicLayout;
