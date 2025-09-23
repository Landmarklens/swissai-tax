import React, { useState, useEffect } from 'react';
import {
  Modal,
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  LinearProgress,
  Rating,
  Tabs,
  Tab
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme/theme';
import CloseIcon from '@mui/icons-material/Close';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import HomeIcon from '@mui/icons-material/Home';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import InfoIcon from '@mui/icons-material/Info';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import FeedbackIcon from '@mui/icons-material/Feedback';
import BedIcon from '@mui/icons-material/Bed';
import BathtubIcon from '@mui/icons-material/Bathtub';
import SquareFootIcon from '@mui/icons-material/SquareFoot';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ImageIcon from '@mui/icons-material/Image';
import DescriptionIcon from '@mui/icons-material/Description';
import StarIcon from '@mui/icons-material/Star';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import EnrichmentDataDisplay from '../enrichment/EnrichmentDataDisplay';
import MissingDataPrompt from '../enrichment/MissingDataPrompt';
import { useDispatch } from 'react-redux';
import { trackPropertyView } from '../../store/slices/analyticsSlice';

const RecommendationDetailsModal = ({ open, onClose, recommendation, onFeedbackClick }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [metadata, setMetadata] = useState(null);
  const [hasTrackedView, setHasTrackedView] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState(0);

  const outerBox = {
    display: 'flex',
    flexDirection: 'column',
    p: 2,
    mb: 2,
    boxShadow: 'none',
    backgroundColor: theme.palette.background.skyBlue,
    rowGap: 1,
    borderRadius: '10px'
  };

  const subPaper = {
    p: 1,
    display: 'flex',
    alignItems: 'center',
    boxShadow: 'none',
    border: `1.5px solid ${theme.palette.border.blue}`,
    flexGrow: 1,
    backgroundColor: '#ffffff'
  };

  const iconStyle = {
    p: 1,
    height: '36px',
    width: '36px',
    borderRadius: '5px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const mainText = {
    ml: 1,
    fontSize: '14px',
    fontWeight: 700,
    color: 'black'
  };

  const subText = {
    fontSize: '12px',
    ml: 1
  };

  useEffect(() => {
    if (open && recommendation) {
      // Analytics tracking disabled due to 405 error - backend needs to implement endpoint
      // TODO: Re-enable when backend implements POST /analytics/property_view
      /*
      if (!hasTrackedView) {
        const propertyId = recommendation.property?.id || recommendation.id;
        if (propertyId) {
          dispatch(trackPropertyView({ property_id: propertyId, event_type: 'detail_view' }));
          setHasTrackedView(true);
        }
      }
      */

      // Simulate metadata loading - replace with actual API call
      setMetadataLoading(true);
      setTimeout(() => {
        setMetadata({
          matchScore: 87,
          reasoning: [
            'Perfect location match for your work commute',
            'Budget fits within your specified range',
            'Amenities match your lifestyle preferences',
            'Property size meets your family needs'
          ],
          marketInsights: [
            'Similar properties in this area rent for 5-10% more',
            'High demand neighborhood with low vacancy rates',
            'Recent price increase trend in this district'
          ]
        });
        setMetadataLoading(false);
      }, 1500);
    }
  }, [open, recommendation, dispatch, hasTrackedView]);

  // Reset tracking when modal closes
  useEffect(() => {
    if (!open) {
      setHasTrackedView(false);
    }
  }, [open]);

  const handleSourceClick = () => {
    const url = external_url || recommendation?.property?.external_url || recommendation?.external_url;
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleFeedbackClick = () => {
    if (onFeedbackClick) {
      onFeedbackClick(recommendation);
    }
  };

  if (!recommendation) return null;

  // Handle both enriched and legacy formats
  const isEnriched = recommendation.property && recommendation.enrichment;
  const property = isEnriched ? recommendation.property : recommendation;
  const enrichmentData = isEnriched ? recommendation.enrichment : null;

  // Extract data with proper fallbacks for different data structures
  const {
    id,
    title = '',
    description = '',
    images = [],
    property_images = [], // Add property_images field
    price = null,
    price_chf = null,
    currency = '',
    bedrooms = '',
    bathrooms = '',
    square_meters = '', // This is the correct field from DB
    square_feet = '',
    amenities = [],
    external_url = '',
    external_source = '',
    source_details = null,
    ai_confidence = null,
    ai_explanation = '',
    address = '',
    city = '',
    canton = '',
    deal_type = 'rent' // Add deal_type field
  } = property || {};

  // Use price_chf if price is not available
  const finalPrice = price || price_chf;
  const finalCurrency = currency || 'CHF';
  const finalSquareMeters = square_meters || square_feet; // Prioritize square_meters from DB
  const finalAiConfidence = ai_confidence || recommendation.ai_confidence;
  const finalAiExplanation = ai_explanation || recommendation.ai_explanation;
  const finalDealType = deal_type || property?.deal_type || 'rent';
  
  // Merge all images from different sources - handle both array of strings and array of objects
  const allImages = [];
  if (images && images.length > 0) {
    allImages.push(...images);
  }
  if (property_images && property_images.length > 0) {
    // Avoid duplicates by checking URLs
    const existingUrls = allImages.map(img => img?.image_url || img);
    property_images.forEach(img => {
      const imgUrl = img?.image_url || img;
      if (!existingUrls.includes(imgUrl)) {
        allImages.push(img);
      }
    });
  }
  const finalImages = allImages.length > 0 ? allImages : [];

  const formatPrice = () => {
    if (finalPrice === null || finalPrice === undefined || finalPrice === '') {
      return t('OnDemand');
    }
    return `${finalPrice} ${finalCurrency}`.trim();
  };

  // Helper function to format source name and get logo
  const getSourceInfo = () => {
    if (source_details?.name && source_details?.logo) {
      return {
        name: source_details.name,
        logo: source_details.logo
      };
    }

    // Fallback to external_source
    if (external_source) {
      const name = external_source.split('_')[0];
      return {
        name: name.charAt(0).toUpperCase() + name.slice(1),
        logo: null
      };
    }

    return {
      name: '',
      logo: null
    };
  };

  const sourceInfo = getSourceInfo();

  // Calculate match score for visual display
  const matchScoreValue = finalAiConfidence ? 
    (finalAiConfidence > 1 ? finalAiConfidence : finalAiConfidence * 100) : 0;
  
  // Get match score color based on value
  const getMatchScoreColor = (score) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FF9800';
    if (score >= 40) return '#FFC107';
    return '#F44336';
  };

  // Handle image navigation
  const handlePreviousImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? finalImages.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === finalImages.length - 1 ? 0 : prev + 1));
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="recommendation-details-modal"
      aria-describedby="recommendation-details-description">
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '95%',
          maxWidth: 1200,
          maxHeight: '95vh',
          bgcolor: 'background.paper',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          borderRadius: 3,
          p: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
        {/* Header with Match Score */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px 32px',
            borderBottom: `1px solid ${theme.palette.border.grey}`,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                fontSize: '22px',
                color: '#ffffff'
              }}>
              {title || t('Property Details')}
            </Typography>
            {finalAiConfidence && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '20px',
                    padding: '6px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                  <StarIcon sx={{ color: '#FFD700', fontSize: 20 }} />
                  <Typography
                    sx={{
                      color: '#ffffff',
                      fontWeight: 600,
                      fontSize: '16px'
                    }}>
                    {Math.round(matchScoreValue)}% Match
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
          <IconButton 
            onClick={onClose} 
            sx={{ 
              color: '#ffffff',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Content */}
        <Box
          sx={{
            display: 'flex',
            flex: 1,
            overflow: 'hidden'
          }}>
          {/* Left Side - Image Gallery */}
          <Box
            sx={{
              width: '55%',
              backgroundColor: '#000000',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
            {/* Main Image */}
            <Box
              sx={{
                width: '100%',
                height: '100%',
                backgroundImage: `url(${finalImages?.[currentImageIndex]?.image_url || finalImages?.[currentImageIndex] || '/nofeaturedimage.jpg'})`,
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
            />
            
            {/* Image Navigation */}
            {finalImages && finalImages.length > 1 && (
              <>
                <IconButton
                  onClick={handlePreviousImage}
                  sx={{
                    position: 'absolute',
                    left: 16,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    color: '#ffffff',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.7)'
                    }
                  }}>
                  <NavigateBeforeIcon />
                </IconButton>
                <IconButton
                  onClick={handleNextImage}
                  sx={{
                    position: 'absolute',
                    right: 16,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    color: '#ffffff',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.7)'
                    }
                  }}>
                  <NavigateNextIcon />
                </IconButton>
                
                {/* Image Counter */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 16,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    color: '#ffffff',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '14px'
                  }}>
                  {currentImageIndex + 1} / {finalImages.length}
                </Box>
              </>
            )}

            {/* Image Thumbnails */}
            {finalImages && finalImages.length > 1 && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  display: 'flex',
                  gap: 1,
                  padding: 2,
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  overflowX: 'auto',
                  '&::-webkit-scrollbar': {
                    height: '6px'
                  },
                  '&::-webkit-scrollbar-track': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    borderRadius: '3px'
                  }
                }}>
                {finalImages.map((image, index) => (
                  <Box
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    sx={{
                      minWidth: '80px',
                      height: '60px',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      backgroundImage: `url(${image?.image_url || image || '/nofeaturedimage.jpg'})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      cursor: 'pointer',
                      border: currentImageIndex === index ? '2px solid #ffffff' : '2px solid transparent',
                      opacity: currentImageIndex === index ? 1 : 0.6,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        opacity: 1
                      }
                    }}
                  />
                ))}
              </Box>
            )}

          </Box>

          {/* Right Side - Property Details */}
          <Box
            sx={{
              width: '45%',
              padding: '32px',
              overflowY: 'auto',
              backgroundColor: '#fafafa'
            }}>
            {/* Location and Price */}
            <Box sx={{ mb: 3 }}>
              {address && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <LocationOnIcon sx={{ color: theme.palette.text.secondary, fontSize: 20 }} />
                  <Typography
                    sx={{
                      fontSize: '16px',
                      color: theme.palette.text.primary
                    }}>
                    {address}{city ? `, ${city}` : ''}{canton ? `, ${canton}` : ''}
                  </Typography>
                </Box>
              )}
              <Typography
                sx={{
                  fontSize: '32px',
                  fontWeight: 700,
                  color: theme.palette.primary.main,
                  mb: 1
                }}>
                {formatPrice()}
                {finalPrice && (
                  <span
                    style={{
                      fontSize: '18px',
                      color: theme.palette.text.secondary,
                      fontWeight: 400,
                      marginLeft: '8px'
                    }}>
                    {t('per month')}
                  </span>
                )}
              </Typography>
            </Box>

            {/* Tabs for organized content */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs value={activeTab} onChange={handleTabChange}>
                <Tab label={t('Overview')} />
                <Tab label={t('Details')} />
                {enrichmentData && <Tab label={t('Insights')} />}
              </Tabs>
            </Box>

            {/* Tab Content */}
            <Box>
              {/* Tab Panel 0 - Overview */}
              {activeTab === 0 && (
                <Box>

                  {/* Key Features Grid */}
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={6}>
                      <Paper
                        sx={{
                          p: 2,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          backgroundColor: '#ffffff',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}>
                        <BedIcon sx={{ color: theme.palette.primary.main, fontSize: 28 }} />
                        <Box>
                          <Typography sx={{ fontSize: '20px', fontWeight: 600 }}>
                            {bedrooms || 'N/A'}
                          </Typography>
                          <Typography sx={{ fontSize: '12px', color: theme.palette.text.secondary }}>
                            {t('Bedrooms')}
                          </Typography>
                        </Box>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper
                        sx={{
                          p: 2,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          backgroundColor: '#ffffff',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}>
                        <BathtubIcon sx={{ color: theme.palette.primary.main, fontSize: 28 }} />
                        <Box>
                          <Typography sx={{ fontSize: '20px', fontWeight: 600 }}>
                            {bathrooms || 'N/A'}
                          </Typography>
                          <Typography sx={{ fontSize: '12px', color: theme.palette.text.secondary }}>
                            {t('Bathrooms')}
                          </Typography>
                        </Box>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper
                        sx={{
                          p: 2,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          backgroundColor: '#ffffff',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}>
                        <SquareFootIcon sx={{ color: theme.palette.primary.main, fontSize: 28 }} />
                        <Box>
                          <Typography sx={{ fontSize: '20px', fontWeight: 600 }}>
                            {finalSquareMeters || 'N/A'}
                          </Typography>
                          <Typography sx={{ fontSize: '12px', color: theme.palette.text.secondary }}>
                            {t('Square Meters')}
                          </Typography>
                        </Box>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper
                        sx={{
                          p: 2,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          backgroundColor: '#ffffff',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}>
                        <CalendarTodayIcon sx={{ color: theme.palette.primary.main, fontSize: 28 }} />
                        <Box>
                          <Typography sx={{ fontSize: '16px', fontWeight: 600 }}>
                            {t('Available')}
                          </Typography>
                          <Typography sx={{ fontSize: '12px', color: theme.palette.text.secondary }}>
                            {t('Immediately')}
                          </Typography>
                        </Box>
                      </Paper>
                    </Grid>
                  </Grid>

                  {/* AI Match Analysis */}
                  {finalAiExplanation && (
                    <Box
                      sx={{
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        p: 3,
                        mb: 3,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#202020' }}>
                          {t('Match Analysis')}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={matchScoreValue}
                            sx={{
                              width: '100px',
                              height: '8px',
                              borderRadius: '4px',
                              backgroundColor: '#e0e0e0',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: getMatchScoreColor(matchScoreValue),
                                borderRadius: '4px'
                              }
                            }}
                          />
                          <Typography
                            sx={{
                              fontSize: '16px',
                              fontWeight: 600,
                              color: getMatchScoreColor(matchScoreValue)
                            }}>
                            {Math.round(matchScoreValue)}%
                          </Typography>
                        </Box>
                      </Box>
                      <Typography
                        sx={{
                          fontSize: '14px',
                          color: '#374151',
                          lineHeight: 1.8
                        }}>
                        {finalAiExplanation}
                      </Typography>
                    </Box>
                  )}

                  {/* Amenities */}
                  {amenities && amenities.length > 0 && (
                    <Box
                      sx={{
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        p: 3,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}>
                      <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#202020', mb: 2 }}>
                        {t('Amenities')}
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {amenities.map((amenity, index) => (
                          <Chip
                            key={index}
                            icon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
                            label={amenity}
                            sx={{
                              backgroundColor: theme.palette.background.skyBlue,
                              border: `1px solid ${theme.palette.primary.main}`,
                              '& .MuiChip-icon': {
                                color: theme.palette.primary.main
                              }
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              )}

              {/* Tab Panel 1 - Details */}
              {activeTab === 1 && (
                <Box>
                  {/* Property Description */}
                  {description && (
                    <Box
                      sx={{
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        p: 3,
                        mb: 3,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <DescriptionIcon sx={{ color: theme.palette.primary.main }} />
                        <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#202020' }}>
                          {t('Description')}
                        </Typography>
                      </Box>
                      <Typography
                        sx={{
                          fontSize: '14px',
                          color: '#374151',
                          lineHeight: 1.8,
                          whiteSpace: 'pre-wrap'
                        }}>
                        {description}
                      </Typography>
                    </Box>
                  )}

                  {/* Additional Property Details */}
                  <Box
                    sx={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      p: 3,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                    <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#202020', mb: 2 }}>
                      {t('Property Information')}
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography sx={{ fontSize: '12px', color: theme.palette.text.secondary }}>
                          {t('Property Type')}
                        </Typography>
                        <Typography sx={{ fontSize: '14px', fontWeight: 500 }}>
                          {finalDealType === 'buy' ? t('For Sale') : t('For Rent')}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography sx={{ fontSize: '12px', color: theme.palette.text.secondary }}>
                          {t('Listing Source')}
                        </Typography>
                        <Typography sx={{ fontSize: '14px', fontWeight: 500 }}>
                          {sourceInfo.name || external_source || 'N/A'}
                        </Typography>
                      </Grid>
                      {canton && (
                        <Grid item xs={6}>
                          <Typography sx={{ fontSize: '12px', color: theme.palette.text.secondary }}>
                            {t('Canton')}
                          </Typography>
                          <Typography sx={{ fontSize: '14px', fontWeight: 500 }}>
                            {canton}
                          </Typography>
                        </Grid>
                      )}
                      {city && (
                        <Grid item xs={6}>
                          <Typography sx={{ fontSize: '12px', color: theme.palette.text.secondary }}>
                            {t('City')}
                          </Typography>
                          <Typography sx={{ fontSize: '14px', fontWeight: 500 }}>
                            {city}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Box>
                </Box>
              )}

              {/* Tab Panel 2 - Insights (if enrichment data exists) */}
              {activeTab === 2 && enrichmentData && (
                <Box>
                  <EnrichmentDataDisplay
                    enrichment={enrichmentData}
                    onRefresh={() => {
                      // TODO: Implement refresh logic
                    }}
                  />
                  {enrichmentData?.missing_fields && enrichmentData.missing_fields.length > 0 && (
                    <MissingDataPrompt missingFields={enrichmentData.missing_fields} />
                  )}
                </Box>
              )}
            </Box>
          </Box>
        </Box>

        {/* Footer with Source Button */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderTop: `1px solid ${theme.palette.border.grey}`,
            backgroundColor: theme.palette.background.skyBlue
          }}>
          <Button
            onClick={onClose}
            variant="outlined"
            sx={{
              fontWeight: 500,
              fontSize: '14px',
              borderColor: theme.palette.primary.main,
              color: theme.palette.primary.main,
              '&:hover': {
                borderColor: theme.palette.primary.dark,
                backgroundColor: 'rgba(62, 99, 221, 0.04)'
              }
            }}>
            {t('Close')}
          </Button>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              onClick={handleFeedbackClick}
              variant="outlined"
              startIcon={<FeedbackIcon />}
              sx={{
                fontWeight: 500,
                fontSize: '14px',
                borderColor: theme.palette.primary.main,
                color: theme.palette.primary.main,
                '&:hover': {
                  borderColor: theme.palette.primary.dark,
                  backgroundColor: 'rgba(62, 99, 221, 0.04)'
                }
              }}>
              {t('Tell us what you think')}
            </Button>

            <Button
              onClick={handleSourceClick}
              variant="contained"
              startIcon={<OpenInNewIcon />}
              disabled={!external_url && !recommendation?.external_url}
              sx={{
                fontWeight: 500,
                fontSize: '14px',
                backgroundColor: theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark
                },
                '&:disabled': {
                  backgroundColor: theme.palette.action.disabledBackground
                },
                minHeight: '40px'
              }}>
              {t('View on')} {sourceInfo.name || t('Source')}
            </Button>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
};

export default RecommendationDetailsModal;
