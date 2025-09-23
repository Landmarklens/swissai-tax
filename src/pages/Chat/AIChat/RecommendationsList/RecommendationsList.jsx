import { RecommendationCard } from './RecommendationCard/RecommendationCard';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { setVisibleClientOverview } from '../../../../store/slices/conversationsSlice';
import { theme } from '../../../../theme/theme';
import './RecommendationsList.scss';
import PropTypes from 'prop-types';

const RecommendationsList = ({ recommendations, isEnriched = false, conversationId, conversationProfileId, dealTypeFilter = null }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const isGenerating = useSelector((state) => state.recommendations.isGenerating);
  
  // Filter recommendations by deal_type if filter is provided
  let filteredRecommendations = dealTypeFilter && Array.isArray(recommendations) 
    ? recommendations.filter(rec => {
        const dealType = rec?.deal_type || rec?.property?.deal_type || 'rent';
        return dealType === dealTypeFilter;
      })
    : recommendations;
  
  // Sort by AI confidence/match score (highest first)
  if (Array.isArray(filteredRecommendations)) {
    filteredRecommendations = [...filteredRecommendations].sort((a, b) => {
      const scoreA = a.ai_confidence || a.confidence || a.property?.ai_confidence || 0;
      const scoreB = b.ai_confidence || b.confidence || b.property?.ai_confidence || 0;
      return scoreB - scoreA;
    });
  }
  
  const isValidRecommendations = Array.isArray(filteredRecommendations) && filteredRecommendations.length > 0;
  
  console.log('[RecommendationsList] Component rendered:', {
    hasRecommendations: !!recommendations,
    isArray: Array.isArray(recommendations),
    originalCount: recommendations?.length || 0,
    filteredCount: filteredRecommendations?.length || 0,
    dealTypeFilter,
    isGenerating,
    isValidRecommendations,
    isEnriched,
    conversationId,
    conversationProfileId,
    firstItem: filteredRecommendations?.[0]
  });

  const outerBox = {
    display: 'flex',
    flexDirection: 'column',
    p: 2,
    mb: 3,
    boxShadow: 'none',
    backgroundColor: theme.palette.background.skyBlue,
    border: `1.5px solid ${theme.palette.border.blue}`,
    rowGap: 1,
    borderRadius: '10px'
  };

  const emptyStateBox = {
    ...outerBox,
    alignItems: 'center',
    textAlign: 'center',
    py: 4
  };

  // Show loading state
  if (isGenerating) {
    console.log('[RecommendationsList] Showing loading state');
    return (
      <Box sx={emptyStateBox}>
        <CircularProgress sx={{ mb: 2 }} />
        <Typography sx={{ fontSize: '16px', color: 'black', fontWeight: 500 }}>
          {t('Finding properties that match your criteria...')}
        </Typography>
      </Box>
    );
  }

  // Show empty state
  if (!isValidRecommendations) {
    console.log('[RecommendationsList] Showing empty state - no valid recommendations');
    return (
      <Box sx={emptyStateBox}>
        <Typography sx={{ fontSize: '18px', color: 'black', fontWeight: 600, mb: 1 }}>
          {t('No properties found')}
        </Typography>
        <Typography sx={{ fontSize: '14px', color: theme.palette.text.secondary, mb: 3 }}>
          {t('We couldn\'t find any properties matching your criteria. Try adjusting your preferences or search filters.')}
        </Typography>
        <Button
          variant="contained"
          onClick={() => dispatch(setVisibleClientOverview(true))}
          sx={{
            textTransform: 'none',
            backgroundColor: theme.palette.primary.main,
            '&:hover': {
              backgroundColor: theme.palette.primary.dark,
            }
          }}
        >
          {t('Update Preferences')}
        </Button>
      </Box>
    );
  }

  console.log('[RecommendationsList] Rendering recommendations list with', filteredRecommendations.length, 'items');
  
  return (
    <Box sx={outerBox}>
      <Typography sx={{ fontSize: '16px', color: 'black', fontWeight: 500 }} gutterBottom>
        {t('Property Recommendations')}
      </Typography>
      <div className="recommendations">
        {filteredRecommendations?.map((recommendation, i) => {
          console.log(`[RecommendationsList] Rendering item ${i}:`, recommendation?.id, recommendation?.title, 'deal_type:', recommendation?.deal_type || recommendation?.property?.deal_type);
          return (
            <RecommendationCard 
              key={recommendation.id || recommendation.property?.id || i} 
              recommendation={recommendation} 
              isEnriched={isEnriched}
              conversationId={conversationId}
              conversationProfileId={conversationProfileId}
            />
          );
        })}
      </div>
    </Box>
  );
};

export { RecommendationsList };

RecommendationsList.propTypes = {
  recommendations: PropTypes.array,
  isEnriched: PropTypes.bool,
  conversationId: PropTypes.number,
  conversationProfileId: PropTypes.number,
  dealTypeFilter: PropTypes.oneOf(['rent', 'buy', null])
};
