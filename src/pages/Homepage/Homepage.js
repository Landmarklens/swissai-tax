import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  IconButton,
  Divider,
  useTheme,
  useMediaQuery,
  Avatar,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Check as CheckIcon,
  Security as SecurityIcon,
  QuestionAnswer as QuestionAnswerIcon,
  UploadFile as UploadFileIcon,
  Send as SendIcon,
  AutoAwesome as AutoAwesomeIcon,
  Language as LanguageIcon,
  SupportAgent as SupportAgentIcon,
  Update as UpdateIcon,
  Devices as DevicesIcon,
  Facebook as FacebookIcon,
  LinkedIn as LinkedInIcon,
  Twitter as TwitterIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import Header from '../../components/header/Header';
import Footer from '../../components/footer/Footer';
import VideoCarousel from '../../components/sections/videoSection/VideoCarousel';
import HeroIllustration from '../../components/sections/heroSection/HeroIllustration';
import { useUserCounter } from '../../hooks/useUserCounter';
import LoginSignupModal from '../../components/login/Login';
import authService from '../../services/authService';
import TrustBadges from '../../components/TrustBadges/TrustBadges';
import SwissDataBanner from '../../components/sections/SwissDataBanner/SwissDataBanner';
import SubscriptionPlans from '../SubscriptionPlans/SubscriptionPlans';
import FAQSection from '../../components/sections/FAQ/FAQ';

