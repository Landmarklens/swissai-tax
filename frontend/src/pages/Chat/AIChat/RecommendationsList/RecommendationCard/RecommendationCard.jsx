import PropTypes from 'prop-types';
import GalleryCard from '../../../../../components/galleryCard/GalleryCard';
import { PropertyFeedbackModal } from '../../../../../components/modals/PropertyFeedbackModal';
import { Box, IconButton, Tooltip, Button, Chip } from '@mui/material';
import { useState } from 'react';
import { submitPropertyFeedback } from '../../../../../api/feedbackAPI';
import { toast } from 'react-toastify';
import { 
  Bookmark, 
  BookmarkBorder, 
  BedOutlined,
  BathroomOutlined,
  SquareFootOutlined,
  LocationOnOutlined,
  AutoAwesomeOutlined,
  PhotoCameraOutlined,
  CalendarTodayOutlined,
  AirOutlined,
  VolumeUpOutlined,
  DirectionsCarOutlined,
  SchoolOutlined,
  LocalHospitalOutlined,
  ShoppingCartOutlined,
  DirectionsTransitOutlined,
  WifiOutlined,
  LocalLaundryServiceOutlined,
  ElevatorOutlined,
  BalconyOutlined,
  PetsOutlined,
  AttachMoneyOutlined,
  LocalParkingOutlined,
  OpenInNewOutlined
} from '@mui/icons-material';
import { saveRecommendation, removeSavedRecommendation } from '../../../../../api/recommendationsV2';
import './RecommendationCard.scss';

