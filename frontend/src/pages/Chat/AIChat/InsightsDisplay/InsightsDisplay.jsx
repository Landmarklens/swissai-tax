import React from 'react';
import { useSelector } from 'react-redux';
import { Box, Typography, Chip, Paper, Grid, Divider } from '@mui/material';
import { useTranslation } from 'react-i18next';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import dayjs from 'dayjs';

const InsightsDisplay = () => {
  const { t } = useTranslation();
  const insights = useSelector((state) => state.conversations.activeConversationProfile?.insights);
  
  if (!insights || insights.length === 0) {
    return null;
  }

  // Group insights by step
  const groupedInsights = insights.reduce((acc, insight) => {
    const step = insight.step || 'Other';
    if (!acc[step]) {
      acc[step] = [];
    }
    acc[step].push(insight);
    return acc;
  }, {});

  // Map step names to icons and colors
  const stepConfig = {
    'Location Preferences': { 
      icon: <LocationOnIcon />, 
      color: '#1976d2',
      title: t('Location & Commute')
    },
    'Budget': { 
      icon: <AttachMoneyIcon />, 
      color: '#388e3c',
      title: t('Budget')
    },
    'Timing and Deadlines': { 
      icon: <CalendarTodayIcon />, 
      color: '#f57c00',
      title: t('Move-in Timeline')
    },
    'Lifestyle and Amenities': { 
      icon: <HomeWorkIcon />, 
      color: '#7b1fa2',
      title: t('Amenities')
    },
    'Additional Considerations': { 
      icon: <CheckCircleIcon />, 
      color: '#0288d1',
      title: t('Additional Preferences')
    }
  };

  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: 3, 
        mb: 3, 
        backgroundColor: '#f8f9fa',
        borderRadius: 2,
        border: '1px solid #e0e0e0'
      }}
    >
      <Typography 
        variant="h6" 
        sx={{ 
          mb: 2, 
          fontWeight: 600,
          color: '#202020',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
      >
        <CheckCircleIcon sx={{ color: '#4caf50' }} />
        {t('Your Search Preferences')}
      </Typography>
      
      <Typography 
        variant="body2" 
        sx={{ 
          mb: 3,
          color: '#666'
        }}
      >
        {t('These preferences are being used to find your perfect property match')}
      </Typography>

      <Grid container spacing={2}>
        {Object.entries(groupedInsights).map(([step, stepInsights]) => {
          const config = stepConfig[step] || { 
            icon: <CheckCircleIcon />, 
            color: '#757575',
            title: step 
          };
          
          return (
            <Grid item xs={12} md={6} key={step}>
              <Box
                sx={{
                  backgroundColor: '#ffffff',
                  borderRadius: 2,
                  p: 2,
                  height: '100%',
                  border: '1px solid #e8e8e8',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                  <Box
                    sx={{
                      backgroundColor: `${config.color}15`,
                      borderRadius: '8px',
                      p: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 1.5
                    }}
                  >
                    {React.cloneElement(config.icon, { 
                      sx: { color: config.color, fontSize: 20 } 
                    })}
                  </Box>
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      fontWeight: 600,
                      color: '#202020'
                    }}
                  >
                    {config.title}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {stepInsights.map((insight, index) => {
                    // Parse and format the insight text
                    let displayText = insight.text;
                    
                    // Format dates
                    if (step === 'Timing and Deadlines' && displayText.includes('move-in date')) {
                      const dateMatch = displayText.match(/is (.+)\./);
                      if (dateMatch) {
                        const date = dayjs(dateMatch[1]);
                        if (date.isValid()) {
                          displayText = `Move-in: ${date.format('MMM D, YYYY')}`;
                        }
                      }
                    }
                    
                    // Format location
                    if (displayText.includes('want to live in')) {
                      displayText = displayText.replace('I want to live in ', '📍 ');
                      displayText = displayText.replace('.', '');
                    }
                    
                    // Format commute time
                    if (displayText.includes('commute time')) {
                      displayText = displayText.replace('My preferred commute time is ', '⏱️ Max commute: ');
                      displayText = displayText.replace('.', '');
                    }
                    
                    // Format income
                    if (displayText.includes('monthly income')) {
                      displayText = displayText.replace('My monthly income is ', '💰 Budget: ');
                      displayText = displayText.replace('.', '/month');
                    }
                    
                    // Format amenities
                    if (step === 'Lifestyle and Amenities') {
                      if (displayText.includes('must have')) {
                        displayText = `✅ ${displayText.replace('I must have ', '').replace('.', '')}`;
                      } else if (displayText.includes('important')) {
                        displayText = `⭐ ${displayText.replace(' is important for me.', '')}`;
                      } else if (displayText.includes('nice to have')) {
                        displayText = `💭 ${displayText.replace('It would be nice to have ', '').replace('.', '')}`;
                      }
                    }
                    
                    return (
                      <Typography
                        key={index}
                        variant="body2"
                        sx={{
                          color: '#424242',
                          fontSize: '14px',
                          lineHeight: 1.6,
                          pl: 3.5
                        }}
                      >
                        {displayText}
                      </Typography>
                    );
                  })}
                </Box>
              </Box>
            </Grid>
          );
        })}
      </Grid>
    </Paper>
  );
};

export default InsightsDisplay;