import React, { useState } from 'react';
import {
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Box,
  Typography,
  Button,
  IconButton,
  Chip,
  Grid,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Rating,
  Stack,
  Divider,
  LinearProgress,
  Alert,
  Collapse,
  Paper,
  ToggleButtonGroup,
  ToggleButton,
  Skeleton
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Share as ShareIcon,
  LocationOn as LocationIcon,
  Bed as BedIcon,
  Bathroom as BathroomIcon,
  SquareFoot as AreaIcon,
  AttachMoney as PriceIcon,
  CalendarToday as DateIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Info as InfoIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Message as MessageIcon,
  OpenInNew as OpenIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AutoAwesome as AIIcon,
  Wifi as WifiIcon,
  LocalParking as ParkingIcon,
  Pets as PetsIcon,
  FitnessCenter as GymIcon,
  Pool as PoolIcon,
  Elevator as ElevatorIcon,
  Balcony as BalconyIcon,
  School as SchoolIcon,
  LocalHospital as HospitalIcon,
  ShoppingCart as ShoppingIcon,
  DirectionsTransit as TransitIcon,
  VolumeUp as NoiseIcon,
  Air as AirQualityIcon,
  Schedule as CommuteIcon
} from '@mui/icons-material';
import PropTypes from 'prop-types';
import { submitPropertyFeedback } from '../../../../../api/feedbackAPI';
import { saveRecommendation, removeSavedRecommendation } from '../../../../../api/recommendationsV2';
import { toast } from 'react-toastify';

const AMENITY_ICONS = {
  wifi: WifiIcon,
  internet: WifiIcon,
  parking: ParkingIcon,
  pets: PetsIcon,
  pet_friendly: PetsIcon,
  gym: GymIcon,
  fitness: GymIcon,
  pool: PoolIcon,
  elevator: ElevatorIcon,
  lift: ElevatorIcon,
  balcony: BalconyIcon,
  terrace: BalconyIcon
};

