import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import ReceiptIcon from '@mui/icons-material/Receipt';
import subscriptionService from '../../services/subscriptionService';
import BillingTab from '../Settings/components/BillingTab';
import './ManageSubscription.scss';

const ManageSubscription = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Cancel dialog
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Switch plan dialog
  const [switchDialogOpen, setSwitchDialogOpen] = useState(false);
  const [targetPlan, setTargetPlan] = useState('');

  useEffect(() => {
    fetchSubscription();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const result = await subscriptionService.getCurrentSubscription();
      if (result.success) {
        setSubscription(result.data);
      } else {
        setError(result.error || t('subscription.error.fetch_failed', 'Failed to load subscription'));
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setError(
        err.response?.data?.detail ||
        t('subscription.error.fetch_failed', 'Failed to load subscription')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setActionLoading(true);
      const result = await subscriptionService.cancelSubscription(cancelReason);

      if (!result.success) {
        setError(result.error || t('subscription.error.cancel_failed', 'Failed to cancel subscription'));
        return;
      }

      // Refresh subscription data
      await fetchSubscription();
      setCancelDialogOpen(false);
      setCancelReason('');

      // Show success message
      setError(null);
    } catch (err) {
      console.error('Error canceling subscription:', err);
      setError(
        err.response?.data?.detail ||
        t('subscription.error.cancel_failed', 'Failed to cancel subscription')
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleSwitchPlan = async () => {
    try {
      setActionLoading(true);
      const result = await subscriptionService.switchPlan(targetPlan, 'User requested plan switch');

      if (!result.success) {
        setError(result.error || t('subscription.error.switch_failed', 'Failed to switch plan'));
        return;
      }

      // Refresh subscription data
      await fetchSubscription();
      setSwitchDialogOpen(false);

      // Show success message
      setError(null);
    } catch (err) {
      console.error('Error switching plan:', err);
      setError(
        err.response?.data?.detail ||
        t('subscription.error.switch_failed', 'Failed to switch plan')
      );
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      active: { label: t('subscription.status.active', 'Active'), color: 'success' },
      trialing: { label: t('subscription.status.trialing', 'Trial'), color: 'info' },
      past_due: { label: t('subscription.status.past_due', 'Past Due'), color: 'warning' },
      canceled: { label: t('subscription.status.canceled', 'Canceled'), color: 'error' }
    };

    const config = statusConfig[status] || { label: status, color: 'default' };
    return <Chip label={config.label} color={config.color} />;
  };

  const getPlanName = (planType) => {
    const names = {
      annual_flex: t('subscription.plans.annual_flex.name', 'Annual Flex'),
      '5_year_lock': t('subscription.plans.5_year_lock.name', '5-Year Price Lock')
    };
    return names[planType] || planType;
  };

  if (loading) {
    return (
      <Container maxWidth="lg" className="manage-subscription-page">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error && !subscription) {
    return (
      <Container maxWidth="lg" className="manage-subscription-page">
        <Box sx={{ py: 8 }}>
          <Typography variant="h4" gutterBottom>
            {t('subscription.manage.title', 'Manage Subscription')}
          </Typography>
          <Alert severity="error" sx={{ mt: 4 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        </Box>
      </Container>
    );
  }

  if (!subscription) {
    return (
      <Container maxWidth="lg" className="manage-subscription-page">
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            {t('subscription.no_subscription', 'No Active Subscription')}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            {t('subscription.no_subscription_message', 'You don\'t have an active subscription yet.')}
          </Typography>
          <Button variant="contained" size="large" onClick={() => navigate('/subscription/plans')}>
            {t('subscription.view_plans', 'View Plans')}
          </Button>
        </Box>
      </Container>
    );
  }

  const isInTrial = subscription.status === 'trialing';
  const isCanceled = subscription.status === 'canceled' || subscription.cancel_at_period_end;
  const canSwitchPlan = isInTrial && !isCanceled;
  const canCancelImmediately = isInTrial;

  const trialEndDate = subscription.trial_end
    ? new Date(subscription.trial_end).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
    : null;

  const currentPeriodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
    : null;

  return (
    <Container maxWidth="lg" className="manage-subscription-page">
      <Box sx={{ py: 6 }}>
        {/* Header */}
        <Typography variant="h3" component="h1" gutterBottom>
          {t('subscription.manage.title', 'Manage Subscription')}
        </Typography>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 4 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Cancellation Notice */}
        {isCanceled && (
          <Alert severity="warning" sx={{ mb: 4 }}>
            {t(
              'subscription.manage.canceled_notice',
              `Your subscription will end on ${currentPeriodEnd}. You will continue to have access until then.`
            )}
          </Alert>
        )}

        {/* Trial Notice */}
        {isInTrial && !isCanceled && (
          <Alert severity="info" sx={{ mb: 4 }}>
            {t(
              'subscription.manage.trial_notice',
              `You are in your free trial period. Your trial ends on ${trialEndDate}.`
            )}
          </Alert>
        )}

        <Grid container spacing={4}>
          {/* Subscription Details */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 4, mb: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5">{t('subscription.manage.current_plan', 'Current Plan')}</Typography>
                {getStatusChip(subscription.status)}
              </Box>

              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {t('subscription.manage.plan_type', 'Plan')}
                  </Typography>
                  <Typography variant="h6">{getPlanName(subscription.plan_type)}</Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {t('subscription.manage.price', 'Price')}
                  </Typography>
                  <Typography variant="h6">
                    CHF {subscription.price_chf} / {t('subscription.billing.year', 'year')}
                  </Typography>
                </Grid>

                {subscription.plan_commitment_years > 1 && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {t('subscription.manage.commitment', 'Commitment')}
                    </Typography>
                    <Typography variant="h6">
                      {subscription.plan_commitment_years} {t('subscription.manage.years', 'years')}
                    </Typography>
                  </Grid>
                )}

                {isInTrial && trialEndDate && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {t('subscription.manage.trial_ends', 'Trial Ends')}
                    </Typography>
                    <Typography variant="h6">{trialEndDate}</Typography>
                  </Grid>
                )}

                {!isInTrial && currentPeriodEnd && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {t('subscription.manage.next_billing', 'Next Billing Date')}
                    </Typography>
                    <Typography variant="h6">{currentPeriodEnd}</Typography>
                  </Grid>
                )}
              </Grid>
            </Paper>

            {/* Billing History */}
            <div id="billing-history">
              <BillingTab />
            </div>
          </Grid>

          {/* Actions */}
          <Grid item xs={12} md={4}>
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {t('subscription.manage.actions', 'Actions')}
                </Typography>

                {/* Switch Plan Button */}
                {canSwitchPlan && (
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<SwapHorizIcon />}
                    onClick={() => {
                      setTargetPlan(subscription.plan_type === 'annual_flex' ? '5_year_lock' : 'annual_flex');
                      setSwitchDialogOpen(true);
                    }}
                    disabled={actionLoading}
                    sx={{ mb: 2 }}>
                    {t('subscription.manage.switch_plan', 'Switch Plan')}
                  </Button>
                )}

                {/* View Invoices Button */}
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<ReceiptIcon />}
                  onClick={() => {
                    // Scroll to billing history
                    document.getElementById('billing-history')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  sx={{ mb: 2 }}>
                  {t('subscription.manage.view_invoices', 'View Invoices')}
                </Button>

                {/* Cancel Button */}
                {!isCanceled && (
                  <Button
                    variant="outlined"
                    color="error"
                    fullWidth
                    startIcon={<CancelIcon />}
                    onClick={() => setCancelDialogOpen(true)}
                    disabled={actionLoading}>
                    {canCancelImmediately
                      ? t('subscription.manage.cancel_immediately', 'Cancel Subscription')
                      : t('subscription.manage.cancel_at_period_end', 'Cancel at Period End')}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Info Cards */}
            {subscription.plan_commitment_years > 1 && !isInTrial && (
              <Card sx={{ bgcolor: 'warning.light', mb: 2 }}>
                <CardContent>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {t('subscription.manage.commitment_notice', 'Commitment Notice')}
                  </Typography>
                  <Typography variant="caption">
                    {t(
                      'subscription.manage.commitment_details',
                      'You have a 5-year commitment. Cancellation is only available during the trial period.'
                    )}
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      </Box>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
        <DialogTitle>
          {canCancelImmediately
            ? t('subscription.cancel.title_immediate', 'Cancel Subscription')
            : t('subscription.cancel.title_period_end', 'Cancel at Period End')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            {canCancelImmediately
              ? t(
                  'subscription.cancel.message_immediate',
                  'Your subscription will be canceled immediately and you will lose access to all features.'
                )
              : t(
                  'subscription.cancel.message_period_end',
                  `Your subscription will be canceled at the end of the current billing period (${currentPeriodEnd}). You will continue to have access until then.`
                )}
          </DialogContentText>
          <TextField
            fullWidth
            multiline
            rows={3}
            label={t('subscription.cancel.reason_label', 'Reason for canceling (optional)')}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder={t(
              'subscription.cancel.reason_placeholder',
              'Help us improve by telling us why you\'re canceling'
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)} disabled={actionLoading}>
            {t('common.keep_subscription', 'Keep Subscription')}
          </Button>
          <Button onClick={handleCancelSubscription} color="error" disabled={actionLoading}>
            {actionLoading ? <CircularProgress size={20} /> : t('common.confirm_cancel', 'Confirm Cancel')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Switch Plan Dialog */}
      <Dialog open={switchDialogOpen} onClose={() => setSwitchDialogOpen(false)}>
        <DialogTitle>{t('subscription.switch.title', 'Switch Plan')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {targetPlan === '5_year_lock'
              ? t(
                  'subscription.switch.to_5year',
                  'Switch to 5-Year Price Lock (CHF 89/year) and save CHF 40 per year?'
                )
              : t(
                  'subscription.switch.to_annual',
                  'Switch to Annual Flex (CHF 129/year) for more flexibility?'
                )}
          </DialogContentText>
          <Alert severity="info" sx={{ mt: 2 }}>
            {t(
              'subscription.switch.trial_notice',
              'Plan switches are only available during the trial period.'
            )}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSwitchDialogOpen(false)} disabled={actionLoading}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button onClick={handleSwitchPlan} variant="contained" disabled={actionLoading}>
            {actionLoading ? <CircularProgress size={20} /> : t('common.confirm', 'Confirm Switch')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ManageSubscription;
