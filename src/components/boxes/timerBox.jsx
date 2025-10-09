import React from 'react';
import { Box, Typography } from '@mui/material';
import { styled } from '@mui/system';
import { theme } from '../../theme/theme';
import { useTranslation } from 'react-i18next';

const CustomTimeBox = styled(Box)({
  width: '40px',
  height: '40px',
  backgroundColor: theme.palette.background.iconColor,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  margin: '0 4px',
  borderRadius: '4px'
});

const TimerBox = ({ value }) => (
  <CustomTimeBox>
    <Typography variant="h6" color={'white'} component="span">
      {value}
    </Typography>
  </CustomTimeBox>
);

export default TimerBox;
