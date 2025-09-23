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

const FeatureBox = ({ title, isFeature, userType = 'tenant' }) => {
  const { t } = useTranslation();

  const isAuthenticated = authService.isAuthenticated();

  const tenantFeatureItems = [
    {
      title: t('💬 AI-Powered Property Chat'),
      description: t(
        'Chat with our AI assistant to find your perfect home. Ask questions in natural language, get instant property recommendations, and receive detailed insights about neighborhoods, commute times, and local amenities.'
      ),
      iconColor: '#DCE4FF',
      logo: first,
      width: 60
    },
    {
      title: t('🔍 Smart Property Search'),
      description: t(
        'Advanced 12-step search process covering all your needs: location, budget, lifestyle, family requirements, property features, and more. Our AI learns your preferences and improves recommendations with each interaction.'
      ),
      iconColor: '#E0E5FF',
      logo: second,
      width: 40
    },
    {
      title: t('📊 Real-Time Property Insights'),
      description: t(
        'Get detailed analytics for every property: market trends, price comparisons, neighborhood demographics, school ratings, transport links, and local amenities. Make informed decisions with comprehensive data.'
      ),
      iconColor: '#DCE4FF',
      logo: third,
      width: 40
    },
    {
      title: t('🏠 Property Details & Virtual Tours'),
      description: t(
        'Explore properties with detailed information, high-quality images, floor plans, and virtual tours. Save favorites, add notes, compare multiple properties, and share with family or roommates.'
      ),
      iconColor: '#E0E5FF',
      logo: fourth,
      width: 60
    },
    {
      title: t('📝 One-Click Applications'),
      description: t(
        'Apply to properties instantly with pre-filled application forms. Upload documents once, use them for all applications. Track application status and communicate directly with landlords.'
      ),
      iconColor: '#DCE4FF',
      logo: first,
      width: 60
    },
    {
      title: t('🔔 Instant Property Alerts'),
      description: t(
        'Never miss your dream home. Get real-time notifications when new properties matching your criteria hit the market. Customize alert preferences for location, price, and features.'
      ),
      iconColor: '#E0E5FF',
      logo: second,
      width: 40
    },
    {
      title: t('🗺️ Interactive Map View'),
      description: t(
        'Explore properties on an interactive map. See commute times to work, nearby schools, shopping centers, public transport, and points of interest. Filter by neighborhood characteristics.'
      ),
      iconColor: '#DCE4FF',
      logo: third,
      width: 40
    },
    {
      title: t('💡 AI Recommendations'),
      description: t(
        'Our AI learns from your searches, saved properties, and feedback to suggest homes you will love. Get personalized recommendations that improve over time based on your preferences.'
      ),
      iconColor: '#E0E5FF',
      logo: fourth,
      width: 60
    }
  ];

  const landlordFeatureItems = [
    {
      title: t('🏢 Property Dashboard'),
      description: t(
        'Centralized dashboard for all your properties. Track occupancy rates, rental income, upcoming viewings, and maintenance schedules. Get real-time overview of your entire portfolio performance.'
      ),
      iconColor: '#DCE4FF',
      logo: first,
      width: 60
    },
    {
      title: t('👥 Tenant Application Management'),
      description: t(
        'Streamline tenant screening with our application system. View all applications, compare candidates side-by-side, check documents, schedule viewings, and make decisions with confidence.'
      ),
      iconColor: '#E0E5FF',
      logo: second,
      width: 40
    },
    {
      title: t('📊 AI Market Analytics'),
      description: t(
        'Advanced analytics powered by AI: rental price optimization, market trend predictions, competitive analysis, demand forecasting, and ROI calculations for renovations and improvements.'
      ),
      iconColor: '#DCE4FF',
      logo: third,
      width: 40
    },
    {
      title: t('💬 Multi-Channel Messaging'),
      description: t(
        'Manage all tenant communications from one inbox. Integrate email, WhatsApp, and platform messages. Use AI-powered templates, automated responses, and keep complete conversation history.'
      ),
      iconColor: '#E0E5FF',
      logo: fourth,
      width: 60
    },
    {
      title: t('📝 Document Management'),
      description: t(
        'Digital document center for contracts, receipts, and notices. Generate Swiss-compliant rental agreements, store tenant documents securely, and maintain complete paperwork trail.'
      ),
      iconColor: '#DCE4FF',
      logo: first,
      width: 60
    },
    {
      title: t('📅 Viewing Scheduler'),
      description: t(
        'Automated viewing scheduling system. Let tenants book viewings online, send automatic reminders, manage multiple viewings efficiently, and track attendance and feedback.'
      ),
      iconColor: '#E0E5FF',
      logo: second,
      width: 40
    },
    {
      title: t('🔄 Property Import Tool'),
      description: t(
        'Import listings from other platforms instantly. Sync with ImmoScout24, Homegate, and other portals. Manage all your listings from one place without duplicate work.'
      ),
      iconColor: '#DCE4FF',
      logo: third,
      width: 40
    },
    {
      title: t('📈 Performance Reports'),
      description: t(
        'Detailed monthly and yearly reports. Track income, expenses, occupancy rates, tenant turnover, and market position. Export data for tax purposes and financial planning.'
      ),
      iconColor: '#E0E5FF',
      logo: fourth,
      width: 60
    }
  ];

  const featureItems = userType === 'landlord' ? landlordFeatureItems : tenantFeatureItems;

  return (
    <Container maxWidth="xl">
      <Box id="features" sx={{ flexGrow: 1, padding: '48px 0 80px', mt: 6 }}>
        <Typography variant="h5" fontWeight={700} fontSize={'35px'} align="center" gutterBottom>
          {title}
        </Typography>

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
                      to={isAuthenticated 
                        ? (userType === 'landlord' ? '/owner-account' : '/chat') 
                        : '?login'}
                      style={{ textDecoration: 'none' }}
                    >
                      <Box sx={{ width: '100%' }}>
                        <Box
                          component="img"
                          src={item.logo}
                          alt={item.title}
                          sx={{
                            width: '40px',
                            height: '40px',
                            objectFit: 'contain',
                            mb: 2
                          }}
                        />
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
