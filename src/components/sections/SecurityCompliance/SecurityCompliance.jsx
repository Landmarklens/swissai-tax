import React from 'react';
import { Box, Container, Typography, Grid, Paper, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  Verified as VerifiedIcon,
  Public as PublicIcon,
  Shield as ShieldIcon,
  CloudDone as CloudIcon
} from '@mui/icons-material';

const complianceItems = [
  {
    icon: ShieldIcon,
    titleKey: 'security.compliance.swiss_privacy',
    color: '#dc2626'
  },
  {
    icon: PublicIcon,
    titleKey: 'security.compliance.gdpr',
    color: '#0c4a6e'
  },
  {
    icon: VerifiedIcon,
    titleKey: 'security.compliance.owasp',
    color: '#7c3aed'
  },
  {
    icon: CloudIcon,
    titleKey: 'security.compliance.aws',
    color: '#ff9900'
  }
];

const SecurityCompliance = () => {
  const { t } = useTranslation();

  return (
    <Box sx={{ py: 10, bgcolor: 'white' }}>
      <Container maxWidth="lg">
        {/* Section Header */}
        <Stack spacing={2} alignItems="center" textAlign="center" mb={6}>
          <Typography
            variant="h3"
            component="h2"
            fontWeight={700}
            sx={{ fontSize: { xs: '2rem', md: '2.75rem' } }}
          >
            {t('security.compliance.title')}
          </Typography>
        </Stack>

        {/* Compliance Grid */}
        <Grid container spacing={4}>
          {complianceItems.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    height: '100%',
                    border: '2px solid',
                    borderColor: 'divider',
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: item.color,
                      transform: 'translateY(-4px)',
                      boxShadow: `0 8px 24px ${item.color}22`
                    }
                  }}
                >
                  <Stack spacing={2} alignItems="center">
                    {/* Icon */}
                    <Box
                      sx={{
                        width: 72,
                        height: 72,
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${item.color}22, ${item.color}11)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <IconComponent
                        sx={{
                          fontSize: 40,
                          color: item.color
                        }}
                      />
                    </Box>

                    {/* Title */}
                    <Typography
                      variant="h6"
                      component="h3"
                      fontWeight={600}
                      sx={{
                        fontSize: { xs: '1rem', md: '1.1rem' }
                      }}
                    >
                      {t(item.titleKey)}
                    </Typography>
                  </Stack>
                </Paper>
              </Grid>
            );
          })}
        </Grid>

        {/* Additional Info */}
        <Box
          sx={{
            mt: 6,
            p: 4,
            bgcolor: '#f8f9fa',
            borderRadius: 3,
            borderLeft: '4px solid',
            borderLeftColor: 'primary.main'
          }}
        >
          <Typography variant="body1" color="text.secondary" textAlign="center">
            SwissAI Tax follows industry best practices for data security and privacy.
            We continuously monitor and update our security measures to protect your
            sensitive tax information with the highest standards.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default SecurityCompliance;
