import React, { useState } from 'react';
import {
  Grid,
  Typography,
  Box,
  Paper,
  Container,
  Chip,
  Fade,
  Zoom,
  Stack,
  IconButton,
  Divider,
  useMediaQuery,
  useTheme,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { styled } from '@mui/system';
import { useTranslation } from 'react-i18next';
import authService from '../../../services/authService';
import { NavLink } from 'react-router-dom';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StarIcon from '@mui/icons-material/Star';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SpeedIcon from '@mui/icons-material/Speed';
import SecurityIcon from '@mui/icons-material/Security';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import first from '../../../assets/1.svg';
import second from '../../../assets/2.svg';
import third from '../../../assets/3.svg';
import fourth from '../../../assets/4.svg';

const FeatureContainer = styled(Paper)(({ theme, isHighlighted }) => ({
  backgroundColor: isHighlighted ? '#F0F4FF' : '#F8FAFF',
  padding: theme.spacing(4),
  borderRadius: '20px',
  textAlign: 'left',
  boxShadow: isHighlighted
    ? '0 20px 40px rgba(62, 99, 221, 0.15)'
    : '0 8px 24px rgba(0, 0, 0, 0.06)',
  minHeight: '260px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  border: isHighlighted ? '2px solid #3E63DD' : '1px solid #E8ECFF',
  height: '100%',
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-8px) scale(1.02)',
    boxShadow: '0 24px 48px rgba(62, 99, 221, 0.25)',
    borderColor: '#3E63DD',
    '& .feature-icon': {
      transform: 'rotate(5deg) scale(1.1)',
    },
    '& .feature-title': {
      color: '#3E63DD',
    },
    '& .hover-overlay': {
      opacity: 1,
    }
  }
}));

const HoverOverlay = styled(Box)({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'linear-gradient(135deg, rgba(62, 99, 221, 0.03) 0%, rgba(62, 99, 221, 0.08) 100%)',
  opacity: 0,
  transition: 'opacity 0.3s ease',
  pointerEvents: 'none',
});

const FeatureBadge = styled(Chip)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(2),
  right: theme.spacing(2),
  backgroundColor: '#3E63DD',
  color: 'white',
  fontWeight: 600,
  height: '24px',
  '& .MuiChip-label': {
    fontSize: '11px',
    padding: '0 8px'
  }
}));

const StatCard = styled(Card)(({ theme }) => ({
  backgroundColor: '#FFFFFF',
  borderRadius: '12px',
  padding: theme.spacing(2),
  border: '1px solid #E8ECFF',
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    borderColor: '#3E63DD',
  }
}));

const FeatureIcon = styled(Box)({
  width: '80px',
  height: '80px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '20px',
  background: 'linear-gradient(135deg, #E8ECFF 0%, #F0F4FF 100%)',
  marginBottom: '20px',
  transition: 'transform 0.3s ease',
});

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontSize: '42px',
  fontWeight: 800,
  textAlign: 'center',
  marginBottom: theme.spacing(2),
  background: 'linear-gradient(135deg, #1F2937 0%, #3E63DD 100%)',
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  [theme.breakpoints.down('md')]: {
    fontSize: '32px',
  }
}));

const SectionSubtitle = styled(Typography)(({ theme }) => ({
  fontSize: '18px',
  textAlign: 'center',
  color: '#6B7280',
  marginBottom: theme.spacing(6),
  maxWidth: '800px',
  margin: '0 auto',
  lineHeight: 1.6,
}));

