import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Chip,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  CheckCircle as SuccessIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import Header from '../../components/header/Header';
import Footer from '../../components/footer/Footer';
import referralService from '../../services/referralService';

const PromotionalCodeCreator = () => {
  const { t } = useTranslation();

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    code_type: 'promotional',
    discount_type: 'percentage',
    discount_value: '',
    max_discount_amount: '',
    applicable_plans: [],
    first_time_only: true,
    minimum_subscription_months: 1,
    max_total_uses: '',
    max_uses_per_user: 1,
    valid_from: new Date(),
    valid_until: null,
    is_active: true,
    is_stackable: false,
    campaign_name: '',
    description: '',
    internal_notes: ''
  });

  // UI State
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [createdCode, setCreatedCode] = useState(null);

  const handleChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData({ ...formData, [field]: value });
    setError('');
  };

  const handleDateChange = (field) => (date) => {
    setFormData({ ...formData, [field]: date });
  };

  const handlePlanSelection = (event) => {
    const value = event.target.value;
    setFormData({ ...formData, applicable_plans: typeof value === 'string' ? value.split(',') : value });
  };

  const validateForm = () => {
    if (!formData.code || formData.code.trim() === '') {
      setError(t('Code is required'));
      return false;
    }

    if (!formData.discount_value || parseFloat(formData.discount_value) <= 0) {
      setError(t('Discount value must be greater than 0'));
      return false;
    }

    if (formData.discount_type === 'percentage' && parseFloat(formData.discount_value) > 100) {
      setError(t('Percentage discount cannot exceed 100%'));
      return false;
    }

    if (formData.valid_until && formData.valid_until <= formData.valid_from) {
      setError(t('End date must be after start date'));
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess(false);

      // Prepare data for API
      const codeData = {
        code: formData.code.toUpperCase().trim(),
        code_type: formData.code_type,
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : null,
        applicable_plans: formData.applicable_plans.length > 0 ? formData.applicable_plans : null,
        first_time_only: formData.first_time_only,
        minimum_subscription_months: parseInt(formData.minimum_subscription_months) || 1,
        max_total_uses: formData.max_total_uses ? parseInt(formData.max_total_uses) : null,
        max_uses_per_user: parseInt(formData.max_uses_per_user) || 1,
        valid_from: formData.valid_from.toISOString(),
        valid_until: formData.valid_until ? formData.valid_until.toISOString() : null,
        is_active: formData.is_active,
        is_stackable: formData.is_stackable,
        campaign_name: formData.campaign_name || null,
        description: formData.description || null,
        internal_notes: formData.internal_notes || null
      };

      const result = await referralService.createPromotionalCode(codeData);

      if (result.success) {
        setSuccess(true);
        setCreatedCode(result.data);
        // Reset form
        setFormData({
          code: '',
          code_type: 'promotional',
          discount_type: 'percentage',
          discount_value: '',
          max_discount_amount: '',
          applicable_plans: [],
          first_time_only: true,
          minimum_subscription_months: 1,
          max_total_uses: '',
          max_uses_per_user: 1,
          valid_from: new Date(),
          valid_until: null,
          is_active: true,
          is_stackable: false,
          campaign_name: '',
          description: '',
          internal_notes: ''
        });
      } else {
        setError(result.error || t('Failed to create promotional code'));
      }
    } catch (err) {
      console.error('Error creating code:', err);
      setError(t('An error occurred while creating the code'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <Container maxWidth="lg" sx={{ py: 6, flex: 1 }}>
        {/* Header */}
        <Box mb={4}>
          <Typography variant="h3" gutterBottom fontWeight={700}>
            {t('Create Promotional Code')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('Create discount codes for marketing campaigns and promotions')}
          </Typography>
        </Box>

        {/* Success Alert */}
        {success && createdCode && (
          <Alert severity="success" sx={{ mb: 3 }} icon={<SuccessIcon />}>
            <Typography variant="subtitle1" fontWeight={600}>
              {t('Promotional code created successfully!')}
            </Typography>
            <Typography variant="body2">
              {t('Code')}: <strong>{createdCode.referral_code}</strong>
            </Typography>
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Form */}
        <Paper sx={{ p: 4 }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Basic Information */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  {t('Basic Information')}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label={t('Code')}
                  value={formData.code}
                  onChange={handleChange('code')}
                  placeholder="SPRING2024"
                  helperText={t('Unique code that users will enter')}
                  inputProps={{ style: { textTransform: 'uppercase' } }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>{t('Code Type')}</InputLabel>
                  <Select
                    value={formData.code_type}
                    label={t('Code Type')}
                    onChange={handleChange('code_type')}
                  >
                    <MenuItem value="promotional">{t('Promotional')}</MenuItem>
                    <MenuItem value="partner">{t('Partner')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t('Campaign Name')}
                  value={formData.campaign_name}
                  onChange={handleChange('campaign_name')}
                  helperText={t('Internal campaign identifier')}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t('Description')}
                  value={formData.description}
                  onChange={handleChange('description')}
                  helperText={t('User-facing description')}
                />
              </Grid>

              <Divider sx={{ width: '100%', my: 2 }} />

              {/* Discount Configuration */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  {t('Discount Configuration')}
                </Typography>
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth required>
                  <InputLabel>{t('Discount Type')}</InputLabel>
                  <Select
                    value={formData.discount_type}
                    label={t('Discount Type')}
                    onChange={handleChange('discount_type')}
                  >
                    <MenuItem value="percentage">{t('Percentage')}</MenuItem>
                    <MenuItem value="fixed_amount">{t('Fixed Amount (CHF)')}</MenuItem>
                    <MenuItem value="trial_extension">{t('Trial Extension (days)')}</MenuItem>
                    <MenuItem value="account_credit">{t('Account Credit (CHF)')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label={
                    formData.discount_type === 'percentage'
                      ? t('Discount Percentage')
                      : formData.discount_type === 'trial_extension'
                      ? t('Days')
                      : t('Amount (CHF)')
                  }
                  value={formData.discount_value}
                  onChange={handleChange('discount_value')}
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('Max Discount Amount (CHF)')}
                  value={formData.max_discount_amount}
                  onChange={handleChange('max_discount_amount')}
                  helperText={t('Optional cap for percentage discounts')}
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>

              <Divider sx={{ width: '100%', my: 2 }} />

              {/* Applicability */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  {t('Applicability')}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>{t('Applicable Plans')}</InputLabel>
                  <Select
                    multiple
                    value={formData.applicable_plans}
                    onChange={handlePlanSelection}
                    label={t('Applicable Plans')}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    <MenuItem value="basic">{t('Basic')}</MenuItem>
                    <MenuItem value="pro">{t('Pro')}</MenuItem>
                    <MenuItem value="premium">{t('Premium')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('Minimum Subscription Months')}
                  value={formData.minimum_subscription_months}
                  onChange={handleChange('minimum_subscription_months')}
                  inputProps={{ min: 1, step: 1 }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.first_time_only}
                      onChange={handleChange('first_time_only')}
                    />
                  }
                  label={t('First-time subscribers only')}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_stackable}
                      onChange={handleChange('is_stackable')}
                    />
                  }
                  label={t('Stackable with other codes')}
                />
              </Grid>

              <Divider sx={{ width: '100%', my: 2 }} />

              {/* Usage Limits */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  {t('Usage Limits')}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('Max Total Uses')}
                  value={formData.max_total_uses}
                  onChange={handleChange('max_total_uses')}
                  helperText={t('Leave empty for unlimited')}
                  inputProps={{ min: 1, step: 1 }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('Max Uses Per User')}
                  value={formData.max_uses_per_user}
                  onChange={handleChange('max_uses_per_user')}
                  inputProps={{ min: 1, step: 1 }}
                />
              </Grid>

              <Divider sx={{ width: '100%', my: 2 }} />

              {/* Validity Period */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  {t('Validity Period')}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DateTimePicker
                    label={t('Valid From')}
                    value={formData.valid_from}
                    onChange={handleDateChange('valid_from')}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </LocalizationProvider>
              </Grid>

              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DateTimePicker
                    label={t('Valid Until')}
                    value={formData.valid_until}
                    onChange={handleDateChange('valid_until')}
                    renderInput={(params) => (
                      <TextField {...params} fullWidth helperText={t('Leave empty for no expiration')} />
                    )}
                  />
                </LocalizationProvider>
              </Grid>

              <Divider sx={{ width: '100%', my: 2 }} />

              {/* Status */}
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_active}
                      onChange={handleChange('is_active')}
                      color="primary"
                    />
                  }
                  label={t('Active (users can use this code immediately)')}
                />
              </Grid>

              {/* Internal Notes */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label={t('Internal Notes')}
                  value={formData.internal_notes}
                  onChange={handleChange('internal_notes')}
                  helperText={t('Admin-only notes (not visible to users)')}
                />
              </Grid>

              {/* Submit Button */}
              <Grid item xs={12}>
                <Box display="flex" gap={2} justifyContent="flex-end">
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
                  >
                    {loading ? t('Creating...') : t('Create Promotional Code')}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Container>

      <Footer />
    </Box>
  );
};

export default PromotionalCodeCreator;
