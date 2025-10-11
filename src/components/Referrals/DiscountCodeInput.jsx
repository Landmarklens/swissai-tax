import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Collapse,
  Typography,
  Chip,
  Paper
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Discount as DiscountIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import referralService from '../../services/referralService';

/**
 * DiscountCodeInput Component
 * Allows users to enter and validate discount/referral codes
 *
 * @param {Object} props
 * @param {string} props.planType - The subscription plan type
 * @param {number} props.originalPrice - Original subscription price
 * @param {Function} props.onDiscountApplied - Callback when discount is validated (receives discount info)
 * @param {Function} props.onDiscountRemoved - Callback when discount is removed
 * @param {string} props.initialCode - Pre-filled code (from URL param)
 */
const DiscountCodeInput = ({
  planType,
  originalPrice,
  onDiscountApplied,
  onDiscountRemoved,
  initialCode = ''
}) => {
  const { t } = useTranslation();

  // State
  const [code, setCode] = useState(initialCode);
  const [validating, setValidating] = useState(false);
  const [discountInfo, setDiscountInfo] = useState(null);
  const [error, setError] = useState('');
  const [showInput, setShowInput] = useState(!initialCode);

  // Auto-validate initial code if provided
  useEffect(() => {
    if (initialCode && planType) {
      handleValidateCode(initialCode);
    }
  }, [initialCode, planType]);

  const handleValidateCode = async (codeToValidate = code) => {
    if (!codeToValidate.trim()) {
      setError(t('Please enter a code'));
      return;
    }

    if (!planType) {
      setError(t('Please select a plan first'));
      return;
    }

    try {
      setValidating(true);
      setError('');

      const result = await referralService.validateDiscountCode(
        codeToValidate.trim().toUpperCase(),
        planType
      );

      if (result.success && result.data.is_valid) {
        setDiscountInfo(result.data);
        setShowInput(false);
        if (onDiscountApplied) {
          onDiscountApplied(result.data);
        }
      } else {
        setError(result.data?.error_message || result.error || t('Invalid or expired code'));
        setDiscountInfo(null);
      }
    } catch (err) {
      console.error('Validation error:', err);
      setError(t('Failed to validate code. Please try again.'));
      setDiscountInfo(null);
    } finally {
      setValidating(false);
    }
  };

  const handleRemoveDiscount = () => {
    setCode('');
    setDiscountInfo(null);
    setError('');
    setShowInput(true);
    if (onDiscountRemoved) {
      onDiscountRemoved();
    }
  };

  const handleCodeChange = (e) => {
    setCode(e.target.value.toUpperCase());
    setError('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleValidateCode();
    }
  };

  // Calculate discount details
  const discountDetails = discountInfo
    ? referralService.calculateDiscount(originalPrice, discountInfo)
    : null;

  return (
    <Box sx={{ width: '100%' }}>
      {/* Applied Discount Display */}
      {discountInfo && !showInput && (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            bgcolor: 'success.50',
            border: '1px solid',
            borderColor: 'success.200',
            borderRadius: 1
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1}>
              <CheckIcon color="success" />
              <Box>
                <Typography variant="subtitle2" fontWeight={600}>
                  {t('Discount Applied!')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('Code')}: <strong>{discountInfo.code}</strong>
                </Typography>
              </Box>
            </Box>
            <Box textAlign="right">
              <Chip
                label={`-${referralService.formatCurrency(discountDetails.discountAmount)}`}
                color="success"
                size="medium"
                sx={{ fontWeight: 700 }}
              />
              <Button
                size="small"
                onClick={handleRemoveDiscount}
                sx={{ ml: 1 }}
              >
                {t('Remove')}
              </Button>
            </Box>
          </Box>

          {discountInfo.description && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {discountInfo.description}
            </Typography>
          )}
        </Paper>
      )}

      {/* Input Form */}
      <Collapse in={showInput}>
        <Box>
          <Box display="flex" gap={1} alignItems="flex-start">
            <TextField
              fullWidth
              size="small"
              label={t('Discount or Referral Code')}
              placeholder={t('Enter code')}
              value={code}
              onChange={handleCodeChange}
              onKeyPress={handleKeyPress}
              disabled={validating}
              error={!!error}
              InputProps={{
                startAdornment: <DiscountIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                sx: { fontFamily: 'monospace' }
              }}
            />
            <Button
              variant="outlined"
              onClick={() => handleValidateCode()}
              disabled={validating || !code.trim()}
              sx={{ minWidth: 100, height: 40 }}
            >
              {validating ? <CircularProgress size={20} /> : t('Apply')}
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mt: 1 }} icon={<ErrorIcon />}>
              {error}
            </Alert>
          )}

          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {t('Have a referral or promotional code? Enter it above to save on your subscription.')}
          </Typography>
        </Box>
      </Collapse>

      {/* Discount Breakdown */}
      {discountInfo && discountDetails && (
        <Box sx={{ mt: 2 }}>
          <Box display="flex" justifyContent="space-between" mb={0.5}>
            <Typography variant="body2" color="text.secondary">
              {t('Original Price')}:
            </Typography>
            <Typography variant="body2">
              {referralService.formatCurrency(discountDetails.discountAmount > 0 ? originalPrice : discountInfo.original_price_chf)}
            </Typography>
          </Box>
          <Box display="flex" justifyContent="space-between" mb={0.5}>
            <Typography variant="body2" color="success.main" fontWeight={600}>
              {t('Discount')} ({discountDetails.discountPercent}%):
            </Typography>
            <Typography variant="body2" color="success.main" fontWeight={600}>
              -{referralService.formatCurrency(discountDetails.discountAmount)}
            </Typography>
          </Box>
          <Box display="flex" justifyContent="space-between" pt={1} borderTop="1px solid" borderColor="divider">
            <Typography variant="subtitle1" fontWeight={700}>
              {t('Final Price')}:
            </Typography>
            <Typography variant="subtitle1" fontWeight={700} color="primary.main">
              {referralService.formatCurrency(discountDetails.finalPrice)}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default DiscountCodeInput;
