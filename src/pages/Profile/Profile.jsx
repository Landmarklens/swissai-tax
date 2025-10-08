import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Breadcrumbs,
  Link as MuiLink,
  Tabs,
  Tab,
  Paper
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
  Person as PersonIcon,
  Description as FilingIcon,
  Lightbulb as InsightIcon
} from '@mui/icons-material';
import axios from 'axios';
import Header from '../../components/header/Header';
import Footer from '../../components/footer/Footer';
import PersonalInfoSection from './components/PersonalInfoSection';
import TaxProfileSection from './components/TaxProfileSection';
import SecuritySection from './components/SecuritySection';
import InsightsSection from './components/InsightsSection';
import { getApiUrl } from '../../utils/api/getApiUrl';

const API_BASE_URL = getApiUrl();

const Profile = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [currentFiling, setCurrentFiling] = useState(null);

  // Load current/most recent filing
  useEffect(() => {
    loadCurrentFiling();
  }, []);

  const loadCurrentFiling = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/tax-filing/filings`);

      // Get the most recent filing
      const filings = response.data.filings || {};
      const years = Object.keys(filings).sort((a, b) => b - a);

      if (years.length > 0 && filings[years[0]].length > 0) {
        // Get first filing from most recent year
        setCurrentFiling(filings[years[0]][0]);
      }
    } catch (err) {
      console.error('Error loading current filing:', err);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <Container maxWidth="lg" sx={{ py: 6, flex: 1 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          sx={{ mb: 3 }}
        >
          <MuiLink
            component={Link}
            to="/dashboard"
            underline="hover"
            color="inherit"
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            <HomeIcon fontSize="small" />
            {t('Dashboard')}
          </MuiLink>
          <Typography color="text.primary">{t('Profile')}</Typography>
        </Breadcrumbs>

        {/* Page Header */}
        <Box mb={4}>
          <Typography variant="h3" gutterBottom fontWeight={700}>
            {t('My Profile')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('Manage your personal information and security settings')}
          </Typography>
        </Box>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
            <Tab icon={<PersonIcon />} label={t('Personal Info')} iconPosition="start" />
            <Tab icon={<FilingIcon />} label={t('Tax Profile')} iconPosition="start" />
            <Tab
              icon={<InsightIcon />}
              label={t('Tax Insights')}
              iconPosition="start"
              disabled={!currentFiling}
            />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        <Box>
          {activeTab === 0 && (
            <Box display="flex" flexDirection="column" gap={3}>
              <PersonalInfoSection />
              <SecuritySection />
            </Box>
          )}

          {activeTab === 1 && (
            <TaxProfileSection />
          )}

          {activeTab === 2 && currentFiling && (
            <InsightsSection filingId={currentFiling.id} />
          )}
        </Box>
      </Container>

      <Footer />
    </Box>
  );
};

export default Profile;
