import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  StepLabel
} from '@mui/material';
import PaymentForm from '../../components/subscription/PaymentForm';
import subscriptionService from '../../services/subscriptionService';
import './SubscriptionCheckout.scss';

// Initialize Stripe with publishable key from environment
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || '');

const SubscriptionCheckout = () => {
  const { planType } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [setupIntent, setSetupIntent] = useState(null);
  const [planDetails, setPlanDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    t('subscription.checkout.step_plan', 'Select Plan'),
    t('subscription.checkout.step_payment', 'Payment Method'),
    t('subscription.checkout.step_confirm', 'Confirm')
  ];

  useEffect(() => {
    initializeCheckout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planType]);

  const initializeCheckout = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get plan details
      const details = await subscriptionService.getPlanDetails(planType);
      setPlanDetails(details);

      // Create SetupIntent for payment method collection
      const intent = await subscriptionService.createSetupIntent(planType);
      setSetupIntent(intent);

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

      // Create subscription with payment method
      const subscription = await subscriptionService.createSubscription(
        planType,
        paymentMethodId
      );

      // Navigate to success page
      navigate('/subscription/success', {
        state: { subscription, planType }
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
    navigate('/subscription/plans');
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

        {/* Plan Summary */}
        {planDetails && (
          <Paper sx={{ p: 3, mb: 4, bgcolor: 'primary.light' }}>
            <Typography variant="h5" gutterBottom>
              {planDetails.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 2 }}>
              <Typography variant="h4" component="span" sx={{ fontWeight: 'bold' }}>
                CHF {planDetails.price}
              </Typography>
              <Typography variant="h6" component="span" color="text.secondary" sx={{ ml: 1 }}>
                {t('subscription.billing.annual', '/ year')}
              </Typography>
            </Box>
            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="body2">
                {t(
                  'subscription.checkout.trial_reminder',
                  '30-day free trial starts today. You won\'t be charged until the trial ends.'
                )}
              </Typography>
            </Alert>
            <Typography variant="body2" color="text.secondary">
              {planDetails.description}
            </Typography>
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
