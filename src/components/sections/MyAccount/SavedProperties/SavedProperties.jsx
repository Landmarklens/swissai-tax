import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, CircularProgress, Alert } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { getSavedEnrichedRecommendations } from '../../../../api/recommendationsV2';
import { RecommendationCard } from '../../../../pages/Chat/AIChat/RecommendationsList/RecommendationCard/RecommendationCard';
import authService from '../../../../services/authService';

const SavedProperties = () => {
  const { t } = useTranslation();
  const [savedProperties, setSavedProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [conversationProfileId, setConversationProfileId] = useState(null);

  useEffect(() => {
    // Get conversation profile ID from user data or make an API call to fetch it
    const fetchSavedProperties = async () => {
      try {
        setLoading(true);
        const user = authService.getCurrentUser();
        
        // Get conversation profiles from Redux or API
        // For now, we'll use a try-catch to handle missing profile gracefully
        try {
          // Try to get the first conversation profile or create one
          const profileId = user?.conversation_profile_id || localStorage.getItem('activeConversationId');
          
          if (profileId) {
            setConversationProfileId(profileId);
            const response = await getSavedEnrichedRecommendations(profileId);
            // Ensure we have an array - handle both array and object responses
            const properties = Array.isArray(response) ? response : 
                             (response?.data && Array.isArray(response.data)) ? response.data :
                             (response?.properties && Array.isArray(response.properties)) ? response.properties :
                             [];
            setSavedProperties(properties);
          } else {
            // No active conversation profile yet
            setSavedProperties([]);
          }
        } catch (apiError) {
          console.log('No conversation profile found or error loading properties:', apiError);
          setSavedProperties([]);
        }
      } catch (err) {
        setError('Failed to load saved properties');
        console.error('Error loading saved properties:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSavedProperties();
  }, []);

  const handlePropertyUnsaved = (propertyId) => {
    // Remove the property from the list when it's unsaved
    setSavedProperties(prev => prev.filter(prop => 
      (prop.property?.id || prop.id) !== propertyId
    ));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (savedProperties.length === 0) {
    return (
      <Box p={3} textAlign="center">
        <Typography variant="h6" color="textSecondary">
          {t('No saved properties yet')}
        </Typography>
        <Typography variant="body2" color="textSecondary" mt={1}>
          {t('Properties you save will appear here')}
        </Typography>
      </Box>
    );
  }

  // Ensure savedProperties is always an array before rendering
  const propertiesArray = Array.isArray(savedProperties) ? savedProperties : [];
  
  return (
    <Box p={3}>
      <Typography variant="h5" fontWeight="bold" mb={3}>
        {t('Saved Properties')} ({propertiesArray.length})
      </Typography>
      
      <Grid container spacing={3}>
        {propertiesArray.map((property, index) => (
          <Grid item xs={12} sm={6} md={4} key={property.id || property.property?.id || index}>
            <RecommendationCard
              recommendation={{ ...property, isSaved: true }}
              isEnriched={true}
              conversationId={property.conversation_id}
              conversationProfileId={conversationProfileId}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default SavedProperties;