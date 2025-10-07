import React, { useState } from 'react';
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
  Alert
} from '@mui/material';
import {
  CreditCard as CreditCardIcon,
  Upgrade as UpgradeIcon,
  Receipt as ReceiptIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const BillingTab = () => {
  const { t } = useTranslation();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);

  // Mock subscription data
  const subscription = {
    plan: 'Standard',
    price: 39,
    currency: 'CHF',
    renewalDate: '2025-04-01',
    paymentMethod: {
      type: 'card',
      brand: 'Visa',
      last4: '1234'
    },
    status: 'active'
  };

  const billingHistory = [
    {
      id: 'inv_2024_01',
      date: '2024-10-04',
      amount: 39.00,
      status: 'paid',
      description: 'Standard Plan - Annual Subscription'
    },
    {
      id: 'inv_2023_01',
      date: '2023-10-04',
      amount: 39.00,
      status: 'paid',
      description: 'Standard Plan - Annual Subscription'
    },
    {
      id: 'inv_2022_01',
      date: '2022-10-04',
      amount: 39.00,
      status: 'paid',
      description: 'Standard Plan - Annual Subscription'
    }
  ];

  const handleCancelPlan = () => {
    if (process.env.NODE_ENV === 'development') {
    }
    setCancelDialogOpen(false);
    // TODO: Implement plan cancellation
  };

  const handleUpgrade = () => {
    if (process.env.NODE_ENV === 'development') {
    }
    setUpgradeDialogOpen(false);
    // TODO: Implement plan upgrade
  };

  const handleUpdatePaymentMethod = () => {
    if (process.env.NODE_ENV === 'development') {
    }
    // TODO: Implement payment method update
  };

  const handleDownloadInvoice = (invoiceId) => {
    if (process.env.NODE_ENV === 'development') {
    }
    // TODO: Implement invoice download
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

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
                <Typography variant="h5" fontWeight={700}>
                  {subscription.plan}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {subscription.currency} {subscription.price}/year
                </Typography>
              </Box>
              <Chip
                label={subscription.status === 'active' ? t('Active') : t('Inactive')}
                color={subscription.status === 'active' ? 'success' : 'default'}
                size="small"
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body2" color="text.secondary">
                {t('Renewal Date')}:
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {formatDate(subscription.renewalDate)}
              </Typography>
            </Box>

            <Box display="flex" gap={2} mt={3}>
              <Button
                variant="contained"
                startIcon={<UpgradeIcon />}
                onClick={() => setUpgradeDialogOpen(true)}
              >
                {t('Upgrade to Premium')}
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={() => setCancelDialogOpen(true)}
              >
                {t('Cancel Plan')}
              </Button>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Payment Method */}
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
                    {subscription.paymentMethod.brand} •••• {subscription.paymentMethod.last4}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('Primary payment method')}
                  </Typography>
                </Box>
              </Box>
              <Button variant="outlined" size="small" onClick={handleUpdatePaymentMethod}>
                {t('Update')}
              </Button>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Billing History */}
          <Box>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>
              {t('Billing History')}
            </Typography>

            <Table>
              <TableBody>
                {billingHistory.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {formatDate(invoice.date)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {invoice.description}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600}>
                        {subscription.currency} {invoice.amount.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={invoice.status === 'paid' ? t('Paid') : t('Pending')}
                        color={invoice.status === 'paid' ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        startIcon={<DownloadIcon />}
                        onClick={() => handleDownloadInvoice(invoice.id)}
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
            >
              {t('View All Invoices')}
            </Button>
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
            {t('Your subscription will remain active until')} {formatDate(subscription.renewalDate)}.
            {t('After that, you will lose access to premium features.')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>
            {t('Keep Plan')}
          </Button>
          <Button onClick={handleCancelPlan} color="error" variant="contained">
            {t('Cancel Plan')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upgrade Dialog */}
      <Dialog
        open={upgradeDialogOpen}
        onClose={() => setUpgradeDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('Upgrade to Premium')}</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            {t('Upgrade to Premium for advanced features')}
          </Alert>
          <Typography variant="body2" color="text.secondary" paragraph>
            {t('Premium Plan includes')}:
          </Typography>
          <Typography variant="body2" component="div">
            • {t('Expert tax review')}<br />
            • {t('Phone support')}<br />
            • {t('Priority processing')}<br />
            • {t('Tax optimization tips')}<br />
          </Typography>
          <Typography variant="h5" fontWeight={700} sx={{ mt: 2 }}>
            CHF 99/year
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpgradeDialogOpen(false)}>
            {t('Cancel')}
          </Button>
          <Button onClick={handleUpgrade} variant="contained">
            {t('Upgrade Now')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BillingTab;
