import React, { useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  LinearProgress,
  Chip,
  Paper,
  Divider
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  Description as DescriptionIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import Header from '../../components/header/Header';
import Footer from '../../components/footer/Footer';
import FilingStatusCard from './components/FilingStatusCard';
import FilingHistoryTable from './components/FilingHistoryTable';
import QuickStatsPanel from './components/QuickStatsPanel';

const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const session = useSelector(state => state.taxFiling?.session);
  const profile = useSelector(state => state.account?.profile);

  // Mock data - will be replaced with real API calls
  const activeFiling = {
    taxYear: 2024,
    status: 'in_progress',
    progress: 60,
    lastSaved: '2024-10-04T20:30:00Z',
    estimatedRefund: 450
  };

  const pastFilings = [
    {
      id: 'filing_2023',
      taxYear: 2023,
      status: 'filed',
      submittedDate: '2024-04-15',
      refundAmount: 450,
      confirmationNumber: 'ZH-2023-123456'
    },
    {
      id: 'filing_2022',
      taxYear: 2022,
      status: 'filed',
      submittedDate: '2023-04-10',
      refundAmount: 320,
      confirmationNumber: 'ZH-2022-789012'
    }
  ];

  const stats = {
    totalFilings: 3,
    totalRefunds: 1050,
    averageRefund: 350,
    daysUntilDeadline: 45
  };

  const handleContinueFiling = () => {
    navigate('/tax-filing/interview');
  };

  const handleStartNewFiling = () => {
    navigate('/tax-filing/interview');
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <Container maxWidth="lg" sx={{ py: 6, flex: 1 }}>
        {/* Welcome Section */}
        <Box mb={4}>
          <Typography variant="h3" gutterBottom fontWeight={700}>
            {t('Welcome back')}, {profile?.personal?.fullName || 'User'}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('Manage your Swiss tax filings and track your progress')}
          </Typography>
        </Box>

        {/* Active Filing & Stats Row */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} md={8}>
            <FilingStatusCard
              filing={activeFiling}
              onContinue={handleContinueFiling}
              onStartNew={handleStartNewFiling}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <QuickStatsPanel stats={stats} />
          </Grid>
        </Grid>

        {/* Past Filings Section */}
        <Box mb={4}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h5" fontWeight={600}>
              {t('Past Tax Filings')}
            </Typography>
            <Button
              startIcon={<AddIcon />}
              variant="outlined"
              onClick={handleStartNewFiling}
            >
              {t('Start New Year')}
            </Button>
          </Box>

          <FilingHistoryTable filings={pastFilings} />
        </Box>

        {/* Tax Tips Section */}
        <Paper
          sx={{
            p: 3,
            background: 'linear-gradient(135deg, #FFE5E8 0%, #FFFFFF 100%)',
            border: '1px solid rgba(220, 0, 24, 0.1)'
          }}
        >
          <Typography variant="h6" gutterBottom fontWeight={600}>
            💡 {t('Tax Tips & Reminders')}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Typography variant="body2">
              • {t("Don't forget to claim your pillar 3a contributions for maximum tax savings")}
            </Typography>
            <Typography variant="body2">
              • {t('Only')} {stats.daysUntilDeadline} {t('days left until the filing deadline')}
            </Typography>
            <Typography variant="body2">
              • {t('Upload all documents early to avoid last-minute stress')}
            </Typography>
          </Box>
        </Paper>
      </Container>

      <Footer />
    </Box>
  );
};

export default Dashboard;
