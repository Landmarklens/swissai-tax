import React from 'react';
import Layout from '../Layout/Layout';
import { useTranslation } from 'react-i18next';
import SEOHelmet from '../../components/SEO/SEOHelmet';
import { Box, Container, Grid, Card, CardContent, Typography, Chip, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import {
  Calculate as CalculateIcon,
  Scanner as ScannerIcon,
  Language as LanguageIcon,
  Security as SecurityIcon,
  Map as MapIcon,
  TrendingUp as TrendingUpIcon,
  CloudUpload as CloudUploadIcon,
  AccessTime as AccessTimeIcon,
  Check as CheckIcon,
  SmartToy as SmartToyIcon,
  Receipt as ReceiptIcon,
  CreditCard as CreditCardIcon
} from '@mui/icons-material';
import VideoCarousel from '../../components/sections/videoSection/VideoCarousel';

const TaxFeatures = () => {
  const { t } = useTranslation();

  const mainFeatures = [
    {
      icon: <SmartToyIcon sx={{ fontSize: 48 }} />,
      title: t('AI-Powered Tax Assistant'),
      description: t('Our intelligent AI guides you through every step, finding deductions you might miss'),
      benefits: [
        'Conversational interview process',
        'No tax knowledge required',
        'Personalized recommendations',
        'Real-time error checking'
      ],
      color: '#E6F0FF'
    },
    {
      icon: <MapIcon sx={{ fontSize: 48 }} />,
      title: t('All 26 Cantons Covered'),
      description: t('Complete support for every Swiss canton with local tax rules and forms'),
      benefits: [
        'Canton-specific deductions',
        'Local tax office integration',
        'Municipal tax calculations',
        'Cross-canton moves supported'
      ],
      color: '#E8F5E9'
    },
    {
      icon: <ScannerIcon sx={{ fontSize: 48 }} />,
      title: t('Smart Document Scanner'),
      description: t('Take photos of your documents and let OCR technology do the rest'),
      benefits: [
        'Salary certificate scanning',
        'Receipt digitization',
        'Bank statement import',
        'Automatic data extraction'
      ],
      color: '#FFF3E0'
    },
    {
      icon: <CalculateIcon sx={{ fontSize: 48 }} />,
      title: t('Maximum Deductions'),
      description: t('Never miss a deduction with our comprehensive checking system'),
      benefits: [
        'Commute cost calculator',
        'Home office deductions',
        'Insurance optimization',
        'Charitable giving tracker'
      ],
      color: '#E6F0FF'
    },
    {
      icon: <TrendingUpIcon sx={{ fontSize: 48 }} />,
      title: t('Real-Time Refund Estimate'),
      description: t('See your potential refund update as you enter information'),
      benefits: [
        'Live calculation updates',
        'Compare with last year',
        'Optimization suggestions',
        'Payment planning'
      ],
      color: '#E8F5E9'
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 48 }} />,
      title: t('Swiss Security Standards'),
      description: t('Your data is protected with bank-level encryption and stays in Switzerland'),
      benefits: [
        'End-to-end encryption',
        'Swiss data centers',
        'GDPR/DSG compliant',
        'Secure document storage'
      ],
      color: '#FFE5E8'
    }
  ];

  const additionalFeatures = [
    { icon: <LanguageIcon />, text: '4 languages: DE, FR, IT, EN' },
    { icon: <AccessTimeIcon />, text: '20-minute completion time' },
    { icon: <CloudUploadIcon />, text: 'Direct canton submission' },
    { icon: <ReceiptIcon />, text: 'Expense tracking year-round' },
    { icon: <CreditCardIcon />, text: 'Pay only when you submit' }
  ];

  return (
    <>
      <SEOHelmet
        titleKey="meta.features.title"
        descriptionKey="meta.features.description"
      />
      <Layout
        heading={t('Features That Save Time and Money')}
        text={t('Everything you need to file your Swiss taxes with confidence')}
      >
        <Container maxWidth="lg" sx={{ py: 4 }}>
          {/* Main Features Grid */}
          <Grid container spacing={4} sx={{ mb: 6 }}>
            {mainFeatures.map((feature, index) => (
              <Grid item xs={12} md={6} lg={4} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: 4
                    }
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: '16px',
                        bgcolor: feature.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 3,
                        color: 'primary.main'
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                      {feature.description}
                    </Typography>
                    <List dense>
                      {feature.benefits.map((benefit, idx) => (
                        <ListItem key={idx} sx={{ px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <CheckIcon sx={{ fontSize: 18, color: 'success.main' }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={benefit}
                            primaryTypographyProps={{
                              variant: 'body2',
                              color: 'text.secondary'
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Additional Features Section */}
          <Box sx={{ mb: 6 }}>
            <Typography variant="h4" align="center" sx={{ mb: 4, fontWeight: 600 }}>
              {t('Plus Everything Else You Need')}
            </Typography>
            <Grid container spacing={2} justifyContent="center">
              {additionalFeatures.map((feature, index) => (
                <Grid item key={index}>
                  <Chip
                    icon={feature.icon}
                    label={feature.text}
                    sx={{
                      py: 3,
                      px: 2,
                      fontSize: '14px',
                      bgcolor: 'background.paper',
                      border: '1px solid',
                      borderColor: 'border.light'
                    }}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Comparison Table */}
          <Box sx={{ mb: 6 }}>
            <Typography variant="h4" align="center" sx={{ mb: 4, fontWeight: 600 }}>
              {t('Why Choose SwissAI Tax?')}
            </Typography>
            <Grid container spacing={4}>
              <Grid item xs={12} md={4}>
                <Card sx={{ textAlign: 'center', p: 3 }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    {t('Traditional Tax Preparer')}
                  </Typography>
                  <Typography variant="h3" color="error.main" sx={{ my: 2 }}>
                    CHF 300-600
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    2-week turnaround
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ textAlign: 'center', p: 3, border: '2px solid', borderColor: 'primary.main' }}>
                  <Typography variant="h6" color="primary.main" gutterBottom>
                    {t('SwissAI Tax')}
                  </Typography>
                  <Typography variant="h3" color="success.main" sx={{ my: 2 }}>
                    CHF 49
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    20 minutes
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ textAlign: 'center', p: 3 }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    {t('DIY Canton Software')}
                  </Typography>
                  <Typography variant="h3" color="text.secondary" sx={{ my: 2 }}>
                    Free
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    2-3 hours of confusion
                  </Typography>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </Container>

        {/* Video Carousel */}
        <VideoCarousel />
      </Layout>
    </>
  );
};

export default TaxFeatures;