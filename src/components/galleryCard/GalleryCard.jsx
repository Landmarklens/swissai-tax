import React from 'react';
import nofeaturedimage from '../../assets/nofeaturedimage.jpg';
import { Card, CardContent, CardMedia, Typography, Box, Divider, IconButton, Chip } from '@mui/material';
import { DirectionsCar, Euro } from '@mui/icons-material';
import { theme } from '../../theme/theme';
import { useTranslation } from 'react-i18next';
import { capitalizeFirstLetter } from '../../utils/capitalizeFirstLetter';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { sendConversationMessage } from '../../store/slices/conversationsSlice';

const cardStyling = {
  flexGrow: 1,
  borderRadius: '10px',
  border: `1px solid ${theme.palette.border.grey}`,
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  p: 0,
  transition: 'transform 0.3s ease-in-out',
  '& .MuiCardContent-root:last-child': {
    paddingBottom: 0
  },
  '&:hover': {
    transform: 'scale(1.02)',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)'
  },
  display: 'flex',
  flexDirection: 'column'
};

const GalleryCard = ({ data, onCardClick, onDetailsClick }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const activeConversationId = useSelector((state) => state.conversations.activeConversationId);

  // Log the data to understand what's being received
    fullData: data,
    dataKeys: data ? Object.keys(data) : [],
    hasPrice: data?.price !== undefined,
    priceValue: data?.price,
    hasTitle: !!data?.title,
    titleValue: data?.title,
    hasAddress: !!data?.address,
    addressValue: data?.address,
    hasAiExplanation: !!data?.ai_explanation,
    aiExplanationValue: data?.ai_explanation,
    hasAiConfidence: data?.ai_confidence !== undefined,
    aiConfidenceValue: data?.ai_confidence,
    hasMatchScore: data?.matchScore !== undefined,
    matchScoreValue: data?.matchScore,
    hasAiExplanationProp: !!data?.aiExplanation,
    aiExplanationPropValue: data?.aiExplanation,
    // Check for nested property structure
    hasProperty: !!data?.property,
    propertyKeys: data?.property ? Object.keys(data.property) : []
  });

  // Extract price from title if not available as separate field
  const extractPriceFromTitle = (titleStr) => {
    if (!titleStr) return { price: null, currency: '' };
    
    // Try to match patterns like "CHF 1320" or "1320 CHF" or "€ 1500" or "1500 EUR"
    const priceMatch = titleStr.match(/(?:CHF|EUR|€|Fr\.|USD|\$)\s*(\d+(?:[',]\d{3})*(?:\.\d+)?)|(\d+(?:[',]\d{3})*(?:\.\d+)?)\s*(?:CHF|EUR|€|Fr\.|USD|\$)/i);
    if (priceMatch) {
      const priceValue = priceMatch[1] || priceMatch[2];
      const cleanPrice = priceValue.replace(/[',]/g, '');
      
      // Extract currency
      let currency = 'CHF'; // Default
      if (titleStr.includes('EUR') || titleStr.includes('€')) currency = 'EUR';
      else if (titleStr.includes('USD') || titleStr.includes('$')) currency = 'USD';
      else if (titleStr.includes('CHF') || titleStr.includes('Fr.')) currency = 'CHF';
      
      return { price: parseFloat(cleanPrice), currency };
    }
    return { price: null, currency: '' };
  };

  // Extract address from title if not available as separate field
  const extractAddressFromTitle = (titleStr) => {
    if (!titleStr) return '';
    // Try to extract address - usually comes before the price
    const parts = titleStr.split(' - ');
    if (parts.length > 1) {
      return parts[0].trim();
    }
    return '';
  };

  // Extract source from title if not available
  const extractSourceFromTitle = (titleStr) => {
    if (!titleStr) return '';
    // Check for common sources at the end of title
    const sources = ['ImmoScout24', 'Homegate', 'Comparis', 'Immobilier.ch'];
    for (const source of sources) {
      if (titleStr.includes(source)) {
        return source;
      }
    }
    return '';
  };

  const {
    images = [],
    external_url = '',
    title = '',
    price = null,
    currency = '',
    address = '',
    country = '',
    amenities = [],
    matchScore = null,
    aiExplanation = null,
    external_source = '',
    source_details = null,
    enrichmentData = null,
    ai_confidence = null,
    ai_explanation = null,
    platform = '',
    // Additional field names that might be used
    property_price = null,
    property_currency = '',
    property_address = '',
    property_images = [],
    property_url = ''
  } = data || {};

  // Log extracted values for debugging
  const extractedData = extractPriceFromTitle(title);
  const extractedAddress = extractAddressFromTitle(title);
  const extractedSource = extractSourceFromTitle(title);
  
    title,
    extractedPrice: extractedData.price,
    extractedCurrency: extractedData.currency,
    extractedAddress,
    extractedSource,
    providedPrice: price || property_price,
    providedAddress: address || property_address,
    providedAiConfidence: ai_confidence,
    providedAiExplanation: ai_explanation,
    providedImages: images || property_images
  });

  // Use provided values first, then extracted values as fallback
  const finalPrice = price || property_price || extractedData.price;
  const finalCurrency = currency || property_currency || extractedData.currency || 'CHF';
  const finalAddress = address || property_address || extractedAddress;
  const finalSource = external_source || platform || extractedSource;
  const finalImages = images?.length > 0 ? images : (property_images?.length > 0 ? property_images : []);
  const finalUrl = external_url || property_url;
  // Use ai_confidence if matchScore is not available
  const finalMatchScore = matchScore !== null && matchScore !== undefined ? matchScore : ai_confidence;
  // Use ai_explanation if aiExplanation is not available
  const finalAiExplanation = aiExplanation || ai_explanation;

  const formatPrice = () => {
    if (finalPrice === null || finalPrice === undefined || finalPrice === '') {
      return t('OnDemand');
    }
    return `${finalPrice} ${finalCurrency}`.trim();
  };

  const getSourceInfo = () => {
    if (source_details?.name && source_details?.logo) {
      return {
        name: source_details.name,
        logo: source_details.logo
      };
    }

    if (finalSource) {
      const name = finalSource.split('_')[0];
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

  const handleClickCard = () => {
    if (onDetailsClick) {
      onDetailsClick(data);
    } else if (onCardClick) {
      onCardClick(data);
      if (finalUrl) {
        window.open(finalUrl, '_blank', 'noopener,noreferrer');
      }
    }
  };

  const handleClickDislike = () => {
    dispatch(
      sendConversationMessage({
        conversationId: activeConversationId,
        message: `I don't like this property`
      })
    );
  };

  return (
    <Card sx={cardStyling}>
      <Box onClick={handleClickCard}>
        <CardMedia
          component="div"
          sx={{
            maxWidth: '100%',
            height: '120px',
            objectFit: 'cover',
            borderTopLeftRadius: '10px',
            borderTopRightRadius: '10px',
            position: 'relative',
            overflow: 'hidden'
          }}>
          <img
            src={finalImages?.[0]?.image_url || finalImages?.[0] || nofeaturedimage}
            alt={title || 'Property'}
            style={{
              width: '100%',
              height: '120px',
              objectFit: 'cover',
              borderTopLeftRadius: '10px',
              borderTopRightRadius: '10px',
              display: 'block'
            }}
            loading="lazy"
            decoding="async"
            onError={(e) => {
              e.target.src = nofeaturedimage;
            }}
          />
          {/* Resource logo in top right corner over the image */}
          {sourceInfo.logo && (
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                background: 'rgba(255,255,255,0.85)',
                borderRadius: '6px',
                padding: '2px 4px',
                zIndex: 2,
                display: 'flex',
                alignItems: 'center',
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                maxWidth: '80px',
                maxHeight: '40px'
              }}>
              <img
                src={sourceInfo.logo}
                alt={sourceInfo.name}
                style={{
                  width: '100%',
                  height: '100%',
                  maxWidth: '78px',
                  maxHeight: '36px',
                  objectFit: 'contain'
                }}
                loading="eager"
                decoding="async"
              />
            </Box>
          )}
        </CardMedia>

        <CardContent
          sx={{
            p: 0,
            pb: 0,
            width: '100%'
          }}>
          {/* Title and Price */}
          <Box
            sx={{
              borderBottom: `1.5px solid ${theme.palette.border.blue}`,
              px: 2,
              py: 1.5,
              display: 'flex',
              flexDirection: 'column',
              gap: 1
            }}>
            {/* Property Title */}
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 600,
                lineHeight: 1.3,
                color: 'black',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
              variant="h6">
              {title || 'Property Listing'}
            </Typography>

            {/* Price and Source */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography
                sx={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: theme.palette.primary.main
                }}>
                {formatPrice()}
                {finalPrice !== null && finalPrice !== undefined && finalPrice !== '' && (
                  <span
                    style={{
                      fontSize: '12px',
                      color: theme.palette.text.secondary,
                      fontWeight: 400,
                      marginLeft: '4px'
                    }}>
                    {t('per month')}
                  </span>
                )}
              </Typography>
              {sourceInfo.name && (
                <Typography
                  sx={{
                    fontSize: '12px',
                    fontWeight: 500,
                    color: theme.palette.text.secondary
                  }}>
                  {sourceInfo.name}
                </Typography>
              )}
            </Box>

            {/* Address */}
            {(finalAddress || country) && (
              <Typography
                sx={{
                  fontSize: '13px',
                  color: theme.palette.text.grey12,
                  fontWeight: 400
                }}
                variant="body2">
                {finalAddress}{country ? `, ${capitalizeFirstLetter(country)}` : ''}
              </Typography>
            )}
          </Box>

          {/* Property Details */}
          <Box
            sx={{
              px: 2,
              py: 1.5,
              borderBottom: `1.5px solid ${theme.palette.border.blue}`
            }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography
                sx={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: theme.palette.primary.main
                }}>
                {t('Why is this a good fit for you?')}
              </Typography>
            </Box>
            <Typography
              sx={{
                fontSize: '12px',
                fontWeight: 600,
                color: theme.palette.text.grey12
              }}>
              {t('Match Score')}: {finalMatchScore !== null && finalMatchScore !== undefined ? 
                `${Math.round(finalMatchScore > 1 ? finalMatchScore : finalMatchScore * 100)}%` : 
                (ai_confidence !== null && ai_confidence !== undefined ? 
                  `${Math.round(ai_confidence > 1 ? ai_confidence : ai_confidence * 100)}%` : 'N/A')}
            </Typography>

            <Divider sx={{ mb: 1, mt: 1 }} />

            <Typography
              sx={{
                fontSize: '13px',
                color: '#374151',
                lineHeight: 1.4,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
              {finalAiExplanation || t(
                "Analyzing property match based on your preferences..."
              )}
            </Typography>
          </Box>

          {/* Enrichment Data */}
          {enrichmentData?.data && (
            <Box
              sx={{
                px: 2,
                py: 1.5,
                borderBottom: `1.5px solid ${theme.palette.border.blue}`,
                display: 'flex',
                flexDirection: 'column',
                gap: 1
              }}>
              {/* Travel Time */}
              {enrichmentData?.data?.work_travel && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <DirectionsCar sx={{ fontSize: 14, color: theme.palette.text.secondary }} />
                  <Typography sx={{ fontSize: '12px', color: theme.palette.text.secondary }}>
                    {Math.round(enrichmentData?.data?.work_travel?.duration_minutes || 0)} min to work
                  </Typography>
                </Box>
              )}
              
              {/* Tax Burden */}
              {enrichmentData?.data?.tax_burden?.annual_tax_euros && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Euro sx={{ fontSize: 14, color: theme.palette.text.secondary }} />
                  <Typography sx={{ fontSize: '12px', color: theme.palette.text.secondary }}>
                    Tax: €{enrichmentData.data.tax_burden.annual_tax_euros.toLocaleString()}/year
                  </Typography>
                </Box>
              )}
              
              {/* Nearby Amenities Summary */}
              {enrichmentData?.data?.amenities_within_1000m && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {Object.entries(enrichmentData?.data?.amenities_within_1000m || {}).slice(0, 2).map(([type, count]) => (
                    <Chip
                      key={type}
                      label={`${count} ${type}`}
                      size="small"
                      sx={{ 
                        fontSize: '10px', 
                        height: '18px',
                        '& .MuiChip-label': {
                          px: 1
                        }
                      }}
                    />
                  ))}
                </Box>
              )}
            </Box>
          )}

          {/* Amenities */}
          {amenities && amenities.length > 0 && (
            <Box
              sx={{
                px: 2,
                py: 1.5,
                display: 'flex',
                flexWrap: 'wrap',
                gap: 0.5
              }}>
              {amenities.slice(0, 3).map((amenity, index) => (
                <Typography
                  key={index}
                  sx={{
                    fontSize: '11px',
                    color: theme.palette.primary.main,
                    backgroundColor: theme.palette.background.skyBlue,
                    px: 1,
                    py: 0.5,
                    borderRadius: '4px',
                    fontWeight: 500
                  }}>
                  {amenity}
                </Typography>
              ))}
              {amenities.length > 3 && (
                <Typography
                  sx={{
                    fontSize: '11px',
                    color: theme.palette.text.secondary,
                    px: 1,
                    py: 0.5
                  }}>
                  +{amenities.length - 3} more
                </Typography>
              )}
            </Box>
          )}

          {/* Click to view details hint */}
          <Box
            sx={{
              px: 2,
              py: 1,
              backgroundColor: theme.palette.background.skyBlue,
              borderBottomLeftRadius: '10px',
              borderBottomRightRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '40px'
            }}>
            <Typography
              sx={{
                fontSize: '12px',
                color: theme.palette.primary.main,
                fontWeight: 500,
                textAlign: 'center',
                lineHeight: 1.2
              }}>
              {t('Click to view details')}
            </Typography>
          </Box>
        </CardContent>
      </Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          columnGap: '20px',
          padding: '8px 0',
          width: '100%',
          borderTop: `1px solid ${theme.palette.border.blue}`
        }}>
        <IconButton size="small" aria-label={t("filing.like")}>
          👍
        </IconButton>
        <IconButton onClick={handleClickDislike} size="small" aria-label={t("filing.dislike")}>
          👎
        </IconButton>
      </Box>
    </Card>
  );
};

export default GalleryCard;

GalleryCard.propTypes = {
  data: PropTypes.object.isRequired,
  onCardClick: PropTypes.func,
  onDetailsClick: PropTypes.func
};
