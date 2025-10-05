import React from 'react';
import {
  Container,
  Typography,
  Box,
  Breadcrumbs,
  Link as MuiLink
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon
} from '@mui/icons-material';
import Header from '../../components/header/Header';
import Footer from '../../components/footer/Footer';
import PersonalInfoSection from './components/PersonalInfoSection';
import TaxProfileSection from './components/TaxProfileSection';
import SecuritySection from './components/SecuritySection';

const Profile = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

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

        {/* Profile Sections */}
        <Box display="flex" flexDirection="column" gap={3}>
          <PersonalInfoSection />
          <TaxProfileSection />
          <SecuritySection />
        </Box>
      </Container>

      <Footer />
    </Box>
  );
};

export default Profile;
