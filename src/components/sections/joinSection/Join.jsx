import React, { useEffect, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import CountUp from 'react-countup';
import { useDispatch } from 'react-redux';
import { useTranslation, Trans } from 'react-i18next';
import { toast } from 'react-toastify';

import { useRandomUserCounter } from './../../../hooks/useRandomUserCounter';
import { useLandlordCounter } from './../../../hooks/useLandlordCounter';

import { errorHandler } from '../../../utils';

import { useNavigate, useSearchParams } from 'react-router-dom';
import authService from '../../../services/authService';
import { counter } from '../../../store/slices/counterSlice';
import { jsonData } from '../../../db';

const Join = () => {
  const { t } = useTranslation();
  const [count, setCounter] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const navigate = useNavigate();

  const isAuthenticated = authService.isAuthenticated();

  const _count = useRandomUserCounter();

  const dispatch = useDispatch();
  const getCount = async () => {
    try {
      const data = await dispatch(counter());
      if (data.payload.status === 200 && data.meta.requestStatus === 'fulfilled') {
        setCounter(data?.payload?.data);
      }
    } catch (error) {
      console.log('Error', error);
      errorHandler(error);
    }
  };

  useEffect(() => {
    //  getCount();
  }, []);

  const handleStartedClick = () => {
    if (!isAuthenticated) {
      setSearchParams({ login: true });
      return;
    } else {
      navigate('/tax-filing/interview');
    }
  };

  return (
    <Box
      sx={{
        position: 'relative',
        pb: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '40px',
        background: '#F7F9FF'
      }}
    >
      <Typography
        variant="h5"
        component="h3"
        sx={{ fontWeight: 700, fontSize: '35px', textAlign: 'center' }}
      >
        {t('Trusted by Swiss Taxpayers')}
      </Typography>

      <Box>
        <Typography
          variant="h1"
          component="h2"
          sx={{
            backgroundColor: '#e1e9ff',
            textAlign: 'center',
            py: '30px',
            width: { xs: '80vw', sm: '40vw' },
            borderRadius: 1,
            fontSize: '28px',
            fontFamily: 'SF Pro Display',
            color: '#3E63DD',
            fontWeight: 700
          }}
        >
          {`${_count ?? 0} ${t('tax filings started this week')}`}
        </Typography>
      </Box>

      <Button
        variant="contained"
        onClick={handleStartedClick}
        sx={{
          fontSize: '20px',
          height: '48px',
          width: '137px',
          background: '#3E63DD',
          borderRadius: '8px'
        }}
      >
        {t('Get Started')}
      </Button>
    </Box>
  );
};

export default Join;
