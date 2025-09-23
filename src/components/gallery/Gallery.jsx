import { Box, Typography, Select, MenuItem, useMediaQuery } from '@mui/material';
import React, { useState, useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import GalleryCard from '../galleryCard/GalleryCard';
import AIAvatar from '../../assets/svg/AIAvatar';
import { useHiddenItems } from '../../hooks/useHideSearchedProperty/useHiddenItems';
import { useTranslation } from 'react-i18next';
import UpgradeModal from '../modals/upgradeModal';
import { theme } from '../../theme/theme';
import { jsonData } from '../../db';
import nofeaturedimage from '../../assets/nofeaturedimage.jpg';
import { getSubscription } from '../../store/slices/subscriptionsSlice';

const options = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  weekday: 'short'
};

const PLACEHOLDER_IMAGE_URL = nofeaturedimage;
const FREE_PLAN_LIMIT = 10;

export const Gallery = ({ recommendations = [] }) => {
  const { t } = useTranslation();
  const { isItemHidden } = useHiddenItems();
  const dispatch = useDispatch();
  const { isLoading } = useSelector((state) => state.recommendations);

  useEffect(() => {
    dispatch(getSubscription());
  }, [dispatch]);

  const subscription = useSelector((state) => state.subscriptions.subscription.data);
  const currentPlan = subscription?.[0]?.plan || 'free';

  const [openPaymentModal, setOpenPaymentModal] = useState(false);
  const [filter, setFilter] = useState('recently_matched');
  const date = new Date();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  function handleChangeFilter(e) {
    const newFilter = e.target.value;
    setFilter(newFilter);
  }

  const handleCardClick = (item) => {
    if (currentPlan === 'comprehensive' && item.external_url) {
      window.open(item.external_url, '_blank', 'noopener,noreferrer');
    }
  };

  const formattedDate = new Intl.DateTimeFormat('en-US', options).format(date);

  const sortList = (list) => {
    const sorted = [...list];
    switch (filter) {
      case 'recently_matched':
        return sorted.sort(
          (a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at)
        );
      case 'closest_match_score':
        return sorted.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
      case 'lowest_price':
        return sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
      case 'most_recent_listings':
        return sorted.sort(
          (a, b) => new Date(b.created_at || b.updated_at) - new Date(a.created_at || a.updated_at)
        );
      default:
        return sorted;
    }
  };

  const visibleRecommendations = useMemo(() => {
    const isValidRecommendations = Array.isArray(recommendations);
    return isValidRecommendations ? recommendations?.filter((item) => !isItemHidden(item.id)) : [];
  }, [recommendations, isItemHidden]);

  const sortedRecommendations = useMemo(() => {
    return sortList(visibleRecommendations);
  }, [visibleRecommendations, filter]);

  const visibleCount = currentPlan === 'free' ? FREE_PLAN_LIMIT : sortedRecommendations.length;
  const allowedRecommendations = sortedRecommendations.slice(0, visibleCount);
  const blurredRecommendations =
    currentPlan === 'free' ? sortedRecommendations.slice(FREE_PLAN_LIMIT) : [];

  const firstList = useMemo(() => allowedRecommendations.slice(0, 2), [allowedRecommendations]);
  const secondList = useMemo(() => allowedRecommendations.slice(2), [allowedRecommendations]);

  const blurredFirstList = useMemo(
    () => blurredRecommendations.slice(0, 2),
    [blurredRecommendations]
  );
  const blurredSecondList = useMemo(
    () => blurredRecommendations.slice(2),
    [blurredRecommendations]
  );

  const handleBlurredCardClick = () => {
    setOpenPaymentModal(true);
  };

  if (!recommendations || recommendations.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 4,
          minHeight: '400px',
          gap: 2,
          margin: '0 auto'
        }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          {isLoading ? t('No properties found') : 'Recommendations are loading ...'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: '35px',
        padding: isMobile ? 2 : '20px',
        width: '100%',
        height: '100%',
        overflowY: 'scroll',
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': {
          display: 'none'
        }
      }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
          <Typography variant="h6">{t('Search feed')}</Typography>
          <Select value={filter} onChange={handleChangeFilter} variant="outlined" size="small">
            <MenuItem value="recently_matched">{t('Recently Matched')}</MenuItem>
            <MenuItem value="closest_match_score">{t('Closest Match Score')}</MenuItem>
            <MenuItem value="lowest_price">{t('Lowest Price')}</MenuItem>
            <MenuItem value="most_recent_listings">{t('Most Recent Listings')}</MenuItem>
          </Select>
        </Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: isMobile ? 'flex-end' : 'center',
            justifyContent: isMobile ? 'flex-start' : 'space-between',
            flexDirection: isMobile ? 'column' : 'row'
          }}>
          <Typography sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <AIAvatar
              sx={{
                mt: 0,
                p: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px'
              }}
            />
            {t('Available Property for you. You can click on the card for more details.')}
          </Typography>
          <Typography variant="body1" sx={{ fontSize: 12, color: '#646464', mt: isMobile ? 1 : 0 }}>
            {formattedDate}
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 3
        }}>
        {firstList.map((item, index) => (
          <Box
            key={index}
            sx={{
              flexGrow: 1,
              position: 'relative',
              display: 'flex'
            }}>
            <GalleryCard
              index={index}
              item={{
                ...item,
                images:
                  !item.images || item.images.length === 0 ? [PLACEHOLDER_IMAGE_URL] : item.images
              }}
              setOpenPaymentModal={setOpenPaymentModal}
              onCardClick={handleCardClick}
              currentPlan={currentPlan}
            />
          </Box>
        ))}
      </Box>

      {secondList.length > 0 && (
        <>
          <Box
            sx={{
              display: 'flex',
              alignItems: isMobile ? 'flex-end' : 'center',
              justifyContent: isMobile ? 'flex-start' : 'space-between',
              flexDirection: isMobile ? 'column' : 'row'
            }}>
            <Typography sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <AIAvatar
                sx={{
                  mt: 0,
                  p: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px'
                }}
              />
              {t('Look, we found more options for you. Check it out')}
            </Typography>
            <Typography
              variant="body1"
              sx={{ fontSize: 12, color: '#646464', mt: isMobile ? 1 : 0 }}>
              {formattedDate}
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 3
            }}>
            {secondList.map((item, index) => (
              <Box
                key={index + 2}
                sx={{
                  flexGrow: 1,
                  position: 'relative',
                  display: 'flex'
                }}>
                <GalleryCard
                  index={index + 2}
                  item={{
                    ...item,
                    images:
                      !item.images || item.images.length === 0
                        ? [PLACEHOLDER_IMAGE_URL]
                        : item.images
                  }}
                  setOpenPaymentModal={setOpenPaymentModal}
                  onCardClick={handleCardClick}
                  currentPlan={currentPlan}
                />
              </Box>
            ))}
          </Box>
        </>
      )}

      {currentPlan === 'free' && blurredRecommendations.length > 0 && (
        <>
          <Box
            sx={{
              display: 'flex',
              alignItems: isMobile ? 'flex-end' : 'center',
              justifyContent: isMobile ? 'flex-start' : 'space-between',
              flexDirection: isMobile ? 'column' : 'row',
              mt: 2
            }}>
            <Typography sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <AIAvatar
                sx={{
                  mt: 0,
                  p: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px'
                }}
              />
              {t('Upgrade to see more recommendations')}
            </Typography>
            <Typography
              variant="body1"
              sx={{ fontSize: 12, color: '#646464', mt: isMobile ? 1 : 0 }}>
              {t('Premium Content')}
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 3
            }}>
            {blurredFirstList.map((item, index) => (
              <Box
                key={`blurred-${index}`}
                sx={{
                  flexGrow: 1,
                  position: 'relative',
                  display: 'flex',
                  filter: 'blur(5px)',
                  cursor: 'pointer',
                  opacity: 0.7,
                  transition: 'opacity 0.3s ease',
                  '&:hover': {
                    opacity: 0.9
                  }
                }}
                onClick={handleBlurredCardClick}>
                <GalleryCard
                  index={FREE_PLAN_LIMIT + index}
                  item={{
                    ...item,
                    images:
                      !item.images || item.images.length === 0
                        ? [PLACEHOLDER_IMAGE_URL]
                        : item.images
                  }}
                  setOpenPaymentModal={setOpenPaymentModal}
                  onCardClick={handleCardClick}
                  currentPlan={currentPlan}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: 1,
                    zIndex: 1
                  }}>
                  <Typography
                    variant="h6"
                    sx={{
                      color: 'white',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                    }}>
                    {t('Upgrade to View')}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>

          {blurredSecondList.length > 0 && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 3
              }}>
              {blurredSecondList.map((item, index) => (
                <Box
                  key={`blurred-second-${index}`}
                  sx={{
                    flexGrow: 1,
                    position: 'relative',
                    display: 'flex',
                    filter: 'blur(5px)',
                    cursor: 'pointer',
                    opacity: 0.7,
                    transition: 'opacity 0.3s ease',
                    '&:hover': {
                      opacity: 0.9
                    }
                  }}
                  onClick={handleBlurredCardClick}>
                  <GalleryCard
                    index={FREE_PLAN_LIMIT + blurredFirstList.length + index}
                    item={{
                      ...item,
                      images:
                        !item.images || item.images.length === 0
                          ? [PLACEHOLDER_IMAGE_URL]
                          : item.images
                    }}
                    setOpenPaymentModal={setOpenPaymentModal}
                    onCardClick={handleCardClick}
                    currentPlan={currentPlan}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      borderRadius: 1,
                      zIndex: 1
                    }}>
                    <Typography
                      variant="h6"
                      sx={{
                        color: 'white',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                      }}>
                      {t('Upgrade to View')}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </>
      )}

      <UpgradeModal
        translate
        currentPlan={jsonData.currentPlan}
        upgradePlan={jsonData.upgradePlan}
        open={openPaymentModal}
        onClose={() => setOpenPaymentModal(false)}
      />
    </Box>
  );
};