const RecommendationCard = ({ recommendation, isEnriched = false, conversationId, conversationProfileId }) => {
  const [expandedView, setExpandedView] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(recommendation.isSaved || false);
  const [isSaving, setIsSaving] = useState(false);

  const handleToggleView = () => {
    setExpandedView(!expandedView);
  };

  const handleFeedbackClick = (recommendation) => {
    setFeedbackModalOpen(true);
  };

  const handleViewOnSource = () => {
    // This will be called after galleryCardData is defined
    // We'll move this logic inline in the button onClick
  };

  const handleCloseFeedback = () => {
    setFeedbackModalOpen(false);
  };

  const handleSubmitFeedback = async (feedbackData) => {
    try {
      // Add conversation ID if available
      const submissionData = {
        ...feedbackData,
        conversationId: conversationId
      };
      
      await submitPropertyFeedback(submissionData);
      toast.success('Thank you for your feedback!');
      setFeedbackModalOpen(false);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      toast.error('Failed to submit feedback. Please try again.');
    }
  };

  const handleSaveToggle = async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      const propertyId = isEnriched ? recommendation.property.id : recommendation.id;
      
      if (isSaved) {
        await removeSavedRecommendation(propertyId, conversationId, conversationProfileId);
        setIsSaved(false);
      } else {
        await saveRecommendation(propertyId, conversationId, conversationProfileId);
        setIsSaved(true);
      }
    } catch (error) {
      console.error('Error toggling save status:', error);
      // Optionally show error message to user
    } finally {
      setIsSaving(false);
    }
  };

  // Handle both enriched and legacy formats
  // Check if recommendation has a nested property object
  const hasNestedProperty = recommendation.property && typeof recommendation.property === 'object';
  const propertyData = hasNestedProperty ? recommendation.property : recommendation;
  const enrichmentData = recommendation.enrichment || null;
  const enrichmentScores = recommendation.enrichment_scores || propertyData?.enrichment_scores || {};
  
  // EXTENSIVE LOGGING FOR DEBUGGING METADATA
  console.log('[RecommendationCard] 🔍 === RAW RECOMMENDATION DATA ===', {
    fullRecommendation: recommendation,
    hasNestedProperty,
    propertyData,
    enrichmentData,
    enrichmentScores,
    hasAiConfidence: recommendation.ai_confidence !== undefined,
    aiConfidenceValue: recommendation.ai_confidence,
    hasAiExplanation: !!recommendation.ai_explanation,
    aiExplanationValue: recommendation.ai_explanation,
    propertyDataKeys: propertyData ? Object.keys(propertyData) : [],
    enrichmentKeys: enrichmentData ? Object.keys(enrichmentData) : [],
    timestamp: new Date().toISOString()
  });
  
  // Log metadata extraction
  console.log('[RecommendationCard] 🌍 === METADATA EXTRACTION ===', {
    enrichment_scores: enrichmentScores,
    enrichment_metadata: recommendation.enrichment_metadata || propertyData?.enrichment_metadata,
    missing_fields: recommendation.missing_enrichment_fields || propertyData?.missing_enrichment_fields,
    // Environmental data
    air_quality: propertyData.air_quality || enrichmentData?.data?.air_quality,
    noise_level: propertyData.noise_level || enrichmentData?.data?.noise_level,
    // Commute times
    commute_times: propertyData.commute_times || enrichmentData?.data?.commute_times,
    // Nearby facilities
    nearby_schools: propertyData.nearby_schools || enrichmentData?.data?.nearby_schools,
    nearby_hospitals: propertyData.nearby_hospitals || enrichmentData?.data?.nearby_hospitals,
    nearby_shopping: propertyData.nearby_shopping || enrichmentData?.data?.nearby_shopping,
    transit_stop: propertyData.transit_stop || enrichmentData?.data?.transit_stop,
    // Amenities
    amenities: propertyData.amenities || enrichmentData?.data?.amenities,
    // Taxes
    taxes: propertyData.taxes || enrichmentData?.data?.taxes,
    parking: propertyData.parking || enrichmentData?.data?.parking,
    timestamp: new Date().toISOString()
  });
  
  // Prepare data for GalleryCard with match score and AI explanation
  // AI fields can be at recommendation level or property level
  const aiConfidence = recommendation.ai_confidence || 
                      propertyData?.ai_confidence || 
                      recommendation.confidence ||
                      propertyData?.confidence;
  
  const aiExplanation = recommendation.ai_explanation || 
                       propertyData?.ai_explanation || 
                       recommendation.explanation ||
                       propertyData?.explanation;
  
  // Extract the actual property data fields
  const galleryCardData = {
    // Spread the property data
    ...propertyData,
    // Ensure we have the correct fields from the property object
    title: propertyData.title || propertyData.property_title || recommendation.title,
    price: propertyData.price || propertyData.property_price || recommendation.price,
    currency: propertyData.currency || propertyData.property_currency || recommendation.currency || 'CHF',
    address: propertyData.address || propertyData.property_address || recommendation.address,
    images: propertyData.images || propertyData.property_images || recommendation.images || [],
    rooms: propertyData.rooms || propertyData.property_rooms || recommendation.rooms,
    bathrooms: propertyData.bathrooms || propertyData.property_bathrooms || recommendation.bathrooms,
    area: propertyData.area || propertyData.property_area || propertyData.living_space || recommendation.area,
    floor: propertyData.floor || propertyData.property_floor || recommendation.floor,
    availability_date: propertyData.availability_date || propertyData.available_from || recommendation.availability_date,
    property_type: propertyData.property_type || propertyData.type || recommendation.property_type,
    utilities: propertyData.utilities || propertyData.utilities_included || recommendation.utilities,
    is_available: propertyData.is_available !== undefined ? propertyData.is_available : true,
    // Metadata from enrichment - check multiple possible locations
    air_quality: propertyData.air_quality || enrichmentData?.data?.air_quality || enrichmentData?.metadata?.air_quality || 'Good',
    noise_level: propertyData.noise_level || enrichmentData?.data?.noise_level || enrichmentData?.metadata?.noise_level || 'Moderate',
    commute_times: propertyData.commute_times || enrichmentData?.data?.commute_times || enrichmentData?.metadata?.commute_times || { public_transport: '10-15' },
    nearby_schools: propertyData.nearby_schools || enrichmentData?.data?.nearby_schools || enrichmentData?.metadata?.nearby_schools || 'Within 1km',
    nearby_hospitals: propertyData.nearby_hospitals || enrichmentData?.data?.nearby_hospitals || enrichmentData?.metadata?.nearby_hospitals || '< 2km',
    nearby_shopping: propertyData.nearby_shopping || enrichmentData?.data?.nearby_shopping || enrichmentData?.metadata?.nearby_shopping || '500m',
    transit_stop: propertyData.transit_stop || enrichmentData?.data?.transit_stop || enrichmentData?.metadata?.transit_stop || '< 300m',
    amenities: propertyData.amenities || enrichmentData?.data?.amenities || enrichmentData?.metadata?.amenities || [],
    taxes: propertyData.taxes || enrichmentData?.data?.taxes || enrichmentData?.metadata?.taxes,
    parking: propertyData.parking || enrichmentData?.data?.parking || enrichmentData?.metadata?.parking,
    // More metadata fields
    amenities: propertyData.amenities || recommendation.amenities || [],
    air_quality: propertyData.air_quality || recommendation.air_quality,
    noise_level: propertyData.noise_level || recommendation.noise_level,
    taxes: propertyData.taxes || recommendation.taxes,
    transportation: propertyData.transportation || recommendation.transportation || {},
    nearby_schools: propertyData.nearby_schools || recommendation.nearby_schools,
    nearby_hospitals: propertyData.nearby_hospitals || recommendation.nearby_hospitals,
    nearby_shopping: propertyData.nearby_shopping || recommendation.nearby_shopping,
    parking: propertyData.parking || recommendation.parking,
    internet_speed: propertyData.internet_speed || recommendation.internet_speed,
    pet_friendly: propertyData.pet_friendly || recommendation.pet_friendly,
    furnished: propertyData.furnished || recommendation.furnished,
    balcony: propertyData.balcony || recommendation.balcony,
    elevator: propertyData.elevator || recommendation.elevator,
    laundry: propertyData.laundry || recommendation.laundry,
    commute_times: propertyData.commute_times || recommendation.commute_times || {},
    external_url: propertyData.external_url || propertyData.property_url || recommendation.external_url,
    external_source: propertyData.external_source || propertyData.platform || recommendation.external_source,
    // Ensure AI fields are properly passed through
    ai_confidence: aiConfidence,
    ai_explanation: aiExplanation,
    // Also pass as alternative field names for backwards compatibility
    matchScore: aiConfidence,
    aiExplanation: aiExplanation,
    enrichmentData: enrichmentData || {
      data: recommendation.enrichment_scores || propertyData?.enrichment_scores || null,
      metadata: recommendation.enrichment_metadata || propertyData?.enrichment_metadata || null
    }
  };

  // Get match score class
  const getMatchScoreClass = (score) => {
    if (score >= 80) return 'high-match';
    if (score >= 60) return 'medium-match';
    return 'low-match';
  };

  // Format price
  const formatPrice = (price) => {
    if (!price) return 'Price on request';
    return new Intl.NumberFormat('de-CH').format(price);
  };

  return (
    <>
      <div className="recommendation-card">
        {/* Card Header with Match Score */}
        <div className="card-header">
          <div className="match-score">
            <div className={`score-badge ${getMatchScoreClass(aiConfidence)}`}>
              <AutoAwesomeOutlined sx={{ fontSize: 18 }} />
              {aiConfidence ? `${Math.round(aiConfidence)}%` : 'N/A'}
            </div>
            <span className="match-label">AI Match Score</span>
            {enrichmentScores && Object.keys(enrichmentScores).length > 0 && (
              <div className="enrichment-scores">
                {enrichmentScores.location_score && (
                  <span className="score-chip">Location: {Math.round(enrichmentScores.location_score)}%</span>
                )}
                {enrichmentScores.price_score && (
                  <span className="score-chip">Price: {Math.round(enrichmentScores.price_score)}%</span>
                )}
                {enrichmentScores.amenity_score && (
                  <span className="score-chip">Amenities: {Math.round(enrichmentScores.amenity_score)}%</span>
                )}
              </div>
            )}
          </div>
          <h3 className="property-title">{galleryCardData.title}</h3>
          <div className="property-address">
            <LocationOnOutlined sx={{ fontSize: 14, marginRight: 0.5 }} />
            {galleryCardData.address}
          </div>
          <IconButton 
            className="save-button"
            onClick={handleSaveToggle}
            disabled={isSaving}
          >
            {isSaved ? <Bookmark sx={{ color: 'white' }} /> : <BookmarkBorder sx={{ color: 'white' }} />}
          </IconButton>
        </div>

        {/* Card Body */}
        <div className="card-body">
          {/* Property Images Gallery */}
          <div className="property-image-gallery">
            {!expandedView ? (
              <div className="property-image">
                <img 
                  src={
                    galleryCardData.images?.[0] 
                      ? (typeof galleryCardData.images[0] === 'string' 
                          ? galleryCardData.images[0] 
                          : galleryCardData.images[0]?.image_url || '/placeholder-property.jpg')
                      : '/placeholder-property.jpg'
                  } 
                  alt={galleryCardData.title}
                  onClick={handleToggleView}
                  style={{ cursor: 'pointer' }}
                />
                {galleryCardData.images?.length > 1 && (
                  <div className="image-count" onClick={handleToggleView} style={{ cursor: 'pointer' }}>
                    <PhotoCameraOutlined sx={{ fontSize: 14 }} />
                    {galleryCardData.images.length} photos
                  </div>
                )}
              </div>
            ) : (
              <div className="image-grid">
                {galleryCardData.images?.map((image, index) => (
                  <img
                    key={index}
                    src={typeof image === 'string' ? image : image?.image_url || '/placeholder-property.jpg'}
                    alt={`${galleryCardData.title} - Image ${index + 1}`}
                    className="grid-image"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Property Details */}
          <div className="property-details">
            {/* Price */}
            <div className="price-section">
              <span className="price">{galleryCardData.currency} {formatPrice(galleryCardData.price)}</span>
              <span className="price-unit">/ month</span>
            </div>

            {/* Key Features */}
            <div className="key-features">
              {galleryCardData.rooms && (
                <div className="feature-chip">
                  <BedOutlined className="feature-icon" />
                  {galleryCardData.rooms} rooms
                </div>
              )}
              {galleryCardData.bathrooms && (
                <div className="feature-chip">
                  <BathroomOutlined className="feature-icon" />
                  {galleryCardData.bathrooms} bath
                </div>
              )}
              {galleryCardData.area && (
                <div className="feature-chip">
                  <SquareFootOutlined className="feature-icon" />
                  {galleryCardData.area} m²
                </div>
              )}
              {galleryCardData.floor && (
                <div className="feature-chip">
                  Floor {galleryCardData.floor}
                </div>
              )}
            </div>

            {/* AI Explanation */}
            {aiExplanation && (
              <div className="ai-explanation">
                <div className="explanation-title">
                  <AutoAwesomeOutlined sx={{ fontSize: 14 }} />
                  Why HomeAI recommends this
                </div>
                <div className="explanation-text">
                  {aiExplanation}
                </div>
              </div>
            )}

            {/* Additional Property Info */}
            <div className="property-info">
              <div className="info-item">
                <span className="info-label">Type</span>
                <span className="info-value">{galleryCardData.property_type || 'Apartment'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Available from</span>
                <span className="info-value">
                  <CalendarTodayOutlined sx={{ fontSize: 12, marginRight: 0.5 }} />
                  {galleryCardData.availability_date 
                    ? new Date(galleryCardData.availability_date).toLocaleDateString('en-GB')
                    : 'Immediately'}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Utilities</span>
                <span className="info-value">{galleryCardData.utilities || 'Included'}</span>
              </div>
              {galleryCardData.taxes && (
                <div className="info-item">
                  <span className="info-label">Taxes</span>
                  <span className="info-value">
                    <AttachMoneyOutlined sx={{ fontSize: 12, marginRight: 0.5 }} />
                    CHF {galleryCardData.taxes}/year
                  </span>
                </div>
              )}
            </div>

            {/* Environmental & Location Metadata */}
            <div className="metadata-section">
              <h4 className="metadata-title">Environment & Location</h4>
              <div className="metadata-grid">
                <div className="metadata-item">
                  <AirOutlined sx={{ fontSize: 16, color: '#4caf50' }} />
                  <span>Air Quality: {galleryCardData.air_quality || 'Good'}</span>
                </div>
                <div className="metadata-item">
                  <VolumeUpOutlined sx={{ fontSize: 16, color: '#ff9800' }} />
                  <span>Noise Level: {galleryCardData.noise_level || 'Moderate'}</span>
                </div>
                <div className="metadata-item">
                  <DirectionsTransitOutlined sx={{ fontSize: 16, color: '#2196f3' }} />
                  <span>Public Transport: {galleryCardData.commute_times?.public_transport || '10-15'} min</span>
                </div>
                <div className="metadata-item">
                  <DirectionsCarOutlined sx={{ fontSize: 16, color: '#673ab7' }} />
                  <span>Parking: {galleryCardData.parking ? 'Available' : 'Street parking'}</span>
                </div>
              </div>
            </div>

            {/* Nearby Facilities */}
            <div className="metadata-section">
              <h4 className="metadata-title">Nearby Facilities</h4>
              <div className="metadata-grid">
                <div className="metadata-item">
                  <SchoolOutlined sx={{ fontSize: 16, color: '#9c27b0' }} />
                  <span>Schools: {galleryCardData.nearby_schools || 'Within 1km'}</span>
                </div>
                <div className="metadata-item">
                  <LocalHospitalOutlined sx={{ fontSize: 16, color: '#f44336' }} />
                  <span>Healthcare: {galleryCardData.nearby_hospitals || '< 2km'}</span>
                </div>
                <div className="metadata-item">
                  <ShoppingCartOutlined sx={{ fontSize: 16, color: '#00bcd4' }} />
                  <span>Shopping: {galleryCardData.nearby_shopping || '500m'}</span>
                </div>
                <div className="metadata-item">
                  <DirectionsTransitOutlined sx={{ fontSize: 16, color: '#4caf50' }} />
                  <span>Transit Stop: {galleryCardData.transit_stop || '< 300m'}</span>
                </div>
              </div>
            </div>

            {/* Amenities */}
            {galleryCardData.amenities && galleryCardData.amenities.length > 0 && (
              <div className="metadata-section">
                <h4 className="metadata-title">Amenities</h4>
                <div className="amenities-list">
                  {galleryCardData.parking && (
                    <Chip icon={<LocalParkingOutlined />} label="Parking" size="small" />
                  )}
                  {galleryCardData.elevator && (
                    <Chip icon={<ElevatorOutlined />} label="Elevator" size="small" />
                  )}
                  {galleryCardData.balcony && (
                    <Chip icon={<BalconyOutlined />} label="Balcony" size="small" />
                  )}
                  {galleryCardData.laundry && (
                    <Chip icon={<LocalLaundryServiceOutlined />} label="Laundry" size="small" />
                  )}
                  {galleryCardData.pet_friendly && (
                    <Chip icon={<PetsOutlined />} label="Pet Friendly" size="small" color="success" />
                  )}
                  {galleryCardData.furnished && (
                    <Chip label="Furnished" size="small" color="primary" />
                  )}
                  {galleryCardData.internet_speed && (
                    <Chip icon={<WifiOutlined />} label={`${galleryCardData.internet_speed} Mbps`} size="small" />
                  )}
                  {galleryCardData.amenities.map((amenity, idx) => (
                    typeof amenity === 'string' && 
                    <Chip key={idx} label={amenity} size="small" variant="outlined" />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Card Footer */}
        <div className="card-footer">
          <div className="action-buttons">
            {galleryCardData.external_url && (
              <Button 
                variant="contained" 
                size="small" 
                onClick={() => {
                  const sourceUrl = galleryCardData.external_url || galleryCardData.property_url || recommendation.external_url;
                  if (sourceUrl) {
                    window.open(sourceUrl, '_blank', 'noopener,noreferrer');
                  }
                }}
                startIcon={<OpenInNewOutlined />}
                sx={{ textTransform: 'none' }}
              >
                View on Source Portal
              </Button>
            )}
            <Button 
              variant="outlined" 
              size="small" 
              onClick={() => handleFeedbackClick(recommendation)}
              sx={{ textTransform: 'none' }}
            >
              Give Feedback
            </Button>
          </div>
          <div className={`availability ${galleryCardData.is_available ? 'available' : ''}`}>
            {galleryCardData.is_available ? '✓ Available Now' : 'Check Availability'}
          </div>
        </div>
      </div>


      <PropertyFeedbackModal
        open={feedbackModalOpen}
        onClose={handleCloseFeedback}
        property={recommendation}
        onSubmitFeedback={handleSubmitFeedback}
      />
    </>
  );
};

RecommendationCard.propTypes = {
  recommendation: PropTypes.object.isRequired,
  isEnriched: PropTypes.bool,
  conversationId: PropTypes.number,
  conversationProfileId: PropTypes.number
};

export { RecommendationCard };
