import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import {
  Box,
  Button,
  Paper,
  Typography,
  Alert,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  Link
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';

const PaymentForm = ({ setupIntent, planType, planDetails, onSuccess, onCancel, loading: parentLoading }) => {
  const { t } = useTranslation();
  const stripe = useStripe();
  const elements = useElements();

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    if (!agreedToTerms) {
      setError(t('subscription.error.terms_required', 'Please agree to the terms and conditions'));
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Confirm the SetupIntent
      const { error: stripeError, setupIntent: confirmedSetupIntent } = await stripe.confirmSetup({
        elements,
        redirect: 'if_required',
        confirmParams: {
          return_url: `${window.location.origin}/subscription/success`,
        }
      });

      if (stripeError) {
        setError(stripeError.message);
        setProcessing(false);
        return;
      }

      if (confirmedSetupIntent.status === 'succeeded') {
        // Get the payment method ID
        const paymentMethodId = confirmedSetupIntent.payment_method;

        // Call parent success handler
        await onSuccess(paymentMethodId);
      } else {
        setError(t('subscription.error.setup_failed', 'Payment setup failed. Please try again.'));
        setProcessing(false);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || t('subscription.error.payment_failed', 'Payment failed. Please try again.'));
      setProcessing(false);
    }
  };

  const isLoading = processing || parentLoading;

  return (
    <Paper sx={{ p: 4 }}>
      <form onSubmit={handleSubmit}>
        {/* Security Badge */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
          <LockIcon sx={{ mr: 1, color: 'success.main' }} />
          <Typography variant="body2" color="text.secondary">
            {t('subscription.payment.secure', 'Secure payment powered by Stripe')}
          </Typography>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Payment Element */}
        <Box sx={{ mb: 3 }}>
          <PaymentElement />
        </Box>

        {/* Important Notice */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            {t(
              'subscription.payment.trial_notice',
              'Your card will not be charged today. After your 30-day free trial ends, you will be charged the subscription amount.'
            )}
          </Typography>
        </Alert>

        {/* Subscription Details */}
        {planDetails && (
          <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t('subscription.payment.billing_details', 'Billing Details')}:
            </Typography>
            <Typography variant="body2">
              • {t('subscription.payment.trial_start', 'Trial starts today')}
            </Typography>
            <Typography variant="body2">
              • {t('subscription.payment.trial_end', 'Trial ends in 30 days')}
            </Typography>
            <Typography variant="body2">
              • {t('subscription.payment.first_charge', `First charge: CHF ${planDetails.price} on`)} {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
            </Typography>
            {planType === '5_year_lock' && (
              <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
                • {t('subscription.payment.commitment_note', '5-year commitment - special price locked in')}
              </Typography>
            )}
          </Box>
        )}

        {/* Terms and Conditions */}
        <FormControlLabel
          control={
            <Checkbox
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              color="primary"
            />
          }
          label={
            <Typography variant="body2">
              {t('subscription.payment.agree_to')}{' '}
              <Link href="/terms-and-conditions" target="_blank">
                {t('subscription.payment.terms', 'Terms and Conditions')}
              </Link>
              {' '}{t('subscription.payment.and')}{' '}
              <Link href="/privacy-policy" target="_blank">
                {t('subscription.payment.privacy', 'Privacy Policy')}
              </Link>
            </Typography>
          }
          sx={{ mb: 3 }}
        />

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            size="large"
            fullWidth
            onClick={onCancel}
            disabled={isLoading}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={!stripe || !elements || isLoading || !agreedToTerms}>
            {isLoading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                {t('subscription.payment.processing', 'Processing...')}
              </>
            ) : (
              t('subscription.payment.start_trial', 'Start Free Trial')
            )}
          </Button>
        </Box>

        {/* Additional Info */}
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 2 }}>
          {t(
            'subscription.payment.cancel_info',
            'You can cancel anytime during the trial period without being charged.'
          )}
        </Typography>
      </form>
    </Paper>
  );
};

export default PaymentForm;
