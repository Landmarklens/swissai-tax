import React from 'react';
import { Box, Container, Typography, Paper, Grid } from '@mui/material';
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
      color: '#DC0018'
    },
    {
      icon: LockIcon,
      titleKey: 'security.swissBanner.encryption.title',
      descKey: 'security.swissBanner.encryption.description',
      color: '#1976d2'
    },
    {
      icon: ShieldIcon,
      titleKey: 'security.swissBanner.protection.title',
      descKey: 'security.swissBanner.protection.description',
      color: '#2e7d32'
    },
    {
      icon: VerifiedIcon,
      titleKey: 'security.swissBanner.compliance.title',
      descKey: 'security.swissBanner.compliance.description',
      color: '#ed6c02'
    }
  ];

  return (
    <Box sx={{ py: 6, bgcolor: 'white' }}>
      <Container maxWidth="lg">
        {/* Main Banner */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 4 },
            bgcolor: 'white',
            color: '#1a1a1a',
            borderRadius: 2,
            mb: 4,
            textAlign: 'center',
            border: '2px solid #DC0018'
          }}
        >
          <Typography
            variant="h3"
            component="h2"
            fontWeight={700}
            gutterBottom
            sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}
          >
            🇨🇭 {t('security.swissBanner.title')}
          </Typography>
          <Typography
            variant="h6"
            sx={{
              fontSize: { xs: '0.95rem', md: '1.1rem' },
              fontWeight: 400,
              maxWidth: '800px',
              mx: 'auto'
            }}
          >
            {t('security.swissBanner.subtitle')}
          </Typography>
        </Paper>

        {/* Highlights Grid */}
        <Grid container spacing={3}>
          {highlights.map((highlight, index) => {
            const IconComponent = highlight.icon;
            return (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    height: '100%',
                    textAlign: 'center',
                    border: '2px solid',
                    borderColor: '#e0e0e0',
                    borderRadius: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: highlight.color,
                      boxShadow: `0 4px 12px ${highlight.color}20`,
                      transform: 'translateY(-4px)'
                    }
                  }}
                >
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      bgcolor: `${highlight.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2
                    }}
                  >
                    <IconComponent
                      sx={{
                        fontSize: 36,
                        color: highlight.color
                      }}
                    />
                  </Box>
                  <Typography
                    variant="h6"
                    fontWeight={600}
                    gutterBottom
                    sx={{ fontSize: '1rem', color: '#1a1a1a' }}
                  >
                    {t(highlight.titleKey)}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ lineHeight: 1.6, fontSize: '0.875rem' }}
                  >
                    {t(highlight.descKey)}
                  </Typography>
                </Paper>
              </Grid>
            );
          })}
        </Grid>

        {/* Guarantee Box */}
        <Paper
          elevation={0}
          sx={{
            mt: 4,
            p: 3,
            bgcolor: '#f5f5f5',
            border: '2px solid #DC0018',
            borderRadius: 2,
            textAlign: 'center'
          }}
        >
          <Typography
            variant="body1"
            fontWeight={600}
            sx={{ fontSize: { xs: '0.95rem', md: '1rem' }, color: '#1a1a1a' }}
          >
            {t('security.swissBanner.guarantee')}
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default SwissDataBanner;