const Homepage = () => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const location = useLocation();
  const currentLang = i18n.language || 'en';
  const userCount = useUserCounter();
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [badgeModalOpen, setBadgeModalOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState(null);

  const features = [
    {
      icon: <AutoAwesomeIcon sx={{ fontSize: 40 }} />,
      title: t('homepage.features.ai_optimization.title'),
      description: t('homepage.features.ai_optimization.description')
    },
    {
      icon: <LanguageIcon sx={{ fontSize: 40 }} />,
      title: t('homepage.features.multilingual.title'),
      description: t('homepage.features.multilingual.description')
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 40 }} />,
      title: t('homepage.features.security.title'),
      description: t('homepage.features.security.description')
    },
    {
      icon: <SupportAgentIcon sx={{ fontSize: 40 }} />,
      title: t('homepage.features.support.title'),
      description: t('homepage.features.support.description')
    },
    {
      icon: <UpdateIcon sx={{ fontSize: 40 }} />,
      title: t('homepage.features.updates.title'),
      description: t('homepage.features.updates.description')
    },
    {
      icon: <DevicesIcon sx={{ fontSize: 40 }} />,
      title: t('homepage.features.devices.title'),
      description: t('homepage.features.devices.description')
    }
  ];

  const steps = [
    {
      number: "1",
      icon: <QuestionAnswerIcon sx={{ fontSize: 48 }} />,
      title: t('homepage.howItWorks.step1.title'),
      description: t('homepage.howItWorks.step1.description')
    },
    {
      number: "2",
      icon: <UploadFileIcon sx={{ fontSize: 48 }} />,
      title: t('homepage.howItWorks.step2.title'),
      description: t('homepage.howItWorks.step2.description')
    },
    {
      number: "3",
      icon: <SendIcon sx={{ fontSize: 48 }} />,
      title: t('homepage.howItWorks.step3.title'),
      description: t('homepage.howItWorks.step3.description')
    }
  ];

  const stats = [
    { value: userCount === null ? 'Loading...' : userCount.toLocaleString(), label: t('homepage.stats.users') },
    { value: "26", label: t('homepage.stats.cantons') },
    { value: "20 Min", label: t('homepage.stats.time') }
  ];

  const badgeExplanations = {
    swiss: {
      title: "Made in Switzerland",
      description: "SwissAI Tax is proudly developed in Switzerland, adhering to the highest standards of Swiss quality, precision, and reliability. Our platform is built by Swiss experts who understand the complexities of the Swiss tax system.",
      benefits: [
        "Local expertise in Swiss tax regulations",
        "Swiss precision and attention to detail",
        "Understanding of cantonal differences",
        "Compliance with Swiss data protection standards"
      ]
    },
    dataProtection: {
      title: "Swiss Data Protection",
      description: "Your data is stored exclusively on Swiss servers and protected under strict Swiss data protection laws, which are among the most stringent in the world. We are fully GDPR compliant and go beyond EU requirements.",
      benefits: [
        "Data stored only in Switzerland",
        "GDPR compliant and certified",
        "Swiss Federal Data Protection Act compliance",
        "No data transfer outside Switzerland",
        "Regular security audits"
      ]
    },
    encryption: {
      title: "Bank-Level Encryption",
      description: "We use AES-128 encryption, the same standard used by Swiss banks to protect your sensitive financial information. All data is encrypted both in transit and at rest.",
      benefits: [
        "AES-128 encryption (military-grade)",
        "End-to-end encryption",
        "Encrypted data storage",
        "Secure HTTPS connections",
        "Regular security updates"
      ]
    },
    ech: {
      title: "eCH-0196 Certified",
      description: "eCH-0196 is the official Swiss e-government standard for electronic bank tax statements. Our platform can automatically import and process bank statements that comply with this standard, ensuring 99% accuracy in data extraction.",
      benefits: [
        "Automatic bank statement import",
        "99% accuracy in data extraction",
        "Official Swiss government standard",
        "Supports Data Matrix and PDF417 barcodes",
        "Reduces filing time from 45 to 10 minutes",
        "No manual data entry required"
      ],
      link: "https://www.ech.ch/"
    },
    swissdec: {
      title: "Swissdec ELM Certified",
      description: "Swissdec ELM (Electronic Lohnausweis Meldung) is the official Swiss standard for electronic salary certificates. Our platform automatically processes Swissdec XML files, eliminating manual data entry and ensuring accurate tax calculations.",
      benefits: [
        "Automatic salary certificate import",
        "Supports all Swissdec versions (5.0, 5.4, 5.5)",
        "Official Swiss payroll standard",
        "Instant data extraction from XML files",
        "Compatible with all Swiss payroll systems",
        "Zero data entry errors"
      ],
      link: "https://www.swissdec.ch/"
    }
  };

  const handleBadgeClick = (badgeKey) => {
    setSelectedBadge(badgeExplanations[badgeKey]);
    setBadgeModalOpen(true);
  };


  // Handle plan selection from location state (when user clicks plan while unauthenticated)
  useEffect(() => {
    if (location.state?.showAuth && location.state?.selectedPlan) {
      setSelectedPlan(location.state.selectedPlan);
      setLoginModalOpen(true);

      // Clear location state to prevent reopening modal on page refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleGetStarted = () => {
    const isAuthenticated = authService.isAuthenticated();
    if (isAuthenticated) {
      navigate(`/${currentLang}/tax-filing/interview`);
    } else {
      setLoginModalOpen(true);
    }
  };

  // Handle successful authentication - redirect to checkout with selected plan
  const handleAuthSuccess = () => {
    if (selectedPlan) {
      navigate(`/${currentLang}/subscription/checkout/${selectedPlan}`);
      setSelectedPlan(null); // Clear selected plan
    } else {
      navigate(`/${currentLang}/filings`);
    }
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Header />
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #FFFFFF 0%, #FFE5E8 100%)',
          pt: { xs: 8, md: 12 },
          pb: { xs: 8, md: 12 }
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Typography
                  variant="h1"
                  sx={{
                    fontSize: { xs: '32px', md: '48px' },
                    fontWeight: 700,
                    mb: 3,
                    color: 'text.primary'
                  }}
                >
                  {t('homepage.hero.title_line1')}
                  <br />
                  <Box component="span" sx={{ color: 'primary.main' }}>
                    {t('homepage.hero.title_line2')}
                  </Box>
                </Typography>
                <Typography
                  variant="h5"
                  color="text.secondary"
                  sx={{
                    mb: 4,
                    fontSize: { xs: '18px', md: '20px' },
                    lineHeight: 1.6
                  }}
                >
                  {t('homepage.hero.subtitle')}
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
                  <Button
                    variant="contained"
                    size="large"
                    endIcon={<ArrowForwardIcon />}
                    onClick={handleGetStarted}
                    sx={{ px: 4, py: 1.5 }}
                  >
                    {t('homepage.hero.cta_start')}
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })}
                    sx={{ px: 4, py: 1.5 }}
                  >
                    {t('homepage.hero.cta_learn')}
                  </Button>
                </Stack>
                <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                  <Chip
                    icon={<SecurityIcon />}
                    label={t('homepage.hero.data_protection')}
                    sx={{ bgcolor: 'background.paper' }}
                  />
                  <Chip
                    icon={<CheckIcon />}
                    label={t('homepage.hero.money_back_guarantee')}
                    sx={{ bgcolor: 'background.paper' }}
                  />
                </Stack>
              </motion.div>
            </Grid>
            <Grid item xs={12} md={6} sx={{ display: { xs: 'none', md: 'block' } }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Box sx={{
                  position: 'relative',
                  height: '500px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <HeroIllustration />
                </Box>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Swiss Trust Badges */}
      <Box sx={{ py: 6, bgcolor: 'grey.50', borderTop: '1px solid', borderBottom: '1px solid', borderColor: 'grey.200' }}>
        <Container maxWidth="lg">
          <Typography
            variant="h5"
            align="center"
            gutterBottom
            sx={{ mb: 4, fontWeight: 600, color: 'text.primary' }}
          >
            Trusted Swiss Standards & Security
          </Typography>
          <Grid container spacing={4} justifyContent="center" alignItems="stretch">
            <Grid item xs={12} sm={6} md={2.4}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                style={{ height: '100%' }}
              >
                <Box
                  onClick={() => handleBadgeClick('swiss')}
                  sx={{
                    textAlign: 'center',
                    p: 3,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    bgcolor: 'white',
                    borderRadius: 2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    '&:hover': {
                      boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                      transform: 'translateY(-4px)'
                    }
                  }}
                >
                  <Box sx={{
                    height: 80,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2
                  }}>
                    <Box sx={{
                      width: 70,
                      height: 70,
                      bgcolor: '#DC0018',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative'
                    }}>
                      <Box sx={{
                        width: 24,
                        height: 24,
                        bgcolor: 'white',
                        position: 'absolute'
                      }} />
                      <Box sx={{
                        width: 24,
                        height: 5,
                        bgcolor: '#DC0018',
                        position: 'absolute',
                        zIndex: 1
                      }} />
                      <Box sx={{
                        width: 5,
                        height: 24,
                        bgcolor: '#DC0018',
                        position: 'absolute',
                        zIndex: 1
                      }} />
                    </Box>
                  </Box>
                  <Typography variant="subtitle1" fontWeight={700} gutterBottom sx={{ fontSize: '0.95rem' }}>
                    {t('homepage.badges.made_in_switzerland')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', lineHeight: 1.4 }}>
                    {t('homepage.badges.swiss_quality')}
                  </Typography>
                </Box>
              </motion.div>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                style={{ height: '100%' }}
              >
                <Box
                  onClick={() => handleBadgeClick('dataProtection')}
                  sx={{
                    textAlign: 'center',
                    p: 3,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    bgcolor: 'white',
                    borderRadius: 2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    '&:hover': {
                      boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                      transform: 'translateY(-4px)'
                    }
                  }}
                >
                  <Box sx={{
                    height: 80,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2
                  }}>
                    <SecurityIcon sx={{ fontSize: 70, color: 'primary.main' }} />
                  </Box>
                  <Typography variant="subtitle1" fontWeight={700} gutterBottom sx={{ fontSize: '0.95rem' }}>
                    {t('homepage.badges.swiss_data_protection')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', lineHeight: 1.4 }}>
                    {t('homepage.badges.gdpr_compliant')}
                  </Typography>
                </Box>
              </motion.div>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                style={{ height: '100%' }}
              >
                <Box
                  onClick={() => handleBadgeClick('encryption')}
                  sx={{
                    textAlign: 'center',
                    p: 3,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    bgcolor: 'white',
                    borderRadius: 2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    '&:hover': {
                      boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                      transform: 'translateY(-4px)'
                    }
                  }}
                >
                  <Box sx={{
                    height: 80,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2
                  }}>
                    <Box sx={{ fontSize: 70 }}>🔐</Box>
                  </Box>
                  <Typography variant="subtitle1" fontWeight={700} gutterBottom sx={{ fontSize: '0.95rem' }}>
                    {t('homepage.badges.bank_level_encryption')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', lineHeight: 1.4 }}>
                    {t('homepage.badges.aes_256')}
                  </Typography>
                </Box>
              </motion.div>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                style={{ height: '100%' }}
              >
                <Box
                  onClick={() => handleBadgeClick('ech')}
                  sx={{
                    textAlign: 'center',
                    p: 3,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    bgcolor: 'white',
                    borderRadius: 2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    '&:hover': {
                      boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                      transform: 'translateY(-4px)'
                    }
                  }}
                >
                  <Box sx={{
                    height: 80,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2
                  }}>
                    <img
                      src="/images/logos/ech-logo.svg"
                      alt="eCH Logo"
                      style={{ height: '60px', width: 'auto', maxWidth: '100%' }}
                    />
                  </Box>
                  <Typography variant="subtitle1" fontWeight={700} gutterBottom sx={{ fontSize: '0.95rem' }}>
                    eCH-0196 Certified
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', lineHeight: 1.4 }}>
                    Swiss E-Government Standard
                  </Typography>
                </Box>
              </motion.div>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                style={{ height: '100%' }}
              >
                <Box
                  onClick={() => handleBadgeClick('swissdec')}
                  sx={{
                    textAlign: 'center',
                    p: 3,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    bgcolor: 'white',
                    borderRadius: 2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    '&:hover': {
                      boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                      transform: 'translateY(-4px)'
                    }
                  }}
                >
                  <Box sx={{
                    height: 80,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2
                  }}>
                    <img
                      src="/images/logos/swissdec-logo.png"
                      alt="Swissdec Logo"
                      style={{ height: '60px', width: 'auto', maxWidth: '100%' }}
                    />
                  </Box>
                  <Typography variant="subtitle1" fontWeight={700} gutterBottom sx={{ fontSize: '0.95rem' }}>
                    Swissdec ELM
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', lineHeight: 1.4 }}>
                    Salary Certificate Standard
                  </Typography>
                </Box>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Trust Indicators */}
      <Box sx={{ py: 6, bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} justifyContent="center">
            {stats.map((stat, index) => (
              <Grid item key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card sx={{ p: 3, textAlign: 'center', minWidth: 150 }}>
                    <Typography variant="h3" color="primary.main" sx={{ fontWeight: 'bold' }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stat.label}
                    </Typography>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* How It Works */}
      <Box id="how-it-works" sx={{ py: 8, bgcolor: 'background.lightGrey' }}>
        <Container maxWidth="lg">
          <Typography
            variant="h2"
            align="center"
            gutterBottom
            sx={{ mb: 6, fontSize: { xs: '28px', md: '36px' } }}
          >
            {t('homepage.howItWorks.title')}
          </Typography>
          <Grid container spacing={4}>
            {steps.map((step, index) => (
              <Grid item xs={12} md={4} key={index} sx={{ display: 'flex' }}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                  style={{ width: '100%', display: 'flex' }}
                >
                  <Card
                    sx={{
                      p: 4,
                      height: '100%',
                      width: '100%',
                      textAlign: 'center',
                      position: 'relative',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        transition: 'transform 0.3s ease'
                      }
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 60,
                        height: 60,
                        bgcolor: 'primary.lighter',
                        color: 'primary.main',
                        fontSize: '24px',
                        fontWeight: 'bold',
                        mx: 'auto',
                        mb: 3
                      }}
                    >
                      {step.number}
                    </Avatar>
                    <Box sx={{ color: 'primary.main', mb: 2 }}>{step.icon}</Box>
                    <Typography variant="h4" gutterBottom>
                      {step.title}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {step.description}
                    </Typography>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Video Testimonials */}
      <VideoCarousel />

      {/* Features Grid */}
      <Box sx={{ py: 8, bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Typography
            variant="h2"
            align="center"
            gutterBottom
            sx={{ mb: 6, fontSize: { xs: '28px', md: '36px' } }}
          >
            {t('homepage.features.title')}
          </Typography>
          <Grid container spacing={3}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card
                    sx={{
                      p: 3,
                      height: '100%',
                      '&:hover': {
                        boxShadow: 4
                      }
                    }}
                  >
                    <Box sx={{ color: 'primary.main', mb: 2 }}>{feature.icon}</Box>
                    <Typography variant="h5" gutterBottom>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Swiss Data Security Banner */}
      <SwissDataBanner />

      {/* Pricing Section - New Subscription Plans */}
      <Box sx={{ bgcolor: 'background.paper' }}>
        <SubscriptionPlans
          onRequestAuth={(planType) => {
            setSelectedPlan(planType);
            setLoginModalOpen(true);
          }}
        />
      </Box>

      {/* FAQ Section */}
      <FAQSection />

      {/* Footer */}
      <Footer />

      {/* Login/Signup Modal */}
      <LoginSignupModal
        open={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Badge Explanation Modal */}
      <Dialog
        open={badgeModalOpen}
        onClose={() => setBadgeModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedBadge && (
          <>
            <DialogTitle sx={{ fontWeight: 700, fontSize: '1.5rem', pb: 1 }}>
              {selectedBadge.title}
            </DialogTitle>
            <DialogContent>
              <Typography variant="body1" paragraph sx={{ color: 'text.primary', lineHeight: 1.7 }}>
                {selectedBadge.description}
              </Typography>

              {selectedBadge.benefits && (
                <>
                  <Typography variant="h6" sx={{ mt: 3, mb: 2, fontWeight: 600 }}>
                    Key Benefits:
                  </Typography>
                  <Box component="ul" sx={{ pl: 3, '& li': { mb: 1 } }}>
                    {selectedBadge.benefits.map((benefit, index) => (
                      <li key={index}>
                        <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                          {benefit}
                        </Typography>
                      </li>
                    ))}
                  </Box>
                </>
              )}

              {selectedBadge.link && (
                <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Learn more at:{' '}
                    <a
                      href={selectedBadge.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#1976d2', textDecoration: 'none', fontWeight: 600 }}
                    >
                      {selectedBadge.link}
                    </a>
                  </Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
              <Button onClick={() => setBadgeModalOpen(false)} variant="contained" color="primary">
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default Homepage;