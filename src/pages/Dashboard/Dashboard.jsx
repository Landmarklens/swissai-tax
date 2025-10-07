import React, { useEffect, useState } from 'react';
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
  Divider,
  CircularProgress
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
import dashboardService from '../../services/dashboardService';

const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const session = useSelector(state => state.taxFiling?.session);
  const profile = useSelector(state => state.account?.profile);

  // State for dashboard data
  const [loading, setLoading] = useState(true);
  const [activeFiling, setActiveFiling] = useState(null);
  const [pastFilings, setPastFilings] = useState([]);
  const [stats, setStats] = useState({
    totalFilings: 0,
    totalRefunds: 0,
    averageRefund: 0,
    daysUntilDeadline: 0
  });

  // Fetch dashboard data on mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const result = await dashboardService.getDashboardData();

        if (result.success) {
          const formatted = dashboardService.formatDashboardData(result.data);

          // Set active filing (first one or null)
          setActiveFiling(formatted.activeFilings[0] || null);

          // Set past filings
          setPastFilings(formatted.pastFilings || []);

          // Set stats
          setStats(formatted.stats || {
            totalFilings: 0,
            totalRefunds: 0,
            averageRefund: 0,
            daysUntilDeadline: 0
          });
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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
            {t('Welcome back')}, {profile?.first_name || 'User'}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('Manage your Swiss tax filings and track your progress')}
          </Typography>
        </Box>

        {/* Loading State */}
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        ) : (
          <>
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
          </>
        )}
      </Container>

      <Footer />
    </Box>
  );
};

export default Dashboard;
