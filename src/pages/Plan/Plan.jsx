import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Stack
} from '@mui/material';
import {
  Check as CheckIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import Header from '../../components/header/Header';
import Footer from '../../components/footer/Footer';
import LoginSignupModal from '../../components/login/Login';
import authService from '../../services/authService';

const Plan = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const currentLang = i18n.language || 'en';
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const handleGetStarted = () => {
    const isAuthenticated = authService.isAuthenticated();
    if (isAuthenticated) {
      navigate(`/${currentLang}/tax-filing/interview`);
    } else {
      setLoginModalOpen(true);
    }
  };

  const features = [
    t('plan.features.feature1'),
    t('plan.features.feature2'),
    t('plan.features.feature3'),
    t('plan.features.feature4'),
    t('plan.features.feature5'),
    t('plan.features.feature6'),
    t('plan.features.feature7'),
    t('plan.features.feature8'),
    t('plan.features.feature9'),
    t('plan.features.feature10'),
    t('plan.features.feature11'),
    t('plan.features.feature12'),
    t('plan.features.feature13'),
    t('plan.features.feature14'),
    t('plan.features.feature15'),
    t('plan.features.feature16')
  ];

  return (
    <>
      <Header />
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pt: 12, pb: 8 }}>
        <Container maxWidth="lg">
          {/* Page Header */}
          <Box sx={{ textAlign: 'center', mb: 8 }}>
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
                  mb: 2
                }}
              >
                {t('plan.heading')}
              </Typography>
              <Typography
                variant="h6"
                color="text.secondary"
                sx={{ maxWidth: '700px', mx: 'auto', mb: 4 }}
              >
                {t('plan.subheading')}
              </Typography>
            </motion.div>
          </Box>

          {/* Single Pricing Card */}
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              style={{ width: '100%', maxWidth: '900px' }}
            >
              <Card
                sx={{
                  p: 5,
                  position: 'relative',
                  border: '2px solid',
                  borderColor: 'primary.main',
                  boxShadow: 6,
                  borderRadius: 3
                }}
              >
                {/* Plan Name */}
                <Typography
                  variant="h3"
                  align="center"
                  gutterBottom
                  sx={{ mt: 2, fontWeight: 700 }}
                >
                  {t('plan.name')}
                </Typography>

                {/* Price */}
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Typography
                    variant="h2"
                    color="primary.main"
                    sx={{
                      fontSize: { xs: '48px', md: '64px' },
                      fontWeight: 'bold',
                      lineHeight: 1.2
                    }}
                  >
                    CHF 49.99
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                    {t('plan.price_description')}
                  </Typography>
                </Box>

                {/* Description */}
                <Typography
                  variant="body1"
                  color="text.secondary"
                  align="center"
                  paragraph
                  sx={{ mb: 4, fontSize: '16px' }}
                >
                  {t('plan.description')}
                </Typography>

                {/* Features List - 2 Columns */}
                <Box
                  sx={{
                    mb: 4,
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                    gap: 2
                  }}
                >
                  {features.map((feature, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      <CheckIcon
                        sx={{
                          color: 'success.main',
                          fontSize: 24,
                          mr: 1.5,
                          mt: 0.5,
                          flexShrink: 0
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: '15px',
                          fontWeight: 500,
                          lineHeight: 1.6
                        }}
                      >
                        {feature}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                {/* CTA Button */}
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  endIcon={<ArrowForwardIcon />}
                  onClick={handleGetStarted}
                  sx={{
                    py: 2,
                    fontSize: '18px',
                    fontWeight: 600,
                    textTransform: 'none',
                    borderRadius: 2
                  }}
                >
                  {t('plan.cta_button')}
                </Button>

                {/* Money-back guarantee */}
                <Typography
                  variant="body2"
                  color="text.secondary"
                  align="center"
                  sx={{ mt: 3 }}
                >
                  {t('plan.guarantee')}
                </Typography>
              </Card>
            </motion.div>
          </Box>

          {/* Why Choose Us Section */}
          <Box sx={{ mt: 10, textAlign: 'center' }}>
            <Typography variant="h3" gutterBottom sx={{ mb: 4, fontWeight: 600 }}>
              {t('plan.why_choose.title')}
            </Typography>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={4}
              sx={{ mt: 4 }}
            >
              <Card sx={{ flex: 1, p: 4, textAlign: 'center' }}>
                <Typography variant="h5" gutterBottom fontWeight={600}>
                  {t('plan.why_choose.reason1.title')}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {t('plan.why_choose.reason1.description')}
                </Typography>
              </Card>
              <Card sx={{ flex: 1, p: 4, textAlign: 'center' }}>
                <Typography variant="h5" gutterBottom fontWeight={600}>
                  {t('plan.why_choose.reason2.title')}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {t('plan.why_choose.reason2.description')}
                </Typography>
              </Card>
              <Card sx={{ flex: 1, p: 4, textAlign: 'center' }}>
                <Typography variant="h5" gutterBottom fontWeight={600}>
                  {t('plan.why_choose.reason3.title')}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {t('plan.why_choose.reason3.description')}
                </Typography>
              </Card>
            </Stack>
          </Box>
        </Container>
      </Box>
      <Footer />

      {/* Login/Signup Modal */}
      <LoginSignupModal
        open={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
      />
    </>
  );
};

export default Plan;
