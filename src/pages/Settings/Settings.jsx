import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Breadcrumbs,
  Link as MuiLink,
  Tabs,
  Tab,
  Grid
} from '@mui/material';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Folder as FolderIcon,
  Receipt as ReceiptIcon,
  Security as SecurityIcon,
  History as HistoryIcon,
  PrivacyTip as PrivacyIcon
} from '@mui/icons-material';
import Header from '../../components/header/Header';
import Footer from '../../components/footer/Footer';
import PreferencesTab from './components/PreferencesTab';
import DocumentManagementSection from './components/DocumentManagementSection';
import BillingTab from './components/BillingTab';
import { TwoFactorSettings } from '../../components/TwoFactor';
import AuditLogsTab from './components/AuditLogsTab';
import AccountDeletionSection from './components/AccountDeletionSection';
import DataExportSection from './components/DataExportSection';

const Settings = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0);

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
          <Typography color="text.primary">{t('Settings')}</Typography>
        </Breadcrumbs>

        {/* Page Header */}
        <Box mb={4}>
          <Typography variant="h3" gutterBottom fontWeight={700}>
            {t('Settings')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('Customize your SwissTax experience')}
          </Typography>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab
              icon={<SettingsIcon />}
              iconPosition="start"
              label={t('Preferences & Notifications')}
            />
            <Tab
              icon={<SecurityIcon />}
              iconPosition="start"
              label={t('Security')}
            />
            <Tab
              icon={<FolderIcon />}
              iconPosition="start"
              label={t('Documents')}
            />
            <Tab
              icon={<ReceiptIcon />}
              iconPosition="start"
              label={t('Billing')}
            />
            <Tab
              icon={<HistoryIcon />}
              iconPosition="start"
              label={t('Activity Log')}
            />
            <Tab
              icon={<PrivacyIcon />}
              iconPosition="start"
              label={t('Data Privacy')}
            />
          </Tabs>
        </Box>

        {/* Tab Panels */}
        {activeTab === 0 && <PreferencesTab />}

        {activeTab === 1 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TwoFactorSettings />
            </Grid>
          </Grid>
        )}

        {activeTab === 2 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <DocumentManagementSection />
            </Grid>
          </Grid>
        )}

        {activeTab === 3 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <BillingTab />
            </Grid>
          </Grid>
        )}

        {activeTab === 4 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <AuditLogsTab />
            </Grid>
          </Grid>
        )}

        {activeTab === 5 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <DataExportSection />
            </Grid>
            <Grid item xs={12}>
              <AccountDeletionSection />
            </Grid>
          </Grid>
        )}
      </Container>

      <Footer />
    </Box>
  );
};

export default Settings;
