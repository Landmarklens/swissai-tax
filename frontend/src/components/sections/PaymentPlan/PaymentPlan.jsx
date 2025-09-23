import React from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Button, Divider, TextField } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ImageComponent from '../../Image/Image';
import { jsonData } from '../../../db';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const PaymentPlan = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const plan = jsonData.plan.find((p) => p.id === parseInt(id));

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        backgroundColor: '#F7F9FF',
        width: { sm: '50%', xs: 'auto' },
        px: { sm: 5, xs: 2 }
      }}
    >
      <Box
        sx={{
          flex: 1,
          paddingTop: '64px',
          width: '100%',
          maxWidth: '520px'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            mb: 4
          }}
        >
          <Button
            component={Link}
            to="/plan"
            startIcon={<ArrowBackIcon />}
            sx={{
              color: 'text.secondary',
              fontWeight: 'normal',
              marginRight: '20px'
            }}
          >
            {t('Back')}
          </Button>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a237e' }}>
            <ImageComponent name="logo" height={30} alt="HOME AI Logo" />
          </Typography>
        </Box>

        <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
          {t('Active Plan')}
        </Typography>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
          {t('Free Essential Search')}
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
          {t('Subscribe to Home AI')}
        </Typography>
        <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold' }}>
          {t(plan.title)}
        </Typography>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'baseline',
            mb: 3
          }}
        >
          <Typography
            variant="h3"
            component="span"
            sx={{
              fontWeight: 'bold',
              fontSize: '57px',
              marginRight: '12px'
            }}
          >
            {plan.price}
          </Typography>
          <Typography variant="body2" component="span" sx={{ color: 'text.secondary' }}>
            {t('Per Month')}
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            mb: 1
          }}
        >
          <Typography variant="body1" sx={{ color: '#202020', fontWeight: 500 }}>
            {t('Home AI Premium Advance Search')}
          </Typography>
          <Typography variant="body1" sx={{ color: '#202020', fontWeight: 400 }}>
            {plan.price}
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ mb: 3, color: '#202020' }}>
          {t('Billed monthly')}
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            mb: 1
          }}
        >
          <Typography variant="body1" sx={{ color: '#202020', fontWeight: 500 }}>
            {t('Total due today')}
          </Typography>
          <Typography sx={{ color: '#202020', fontWeight: 400 }} variant="body1">
            {plan.price}
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            mb: 1
          }}
        >
          <Typography
            variant="body2"
            sx={{
              mb: 3,
              color: 'text.secondary',
              fontSize: '12px'
            }}
          >
            {t('Tax')}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              mb: 3,
              color: 'text.secondary',
              fontSize: '12px'
            }}
          >
            {t('Enter address to calculate')}
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            {t('Total due today')}
          </Typography>
          <Typography variant="body1" sx={{ color: '#202020', fontWeight: 500 }}>
            {plan.price}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default PaymentPlan;
