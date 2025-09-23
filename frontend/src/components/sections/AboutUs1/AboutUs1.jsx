import { Box, Typography } from '@mui/material';
import React from 'react';
import { theme } from '../../../theme/theme';
import { useTranslation } from 'react-i18next';

const AboutUs1 = () => {
  const { t } = useTranslation();

  const imageSrc = `https://images.unsplash.com/photo-1494451930944-8998635c2123?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D`;
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        flexWrap: 'wrap',
        py: 10,
        rowGap: 5
      }}
    >
      <Box
        sx={{
          width: { xs: '100%', md: '45%' },
          display: 'flex',
          justifyContent: 'center',
          flexGrow: 1
        }}
      >
        <Box
          sx={{
            width: '75%',
            backgroundColor: theme.palette.background.skyBlue,
            padding: '10px',
            borderRadius: '10px',
            border: `1px solid ${theme.palette.border.blue}`
          }}
        >
          <img
            src={imageSrc}
            width={'100%'}
            alt="HomeAI"
            style={{
              objectFit: 'cover',
              borderRadius: '10px'
            }}
          />
        </Box>
      </Box>

      <Box
        sx={{
          width: { xs: '100%', md: '45%' },
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <Box
          sx={{
            width: '80%'
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              fontSize: '35px',
              lineHeight: '40px'
            }}
          >
            {t('We help people to find the best option')}
          </Typography>
          <Typography
            sx={{
              pt: 2,
              fontWeight: 400,
              fontSize: '16px',
              lineHeight: '24px'
            }}
          >
            {t('About us description')}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default AboutUs1;
