import React, { useState, useRef, useEffect } from 'react';
import Header from '../../components/header/Header';
import Footer from '../../components/footer/Footer';
import { Box, Typography, IconButton, Container } from '@mui/material';
import { theme } from '../../theme/theme';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import OrganizationSchema from '../../components/StructuredData/OrganizationSchema';
import WebSiteSchema from '../../components/StructuredData/WebSiteSchema';
import BreadcrumbSchema from '../../components/StructuredData/BreadcrumbSchema';

const Layout = ({ children, backgroundColor, heading, text, isTenants, isOwners, isAbout, id }) => {
  const location = useLocation();
  const { t } = useTranslation();
  const paths = ['/plan', '/contact-us', '/faq'];
  const [isFullScreen, setIsFullScreen] = useState(false);
  const videoRef = useRef(null);

  const handleToggleFullScreen = () => {
    if (videoRef.current) {
      if (isFullScreen) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsFullScreen(!isFullScreen);
    }
  };

  useEffect(() => {
    if (isFullScreen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
      document.body.style.position = '';
      document.body.style.width = '';
    }

    return () => {
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isFullScreen]);

  useEffect(() => {
    const preventScroll = (e) => {
      if (isFullScreen) {
        e.preventDefault();
      }
    };

    const handleKeyDown = (e) => {
      if (isFullScreen) {
        if (e.key === 'Escape' || e.key === ' ') {
          e.preventDefault();
          setIsFullScreen(false);
          if (videoRef.current) {
            videoRef.current.pause();
          }
        }
        if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(e.key)) {
          e.preventDefault();
        }
      }
    };

    window.addEventListener('wheel', preventScroll, { passive: false });
    window.addEventListener('touchmove', preventScroll, { passive: false });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('wheel', preventScroll);
      window.removeEventListener('touchmove', preventScroll);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullScreen]);

  return (
    <Box sx={{ width: '100%' }} id={id}>
      {/* Structured Data Schemas */}
      <OrganizationSchema />
      <WebSiteSchema />
      <BreadcrumbSchema />

      <Box sx={{ backgroundColor: theme.palette.background.default }}>
        <Header />
        {!isFullScreen && !paths.includes(location.pathname) && (
          <Box
            sx={{
              background: 'linear-gradient(135deg, #FFFFFF 0%, #FFE5E8 100%)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              pt: 10,
              pb: isTenants || isOwners ? '0' : 10,
              width: '100%'
            }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: '700', fontSize: '35px' }}>
              {t(heading)}
            </Typography>
            <Typography
              sx={{
                textAlign: 'center',
                width: '50%',
                fontSize: '18px',
                fontWeight: '400',
                [theme.breakpoints.down('md')]: { width: '70%' }
              }}>
              {t(text)}
            </Typography>
          </Box>
        )}
        {(isTenants || isOwners) && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              borderRadius: '10px 10px 0 0',
              overflow: 'hidden',
              maxWidth: '660px',
              margin: '60px auto 0'
            }}>
            <Box
              sx={{
                width: isFullScreen ? '100vw' : '660px',
                height: isFullScreen ? '100vh' : '240px',
                position: isFullScreen ? 'fixed' : 'relative',
                top: isFullScreen ? 0 : 'auto',
                left: isFullScreen ? 0 : 'auto',
                zIndex: isFullScreen ? 9999 : 1,
                overflow: 'hidden'
              }}>
              <video
                ref={videoRef}
                style={{
                  width: '100%',
                  // height: "100%",
                  objectFit: 'cover'
                }}>
                <source
                  src="https://fe-landmarklens-website.s3.eu-central-1.amazonaws.com/code.mp4"
                  type="video/mp4"
                />
                {t('Your browser does not support the video tag.')}
              </video>
              {!isFullScreen ? (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'rgba(0,0,0,0.3)'
                  }}>
                  <IconButton
                    onClick={handleToggleFullScreen}
                    sx={{
                      backgroundColor: '#000',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: '#000'
                      }
                    }}>
                    <PlayArrowIcon fontSize="large" />
                  </IconButton>
                </Box>
              ) : (
                <IconButton
                  onClick={handleToggleFullScreen}
                  sx={{
                    position: 'absolute',
                    bottom: '20px',
                    right: '20px',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(0,0,0,0.7)'
                    }
                  }}>
                  <PauseIcon />
                </IconButton>
              )}
            </Box>
          </Box>
        )}
      </Box>
      <Box sx={{ backgroundColor: backgroundColor }}>{children}</Box>

      <Footer />
    </Box>
  );
};

export default Layout;
