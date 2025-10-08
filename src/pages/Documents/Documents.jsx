import React from 'react';
import {
  Container,
  Typography,
  Box,
  Breadcrumbs,
  Link as MuiLink,
  Grid
} from '@mui/material';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon
} from '@mui/icons-material';
import Header from '../../components/header/Header';
import Footer from '../../components/footer/Footer';
import DocumentManagementSection from '../../pages/Settings/components/DocumentManagementSection';

const Documents = () => {
  const { t } = useTranslation();

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
          <Typography color="text.primary">{t('Documents')}</Typography>
        </Breadcrumbs>

        {/* Page Header */}
        <Box mb={4}>
          <Typography variant="h3" gutterBottom fontWeight={700}>
            {t('Documents')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('Manage your tax documents and files')}
          </Typography>
        </Box>

        {/* Document Management Section */}
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <DocumentManagementSection />
          </Grid>
        </Grid>
      </Container>

      <Footer />
    </Box>
  );
};

export default Documents;
