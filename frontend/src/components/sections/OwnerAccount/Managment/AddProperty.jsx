import React, { useEffect, useState } from 'react';
import { Modal, Box, Typography, Grid, Paper, Chip, IconButton, Button, Divider, Stack, Alert } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import GroupIcon from '@mui/icons-material/Group';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import EditIcon from '@mui/icons-material/Edit';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import HomeIcon from '@mui/icons-material/Home';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useDispatch, useSelector } from 'react-redux';
import { getPropertyImages } from '../../../../store/slices/propertiesSlice';
import { numberFormatter } from '../../../../utils';
import { getCurrencySymbol } from '../../../../constants/currencyMapping';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

// Mock data removed - now using real property images from API

const PropertyDetailsModal = ({ open, handleClose, property, onEdit }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const propertyImages = useSelector((state) => state.properties.propertyImages);
  const [images, setImages] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [viewingSlots, setViewingSlots] = useState([]);

  useEffect(() => {
    if (property && open) {
      // Try to fetch additional images, but don't worry if it fails
      dispatch(getPropertyImages(property.id)).catch(() => {
        // Silently handle error - we'll use primary_image_urls as fallback
        console.log('Could not fetch additional images, using primary images only');
      });
    }
  }, [dispatch, property, open]);

  useEffect(() => {
    if (propertyImages.data && propertyImages.data.length > 0 && images.length === 0) {
      const newImages = propertyImages.data.map((item) => item.image_url);
      setImages(newImages);
    }
  }, [propertyImages, images]);

  // Reset selected index when property changes
  useEffect(() => {
    setSelectedImageIndex(0);
  }, [property?.id]);

  // Fetch viewing slots when property changes
  useEffect(() => {
    if (property?.id && open) {
      // Get token from localStorage directly to avoid circular dependency
      const userStr = localStorage.getItem('user');
      let token = null;
      try {
        const user = userStr ? JSON.parse(userStr) : null;
        token = user?.access_token;
      } catch (e) {
        console.error('Error parsing user from localStorage');
      }

      if (!token) {
        console.warn('No auth token available for fetching viewing slots');
        return;
      }

      fetch(`/api/tenant-selection/${property.id}/viewing-slots`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
        .then(response => response.json())
        .then(data => {
          const slotsArray = Array.isArray(data) ? data : (data?.slots || []);
          setViewingSlots(slotsArray);
        })
        .catch(error => {
          console.error('Error fetching viewing slots:', error);
          setViewingSlots([]);
        });
    }
  }, [property?.id, open]);

  if (!property) return null;

  // Combine all available images from different sources
  const primaryImages = property.primary_image_urls || [];
  const additionalImages = property.image_urls || [];
  const fetchedImages = images || [];
  
  // Merge all image sources and remove duplicates
  const allImages = [
    ...primaryImages,
    ...additionalImages,
    ...fetchedImages
  ].filter((img, index, self) => {
    return img && self.indexOf(img) === index;
  });
  
  // If still no images, check for single image properties
  if (allImages.length === 0 && property.image_url) {
    allImages.push(property.image_url);
  }
  if (allImages.length === 0 && property.primary_image_url) {
    allImages.push(property.primary_image_url);
  }
  
  const selectedImage = allImages[selectedImageIndex] || '';

  return (
    <Modal open={open} onClose={handleClose} aria-labelledby="property-details-modal">
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '95%',
          maxWidth: 1400,
          height: '90vh',
          bgcolor: 'background.paper',
          borderRadius: 3,
          boxShadow: 24,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
        {/* Header */}
        <Box sx={{
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          px: 4,
          py: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
            {property?.title || t('Property Details')}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => {
                handleClose();
                if (onEdit) {
                  onEdit(property);
                }
              }}
            >
              {t('Edit')}
            </Button>
            <Button
              variant="contained"
              startIcon={<GroupIcon />}
              onClick={() => {
                handleClose();
                navigate(`/owner-account?section=tenant-applications&property=${property?.id}`);
              }}
            >
              {t('View Tenants')}
            </Button>
            <Button
              variant="contained"
              startIcon={<AutoAwesomeIcon />}
              sx={{ bgcolor: '#AA99EC', '&:hover': { bgcolor: '#9988DB' } }}
              onClick={() => {
                handleClose();
                navigate(`/owner-account?section=analytics&property=${property?.id}`);
              }}
            >
              {t('AI Analysis')}
            </Button>
            <IconButton
              aria-label="close"
              onClick={handleClose}
              sx={{ ml: 2 }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Main Content Area */}
        <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Left Column - Images */}
          <Box sx={{ width: '55%', display: 'flex', flexDirection: 'column', borderRight: '1px solid', borderColor: 'divider' }}>
            {/* Main Selected Image */}
            <Box sx={{
              flex: 1,
              position: 'relative',
              overflow: 'hidden',
              bgcolor: '#E0E7FD',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {allImages.length > 0 ? (
                <img
                  src={selectedImage}
                  alt={`${property?.title || 'Property'} - Image ${selectedImageIndex + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain'
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
                  <Typography variant="h6">{t('No images available')}</Typography>
                </Box>
              )}
              {property?.status && allImages.length > 0 && (
                <Chip
                  label={(() => {
                    const status = property.status?.toLowerCase();
                    if (status === 'selection_in_progress' || status === 'ad_active' || status === 'active') return t('Active');
                    if (status === 'available' || status === 'non_active' || status === 'inactive') return t('Non-active');
                    if (status === 'maintenance') return t('Maintenance');
                    if (status === 'rented') return t('Rented/Sold');
                    return t(property.status);
                  })()}
                  color={(() => {
                    const status = property.status?.toLowerCase();
                    if (status === 'selection_in_progress' || status === 'ad_active' || status === 'active') return 'success';
                    if (status === 'maintenance') return 'warning';
                    if (status === 'rented') return 'info';
                    return 'default';
                  })()}
                  size="medium"
                  sx={{
                    position: 'absolute',
                    top: 24,
                    left: 24,
                    fontWeight: 'bold',
                    fontSize: '0.95rem'
                  }}
                />
              )}
              {allImages.length > 1 && (
                <Chip
                  label={`${selectedImageIndex + 1} / ${allImages.length}`}
                  size="medium"
                  sx={{
                    position: 'absolute',
                    bottom: 24,
                    right: 24,
                    bgcolor: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                />
              )}
            </Box>

            {/* Thumbnail Gallery */}
            {allImages.length > 1 && (
              <Box sx={{
                height: 120,
                display: 'flex',
                gap: 1.5,
                p: 2,
                overflowX: 'auto',
                bgcolor: '#F8F9FA',
                borderTop: '1px solid',
                borderColor: 'divider',
                '&::-webkit-scrollbar': {
                  height: 8,
                },
                '&::-webkit-scrollbar-track': {
                  bgcolor: '#E0E7FD',
                  borderRadius: 4,
                },
                '&::-webkit-scrollbar-thumb': {
                  bgcolor: '#8DA4EF',
                  borderRadius: 4,
                  '&:hover': {
                    bgcolor: '#3E63DD',
                  }
                }
              }}>
                {allImages.map((img, index) => (
                  <Box
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    sx={{
                      minWidth: 100,
                      height: 100,
                      borderRadius: 2,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: selectedImageIndex === index ? '3px solid' : '2px solid',
                      borderColor: selectedImageIndex === index ? 'primary.main' : 'grey.300',
                      transition: 'all 0.2s',
                      '&:hover': {
                        transform: 'scale(1.05)',
                        borderColor: 'primary.main'
                      }
                    }}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${index + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </Box>
                ))}
              </Box>
            )}
          </Box>

          {/* Right Column - Details */}
          <Box sx={{ width: '45%', p: 4, overflow: 'auto' }}>
            {/* Price */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h2" sx={{ color: 'primary.main', fontWeight: 700, fontSize: '2.5rem', display: 'flex', alignItems: 'baseline' }}>
                {(() => {
                  const price = property?.price_chf || property?.price;
                  // Ensure we have a valid price, format it, or show a default
                  const formattedPrice = price ? numberFormatter(price) : '0';
                  return formattedPrice || '0';
                })()}
                <Typography component="span" sx={{ fontSize: '2rem', ml: 0.5, fontWeight: 600 }}>
                  {getCurrencySymbol(property?.currency || 'CHF')}
                </Typography>
                <Typography component="span" variant="h5" sx={{ ml: 1.5, color: 'text.secondary', fontWeight: 400, fontSize: '1.2rem' }}>
                  {property?.deal_type === 'buy' || property?.deal_type === 'sale' ? '' : t('per month')}
                </Typography>
              </Typography>
            </Box>

            {/* Property Info Grid - Removed Bathrooms and Year Built */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={6}>
                <Paper elevation={0} sx={{ p: 2, bgcolor: '#F8F9FA', borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {t('Bedrooms')}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {property?.bedrooms || '-'}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper elevation={0} sx={{ p: 2, bgcolor: '#F8F9FA', borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {t('Square Meters')}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {property?.square_meters || '-'} m²
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* Description */}
            <Paper elevation={0} sx={{
              p: 3,
              bgcolor: '#E0E7FD',
              borderRadius: 2,
              mb: 3,
              border: '1px solid #AEC2FF',
              minHeight: '200px',
              maxHeight: '400px',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'text.primary', flexShrink: 0 }}>
                {t('Description')}
              </Typography>
              <Box sx={{
                overflowY: 'auto',
                flex: 1,
                minHeight: '150px',
                pr: 1,
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  bgcolor: '#C8D3FF',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                  bgcolor: '#8DA4EF',
                  borderRadius: '4px',
                  '&:hover': {
                    bgcolor: '#7490E3',
                  }
                }
              }}>
                <Typography
                  variant="body1"
                  sx={{
                    lineHeight: 1.8,
                    color: 'text.secondary',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}
                >
                  {property?.description || t('No description available for this property.')}
                </Typography>
              </Box>
            </Paper>

            {/* Location */}
            <Paper elevation={0} sx={{ p: 3, bgcolor: '#F8F9FA', borderRadius: 2, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LocationOnIcon sx={{ color: 'primary.main', mr: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {t('Location')}
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 500, mb: 0.5 }}>
                {[property?.city, property?.state].filter(Boolean).join(', ') || 'Switzerland'}
              </Typography>
              {property?.zip_code && (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {t('ZIP Code')}: {property.zip_code}
                </Typography>
              )}
            </Paper>

            {/* Viewing Slots */}
            {viewingSlots && viewingSlots.length > 0 && (
              <Paper elevation={0} sx={{ p: 3, bgcolor: '#F0F7FF', borderRadius: 2, mb: 3, border: '1px solid #B8D4FF' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CalendarTodayIcon sx={{ color: 'primary.main', mr: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {t('Viewing Time Slots')}
                  </Typography>
                </Box>
                <Stack spacing={1.5}>
                  {viewingSlots.map((slot, index) => {
                    // Parse slot date and time
                    let slotDate = '';
                    let slotTime = '';
                    let slotEndTime = '';

                    if (slot.slot_datetime) {
                      const dateObj = new Date(slot.slot_datetime);
                      slotDate = dateObj.toLocaleDateString();
                      slotTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      if (slot.duration_minutes) {
                        const endDate = new Date(dateObj.getTime() + slot.duration_minutes * 60000);
                        slotEndTime = endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      }
                    } else if (slot.date && slot.time) {
                      slotDate = new Date(slot.date).toLocaleDateString();
                      slotTime = slot.time;
                      slotEndTime = slot.endTime || '';
                    }

                    return (
                      <Box key={index} sx={{
                        display: 'flex',
                        alignItems: 'center',
                        p: 1.5,
                        bgcolor: 'white',
                        borderRadius: 1,
                        border: '1px solid #E0E7FD'
                      }}>
                        <AccessTimeIcon sx={{ color: 'text.secondary', mr: 2, fontSize: 20 }} />
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {slotDate}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {slotTime} {slotEndTime && `- ${slotEndTime}`}
                            {slot.max_viewers && ` (${t('Max')} ${slot.max_viewers} ${t('viewers')})`}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Stack>
              </Paper>
            )}

            {/* Property Type & Additional Info */}
            <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
              {property?.deal_type && (
                <Chip
                  icon={<HomeIcon />}
                  label={property.deal_type === 'rent' ? t('For Rent') : t('For Sale')}
                  color={property.deal_type === 'rent' ? 'primary' : 'error'}
                  size="large"
                  sx={{ fontWeight: 'bold' }}
                />
              )}
            </Stack>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
};

export default PropertyDetailsModal;
