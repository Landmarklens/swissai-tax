import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Stack
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  Lock as LockIcon,
  VpnKey as KeyIcon,
  Devices as DevicesIcon,
  History as HistoryIcon,
  PrivacyTip as PrivacyIcon,
  Security as SecurityIcon,
  Cloud as CloudIcon,
  Shield as ShieldIcon
} from '@mui/icons-material';

const features = [
  {
    icon: LockIcon,
    titleKey: 'security.features.encryption.title',
    descKey: 'security.features.encryption.description',
    color: '#667eea'
  },
  {
    icon: KeyIcon,
    titleKey: 'security.features.2fa.title',
    descKey: 'security.features.2fa.description',
    color: '#764ba2'
  },
  {
    icon: DevicesIcon,
    titleKey: 'security.features.sessions.title',
    descKey: 'security.features.sessions.description',
    color: '#f093fb'
  },
  {
    icon: HistoryIcon,
    titleKey: 'security.features.audit.title',
    descKey: 'security.features.audit.description',
    color: '#4facfe'
  },
  {
    icon: PrivacyIcon,
    titleKey: 'security.features.gdpr.title',
    descKey: 'security.features.gdpr.description',
    color: '#43e97b'
  },
  {
    icon: SecurityIcon,
    titleKey: 'security.features.auth.title',
    descKey: 'security.features.auth.description',
    color: '#fa709a'
  },
  {
    icon: CloudIcon,
    titleKey: 'security.features.aws.title',
    descKey: 'security.features.aws.description',
    color: '#ff9a9e'
  },
  {
    icon: ShieldIcon,
    titleKey: 'security.features.headers.title',
    descKey: 'security.features.headers.description',
    color: '#a18cd1'
  }
];

const SecurityFeatures = () => {
  const { t } = useTranslation();

  return (
    <Box sx={{ py: 10, bgcolor: '#f8f9fa' }}>
      <Container maxWidth="lg">
        {/* Section Header */}
        <Stack spacing={2} alignItems="center" textAlign="center" mb={8}>
          <Typography
            variant="h3"
            component="h2"
            fontWeight={700}
            sx={{ fontSize: { xs: '2rem', md: '2.75rem' } }}
          >
            {t('security.features.title')}
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ maxWidth: '700px' }}
          >
            {t('security.features.subtitle')}
          </Typography>
        </Stack>

        {/* Features Grid */}
        <Grid container spacing={4}>
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.3s ease',
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 12px 24px rgba(0,0,0,0.1)',
                      borderColor: feature.color
                    }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    <Stack spacing={2}>
                      {/* Icon */}
                      <Box
                        sx={{
                          width: 56,
                          height: 56,
                          borderRadius: '12px',
                          background: `linear-gradient(135deg, ${feature.color}22, ${feature.color}11)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <IconComponent
                          sx={{
                            fontSize: 32,
                            color: feature.color
                          }}
                        />
                      </Box>

                      {/* Title */}
                      <Typography
                        variant="h6"
                        component="h3"
                        fontWeight={700}
                        sx={{ fontSize: '1.1rem' }}
                      >
                        {t(feature.titleKey)}
                      </Typography>

                      {/* Description */}
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ lineHeight: 1.7 }}
                      >
                        {t(feature.descKey)}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Container>
    </Box>
  );
};

export default SecurityFeatures;
