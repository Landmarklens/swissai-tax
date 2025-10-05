import React from 'react';
import { Box, Typography } from '@mui/material';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import { useTranslation } from 'react-i18next';
import { theme } from '../../../theme/theme';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// Tax tutorial and user testimonial videos by language
const VIDEOS_BY_LANGUAGE = {
  en: [
    {
      src: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      title: 'Complete Tax Filing Tutorial'
    },
    {
      src: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      title: 'Maximize Your Tax Deductions'
    },
    {
      src: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      title: 'Customer Success Story'
    }
  ],
  de: [
    {
      src: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      title: 'Vollständiges Tutorial zur Steuererklärung'
    },
    {
      src: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      title: 'Maximieren Sie Ihre Steuerabzüge'
    },
    {
      src: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      title: 'Erfolgsgeschichte eines Kunden'
    }
  ],
  fr: [
    {
      src: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      title: 'Tutoriel complet de déclaration fiscale'
    },
    {
      src: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      title: 'Maximisez vos déductions fiscales'
    },
    {
      src: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      title: 'Histoire de réussite client'
    }
  ],
  it: [
    {
      src: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      title: 'Tutorial completo dichiarazione fiscale'
    },
    {
      src: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      title: 'Massimizza le tue deduzioni fiscali'
    },
    {
      src: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      title: 'Storia di successo del cliente'
    }
  ]
};

const VideoCarousel = () => {
  const { t, i18n } = useTranslation();

  // Get current language with fallback to English
  const currentLanguage = i18n.language || 'en';
  const videos = VIDEOS_BY_LANGUAGE[currentLanguage] || VIDEOS_BY_LANGUAGE['en'];

  return (
    <Box
      sx={{
        padding: '60px 0 80px',
        backgroundColor: theme.palette.background.lightBlue,
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
        {t('How SwissTax Works')}
      </Typography>
      <Swiper
        modules={[Navigation, Pagination]}
        navigation
        pagination={{ clickable: true }}
        centeredSlides={false}
        loop={false}
        spaceBetween={20}
        slidesPerView={1}
        slidesPerGroup={1}
        initialSlide={0}
        breakpoints={{
          768: {
            slidesPerView: 2,
            slidesPerGroup: 1
          },
          1024: {
            slidesPerView: 3,
            slidesPerGroup: 1
          }
        }}
      >
        {videos.map((video, idx) => (
          <SwiperSlide key={idx} style={{ height: 'auto' }}>
            <Box sx={{ position: 'relative', width: '100%', paddingTop: '56.25%' }}>
              <Box
                component="iframe"
                src={video.src}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  borderRadius: '8px',
                  border: 'none'
                }}
              />
            </Box>
          </SwiperSlide>
        ))}
      </Swiper>
    </Box>
  );
};

export default VideoCarousel;
