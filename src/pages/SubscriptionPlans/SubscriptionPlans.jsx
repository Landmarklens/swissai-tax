import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import subscriptionService from '../../services/subscriptionService';
import authService from '../../services/authService';
import './SubscriptionPlans.scss';

const SubscriptionPlans = ({ referralCode = '' }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentSubscription, setCurrentSubscription] = useState(null);

  useEffect(() => {
    checkCurrentSubscription();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkCurrentSubscription = async () => {
    try {
      if (!authService.isAuthenticated()) {
        return;
      }
      const result = await subscriptionService.getCurrentSubscription();
      if (result.success && result.data) {
        setCurrentSubscription(result.data);
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
    }
  };

  const handleSelectPlan = async (planType) => {
    try {
      if (!authService.isAuthenticated()) {
        // Redirect to login/signup
        navigate('/', { state: { showAuth: true, selectedPlan: planType } });
        return;
      }

      setLoading(true);
      setError(null);

      // Free plan: Create subscription directly (no Stripe checkout)
      if (planType === 'free') {
        await subscriptionService.createFreeSubscription();
        // Refresh subscription data
        await checkCurrentSubscription();
        setLoading(false);
        return;
      }

      // Paid plans: Navigate to payment method collection page with optional referral code
      const checkoutPath = referralCode
        ? `/subscription/checkout/${planType}?ref=${referralCode}`
        : `/subscription/checkout/${planType}`;
      navigate(checkoutPath);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to start subscription process');
      console.error('Error selecting plan:', err);
    } finally {
      setLoading(false);
    }
  };

  const plans = [
    {
      id: 'free',
      name: t('subscription.plans.free.name', 'Free'),
      price: 0,
      currency: 'CHF',
      billing: t('subscription.billing.forever', 'forever'),
      description: t(
        'subscription.plans.free.description',
        'Perfect for trying out SwissAI Tax'
      ),
      features: [
        t('subscription.features.free.basic_filing', '1 basic tax filing per year'),
        t('subscription.features.free.ai_interview', 'AI-guided interview (limited to 10 questions)'),
        t('subscription.features.free.tax_calculation', 'Basic tax calculation'),
        t('subscription.features.free.pdf_export', 'PDF export (with watermark)'),
        t('subscription.features.free.community_support', 'Community support (FAQ)')
      ],
      popular: false,
      commitment: t('subscription.commitment.free', 'No credit card required'),
      isFree: true
    },
    {
      id: 'basic',
      name: t('subscription.plans.basic.name', 'Basic'),
      price: 49,
      currency: 'CHF',
      billing: t('subscription.billing.annual', 'per year'),
      description: t(
        'subscription.plans.basic.description',
        'Everything you need to file your taxes'
      ),
      features: [
        t('subscription.features.basic.complete_filing', '1 complete tax filing per year'),
        t('subscription.features.basic.full_interview', 'Full AI-guided interview (unlimited)'),
        t('subscription.features.basic.forms', 'Official cantonal form generation'),
        t('subscription.features.basic.documents', 'Document upload (up to 10 documents)'),
        t('subscription.features.basic.pdf_export', 'Professional PDF export (no watermark)'),
        t('subscription.features.basic.support', 'Email support (48h response)'),
        t('subscription.features.basic.encryption', 'Swiss data encryption')
      ],
      popular: false,
      commitment: t('subscription.commitment.annual', 'Annual subscription, cancel anytime')
    },
    {
      id: 'pro',
      name: t('subscription.plans.pro.name', 'Pro'),
      price: 99,
      currency: 'CHF',
      billing: t('subscription.billing.annual', 'per year'),
      description: t(
        'subscription.plans.pro.description',
        'Optimize your taxes with AI-powered insights'
      ),
      features: [
        t('subscription.features.pro.everything_basic', 'Everything in Basic, plus:'),
        t('subscription.features.pro.optimization', 'AI tax optimization (5-10 recommendations)'),
        t('subscription.features.pro.documents', 'Unlimited document uploads with AI'),
        t('subscription.features.pro.comparison', 'Multi-canton comparison (up to 5)'),
        t('subscription.features.pro.tracker', 'Tax savings tracker'),
        t('subscription.features.pro.etax_export', 'Export to eTax XML'),
        t('subscription.features.pro.support', 'Priority email support (24h response)'),
        t('subscription.features.pro.deduction_max', 'Deduction maximization suggestions')
      ],
      popular: true,
      commitment: t('subscription.commitment.annual', 'Annual subscription, cancel anytime'),
      badge: t('subscription.badge.most_popular', 'MOST POPULAR')
    },
    {
      id: 'premium',
      name: t('subscription.plans.premium.name', 'Premium'),
      price: 149,
      currency: 'CHF',
      billing: t('subscription.billing.annual', 'per year'),
      description: t(
        'subscription.plans.premium.description',
        'Professional-grade with expert review'
      ),
      features: [
        t('subscription.features.premium.everything_pro', 'Everything in Pro, plus:'),
        t('subscription.features.premium.advanced_optimization', 'Advanced AI optimization (10-15+ tips)'),
        t('subscription.features.premium.all_cantons', 'All 26 cantons comparison'),
        t('subscription.features.premium.expert_review', 'Tax expert review before submission'),
        t('subscription.features.premium.audit', 'Audit assistance & document prep'),
        t('subscription.features.premium.phone_support', 'Phone/video consultation (30min/year)'),
        t('subscription.features.premium.support', 'Priority support (12h response)'),
        t('subscription.features.premium.historical', '3-year historical analysis')
      ],
      popular: false,
      commitment: t('subscription.commitment.annual', 'Annual subscription, cancel anytime')
    }
  ];

  return (
    <Container maxWidth="lg" className="subscription-plans-page">
      <Box sx={{ py: 8 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h2" component="h1" gutterBottom>
            {t('subscription.title', 'Choose Your Plan')}
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            {t('subscription.subtitle', 'Start free or get 30-day trial on paid plans. Cancel anytime.')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Chip
              label={t('subscription.trial_badge', '30-Day Free Trial on Paid Plans')}
              color="success"
              sx={{ fontSize: '1rem', py: 2, px: 1 }}
            />
            <Chip
              label={t('subscription.free_forever', 'Free Plan Available')}
              color="primary"
              variant="outlined"
              sx={{ fontSize: '1rem', py: 2, px: 1 }}
            />
          </Box>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 4 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Current Subscription Alert */}
        {currentSubscription && (
          <Alert severity="info" sx={{ mb: 4 }}>
            {t(
              'subscription.current_plan_message',
              `You currently have an active ${currentSubscription.plan_type} subscription.`
            )}
          </Alert>
        )}

        {/* Plan Cards */}
        <Grid container spacing={3} justifyContent="center">
          {plans.map((plan) => (
            <Grid item xs={12} sm={6} md={3} key={plan.id}>
              <Card
                className={`plan-card ${plan.popular ? 'popular' : ''} ${plan.isFree ? 'free' : ''}`}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  border: plan.popular ? '3px solid #1976d2' : plan.isFree ? '1px solid #e0e0e0' : '2px solid #e0e0e0',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  bgcolor: plan.popular ? '#f5f9ff' : 'white',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: plan.popular ? '0 16px 32px rgba(25,118,210,0.25)' : '0 12px 24px rgba(0,0,0,0.15)'
                  }
                }}>
                {(plan.popular || plan.badge) && (
                  <Chip
                    label={plan.badge || t('subscription.most_popular', 'Most Popular')}
                    color="primary"
                    sx={{
                      position: 'absolute',
                      top: -12,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      fontWeight: 'bold',
                      fontSize: '0.75rem',
                      height: 28
                    }}
                  />
                )}

                <CardContent sx={{ flexGrow: 1, p: 4 }}>
                  {/* Plan Header */}
                  <Typography variant="h4" component="h2" gutterBottom>
                    {plan.name}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    {plan.description}
                  </Typography>

                  {/* Price */}
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1 }}>
                      <Typography variant="h3" component="span" sx={{ fontWeight: 'bold' }}>
                        {plan.currency} {plan.price}
                      </Typography>
                      <Typography variant="h6" component="span" color="text.secondary" sx={{ ml: 1 }}>
                        / {plan.billing}
                      </Typography>
                    </Box>
                    {plan.savings && (
                      <Typography variant="body2" color="success.main" sx={{ fontWeight: 'bold' }}>
                        {plan.savings}
                      </Typography>
                    )}
                  </Box>

                  {/* Commitment */}
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    {plan.commitment}
                  </Typography>

                  {/* Features List */}
                  <List sx={{ mb: 3 }}>
                    {plan.features.map((feature, index) => (
                      <ListItem key={index} disablePadding sx={{ mb: 1 }}>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <CheckCircleIcon color="success" />
                        </ListItemIcon>
                        <ListItemText primary={feature} />
                      </ListItem>
                    ))}
                  </List>

                  {/* Trial Info - Only for paid plans */}
                  {!plan.isFree && (
                    <Box
                      sx={{
                        bgcolor: 'success.light',
                        p: 2,
                        borderRadius: 1,
                        mb: 3,
                        textAlign: 'center'
                      }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {t('subscription.trial_info', '30-day free trial included')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t('subscription.trial_details', 'Cancel anytime during trial at no cost')}
                      </Typography>
                    </Box>
                  )}

                  {/* Action Button */}
                  <Button
                    variant={plan.popular ? 'contained' : plan.isFree ? 'outlined' : 'outlined'}
                    size="large"
                    fullWidth
                    disabled={loading || (currentSubscription && currentSubscription.plan_type === plan.id)}
                    onClick={() => handleSelectPlan(plan.id)}
                    sx={{
                      py: 1.5,
                      fontSize: '1rem',
                      fontWeight: plan.popular ? 600 : 500
                    }}>
                    {loading ? (
                      <CircularProgress size={24} />
                    ) : currentSubscription && currentSubscription.plan_type === plan.id ? (
                      t('subscription.current_plan', 'Current Plan')
                    ) : plan.isFree ? (
                      t('subscription.start_free', 'Start Free')
                    ) : (
                      t('subscription.start_trial', 'Start 30-Day Trial')
                    )}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Additional Info */}
        <Box sx={{ mt: 6, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t(
              'subscription.footer_note',
              'All prices include Swiss VAT. Payment processed securely through Stripe.'
            )}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t(
              'subscription.questions',
              'Questions? Contact us at support@swissai.tax'
            )}
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default SubscriptionPlans;
