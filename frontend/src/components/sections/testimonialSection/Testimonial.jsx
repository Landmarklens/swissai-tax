import React, { useEffect, useRef, useState } from 'react';
import { Box, Card, CardContent, Typography, IconButton, Rating } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { theme } from '../../../theme/theme';
import { useTranslation } from 'react-i18next';
import { TESTIMONIALS } from '../../../constants/testimonials';
import { Swiper, SwiperSlide } from 'swiper/react';

import 'swiper/css';

const TestimonialCarousel = () => {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);
  const [slidesPerGroup, setSlidesPerGroup] = useState(1);

  const swiperRef = useRef(null);
  const dotsContainerRef = useRef(null);
  const dotRefs = useRef([]);
  const resizeTimeoutRef = useRef(null);

  const totalSlides = TESTIMONIALS.length;

  useEffect(() => {
    const updateSlidesPerGroup = () => {
      const width = window.innerWidth;
      let newSlidesPerGroup;
      if (width >= 1024) {
        newSlidesPerGroup = 3;
      } else if (width >= 768) {
        newSlidesPerGroup = 2;
      } else {
        newSlidesPerGroup = 1;
      }

      setSlidesPerGroup(newSlidesPerGroup);

      if (swiperRef.current) {
        const maxIndex = Math.max(0, TESTIMONIALS.length - newSlidesPerGroup);
        if (swiperRef.current.activeIndex > maxIndex) {
          swiperRef.current.slideTo(maxIndex);
        }
      }
    };

    const handleResize = () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      resizeTimeoutRef.current = setTimeout(updateSlidesPerGroup, 200);
    };

    updateSlidesPerGroup();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 600 && dotRefs.current[activeIndex]) {
      const activeDot = dotRefs.current[activeIndex];
      if (activeDot && activeDot.scrollIntoView) {
        activeDot.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [activeIndex, slidesPerGroup, totalSlides]);

  return (
    <Box
      sx={{
        padding: '60px 0 80px',
        backgroundColor: theme.palette.background.lightBlue,
        textAlign: 'center'
      }}>
      <Typography variant="h5" fontWeight={700} fontSize={'35px'} align="center" gutterBottom>
        {t('Testimonials')}
      </Typography>

      <Swiper
        onSlideChange={(swiper) => {
          setActiveIndex(swiper.activeIndex);
        }}
        spaceBetween={20}
        slidesPerView={slidesPerGroup}
        slidesPerGroup={slidesPerGroup}
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
        breakpoints={{
          0: { slidesPerView: 1, slidesPerGroup: 1 },
          768: { slidesPerView: 2, slidesPerGroup: 2 },
          1024: { slidesPerView: 3, slidesPerGroup: 3 }
        }}>
        {TESTIMONIALS.map((item) => (
          <SwiperSlide key={item.id} style={{ height: 'auto' }}>
            <Card
              sx={{
                display: 'flex',
                padding: '10px',
                borderRadius: '10px',
                border: '1px solid #d7e1ff',
                boxShadow: 'none',
                height: '100%',
                minHeight: '150px',
                textAlign: 'left',
                flex: 1
              }}>
              <CardContent
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  padding: '16px'
                }}>
                <Box
                  mb={2}
                  display="flex"
                  alignItems="start"
                  justifyContent="space-between"
                  gap={2}>
                  <Box>
                    <Typography fontSize={18} color="#000" fontWeight={700}>
                      {item.name}
                    </Typography>
                    <Typography fontSize={12}>
                      {item.address} | {item.type} | {item.rooms}
                    </Typography>
                  </Box>
                  <Rating value={5} readOnly />
                </Box>
                <Typography
                  color="#000"
                  sx={{
                    flexGrow: 1
                  }}>
                  {item.testimonial}
                </Typography>
              </CardContent>
            </Card>
          </SwiperSlide>
        ))}
      </Swiper>

      <Box display="flex" gap={2} alignItems="center" justifyContent="center" mt={2} px={2}>
        <IconButton
          onClick={() => swiperRef.current?.slidePrev()}
          disabled={activeIndex === 0}
          sx={{
            color: '#929293',
            border: '1px solid #929293',
            height: '30px',
            width: '30px',
            opacity: activeIndex === 0 ? 0.5 : 1
          }}>
          <ArrowBackIcon sx={{ fontSize: '16px' }} />
        </IconButton>

        <Box
          ref={dotsContainerRef}
          sx={{
            display: 'flex',
            justifyContent: { xs: 'flex-start', sm: 'center' },
            flexWrap: { xs: 'nowrap', sm: 'wrap' },
            gap: 1,
            overflowX: { xs: 'auto', sm: 'visible' },
            maxWidth: { xs: '100vw', sm: 'none' },
            whiteSpace: { xs: 'nowrap', sm: 'normal' },
            scrollbarWidth: { xs: 'none', sm: 'auto' },
            '&::-webkit-scrollbar': { display: { xs: 'none', sm: 'block' } },
            msOverflowStyle: { xs: 'none', sm: 'auto' }
          }}>
          {Array.from({ length: totalSlides }).map((_, dotIndex) => {
            const isActive = dotIndex === activeIndex;
            return (
              <Box
                key={dotIndex}
                ref={(el) => (dotRefs.current[dotIndex] = el)}
                onClick={() => {
                  swiperRef.current?.slideTo(dotIndex);
                }}
                sx={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: isActive ? '#3f63ec' : '#ccc',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s',
                  flex: '0 0 auto'
                }}
              />
            );
          })}
        </Box>

        <IconButton
          onClick={() => swiperRef.current?.slideNext()}
          disabled={activeIndex >= totalSlides - slidesPerGroup}
          sx={{
            color: '#929293',
            border: '1px solid #929293',
            height: '30px',
            width: '30px',
            opacity: activeIndex >= totalSlides - slidesPerGroup ? 0.5 : 1
          }}>
          <ArrowForwardIcon sx={{ fontSize: '16px' }} />
        </IconButton>
      </Box>
    </Box>
  );
};

export default TestimonialCarousel;
