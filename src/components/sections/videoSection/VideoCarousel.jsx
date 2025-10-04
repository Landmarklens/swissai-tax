import React, { useRef } from 'react';
import { Box, Typography } from '@mui/material';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import { useTranslation } from 'react-i18next';
import { theme } from '../../../theme/theme';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// Tax service video content - Update these URLs when actual videos are available
const VIDEOS_BY_LANGUAGE = {
  en: [
    {
      src: 'https://s3.us-east-1.amazonaws.com/swissai-tax/videos/en/how-it-works.mp4',
      poster: 'https://s3.us-east-1.amazonaws.com/swissai-tax/posters/en/how-it-works-poster.jpg',
      title: 'How SwissAI Tax Works',
      description: 'Complete your tax return in 20 minutes'
    },
    {
      src: 'https://s3.us-east-1.amazonaws.com/swissai-tax/videos/en/document-upload.mp4',
      poster: 'https://s3.us-east-1.amazonaws.com/swissai-tax/posters/en/document-upload-poster.jpg',
      title: 'Document Upload Tutorial',
      description: 'Easy OCR scanning explained'
    },
    {
      src: 'https://s3.us-east-1.amazonaws.com/swissai-tax/videos/en/testimonial-1.mp4',
      poster: 'https://s3.us-east-1.amazonaws.com/swissai-tax/posters/en/testimonial-1-poster.jpg',
      title: 'Customer Success Story',
      description: 'CHF 2,500 refund achieved'
    },
    {
      src: 'https://s3.us-east-1.amazonaws.com/swissai-tax/videos/en/deductions-guide.mp4',
      poster: 'https://s3.us-east-1.amazonaws.com/swissai-tax/posters/en/deductions-guide-poster.jpg',
      title: 'Maximize Your Deductions',
      description: 'Top 10 deductions explained'
    },
    {
      src: 'https://s3.us-east-1.amazonaws.com/swissai-tax/videos/en/canton-selection.mp4',
      poster: 'https://s3.us-east-1.amazonaws.com/swissai-tax/posters/en/canton-selection-poster.jpg',
      title: 'All 26 Cantons Supported',
      description: 'File anywhere in Switzerland'
    }
  ],
  de: [
    {
      src: 'https://s3.us-east-1.amazonaws.com/swissai-tax/videos/de/so-funktionierts.mp4',
      poster: 'https://s3.us-east-1.amazonaws.com/swissai-tax/posters/de/so-funktionierts-poster.jpg',
      title: 'So funktioniert SwissAI Tax',
      description: 'Steuererklärung in 20 Minuten'
    },
    {
      src: 'https://s3.us-east-1.amazonaws.com/swissai-tax/videos/de/dokumente-hochladen.mp4',
      poster: 'https://s3.us-east-1.amazonaws.com/swissai-tax/posters/de/dokumente-hochladen-poster.jpg',
      title: 'Dokumente hochladen',
      description: 'Einfache OCR-Erkennung erklärt'
    },
    {
      src: 'https://s3.us-east-1.amazonaws.com/swissai-tax/videos/de/kundenerfahrung-1.mp4',
      poster: 'https://s3.us-east-1.amazonaws.com/swissai-tax/posters/de/kundenerfahrung-1-poster.jpg',
      title: 'Kundenerfolgsgeschichte',
      description: 'CHF 2\'500 Rückerstattung erhalten'
    },
    {
      src: 'https://s3.us-east-1.amazonaws.com/swissai-tax/videos/de/abzuege-guide.mp4',
      poster: 'https://s3.us-east-1.amazonaws.com/swissai-tax/posters/de/abzuege-guide-poster.jpg',
      title: 'Maximale Abzüge',
      description: 'Top 10 Abzüge erklärt'
    }
  ],
  fr: [
    {
      src: 'https://s3.us-east-1.amazonaws.com/swissai-tax/videos/fr/comment-ca-marche.mp4',
      poster: 'https://s3.us-east-1.amazonaws.com/swissai-tax/posters/fr/comment-ca-marche-poster.jpg',
      title: 'Comment fonctionne SwissAI Tax',
      description: 'Déclaration en 20 minutes'
    },
    {
      src: 'https://s3.us-east-1.amazonaws.com/swissai-tax/videos/fr/telecharger-documents.mp4',
      poster: 'https://s3.us-east-1.amazonaws.com/swissai-tax/posters/fr/telecharger-documents-poster.jpg',
      title: 'Télécharger vos documents',
      description: 'OCR simple expliqué'
    },
    {
      src: 'https://s3.us-east-1.amazonaws.com/swissai-tax/videos/fr/temoignage-1.mp4',
      poster: 'https://s3.us-east-1.amazonaws.com/swissai-tax/posters/fr/temoignage-1-poster.jpg',
      title: 'Témoignage client',
      description: 'CHF 2\'500 de remboursement'
    },
    {
      src: 'https://s3.us-east-1.amazonaws.com/swissai-tax/videos/fr/guide-deductions.mp4',
      poster: 'https://s3.us-east-1.amazonaws.com/swissai-tax/posters/fr/guide-deductions-poster.jpg',
      title: 'Maximisez vos déductions',
      description: 'Top 10 déductions expliquées'
    }
  ],
  it: [
    {
      src: 'https://s3.us-east-1.amazonaws.com/swissai-tax/videos/it/come-funziona.mp4',
      poster: 'https://s3.us-east-1.amazonaws.com/swissai-tax/posters/it/come-funziona-poster.jpg',
      title: 'Come funziona SwissAI Tax',
      description: 'Dichiarazione in 20 minuti'
    },
    {
      src: 'https://s3.us-east-1.amazonaws.com/swissai-tax/videos/it/carica-documenti.mp4',
      poster: 'https://s3.us-east-1.amazonaws.com/swissai-tax/posters/it/carica-documenti-poster.jpg',
      title: 'Carica i documenti',
      description: 'OCR semplice spiegato'
    },
    {
      src: 'https://s3.us-east-1.amazonaws.com/swissai-tax/videos/it/testimonianza-1.mp4',
      poster: 'https://s3.us-east-1.amazonaws.com/swissai-tax/posters/it/testimonianza-1-poster.jpg',
      title: 'Storia di successo',
      description: 'CHF 2\'500 di rimborso'
    }
  ]
};

