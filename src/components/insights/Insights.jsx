import { Box, Typography, Button, useMediaQuery } from '@mui/material';
import React, { useRef, useState } from 'react';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { theme } from '../../theme/theme';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import CloseIcon from '@mui/icons-material/Close';

const buttonStyling = {
  width: '100%',
  backgroundColor: 'transparent',
  color: '#1C2024',
  border: `1px solid #0007149F`,
  height: '40px'
};

export const Insights = ({ insights, adjust, emptyInsights, title, icon, isShowInsights }) => {
  const { t } = useTranslation();
  const bottomRef = useRef(null);
  const [insightsData, setInsightsData] = useState(insights);
  const [deletedInsights, setDeletedInsights] = useState([]);

  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const navigate = useNavigate();
  const location = useLocation();

  function handleDeleteInsight(deleteInsightName) {
    setInsightsData((prev) =>
      prev
        .map((item) => ({
          ...item,
          insights: item.insights.filter((insight) => insight !== deleteInsightName)
        }))
        .filter((item) => item.insights.length > 0)
    );

    setDeletedInsights((prev) => [...prev, deleteInsightName]);
  }

  function mergeInsights(current, incoming, deleted) {
    const mergedMap = new Map();

    current.forEach(({ step, insights }) => {
      mergedMap.set(step, new Set(insights));
    });

    incoming.forEach(({ step, insights }) => {
      if (!mergedMap.has(step)) {
        mergedMap.set(step, new Set());
      }

      insights.forEach((insight) => {
        if (!deleted.includes(insight)) {
          mergedMap.get(step).add(insight);
        }
      });
    });

    const result = [];
    mergedMap.forEach((insightsSet, step) => {
      const insightsArray = Array.from(insightsSet);
      if (insightsArray.length > 0) {
        result.push({ step, insights: insightsArray });
      }
    });

    return result;
  }

  function toggleSearchResults() {
    const params = new URLSearchParams(location.search);

    if (params.has('searchResults')) {
      params.delete('searchResults');
      params.set('adjust', 'true');
    } else {
      params.set('searchResults', 'true');
    }

    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  }

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        pl: !isMobile ? 5 : 2,
        flexDirection: 'column',
        width: '100%'
      }}>
      <Box sx={{ pr: 0.5, pt: 3 }}>
        <Typography sx={{ pb: 2, color: 'black', fontWeight: 600 }}>{title}</Typography>
      </Box>

      {isShowInsights && insightsData && insightsData.length > 0 && !emptyInsights ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            width: '100%'
          }}>
          {insightsData.map((insightGroup, index) => (
            <Box key={index} sx={{ mb: 3 }}>
              <Typography sx={{ fontWeight: 500, color: 'black', mb: 1 }}>
                {t(insightGroup.step)}:
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1
                }}>
                {insightGroup.insights.map((item, itemIndex) => (
                  <Box
                    id="insightGroup.insights"
                    key={itemIndex}
                    sx={{
                      backgroundColor: theme.palette.background.lightBlue,
                      border: '1px solid #4f6ece',
                      borderRadius: '5px',
                      padding: '4px 8px',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2
                    }}>
                    <Typography color="#4f6ece" noWrap>
                      {t(item)}
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => handleDeleteInsight(t(item))}
                      sx={{
                        minWidth: '10px',
                        padding: 0
                      }}>
                      <CloseIcon
                        sx={{
                          width: 15,
                          height: 15
                        }}
                      />
                    </Button>
                  </Box>
                ))}
              </Box>
            </Box>
          ))}
          {adjust && (
            <Button
              onClick={() => toggleSearchResults()}
              fullWidth
              sx={{
                ...buttonStyling,
                lineHeight: 'normal'
              }}>
              {t('Adjust parameters')}
            </Button>
          )}
          <div ref={bottomRef} /> {/* Ref element for auto-scrolling */}
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            width: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center'
          }}>
          {icon || (
            <AutoAwesomeIcon
              sx={{
                backgroundColor: '#edf2fe',
                color: '#8da4ef',
                height: '30px',
                width: '30px',
                borderRadius: '100%',
                p: 1
              }}
            />
          )}
          <Typography
            sx={{
              fontWeight: 500,
              color: 'black',
              py: 1.5
            }}>
            {t('No insights')}
          </Typography>
          <Typography
            sx={{
              fontSize: '12px'
            }}>
            {t('insightsEmptyDescription')}
          </Typography>
        </Box>
      )}
    </Box>
  );
};
