import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  useMediaQuery,
  useTheme,
  Container,
  IconButton
} from '@mui/material';
import Join from '../joinSection/Join';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import GroupIcon from '@mui/icons-material/Group';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import { useNavigate } from 'react-router-dom';
import Header from '../../header/Header';
import { SearchBar } from '../../searchBar/SearchBar';
import UserTypeToggle from '../../UserTypeToggle/UserTypeToggle';
import { motion, AnimatePresence } from 'framer-motion';
import { debounce } from '../../../utils/performanceUtils';
import { useTranslation } from 'react-i18next';
import preview from '../../../assets/Youtube-Cover-homeaich-optimized.jpg';
import SocialProof from '../../SocialProof/SocialProof';
import TrustBadges from '../../TrustBadges/TrustBadges';
import SimpleHeroStats from '../../SimpleHeroStats/SimpleHeroStats';

export const Hero = ({ handleClickOpen, userType, onUserTypeChange }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);
  const [error, setError] = useState(null);

  // Debug logging
  useEffect(() => {
    console.log('[DEBUG] Hero component - userType:', userType);
  }, [userType]);

  const tenantFeatures = [
    t('Personalized Property Matches'),
    t('Instant Insight and Recommendations'),
    t('24/7 Availability, Anytime, Anywhere')
  ];

  const landlordFeatures = [
    t('AI-Powered Tenant Screening'),
    t('Automated Application Processing'),
    t('Market Analytics & Pricing Optimization')
  ];

  const features = userType === 'landlord' ? landlordFeatures : tenantFeatures;

  // Disable video for landlords
  const showVideo = userType !== 'landlord';

  /*
  useEffect(() => {
    if (isPlaying) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isPlaying]);
  */

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.key === 'Escape' || event.code === 'Space') && isPlaying) {
        event.preventDefault();
        handlePlayPause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPlaying]);

  const handlePlayPause = useCallback(
    debounce(() => {
      if (videoRef.current) {
        if (isPlaying) {
          try {
            const pauseResult = videoRef.current.pause();
            if (pauseResult !== undefined) {
              pauseResult.catch((e) => {
                console.error('Error pausing video:', e);
                setError(t('Failed to pause video. Please try again.'));
              });
            }
          } catch (e) {
            console.error('Error calling pause:', e);
            setError(t('Failed to pause video. Please try again.'));
          }
        } else {
          try {
            const playResult = videoRef.current.play();
            if (playResult !== undefined) {
              playResult.catch((e) => {
                console.error('Error playing video:', e);
                setError(t('Failed to play video. Please try again.'));
              });
            }
          } catch (e) {
            console.error('Error calling play:', e);
            setError(t('Failed to play video. Please try again.'));
          }
        }
        setIsPlaying(!isPlaying);
      } else {
        console.error('Video element not found');
        setError(t('Video element not found. Please try again later.'));
      }
    }, 300),
    [isPlaying]
  );

  return (
    <Box>
      <Box
        sx={{
          height: '100vh',
          maxWidth: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(180deg, rgba(207,216,247,1) 20%, rgba(247,249,255,1) 100%)',
          position: 'relative',
          overflow: 'hidden'
        }}>
        <Box sx={{ height: '10%' }}>
          <Header handleClickOpen={handleClickOpen} />
        </Box>

        <AnimatePresence>
          {!isPlaying && (
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              style={{ height: '90%', width: '100%' }}>
              <Container maxWidth="xl" sx={{ height: '100%', position: 'relative' }}>
                {/* Toggle positioned absolutely at the top center */}
                <Box sx={{
                  position: { xs: 'relative', md: 'absolute' },
                  top: { xs: '20px', md: '50px' },
                  left: { xs: '0', md: '50%' },
                  transform: { xs: 'none', md: 'translateX(-50%)' },
                  zIndex: 10,
                  width: { xs: '100%', md: 'auto' },
                  px: { xs: 2, md: 0 }
                }}>
                  <UserTypeToggle userType={userType} onUserTypeChange={onUserTypeChange} />
                </Box>

                <Box
                  sx={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                    pt: { xs: 8, md: 0 } // Add padding top on mobile to account for toggle
                  }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'left',
                      flexDirection: 'column',
                      width: { xs: '100%', md: '60%' },
                      zIndex: 3,
                      mt: { xs: 0, md: 12 }, // Different margin top for mobile/desktop
                      px: { xs: 2, md: 0 }
                    }}>
                    
                    <Typography
                      variant="h1"
                      sx={{
                        fontWeight: 'bold',
                        fontSize: {
                          xs: '40px',
                          md: 'clamp(50px, 5vw, 80px)'
                        },
                        lineHeight: 1.2,
                        mb: 2,
                        color: 'black'
                      }}>
                      {userType === 'landlord' 
                        ? t('Manage Properties with AI Intelligence')
                        : (
                          <>
                            {t('Your AI-Powered')}
                            <br /> {t('Real Estate Agent')}
                          </>
                        )
                      }
                    </Typography>

                    <Typography
                      variant="h5"
                      sx={{
                        mb: 4,
                        fontSize: '16px',
                        fontFamily: 'SF Pro Display',
                        color: theme.palette.text.secondary
                      }}>
                      {userType === 'landlord'
                        ? t('Streamline tenant selection, automate communications, and maximize your rental income with AI')
                        : t('Stop scrolling through 100+ listings — let AI send the 4 homes that actually fit.')
                      }
                    </Typography>

                    <Box sx={{ py: 4 }}>
                      {userType === 'tenant' ? (
                        <SearchBar isMobile={isMobile} />
                      ) : (
                        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                          <Button
                            variant="contained"
                            size="large"
                            onClick={() => {
                              handleClickOpen();
                            }}
                            sx={{
                              px: 6,
                              py: 2.5,
                              fontSize: '20px',
                              fontWeight: 600,
                              textTransform: 'none',
                              borderRadius: '12px',
                              boxShadow: '0 4px 20px rgba(62, 99, 221, 0.3)',
                              '&:hover': {
                                boxShadow: '0 6px 30px rgba(62, 99, 221, 0.4)',
                                transform: 'translateY(-2px)'
                              }
                            }}>
                            {t('Start Free Trial')}
                          </Button>
                          <Button
                            variant="outlined"
                            size="large"
                            onClick={() => {
                              window.open('https://homeai.zohobookings.eu', '_blank');
                            }}
                            sx={{
                              px: 6,
                              py: 2.5,
                              fontSize: '20px',
                              fontWeight: 600,
                              textTransform: 'none',
                              borderRadius: '12px',
                              borderWidth: '2px',
                              '&:hover': {
                                borderWidth: '2px',
                                transform: 'translateY(-2px)'
                              }
                            }}>
                            {t('Book a Demo')}
                          </Button>
                        </Box>
                      )}
                    </Box>


                    {userType === 'tenant' && (
                      <Box width="100%" gap={2} display="flex" flexDirection="row" flexWrap="wrap">
                        {features.map((feature, index) => (
                          <Typography
                            key={index}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              fontSize: '12px'
                            }}>
                            <CheckCircleOutlineIcon
                              sx={{ mr: 1, color: '#4CAF50', fontSize: '20px' }}
                            />
                            {feature}
                          </Typography>
                        ))}
                      </Box>
                    )}

                    {/* Landlord Info Section - Clean Layout */}
                    {userType === 'landlord' && (
                      <Box sx={{ mt: 4 }}>
                        {/* Features Grid */}
                        <Box sx={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                          gap: 2,
                          mb: 3
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CheckCircleIcon sx={{ fontSize: 18, color: '#65BA74', flexShrink: 0 }} />
                            <Typography sx={{ fontSize: '13px', color: '#4A5568', lineHeight: 1.4 }}>
                              {t('AI-Powered Tenant Screening')}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CheckCircleIcon sx={{ fontSize: 18, color: '#65BA74', flexShrink: 0 }} />
                            <Typography sx={{ fontSize: '13px', color: '#4A5568', lineHeight: 1.4 }}>
                              {t('Automated Application Processing')}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CheckCircleIcon sx={{ fontSize: 18, color: '#65BA74', flexShrink: 0 }} />
                            <Typography sx={{ fontSize: '13px', color: '#4A5568', lineHeight: 1.4 }}>
                              {t('Market Analytics & Pricing Optimization')}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Trust Badges */}
                        <TrustBadges variant="compact" />
                      </Box>
                    )}
                  </Box>
                </Box>
              </Container>
            </motion.div>
          )}
        </AnimatePresence>
        {showVideo ? (
          <Box
            sx={{
              position: 'absolute',
              right: 0,
              top: 0,
              width: isPlaying ? '100%' : '40%',
              height: '100%',
              display: { xs: 'none', md: 'flex' },
              justifyContent: 'flex-end',
              alignItems: 'center',
              transition: 'all 0.5s ease-in-out'
            }}>
          <motion.div
            initial={{ aspectRatio: '16/9' }}
            animate={{
              width: isPlaying ? '100%' : '100%',
              height: isPlaying ? '100%' : 'auto',
              borderRadius: isPlaying ? '0%' : '3% 0 0 3%',
              aspectRatio: '16/9'
            }}
            transition={{ duration: 0.5 }}
            style={{
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '1px -1px 34px -10px rgba(0,0,0,1)',
              zIndex: isPlaying ? 1000 : 0
            }}>
            <video
              poster={preview}
              ref={videoRef}
              style={{
                width: '100%',
                height: isPlaying ? 'auto' : '100%',
                objectFit: 'cover'
              }}>
              <source
                src="https://s3.us-east-1.amazonaws.com/homepage-of-homeai.ch/Home.ai_4+%5BENGLISH%5D.mp4"
                type="video/mp4"
              />
              {t('Your browser does not support the video tag.')}
            </video>
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: isPlaying ? 'transparent' : 'rgba(0,0,0,0.3)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
              {!isPlaying && (
                <IconButton
                  onClick={handlePlayPause}
                  sx={{
                    backgroundColor: '#000',
                    color: 'white',
                    outline: '4px solid white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      backgroundColor: '#000',
                      transform: 'scale(1.1)'
                    },
                    width: 64,
                    height: 64
                  }}>
                  <PlayArrowIcon fontSize="large" />
                </IconButton>
              )}
            </Box>
            {isPlaying && (
              <IconButton
                onClick={handlePlayPause}
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
            {error && (
              <Typography
                sx={{
                  position: 'absolute',
                  bottom: '20px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  color: 'red',
                  backgroundColor: 'rgba(255,255,255,0.7)',
                  padding: '5px',
                  borderRadius: '4px'
                }}>
                {error}
              </Typography>
            )}
          </motion.div>
        </Box>
        ) : userType === 'landlord' ? (
          <Box
            sx={{
              position: 'absolute',
              right: 0,
              top: 0,
              width: '40%',
              height: '100%',
              display: { xs: 'none', md: 'flex' },
              justifyContent: 'center',
              alignItems: 'center',
              paddingRight: '5%'
            }}>
            <SimpleHeroStats />
          </Box>
        ) : null}
      </Box>
      <Join userType={userType} />
    </Box>
  );
};
