import React, { useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import { useTranslation } from 'react-i18next';
import { theme } from '../../../theme/theme';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const VIDEOS_BY_LANGUAGE = {
  en: [
    {
      src: 'https://s3.us-east-1.amazonaws.com/homepage-of-homeai.ch/videos/CaffeAna.mp4',
      poster: 'https://s3.us-east-1.amazonaws.com/homepage-of-homeai.ch/posters/CaffeAna-poster.jpg'
    },
    {
      src: 'https://s3.us-east-1.amazonaws.com/homepage-of-homeai.ch/videos/FamTutorial.mp4',
      poster: 'https://s3.us-east-1.amazonaws.com/homepage-of-homeai.ch/posters/FamTutorial-poster.jpg'
    },
    {
      src: 'https://s3.us-east-1.amazonaws.com/homepage-of-homeai.ch/videos/interviewMiha.mp4',
      poster: 'https://s3.us-east-1.amazonaws.com/homepage-of-homeai.ch/posters/interviewMiha-poster.jpg'
    },
    {
      src: 'https://s3.us-east-1.amazonaws.com/homepage-of-homeai.ch/videos/LeaTuorial.mp4',
      poster: 'https://s3.us-east-1.amazonaws.com/homepage-of-homeai.ch/posters/LeaTuorial-poster.jpg'
    },
    {
      src: 'https://s3.us-east-1.amazonaws.com/homepage-of-homeai.ch/videos/street1.mp4',
      poster: 'https://s3.us-east-1.amazonaws.com/homepage-of-homeai.ch/posters/street1-poster.jpg'
    }
  ],
  de: [
    {
      src: 'https://s3.us-east-1.amazonaws.com/homepage-of-homeai.ch/videos/ch/Ch1.mp4',
      poster: 'https://s3.us-east-1.amazonaws.com/homepage-of-homeai.ch/posters/Ch1-poster.jpg'
    },
    {
      src: 'https://s3.us-east-1.amazonaws.com/homepage-of-homeai.ch/videos/ch/ch2.mp4',
      poster: 'https://s3.us-east-1.amazonaws.com/homepage-of-homeai.ch/posters/ch2-poster.jpg'
    },
    {
      src: 'https://s3.us-east-1.amazonaws.com/homepage-of-homeai.ch/videos/ch/ch3.mp4',
      poster: 'https://s3.us-east-1.amazonaws.com/homepage-of-homeai.ch/posters/ch3-poster.jpg'
    },
    {
      src: 'https://s3.us-east-1.amazonaws.com/homepage-of-homeai.ch/videos/ch/ch4.mp4',
      poster: 'https://s3.us-east-1.amazonaws.com/homepage-of-homeai.ch/posters/ch4-poster.jpg'
    }
  ],
  fr: [
    {
      src: 'https://s3.us-east-1.amazonaws.com/homepage-of-homeai.ch/videos/fr/Fr1.mp4',
      poster: 'https://s3.us-east-1.amazonaws.com/homepage-of-homeai.ch/posters/Fr1-poster.jpg'
    },
    {
      src: 'https://s3.us-east-1.amazonaws.com/homepage-of-homeai.ch/videos/fr/fr2.mp4',
      poster: 'https://s3.us-east-1.amazonaws.com/homepage-of-homeai.ch/posters/fr2-poster.jpg'
    },
    {
      src: 'https://s3.us-east-1.amazonaws.com/homepage-of-homeai.ch/videos/fr/fr3.mp4',
      poster: 'https://s3.us-east-1.amazonaws.com/homepage-of-homeai.ch/posters/fr3-poster.jpg'
    },
    {
      src: 'https://s3.us-east-1.amazonaws.com/homepage-of-homeai.ch/videos/fr/fr4.mp4',
      poster: 'https://s3.us-east-1.amazonaws.com/homepage-of-homeai.ch/posters/fr4-poster.jpg'
    }
  ],
  it: [
    {
      src: 'https://s3.us-east-1.amazonaws.com/homepage-of-homeai.ch/videos/it/It1.mp4',
      poster: 'https://s3.us-east-1.amazonaws.com/homepage-of-homeai.ch/posters/It1-poster.jpg'
    },
    {
      src: 'https://s3.us-east-1.amazonaws.com/homepage-of-homeai.ch/videos/it/it2.mp4',
      poster: 'https://s3.us-east-1.amazonaws.com/homepage-of-homeai.ch/posters/it2-poster.jpg'
    },
    {
      src: 'https://s3.us-east-1.amazonaws.com/homepage-of-homeai.ch/videos/it/It3.mp4',
      poster: 'https://s3.us-east-1.amazonaws.com/homepage-of-homeai.ch/posters/It3-poster.jpg'
    }
  ]
};

const VideoCarousel = () => {
  const { t, i18n } = useTranslation();
  const videoRefs = useRef([]);
  const [playingVideos, setPlayingVideos] = useState({});

  // Get current language with fallback to English
  const currentLanguage = i18n.language || 'en';
  const videos = VIDEOS_BY_LANGUAGE[currentLanguage] || VIDEOS_BY_LANGUAGE['en'];

  /**
   * Handles click on play button overlay to play the video.
   * @param {number} index Video index
   */
  const handlePlayClick = (index) => {
    const video = videoRefs.current[index];
    if (video) {
      video.play();
    }
  };

  /**
   * Updates playing state when video starts playing.
   * @param {number} index Video index
   */
  const handleVideoPlay = (index) => {
    setPlayingVideos((prev) => ({ ...prev, [index]: true }));
  };

  /**
   * Updates playing state when video is paused.
   * @param {number} index Video index
   */
  const handleVideoPause = (index) => {
    setPlayingVideos((prev) => ({ ...prev, [index]: false }));
  };

  /**
   * Updates playing state when video ends.
   * @param {number} index Video index
   */
  const handleVideoEnded = (index) => {
    setPlayingVideos((prev) => ({ ...prev, [index]: false }));
  };

  /**
   * Pauses all videos except the current slide when navigating.
   * @param {import('swiper/types').Swiper} swiper Swiper instance
   */
  const handleSlideChange = (swiper) => {
    videoRefs.current.forEach((video, index) => {
      if (!video) return;
      // Pause all videos that are not the current slide
      if (index !== swiper.realIndex) {
        video.pause();
      }
    });
  };

  return (
    <Box
      sx={{
        padding: '60px 0 0',
        textAlign: 'center'
      }}
    >
      <Typography
        variant="h5"
        fontWeight={700}
        fontSize={'35px'}
        align="center"
        gutterBottom
        sx={{ mb: '40px' }}
      >
        {t('Video Testimonials')}
      </Typography>
      <Box
        sx={{
          padding: '0 0 80px',
          backgroundColor: theme.palette.background.lightBlue
        }}
      >
        <Swiper
          modules={[Navigation, Pagination]}
          navigation
          pagination={{ clickable: true }}
          centeredSlides={false}
          loop
          onSlideChange={handleSlideChange}
          spaceBetween={20}
          slidesPerView={1}
          slidesPerGroup={1}
          initialSlide={0}
          breakpoints={{
            768: {
              slidesPerView: 2,
              slidesPerGroup: 2
            },
            1024: {
              slidesPerView: 3,
              slidesPerGroup: 3
            }
          }}
        >
          {videos.map((video, idx) => (
            <SwiperSlide key={idx} style={{ height: 'auto' }}>
              <Box sx={{ position: 'relative', width: '100%' }}>
                <Box
                  component="video"
                  src={video.src}
                  poster={video.poster}
                  ref={(el) => {
                    videoRefs.current[idx] = el;
                  }}
                  controls
                  preload="none"
                  onPlay={() => handleVideoPlay(idx)}
                  onPause={() => handleVideoPause(idx)}
                  onEnded={() => handleVideoEnded(idx)}
                  sx={{ width: '100%', borderRadius: '8px', objectFit: 'cover' }}
                />
                {/* Play button overlay - only show when video is not playing */}
                {!playingVideos[idx] && (
                  <Box
                    onClick={() => handlePlayClick(idx)}
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                      transition: 'transform 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translate(-50%, -50%) scale(1.1)'
                      },
                      '&::before': {
                        content: '""',
                        width: 0,
                        height: 0,
                        borderStyle: 'solid',
                        borderWidth: '20px 0 20px 35px',
                        borderColor: 'transparent transparent transparent #3f63ec',
                        marginLeft: '8px'
                      }
                    }}
                  />
                )}
              </Box>
            </SwiperSlide>
          ))}
        </Swiper>
      </Box>
    </Box>
  );
};

export default VideoCarousel;
