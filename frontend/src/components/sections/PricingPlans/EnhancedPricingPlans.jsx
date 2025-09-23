import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Stack,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Fade,
  Zoom,
  Tab,
  Tabs,
  Badge,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { styled } from '@mui/system';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import CheckIcon from '@mui/icons-material/Check';
import StarIcon from '@mui/icons-material/Star';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CloseIcon from '@mui/icons-material/Close';
import authService from '../../../services/authService';

const PricingCard = styled(Card)(({ theme, recommended }) => ({
  position: 'relative',
  borderRadius: '24px',
  padding: theme.spacing(4),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  border: recommended ? '2px solid #3E63DD' : '1px solid #E8ECFF',
  background: recommended
    ? 'linear-gradient(180deg, #FFFFFF 0%, #F0F4FF 100%)'
    : '#FFFFFF',
  boxShadow: recommended
    ? '0 20px 40px rgba(62, 99, 221, 0.15)'
    : '0 4px 12px rgba(0, 0, 0, 0.04)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: recommended
      ? '0 24px 48px rgba(62, 99, 221, 0.25)'
      : '0 12px 24px rgba(0, 0, 0, 0.08)',
    borderColor: '#3E63DD'
  }
}));

const PricingButton = styled(Button)(({ theme, variant }) => ({
  borderRadius: '12px',
  padding: '14px 32px',
  fontSize: '16px',
  fontWeight: 600,
  textTransform: 'none',
  width: '100%',
  marginTop: 'auto',
  boxShadow: variant === 'contained' ? '0 4px 12px rgba(62, 99, 221, 0.25)' : 'none',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: variant === 'contained'
      ? '0 8px 24px rgba(62, 99, 221, 0.35)'
      : '0 4px 12px rgba(62, 99, 221, 0.15)'
  }
}));

const RecommendedBadge = styled(Chip)({
  position: 'absolute',
  top: '-12px',
  left: '50%',
  transform: 'translateX(-50%)',
  backgroundColor: '#3E63DD',
  color: 'white',
  fontWeight: 600,
  height: '28px',
  padding: '0 16px',
  '& .MuiChip-icon': {
    color: 'white'
  }
});

const FeatureCheck = styled(CheckIcon)(({ disabled }) => ({
  color: disabled ? '#CBD5E0' : '#10B981',
  fontSize: '20px'
}));

const TabsContainer = styled(Box)(({ theme }) => ({
  backgroundColor: '#F8FAFF',
  borderRadius: '16px',
  padding: theme.spacing(1),
  marginBottom: theme.spacing(4),
  display: 'inline-flex'
}));

