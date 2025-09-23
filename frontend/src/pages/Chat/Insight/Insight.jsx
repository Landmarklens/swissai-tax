import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { capitalizeFirstLetter } from '../../../utils/capitalizeFirstLetter';
import { CalendarBlank } from '../../../assets/svg/CalendarBlank';
import IconButton from '@mui/material/IconButton';
import { getInsightTimeline } from '../../../store/slices/conversationsSlice';
import InsightTimelineModal from './InsightTimelineModal';
import InsightItem from './InsightItem';
import { ConversationProgress } from '../AIChat/ConversationProgress/ConversationProgress';

import './Insight.scss';

const PRIORITY_LABELS = [
  { key: 'MUST', label: 'Must' },
  { key: 'IMPORTANT', label: 'Important' },
  { key: 'NICE-TO-HAVE', label: 'Nice-to-have' }
];

const Insight = ({ tempInsights, chatMode = 'chat' }) => {
  const [timelineOpen, setTimelineOpen] = useState(false);
  const dispatch = useDispatch();

  // Use temporary insights if available (from quick form), otherwise use saved insights
  const savedInsights = useSelector(
    (state) => state.conversations.activeConversationProfile?.insights || []
  );

  const insights = tempInsights && tempInsights.length > 0 ? tempInsights : savedInsights;
  const conversationProfileId = useSelector((state) => state.conversations.activeConversationId);

  // Debug logging
  console.log('🎯 Insight component rendering:', {
    tempInsights,
    savedInsights,
    finalInsights: insights,
    conversationProfileId,
    chatMode
  });

  // Get profile completion data from Redux
  const completionPercentage = useSelector(
    (state) => state.conversations.activeConversationProfile?.completionPercentage || 0
  );
  const profileCompleted = useSelector(
    (state) => state.conversations.activeConversationProfile?.profileCompleted || false
  );

  const isValidInsights = Array.isArray(insights) && insights.length > 0;

  // Separate insights with and without priorities
  const generalInsights = isValidInsights
    ? insights.filter(insight => !insight.priority)
    : [];

  const prioritizedInsights = isValidInsights
    ? insights.filter(insight => insight.priority)
    : [];

  console.log('🎯 Insight grouping:', {
    totalInsights: insights.length,
    generalInsights: generalInsights.length,
    prioritizedInsights: prioritizedInsights.length,
    prioritizedDetails: prioritizedInsights.map(i => ({
      text: i.text,
      priority: i.priority,
      isLocal: i.isLocal
    }))
  });

  const grouped = prioritizedInsights.length > 0
    ? prioritizedInsights.reduce((acc, insight) => {
        const priority = insight.priority;
        if (!acc[priority]) acc[priority] = [];
        acc[priority].push(insight);
        return acc;
      }, {})
    : {};

  console.log('🎯 Grouped insights by priority:', grouped);

  const hasInsights = insights && insights.length > 0;

  const handleOpenTimeline = () => {
    setTimelineOpen(true);
    if (conversationProfileId) {
      dispatch(getInsightTimeline(conversationProfileId));
    }
  };

  const handleCloseTimeline = () => {
    setTimelineOpen(false);
  };

  return (
    <div className="insights-section">
      {/* Building Your Profile Progress - moved here above insights */}
      <ConversationProgress
        key={`${conversationProfileId}-${chatMode}`} // Force re-render on mode change
        progress={completionPercentage}
        profileCompleted={profileCompleted}
        mode={chatMode === 'quick-form' ? 'form' : 'conversation'}
        insights={insights}
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '34px',
          marginTop: '24px'
        }}>
        <h2 className="main-title">Insights</h2>
        <IconButton aria-label="insight history" onClick={handleOpenTimeline} size="small">
          <CalendarBlank fill="#8da4ef" />
        </IconButton>
      </div>
      {!hasInsights && (
        <div className="no-response">
          <div className="insight-icon">
            <svg
              fill="#8da4ef"
              width="12"
              height="12"
              className="insight-svg"
              viewBox="0 0 24 24"
              aria-hidden="true">
              <path d="m19 9 1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25z" />
            </svg>
          </div>
          <p className="no-insights-title">No insights</p>
          <p className="no-insights-description">
            Here I will show your priorities based on your answers to help you understand them
            better and find the perfect apartment.
          </p>
        </div>
      )}
      <div className="wrapperInsights">
        {/* Display general insights without priority labels */}
        {generalInsights.length > 0 && (
          <div className="insight-content" style={{ marginBottom: '20px' }}>
            {generalInsights.map((insight, idx) => (
              <InsightItem key={insight.text + idx} insight={insight} />
            ))}
          </div>
        )}
        
        {/* Display prioritized insights with priority labels */}
        {PRIORITY_LABELS.map(({ key, label }) =>
          grouped[key] && grouped[key].length > 0 ? (
            <div key={key} className="insight-group">
              <div className="insight-title">{capitalizeFirstLetter(label)}</div>
              <div className="insight-content">
                {grouped[key].map((insight, idx) => (
                  <InsightItem key={insight.text + idx} insight={insight} />
                ))}
              </div>
            </div>
          ) : null
        )}
      </div>
      <InsightTimelineModal open={timelineOpen} onClose={handleCloseTimeline} />
    </div>
  );
};

export default Insight;
