import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  AccountBalance as WalletIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import referralService from '../../services/referralService';

/**
 * AccountCredits Component
 * Displays user's account credit balance and recent transactions
 *
 * @param {Object} props
 * @param {boolean} props.showHistory - Whether to show transaction history (default: true)
 * @param {number} props.limit - Number of transactions to show (default: 5)
 */
const AccountCredits = ({ showHistory = true, limit = 5 }) => {
  const { t } = useTranslation();

  // State
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState([]);
  const [balance, setBalance] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCredits();
  }, []);

  const fetchCredits = async () => {
    try {
      setLoading(true);
      setError('');

      const result = await referralService.getMyCredits();

      if (result.success && result.data) {
        setCredits(result.data.credits || []);
        setBalance(result.data.total_balance_chf || 0);
      } else {
        setError(result.error || t('Failed to load credits'));
      }
    } catch (err) {
      console.error('Failed to fetch credits:', err);
      setError(t('Failed to load account credits'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={100}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  const recentCredits = showHistory ? credits.slice(0, limit) : [];

  return (
    <Card>
      <CardContent>
        {/* Balance Header */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <WalletIcon color="primary" sx={{ fontSize: 32 }} />
            <Box>
              <Typography variant="caption" color="text.secondary">
                {t('Available Credits')}
              </Typography>
              <Typography variant="h5" fontWeight={700}>
                {referralService.formatCurrency(balance)}
              </Typography>
            </Box>
          </Box>
          <Chip
            label={balance > 0 ? t('Active') : t('No Credits')}
            color={balance > 0 ? 'success' : 'default'}
            size="small"
          />
        </Box>

        {balance > 0 && (
          <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 2 }}>
            {t('Your credits will be automatically applied to your next subscription payment')}
          </Alert>
        )}

        {/* Transaction History */}
        {showHistory && recentCredits.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              {t('Recent Transactions')}
            </Typography>
            <List dense disablePadding>
              {recentCredits.map((credit, index) => (
                <ListItem
                  key={credit.id || index}
                  disablePadding
                  sx={{
                    py: 1,
                    borderBottom: index < recentCredits.length - 1 ? '1px solid' : 'none',
                    borderColor: 'divider'
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {credit.transaction_type === 'credit' ? (
                      <TrendingUpIcon color="success" fontSize="small" />
                    ) : (
                      <TrendingDownIcon color="error" fontSize="small" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2">
                          {credit.description || (credit.transaction_type === 'credit' ? t('Credit Added') : t('Credit Used'))}
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          color={credit.transaction_type === 'credit' ? 'success.main' : 'error.main'}
                        >
                          {credit.transaction_type === 'credit' ? '+' : '-'}
                          {referralService.formatCurrency(Math.abs(credit.amount_chf))}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {referralService.formatDate(credit.created_at)}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </>
        )}

        {showHistory && credits.length === 0 && (
          <Box textAlign="center" py={3}>
            <WalletIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              {t('No credit transactions yet')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t('Refer friends to earn credits!')}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default AccountCredits;