const RecommendationCardEnhanced = ({
  recommendation,
  isEnriched = false,
  conversationId,
  conversationProfileId,
  onViewDetails,
  variant = 'default' // 'default', 'compact', 'detailed'
}) => {
  const [isSaved, setIsSaved] = useState(recommendation.isSaved || false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [quickFeedback, setQuickFeedback] = useState(null);
  const [feedbackForm, setFeedbackForm] = useState({
    rating: 0,
    matchScore: 0,
    comments: '',
    wouldVisit: null,
    reasons: []
  });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Parse property data
  const hasNestedProperty = recommendation.property && typeof recommendation.property === 'object';
  const propertyData = hasNestedProperty ? recommendation.property : recommendation;

  // Extract key data
  const title = propertyData.title || 'Property';
  const price = propertyData.price || 0;
  const currency = propertyData.currency || 'CHF';
  const address = propertyData.address || propertyData.location || 'Location not specified';
  const images = propertyData.images || [];
  const mainImage = images[0] || '/placeholder-property.jpg';
  const rooms = propertyData.rooms || propertyData.bedrooms;
  const bathrooms = propertyData.bathrooms;
  const area = propertyData.area || propertyData.living_space;
  const availabilityDate = propertyData.availability_date || propertyData.available_from;
  const propertyType = propertyData.property_type || propertyData.type;

  // AI Match Score and Explanation
  const aiConfidence = recommendation.ai_confidence || propertyData.ai_confidence || 0;
  const aiExplanation = recommendation.ai_explanation || propertyData.ai_explanation || '';
  const matchPercentage = Math.round(aiConfidence * 100);

  // Enriched metadata
  const amenities = propertyData.amenities || [];
  const airQuality = propertyData.air_quality;
  const noiseLevel = propertyData.noise_level;
  const commuteTime = propertyData.commute_times?.public_transport;
  const nearbySchools = propertyData.nearby_schools;
  const nearbyHospitals = propertyData.nearby_hospitals;
  const nearbyShopping = propertyData.nearby_shopping;
  const transitStop = propertyData.transit_stop;
  const parking = propertyData.parking;
  const petFriendly = propertyData.pet_friendly;
  const internetSpeed = propertyData.internet_speed;

  const handleSaveToggle = async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      const propertyId = isEnriched ? recommendation.property.id : recommendation.id;

      if (isSaved) {
        await removeSavedRecommendation(propertyId, conversationId, conversationProfileId);
        setIsSaved(false);
        toast.success('Removed from saved properties');
      } else {
        await saveRecommendation(propertyId, conversationId, conversationProfileId);
        setIsSaved(true);
        toast.success('Property saved successfully');
      }
    } catch (error) {
      console.error('Error toggling save status:', error);
      toast.error('Failed to save property');
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickFeedback = async (type) => {
    setQuickFeedback(type);

    // Submit quick feedback
    try {
      await submitPropertyFeedback({
        propertyId: propertyData.id,
        conversationId,
        feedbackType: type,
        quickFeedback: true
      });
      toast.success(`Thank you for your feedback!`);
    } catch (error) {
      console.error('Failed to submit quick feedback:', error);
    }
  };

  const handleDetailedFeedback = async () => {
    try {
      await submitPropertyFeedback({
        propertyId: propertyData.id,
        conversationId,
        ...feedbackForm,
        quickFeedback: false
      });
      toast.success('Detailed feedback submitted successfully');
      setFeedbackDialogOpen(false);
      setFeedbackForm({
        rating: 0,
        matchScore: 0,
        comments: '',
        wouldVisit: null,
        reasons: []
      });
    } catch (error) {
      console.error('Failed to submit detailed feedback:', error);
      toast.error('Failed to submit feedback');
    }
  };

  const getMatchColor = () => {
    if (matchPercentage >= 80) return 'success';
    if (matchPercentage >= 60) return 'warning';
    return 'error';
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (date) => {
    if (!date) return 'Available now';
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Render compact variant for list views
  if (variant === 'compact') {
    return (
      <Card
        sx={{
          display: 'flex',
          mb: 2,
          position: 'relative',
          '&:hover': {
            boxShadow: 4,
            transform: 'translateY(-2px)',
            transition: 'all 0.3s ease'
          }
        }}
      >
        <CardMedia
          component="img"
          sx={{ width: 200, height: 150 }}
          image={mainImage}
          alt={title}
        />

        <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <CardContent sx={{ pb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="h6" noWrap sx={{ maxWidth: '70%' }}>
                {title}
              </Typography>
              <Chip
                label={`${matchPercentage}% Match`}
                color={getMatchColor()}
                size="small"
              />
            </Box>

            <Typography variant="body2" color="text.secondary" gutterBottom>
              <LocationIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
              {address}
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
              <Typography variant="h5" color="primary.main" fontWeight="bold">
                {formatPrice(price)}
              </Typography>
              {rooms && (
                <Chip icon={<BedIcon />} label={`${rooms} Rooms`} size="small" />
              )}
              {area && (
                <Chip icon={<AreaIcon />} label={`${area} m²`} size="small" />
              )}
            </Box>
          </CardContent>

          <CardActions sx={{ pt: 0 }}>
            <IconButton size="small" onClick={handleSaveToggle} disabled={isSaving}>
              {isSaved ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
            </IconButton>
            <Button size="small" onClick={onViewDetails}>View Details</Button>
            <Button
              size="small"
              color={quickFeedback === 'positive' ? 'success' : 'default'}
              onClick={() => handleQuickFeedback('positive')}
            >
              <ThumbUpIcon sx={{ fontSize: 18 }} />
            </Button>
            <Button
              size="small"
              color={quickFeedback === 'negative' ? 'error' : 'default'}
              onClick={() => handleQuickFeedback('negative')}
            >
              <ThumbDownIcon sx={{ fontSize: 18 }} />
            </Button>
          </CardActions>
        </Box>
      </Card>
    );
  }

  // Default card variant
  return (
    <>
      <Card
        sx={{
          position: 'relative',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          '&:hover': {
            boxShadow: 4,
            transform: 'translateY(-4px)',
            transition: 'all 0.3s ease'
          }
        }}
      >
        {/* Match Score Badge */}
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 1
          }}
        >
          <Paper
            elevation={3}
            sx={{
              px: 2,
              py: 1,
              borderRadius: 2,
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AIIcon sx={{ color: getMatchColor() + '.main' }} />
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  AI Match
                </Typography>
                <Typography variant="h6" color={getMatchColor() + '.main'} fontWeight="bold">
                  {matchPercentage}%
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>

        {/* Save Button */}
        <IconButton
          sx={{
            position: 'absolute',
            top: 12,
            left: 12,
            zIndex: 1,
            bgcolor: 'rgba(255,255,255,0.9)',
            '&:hover': { bgcolor: 'rgba(255,255,255,1)' }
          }}
          onClick={handleSaveToggle}
          disabled={isSaving}
        >
          {isSaved ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
        </IconButton>

        {/* Image Section */}
        <Box sx={{ position: 'relative', paddingTop: '60%' }}>
          {!imageLoaded && !imageError && (
            <Skeleton
              variant="rectangular"
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%'
              }}
            />
          )}
          <CardMedia
            component="img"
            image={mainImage}
            alt={title}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: imageError ? 'none' : 'block'
            }}
          />
          {imageError && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                bgcolor: 'grey.200',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Typography color="text.secondary">No image available</Typography>
            </Box>
          )}

          {/* Image count badge */}
          {images.length > 1 && (
            <Chip
              label={`${images.length} photos`}
              size="small"
              sx={{
                position: 'absolute',
                bottom: 8,
                right: 8,
                bgcolor: 'rgba(0,0,0,0.7)',
                color: 'white'
              }}
            />
          )}
        </Box>

        <CardContent sx={{ flex: 1 }}>
          {/* Title and Price */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom noWrap>
              {title}
            </Typography>
            <Typography variant="h4" color="primary.main" fontWeight="bold">
              {formatPrice(price)}
              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                /month
              </Typography>
            </Typography>
          </Box>

          {/* Location */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <LocationIcon sx={{ color: 'text.secondary', mr: 1 }} />
            <Typography variant="body2" color="text.secondary" noWrap>
              {address}
            </Typography>
          </Box>

          {/* Key Features */}
          <Grid container spacing={1} sx={{ mb: 2 }}>
            {rooms && (
              <Grid item xs={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <BedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="body2">{rooms} Rooms</Typography>
                </Box>
              </Grid>
            )}
            {bathrooms && (
              <Grid item xs={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <BathroomIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="body2">{bathrooms} Bath</Typography>
                </Box>
              </Grid>
            )}
            {area && (
              <Grid item xs={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <AreaIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="body2">{area} m²</Typography>
                </Box>
              </Grid>
            )}
          </Grid>

          {/* Availability */}
          {availabilityDate && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <DateIcon sx={{ fontSize: 18, color: 'text.secondary', mr: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Available from {formatDate(availabilityDate)}
              </Typography>
            </Box>
          )}

          {/* AI Explanation Preview */}
          {aiExplanation && (
            <Alert
              severity="info"
              icon={<AIIcon />}
              sx={{ mb: 2 }}
              action={
                <IconButton
                  size="small"
                  onClick={() => setShowDetails(!showDetails)}
                >
                  {showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              }
            >
              <Typography variant="body2" noWrap={!showDetails}>
                {aiExplanation}
              </Typography>
            </Alert>
          )}

          {/* Enriched Metadata Tags */}
          {isEnriched && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
              {commuteTime && (
                <Chip
                  icon={<CommuteIcon />}
                  label={`${commuteTime} min commute`}
                  size="small"
                  variant="outlined"
                />
              )}
              {airQuality && (
                <Chip
                  icon={<AirQualityIcon />}
                  label={`Air: ${airQuality}`}
                  size="small"
                  variant="outlined"
                  color={airQuality === 'Good' ? 'success' : 'warning'}
                />
              )}
              {noiseLevel && (
                <Chip
                  icon={<NoiseIcon />}
                  label={`Noise: ${noiseLevel}`}
                  size="small"
                  variant="outlined"
                  color={noiseLevel === 'Quiet' ? 'success' : 'warning'}
                />
              )}
              {petFriendly && (
                <Chip
                  icon={<PetsIcon />}
                  label="Pet Friendly"
                  size="small"
                  color="success"
                  variant="outlined"
                />
              )}
            </Box>
          )}

          {/* Expandable Details */}
          <Collapse in={showDetails}>
            <Divider sx={{ my: 2 }} />

            {/* Amenities */}
            {amenities.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Amenities
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {amenities.slice(0, 6).map((amenity, index) => {
                    const IconComponent = AMENITY_ICONS[amenity.toLowerCase()] || HomeIcon;
                    return (
                      <Chip
                        key={index}
                        icon={<IconComponent />}
                        label={amenity}
                        size="small"
                        variant="outlined"
                      />
                    );
                  })}
                  {amenities.length > 6 && (
                    <Chip
                      label={`+${amenities.length - 6} more`}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>
              </Box>
            )}

            {/* Nearby Facilities */}
            {(nearbySchools || nearbyHospitals || nearbyShopping || transitStop) && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Nearby Facilities
                </Typography>
                <Grid container spacing={1}>
                  {nearbySchools && (
                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <SchoolIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="caption">Schools: {nearbySchools}</Typography>
                      </Box>
                    </Grid>
                  )}
                  {nearbyHospitals && (
                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <HospitalIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="caption">Hospital: {nearbyHospitals}</Typography>
                      </Box>
                    </Grid>
                  )}
                  {nearbyShopping && (
                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <ShoppingIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="caption">Shopping: {nearbyShopping}</Typography>
                      </Box>
                    </Grid>
                  )}
                  {transitStop && (
                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <TransitIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="caption">Transit: {transitStop}</Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Box>
            )}
          </Collapse>
        </CardContent>

        {/* Actions */}
        <CardActions sx={{ p: 2, pt: 0 }}>
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="contained"
                onClick={onViewDetails}
                startIcon={<OpenIcon />}
              >
                View Details
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => setFeedbackDialogOpen(true)}
                startIcon={<MessageIcon />}
              >
                Feedback
              </Button>
            </Grid>

            {/* Quick Feedback Buttons */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                  Quick feedback:
                </Typography>
                <IconButton
                  size="small"
                  color={quickFeedback === 'positive' ? 'success' : 'default'}
                  onClick={() => handleQuickFeedback('positive')}
                >
                  <ThumbUpIcon />
                </IconButton>
                <IconButton
                  size="small"
                  color={quickFeedback === 'negative' ? 'error' : 'default'}
                  onClick={() => handleQuickFeedback('negative')}
                >
                  <ThumbDownIcon />
                </IconButton>
                <IconButton size="small">
                  <ShareIcon />
                </IconButton>
              </Box>
            </Grid>
          </Grid>
        </CardActions>
      </Card>

      {/* Feedback Dialog */}
      <Dialog
        open={feedbackDialogOpen}
        onClose={() => setFeedbackDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">Provide Feedback for {title}</Typography>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            {/* Overall Rating */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Overall Rating
              </Typography>
              <Rating
                value={feedbackForm.rating}
                onChange={(e, value) => setFeedbackForm(prev => ({ ...prev, rating: value }))}
                size="large"
              />
            </Box>

            {/* Match Score */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                How well does this match your requirements? ({feedbackForm.matchScore}%)
              </Typography>
              <LinearProgress
                variant="determinate"
                value={feedbackForm.matchScore}
                sx={{ height: 10, borderRadius: 5 }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Button
                  size="small"
                  onClick={() => setFeedbackForm(prev => ({ ...prev, matchScore: 0 }))}
                >
                  Poor Match
                </Button>
                <Button
                  size="small"
                  onClick={() => setFeedbackForm(prev => ({ ...prev, matchScore: 50 }))}
                >
                  Average
                </Button>
                <Button
                  size="small"
                  onClick={() => setFeedbackForm(prev => ({ ...prev, matchScore: 100 }))}
                >
                  Perfect Match
                </Button>
              </Box>
            </Box>

            {/* Would Visit */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Would you like to visit this property?
              </Typography>
              <ToggleButtonGroup
                value={feedbackForm.wouldVisit}
                exclusive
                onChange={(e, value) => setFeedbackForm(prev => ({ ...prev, wouldVisit: value }))}
                fullWidth
              >
                <ToggleButton value="yes">Yes, definitely</ToggleButton>
                <ToggleButton value="maybe">Maybe</ToggleButton>
                <ToggleButton value="no">No</ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {/* Reasons */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                What do you like/dislike? (Select all that apply)
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {[
                  'Price', 'Location', 'Size', 'Amenities',
                  'Condition', 'Availability', 'Commute', 'Neighborhood'
                ].map(reason => (
                  <Chip
                    key={reason}
                    label={reason}
                    onClick={() => {
                      setFeedbackForm(prev => ({
                        ...prev,
                        reasons: prev.reasons.includes(reason)
                          ? prev.reasons.filter(r => r !== reason)
                          : [...prev.reasons, reason]
                      }));
                    }}
                    color={feedbackForm.reasons.includes(reason) ? 'primary' : 'default'}
                    variant={feedbackForm.reasons.includes(reason) ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
            </Box>

            {/* Comments */}
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Additional Comments"
              value={feedbackForm.comments}
              onChange={(e) => setFeedbackForm(prev => ({ ...prev, comments: e.target.value }))}
              placeholder="Tell us more about what you think..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFeedbackDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleDetailedFeedback}
            disabled={feedbackForm.rating === 0 && feedbackForm.matchScore === 0 && !feedbackForm.comments}
          >
            Submit Feedback
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

RecommendationCardEnhanced.propTypes = {
  recommendation: PropTypes.object.isRequired,
  isEnriched: PropTypes.bool,
  conversationId: PropTypes.number,
  conversationProfileId: PropTypes.number,
  onViewDetails: PropTypes.func,
  variant: PropTypes.oneOf(['default', 'compact', 'detailed'])
};

export default RecommendationCardEnhanced;