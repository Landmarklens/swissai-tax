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

const SubscriptionPlans = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentSubscription, setCurrentSubscription] = useState(null);

  useEffect(() => {
    checkCurrentSubscription();
  }, []);

  const checkCurrentSubscription = async () => {
    try {
      if (!authService.isAuthenticated()) {
        return;
      }
      const subscription = await subscriptionService.getCurrentSubscription();
      setCurrentSubscription(subscription);
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

      // Navigate to payment method collection page
      navigate(`/subscription/checkout/${planType}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to start subscription process');
      console.error('Error selecting plan:', err);
    } finally {
      setLoading(false);
    }
  };

  const plans = [
    {
      id: 'annual_flex',
      name: t('subscription.plans.annual_flex.name', 'Annual Flex'),
      price: 129,
      currency: 'CHF',
      billing: t('subscription.billing.annual', 'per year'),
      description: t(
        'subscription.plans.annual_flex.description',
        'Cancel anytime after trial'
      ),
      features: [
        t('subscription.features.unlimited_filings', 'Unlimited tax filings'),
        t('subscription.features.ai_assistance', 'AI-powered tax assistance'),
        t('subscription.features.document_management', 'Secure document management'),
        t('subscription.features.email_support', 'Email support'),
        t('subscription.features.cancel_anytime', 'Cancel anytime after trial')
      ],
      popular: false,
      commitment: t('subscription.commitment.annual', '1-year subscription')
    },
    {
      id: '5_year_lock',
      name: t('subscription.plans.5_year_lock.name', '5-Year Price Lock'),
      price: 89,
      currency: 'CHF',
      billing: t('subscription.billing.annual', 'per year'),
      description: t(
        'subscription.plans.5_year_lock.description',
        'Lock in price for 5 years'
      ),
      features: [
        t('subscription.features.all_annual_features', 'All Annual Flex features'),
        t('subscription.features.price_guarantee', 'Price locked for 5 years'),
        t('subscription.features.save_40', 'Save CHF 40/year'),
        t('subscription.features.priority_support', 'Priority support'),
        t('subscription.features.early_access', 'Early access to new features')
      ],
      popular: true,
      commitment: t('subscription.commitment.5_year', '5-year commitment'),
      savings: t('subscription.savings.total', 'Save CHF 200 total')
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
            {t('subscription.subtitle', 'Start with a 30-day free trial. No credit card required.')}
          </Typography>
          <Chip
            label={t('subscription.trial_badge', '30-Day Free Trial')}
            color="success"
            sx={{ fontSize: '1rem', py: 2, px: 1 }}
          />
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
        <Grid container spacing={4} justifyContent="center">
          {plans.map((plan) => (
            <Grid item xs={12} md={6} key={plan.id}>
              <Card
                className={`plan-card ${plan.popular ? 'popular' : ''}`}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  border: plan.popular ? '2px solid #1976d2' : '1px solid #e0e0e0',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 24px rgba(0,0,0,0.15)'
                  }
                }}>
                {plan.popular && (
                  <Chip
                    label={t('subscription.most_popular', 'Most Popular')}
                    color="primary"
                    sx={{
                      position: 'absolute',
                      top: -12,
                      right: 20,
                      fontWeight: 'bold'
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

                  {/* Trial Info */}
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

                  {/* Action Button */}
                  <Button
                    variant={plan.popular ? 'contained' : 'outlined'}
                    size="large"
                    fullWidth
                    disabled={loading || (currentSubscription && currentSubscription.plan_type === plan.id)}
                    onClick={() => handleSelectPlan(plan.id)}
                    sx={{ py: 1.5, fontSize: '1.1rem' }}>
                    {loading ? (
                      <CircularProgress size={24} />
                    ) : currentSubscription && currentSubscription.plan_type === plan.id ? (
                      t('subscription.current_plan', 'Current Plan')
                    ) : (
                      t('subscription.start_trial', 'Start Free Trial')
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
