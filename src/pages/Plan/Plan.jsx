import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '../../components/header/Header';
import Footer from '../../components/footer/Footer';
import SubscriptionPlans from '../SubscriptionPlans/SubscriptionPlans';
import CurrentPlanCard from '../../components/CurrentPlanCard/CurrentPlanCard';
import PlanComparisonCard from '../../components/PlanComparisonCard/PlanComparisonCard';
import authService from '../../services/authService';
import subscriptionService from '../../services/subscriptionService';

const Plan = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref');

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    checkAuthAndSubscription();
  }, []);

  const checkAuthAndSubscription = async () => {
    console.log('[Plan] ========== checkAuthAndSubscription START ==========');
    try {
      setLoading(true);
      console.log('[Plan] Set loading to true');

      const isAuth = authService.isAuthenticated();
      console.log('[Plan] isAuthenticated:', isAuth);
      setIsAuthenticated(isAuth);

      if (isAuth) {
        console.log('[Plan] User is authenticated, fetching subscription...');
        const result = await subscriptionService.getCurrentSubscription();
        console.log('[Plan] Subscription service result:', result);

        if (result.success && result.data) {
          console.log('[Plan] Subscription data found:', result.data);
          setCurrentSubscription(result.data);
        } else {
          console.log('[Plan] No subscription data or failed:', result);
          setCurrentSubscription(null);
        }
      } else {
        console.log('[Plan] User is NOT authenticated');
        setCurrentSubscription(null);
      }
    } catch (err) {
      console.error('[Plan] Error fetching subscription:', err);
      setError(t('subscription.error_loading', 'Failed to load subscription information'));
    } finally {
      setLoading(false);
      console.log('[Plan] Set loading to false');
      console.log('[Plan] ========== checkAuthAndSubscription END ==========');
    }
  };

  const handleSelectPlan = async (planType) => {
    try {
      setActionLoading(true);
      setError(null);

      // For now, navigate to checkout or subscription page
      // In future, implement direct plan switching
      if (planType === 'free') {
        await subscriptionService.createFreeSubscription();
        await checkAuthAndSubscription();
      } else {
        // Navigate to checkout
        const checkoutPath = referralCode
          ? `/subscription/checkout/${planType}?ref=${referralCode}`
          : `/subscription/checkout/${planType}`;
        window.location.href = checkoutPath;
      }
    } catch (err) {
      setError(err.response?.data?.detail || t('subscription.error_selecting_plan', 'Failed to select plan'));
      console.error('Error selecting plan:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const getAllPlans = () => {
    return [
      {
        id: 'free',
        name: t('subscription.plans.free.name', 'Free'),
        price: 0,
        currency: 'CHF',
        billing: t('subscription.billing.forever', 'forever'),
        description: t('subscription.plans.free.description', 'Perfect for trying out SwissAI Tax'),
        features: [
          t('subscription.features.free.basic_filing', '1 basic tax filing per year'),
          t('subscription.features.free.ai_interview', 'AI-guided interview (limited to 10 questions)'),
          t('subscription.features.free.tax_calculation', 'Basic tax calculation'),
          t('subscription.features.free.pdf_export', 'PDF export (with watermark)')
        ],
        isFree: true
      },
      {
        id: 'basic',
        name: t('subscription.plans.basic.name', 'Basic'),
        price: 49,
        currency: 'CHF',
        billing: t('subscription.billing.annual', 'per year'),
        description: t('subscription.plans.basic.description', 'Everything you need to file your taxes'),
        features: [
          t('subscription.features.basic.complete_filing', '1 complete tax filing per year'),
          t('subscription.features.basic.full_interview', 'Full AI-guided interview (unlimited)'),
          t('subscription.features.basic.forms', 'Official cantonal form generation'),
          t('subscription.features.basic.documents', 'Document upload (up to 10 documents)'),
          t('subscription.features.basic.pdf_export', 'Professional PDF export')
        ]
      },
      {
        id: 'pro',
        name: t('subscription.plans.pro.name', 'Pro'),
        price: 99,
        currency: 'CHF',
        billing: t('subscription.billing.annual', 'per year'),
        description: t('subscription.plans.pro.description', 'Optimize your taxes with AI-powered insights'),
        features: [
          t('subscription.features.pro.everything_basic', 'Everything in Basic'),
          t('subscription.features.pro.optimization', 'AI tax optimization (5-10 recommendations)'),
          t('subscription.features.pro.documents', 'Unlimited document uploads'),
          t('subscription.features.pro.comparison', 'Multi-canton comparison (up to 5)'),
          t('subscription.features.pro.etax_export', 'Export to eTax XML')
        ]
      },
      {
        id: 'premium',
        name: t('subscription.plans.premium.name', 'Premium'),
        price: 149,
        currency: 'CHF',
        billing: t('subscription.billing.annual', 'per year'),
        description: t('subscription.plans.premium.description', 'Professional-grade with expert review'),
        features: [
          t('subscription.features.premium.everything_pro', 'Everything in Pro'),
          t('subscription.features.premium.advanced_optimization', 'Advanced AI optimization (10-15+ tips)'),
          t('subscription.features.premium.all_cantons', 'All 26 cantons comparison'),
          t('subscription.features.premium.expert_review', 'Tax expert review before submission'),
          t('subscription.features.premium.phone_support', 'Phone/video consultation (30min/year)')
        ]
      }
    ];
  };

  const getPlanTier = (planType) => {
    const tiers = { free: 0, basic: 1, pro: 2, premium: 3 };
    return tiers[planType] || 0;
  };

  const getOtherPlans = () => {
    if (!currentSubscription) return { upgrades: [], downgrades: [] };

    const allPlans = getAllPlans();
    const currentTier = getPlanTier(currentSubscription.plan_type);

    const upgrades = allPlans.filter(plan => getPlanTier(plan.id) > currentTier);
    const downgrades = allPlans.filter(plan => getPlanTier(plan.id) < currentTier);

    return { upgrades, downgrades };
  };

  console.log('[Plan] RENDER - isAuthenticated:', isAuthenticated, 'loading:', loading, 'currentSubscription:', currentSubscription);

  // Show loading state
  if (loading) {
    console.log('[Plan] Rendering LOADING state');
    return (
      <>
        <Header />
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
        <Footer />
      </>
    );
  }

  // If not authenticated or no subscription, show regular plans page
  if (!isAuthenticated || !currentSubscription) {
    console.log('[Plan] Rendering STANDARD PLANS page - isAuth:', isAuthenticated, 'hasSub:', !!currentSubscription);
    return (
      <>
        <Header />
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
          <SubscriptionPlans referralCode={referralCode} />
        </Box>
        <Footer />
      </>
    );
  }

  console.log('[Plan] Rendering SUBSCRIPTION MANAGEMENT page');
  const { upgrades, downgrades } = getOtherPlans();

  // Authenticated user with subscription - show management view
  return (
    <>
      <Header />
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 8 }}>
        <Container maxWidth="lg">
          {/* Page Title */}
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h2" component="h1" gutterBottom>
              {t('subscription.manage_title', 'Manage Your Subscription')}
            </Typography>
            <Typography variant="h6" color="text.secondary">
              {t('subscription.manage_subtitle', 'View your current plan and explore other options')}
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 4 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Current Plan Card */}
          <CurrentPlanCard subscription={currentSubscription} />

          {/* Upgrades Section */}
          {upgrades.length > 0 && (
            <>
              <Divider sx={{ my: 6 }} />
              <Box sx={{ mb: 4 }}>
                <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 'bold', color: 'success.main' }}>
                  {t('subscription.upgrade_options', 'Upgrade Options')}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                  {t('subscription.upgrade_description', 'Get more features and unlock the full potential of SwissAI Tax')}
                </Typography>
                <Grid container spacing={3}>
                  {upgrades.map((plan) => (
                    <Grid item xs={12} md={upgrades.length === 1 ? 12 : 6} lg={upgrades.length === 1 ? 8 : 4} key={plan.id}>
                      <PlanComparisonCard
                        plan={plan}
                        currentPlan={currentSubscription.plan_type}
                        isUpgrade={true}
                        onSelectPlan={handleSelectPlan}
                        loading={actionLoading}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </>
          )}

          {/* Downgrades Section */}
          {downgrades.length > 0 && (
            <>
              <Divider sx={{ my: 6 }} />
              <Box>
                <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                  {t('subscription.downgrade_options', 'Other Plans')}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                  {t('subscription.downgrade_description', 'Switch to a more basic plan if it better fits your needs')}
                </Typography>
                <Grid container spacing={3}>
                  {downgrades.map((plan) => (
                    <Grid item xs={12} md={downgrades.length === 1 ? 12 : 6} lg={downgrades.length === 1 ? 8 : 4} key={plan.id}>
                      <PlanComparisonCard
                        plan={plan}
                        currentPlan={currentSubscription.plan_type}
                        isUpgrade={false}
                        onSelectPlan={handleSelectPlan}
                        loading={actionLoading}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </>
          )}
        </Container>
      </Box>
      <Footer />
    </>
  );
};

export default Plan;
