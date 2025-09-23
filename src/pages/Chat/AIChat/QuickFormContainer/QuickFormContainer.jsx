import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { Typography, Box, Paper, List, ListItem, ListItemIcon, ListItemText, Avatar, Card, CardContent } from '@mui/material';
import {
  createNewConversationProfileThunk,
  createInsights,
  generateConversationName
} from '../../../../store/slices/conversationsSlice';
import { getRecommendationsByConversationId } from '../../../../store/slices/recomandationsSlice';
import { QuickFormCard } from '../QuickFormCard/QuickFormCard';
import { RecommendationsList } from '../RecommendationsList/RecommendationsList';
import LoadingModal from '../LoadingModal';
import {
  Speed as SpeedIcon,
  CheckCircle as CheckIcon,
  TipsAndUpdates as TipsIcon,
  Security as SecurityIcon,
  Home as HomeIcon,
  Timer as TimerIcon
} from '@mui/icons-material';
import './QuickFormContainer.scss';

export const QuickFormContainer = ({ onTempInsightsChange }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dealTypeFilter, setDealTypeFilter] = useState('rent'); // Track selected deal type
  const [tempInsights, setTempInsights] = useState([]); // Track temporary insights for display

  // Pass temporary insights up to parent
  useEffect(() => {
    if (onTempInsightsChange) {
      onTempInsightsChange(tempInsights);
    }
  }, [tempInsights, onTempInsightsChange]);

  const activeConversationId = useSelector((state) => state.conversations.activeConversationId);
  const conversationProfiles = useSelector((state) => state.conversations.conversationProfiles);
  const newRecommendations = useSelector((state) => state.recommendations.newRecommendations);
  const recommendationsLoading = useSelector((state) => state.recommendations.isGenerating);
  const quickFormSubmissionId = useSelector(
    (state) => state.conversations.activeConversationProfile?.quickFormSubmissionId
  );

  const hasConversationProfiles =
    Array.isArray(conversationProfiles) && conversationProfiles.length > 0;
  const hasRecommendations = Array.isArray(newRecommendations) && newRecommendations.length > 0;

  const handleQuickFormSubmit = async (payload) => {
    setIsSubmitting(true);
    
    // Update deal type filter from payload
    if (payload.dealType) {
      setDealTypeFilter(payload.dealType);
    }

    const insights = payload.insights || [];

    if (insights.length === 0) {
      toast.error(t('Please fill out at least one field.'));
      setIsSubmitting(false);
      return;
    }

    try {
      let conversationId = activeConversationId;

      // Create conversation profile if it doesn't exist
      if (!conversationId || !hasConversationProfiles) {
        const result = await dispatch(createNewConversationProfileThunk()).unwrap();
        conversationId = result?.payload?.id || result?.id;
      }

      let submissionId = null;
      
      try {
        const result = await dispatch(
          createInsights({
            insights,
            conversation_profile_id: conversationId,
            source_type: 'quick_form'
          })
        ).unwrap();
        
        submissionId = result && result.length > 0 ? result[0].quick_form_submission_id : null;
      } catch (insightError) {
        console.warn('Error creating insights, continuing with recommendations:', insightError);
        // Continue to try getting recommendations even if insights fail
      }

      await dispatch(
        getRecommendationsByConversationId({
          conversation_profile_id: conversationId,
          quick_form_submission_id: submissionId
        })
      );
      
      // Generate a meaningful name for the conversation based on the insights
      if (conversationId) {
        setTimeout(() => {
          dispatch(generateConversationName(conversationId))
            .then(result => {
              if (result.payload && result.payload.name) {
                console.log(`Generated name for quick form conversation ${conversationId}: ${result.payload.name}`);
              }
            })
            .catch(err => {
              console.log(`Name generation failed for quick form ${conversationId}`, err);
            });
        }, 1000); // Delay to ensure profile data is saved
      }
    } catch (error) {
      // Only show error if recommendations weren't generated
      console.error('QuickForm submission error:', error);
      if (!newRecommendations || newRecommendations.length === 0) {
        toast.error(t('Failed to submit preferences. Please try again.'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <LoadingModal open={recommendationsLoading || isSubmitting} />
      <div className="quick-form-container">
        {!hasRecommendations ? (
          <div className="quick-form-layout">
            {/* Form only - removed redundant left section */}
            <div className="form-section">
              <QuickFormCard
                onSubmit={handleQuickFormSubmit}
                isSubmitting={isSubmitting}
                onInsightsChange={setTempInsights}
              />
            </div>
          </div>
        ) : (
          /* Full width recommendations when available */
          <div className="recommendations-section">
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              {t('Property Recommendations')}
            </Typography>
            <RecommendationsList
              recommendations={newRecommendations}
              dealTypeFilter={dealTypeFilter}
            />
          </div>
        )}
      </div>
    </>
  );
};
