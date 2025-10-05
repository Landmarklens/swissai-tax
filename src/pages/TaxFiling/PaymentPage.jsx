import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  Divider,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  CreditCard as CreditCardIcon,
  AccountBalance as BankIcon,
  ArrowBack as ArrowBackIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '../../components/header/Header';
import Footer from '../../components/footer/Footer';

const PaymentPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedPlan, setSelectedPlan] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [processing, setProcessing] = useState(false);

  const plans = [
    {
      id: 'basic',
      name: t('Basic'),
      price: 0,
      currency: 'CHF',
      features: [
        { text: t('Basic tax calculation'), included: true },
        { text: t('Q&A interview'), included: true },
        { text: t('Document upload'), included: false },
        { text: t('E-filing'), included: false },
        { text: t('Support'), included: false }
      ]
    },
    {
      id: 'standard',
      name: t('Standard'),
      price: 39,
      currency: 'CHF',
      recommended: true,
      features: [
        { text: t('All Basic features'), included: true },
        { text: t('Unlimited document uploads'), included: true },
        { text: t('OCR scanning'), included: true },
        { text: t('E-filing support'), included: true },
        { text: t('Email support'), included: true }
      ]
    },
    {
      id: 'premium',
      name: t('Premium'),
      price: 99,
      currency: 'CHF',
      features: [
        { text: t('All Standard features'), included: true },
        { text: t('Expert review'), included: true },
        { text: t('Phone support'), included: true },
        { text: t('Priority processing'), included: true },
        { text: t('Tax optimization tips'), included: true }
      ]
    }
  ];

  const handlePayment = async () => {
    try {
      setProcessing(true);

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Navigate to submission page
      navigate('/tax-filing/submit', {
        state: {
          session_id: location.state?.session_id,
          plan: selectedPlan,
          paid: true
        }
      });
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Payment failed:', err);
      }
    } finally {
      setProcessing(false);
    }
  };

  const selectedPlanDetails = plans.find(p => p.id === selectedPlan);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <Container maxWidth="lg" sx={{ py: 6, flex: 1 }}>
        <Box mb={4}>
          <Typography variant="h3" fontWeight={700} gutterBottom>
            {t('Choose Your Plan')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('Select a plan that best fits your needs')}
          </Typography>
        </Box>

        {/* Plan Selection */}
        <Grid container spacing={3} mb={6}>
          {plans.map((plan) => (
            <Grid item xs={12} md={4} key={plan.id}>
              <Card
                sx={{
                  height: '100%',
                  border: selectedPlan === plan.id ? '3px solid #DC0018' : '1px solid #E0E0E0',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: 6
                  }
                }}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {plan.recommended && (
                  <Chip
                    label={t('Recommended')}
                    color="primary"
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      backgroundColor: '#DC0018'
                    }}
                  />
                )}

                <CardContent sx={{ pt: plan.recommended ? 6 : 3 }}>
                  <Typography variant="h5" fontWeight={700} gutterBottom>
                    {plan.name}
                  </Typography>

                  <Box display="flex" alignItems="baseline" mb={3}>
                    <Typography variant="h3" fontWeight={700} color="primary">
                      {plan.price === 0 ? t('FREE') : plan.price}
                    </Typography>
                    {plan.price > 0 && (
                      <Typography variant="body2" color="text.secondary" ml={0.5}>
                        {plan.currency}
                      </Typography>
                    )}
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <List dense>
                    {plan.features.map((feature, idx) => (
                      <ListItem key={idx} sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          {feature.included ? (
                            <CheckIcon sx={{ color: '#4CAF50', fontSize: 20 }} />
                          ) : (
                            <CloseIcon sx={{ color: '#9E9E9E', fontSize: 20 }} />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={feature.text}
                          primaryTypographyProps={{
                            variant: 'body2',
                            color: feature.included ? 'text.primary' : 'text.secondary'
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>

                  <Button
                    variant={selectedPlan === plan.id ? 'contained' : 'outlined'}
                    fullWidth
                    sx={{ mt: 2 }}
                  >
                    {selectedPlan === plan.id ? t('Selected') : t('Select Plan')}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Payment Method Selection */}
        {selectedPlan !== 'basic' && (
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={3}>
                {t('Payment Method')}
              </Typography>

              <RadioGroup value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <FormControlLabel
                  value="card"
                  control={<Radio />}
                  label={
                    <Box display="flex" alignItems="center" gap={1}>
                      <CreditCardIcon />
                      <Typography>{t('Credit Card (Visa, Mastercard, Amex)')}</Typography>
                    </Box>
                  }
                  sx={{ mb: 2 }}
                />
                <FormControlLabel
                  value="twint"
                  control={<Radio />}
                  label={
                    <Box display="flex" alignItems="center" gap={1}>
                      <CreditCardIcon />
                      <Typography>{t('Twint')}</Typography>
                    </Box>
                  }
                  sx={{ mb: 2 }}
                />
                <FormControlLabel
                  value="bank"
                  control={<Radio />}
                  label={
                    <Box display="flex" alignItems="center" gap={1}>
                      <BankIcon />
                      <Typography>{t('Bank Transfer')}</Typography>
                    </Box>
                  }
                />
              </RadioGroup>

              {paymentMethod === 'card' && (
                <Box mt={3}>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <LockIcon fontSize="small" />
                      <Typography variant="body2">
                        {t('Secure payment processing powered by Stripe')}
                      </Typography>
                    </Box>
                  </Alert>
                  {/* Stripe Elements would go here */}
                  <Box
                    sx={{
                      p: 3,
                      border: '1px dashed #D0D0D0',
                      borderRadius: 2,
                      textAlign: 'center'
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      {t('Stripe payment form will be integrated here')}
                    </Typography>
                  </Box>
                </Box>
              )}

              {paymentMethod === 'bank' && (
                <Alert severity="info" sx={{ mt: 3 }}>
                  {t('Bank transfer details will be sent to your email after submission')}
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Order Summary */}
        <Card sx={{ mb: 4, backgroundColor: '#FAFAFA' }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} mb={2}>
              {t('Order Summary')}
            </Typography>

            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body1">{selectedPlanDetails?.name} {t('Plan')}</Typography>
              <Typography variant="body1" fontWeight={600}>
                {selectedPlanDetails?.price === 0
                  ? t('FREE')
                  : `${selectedPlanDetails?.currency} ${selectedPlanDetails?.price}`}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box display="flex" justifyContent="space-between">
              <Typography variant="h6" fontWeight={700}>
                {t('Total')}
              </Typography>
              <Typography variant="h6" fontWeight={700} color="primary">
                {selectedPlanDetails?.price === 0
                  ? t('FREE')
                  : `${selectedPlanDetails?.currency} ${selectedPlanDetails?.price}`}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <Box display="flex" justifyContent="space-between">
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/tax-filing/review')}
          >
            {t('Back')}
          </Button>
          <Button
            variant="contained"
            size="large"
            onClick={handlePayment}
            disabled={processing}
          >
            {processing
              ? t('Processing...')
              : selectedPlan === 'basic'
              ? t('Continue')
              : `${t('Pay')} ${selectedPlanDetails?.currency} ${selectedPlanDetails?.price}`}
          </Button>
        </Box>
      </Container>

      <Footer />
    </Box>
  );
};

export default PaymentPage;
