import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Chip,
  Paper,
  LinearProgress
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import {
  createInsight,
  deleteInsight,
  sendConversationMessage,
  saveUserMessage,
  createNewConversationProfileThunk
} from '../../../../store/slices/conversationsSlice';
import HomeIcon from '@mui/icons-material/Home';
import ApartmentIcon from '@mui/icons-material/Apartment';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import KingBedIcon from '@mui/icons-material/KingBed';
import BathtubIcon from '@mui/icons-material/Bathtub';
import LocationOnIcon from '@mui/icons-material/LocationOn';

const EnhancedMultiFilterPanel = ({ onSendInitialMessage }) => {
  const dispatch = useDispatch();
  const activeConversationId = useSelector((state) => state.conversations.activeConversationId);
  const completionPercentage = useSelector(
    (state) => state.conversations.activeConversationProfile?.completionPercentage || 0
  );

  const [listingType, setListingType] = useState('rent');
  const [selectedFilters, setSelectedFilters] = useState({
    apartment: false,
    house: false,
    'not-sure': false
  });

  // Real-time update insights when user selects options
  const handleListingTypeChange = async (_, value) => {
    if (value !== null) {
      setListingType(value);
      // Create insight immediately if we have a conversation
      try {
        let conversationId = activeConversationId;
        if (!conversationId) {
          // Create a new conversation profile first
          const result = await dispatch(createNewConversationProfileThunk()).unwrap();
          conversationId = result?.payload?.id || result?.id;
        }

        if (conversationId) {
          dispatch(createInsight({
            conversation_profile_id: conversationId,
            text: `Looking to ${value}`,
            priority: 'MUST'
          }));
        }
      } catch (error) {
        console.error('Error creating insight:', error);
      }
    }
  };

  const handleFilterToggle = async (filterKey, filterLabel) => {
    const newState = !selectedFilters[filterKey];
    setSelectedFilters(prev => ({
      ...prev,
      [filterKey]: newState
    }));

    // Update insights in real-time
    try {
      let conversationId = activeConversationId;
      if (!conversationId) {
        // Create a new conversation profile first
        const result = await dispatch(createNewConversationProfileThunk()).unwrap();
        conversationId = result?.payload?.id || result?.id;
      }

      if (conversationId && newState) {
        dispatch(createInsight({
          conversation_profile_id: conversationId,
          text: filterLabel,
          priority: 'IMPORTANT'
        }));
      } else if (conversationId && !newState) {
        // Remove insight if unchecked (would need insight ID tracking)
        console.log('Would remove insight:', filterLabel);
      }
    } catch (error) {
      console.error('Error handling filter toggle:', error);
    }
  };

  const handleSendInitialMessage = () => {
    const selectedOptions = [];
    if (listingType) selectedOptions.push(`I want to ${listingType}`);
    if (selectedFilters.apartment) selectedOptions.push('looking for an apartment');
    if (selectedFilters.house) selectedOptions.push('looking for a house');
    if (selectedFilters['not-sure']) selectedOptions.push('not sure about the property type yet');

    const initialMessage = selectedOptions.length > 0
      ? `Hi! ${selectedOptions.join(', ')}.`
      : 'Hi! I\'m looking for a property.';

    if (onSendInitialMessage) {
      onSendInitialMessage(initialMessage);
    }
  };

  return (
    <Box sx={{ width: '100%', mb: 3 }}>
      {/* Profile Building Progress - Top */}
      <Paper
        sx={{
          p: 2,
          mb: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: 2
        }}
      >
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
          Building Your Profile
        </Typography>
        <LinearProgress
          variant="determinate"
          value={completionPercentage}
          sx={{
            height: 10,
            borderRadius: 5,
            backgroundColor: 'rgba(255,255,255,0.3)',
            '& .MuiLinearProgress-bar': {
              backgroundColor: 'white',
              borderRadius: 5
            }
          }}
        />
        <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
          {completionPercentage > 0
            ? `${completionPercentage}% complete • ~${12 - Math.floor(completionPercentage / 10)} minutes remaining`
            : 'Let\'s start by understanding your needs'}
        </Typography>
      </Paper>

      {/* Rent/Buy Toggle */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <ToggleButtonGroup
          value={listingType}
          exclusive
          onChange={handleListingTypeChange}
          sx={{
            '& .MuiToggleButton-root': {
              px: 4,
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 500,
              borderRadius: 2,
              textTransform: 'none',
              '&.Mui-selected': {
                backgroundColor: '#3e63dd',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#5a7fff'
                }
              }
            }
          }}
        >
          <ToggleButton value="rent">
            <AttachMoneyIcon sx={{ mr: 1 }} />
            Rent
          </ToggleButton>
          <ToggleButton value="buy">
            <HomeIcon sx={{ mr: 1 }} />
            Buy
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Property Type Buttons */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 3 }}>
        <Button
          variant={selectedFilters.apartment ? "contained" : "outlined"}
          onClick={() => handleFilterToggle('apartment', 'Apartment')}
          startIcon={<ApartmentIcon />}
          sx={{
            borderRadius: 2,
            px: 3,
            py: 1.2,
            textTransform: 'none',
            fontSize: '1rem',
            ...(selectedFilters.apartment && {
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              borderColor: 'transparent'
            })
          }}
        >
          Apartment
        </Button>
        <Button
          variant={selectedFilters.house ? "contained" : "outlined"}
          onClick={() => handleFilterToggle('house', 'House')}
          startIcon={<HomeIcon />}
          sx={{
            borderRadius: 2,
            px: 3,
            py: 1.2,
            textTransform: 'none',
            fontSize: '1rem',
            ...(selectedFilters.house && {
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              borderColor: 'transparent'
            })
          }}
        >
          House
        </Button>
        <Button
          variant={selectedFilters['not-sure'] ? "contained" : "outlined"}
          onClick={() => handleFilterToggle('not-sure', 'Not sure yet')}
          sx={{
            borderRadius: 2,
            px: 3,
            py: 1.2,
            textTransform: 'none',
            fontSize: '1rem',
            ...(selectedFilters['not-sure'] && {
              background: 'linear-gradient(135deg, #9CA3AF, #D1D5DB)',
              borderColor: 'transparent'
            })
          }}
        >
          Not sure yet
        </Button>
      </Box>

      {/* Start Conversation Button */}
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleSendInitialMessage}
          sx={{
            background: 'linear-gradient(45deg, #3e63dd 30%, #5a7fff 90%)',
            color: 'white',
            borderRadius: 3,
            px: 4,
            py: 1.5,
            fontSize: '1.1rem',
            fontWeight: 600,
            textTransform: 'none',
            boxShadow: '0 3px 5px 2px rgba(62, 99, 221, .3)',
            transition: 'all 0.3s',
            '&:hover': {
              background: 'linear-gradient(45deg, #5a7fff 30%, #3e63dd 90%)',
              transform: 'translateY(-2px)',
              boxShadow: '0 5px 10px 2px rgba(62, 99, 221, .4)'
            }
          }}
        >
          Start Conversation
        </Button>
      </Box>
    </Box>
  );
};

export default EnhancedMultiFilterPanel;