import React, { useState } from 'react';
import { Box, Typography, Tab, Tabs } from '@mui/material';
import { styled } from '@mui/material/styles';
import BillingHistoryTable from '../BillingHistory/BillingHistoryTable';
import CardSection from './Card';

const GlobalContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2)
}));

const Payments = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ px: 3, width: '100%' }}>
      <GlobalContainer>
        <Typography sx={{ color: '#202020' }} variant="h4" gutterBottom>
          Subscription
        </Typography>

        <Tabs value={tabValue} onChange={handleTabChange} sx={{ marginTop: '32px' }}>
          <Tab label="Card" sx={{ textTransform: 'none' }} />
          <Tab label="Billing History" sx={{ textTransform: 'none' }} />
        </Tabs>
        <Box sx={{ border: '1px solid #ddd', width: '100%', mt: '-1px' }} />
        {tabValue === 0 ? <CardSection /> : <BillingHistoryTable />}
      </GlobalContainer>
    </Box>
  );
};

export default Payments;