const VideoCarousel = () => {
  const { t, i18n } = useTranslation();
  const videoRefs = useRef([]);
  
  // Get current language with fallback to English
  const currentLanguage = i18n.language || 'en';
  const videos = VIDEOS_BY_LANGUAGE[currentLanguage] || VIDEOS_BY_LANGUAGE['en'];

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
        padding: '60px 0 80px',
        backgroundColor: theme.palette.background.sectionAlt || '#F0F4F8',
        textAlign: 'center'
      }}
    >
      <Typography
        variant="h2"
        fontWeight={600}
        align="center"
        gutterBottom
        sx={{ mb: 2, fontSize: { xs: '28px', md: '36px' } }}
      >
        {t('Learn How SwissAI Tax Works')}
      </Typography>
      <Typography
        variant="body1"
        align="center"
        sx={{ mb: 4, color: 'text.secondary', maxWidth: 600, mx: 'auto' }}
      >
        {t('Watch our video tutorials and success stories from satisfied customers across Switzerland')}
      </Typography>
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
            <Box sx={{ p: 2 }}>
              <Box sx={{ position: 'relative', width: '100%', mb: 2 }}>
                <Box
                  sx={{
                    width: '100%',
                    paddingTop: '56.25%', // 16:9 aspect ratio
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #003DA5 0%, #0052CC 100%)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {/* Video placeholder content */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(0, 0, 0, 0.3)'
                    }}
                  >
                    <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                      {video.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)', px: 2, textAlign: 'center' }}>
                      {video.description}
                    </Typography>
                  </Box>
                  {/* Play button overlay */}
                  <Box
                    sx={{
                      position: 'absolute',
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                      '&::before': {
                        content: '""',
                        width: 0,
                        height: 0,
                        borderStyle: 'solid',
                        borderWidth: '15px 0 15px 25px',
                        borderColor: `transparent transparent transparent ${theme.palette.primary.main}`,
                        marginLeft: '5px'
                      }
                    }}
                  />
                </Box>
              </Box>
              <Typography variant="h6" sx={{ mb: 0.5, fontWeight: 500 }}>
                {video.title || t('Video Tutorial')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {video.description || t('Learn more about our service')}
              </Typography>
            </Box>
          </SwiperSlide>
        ))}
      </Swiper>
    </Box>
  );
};

export default VideoCarousel;
