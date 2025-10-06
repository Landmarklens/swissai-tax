import React from 'react';
import { Grid, Typography, Box, Paper, Container, Link } from '@mui/material';
import { styled } from '@mui/system';
import first from '../../../assets/1.svg';
import second from '../../../assets/2.svg';
import third from '../../../assets/3.svg';
import fourth from '../../../assets/4.svg';
import { useTranslation } from 'react-i18next';
import authService from '../../../services/authService';
import { NavLink } from 'react-router-dom';

const StyledPaper = styled(Paper)(({ theme }) => ({
  backgroundColor: '#F5F8FF',
  padding: theme.spacing(2.5),
  borderRadius: '12px',
  textAlign: 'left',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
  minHeight: '220px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  border: '1px solid #E0E5FF',
  height: '100%',
  transition: 'all 0.3s ease',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 16px rgba(62, 99, 221, 0.15)',
    borderColor: '#AEC2FF'
  }
}));

const FeatureBox = ({ title, isFeature }) => {
  const { t } = useTranslation();

  const isAuthenticated = authService.isAuthenticated();

  const taxFeatureItems = [
    {
      title: t('🇨🇭 All 26 Swiss Cantons'),
      description: t(
        'Complete coverage of all Swiss cantons with canton-specific tax rules, rates, and deductions. Automatically calculates federal, cantonal, and municipal taxes for your exact location.'
      ),
      iconColor: '#FFE5E8',
      logo: first,
      width: 60
    },
    {
      title: t('💬 AI-Powered Interview'),
      description: t(
        'Interactive questionnaire that adapts to your situation (Q01-Q14). Simple questions guide you through income, deductions, family status, and more. No tax knowledge required.'
      ),
      iconColor: '#FFE5E8',
      logo: second,
      width: 40
    },
    {
      title: t('📄 Smart Document Upload'),
      description: t(
        'Upload tax documents (salary certificates, receipts, insurance) with drag-and-drop. AI automatically extracts data using OCR. Secure S3 storage with encryption.'
      ),
      iconColor: '#FFE5E8',
      logo: third,
      width: 40
    },
    {
      title: t('🔍 Automatic Deduction Finder'),
      description: t(
        'AI analyzes your situation and finds all applicable deductions: work expenses, insurance, donations, education, childcare, and more. Maximize your refund automatically.'
      ),
      iconColor: '#FFE5E8',
      logo: fourth,
      width: 60
    },
    {
      title: t('📊 Real-Time Tax Calculation'),
      description: t(
        'Instant calculation of your federal, cantonal, and municipal taxes. See detailed breakdown with charts and visualizations. Compare different scenarios before filing.'
      ),
      iconColor: '#FFE5E8',
      logo: first,
      width: 60
    },
    {
      title: t('🌍 Multi-Language Support'),
      description: t(
        'Complete interface in German, French, Italian, and English. All tax terminology translated accurately. Switch languages anytime during the process.'
      ),
      iconColor: '#FFE5E8',
      logo: second,
      width: 40
    },
    {
      title: t('🔒 Swiss Data Protection'),
      description: t(
        'Your data stays in Switzerland. Bank-level encryption. GDPR compliant. Secure authentication with JWT or Google OAuth. Your privacy is guaranteed.'
      ),
      iconColor: '#FFE5E8',
      logo: third,
      width: 40
    },
    {
      title: t('✅ Pre-Filled Forms'),
      description: t(
        'Official Swiss tax forms automatically filled with your data. Review, edit, and download PDF. Ready to submit to your cantonal tax office. Save hours of manual work.'
      ),
      iconColor: '#FFE5E8',
      logo: fourth,
      width: 60
    }
  ];

  const featureItems = taxFeatureItems;

  return (
    <Container maxWidth="xl">
      <Box id="features" sx={{ flexGrow: 1, padding: '48px 0 80px', mt: 6 }}>
        {title && (
          <Typography variant="h5" fontWeight={700} fontSize={'35px'} align="center" gutterBottom>
            {title}
          </Typography>
        )}

        <Grid
          container
          spacing={3}
          sx={{
            marginTop: 4
          }}
        >
          {featureItems.map((item, index) => {
            return (
              <Grid
                item
                key={index}
                xs={12}
                sm={6}
                md={6}
                lg={3}
                sx={{
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                  <StyledPaper
                    elevation={0}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                      justifyContent: 'space-between'
                    }}
                  >
                    <NavLink
                      to={isAuthenticated ? '/tax-filing/interview' : '?login'}
                      style={{ textDecoration: 'none' }}
                    >
                      <Box sx={{ width: '100%' }}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 600,
                            color: 'black',
                            fontSize: '18px',
                            mb: 1.5,
                            lineHeight: 1.3
                          }}
                        >
                          {item.title}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: '#6B7280',
                            fontSize: '14px',
                            lineHeight: 1.5
                          }}
                        >
                          {item.description}
                        </Typography>
                      </Box>
                    </NavLink>
                  </StyledPaper>
                </Grid>
              );
            })}
        </Grid>
      </Box>
    </Container>
  );
};

export default FeatureBox;
