import React, { useState } from 'react';
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
  Stack
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
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import Header from '../../components/header/Header';
import Footer from '../../components/footer/Footer';
import VideoCarousel from '../../components/sections/videoSection/VideoCarousel';
import HeroIllustration from '../../components/sections/heroSection/HeroIllustration';
import { useUserCounter } from '../../hooks/useUserCounter';
import LoginSignupModal from '../../components/login/Login';
import authService from '../../services/authService';

const Homepage = () => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const currentLang = i18n.language || 'en';
  const userCount = useUserCounter();
  const [loginModalOpen, setLoginModalOpen] = useState(false);

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
    { value: userCount.toLocaleString(), label: t('homepage.stats.users') },
    { value: "26", label: t('homepage.stats.cantons') },
    { value: "20 Min", label: t('homepage.stats.time') }
  ];

  const pricingPlan = {
    name: t('plan.name'),
    price: "CHF 49.99",
    description: t('plan.price_description'),
    features: [
      { included: true, text: t('plan.features.feature1') },
      { included: true, text: t('plan.features.feature2') },
      { included: true, text: t('plan.features.feature3') },
      { included: true, text: t('plan.features.feature4') },
      { included: true, text: t('plan.features.feature5') },
      { included: true, text: t('plan.features.feature6') },
      { included: true, text: t('plan.features.feature7') },
      { included: true, text: t('plan.features.feature8') },
      { included: true, text: t('plan.features.feature9') },
      { included: true, text: t('plan.features.feature10') },
      { included: true, text: t('plan.features.feature11') },
      { included: true, text: t('plan.features.feature12') },
      { included: true, text: t('plan.features.feature13') },
      { included: true, text: t('plan.features.feature14') },
      { included: true, text: t('plan.features.feature15') },
      { included: true, text: t('plan.features.feature16') }
    ],
    buttonText: t('plan.cta_button'),
    buttonVariant: "contained",
    featured: true
  };

  const handleGetStarted = () => {
    const isAuthenticated = authService.isAuthenticated();
    if (isAuthenticated) {
      navigate(`/${currentLang}/tax-filing/interview`);
    } else {
      setLoginModalOpen(true);
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
      <Box sx={{ py: 4, bgcolor: 'grey.50', borderTop: '1px solid', borderBottom: '1px solid', borderColor: 'grey.200' }}>
        <Container maxWidth="lg">
          <Grid container spacing={3} justifyContent="center" alignItems="center">
            <Grid item xs={12} sm={4}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Box sx={{
                    width: 60,
                    height: 60,
                    bgcolor: '#DC0018',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                    position: 'relative'
                  }}>
                    <Box sx={{
                      width: 20,
                      height: 20,
                      bgcolor: 'white',
                      position: 'absolute'
                    }} />
                    <Box sx={{
                      width: 20,
                      height: 4,
                      bgcolor: '#DC0018',
                      position: 'absolute',
                      zIndex: 1
                    }} />
                    <Box sx={{
                      width: 4,
                      height: 20,
                      bgcolor: '#DC0018',
                      position: 'absolute',
                      zIndex: 1
                    }} />
                  </Box>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    {t('homepage.badges.made_in_switzerland')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('homepage.badges.swiss_quality')}
                  </Typography>
                </Box>
              </motion.div>
            </Grid>
            <Grid item xs={12} sm={4}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <SecurityIcon sx={{ fontSize: 60, color: 'primary.main', mb: 1.5 }} />
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    {t('homepage.badges.swiss_data_protection')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('homepage.badges.gdpr_compliant')}
                  </Typography>
                </Box>
              </motion.div>
            </Grid>
            <Grid item xs={12} sm={4}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Box sx={{ fontSize: 60, color: 'success.main', mb: 1.5 }}>🔐</Box>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    {t('homepage.badges.bank_level_encryption')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('homepage.badges.aes_256')}
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
              <Grid item xs={12} md={4} key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                >
                  <Card
                    sx={{
                      p: 4,
                      height: '100%',
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

      {/* Pricing Section */}
      <Box sx={{ py: 8, bgcolor: 'background.lightGrey' }}>
        <Container maxWidth="lg">
          <Typography
            variant="h2"
            align="center"
            gutterBottom
            sx={{ mb: 2, fontSize: { xs: '28px', md: '36px' } }}
          >
            {t('homepage.pricing.title')}
          </Typography>
          <Typography
            variant="body1"
            align="center"
            color="text.secondary"
            sx={{ mb: 6, maxWidth: '600px', mx: 'auto' }}
          >
            {t('homepage.pricing.subtitle')}
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              style={{ width: '100%', maxWidth: '1100px' }}
            >
              <Card
                sx={{
                  p: 5,
                  border: '2px solid',
                  borderColor: '#DC0018',
                  borderRadius: 3,
                  bgcolor: 'white',
                  boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.08)'
                }}
              >
                {/* Plan Name */}
                <Typography
                  variant="h3"
                  align="center"
                  fontWeight={700}
                  sx={{ mb: 3, fontSize: { xs: '28px', md: '32px' } }}
                >
                  {pricingPlan.name}
                </Typography>

                {/* Price */}
                <Typography
                  variant="h2"
                  align="center"
                  sx={{
                    fontWeight: 'bold',
                    fontSize: { xs: '56px', md: '72px' },
                    color: '#DC0018',
                    lineHeight: 1.1,
                    mb: 1
                  }}
                >
                  CHF 49.99
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  align="center"
                  sx={{ mb: 4, fontSize: '14px' }}
                >
                  per tax return / one-time payment
                </Typography>

                {/* Description */}
                <Typography
                  variant="body1"
                  color="text.secondary"
                  align="center"
                  sx={{ mb: 5, fontSize: '16px', maxWidth: '800px', mx: 'auto' }}
                >
                  {t('plan.description')}
                </Typography>

                {/* Features - 2 Columns */}
                <Box
                  sx={{
                    mb: 5,
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                    gap: 2.5,
                    maxWidth: '900px',
                    mx: 'auto'
                  }}
                >
                  {pricingPlan.features.map((feature, idx) => (
                    <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      <CheckIcon
                        sx={{
                          color: '#4CAF50',
                          fontSize: 22,
                          mr: 1.5,
                          mt: 0.2,
                          flexShrink: 0
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{ fontSize: '15px', lineHeight: 1.7, color: 'text.primary' }}
                      >
                        {feature.text}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                {/* CTA Button */}
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  onClick={handleGetStarted}
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    py: 2.5,
                    fontSize: '18px',
                    fontWeight: 600,
                    bgcolor: '#DC0018',
                    '&:hover': {
                      bgcolor: '#B00015'
                    },
                    textTransform: 'none',
                    borderRadius: 2,
                    maxWidth: '900px',
                    mx: 'auto'
                  }}
                >
                  {pricingPlan.buttonText}
                </Button>

                {/* Money-back guarantee */}
                <Typography
                  variant="body2"
                  color="text.secondary"
                  align="center"
                  sx={{ mt: 3, fontSize: '14px' }}
                >
                  {t('homepage.pricing.guarantee')}
                </Typography>
              </Card>
            </motion.div>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Footer />

      {/* Login/Signup Modal */}
      <LoginSignupModal
        open={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
      />
    </Box>
  );
};

export default Homepage;