const EnhancedFeatureBox = ({ title, userType = 'tenant' }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isAuthenticated = authService.isAuthenticated();
  const [hoveredFeature, setHoveredFeature] = useState(null);

  const tenantFeatureItems = [
    {
      id: 'instant-monitor',
      title: t('🚀 Instant Market Monitoring'),
      shortTitle: t('Never Miss a Listing'),
      description: t(
        'Real-time scanning of Switzerland\'s top property platforms. Get instant notifications when your dream home appears.'
      ),
      benefits: [
        'Scan 10+ Swiss platforms',
        'Instant WhatsApp alerts',
        'First-mover advantage',
        '24/7 monitoring'
      ],
      stats: { value: '3min', label: 'Average alert time' },
      badge: 'REAL-TIME',
      logo: first,
      color: '#3E63DD',
      highlight: true
    },
    {
      id: 'deep-intelligence',
      title: t('🧠 AI Property Analysis'),
      shortTitle: t('Beyond Basic Filters'),
      description: t(
        'Our AI reads between the lines—analyzing images, descriptions, and 60+ data points for insights you can\'t get anywhere else.'
      ),
      benefits: [
        'Visual quality analysis',
        'Commute calculations',
        'Neighborhood scoring',
        'Hidden cost detection'
      ],
      stats: { value: '60+', label: 'Data signals analyzed' },
      logo: second,
      color: '#10B981'
    },
    {
      id: 'smart-interview',
      title: t('💬 Smart AI Interview'),
      shortTitle: t('Personalized Matching'),
      description: t(
        'No endless forms. Our conversational AI learns your lifestyle, preferences, and needs in just 5 minutes.'
      ),
      benefits: [
        '5-minute setup',
        'Lifestyle matching',
        'Family requirements',
        'Budget optimization'
      ],
      stats: { value: '94%', label: 'Match accuracy' },
      logo: third,
      color: '#F59E0B'
    },
    {
      id: 'ultra-personalized',
      title: t('🎯 Precision Matching'),
      shortTitle: t('Your Perfect Home'),
      description: t(
        'Advanced algorithms consider tax zones, school districts, transit access, and local demand to find your ideal match.'
      ),
      benefits: [
        'Tax optimization',
        'School proximity',
        'Transit scoring',
        'Market insights'
      ],
      stats: { value: '85%', label: 'Success rate' },
      badge: 'AI-POWERED',
      logo: fourth,
      color: '#8B5CF6',
      highlight: true
    }
  ];

  const landlordFeatureItems = [
    {
      id: 'tenant-screening',
      title: t('🤖 AI Tenant Screening'),
      shortTitle: t('Screen 10x Faster'),
      description: t(
        'Comprehensive tenant analysis in seconds. Financial verification, background checks, and risk scoring all automated.'
      ),
      benefits: [
        'Financial verification',
        'Employment checks',
        'Risk score (1-100)',
        'Red flag detection'
      ],
      stats: { value: '95%', label: 'Accuracy rate' },
      badge: 'AI-POWERED',
      logo: first,
      color: '#3E63DD',
      highlight: true
    },
    {
      id: 'market-analytics',
      title: t('📊 Market Intelligence'),
      shortTitle: t('Price Perfectly'),
      description: t(
        'Real-time pricing analytics from 50,000+ Swiss properties. Optimize rent, reduce vacancy, maximize ROI.'
      ),
      benefits: [
        'Dynamic pricing',
        'Demand heat maps',
        'Competitor tracking',
        'ROI predictions'
      ],
      stats: { value: '15%', label: 'Avg rent increase' },
      logo: second,
      color: '#10B981'
    },
    {
      id: 'communication-hub',
      title: t('💬 Smart Communication'),
      shortTitle: t('24/7 Response'),
      description: t(
        'AI-powered inquiry management across all channels. Never miss a quality lead with automated, personalized responses.'
      ),
      benefits: [
        '24/7 auto-response',
        'Lead qualification',
        'Viewing scheduler',
        'Multi-channel sync'
      ],
      stats: { value: '3x', label: 'Faster response' },
      logo: third,
      color: '#F59E0B'
    },
    {
      id: 'document-automation',
      title: t('📋 Legal Automation'),
      shortTitle: t('Zero Paperwork'),
      description: t(
        'Swiss-compliant contracts and documents generated instantly. Digital signatures, automatic updates, complete compliance.'
      ),
      benefits: [
        '100% compliant',
        'Digital signatures',
        'Auto-generated',
        'Tax-ready reports'
      ],
      stats: { value: '5hrs', label: 'Saved per month' },
      badge: 'COMPLIANT',
      logo: fourth,
      color: '#8B5CF6',
      highlight: true
    }
  ];

  const featureItems = userType === 'landlord' ? landlordFeatureItems : tenantFeatureItems;

  const globalStats = userType === 'landlord'
    ? [
        { icon: <TrendingUpIcon />, value: '2,000+', label: 'Active Landlords' },
        { icon: <SpeedIcon />, value: '28 days', label: 'Faster Placement' },
        { icon: <SecurityIcon />, value: '73%', label: 'Less Bad Tenants' },
        { icon: <StarIcon />, value: '4.9/5', label: 'User Rating' }
      ]
    : [
        { icon: <TrendingUpIcon />, value: '15,000+', label: 'Happy Tenants' },
        { icon: <SpeedIcon />, value: '3 min', label: 'Alert Speed' },
        { icon: <SecurityIcon />, value: '94%', label: 'Match Accuracy' },
        { icon: <StarIcon />, value: '4.8/5', label: 'User Rating' }
      ];

  return (
    <Container maxWidth="xl">
      <Box sx={{ padding: '60px 0' }}>
        {/* Header Section */}
        <Fade in={true} timeout={800}>
          <Box>
            <SectionTitle>
              {userType === 'landlord'
                ? t('Features That Transform Property Management')
                : t('Features That Find Your Perfect Home')}
            </SectionTitle>
            <SectionSubtitle>
              {userType === 'landlord'
                ? t('Join thousands of Swiss landlords who save 10+ hours per week with AI-powered automation')
                : t('Experience the future of apartment hunting with AI that understands exactly what you need')}
            </SectionSubtitle>
          </Box>
        </Fade>

        {/* Stats Bar */}
        <Fade in={true} timeout={1000}>
          <Grid container spacing={3} sx={{ mb: 6 }}>
            {globalStats.map((stat, index) => (
              <Grid item xs={6} md={3} key={index}>
                <Zoom in={true} style={{ transitionDelay: `${index * 100}ms` }}>
                  <StatCard>
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Box sx={{ color: '#3E63DD', mb: 1 }}>
                        {stat.icon}
                      </Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#1F2937' }}>
                        {stat.value}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#6B7280', mt: 0.5 }}>
                        {stat.label}
                      </Typography>
                    </CardContent>
                  </StatCard>
                </Zoom>
              </Grid>
            ))}
          </Grid>
        </Fade>

        {/* Features Grid */}
        <Grid container spacing={4}>
          {featureItems.map((item, index) => {
            const isFirstRow = index < 2;
            const isHighlighted = item.highlight;

            return (
              <Grid
                item
                key={item.id}
                xs={12}
                md={isFirstRow ? 6 : 6}
                lg={isFirstRow ? 6 : 6}
              >
                <Zoom in={true} style={{ transitionDelay: `${index * 150}ms` }}>
                  <NavLink
                    to={isAuthenticated
                      ? (userType === 'landlord' ? '/owner-account' : '/chat')
                      : '?login'}
                    style={{ textDecoration: 'none' }}
                  >
                    <FeatureContainer
                      elevation={0}
                      isHighlighted={isHighlighted}
                      onMouseEnter={() => setHoveredFeature(item.id)}
                      onMouseLeave={() => setHoveredFeature(null)}
                    >
                      <HoverOverlay className="hover-overlay" />

                      {item.badge && (
                        <FeatureBadge label={item.badge} size="small" />
                      )}

                      <Box sx={{ width: '100%' }}>
                        <FeatureIcon className="feature-icon">
                          <Box
                            component="img"
                            src={item.logo}
                            alt={item.title}
                            sx={{ width: '50px', height: '50px' }}
                          />
                        </FeatureIcon>

                        <Typography
                          variant="h5"
                          className="feature-title"
                          sx={{
                            fontWeight: 700,
                            color: '#1F2937',
                            fontSize: '24px',
                            mb: 2,
                            transition: 'color 0.3s ease'
                          }}
                        >
                          {item.title}
                        </Typography>

                        <Typography
                          variant="body1"
                          sx={{
                            color: '#6B7280',
                            fontSize: '15px',
                            mb: 3,
                            lineHeight: 1.7
                          }}
                        >
                          {item.description}
                        </Typography>

                        {/* Benefits List */}
                        <Box sx={{ mb: 3 }}>
                          <Grid container spacing={1}>
                            {item.benefits.slice(0, 4).map((benefit, idx) => (
                              <Grid item xs={12} key={idx}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <CheckCircleIcon
                                    sx={{
                                      fontSize: '16px',
                                      color: item.color || '#10B981'
                                    }}
                                  />
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      color: '#4B5563',
                                      fontSize: '13px'
                                    }}
                                  >
                                    {benefit}
                                  </Typography>
                                </Stack>
                              </Grid>
                            ))}
                          </Grid>
                        </Box>

                        {/* Stats */}
                        {item.stats && (
                          <Box
                            sx={{
                              mt: 'auto',
                              pt: 2,
                              borderTop: '1px solid #E8ECFF'
                            }}
                          >
                            <Stack direction="row" spacing={1} alignItems="baseline">
                              <Typography
                                sx={{
                                  fontSize: '28px',
                                  fontWeight: 700,
                                  color: item.color || '#3E63DD'
                                }}
                              >
                                {item.stats.value}
                              </Typography>
                              <Typography
                                sx={{
                                  fontSize: '14px',
                                  color: '#6B7280'
                                }}
                              >
                                {item.stats.label}
                              </Typography>
                            </Stack>
                          </Box>
                        )}
                      </Box>
                    </FeatureContainer>
                  </NavLink>
                </Zoom>
              </Grid>
            );
          })}
        </Grid>

        {/* CTA Section */}
        <Fade in={true} timeout={1200}>
          <Box
            sx={{
              mt: 8,
              textAlign: 'center',
              p: 6,
              background: 'linear-gradient(135deg, #F0F4FF 0%, #E8ECFF 100%)',
              borderRadius: '24px'
            }}
          >
            <AutoAwesomeIcon sx={{ fontSize: '48px', color: '#3E63DD', mb: 2 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
              {userType === 'landlord'
                ? t('Ready to Transform Your Property Management?')
                : t('Ready to Find Your Dream Home?')}
            </Typography>
            <Typography variant="body1" sx={{ color: '#6B7280', mb: 3 }}>
              {userType === 'landlord'
                ? t('Start your free week and see the difference AI makes')
                : t('Join thousands finding their perfect homes with AI')}
            </Typography>
            <NavLink to={isAuthenticated ? (userType === 'landlord' ? '/owner-account' : '/chat') : '?login'}>
              <Box
                component="button"
                sx={{
                  background: '#3E63DD',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '14px 32px',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: '#2D4FBC',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 24px rgba(62, 99, 221, 0.3)'
                  }
                }}
              >
                {userType === 'landlord'
                  ? t('Start Free Week →')
                  : t('Get Started Free →')}
              </Box>
            </NavLink>
          </Box>
        </Fade>
      </Box>
    </Container>
  );
};

export default EnhancedFeatureBox;