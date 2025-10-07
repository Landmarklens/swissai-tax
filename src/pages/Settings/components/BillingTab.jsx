import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Divider,
  Chip,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  CreditCard as CreditCardIcon,
  Receipt as ReceiptIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import subscriptionService from '../../../services/subscriptionService';

const BillingTab = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [error, setError] = useState(null);
  const [canceling, setCanceling] = useState(false);

  // Fetch subscription and invoices on mount
  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch subscription and invoices in parallel
      const [subscriptionResult, invoicesResult] = await Promise.all([
        subscriptionService.getCurrentSubscription(),
        subscriptionService.getInvoices()
      ]);

      if (subscriptionResult.success) {
        setSubscription(subscriptionResult.data);
      }

      if (invoicesResult.success) {
        setInvoices(invoicesResult.data);
      }
    } catch (err) {
      setError('Failed to load billing information');
      console.error('Error fetching subscription data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPlan = async () => {
    setCanceling(true);
    try {
      const result = await subscriptionService.cancelSubscription(false);

      if (result.success) {
        // Refresh subscription data
        await fetchSubscriptionData();
        setCancelDialogOpen(false);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to cancel subscription');
      console.error('Error canceling subscription:', err);
    } finally {
      setCanceling(false);
    }
  };

  const handleDownloadInvoice = (invoiceId) => {
    // TODO: Implement invoice download
    console.log('Download invoice:', invoiceId);
  };

  const formatDate = (dateString) => {
    return subscriptionService.formatDate(dateString);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF'
    }).format(amount);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  // No subscription state
  if (!subscription) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={600} mb={2}>
            {t('Current Plan')}
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            {t('You do not have an active subscription')}
          </Alert>
          <Typography variant="body2" color="text.secondary" paragraph>
            {t('Subscribe to SwissAI Tax to access premium features and file your Swiss taxes easily.')}
          </Typography>
          <Button variant="contained" href="/plan">
            {t('View Plans')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={600} mb={3}>
            {t('Current Plan')}
          </Typography>

          <Box
            sx={{
              p: 3,
              borderRadius: 2,
              backgroundColor: '#F5F5F5',
              mb: 3
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
              <Box>
                <Typography variant="h5" fontWeight={700} sx={{ textTransform: 'capitalize' }}>
                  {subscription.plan_type}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  CHF {subscription.price_chf}/year
                </Typography>
              </Box>
              <Chip
                label={
                  subscription.cancel_at_period_end
                    ? t('Canceling')
                    : subscription.status === 'active'
                    ? t('Active')
                    : t('Inactive')
                }
                color={
                  subscription.cancel_at_period_end
                    ? 'warning'
                    : subscription.status === 'active'
                    ? 'success'
                    : 'default'
                }
                size="small"
              />
            </Box>

            {subscription.cancel_at_period_end && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {t('Your subscription will be canceled on')} {formatDate(subscription.current_period_end)}
              </Alert>
            )}

            <Divider sx={{ my: 2 }} />

            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body2" color="text.secondary">
                {t('Current Period')}:
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
              </Typography>
            </Box>

            {subscription.status === 'active' && !subscription.cancel_at_period_end && (
              <Box display="flex" gap={2} mt={3}>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => setCancelDialogOpen(true)}
                >
                  {t('Cancel Plan')}
                </Button>
              </Box>
            )}
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Payment Method */}
          {subscription.stripe_customer_id && (
            <>
              <Box mb={3}>
                <Typography variant="subtitle1" fontWeight={600} mb={2}>
                  {t('Payment Method')}
                </Typography>
                <Box
                  sx={{
                    p: 2,
                    border: '1px solid #E0E0E0',
                    borderRadius: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <Box display="flex" alignItems="center" gap={2}>
                    <CreditCardIcon sx={{ color: '#003DA5' }} />
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {t('Card on file')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t('Managed by Stripe')}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>

              <Divider sx={{ my: 3 }} />
            </>
          )}

          {/* Billing History */}
          <Box>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>
              {t('Billing History')}
            </Typography>

            {invoices.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                {t('No billing history available')}
              </Typography>
            ) : (
              <>
                <Table>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {formatDate(invoice.created_at)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {invoice.description}
                          </Typography>
                          {invoice.card_brand && invoice.card_last4 && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              {invoice.card_brand} •••• {invoice.card_last4}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={600}>
                            {formatCurrency(invoice.amount_chf)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={invoice.status === 'succeeded' ? t('Paid') : t('Pending')}
                            color={invoice.status === 'succeeded' ? 'success' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            startIcon={<DownloadIcon />}
                            onClick={() => handleDownloadInvoice(invoice.id)}
                            disabled
                          >
                            {t('Download')}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <Button
                  variant="text"
                  startIcon={<ReceiptIcon />}
                  sx={{ mt: 2 }}
                  disabled
                >
                  {t('View All Invoices')}
                </Button>
              </>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Cancel Plan Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle color="error">{t('Cancel Plan')}</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            {t('Are you sure you want to cancel your plan?')}
          </Alert>
          <Typography variant="body2" color="text.secondary">
            {t('Your subscription will remain active until')} {formatDate(subscription?.current_period_end)}.
            {' '}{t('After that, you will lose access to premium features.')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)} disabled={canceling}>
            {t('Keep Plan')}
          </Button>
          <Button
            onClick={handleCancelPlan}
            color="error"
            variant="contained"
            disabled={canceling}
          >
            {canceling ? <CircularProgress size={24} /> : t('Cancel Plan')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BillingTab;
