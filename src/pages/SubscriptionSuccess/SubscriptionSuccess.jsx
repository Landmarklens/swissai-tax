import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import './SubscriptionSuccess.scss';

const SubscriptionSuccess = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const subscription = location.state?.subscription;
  const planType = location.state?.planType;

  useEffect(() => {
    // Track successful subscription in analytics
    if (subscription) {
      console.log('Subscription created:', subscription);
      // Add analytics tracking here if needed
    }
  }, [subscription]);

  const handleGoToDashboard = () => {
    navigate('/my-account');
  };

  const handleManageSubscription = () => {
    navigate('/subscription/manage');
  };

  const trialEndDate = subscription?.trial_end
    ? new Date(subscription.trial_end).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });

  return (
    <Container maxWidth="md" className="subscription-success-page">
      <Box sx={{ py: 8, textAlign: 'center' }}>
        {/* Success Icon */}
        <CheckCircleIcon
          sx={{
            fontSize: 100,
            color: 'success.main',
            mb: 3
          }}
        />

        {/* Header */}
        <Typography variant="h3" component="h1" gutterBottom>
          {t('subscription.success.title', 'Welcome to SwissAI Tax!')}
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
          {t('subscription.success.subtitle', 'Your free trial has started')}
        </Typography>

        {/* Success Details */}
        <Paper sx={{ p: 4, mb: 4, textAlign: 'left' }}>
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <CheckCircleIcon sx={{ mr: 1, color: 'success.main' }} />
            {t('subscription.success.confirmation', 'Subscription Confirmed')}
          </Typography>

          <List>
            <ListItem>
              <ListItemIcon>
                <CalendarTodayIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={t('subscription.success.trial_period', 'Trial Period')}
                secondary={t(
                  'subscription.success.trial_details',
                  `Your 30-day free trial ends on ${trialEndDate}`
                )}
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <CreditCardIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={t('subscription.success.billing', 'Billing')}
                secondary={
                  planType === '5_year_lock'
                    ? t(
                        'subscription.success.billing_5year',
                        'CHF 89/year - Price locked for 5 years'
                      )
                    : t(
                        'subscription.success.billing_annual',
                        'CHF 129/year - Cancel anytime'
                      )
                }
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={t('subscription.success.access', 'Full Access')}
                secondary={t(
                  'subscription.success.access_details',
                  'You now have unlimited access to all SwissAI Tax features'
                )}
              />
            </ListItem>
          </List>
        </Paper>

        {/* Next Steps */}
        <Paper sx={{ p: 4, mb: 4, bgcolor: 'primary.light', textAlign: 'left' }}>
          <Typography variant="h6" gutterBottom>
            {t('subscription.success.next_steps', 'What\'s Next?')}
          </Typography>
          <List>
            <ListItem>
              <ListItemText
                primary="1. Start Your Tax Filing"
                secondary="Complete your Swiss tax return with AI assistance"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="2. Explore Features"
                secondary="Upload documents, get insights, and maximize your deductions"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="3. Set Reminders"
                secondary="We'll remind you 3 days before your trial ends"
              />
            </ListItem>
          </List>
        </Paper>

        {/* Important Notice */}
        <Paper sx={{ p: 3, mb: 4, bgcolor: 'info.light' }}>
          <Typography variant="body1" gutterBottom sx={{ fontWeight: 'bold' }}>
            {t('subscription.success.reminder_title', 'Important Reminder')}
          </Typography>
          <Typography variant="body2">
            {t(
              'subscription.success.reminder_text',
              `You won't be charged until ${trialEndDate}. Cancel anytime before then at no cost. We'll send you email reminders before your trial ends.`
            )}
          </Typography>
        </Paper>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleGoToDashboard}
            sx={{ minWidth: 200 }}>
            {t('subscription.success.go_to_dashboard', 'Go to Dashboard')}
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={handleManageSubscription}
            sx={{ minWidth: 200 }}>
            {t('subscription.success.manage_subscription', 'Manage Subscription')}
          </Button>
        </Box>

        {/* Support Link */}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 4 }}>
          {t('subscription.success.need_help', 'Need help?')}{' '}
          <a href="/support" style={{ color: '#1976d2' }}>
            {t('subscription.success.contact_support', 'Contact Support')}
          </a>
        </Typography>
      </Box>
    </Container>
  );
};

export default SubscriptionSuccess;
