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
      name: t('payment.plan.basic'),
      price: 0,
      currency: t('payment.currency'),
      features: [
        { text: t('payment.feature.basic_tax_calculation'), included: true },
        { text: t('payment.feature.qa_interview'), included: true },
        { text: t('payment.feature.document_upload'), included: false },
        { text: t('payment.feature.e_filing'), included: false },
        { text: t('payment.feature.support'), included: false }
      ]
    },
    {
      id: 'standard',
      name: t('payment.plan.standard'),
      price: 39,
      currency: t('payment.currency'),
      recommended: true,
      features: [
        { text: t('payment.feature.all_basic_features'), included: true },
        { text: t('payment.feature.unlimited_document_uploads'), included: true },
        { text: t('payment.feature.ocr_scanning'), included: true },
        { text: t('payment.feature.e_filing_support'), included: true },
        { text: t('payment.feature.email_support'), included: true }
      ]
    },
    {
      id: 'premium',
      name: t('payment.plan.premium'),
      price: 99,
      currency: t('payment.currency'),
      features: [
        { text: t('payment.feature.all_standard_features'), included: true },
        { text: t('payment.feature.expert_review'), included: true },
        { text: t('payment.feature.phone_support'), included: true },
        { text: t('payment.feature.priority_processing'), included: true },
        { text: t('payment.feature.tax_optimization_tips'), included: true }
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
            {t('payment.page_title')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('payment.page_subtitle')}
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
                    label={t('payment.plan.recommended')}
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
                      {plan.price === 0 ? t('payment.free') : plan.price}
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
                    {selectedPlan === plan.id ? t('payment.plan.selected') : t('payment.plan.select')}
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
                {t('payment.method.title')}
              </Typography>

              <RadioGroup value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <FormControlLabel
                  value="card"
                  control={<Radio />}
                  label={
                    <Box display="flex" alignItems="center" gap={1}>
                      <CreditCardIcon />
                      <Typography>{t('payment.method.credit_card')}</Typography>
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
                      <Typography>{t('payment.method.twint')}</Typography>
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
                      <Typography>{t('payment.method.bank_transfer')}</Typography>
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
                        {t('payment.secure_stripe')}
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
                      {t('payment.stripe_form_placeholder')}
                    </Typography>
                  </Box>
                </Box>
              )}

              {paymentMethod === 'bank' && (
                <Alert severity="info" sx={{ mt: 3 }}>
                  {t('payment.bank_transfer_notice')}
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Order Summary */}
        <Card sx={{ mb: 4, backgroundColor: '#FAFAFA' }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} mb={2}>
              {t('payment.summary_title')}
            </Typography>

            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body1">{selectedPlanDetails?.name} {t('payment.summary_plan_suffix')}</Typography>
              <Typography variant="body1" fontWeight={600}>
                {selectedPlanDetails?.price === 0
                  ? t('payment.free')
                  : `${selectedPlanDetails?.currency} ${selectedPlanDetails?.price}`}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box display="flex" justifyContent="space-between">
              <Typography variant="h6" fontWeight={700}>
                {t('payment.summary_total')}
              </Typography>
              <Typography variant="h6" fontWeight={700} color="primary">
                {selectedPlanDetails?.price === 0
                  ? t('payment.free')
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
            {t('payment.button.back')}
          </Button>
          <Button
            variant="contained"
            size="large"
            onClick={handlePayment}
            disabled={processing}
          >
            {processing
              ? t('payment.button.processing')
              : selectedPlan === 'basic'
              ? t('payment.button.continue')
              : `${t('payment.button.pay')} ${selectedPlanDetails?.currency} ${selectedPlanDetails?.price}`}
          </Button>
        </Box>
      </Container>

      <Footer />
    </Box>
  );
};

export default PaymentPage;
