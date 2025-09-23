import React from 'react';
import LoggedInLayout from '../LoggedInLayout/LoggedInLayout';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Add } from '@mui/icons-material';
import { Binoculars } from '../../assets/svg/Binoculars';
import { useNavigate } from 'react-router-dom';
import { Insights } from '../../components/insights/Insights';
import NewChat from '../../components/newChat/NewChat';
import { useTranslation } from 'react-i18next';
import SEOHelmet from '../../components/SEO/SEOHelmet';

const Welcome = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const openNewChat = () => {
    navigate('/chat');
  };

  return (
    <>
      <SEOHelmet
        title="Welcome - HomeAI"
        description="Welcome to HomeAI - Your AI-powered property search assistant"
      />
      <LoggedInLayout>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '322px auto 322px',
          height: 'calc(100vh - 64px)'
        }}
      >
        <Box
          sx={{
            width: 320,
            maxWidth: 320,
            borderRight: '1px solid #e0e0e0'
          }}
        >
          <Box
            sx={{
              px: '40px',
              py: '32px'
            }}
          >
            <NewChat prevVisitedList={{}} />
          </Box>
        </Box>
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            width: 1,
            py: 4
          }}
        >
          <Box px="65px">
            <Typography variant="h4" sx={{ mb: 2, fontSize: 24, fontWeight: 'bold' }}>
              {t('Welcome to the Home AI')}
            </Typography>
            <Typography variant="body1" sx={{ fontSize: 16, mb: 3 }}>
              {t(
                "Start a new chat, add search parameters and we'll suggest the best options to help you find the perfect place"
              )}
            </Typography>
            <Button
              variant="outlined"
              onClick={openNewChat}
              sx={{
                height: '48px',
                width: '154px',
                fontWeight: 500,
                display: 'flex',
                gap: '12px',
                fontSize: '18px',
                color: 'black',
                borderRadius: '7px',
                backgroundColor: 'transparent',
                border: '1px solid #848a98',
                '&:hover': {
                  backgroundColor: 'transparent',
                  borderColor: '#848a98',
                  boxShadow: 'none'
                }
              }}
            >
              <Add />
              {t('New chat')}
            </Button>
          </Box>
        </Box>
        <Box
          sx={{
            width: 320,
            maxWidth: 320,
            px: '40',
            borderRadius: 0,
            height: '100%',
            borderLeft: '1px solid #e0e0e0'
          }}
        >
          <Insights title={t('Search parameters')} emptyInsights icon={<Binoculars />} />
        </Box>
      </Box>
      </LoggedInLayout>
    </>
  );
};

export default Welcome;
