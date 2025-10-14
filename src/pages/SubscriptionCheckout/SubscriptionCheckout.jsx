import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import {
  Container,
  Box,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Chip
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PaymentForm from '../../components/subscription/PaymentForm';
import DiscountCodeInput from '../../components/Referrals/DiscountCodeInput';
import subscriptionService from '../../services/subscriptionService';
import './SubscriptionCheckout.scss';

// Initialize Stripe with publishable key from environment
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || '');

const SubscriptionCheckout = () => {
  const { planType } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const user = useSelector((state) => state.account.data);

  const [setupIntent, setSetupIntent] = useState(null);
  const [planDetails, setPlanDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [discountInfo, setDiscountInfo] = useState(null);
  const [finalPrice, setFinalPrice] = useState(null);

  // Get referral code from URL if present
  const initialCode = searchParams.get('ref') || '';

  const steps = [
    t('subscription.checkout.step_plan', 'Select Plan'),
    t('subscription.checkout.step_payment', 'Payment Method'),
    t('subscription.checkout.step_confirm', 'Confirm')
  ];

  useEffect(() => {
    initializeCheckout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planType]);

  // Sync language with user preference on mount
  useEffect(() => {
    if (user?.preferred_language) {
      const langMap = { 'DE': 'de', 'EN': 'en', 'FR': 'fr', 'IT': 'it' };
      const userLang = langMap[user.preferred_language] || user.preferred_language.toLowerCase();
      if (i18n.language !== userLang) {
        i18n.changeLanguage(userLang);
      }
    }
  }, [user, i18n]);

  const initializeCheckout = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get plan details
      const details = await subscriptionService.getPlanDetails(planType);
      setPlanDetails(details);

      // Create SetupIntent for payment method collection
      const intent = await subscriptionService.createSetupIntent(planType);
      // Unwrap the response to get the actual SetupIntent data
      setSetupIntent(intent.data);

      setActiveStep(1); // Move to payment step
    } catch (err) {
      console.error('Error initializing checkout:', err);
      setError(
        err.response?.data?.detail ||
        t('subscription.error.initialization', 'Failed to initialize checkout')
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentMethodId) => {
    try {
      setLoading(true);
      setActiveStep(2); // Move to confirm step

      // Prepare subscription data with optional discount code
      const subscriptionData = {
        plan_type: planType,
        payment_method_id: paymentMethodId
      };

      // Add discount code if applied
      if (discountInfo && discountInfo.code) {
        subscriptionData.discount_code = discountInfo.code;
      }

      // Create subscription with payment method and discount
      const subscription = await subscriptionService.createSubscription(
        planType,
        paymentMethodId,
        discountInfo?.code
      );

      // Navigate to success page
      navigate('/subscription/success', {
        state: { subscription, planType, discountApplied: discountInfo }
      });
    } catch (err) {
      console.error('Error creating subscription:', err);
      setError(
        err.response?.data?.detail ||
        t('subscription.error.creation', 'Failed to create subscription')
      );
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/subscription-plans');
  };

  const handleDiscountApplied = (discount) => {
    setDiscountInfo(discount);
    setFinalPrice(discount.final_price_chf);
  };

  const handleDiscountRemoved = () => {
    setDiscountInfo(null);
    setFinalPrice(planDetails?.price || null);
  };

  // Check if Stripe is configured
  if (!process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY) {
    return (
      <Container maxWidth="md" className="subscription-checkout-page">
        <Box sx={{ py: 6 }}>
          <Alert severity="error">
            {t('subscription.error.stripe_not_configured', 'Stripe is not configured. Please contact support.')}
          </Alert>
        </Box>
      </Container>
    );
  }

  if (loading && !setupIntent) {
    return (
      <Container maxWidth="md" className="subscription-checkout-page">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" className="subscription-checkout-page">
      <Box sx={{ py: 6 }}>
        {/* Header */}
        <Typography variant="h3" component="h1" gutterBottom align="center">
          {t('subscription.checkout.title', 'Complete Your Subscription')}
        </Typography>

        {/* Progress Stepper */}
        <Stepper activeStep={activeStep} sx={{ my: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 4 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Free Trial Highlight Banner */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            mb: 4,
            bgcolor: 'success.light',
            border: '2px solid',
            borderColor: 'success.main',
            borderRadius: 2,
            textAlign: 'center'
          }}
        >
          <Chip
            icon={<CheckCircleIcon />}
            label={t('subscription.checkout.free_trial_badge', '30-Day Free Trial')}
            color="success"
            sx={{ mb: 2, fontWeight: 'bold', fontSize: '1rem', py: 2.5 }}
          />
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'success.dark' }}>
            {t('subscription.checkout.no_charge_today', 'CHF 0 Today')}
          </Typography>
          <Typography variant="h6" sx={{ mb: 1, color: 'text.primary' }}>
            {t('subscription.checkout.trial_headline', 'Start your free 30-day trial - no charge today')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t(
              'subscription.checkout.trial_description',
              'Try all premium features risk-free. Cancel anytime during the trial period without being charged.'
            )}
          </Typography>
          {planDetails && (
            <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary', fontStyle: 'italic' }}>
              {t(
                'subscription.checkout.then_price',
                'Then CHF {{price}}/year after trial',
                { price: finalPrice !== null ? finalPrice : planDetails.price }
              )}
            </Typography>
          )}
        </Paper>

        {/* Plan Summary */}
        {planDetails && (
          <Paper sx={{ p: 3, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {planDetails.name}
              </Typography>
              <Chip
                label={t('subscription.checkout.selected_plan', 'Selected')}
                color="primary"
                size="small"
              />
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {planDetails.description}
            </Typography>

            {/* Pricing after trial */}
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, mb: 2 }}>
              <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                {t('subscription.checkout.after_trial', 'After 30-day trial')}:
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
                <Typography variant="h5" component="span" sx={{ fontWeight: 'bold' }}>
                  CHF {finalPrice !== null ? finalPrice : planDetails.price}
                </Typography>
                {discountInfo && (
                  <Typography variant="body1" component="span" color="text.secondary" sx={{ ml: 1, textDecoration: 'line-through' }}>
                    CHF {planDetails.price}
                  </Typography>
                )}
                <Typography variant="body1" component="span" color="text.secondary" sx={{ ml: 1 }}>
                  {t('subscription.billing.annual', '/ year')}
                </Typography>
              </Box>
              {discountInfo && (
                <Typography variant="body2" color="success.main" sx={{ mt: 1, fontWeight: 'bold' }}>
                  {t('subscription.checkout.discount_applied', 'Discount applied!')} 🎉
                </Typography>
              )}
            </Box>

            <Alert severity="info" icon={<CheckCircleIcon />}>
              <Typography variant="body2">
                {t(
                  'subscription.checkout.trial_terms',
                  'Your first payment will be processed on {{date}}. You can cancel anytime before then.',
                  { date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString() }
                )}
              </Typography>
            </Alert>
          </Paper>
        )}

        {/* Discount Code Input */}
        {planDetails && (
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              {t('subscription.checkout.discount_code', 'Have a Discount Code?')}
            </Typography>
            <DiscountCodeInput
              planType={planType}
              originalPrice={planDetails.price}
              onDiscountApplied={handleDiscountApplied}
              onDiscountRemoved={handleDiscountRemoved}
              initialCode={initialCode}
            />
          </Paper>
        )}

        {/* Payment Form */}
        {setupIntent && (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret: setupIntent.client_secret,
              appearance: {
                theme: 'stripe',
                variables: {
                  colorPrimary: '#1976d2',
                  borderRadius: '8px'
                }
              }
            }}>
            <PaymentForm
              setupIntent={setupIntent}
              planType={planType}
              planDetails={planDetails}
              onSuccess={handlePaymentSuccess}
              onCancel={handleCancel}
              loading={loading}
            />
          </Elements>
        )}
      </Box>
    </Container>
  );
};

export default SubscriptionCheckout;
