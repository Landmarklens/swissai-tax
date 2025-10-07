import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Button,
  Tab,
  Tabs,
  Grid,
  Paper,
  Chip
} from '@mui/material';
import { styled } from '@mui/system';
import { useTranslation } from 'react-i18next';
import ROICalculator from '../../ROICalculator/ROICalculator';
import ComparisonTable from '../../ComparisonTable/ComparisonTable';
import CaseStudies from '../../CaseStudies/CaseStudies';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import GroupIcon from '@mui/icons-material/Group';

const PainPointCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: '12px',
  border: '2px solid',
  borderColor: 'transparent',
  background: 'white',
  transition: 'all 0.3s ease',
  height: '100%',
  '&:hover': {
    borderColor: theme.palette.error.light,
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 16px rgba(239, 68, 68, 0.1)',
  }
}));

const SolutionCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: '12px',
  border: '2px solid',
  borderColor: 'transparent',
  background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
  transition: 'all 0.3s ease',
  height: '100%',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 16px rgba(62, 99, 221, 0.15)',
  }
}));

const StyledTabs = styled(Tabs)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  '& .MuiTabs-indicator': {
    height: 3,
    borderRadius: '3px 3px 0 0',
  },
}));

const EnhancedFeatures = ({ userType = 'landlord', handleOpenAuthModal }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
  }, [userType, handleOpenAuthModal]);

  const painPoints = [
    {
      icon: <TrendingDownIcon sx={{ color: '#ef4444', fontSize: '2rem' }} />,
      title: t('High Vacancy Rates'),
      description: t('Every empty day costs you money. Traditional methods average 30-45 days vacancy.'),
      stat: t('CHF 2,000-3,000 lost per month')
    },
    {
      icon: <AccessTimeIcon sx={{ color: '#ef4444', fontSize: '2rem' }} />,
      title: t('Time-Consuming Screening'),
      description: t('Hours spent reviewing applications, checking references, and coordinating viewings.'),
      stat: t('15+ hours per rental')
    },
    {
      icon: <MonetizationOnIcon sx={{ color: '#ef4444', fontSize: '2rem' }} />,
      title: t('Income Uncertainty'),
      description: t('Manual tenant selection often misses red flags, leading to payment delays and vacancies.'),
      stat: t('20% of landlords face payment issues')
    },
    {
      icon: <GroupIcon sx={{ color: '#ef4444', fontSize: '2rem' }} />,
      title: t('Managing Multiple Channels'),
      description: t('Juggling inquiries from different platforms leads to missed opportunities.'),
      stat: t('40% of leads are missed')
    }
  ];

  const solutions = [
    {
      icon: <CheckCircleIcon sx={{ color: '#65BA74', fontSize: '2rem' }} />,
      title: t('AI-Powered Matching'),
      description: t('Get quality tenants 60% faster with intelligent screening and ranking.'),
      benefit: t('Reduce vacancy by 12-18 days')
    },
    {
      icon: <CheckCircleIcon sx={{ color: '#65BA74', fontSize: '2rem' }} />,
      title: t('Automated Workflows'),
      description: t('From application to contract, everything is automated and compliant.'),
      benefit: t('Save 10+ hours per property')
    },
    {
      icon: <CheckCircleIcon sx={{ color: '#65BA74', fontSize: '2rem' }} />,
      title: t('Smart Tenant Verification'),
      description: t('AI analyzes financial stability, rental history, and compatibility instantly.'),
      benefit: t('95% reliable tenant selection')
    },
    {
      icon: <CheckCircleIcon sx={{ color: '#65BA74', fontSize: '2rem' }} />,
      title: t('Unified Dashboard'),
      description: t('Manage all inquiries, applications, and properties from one smart platform.'),
      benefit: t('Never miss a lead again')
    }
  ];

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 8 }}>
      {/* Pain Points Section */}
      <Box sx={{ mb: 8 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, textAlign: 'center', mb: 1 }}>
          {t('The Hidden Costs of Traditional Property Management')}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', mb: 4 }}>
          {t('Every day without AI automation is money left on the table')}
        </Typography>

        <Grid container spacing={3}>
          {painPoints.map((point, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <PainPointCard elevation={0}>
                <Box sx={{ mb: 2 }}>{point.icon}</Box>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
                  {point.title}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2, fontSize: '0.95rem', lineHeight: 1.6 }}>
                  {point.description}
                </Typography>
                <Chip
                  label={point.stat}
                  color="error"
                  variant="outlined"
                  size="medium"
                  sx={{ fontWeight: 600, fontSize: '0.875rem' }}
                />
              </PainPointCard>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Solutions Section */}
      <Box sx={{ mb: 8 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, textAlign: 'center', mb: 1 }}>
          {t('The HomeAI Advantage')}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', mb: 4 }}>
          {t('Transform your property management with intelligent automation')}
        </Typography>

        <Grid container spacing={3}>
          {solutions.map((solution, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <SolutionCard elevation={0}>
                <Box sx={{ mb: 2 }}>{solution.icon}</Box>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
                  {solution.title}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2, fontSize: '0.95rem', lineHeight: 1.6 }}>
                  {solution.description}
                </Typography>
                <Chip
                  label={solution.benefit}
                  color="success"
                  variant="outlined"
                  size="medium"
                  sx={{ fontWeight: 600, fontSize: '0.875rem' }}
                />
              </SolutionCard>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Tabbed Content Section */}
      <Box sx={{ mb: 6 }}>
        <StyledTabs
          value={activeTab}
          onChange={handleTabChange}
          centered
          variant="fullWidth"
        >
          <Tab label={t('ROI Calculator')} />
          <Tab label={t('Compare Solutions')} />
          <Tab label={t('Success Stories')} />
        </StyledTabs>

        {activeTab === 0 && (
          <ROICalculator onGetStarted={handleOpenAuthModal} />
        )}
        {activeTab === 1 && (
          <ComparisonTable />
        )}
        {activeTab === 2 && (
          <CaseStudies />
        )}
      </Box>
    </Container>
  );
};

export default EnhancedFeatures;