import React from 'react';
import { Box, Container, Typography, Button, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Shield, Lock, Security as SecurityIcon } from '@mui/icons-material';

const SecurityHero = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        py: { xs: 8, md: 12 },
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
          pointerEvents: 'none'
        }
      }}
    >
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Stack
          direction="column"
          alignItems="center"
          spacing={4}
          textAlign="center"
        >
          {/* Icon */}
          <Box
            sx={{
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)'
            }}
          >
            <Shield sx={{ fontSize: 60, color: 'white' }} />
          </Box>

          {/* Title */}
          <Typography
            variant="h2"
            component="h1"
            fontWeight={800}
            sx={{
              fontSize: { xs: '2.5rem', md: '3.5rem' },
              textShadow: '0 2px 10px rgba(0,0,0,0.2)'
            }}
          >
            {t('security.hero.title')}
          </Typography>

          {/* Subtitle */}
          <Typography
            variant="h5"
            sx={{
              maxWidth: '800px',
              fontSize: { xs: '1.1rem', md: '1.3rem' },
              fontWeight: 400,
              opacity: 0.95
            }}
          >
            {t('security.hero.subtitle')}
          </Typography>

          {/* Trust Indicators */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={4}
            sx={{ mt: 2 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Lock sx={{ fontSize: 24 }} />
              <Typography variant="body1" fontWeight={600}>
                AES-256 Encryption
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SecurityIcon sx={{ fontSize: 24 }} />
              <Typography variant="body1" fontWeight={600}>
                GDPR Compliant
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Shield sx={{ fontSize: 24 }} />
              <Typography variant="body1" fontWeight={600}>
                Swiss Privacy Standards
              </Typography>
            </Box>
          </Stack>

          {/* CTA Buttons */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ mt: 4 }}
          >
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/settings')}
              sx={{
                bgcolor: 'white',
                color: '#667eea',
                px: 4,
                py: 1.5,
                fontWeight: 700,
                fontSize: '1.1rem',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.9)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.2)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              {t('security.hero.cta_enable_2fa')}
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/privacy-policy')}
              sx={{
                borderColor: 'white',
                color: 'white',
                px: 4,
                py: 1.5,
                fontWeight: 700,
                fontSize: '1.1rem',
                '&:hover': {
                  borderColor: 'white',
                  bgcolor: 'rgba(255,255,255,0.1)',
                  transform: 'translateY(-2px)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              {t('security.hero.cta_privacy_policy')}
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
};

export default SecurityHero;
