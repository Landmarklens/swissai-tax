import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import SEOHelmet from '../../components/SEO/SEOHelmet';
import paymentSuccessfulIcon from '../../assets/payment-successful.svg';
import ImageComponent from '../../components/Image/Image';
import { theme } from '../../theme/theme';
import { useNavigate } from 'react-router-dom';

const PaymentSuccessful = () => {
  const navigate = useNavigate();

  const navigateToChat = () => {
    navigate('/chat?active-trial=true', { replace: true });
  };

  return (
    <>
      <SEOHelmet
        title="Payment Successful - HomeAI"
        description="Your payment has been processed successfully"
      />
      <Box
        sx={{
          width: '100%',
          minHeight: 'calc(100vh - 68px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          backgroundColor: '#F7F9FF'
        }}>
        <Box sx={{ mt: 4 }}>
          <ImageComponent name="logo" height={26} alt="HOME AI Logo" />
        </Box>
        <Box component="img" src={paymentSuccessfulIcon} alt="PaymentSuccessful" sx={{ mt: 7 }} />
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 'bold',
            mt: 4,
            fontSize: 32,
            color: theme.palette.success.light
          }}>
          Payment Successful!
        </Typography>

        <Typography variant="body1" sx={{ mb: 4, fontSize: 16 }}>
          Thank you! Your payment has been received.
        </Typography>
        <Box
          sx={{
            width: '100%',
            maxWidth: '600px',
            height: '1px',
            backgroundColor: '#C1D0FF',
            mb: 4
          }}
        />

        <Typography
          variant="body1"
          sx={{
            mb: 4,
            fontSize: 28,
            fontWeight: 400,
            color: '#202020',
            lineHeight: '36px'
          }}>
          Start Your Search with Our AI - <br />
          Get Matched to Your Dream Apartment Today!
        </Typography>

        <Box
          sx={{
            paddingBottom: 4
          }}>
          <Button
            onClick={navigateToChat}
            variant="outlined"
            sx={{
              width: '154px',
              height: '48px',
              fontWeight: 500,
              fontSize: '18px',
              color: '#3E63DD',
              gap: '12px',
              borderRadius: '8px',
              backgroundColor: 'transparent',
              border: '1px solid #3E63DD',
              '&:hover': {
                backgroundColor: 'transparent',
                borderColor: '#3E63DD',
                boxShadow: 'none'
              }
            }}>
            Back to chat
          </Button>
        </Box>
      </Box>
      <Box
        sx={{
          width: '100%',
          height: '68px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          © 2025 Home AI, LLC
        </Typography>
      </Box>
    </>
  );
};

export default PaymentSuccessful;
