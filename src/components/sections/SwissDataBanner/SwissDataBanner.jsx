import React from 'react';
import { Box, Container, Typography, Paper, Grid, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  LocationOn as LocationIcon,
  Lock as LockIcon,
  Verified as VerifiedIcon,
  Shield as ShieldIcon
} from '@mui/icons-material';

const SwissDataBanner = () => {
  const { t } = useTranslation();

  const highlights = [
    {
      icon: LocationIcon,
      titleKey: 'security.swissBanner.location.title',
      descKey: 'security.swissBanner.location.description',
      color: '#DC0018' // Swiss red
    },
    {
      icon: LockIcon,
      titleKey: 'security.swissBanner.encryption.title',
      descKey: 'security.swissBanner.encryption.description',
      color: '#667eea'
    },
    {
      icon: ShieldIcon,
      titleKey: 'security.swissBanner.protection.title',
      descKey: 'security.swissBanner.protection.description',
      color: '#43e97b'
    },
    {
      icon: VerifiedIcon,
      titleKey: 'security.swissBanner.compliance.title',
      descKey: 'security.swissBanner.compliance.description',
      color: '#FF0000' // Swiss flag red
    }
  ];

  return (
    <Box sx={{ py: 6, bgcolor: '#f8f9fa' }}>
      <Container maxWidth="lg">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 5 },
            background: 'linear-gradient(135deg, #DC0018 0%, #FF0000 100%)',
            color: 'white',
            borderRadius: 3,
            border: '3px solid #FFFFFF',
            boxShadow: '0 8px 32px rgba(220, 0, 24, 0.2)'
          }}
        >
          <Stack spacing={4}>
            {/* Main Title */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                variant="h3"
                component="h2"
                fontWeight={800}
                gutterBottom
                sx={{
                  fontSize: { xs: '1.75rem', md: '2.5rem' },
                  textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
              >
                🇨🇭 {t('security.swissBanner.title')}
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontSize: { xs: '1rem', md: '1.25rem' },
                  opacity: 0.95,
                  maxWidth: '800px',
                  mx: 'auto'
                }}
              >
                {t('security.swissBanner.subtitle')}
              </Typography>
            </Box>

            {/* Highlights Grid */}
            <Grid container spacing={3} sx={{ mt: 2 }}>
              {highlights.map((highlight, index) => {
                const IconComponent = highlight.icon;
                return (
                  <Grid item xs={12} sm={6} md={3} key={index}>
                    <Box
                      sx={{
                        textAlign: 'center',
                        p: 2,
                        bgcolor: 'rgba(255, 255, 255, 0.15)',
                        borderRadius: 2,
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        height: '100%',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          bgcolor: 'rgba(255, 255, 255, 0.25)',
                          transform: 'translateY(-4px)'
                        }
                      }}
                    >
                      <IconComponent
                        sx={{
                          fontSize: 48,
                          mb: 2,
                          color: 'white',
                          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                        }}
                      />
                      <Typography
                        variant="h6"
                        fontWeight={700}
                        gutterBottom
                        sx={{ fontSize: '1.1rem' }}
                      >
                        {t(highlight.titleKey)}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          opacity: 0.9,
                          lineHeight: 1.6,
                          fontSize: '0.9rem'
                        }}
                      >
                        {t(highlight.descKey)}
                      </Typography>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>

            {/* Footer Note */}
            <Box
              sx={{
                mt: 3,
                p: 3,
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 2,
                border: '1px solid rgba(255, 255, 255, 0.2)',
                textAlign: 'center'
              }}
            >
              <Typography
                variant="body1"
                fontWeight={600}
                sx={{ fontSize: { xs: '0.95rem', md: '1.1rem' } }}
              >
                {t('security.swissBanner.guarantee')}
              </Typography>
            </Box>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default SwissDataBanner;
