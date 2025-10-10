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
  PrivacyTip as PrivacyIcon,
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
    icon: PrivacyIcon,
    titleKey: 'security.features.gdpr.title',
    descKey: 'security.features.gdpr.description',
    color: '#43e97b'
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
    <Box sx={{ py: 8, bgcolor: 'white' }}>
      <Container maxWidth="md">
        {/* Section Header */}
        <Typography
          variant="h4"
          component="h2"
          fontWeight={700}
          textAlign="center"
          mb={5}
          sx={{ fontSize: { xs: '1.75rem', md: '2rem' } }}
        >
          {t('security.features.title')}
        </Typography>

        {/* Features Grid */}
        <Grid container spacing={3}>
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Grid item xs={12} sm={6} key={index}>
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    border: '1px solid #e0e0e0',
                    borderRadius: 2,
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                    }
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Stack direction="row" spacing={2} alignItems="flex-start">
                      {/* Icon */}
                      <IconComponent
                        sx={{
                          fontSize: 40,
                          color: feature.color,
                          flexShrink: 0
                        }}
                      />

                      {/* Content */}
                      <Box>
                        <Typography
                          variant="h6"
                          component="h3"
                          fontWeight={600}
                          mb={1}
                          sx={{ fontSize: '1rem' }}
                        >
                          {t(feature.titleKey)}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ lineHeight: 1.6 }}
                        >
                          {t(feature.descKey)}
                        </Typography>
                      </Box>
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
