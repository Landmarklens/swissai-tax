import React, { useState, useEffect } from 'react';
import { Hero } from '../../components/sections/heroSection/Hero';
import { Box, Button } from '@mui/material';
import WorkSection from '../../components/sections/workSection/WorkSection';
import EnhancedWorkSection from '../../components/sections/workSection/EnhancedWorkSection';
import Footer from '../../components/footer/Footer';
// import TestimonialCarousel from '../../components/sections/testimonialSection/Testimonial';
import VideoCarousel from '../../components/sections/videoSection/VideoCarousel';
import Features from '../../components/sections/featureSection/Feature';
import EnhancedFeatures from '../../components/sections/featureSection/EnhancedFeatures';
import { theme } from '../../theme/theme';
import FAQSection from '../../components/sections/FAQ/FAQ';
import LandlordFAQ from '../../components/sections/FAQ/LandlordFAQ';
import { useTranslation } from 'react-i18next';
import SEOHelmet from '../../components/SEO/SEOHelmet';
import LoginSignupModal from '../../components/login/Login';
import { ArrowUpward } from '@mui/icons-material';
import { useSearchParams } from 'react-router-dom';
import { PricingPlans } from '../../components/sections/PricingPlans/PricingPlans';

const Home = () => {
  const { t } = useTranslation();

  const [open, setOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [userType, setUserType] = useState(
    localStorage.getItem('homePageUserType') || 'tenant'
  );

  const [searchParams, setSearchParams] = useSearchParams();

  const isChangedPassword = Boolean(searchParams.get('passwordChanged'));
  const shouldOpenLogin = Boolean(searchParams.get('login'));

  const handleOpenAuthModal = () => {
    setOpen(true);
  };

  useEffect(() => {
    if (isChangedPassword) {
      setOpen(true);
      searchParams.delete('passwordChanged');
      setSearchParams(searchParams);
    }
  }, [isChangedPassword]);

  useEffect(() => {
    if (shouldOpenLogin) {
      setOpen(true);
      // Don't delete the login parameter yet, let the modal handle it
    }
  }, [shouldOpenLogin]);

  const handleClickOpen = () => {
    setOpen(true);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 200);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleUserTypeChange = (newType) => {
    console.log('[DEBUG] Home page - user type changing from', userType, 'to', newType);
    setUserType(newType);
    localStorage.setItem('homePageUserType', newType);
  };

  return (
    <>
      <SEOHelmet
        titleKey="meta.home.title"
        descriptionKey="meta.home.description"
      />
      <Box sx={{ maxWidth: '100%' }}>
        <LoginSignupModal open={open} onClose={() => setOpen(false)} />
        <Hero 
          handleClickOpen={handleClickOpen} 
          userType={userType}
          onUserTypeChange={handleUserTypeChange}
        />
        {userType === 'tenant' && <VideoCarousel />}
        {userType === 'landlord' ? (
          <EnhancedFeatures
            userType={userType}
            handleOpenAuthModal={handleOpenAuthModal}
          />
        ) : (
          <Features
            id="features"
            title={t('Features')}
            userType={userType}
          />
        )}
        {userType === 'landlord' ? (
          <EnhancedWorkSection userType={userType} />
        ) : (
          <WorkSection
            id="how-it-works"
            title={t('how_it_works')}
            userType={userType}
          />
        )}
        <PricingPlans
          handleOpenAuthModal={handleOpenAuthModal}
          title={userType === 'landlord'
            ? "Professional property management for small landlords"
            : "Your next home, yours for about a franc a day!"}
          subtitle={userType === 'landlord'
            ? "Starting at CHF 49/month • First week free • Cancel anytime"
            : "CHF 29.99 month • First day free • Cancel anytime"}
          userType={userType}
        />
        {/* <TestimonialCarousel id="testimonials" /> */}
        {userType === 'landlord' ? (
          <LandlordFAQ />
        ) : (
          <FAQSection />
        )}
        <Footer id="contact-us" />
      </Box>
      <Button
        onClick={scrollToTop}
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 100,
          opacity: isVisible ? '70%' : 0,
          visibility: isVisible ? 'visible' : 'hidden',
          transition: 'opacity 0.3s ease, visibility 0.3s ease',
          backgroundColor: theme.palette.primary.main,
          color: 'white',
          '&:hover': {
            backgroundColor: theme.palette.primary.main,
            opacity: '100%'
          }
        }}
        variant="contained">
        <ArrowUpward sx={{ fontSize: '32px' }} />
      </Button>
    </>
  );
};

export default Home;