const EnhancedPricingPlans = ({ handleOpenAuthModal, userType = 'tenant' }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isAuthenticated = authService.isAuthenticated();
  const [billingPeriod, setBillingPeriod] = useState('monthly');

  const handlePlanSelect = (planName) => {
    if (!isAuthenticated) {
      handleOpenAuthModal?.();
    } else {
      navigate(userType === 'landlord' ? '/owner-account' : '/chat');
    }
  };

  const tenantPlans = [
    {
      name: 'Basic',
      price: billingPeriod === 'monthly' ? '29.99' : '299',
      period: billingPeriod === 'monthly' ? '/month' : '/year',
      description: 'Perfect for your apartment search',
      features: [
        { text: '5-min smart interview', included: true },
        { text: 'Real-time property alerts', included: true },
        { text: 'AI property matching', included: true },
        { text: 'Lifestyle & commute analysis', included: true },
        { text: 'Neighborhood insights', included: true },
        { text: 'Tax & cost calculations', included: true },
        { text: 'One-tap applications', included: true },
        { text: 'WhatsApp notifications', included: true },
        { text: 'Priority support', included: false },
        { text: 'Dedicated advisor', included: false }
      ],
      cta: 'Start Free Trial',
      recommended: true,
      badge: 'MOST POPULAR'
    }
  ];

  const landlordPlans = [
    {
      name: 'Starter',
      price: billingPeriod === 'monthly' ? '49' : '490',
      period: billingPeriod === 'monthly' ? '/month' : '/year',
      description: 'For landlords with 1-3 properties',
      features: [
        { text: 'Up to 3 property listings', included: true },
        { text: 'AI tenant screening (20/mo)', included: true },
        { text: 'Basic market analytics', included: true },
        { text: 'Email automation', included: true },
        { text: 'Document templates', included: true },
        { text: 'Monthly reports', included: true },
        { text: 'Email support', included: true },
        { text: 'WhatsApp integration', included: false },
        { text: 'Advanced analytics', included: false },
        { text: 'Priority support', included: false }
      ],
      cta: 'Start Free Week',
      recommended: false
    },
    {
      name: 'Professional',
      price: billingPeriod === 'monthly' ? '99' : '990',
      period: billingPeriod === 'monthly' ? '/month' : '/year',
      description: 'For landlords with 4-10 properties',
      features: [
        { text: 'Up to 10 property listings', included: true },
        { text: 'Unlimited AI screening', included: true },
        { text: 'Advanced market analytics', included: true },
        { text: 'Multi-channel automation', included: true },
        { text: 'Custom documents', included: true },
        { text: 'Weekly reports', included: true },
        { text: 'WhatsApp & SMS', included: true },
        { text: 'Viewing scheduler', included: true },
        { text: 'Tax reports', included: true },
        { text: 'Priority 2hr support', included: true }
      ],
      cta: 'Start Free Week',
      recommended: true,
      badge: 'BEST VALUE',
      savings: billingPeriod === 'yearly' ? 'Save CHF 198' : null
    },
    {
      name: 'Enterprise',
      price: billingPeriod === 'monthly' ? '249' : '2490',
      period: billingPeriod === 'monthly' ? '/month' : '/year',
      description: 'For property managers',
      features: [
        { text: 'Unlimited properties', included: true },
        { text: 'Everything in Professional', included: true },
        { text: 'White-label options', included: true },
        { text: 'Custom AI training', included: true },
        { text: 'API access', included: true },
        { text: 'Team collaboration', included: true },
        { text: 'Dedicated manager', included: true },
        { text: 'Custom reporting', included: true },
        { text: 'SLA guarantee', included: true },
        { text: 'Phone support', included: true }
      ],
      cta: 'Contact Sales',
      recommended: false
    }
  ];

  const plans = userType === 'landlord' ? landlordPlans : tenantPlans;

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 8 }}>
        {/* Header */}
        <Fade in={true} timeout={600}>
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: '32px', md: '48px' },
                fontWeight: 800,
                mb: 2,
                background: 'linear-gradient(135deg, #1F2937 0%, #3E63DD 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              {userType === 'landlord'
                ? t('Simple, Transparent Pricing')
                : t('Start Your Home Search Today')}
            </Typography>
            <Typography
              variant="h6"
              sx={{ color: '#6B7280', mb: 4, maxWidth: '600px', mx: 'auto' }}
            >
              {userType === 'landlord'
                ? t('Choose the perfect plan for your portfolio size')
                : t('Find your dream home with AI-powered search')}
            </Typography>

            {/* Billing Toggle */}
            {userType === 'landlord' && (
              <TabsContainer>
                <Tabs
                  value={billingPeriod}
                  onChange={(e, v) => setBillingPeriod(v)}
                  sx={{
                    '& .MuiTab-root': {
                      borderRadius: '12px',
                      textTransform: 'none',
                      fontWeight: 600,
                      minHeight: '40px'
                    }
                  }}
                >
                  <Tab label="Monthly" value="monthly" />
                  <Tab
                    label={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <span>Yearly</span>
                        <Chip
                          label="Save 20%"
                          size="small"
                          sx={{
                            height: '20px',
                            backgroundColor: '#10B981',
                            color: 'white',
                            fontWeight: 600
                          }}
                        />
                      </Stack>
                    }
                    value="yearly"
                  />
                </Tabs>
              </TabsContainer>
            )}
          </Box>
        </Fade>

        {/* Pricing Cards */}
        <Grid container spacing={4} alignItems="stretch">
          {plans.map((plan, index) => (
            <Grid item xs={12} md={userType === 'landlord' ? 4 : 12} key={plan.name}>
              <Zoom in={true} style={{ transitionDelay: `${index * 100}ms` }}>
                <PricingCard recommended={plan.recommended}>
                  {plan.recommended && plan.badge && (
                    <RecommendedBadge
                      icon={<StarIcon />}
                      label={plan.badge}
                      size="small"
                    />
                  )}

                  <CardContent sx={{ p: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
                    {/* Plan Header */}
                    <Box sx={{ mb: 3 }}>
                      <Typography
                        variant="h5"
                        sx={{ fontWeight: 700, mb: 1 }}
                      >
                        {plan.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: '#6B7280', mb: 2 }}
                      >
                        {plan.description}
                      </Typography>

                      {/* Price */}
                      <Stack direction="row" alignItems="baseline" spacing={0.5}>
                        <Typography
                          variant="h3"
                          sx={{
                            fontWeight: 800,
                            color: '#1F2937'
                          }}
                        >
                          CHF {plan.price}
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{ color: '#6B7280' }}
                        >
                          {plan.period}
                        </Typography>
                      </Stack>

                      {plan.savings && (
                        <Chip
                          label={plan.savings}
                          size="small"
                          sx={{
                            mt: 1,
                            backgroundColor: '#FEE2E2',
                            color: '#DC2626',
                            fontWeight: 600
                          }}
                        />
                      )}
                    </Box>

                    <Divider sx={{ mb: 3 }} />

                    {/* Features List */}
                    <List sx={{ mb: 3, flexGrow: 1 }}>
                      {plan.features.map((feature, idx) => (
                        <ListItem key={idx} sx={{ px: 0, py: 1 }}>
                          <ListItemIcon sx={{ minWidth: '32px' }}>
                            {feature.included ? (
                              <FeatureCheck />
                            ) : (
                              <CloseIcon sx={{ color: '#CBD5E0', fontSize: '20px' }} />
                            )}
                          </ListItemIcon>
                          <ListItemText
                            primary={feature.text}
                            primaryTypographyProps={{
                              fontSize: '14px',
                              color: feature.included ? '#374151' : '#9CA3AF',
                              sx: {
                                textDecoration: feature.included ? 'none' : 'line-through'
                              }
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>

                    {/* CTA Button */}
                    <PricingButton
                      variant={plan.recommended ? 'contained' : 'outlined'}
                      color="primary"
                      onClick={() => handlePlanSelect(plan.name)}
                      startIcon={plan.recommended ? <RocketLaunchIcon /> : null}
                    >
                      {plan.cta}
                    </PricingButton>
                  </CardContent>
                </PricingCard>
              </Zoom>
            </Grid>
          ))}
        </Grid>

        {/* Trust Indicators */}
        <Fade in={true} timeout={1000}>
          <Box sx={{ mt: 8, textAlign: 'center' }}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={4}
              justifyContent="center"
              alignItems="center"
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <CheckIcon sx={{ color: '#10B981' }} />
                <Typography variant="body2" sx={{ color: '#6B7280' }}>
                  {userType === 'landlord' ? 'No setup fees' : 'Cancel anytime'}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <CheckIcon sx={{ color: '#10B981' }} />
                <Typography variant="body2" sx={{ color: '#6B7280' }}>
                  {userType === 'landlord' ? '7-day free trial' : '1-day free trial'}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <CheckIcon sx={{ color: '#10B981' }} />
                <Typography variant="body2" sx={{ color: '#6B7280' }}>
                  100% Swiss compliant
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <CheckIcon sx={{ color: '#10B981' }} />
                <Typography variant="body2" sx={{ color: '#6B7280' }}>
                  Secure & private
                </Typography>
              </Stack>
            </Stack>
          </Box>
        </Fade>

        {/* ROI Section for Landlords */}
        {userType === 'landlord' && (
          <Fade in={true} timeout={1200}>
            <Box
              sx={{
                mt: 8,
                p: 4,
                background: 'linear-gradient(135deg, #F0F4FF 0%, #E8ECFF 100%)',
                borderRadius: '24px',
                textAlign: 'center'
              }}
            >
              <TrendingUpIcon sx={{ fontSize: '48px', color: '#3E63DD', mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                {t('See Your ROI')}
              </Typography>
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12} md={4}>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#3E63DD' }}>
                    CHF 450
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#6B7280' }}>
                    Saved per month in avoided vacancies
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#10B981' }}>
                    10+ hours
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#6B7280' }}>
                    Saved per week on management
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#F59E0B' }}>
                    73%
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#6B7280' }}>
                    Reduction in problematic tenants
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Fade>
        )}
      </Box>
    </Container>
  );
};

export default EnhancedPricingPlans;