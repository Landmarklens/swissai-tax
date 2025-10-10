import React from 'react';
import { Box, Container, Typography, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Shield } from '@mui/icons-material';

const SecurityHero = () => {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        py: { xs: 6, md: 8 },
        textAlign: 'center'
      }}
    >
      <Container maxWidth="md">
        <Stack spacing={3} alignItems="center">
          {/* Icon with background */}
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid rgba(255, 255, 255, 0.3)'
            }}
          >
            <Shield sx={{ fontSize: 48, color: 'white' }} />
          </Box>

          {/* Title */}
          <Typography
            variant="h3"
            component="h1"
            fontWeight={700}
            sx={{ fontSize: { xs: '2rem', md: '2.5rem' } }}
          >
            {t('security.hero.title')}
          </Typography>

          {/* Subtitle */}
          <Typography
            variant="h6"
            sx={{
              fontSize: { xs: '1rem', md: '1.1rem' },
              fontWeight: 400,
              opacity: 0.9,
              maxWidth: '600px'
            }}
          >
            {t('security.hero.subtitle')}
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
};

export default SecurityHero;
