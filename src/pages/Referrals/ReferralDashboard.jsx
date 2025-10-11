import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Paper,
  Divider,
  CircularProgress,
  Alert,
  Snackbar,
  Chip,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  Share as ShareIcon,
  EmojiEvents as TrophyIcon,
  People as PeopleIcon,
  AccountBalance as WalletIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import Header from '../../components/header/Header';
import Footer from '../../components/footer/Footer';
import referralService from '../../services/referralService';

const ReferralDashboard = () => {
  const { t } = useTranslation();

  // State
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState(null);
  const [stats, setStats] = useState(null);
  const [credits, setCredits] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [referralLink, setReferralLink] = useState('');

  // Fetch referral data on mount
  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      setLoading(true);

      // Fetch referral code, stats, and credits in parallel
      const [codeResult, statsResult, creditsResult] = await Promise.all([
        referralService.getMyReferralCode(),
        referralService.getMyReferralStats(),
        referralService.getMyCredits()
      ]);

      if (codeResult.success && codeResult.data) {
        setReferralCode(codeResult.data.referral_code);
        const link = referralService.generateReferralLink(codeResult.data.referral_code);
        setReferralLink(link);
      }

      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      }

      if (creditsResult.success && creditsResult.data) {
        setCredits(creditsResult.data.credits || []);
      }
    } catch (error) {
      console.error('Failed to fetch referral data:', error);
      showSnackbar('Failed to load referral data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    const success = await referralService.copyToClipboard(referralCode);
    if (success) {
      showSnackbar('Referral code copied to clipboard!', 'success');
    } else {
      showSnackbar('Failed to copy code', 'error');
    }
  };

  const handleCopyLink = async () => {
    const success = await referralService.copyToClipboard(referralLink);
    if (success) {
      showSnackbar('Referral link copied to clipboard!', 'success');
    } else {
      showSnackbar('Failed to copy link', 'error');
    }
  };

  const handleShareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join SwissAI Tax',
          text: `Join SwissAI Tax and get 10% off your first year! Use my referral code: ${referralCode}`,
          url: referralLink
        });
        showSnackbar('Shared successfully!', 'success');
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Share failed:', error);
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <Box display="flex" justifyContent="center" alignItems="center" flex={1}>
          <CircularProgress />
        </Box>
        <Footer />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <Container maxWidth="lg" sx={{ py: 6, flex: 1 }}>
        {/* Header Section */}
        <Box mb={4}>
          <Typography variant="h3" gutterBottom fontWeight={700}>
            {t('Refer Friends & Earn Rewards')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('Share your referral code and earn CHF 10 credit for each friend who subscribes')}
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', bgcolor: 'primary.50' }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <PeopleIcon color="primary" sx={{ mr: 1, fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" fontWeight={700}>
                      {stats?.total_referrals || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('Total Referrals')}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {stats?.successful_referrals || 0} {t('converted to paid subscriptions')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', bgcolor: 'success.50' }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <TrophyIcon color="success" sx={{ mr: 1, fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" fontWeight={700}>
                      {referralService.formatCurrency(stats?.total_rewards_earned_chf || 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('Total Earned')}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {t('Lifetime rewards from referrals')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', bgcolor: 'warning.50' }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <WalletIcon color="warning" sx={{ mr: 1, fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" fontWeight={700}>
                      {referralService.formatCurrency(stats?.account_credit_balance_chf || 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('Available Credits')}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {t('Can be used for subscription payments')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Referral Code Card */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom fontWeight={600}>
              {t('Your Referral Code')}
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              {t('Share this code with friends or use the link below')}
            </Typography>

            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  value={referralCode || ''}
                  InputProps={{
                    readOnly: true,
                    endAdornment: (
                      <Tooltip title={t('Copy Code')}>
                        <IconButton onClick={handleCopyCode} edge="end">
                          <CopyIcon />
                        </IconButton>
                      </Tooltip>
                    ),
                    sx: {
                      fontFamily: 'monospace',
                      fontSize: '1.2rem',
                      fontWeight: 600
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Box display="flex" gap={1}>
                  <Button
                    variant="contained"
                    startIcon={<CopyIcon />}
                    onClick={handleCopyLink}
                    fullWidth
                  >
                    {t('Copy Link')}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<ShareIcon />}
                    onClick={handleShareLink}
                    fullWidth
                  >
                    {t('Share')}
                  </Button>
                </Box>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Box
              sx={{
                p: 2,
                bgcolor: 'grey.50',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'grey.200'
              }}
            >
              <Typography variant="body2" sx={{ wordBreak: 'break-all', fontFamily: 'monospace' }}>
                {referralLink}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom fontWeight={600}>
              {t('How It Works')}
            </Typography>
            <Grid container spacing={3} mt={1}>
              <Grid item xs={12} md={4}>
                <Box textAlign="center">
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      mx: 'auto',
                      mb: 2
                    }}
                  >
                    1
                  </Box>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    {t('Share Your Code')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('Send your unique referral code or link to friends')}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box textAlign="center">
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      bgcolor: 'success.main',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      mx: 'auto',
                      mb: 2
                    }}
                  >
                    2
                  </Box>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    {t('They Subscribe')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('Your friend uses the code and gets 10% off their first year')}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box textAlign="center">
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      bgcolor: 'warning.main',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      mx: 'auto',
                      mb: 2
                    }}
                  >
                    3
                  </Box>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    {t('You Earn Credits')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('Get CHF 10 credit when they complete their payment')}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Credit History */}
        {credits && credits.length > 0 && (
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom fontWeight={600}>
                {t('Credit History')}
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('Date')}</TableCell>
                      <TableCell>{t('Description')}</TableCell>
                      <TableCell align="right">{t('Amount')}</TableCell>
                      <TableCell align="right">{t('Balance')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {credits.map((credit) => (
                      <TableRow key={credit.id}>
                        <TableCell>
                          {referralService.formatDate(credit.created_at)}
                        </TableCell>
                        <TableCell>{credit.description || t('Referral Reward')}</TableCell>
                        <TableCell align="right">
                          <Typography
                            color={credit.transaction_type === 'credit' ? 'success.main' : 'error.main'}
                            fontWeight={600}
                          >
                            {credit.transaction_type === 'credit' ? '+' : '-'}
                            {referralService.formatCurrency(Math.abs(credit.amount_chf))}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {referralService.formatCurrency(credit.balance_after_chf)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}
      </Container>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Footer />
    </Box>
  );
};

export default ReferralDashboard;
