import React from 'react';
import {
  Typography,
  Box,
  Container,
  Paper,
  Chip,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import { styled } from '@mui/system';
import { useTranslation } from 'react-i18next';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const ProcessContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(8),
  paddingBottom: theme.spacing(8),
}));

const StepCard = styled(Card)(({ theme }) => ({
  height: '100%',
  border: '2px solid rgba(0, 0, 0, 0.06)',
  borderRadius: '16px',
  background: 'white',
  position: 'relative',
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
    borderColor: 'rgba(62, 99, 221, 0.2)',
  }
}));

const StepNumber = styled(Box)(({ theme }) => ({
  width: '48px',
  height: '48px',
  borderRadius: '12px',
  background: 'linear-gradient(135deg, #3E63DD 0%, #5575E7 100%)',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 700,
  fontSize: '1.25rem',
  marginBottom: theme.spacing(2),
}));

const MetricCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: '12px',
  background: 'linear-gradient(135deg, #f8faff 0%, #ffffff 100%)',
  border: '1px solid rgba(62, 99, 221, 0.1)',
  textAlign: 'center',
}));

const TimeTag = styled(Box)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  padding: theme.spacing(0.5, 1.5),
  backgroundColor: 'rgba(101, 186, 116, 0.1)',
  color: theme.palette.success.dark,
  borderRadius: '20px',
  fontWeight: 600,
  fontSize: '0.875rem',
}));

const FeatureChip = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(0.75),
  backgroundColor: 'rgba(62, 99, 221, 0.04)',
  borderRadius: '8px',
  marginBottom: theme.spacing(1),
  '& .MuiSvgIcon-root': {
    fontSize: '1.1rem',
    color: theme.palette.primary.main,
  }
}));

const StepArrow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.palette.primary.main,
  margin: theme.spacing(2, 0),
  '& .MuiSvgIcon-root': {
    fontSize: '2rem',
  }
}));

const EnhancedWorkSection = ({ userType = 'landlord' }) => {
  const { t } = useTranslation();

  const landlordSteps = [
    {
      label: t('List Your Property'),
      timeEstimate: '5 minutes',
      description: t('Upload photos and details. AI enhances everything automatically.'),
      features: [
        t('Smart pricing suggestions'),
        t('Professional photo enhancement'),
        t('Multi-platform posting')
      ],
      icon: '🏠'
    },
    {
      label: t('Receive Applications'),
      timeEstimate: 'Instant screening',
      description: t('Get qualified applications with AI pre-screening and scoring.'),
      features: [
        t('Automatic tenant scoring'),
        t('Financial verification'),
        t('24/7 response system')
      ],
      icon: '📥'
    },
    {
      label: t('Schedule Viewings'),
      timeEstimate: '2 minutes',
      description: t('Tenants book viewings directly. Calendar syncs automatically.'),
      features: [
        t('Smart scheduling'),
        t('Automated reminders'),
        t('Virtual tour options')
      ],
      icon: '📅'
    },
    {
      label: t('Sign & Close'),
      timeEstimate: '10 minutes',
      description: t('Digital contracts generated and signed electronically.'),
      features: [
        t('E-signature ready'),
        t('Legal compliance'),
        t('Secure storage')
      ],
      icon: '✍️'
    }
  ];

  return (
    <ProcessContainer maxWidth="xl" id="how-it-works">
      {/* Header Section */}
      <Box sx={{ textAlign: 'center', mb: 8 }}>
        <Typography
          variant="h2"
          gutterBottom
          sx={{ fontWeight: 700, color: '#1a1a1a', mb: 3, fontSize: { xs: '2.5rem', md: '3.5rem' } }}
        >
          {t('How It Works')}
        </Typography>
        <Typography
          variant="h5"
          color="text.secondary"
          sx={{ maxWidth: '700px', margin: '0 auto', fontWeight: 400, fontSize: { xs: '1.1rem', md: '1.3rem' } }}
        >
          {t('Four simple steps to find your perfect tenant with AI automation')}
        </Typography>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 8, maxWidth: '1000px', margin: '0 auto 4rem auto' }}>
        <Grid item xs={12} md={4}>
          <MetricCard elevation={0}>
            <AccessTimeIcon sx={{ fontSize: '2.5rem', color: '#3E63DD', mb: 2 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 1 }}>
              75% Faster
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t('Than traditional methods')}
            </Typography>
          </MetricCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <MetricCard elevation={0}>
            <SmartToyIcon sx={{ fontSize: '2.5rem', color: '#AA99EC', mb: 2 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 1 }}>
              95% Automated
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t('AI handles the heavy lifting')}
            </Typography>
          </MetricCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <MetricCard elevation={0}>
            <TrendingUpIcon sx={{ fontSize: '2.5rem', color: '#65BA74', mb: 2 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 1 }}>
              24+ Hours
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t('Saved per property')}
            </Typography>
          </MetricCard>
        </Grid>
      </Grid>

      {/* Process Steps - Vertical Flow */}
      <Box sx={{ maxWidth: '900px', margin: '0 auto' }}>
        {landlordSteps.map((step, index) => (
          <Box key={index}>
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} md={5}>
                <Box sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 3
                }}>
                  <StepNumber>
                    {index + 1}
                  </StepNumber>
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: 600, color: '#1a1a1a', mb: 1 }}
                    >
                      {step.label}
                    </Typography>
                    <TimeTag>
                      <AccessTimeIcon sx={{ fontSize: '1rem' }} />
                      {step.timeEstimate}
                    </TimeTag>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} md={7}>
                <StepCard elevation={0}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      sx={{ mb: 2.5, lineHeight: 1.7 }}
                    >
                      {step.description}
                    </Typography>

                    <Box>
                      {step.features.map((feature, idx) => (
                        <FeatureChip key={idx}>
                          <CheckCircleIcon />
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {feature}
                          </Typography>
                        </FeatureChip>
                      ))}
                    </Box>
                  </CardContent>
                </StepCard>
              </Grid>
            </Grid>

            {index < landlordSteps.length - 1 && (
              <StepArrow>
                <ArrowForwardIcon sx={{ transform: 'rotate(90deg)' }} />
              </StepArrow>
            )}
          </Box>
        ))}
      </Box>

    </ProcessContainer>
  );
};

export default EnhancedWorkSection;