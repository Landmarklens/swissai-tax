import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import './SearchProperties.scss';
import { Box, Typography, useMediaQuery } from '@mui/material';
import { theme } from '../../../../theme/theme';
import { useTranslation } from 'react-i18next';
import CheckIcon from '@mui/icons-material/Check';
import PropTypes from 'prop-types';

export const searchProperties = [
  'General Preferences',
  'Location Preferences',
  'Type of Property',
  'Budget',
  'Space and Layout',
  'Lifestyle and Amenities',
  'Personal and Family',
  'Property Features',
  'Additional Considerations',
  'Timing and Deadlines',
  'Flexibility and Prioritization',
  'Feedback and Follow-Up'
];

const SearchProperties = ({ onStepClick, isCollapsed }) => {
  const { t } = useTranslation();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const insights = useSelector((state) => state.conversations.activeConversationProfile?.insights || []);

  const completedSteps = useMemo(() => {
    if (!Array.isArray(insights)) {
      return [];
    }
    return insights.map((insight) => insight.step).filter(Boolean);
  }, [insights]);

  const activeStep = useSelector(
    (state) => state.conversations.activeConversationProfile?.active_step
  );

  const handleStepClick = (property) => {
    if (onStepClick) {
      onStepClick(property);
    }
  };

  if (isCollapsed) {
    return (
      <Box sx={{ pt: 1 }}>
        <ul className="steps-list">
          {searchProperties.map((property, index) => {
            const isCompleted = completedSteps?.includes(property);
            const isActive = activeStep === property;
            return (
              <li
                key={property}
                onClick={() => handleStepClick(property)}
                style={{ cursor: 'pointer' }}>
                <div>
                  <p className={isCompleted || isActive ? 'active-step' : undefined}>
                    {isCompleted ? <CheckIcon /> : index + 1}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </Box>
    );
  }

  return (
    <Box sx={{ pt: 1 }}>
      <Typography
        sx={{
          pb: 2,
          px: 1,
          color: '#374151',
          fontWeight: 500,
          fontSize: isMobile ? '16px' : '14px'
        }}>
        {t('Search Property')}
      </Typography>

      <ul className="steps-list">
        {searchProperties.map((property, index) => {
          const isCompleted = completedSteps?.includes(property);
          const isActive = activeStep === property;
          return (
            <li
              key={property}
              onClick={() => handleStepClick(property)}
              style={{ cursor: 'pointer' }}>
              <div>
                <p className={isCompleted || isActive ? 'active-step' : undefined}>
                  {isCompleted ? <CheckIcon /> : index + 1}
                </p>
                <span>{property}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </Box>
  );
};
export default SearchProperties;

SearchProperties.propTypes = {
  activeTab: PropTypes.string,
  onStepClick: PropTypes.func,
  isCollapsed: PropTypes.bool
};
